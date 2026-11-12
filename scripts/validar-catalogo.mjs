import {readFile} from "node:fs/promises";
const path=new URL("../src/data/universo_if_catalogo_46_projetos_v1.0.json",import.meta.url);
const catalog=JSON.parse(await readFile(path,"utf8"));
const projects=catalog.projetos, required=["id","titulo","modalidade","area_tematica","data","inicio","fim","formato","local","fontes"];
const ids=projects.map(p=>p.id), duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
const missing=projects.flatMap(p=>required.filter(k=>!(k in p)).map(k=>p.id+":"+k));
const national=projects.filter(p=>p.modalidade==="Mostra Nacional").length;
const extension=projects.filter(p=>p.modalidade==="Mostra de Extensão").length;
const errors=[];
if(catalog.total!==46||projects.length!==46) errors.push("O catálogo deve conter 46 projetos.");
if(new Set(ids).size!==46||duplicates.length) errors.push("IDs duplicados ou quantidade incorreta.");
if(national!==24||extension!==22) errors.push("Modalidades devem conter 24 Nacional e 22 Extensão.");
if(missing.length) errors.push("Campos obrigatórios ausentes: "+missing.join(", "));
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("Catálogo válido: 46 projetos (24 Nacional + 22 Extensão), IDs únicos e campos obrigatórios presentes.");