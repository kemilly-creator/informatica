import { useState } from "react";
type Area = "projetos" | "avaliar" | "ranking";
const areas: { id: Area; label: string }[] = [{id:"projetos",label:"Projetos"},{id:"avaliar",label:"Avaliar"},{id:"ranking",label:"Ranking"}];
export default function App() {
 const [area,setArea]=useState<Area>("projetos");
 return <main className="app-shell">
  <header className="topbar"><a className="brand" href="#" aria-label="Universo IF Avalia, início"><span className="brand-mark" aria-hidden="true">IF</span><span><strong>Universo IF</strong><small>AVALIA · 2026.2</small></span></a><span className="prototype-label">PROTÓTIPO ACADÊMICO</span></header>
  <section className="hero"><p className="eyebrow">PARTICIPAÇÃO POPULAR EDUCATIVA</p><h1>Conheça. Avalie. Descubra.</h1><p>Explore os trabalhos da Mostra Nacional e da Mostra de Extensão.</p></section>
  <nav className="tabs" aria-label="Navegação principal">{areas.map(item=><button key={item.id} type="button" aria-current={area===item.id?"page":undefined} className={area===item.id?"tab active":"tab"} onClick={()=>setArea(item.id)}>{item.label}</button>)}</nav>
  <section className="content" aria-live="polite">
   {area==="projetos"&&<><h2>Projetos</h2><p>O catálogo oficial de 46 projetos será conectado nesta etapa.</p><div className="notice"><strong>Catálogo em preparação</strong><span>Os dados serão importados do arquivo versionado do kit, preservando títulos, horários e fontes. Nenhum projeto fictício é exibido.</span></div></>}
   {area==="avaliar"&&<><h2>Avaliar um projeto</h2><p>O formulário será habilitado depois da implementação e homologação do serviço de votação.</p><div className="notice"><strong>Avaliações ainda indisponíveis</strong><span>Este protótipo não recebe nem registra votos nesta versão estrutural.</span></div></>}
   {area==="ranking"&&<><h2>Ranking educativo</h2><p>Os resultados serão separados por modalidade e só terão colocação após a amostra mínima.</p><div className="notice"><strong>Sem resultados publicados</strong><span>O ranking depende de avaliações válidas e de agregação segura no servidor.</span></div></>}
  </section><footer>Universo IF Avalia · Atividade acadêmica independente. Não representa julgamento oficial do evento.</footer>
 </main>;
}