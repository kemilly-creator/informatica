import {describe,expect,it} from "vitest";
import {calculateWeightedScore,normalizeForSearch} from "./domain";
describe("calculateWeightedScore",()=>{
 it("aplica pesos 30/30/25/15",()=>expect(calculateWeightedScore([4,5,4,3])).toBe(4.15));
 it("rejeita nota decimal",()=>expect(()=>calculateWeightedScore([4,4.5,4,3])).toThrow());
 it("rejeita nota fora da escala",()=>expect(()=>calculateWeightedScore([0,5,4,3])).toThrow());
});
describe("normalizeForSearch",()=>{
 it("ignora acentos e caixa",()=>expect(normalizeForSearch("Ciências Sociais")).toBe("ciencias sociais"));
});