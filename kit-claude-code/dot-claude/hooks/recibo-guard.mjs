#!/usr/bin/env node
// Stop. Recibo dos gates (DP-11). Da E8 em diante, enquanto houver código alterado, a sessão
// principal só para se existir docs/fluxo/<demanda>/recibo-gates.md gerado por
// `node .claude/hooks/recibo-gates.mjs <demanda>` (que RODA lint, typecheck e test e grava o código
// de saída de cada um), com `ARVORE` igual ao código de agora e os três EXIT 0.
// Limite honesto: o recibo é um arquivo; a trava real é o pre-push (selftest dos gates, typecheck,
// test, lint:typed). Falha da própria guarda LIBERA (não pode trancar a sessão); na segunda
// tentativa (stop_hook_active) também libera.
import { block, bypassed, projectDir, principal } from "./hook-io.mjs";
import { arquivosAlterados, ehCodigo, hashArvore, lerDemandas, lerRecibo } from "./formatos-lib.mjs";

const ETAPAS_COM_RECIBO = new Set(["E8", "E9", "E10", "E11"]);

export function checar(event) {
  if (bypassed() || event.stop_hook_active || event.agent_id) return;
  const raiz = projectDir(event);
  const alterados = arquivosAlterados(raiz);
  if (!alterados || !alterados.some(ehCodigo)) return;
  const pendentes = [];
  const agora = hashArvore(raiz);
  for (const d of lerDemandas(raiz)) {
    if (!ETAPAS_COM_RECIBO.has(d.etapa)) continue;
    const r = lerRecibo(raiz, d.nome);
    if (!r || !r.gerado) pendentes.push(`${d.nome}: sem recibo dos gates`);
    else if (r.arvore !== agora) pendentes.push(`${d.nome}: o código mudou depois do recibo`);
    else if (!["lint", "typecheck", "test"].every((g) => r.gates[g] === 0)) pendentes.push(`${d.nome}: o recibo tem gate com EXIT diferente de 0 (${JSON.stringify(r.gates)})`);
  }
  if (pendentes.length === 0) return;
  block(
    `Há código alterado e o recibo dos gates não vale: ${pendentes.join("; ")}. Rode \`node .claude/hooks/recibo-gates.mjs <demanda>\`; se um gate falhar, conserte (E8) e rode de novo. Não escreva o recibo à mão.`,
  );
}

principal(import.meta.url, checar, { modo: "contexto" });
