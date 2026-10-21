#!/usr/bin/env node
// PreToolUse. O vault só se acessa pelas ferramentas MCP do servidor do projeto
// (mcp__harness-vault__*),
// que validam modelo, frontmatter e links. Bloqueia leitura e escrita direta.
// Em Bash a checagem é uma trava de bom senso, não de segurança: um agente
// determinado a burlar consegue. Ela existe para o descuido.
import { block, bypassed, realDe, targetPath, principal } from "./hook-io.mjs";
import { comandosInternos, segmentos } from "./guard-lib.mjs";
import { VARIAVEL, dentroDe, raizCentral, servidorEstranho } from "./vault-lib.mjs";
import { resolve } from "node:path";

// Argumento que é o caminho do vault: vault, vault/..., ./vault/..., ../vault/...
// (não casa src/vault/x.ts nem vault-skeleton).
const NO_VAULT = /^(\.{1,2}\/)*vault(\/.*)?$/i;
// Comandos que recebem caminho como argumento; com eles, "vault" sozinho conta.
const COM_CAMINHO = /^(ls|cat|head|tail|less|more|find|tree|rm|mv|cp|mkdir|rmdir|touch|cd|tee|sed|awk|wc|stat|open|code|vim|nano|ln|du)$/;
const BUSCA = /^(grep|rg|ag|ack)$/;
const MSG =
  "vault/ só se acessa pelas ferramentas MCP do vault (mcp__harness-vault__*): elas validam modelo, frontmatter e links. Use search_notes_tool, read_note_tool, create_note_tool ou update_note_tool.";

// Modo universal: o vault mora fora do projeto (variável HARNESS_VAULT_CENTRAL). Acesso direto é negado.
const naCentral = (central, cwd, t) => Boolean(central) && (t.includes(VARIAVEL) || (/^[~$.\/\w-]/.test(t) && dentroDe(realDe(resolve(cwd, t)), realDe(central))));

function mexeNoVault(seg, central, cwd) {
  // redirecionamento: >vault/x, >> vault/x, <vault/x
  const redir = [...seg.matchAll(/[<>]+\s*(\S+)/g)].map((m) => m[1]);
  if (redir.some((t) => NO_VAULT.test(t) || naCentral(central, cwd, t))) return true;
  const toks = seg.split(/\s+/).map((t) => t.replace(/^[<>(]+/, ""));
  const i = toks.findIndex((t) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) && !["sudo", "command", "env", "time", "nice"].includes(t));
  if (i === -1) return false;
  const verbo = toks[i].split("/").pop();
  if (verbo === "git") return false;
  const args = toks.slice(i + 1).filter((t) => !t.startsWith("-"));
  if (args.some((t) => naCentral(central, cwd, t)) && (BUSCA.test(verbo) || COM_CAMINHO.test(verbo))) return true;
  if (BUSCA.test(verbo)) return args.length > 0 && NO_VAULT.test(args[args.length - 1]);
  if (COM_CAMINHO.test(verbo)) return args.some((t) => NO_VAULT.test(t));
  return args.some((t) => /^(\.{1,2}\/)*vault\//i.test(t));
}

// Servidor "obsidian" é o de outro escopo (normalmente o vault pessoal do usuário, em
// ~/.claude.json). O projeto usa "harness-vault" justamente para não colidir com ele.
// Se o agente chamar o pessoal, a nota iria para o vault errado.
const MSG_PESSOAL =
  "Esta é a ferramenta do servidor 'obsidian', que não é o vault do projeto (normalmente é o vault pessoal do usuário). Use as ferramentas mcp__harness-vault__* (create_note_tool, search_notes_tool, read_note_tool, update_note_tool).";

export function checar(event) {
  if (bypassed()) return;
  const tool = event.tool_name;

  if (/^mcp__obsidian__/.test(String(tool))) block(MSG_PESSOAL);

  // Por pasta (DP-02): só o próprio módulo (harness-vault) e o comum em leitura.
  const estranho = servidorEstranho(tool);
  if (estranho) block(`${estranho}: o vault do módulo é o servidor harness-vault; o _comum só se lê (search_notes_tool, read_note_tool). Para mudar o _comum, peça ao Gabriel.`);
  const cwd = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const central = raizCentral(process.env.CLAUDE_PROJECT_DIR || cwd);

  if (tool === "Bash") {
    // Mesmo parser das outras travas: lê também `sh -c`, `eval`, `$(...)` e crase (N33).
    if (comandosInternos(String(event.tool_input?.command ?? "")).flatMap((c) => segmentos(c)).some((s) => mexeNoVault(s, central, cwd))) block(MSG);
    return;
  }

  const p = targetPath(event);
  if (central && [p, tool === "Glob" ? String(event.tool_input?.pattern ?? "") : ""].some((x) => x && naCentral(central, cwd, x))) block(MSG);
  // No Glob o pattern é caminho. No Grep o pattern é texto: só vale o path.
  const pat = tool === "Glob" ? String(event.tool_input?.pattern ?? "") : "";
  const noVault = (x) => NO_VAULT.test(x);
  if (!noVault(p) && !noVault(pat)) return;
  // Pasta daily: leitura direta é permitida (rascunho do dia). Escrita, nunca.
  const alvo = noVault(p) ? p : pat;
  const leitura = ["Read", "Grep", "Glob"].includes(tool);
  if (leitura && /^(\.{1,2}\/)*vault\/daily(\/|$)/i.test(alvo)) return;
  block(MSG);
}

principal(import.meta.url, checar);
