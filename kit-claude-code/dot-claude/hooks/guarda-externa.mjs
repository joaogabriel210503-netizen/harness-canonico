#!/usr/bin/env node
// Guarda das CLIs externas: o hook PreToolUse do Codex e o plugin do OpenCode chamam este arquivo.
// Uso: node guarda-externa.mjs <fonte: codex|opencode> <papel: tech-lead|devops-engineer>
// Traduz o evento da CLI para o formato do Claude Code e passa pelas mesmas travas (vault, regras,
// segredo), mais o escopo do papel e a proibição de mexer no git (só o orquestrador, no Claude Code).
// Bloqueio: saída 2 com o motivo no stderr (é o protocolo do Claude Code, do Codex e do plugin).
// Não validado com o Codex autenticado nem com o OpenCode rodando um modelo: ver .agents/adaptadores.md.
import { block, caminhoRelativo, principal } from "./hook-io.mjs";
import { alvosDeEscrita, comandosInternos, segmentos } from "./guard-lib.mjs";
import * as regras from "./rules-guard.mjs";
import * as segredo from "./segredo-guard.mjs";
import * as vault from "./vault-guard.mjs";

// Onde cada papel pode escrever (relativo à raiz do projeto).
export const ESCOPO = {
  "tech-lead": [/^docs\/(definicao|fluxo)\//],
  "devops-engineer": [/^docs\/fluxo\//, /^(Dockerfile[^/]*|docker-compose[^/]*\.ya?ml|deploy\/.*|\.github\/workflows\/.*)$/],
};
const GIT_QUE_MUDA = /^(add|commit|push|reset|checkout|switch|restore|stash|merge|rebase|cherry-pick|clean|rm|mv|tag|branch|pull|apply|am|revert|worktree)$/;
const PEDIDO = {
  "tech-lead": "O Revisor (Codex) escreve só em docs/definicao/ e docs/fluxo/. Registre o resto como achado ou pedido no seu relato e devolva.",
  "devops-engineer": "A Infra (OpenCode) escreve só o roteiro de deploy em docs/fluxo/ e a configuração de entrega. Registre o resto no relato e devolva.",
};

const SHELL = /^(bash|shell|local_shell|exec_command|exec|container\.exec)$/i;
const CAMINHOS_PATCH = /^\*\*\* (?:Add|Update|Delete) File:\s*(.+?)\s*$|^\*\*\* Move to:\s*(.+?)\s*$/gm;
// Codex "modo código": a ferramenta exec recebe JS que chama tools.apply_patch(...) e
// tools.exec_command({cmd}). Extraímos os caminhos do patch e os comandos de dentro do JS.
const RE_EXEC_JS = /\b(?:exec_command|exec|shell)\s*\(\s*(?:\{[^{}]*?\b(?:cmd|command)\s*:\s*)?(["\'`])([\s\S]*?)\1/g;
const textoDe = (ti) => (typeof ti === "string" ? ti : [ti.command, ti.cmd, ti.script, ti.code, ti.input, ti.patch, ti.diff].filter((x) => typeof x === "string").join("\n") || JSON.stringify(ti));
const caminhosDePatch = (texto) => [...String(texto).matchAll(CAMINHOS_PATCH)].map((m) => m[1] ?? m[2]).filter(Boolean);

function comando(ti) {
  const c = ti?.command ?? ti?.cmd ?? ti?.script;
  if (Array.isArray(c)) return c.length >= 3 && /sh$/.test(String(c[0])) && /^-\w*c/.test(String(c[1])) ? String(c[c.length - 1]) : c.join(" ");
  return typeof c === "string" ? c : "";
}

// Evento da CLI externa -> lista de eventos no formato do Claude Code.
export function normalizar(event, fonte) {
  const nome = String(event.tool_name ?? "");
  const ti = event.tool_input ?? {};
  const base = { cwd: event.cwd, agent_type: undefined };
  const um = (tool_name, tool_input) => [{ ...base, tool_name, tool_input }];
  if (SHELL.test(nome)) {
    const direto = comando(ti);
    if (direto && !/tools\.(apply_patch|exec_command|exec)\b/.test(direto)) return um("Bash", { command: direto });
    // modo código: JS com tools.apply_patch / tools.exec_command dentro do exec
    const texto = direto || textoDe(ti);
    const cmds = [...texto.matchAll(RE_EXEC_JS)].map((m) => m[2]).filter(Boolean);
    const evs = [{ ...base, tool_name: "Bash", tool_input: { command: cmds.length ? cmds.join(" && ") : texto } }];
    for (const cam of caminhosDePatch(texto)) evs.push({ ...base, tool_name: "Write", tool_input: { file_path: cam, content: texto } });
    return evs;
  }
  if (/patch/i.test(nome)) {
    const texto = typeof ti === "string" ? ti : [ti.command, ti.input, ti.patch, ti.diff].find((x) => typeof x === "string") ?? JSON.stringify(ti);
    const caminhos = [...String(texto).matchAll(CAMINHOS_PATCH)].map((m) => m[1] ?? m[2]);
    return caminhos.map((p) => ({ ...base, tool_name: "Write", tool_input: { file_path: p, content: String(texto) } }));
  }
  if (/^(write|edit|multiedit)$/i.test(nome)) {
    return um(/^write$/i.test(nome) ? "Write" : "Edit", { file_path: ti.filePath ?? ti.file_path ?? ti.path ?? "", content: ti.content ?? ti.newString ?? ti.new_string ?? "", new_string: ti.newString ?? ti.new_string ?? "" });
  }
  if (/^(read|grep|glob)$/i.test(nome)) {
    const c = nome[0].toUpperCase() + nome.slice(1).toLowerCase();
    return um(c, { file_path: ti.filePath ?? ti.file_path ?? ti.path ?? "", path: ti.path, pattern: ti.pattern });
  }
  // MCP: o Codex usa mcp__servidor__ferramenta; o OpenCode usa servidor_ferramenta.
  const m = /^mcp__/.test(nome) ? nome : /^(harness-vault(?:-[a-z0-9-]+?)?)_(.+)$/.exec(nome) ? `mcp__${RegExp.$1}__${RegExp.$2}` : nome;
  return um(fonte === "opencode" && m === nome ? nome : m, ti);
}

function escopo(papel, ev) {
  const permitido = ESCOPO[papel] ?? [];
  const alvos = [];
  if (ev.tool_name === "Bash") for (const a of alvosDeEscrita(String(ev.tool_input?.command ?? ""), ev)) if (!a.amplo) alvos.push(a.p);
  if (ev.tool_name === "Write" || ev.tool_name === "Edit") alvos.push(ev.tool_input.file_path);
  for (const bruto of alvos) {
    if (!bruto) continue;
    // O OpenCode manda o caminho absoluto; relativiza à raiz. Fora do projeto vem absoluto (começa com /).
    const p = caminhoRelativo(String(bruto), ev).replace(/^\.\//, "");
    if (!p.startsWith("/") && permitido.some((re) => re.test(p))) continue;
    block(`${p} está fora do seu escopo. ${PEDIDO[papel]}`);
  }
}

function git(ev) {
  if (ev.tool_name !== "Bash") return;
  for (const seg of comandosInternos(String(ev.tool_input?.command ?? "")).flatMap((c) => segmentos(c))) {
    const t = seg.trim().split(/\s+/).filter((x) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(x));
    const i = t.findIndex((x) => /(^|\/)git$/.test(x));
    if (i === -1) continue;
    const resto = t.slice(i + 1);
    let k = 0;
    while (k < resto.length && resto[k].startsWith("-")) k += /^(-C|-c|--git-dir|--work-tree|--namespace|--exec-path)$/.test(resto[k]) ? 2 : 1;
    const verbo = resto[k];
    if (verbo && GIT_QUE_MUDA.test(verbo)) block(`git ${verbo} é do orquestrador (Claude Code). Esta CLI só lê o git (status, diff, log, show). Devolva o pedido por escrito.`);
  }
}

export function checar(event, fonte, papel) {
  if (!ESCOPO[papel]) block(`papel desconhecido para a guarda externa: "${papel}" (use tech-lead ou devops-engineer)`);
  for (const ev of normalizar(event, fonte)) {
    vault.checar(ev);
    regras.checar(ev);
    segredo.checar(ev);
    git(ev);
    escopo(papel, ev);
  }
}

principal(import.meta.url, (event) => checar(event, process.argv[2] ?? "codex", process.argv[3] ?? "tech-lead"));
