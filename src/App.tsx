import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { calculateWeightedScore, type Scores } from "./domain";
import { loadRanking, submitEvaluation, votingAvailable, type EvaluationPayload, type RankingEntry } from "./voting";
import catalog from "./data/universo_if_catalogo_46_projetos_v1.0.json";

type Area = "projetos" | "avaliar" | "ranking";
type Modality = "Todas" | "Mostra Nacional" | "Mostra de Extensão";
const tabs: { id: Area; label: string }[] = [
  { id: "projetos", label: "Projetos" },
  { id: "avaliar", label: "Avaliar" },
  { id: "ranking", label: "Ranking" },
];
const rankingModalities = ["Mostra Nacional", "Mostra de Extensão"] as const;
const formatScore = (score: number) => score.toFixed(2).replace(".", ",");

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
    .format(new Date(value + "T12:00:00Z"));

export default function App() {
  const [area, setArea] = useState<Area>("projetos");
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState<Modality>("Todas");
  const [day, setDay] = useState("Todos");
  const [theme, setTheme] = useState("Todas");
  const [selected, setSelected] = useState<string | null>(null);
  const [evaluationProject, setEvaluationProject] = useState("");
  const [scores, setScores] = useState<Scores>([0, 0, 0, 0]);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<{ recibo: string; nota: number } | null>(null);
  const [evaluationError, setEvaluationError] = useState("");
  const attempt = useRef<EvaluationPayload | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [rankingError, setRankingError] = useState(false);
  const [rankingReload, setRankingReload] = useState(0);
  const criteria = [
    { label: "Relevância e impacto", weight: 30, description: "Importância do tema e contribuição para a comunidade." },
    { label: "Criatividade e inovação", weight: 30, description: "Originalidade da proposta e soluções apresentadas." },
    { label: "Qualidade e domínio", weight: 25, description: "Clareza, organização e domínio do trabalho." },
    { label: "Apresentação", weight: 15, description: "Comunicação, clareza visual e interação." },
  ] as const;
  const weightedScore = scores.every((score) => score > 0) ? calculateWeightedScore(scores) : null;
  const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "");

  useEffect(() => {
    if (area !== "ranking" || !votingAvailable) return;
    let active = true;
    setRanking(null);
    setRankingError(false);
    loadRanking().then(
      (entries) => { if (active) setRanking(entries); },
      () => { if (active) setRankingError(true); },
    );
    return () => { active = false; };
  }, [area, rankingReload]);

  function clearFeedback() {
    setReceipt(null);
    setEvaluationError("");
  }

  function selectProject(id: string) {
    setEvaluationProject(id);
    setScores([0, 0, 0, 0]);
    clearFeedback();
  }

  async function handleEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!votingAvailable || sending || receipt || !evaluationProject || weightedScore === null ||
        normalizedCode.length < 8 || normalizedCode.length > 80) return;
    const previous = attempt.current;
    if (!previous || previous.codigo !== normalizedCode || previous.idProjeto !== evaluationProject ||
        scores.some((score, index) => score !== previous.notas[index])) {
      attempt.current = {
        codigo: normalizedCode,
        idProjeto: evaluationProject,
        notas: scores,
        idRequisicao: crypto.randomUUID(),
      };
    }
    setSending(true);
    setEvaluationError("");
    try {
      const result = await submitEvaluation(attempt.current!);
      if (result.ok) {
        setReceipt(result);
        attempt.current = null;
        setCode("");
      } else {
        setEvaluationError(result.erro);
      }
    } catch {
      setEvaluationError("Não foi possível confirmar o envio. Tente novamente para recuperar o recibo.");
    } finally {
      setSending(false);
    }
  }

  const themes = useMemo(
    () => Array.from(new Set(catalog.projetos.map((project) => project.area_tematica)))
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [],
  );
  const filtered = useMemo(
    () => catalog.projetos.filter((project) =>
      (modality === "Todas" || project.modalidade === modality) &&
      (day === "Todos" || project.data === day) &&
      (theme === "Todas" || project.area_tematica === theme) &&
      (!query || normalize(project.titulo + " " + project.area_tematica + " " + project.id).includes(normalize(query))),
    ),
    [query, modality, day, theme],
  );
  const project = catalog.projetos.find((item) => item.id === selected);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => { setArea("projetos"); setSelected(null); }} aria-label="Universo IF Avalia, início">
          <span className="brand-mark" aria-hidden="true">IF</span>
          <span><strong>Universo IF</strong><small>AVALIA · 2026.2</small></span>
        </a>
        <span className="prototype-label">PROTÓTIPO ACADÊMICO</span>
      </header>

      <section className="hero">
        <p className="eyebrow">PARTICIPAÇÃO POPULAR EDUCATIVA</p>
        <h1>Conheça. Avalie. Descubra.</h1>
        <p>Explore os trabalhos da Mostra Nacional e da Mostra de Extensão.</p>
        <div className="stats">
          <span><strong>46</strong> projetos</span>
          <span><strong>24</strong> Mostra Nacional</span>
          <span><strong>22</strong> Mostra de Extensão</span>
        </div>
      </section>

      <nav className="tabs" aria-label="Navegação principal">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" aria-current={area === tab.id ? "page" : undefined}
            className={area === tab.id ? "tab active" : "tab"}
            onClick={() => { setArea(tab.id); setSelected(null); }}>{tab.label}</button>
        ))}
      </nav>

      <section className="content" aria-live="polite">
        {area === "projetos" && (
          project ? (
            <>
              <button className="back" onClick={() => setSelected(null)}>← Voltar aos projetos</button>
              <article className="detail">
                <p className="eyebrow">{project.modalidade} · {project.id}</p>
                <h2>{project.titulo}</h2>
                <p>{project.area_tematica}</p>
                <dl>
                  <div><dt>Data</dt><dd>{dateLabel(project.data)}</dd></div>
                  <div><dt>Horário</dt><dd>{project.inicio}–{project.fim}</dd></div>
                  <div><dt>Formato</dt><dd>{project.formato}</dd></div>
                  <div><dt>Local</dt><dd>{project.local}</dd></div>
                </dl>
                <p className="muted">Informações transcritas da programação. Não foram acrescentados autores ou resumos não disponibilizados.</p>
                <button className="primary" onClick={() => { if (!sending) selectProject(project.id); setArea("avaliar"); }}>Avaliar este projeto</button>
              </article>
            </>
          ) : (
            <>
              <div className="section-heading">
                <div><p className="eyebrow">CATÁLOGO OFICIAL TRANSCRITO</p><h2>Projetos</h2></div>
                <span className="count">{filtered.length} de 46</span>
              </div>
              <div className="filters">
                <label>Buscar projeto
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Título, área ou código..." />
                </label>
                <label>Modalidade
                  <select value={modality} onChange={(event) => setModality(event.target.value as Modality)}>
                    <option>Todas</option><option>Mostra Nacional</option><option>Mostra de Extensão</option>
                  </select>
                </label>
                <label>Dia
                  <select value={day} onChange={(event) => setDay(event.target.value)}>
                    <option>Todos</option><option value="2026-11-17">17/11/2026</option><option value="2026-11-18">18/11/2026</option>
                  </select>
                </label>
                <label>Área temática
                  <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                    <option>Todas</option>{themes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <div className="project-grid">
                {filtered.map((item) => (
                  <button className="project-card" key={item.id} onClick={() => setSelected(item.id)}>
                    <span className="card-meta">{item.modalidade} · {item.id}</span>
                    <strong>{item.titulo}</strong>
                    <span>{item.area_tematica}</span>
                    <span className="card-footer">{dateLabel(item.data)} · {item.inicio}–{item.fim}<b>Ver detalhes →</b></span>
                  </button>
                ))}
              </div>
              {filtered.length === 0 && <div className="notice">Nenhum projeto encontrado. Ajuste os filtros ou a busca.</div>}
            </>
          )
        )}
        {area === "avaliar" && (
          <>

            <h2>Avaliar um projeto</h2>
            <p className="muted">Atribua notas de 1 a 5 em cada critério. A prévia usa os pesos publicados no projeto.</p>
            <form className="evaluation-panel" onSubmit={handleEvaluation}>
              <label className="project-picker">Projeto
                <select value={evaluationProject} disabled={sending} onChange={(event) => selectProject(event.target.value)}>
                  <option value="">Selecione um projeto</option>
                  {catalog.projetos.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.titulo}</option>)}
                </select>
              </label>
              {criteria.map((criterion, index) => (
                <fieldset className="criterion" key={criterion.label} disabled={sending}>
                  <legend>{criterion.label} <span>{criterion.weight}%</span></legend>
                  <p>{criterion.description}</p>
                  <div className="score-options" role="group" aria-label={criterion.label + ", nota de 1 a 5"}>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button type="button" key={score} aria-pressed={scores[index] === score}
                        className={scores[index] === score ? "score-option selected" : "score-option"}
                        onClick={() => { setScores((current) => current.map((value, i) => i === index ? score : value) as Scores); clearFeedback(); }}>{score}</button>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div className="score-preview" aria-live="polite">
                <span>Nota ponderada de prévia</span>
                <strong>{weightedScore === null ? "—" : formatScore(weightedScore)}</strong>
                <small>{scores.filter((score) => score > 0).length} de 4 critérios preenchidos</small>
              </div>
              {votingAvailable ? (
                <div className="evaluation-submit">
                  <label className="project-picker">Código de votação
                    <input type="password" autoComplete="off" value={code} disabled={sending}
                      onChange={(event) => { setCode(event.target.value); clearFeedback(); }} />
                  </label>
                  <button className="primary" type="submit" disabled={sending || !!receipt || !evaluationProject ||
                    weightedScore === null || normalizedCode.length < 8 || normalizedCode.length > 80}>
                    {sending ? "Enviando…" : "Enviar avaliação"}
                  </button>
                  {evaluationError && <p role="alert">{evaluationError}</p>}
                  {receipt && <div className="notice evaluation-warning" role="status">
                    <strong>Avaliação registrada</strong>
                    <span>Recibo {receipt.recibo}</span>
                    <span>Nota confirmada {formatScore(receipt.nota)}</span>
                  </div>}
                </div>
              ) : <p className="notice">Abra a versão do Apps Script para enviar uma avaliação.</p>}
            </form>
          </>
        )}
        {area === "ranking" && (
          <>
            <h2>Ranking educativo</h2>
            <p>Cada projeto entra no ranking da sua modalidade após cinco avaliações válidas.</p>
            {!votingAvailable && <p className="notice">Abra a versão do Apps Script para consultar o ranking.</p>}
            {votingAvailable && !ranking && !rankingError && <p role="status">Carregando ranking…</p>}
            {rankingError && <div className="notice">
              <p role="alert">Não foi possível carregar o ranking.</p>
              <button className="primary" onClick={() => setRankingReload((current) => current + 1)}>Tentar novamente</button>
            </div>}
            {ranking && rankingModalities.map((item) => {
              const entries = ranking.filter((entry) => entry.modalidade === item);
              return <section key={item} className="ranking-group">
                <h3>{item}</h3>
                {entries.length === 0 ? <p>Nenhum projeto atingiu o mínimo de cinco avaliações.</p> :
                  <ol>
                    {entries.map((entry) => <li key={entry.idProjeto}>
                      <strong>{entry.titulo}</strong>
                      <span>Média {formatScore(entry.media)} · {entry.quantidade} avaliações</span>
                    </li>)}
                  </ol>}
              </section>;
            })}
          </>
        )}
      </section>
      <footer>Universo IF Avalia · Atividade acadêmica independente. Não representa julgamento oficial do evento.</footer>
    </main>
  );
}
