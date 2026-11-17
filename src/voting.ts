import type { Scores } from "./domain";

export type EvaluationPayload = {
  codigo: string;
  idProjeto: string;
  notas: Scores;
  idRequisicao: string;
};

export type EvaluationResult =
  | { ok: true; recibo: string; nota: number }
  | { ok: false; erro: string };

export type RankingEntry = {
  idProjeto: string;
  titulo: string;
  modalidade: string;
  quantidade: number;
  media: number;
};

type ScriptRunner = {
  withSuccessHandler(callback: (result: unknown) => void): ScriptRunner;
  withFailureHandler(callback: () => void): ScriptRunner;
  submitEvaluation(payload: EvaluationPayload): void;
  getPublicRanking(): void;
};

const runner = (window as Window & { google?: { script?: { run?: ScriptRunner } } })
  .google?.script?.run;
export const votingAvailable = Boolean(runner);

function callScript<T>(invoke: (script: ScriptRunner) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!runner) {
      reject(new Error("Abra a versão do Google Apps Script."));
      return;
    }
    invoke(runner
      .withSuccessHandler((result) => resolve(result as T))
      .withFailureHandler(() => reject(new Error("Falha de comunicação com o servidor."))));
  });
}

export function submitEvaluation(payload: EvaluationPayload) {
  return callScript<EvaluationResult>((script) => script.submitEvaluation(payload));
}

export function loadRanking() {
  return callScript<RankingEntry[]>((script) => script.getPublicRanking());
}
