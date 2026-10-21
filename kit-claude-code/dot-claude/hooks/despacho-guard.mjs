#!/usr/bin/env node
// PreToolUse em Agent|Task (despacho de subagente). Faz cumprir AGENTS.md,
// "Personas": "Despache a persona cuja frase combina com a tarefa. Nunca um agente
// genérico" e "Defina o nível de modelo a cada despacho".
//   - subagent_type tem de ser um arquivo de .claude/agents/ (as personas);
//     `general-purpose` e despacho sem tipo (que vira general-purpose) são barrados;
//   - o modelo tem de estar no despacho (parâmetro `model`) ou fixo no frontmatter
//     da persona (`model:` diferente de "inherit").
// Sem isto, um revisor despachado como general-purpose fica sem restrição nenhuma.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { block, bypassed, projectDir, principal } from "./hook-io.mjs";

function personas(raiz) {
  const dir = join(raiz, ".claude", "agents");
  const mapa = new Map();
  if (!existsSync(dir)) return mapa;
  for (const arq of readdirSync(dir)) {
    if (!arq.endsWith(".md")) continue;
    const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dir, arq), "utf8"))?.[1] ?? "";
    const nome = /^name:\s*(\S+)/m.exec(fm)?.[1] ?? arq.replace(/\.md$/, "");
    mapa.set(nome, /^model:\s*(\S+)/m.exec(fm)?.[1] ?? "");
  }
  return mapa;
}

export function checar(event) {
  if (bypassed()) return;
  if (!["Agent", "Task"].includes(event.tool_name)) return;
  const entrada = event.tool_input ?? {};
  const tipo = String(entrada.subagent_type ?? "");
  const lista = personas(projectDir(event));
  if (tipo === "" || !lista.has(tipo)) {
    block(
      `Despacho bloqueado: ${tipo === "" ? "sem subagent_type (vira general-purpose)" : `"${tipo}" não é persona do harness`}. Use uma persona de AGENTS.md: ${[...lista.keys()].join(", ") || "(.claude/agents/ está vazio)"}.`,
    );
  }
  const fixo = lista.get(tipo);
  if (!entrada.model && (fixo === "" || fixo === "inherit")) {
    block(
      `Despacho de ${tipo} sem modelo. Informe o parâmetro \`model\` (o mais barato que resolve: AGENTS.md, "Personas") e registre-o no arquivo de passagem.`,
    );
  }
}

principal(import.meta.url, checar);
