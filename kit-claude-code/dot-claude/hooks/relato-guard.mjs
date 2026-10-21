#!/usr/bin/env node
// SubagentStop. O relato do subagente tem de seguir o formato da persona (F1 + F3 para
// implementador, F1 + F4 para revisor; .agents/rules/formatos.md), conferido contra fatos que
// o agente não controla: git status, estado.md e o plano aprovado. Se não confere, o subagente
// NÃO termina: recebe a lista de erros e corrige (exit 2). Na segunda tentativa
// (stop_hook_active) deixa passar, para nunca prender a sessão; o orquestrador roda
// `node .claude/hooks/validar-saida.mjs relato <arquivo>` antes de aceitar.
// Falha da própria guarda LIBERA: um hook de parada que quebra não pode trancar o subagente.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { block, bypassed, projectDir, principal } from "./hook-io.mjs";
import { IMPLEMENTADORES, REVISORES } from "./formatos-lib.mjs";
import { validaRelato } from "./validar-saida.mjs";

export function checar(event) {
  if (bypassed() || event.stop_hook_active) return;
  const tipo = event.agent_type;
  if (!IMPLEMENTADORES.has(tipo) && !REVISORES.has(tipo)) return;
  const raiz = projectDir(event);
  const msg = String(event.last_assistant_message ?? "");
  // O relato pode estar no arquivo que a mensagem indica (docs/fluxo/.../relato.md).
  const extras = [...msg.matchAll(/docs\/fluxo\/[^\s`'")]+\.md/g)]
    .map((m) => join(raiz, m[0]))
    .filter((a) => existsSync(a))
    .map((a) => readFileSync(a, "utf8"));
  const erros = validaRelato([msg, ...extras].join("\n"), raiz, tipo);
  if (erros.length === 0) return;
  block(
    `O relato de ${tipo} não segue o formato (.agents/rules/formatos.md). Corrija e responda de novo, com a linha F1 na primeira linha:\n- ${erros.join("\n- ")}`,
  );
}

principal(import.meta.url, checar, { modo: "contexto" });
