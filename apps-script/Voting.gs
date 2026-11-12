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

const VOTE_WEIGHTS_ = [0.30, 0.30, 0.25, 0.15];

/**
 * Preparação manual inicial. Cria abas e cabeçalhos sem apagar dados existentes.
 * Execute no editor do Apps Script. Não habilita a votação.
 */
function configurarAbasVotacao() {
  const ss = openConfiguredSpreadsheet_();
  Object.keys(VOTE_SHEETS_).forEach(key => {
    const spec = VOTE_SHEETS_[key];
    let sheet = ss.getSheetByName(spec.name);
    if (!sheet) sheet = ss.insertSheet(spec.name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]);
      sheet.setFrozenRows(1);
    } else {
      const actual = sheet.getRange(1, 1, 1, spec.headers.length).getDisplayValues()[0];
      if (spec.headers.some((header, i) => actual[i] !== header)) {
        throw new Error("Cabeçalho incompatível na aba " + spec.name + ". Nenhum dado foi alterado.");
      }
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
      const requestHash = sha256Hex_(input.idRequisicao);
      const codeHash = sha256Hex_(input.codigo);

      // Idempotência vinculada ao conteúdo: uma chave não pode ser reaproveitada
      // para outro código, projeto ou conjunto de notas.
      const voteRows = votes.getDataRange().getValues();
      for (let i = 1; i < voteRows.length; i++) {
        if (String(voteRows[i][0]) === requestHash) {
          const samePayload = String(voteRows[i][2]) === codeHash &&
            String(voteRows[i][3]) === input.idProjeto &&
            input.notas.every((note, index) => Number(voteRows[i][4 + index]) === note);
          if (!samePayload) throw new Error("Chave de requisição já utilizada com outros dados.");
          return { ok: true, repetida: true, recibo: String(voteRows[i][1]), nota: Number(voteRows[i][8]) };
        }
      }
      const codeRows = codes.getDataRange().getValues();
      const codeRow = codeRows.find((row, index) => index > 0 && String(row[0]) === codeHash);
      if (!codeRow || String(codeRow[1]).toLowerCase() !== "ativo") {
        throw new Error("Código inválido ou inativo.");
      }
      if (codeRow[2] && new Date(codeRow[2]).getTime() < Date.now()) {
        throw new Error("Código expirado.");
      }

      const projectRows = projects.getDataRange().getValues();
      const project = projectRows.find((row, index) => index > 0 && String(row[0]) === input.idProjeto);
      if (!project) throw new Error("Projeto não encontrado no cadastro.");

      // Regra do modelo B: um código pode votar em vários projetos, uma vez por projeto.
      for (let i = 1; i < voteRows.length; i++) {
        if (String(voteRows[i][2]) === codeHash && String(voteRows[i][3]) === input.idProjeto) {
          throw new Error("Este código já avaliou este projeto.");
        }
      }

      const score = calcularNotaPonderada_(input.notas);
      const receipt = "UIF-" + Utilities.getUuid().replace(/-/g, "").slice(0, 16).toUpperCase();
      const now = new Date();
      votes.appendRow([
        requestHash, receipt, codeHash, input.idProjeto,
        input.notas[0], input.notas[1], input.notas[2], input.notas[3],
        score, now
      ]);
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
  const projects = exigirAba_(ss, VOTE_SHEETS_.projects.name).getDataRange().getValues();
  const votes = exigirAba_(ss, VOTE_SHEETS_.votes.name).getDataRange().getValues();
  const totals = {};
  for (let i = 1; i < votes.length; i++) {
    const id = String(votes[i][3]);
    if (!totals[id]) totals[id] = { count: 0, sum: 0 };
    totals[id].count++;
    totals[id].sum += Number(votes[i][8]);
  }
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
