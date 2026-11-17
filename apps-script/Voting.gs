/**
 * Universo IF Avalia — núcleo de votação.
 *
 * Interface recomendada: HTML Service + google.script.run.
 * Não coloque API_TOKEN, hashes de códigos ou segredos no navegador.
 * A votação permanece desligada até VOTING_ENABLED=true nas propriedades.
 */

const VOTE_SHEETS_ = {
  projects: { name: "Projetos", headers: ["id_projeto", "titulo", "modalidade"] },
  codes: { name: "Codigos", headers: ["hash_codigo", "status", "validade"] },
  votes: { name: "Avaliacoes", headers: [
    "id_requisicao", "recibo", "hash_codigo", "id_projeto",
    "nota_relevancia", "nota_inovacao", "nota_qualidade",
    "nota_apresentacao", "nota_final", "criado_em"
  ] },
  config: { name: "Configuracao", headers: ["chave", "valor"] }
};

// Layout já utilizado pela planilha privada do Universo IF Avalia.
const VOTE_EXISTING_HEADERS_ = {
  projects: ["id", "titulo", "modalidade", "area_tematica", "data", "inicio", "fim", "formato", "local"],
  codes: ["hash_codigo", "habilitado", "criado_em"],
  votes: ["id_requisicao", "hash_codigo", "id_projeto", "nota_1", "nota_2",
    "nota_3", "nota_4", "nota_ponderada", "timestamp", "estado"]
};

const VOTE_WEIGHTS_ = [0.30, 0.30, 0.25, 0.15];

/**
 * Preparação manual inicial. Cria abas e cabeçalhos sem apagar dados existentes.
 * Execute no editor do Apps Script. Não habilita a votação.
 */
function configurarAbasVotacao() {
  const ss = openConfiguredSpreadsheet_();
  const keys = Object.keys(VOTE_SHEETS_);
  keys.forEach(key => {
    const sheet = ss.getSheetByName(VOTE_SHEETS_[key].name);
    if (sheet && sheet.getLastRow() > 0) usaLayoutExistente_(sheet, key);
  });
  keys.forEach(key => {
    const spec = VOTE_SHEETS_[key];
    const sheet = ss.getSheetByName(spec.name) || ss.insertSheet(spec.name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]);
      sheet.setFrozenRows(1);
    }
  });
  return { ok: true, message: "Abas verificadas/criadas. A votação continua desligada." };
}

/**
 * Gera o hash SHA-256 de um código. Use no editor para preparar lotes de códigos;
 * nunca armazene códigos em texto puro na planilha.
 */
function gerarHashCodigoVotacao(codigo) {
  const normalized = normalizarCodigo_(codigo);
  if (normalized.length < 8 || normalized.length > 80) {
    throw new Error("O código deve ter entre 8 e 80 caracteres.");
  }
  return sha256Hex_(normalized);
}

/**
 * Recebe avaliação via google.script.run.
 * payload: {codigo, idProjeto, notas:[1..5 x4], idRequisicao}
 */
function submitEvaluation(payload) {
  try {
    if (PropertiesService.getScriptProperties().getProperty("VOTING_ENABLED") !== "true") {
      throw new Error("Votação temporariamente indisponível.");
    }
    const input = validarPayloadVoto_(payload);
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const ss = openConfiguredSpreadsheet_();
      const votes = exigirAba_(ss, VOTE_SHEETS_.votes.name);
      const codes = exigirAba_(ss, VOTE_SHEETS_.codes.name);
      const projects = exigirAba_(ss, VOTE_SHEETS_.projects.name);
      const config = ss.getSheetByName(VOTE_SHEETS_.config.name);
      const status = config && config.getDataRange().getValues()
        .find(row => row[0] === "STATUS_VOTACAO");
      const existingVotes = usaLayoutExistente_(votes, "votes");
      const existingCodes = usaLayoutExistente_(codes, "codes");
      usaLayoutExistente_(projects, "projects");
      if ((status || existingVotes) && (!status || String(status[1]).trim().toUpperCase() !== "ABERTA")) {
        throw new Error("Votação temporariamente indisponível.");
      }
      const requestHash = sha256Hex_(input.idRequisicao);
      const codeHash = sha256Hex_(input.codigo);

      // Idempotência vinculada ao conteúdo: uma chave não pode ser reaproveitada
      // para outro código, projeto ou conjunto de notas.
      const voteRows = lerAvaliacoes_(votes, existingVotes);
      const previous = voteRows.find(vote => vote.requestHash === requestHash);
      if (previous) {
        const samePayload = previous.codeHash === codeHash && previous.projectId === input.idProjeto &&
          input.notas.every((note, index) => previous.notes[index] === note);
        if (!samePayload) throw new Error("Chave de requisição já utilizada com outros dados.");
        if (!previous.valid) throw new Error("Avaliação indisponível para esta requisição.");
        return { ok: true, repetida: true, recibo: previous.receipt, nota: previous.score };
      }

      const codeRows = codes.getDataRange().getValues();
      const codeRow = codeRows.find((row, index) => index > 0 && String(row[0]) === codeHash);
      const enabled = codeRow && (existingCodes
        ? codeRow[1] === true || String(codeRow[1]).trim().toUpperCase() === "TRUE"
        : String(codeRow[1]).toLowerCase() === "ativo");
      if (!enabled) throw new Error("Código inválido ou inativo.");
      if (!existingCodes && codeRow[2] && !(new Date(codeRow[2]).getTime() >= Date.now())) {
        throw new Error("Código expirado.");
      }

      const projectRows = projects.getDataRange().getValues();
      const project = projectRows.find((row, index) => index > 0 && String(row[0]) === input.idProjeto);
      if (!project) throw new Error("Projeto não encontrado no cadastro.");

      if (voteRows.some(vote => vote.valid && vote.codeHash === codeHash && vote.projectId === input.idProjeto)) {
        throw new Error("Este código já avaliou este projeto.");
      }

      const score = calcularNotaPonderada_(input.notas);
      const receipt = existingVotes
        ? reciboPorRequisicao_(requestHash)
        : "UIF-" + Utilities.getUuid().replace(/-/g, "").slice(0, 16).toUpperCase();
      const now = new Date();
      votes.appendRow(existingVotes
        ? [requestHash, codeHash, input.idProjeto, ...input.notas, score, now, "VALIDA"]
        : [requestHash, receipt, codeHash, input.idProjeto, ...input.notas, score, now]);
      SpreadsheetApp.flush();
      return { ok: true, repetida: false, recibo: receipt, idProjeto: input.idProjeto, nota: score, registradoEm: now.toISOString() };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    // Não registrar código, hash, payload ou conteúdo de planilha em logs.
    return { ok: false, erro: String(error && error.message ? error.message : "Falha ao registrar avaliação.") };
  }
}

/** Ranking agregado; projetos só aparecem após cinco avaliações válidas. */
function getPublicRanking() {
  const ss = openConfiguredSpreadsheet_();
  const projectSheet = exigirAba_(ss, VOTE_SHEETS_.projects.name);
  usaLayoutExistente_(projectSheet, "projects");
  const projects = projectSheet.getDataRange().getValues();
  const voteSheet = exigirAba_(ss, VOTE_SHEETS_.votes.name);
  const votes = lerAvaliacoes_(voteSheet, usaLayoutExistente_(voteSheet, "votes"));
  const totals = Object.create(null);
  votes.forEach(vote => {
    if (!vote.valid || !Number.isFinite(vote.score) || vote.score < 1 || vote.score > 5) return;
    const id = vote.projectId;
    if (!totals[id]) totals[id] = { count: 0, sum: 0 };
    totals[id].count++;
    totals[id].sum += vote.score;
  });
  return projects.slice(1).map(row => {
    const total = totals[String(row[0])] || { count: 0, sum: 0 };
    return {
      idProjeto: String(row[0]), titulo: String(row[1]), modalidade: String(row[2]),
      quantidade: total.count,
      media: total.count >= 5 ? Math.round((total.sum / total.count) * 100) / 100 : null,
      elegivel: total.count >= 5
    };
  }).filter(item => item.elegivel)
    .sort((a, b) => b.media - a.media || b.quantidade - a.quantidade || a.idProjeto.localeCompare(b.idProjeto));
}

function usaLayoutExistente_(sheet, key) {
  const spec = VOTE_SHEETS_[key];
  const existing = VOTE_EXISTING_HEADERS_[key];
  const width = Math.max(spec.headers.length, existing ? existing.length : 0);
  const actual = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  if (existing && existing.every((header, i) => actual[i] === header)) return true;
  if (spec.headers.every((header, i) => actual[i] === header)) return false;
  throw new Error("Cabeçalho incompatível na aba " + spec.name + ".");
}

function reciboPorRequisicao_(requestHash) {
  return "UIF-" + sha256Hex_("recibo:" + requestHash).slice(0, 16).toUpperCase();
}

function lerAvaliacoes_(sheet, existing) {
  const offset = existing ? 0 : 1;
  return sheet.getDataRange().getValues().slice(1).filter(row => row[0]).map(row => ({
    requestHash: String(row[0]),
    receipt: existing ? reciboPorRequisicao_(String(row[0])) : String(row[1]),
    codeHash: String(row[1 + offset]),
    projectId: String(row[2 + offset]),
    notes: row.slice(3 + offset, 7 + offset).map(Number),
    score: Number(row[7 + offset]),
    valid: !existing || String(row[9]).trim().toUpperCase() === "VALIDA"
  }));
}

function validarPayloadVoto_(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Dados da avaliação inválidos.");
  const codigo = normalizarCodigo_(payload.codigo);
  const idProjeto = String(payload.idProjeto || "").trim();
  const idRequisicao = String(payload.idRequisicao || "").trim();
  if (codigo.length < 8 || codigo.length > 80) throw new Error("Código inválido.");
  if (!/^(NAC|EXT)-\d{3}$/.test(idProjeto)) throw new Error("Identificador do projeto inválido.");
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(idRequisicao)) throw new Error("Identificador da requisição inválido.");
  if (!Array.isArray(payload.notas) || payload.notas.length !== 4 ||
      payload.notas.some(n => !Number.isInteger(n) || n < 1 || n > 5)) {
    throw new Error("Informe quatro notas inteiras entre 1 e 5.");
  }
  return { codigo: codigo, idProjeto: idProjeto, idRequisicao: idRequisicao, notas: payload.notas };
}

function calcularNotaPonderada_(scores) {
  if (!Array.isArray(scores) || scores.length !== 4 ||
      scores.some(n => !Number.isInteger(n) || n < 1 || n > 5)) {
    throw new Error("Quatro notas inteiras entre 1 e 5 são obrigatórias.");
  }
  return Math.round(scores.reduce((sum, value, index) => sum + value * VOTE_WEIGHTS_[index], 0) * 100) / 100;
}

function normalizarCodigo_(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}
function sha256Hex_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)
    .map(byte => ("0" + ((byte + 256) % 256).toString(16)).slice(-2)).join("");
}
function exigirAba_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("Execute configurarAbasVotacao antes de usar a votação.");
  return sheet;
}

/** Testes de domínio sem acessar ou modificar a planilha. */
function executarTestesDominioVotacao() {
  const sample = calcularNotaPonderada_([4, 5, 4, 3]);
  if (sample !== 4.15) throw new Error("Falha no cálculo ponderado: " + sample);
  let rejected = false;
  try { calcularNotaPonderada_([4, 5, 0, 3]); } catch (e) { rejected = true; }
  if (!rejected) throw new Error("Notas fora do intervalo deveriam ser rejeitadas.");
  const normalized = normalizarCodigo_(" abcd 1234 ");
  if (normalized !== "ABCD1234") throw new Error("Falha ao normalizar código.");
  return { ok: true, calculo: sample, validacaoNotas: "PASS", normalizacaoCodigo: "PASS" };
}
