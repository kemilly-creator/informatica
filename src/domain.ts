export const CRITERIA = [
 {id:"criatividade",label:"Criatividade e inovação",weight:0.30},
 {id:"clareza",label:"Clareza da apresentação",weight:0.30},
 {id:"relevancia",label:"Relevância e impacto",weight:0.25},
 {id:"demonstracao",label:"Demonstração e resultados",weight:0.15},
] as const;
export type Scores=[number,number,number,number];
export function calculateWeightedScore(scores:Scores):number {
 if(!Array.isArray(scores)||scores.length!==4||scores.some(s=>!Number.isInteger(s)||s<1||s>5)) throw new Error("Informe quatro notas inteiras entre 1 e 5.");
 const total=scores.reduce((sum,score,index)=>sum+score*CRITERIA[index].weight,0);
 return Math.round((total+Number.EPSILON)*100)/100;
}
export function normalizeForSearch(value:string):string {
 return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
}