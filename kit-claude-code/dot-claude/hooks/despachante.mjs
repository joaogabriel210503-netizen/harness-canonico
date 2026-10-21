#!/usr/bin/env node
// Despachante único do PreToolUse: um processo por chamada de ferramenta, em vez de
// um por guarda. Lê o evento uma vez e passa pelas guardas na ordem abaixo; a primeira
// que bloquear encerra (saída 2). Falha de qualquer guarda também bloqueia (modo "guarda").
// Cada guarda continua rodando sozinha (node x-guard.mjs), que é como o selftest a prova.
import { principal } from "./hook-io.mjs";
import * as commit from "./commit-guard.mjs";
import * as despacho from "./despacho-guard.mjs";
import * as escopo from "./escopo-guard.mjs";
import * as plano from "./plano-guard.mjs";
import * as regras from "./rules-guard.mjs";
import * as segredo from "./segredo-guard.mjs";
import * as vault from "./vault-guard.mjs";

const ESCRITA = "Write|Edit|MultiEdit|NotebookEdit";
// Mesma tabela que o settings.json tinha, uma linha por guarda (o selftest confere).
export const GUARDAS = [
  ["vault-guard.mjs", vault, `Read|Grep|Glob|${ESCRITA}|Bash|mcp__obsidian__.*|mcp__harness-vault-.*`],
  ["rules-guard.mjs", regras, `${ESCRITA}|Bash|SendMessage`],
  ["segredo-guard.mjs", segredo, `${ESCRITA}|Bash`],
  ["plano-guard.mjs", plano, ESCRITA],
  ["escopo-guard.mjs", escopo, `${ESCRITA}|Bash`],
  ["despacho-guard.mjs", despacho, "Agent|Task"],
  ["commit-guard.mjs", commit, "Bash"],
];

export function despachar(event) {
  const tool = String(event.tool_name ?? "");
  for (const [, guarda, matcher] of GUARDAS) {
    if (new RegExp(`^(?:${matcher})$`).test(tool)) guarda.checar(event);
  }
}

principal(import.meta.url, despachar);
