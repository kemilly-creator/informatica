import { useMemo, useState } from "react";
import catalog from "./data/universo_if_catalogo_46_projetos_v1.0.json";

type Area = "projetos" | "avaliar" | "ranking";
type Modality = "Todas" | "Mostra Nacional" | "Mostra de Extensão";
const tabs: { id: Area; label: string }[] = [
  { id: "projetos", label: "Projetos" },
  { id: "avaliar", label: "Avaliar" },
  { id: "ranking", label: "Ranking" },
];
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
  const [scores, setScores] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const criteria = [
    { label: "Relevância e impacto", weight: 30, description: "Importância do tema e contribuição para a comunidade." },
    { label: "Criatividade e inovação", weight: 30, description: "Originalidade da proposta e soluções apresentadas." },
    { label: "Qualidade e domínio", weight: 25, description: "Clareza, organização e domínio do trabalho." },
    { label: "Apresentação", weight: 15, description: "Comunicação, clareza visual e interação." },
  ] as const;
  const weightedScore = scores.every((score) => score > 0)
    ? scores.reduce((total, score, index) => total + score * [0.3, 0.3, 0.25, 0.15][index], 0)
    : null;

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
                <button className="primary" onClick={() => { setEvaluationProject(project.id); setScores([0, 0, 0, 0]); setArea("avaliar"); }}>Avaliar este projeto</button>
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
            <p className="eyebrow">FORMULÁRIO DE AVALIAÇÃO · SIMULAÇÃO</p>
            <h2>Avaliar um projeto</h2>
            <p className="muted">Atribua notas de 1 a 5 em cada critério. A prévia usa os pesos publicados no projeto.</p>
            <div className="evaluation-panel">
              <label className="project-picker">Projeto
                <select value={evaluationProject} onChange={(event) => { setEvaluationProject(event.target.value); setScores([0, 0, 0, 0]); }}>
                  <option value="">Selecione um projeto</option>
                  {catalog.projetos.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.titulo}</option>)}
                </select>
              </label>
              {criteria.map((criterion, index) => (
                <fieldset className="criterion" key={criterion.label}>
                  <legend>{criterion.label} <span>{criterion.weight}%</span></legend>
                  <p>{criterion.description}</p>
                  <div className="score-options" role="group" aria-label={criterion.label + ", nota de 1 a 5"}>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button type="button" key={score} aria-pressed={scores[index] === score}
                        className={scores[index] === score ? "score-option selected" : "score-option"}
                        onClick={() => setScores((current) => current.map((value, i) => i === index ? score : value) as [number, number, number, number])}>{score}</button>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div className="score-preview" aria-live="polite">
                <span>Nota ponderada de prévia</span>
                <strong>{weightedScore === null ? "—" : weightedScore.toFixed(2).replace(".", ",")}</strong>
                <small>{scores.filter((score) => score > 0).length} de 4 critérios preenchidos</small>
              </div>
              <div className="notice evaluation-warning"><strong>Envio ainda desativado</strong><span>Esta tela apenas calcula uma prévia no navegador. Nenhuma avaliação é transmitida ou gravada. O envio será habilitado depois da integração e homologação do Apps Script, do código de votação e do recibo de confirmação.</span></div>
            </div>
          </>
        )}
        {area === "ranking" && (
          <><h2>Ranking educativo</h2><p>Os resultados serão separados por modalidade e só terão colocação após a amostra mínima de cinco avaliações válidas.</p>
            <div className="notice"><strong>Sem resultados publicados</strong><span>Não há votos reais registrados nesta versão.</span></div></>
        )}
      </section>
      <footer>Universo IF Avalia · Atividade acadêmica independente. Não representa julgamento oficial do evento.</footer>
    </main>
  );
}
