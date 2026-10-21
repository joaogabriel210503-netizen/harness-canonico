// JSON.parse("null") is valid and returns null without throwing — a naive
// `JSON.parse(readStdinRaw())` would treat a literal "null" stdin payload as
// a successful parse. parseHookEvent() below guards against that.

import { existsSync, readFileSync, realpathSync, writeSync } from "node:fs";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

export function readStdinRaw() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

export function parseHookEvent(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed === null) {
    return null;
  }
  return parsed;
}

// ---- Acrescentado pelo harness (o trecho acima é cópia do vibe-coding-toolkit) ----

export function projectDir(event) {
  return process.env.CLAUDE_PROJECT_DIR || event?.cwd || process.cwd();
}

// Bloqueio deliberado: a mensagem vai para o agente pela saída de erro.
export function block(message) {
  writeSync(2, `${message}\n`);
  process.exit(2);
}

// Roda o corpo do hook.
//   modo "guarda" (padrão): qualquer falha BLOQUEIA (exit 2). Uma trava que
//     quebra e deixa passar não é trava (N01): `mkdir -p docs/fluxo/x/estado.md`
//     derrubava o plano-guard e liberava todo o código.
//   modo "contexto": falha libera (exit 0). Só para hook que apenas informa.
// Entrada que não é JSON de objeto também é falha: o Claude Code sempre manda um.
export function run(body, { modo = "guarda" } = {}) {
  const falha = (motivo) => {
    if (modo === "guarda") {
      block(
        `Uma trava do harness falhou (${motivo}) e, por segurança, a ação foi bloqueada. Não tente contornar: avise o humano para rodar \`node .claude/hooks/selftest.mjs\`.`,
      );
    }
    process.exit(0);
  };
  const event = parseHookEvent(readStdinRaw());
  if (event === null || typeof event !== "object") return falha("entrada ilegível");
  try {
    body(event);
  } catch (e) {
    return falha(String(e?.message ?? e).slice(0, 120));
  }
  process.exitCode = 0;
}

// Roda o corpo só quando o arquivo é o programa chamado (node x-guard.mjs). Quando
// o despachante importa a guarda, nada roda sozinho (W1: um processo por evento).
export function principal(url, corpo, opcoes) {
  const chamado = process.argv[1] ? pathToFileURL(realDe(resolve(process.argv[1]))).href : "";
  if (url === chamado || url === pathToFileURL(process.argv[1] ?? "").href) run(corpo, opcoes);
}

// Quem está chamando? O Claude Code informa agent_id/agent_type quando a
// chamada vem de um subagente. Sessão principal = orquestradora.
export function isSubagent(event) {
  return Boolean(event?.agent_id || event?.agent_type);
}

// ---- Caminhos ------------------------------------------------------------

// realpath do ancestral que existe + o resto. Resolve symlink (N07: `ln -s .claude c`
// e depois Edit em c/hooks/x) e /tmp × /private/tmp, mesmo para arquivo ainda
// inexistente.
export function realDe(p) {
  let atual = p;
  const resto = [];
  for (let i = 0; i < 64; i++) {
    try {
      return join(realpathSync.native(atual), ...[...resto].reverse());
    } catch {
      // sobe um nível
    }
    const pai = dirname(atual);
    if (pai === atual) return p;
    resto.push(basename(atual));
    atual = pai;
  }
  return p;
}

// .claude/worktrees/<n>/ é uma cópia completa do projeto: as regras valem para
// o caminho dentro dela (N06).
const WORKTREE = /^\.claude\/worktrees\/[^/]+\/?/i;

// O macOS não diferencia maiúscula: compara o prefixo sem diferenciar.
function relativoA(raiz, abs) {
  const a = abs.toLowerCase();
  const r = raiz.toLowerCase();
  if (a === r) return "";
  if (a.startsWith(`${r}/`)) return abs.slice(raiz.length + 1);
  return null;
}

// Caminho relativo à raiz do projeto, sem prefixo de worktree. Fora do projeto,
// o caminho absoluto (já com realpath).
export function caminhoRelativo(raw, event, base) {
  const raiz = realDe(resolve(projectDir(event)));
  const ref = base ?? event?.cwd ?? projectDir(event);
  const abs = realDe(isAbsolute(raw) ? resolve(raw) : resolve(ref, raw));
  const rel = relativoA(raiz, abs);
  return rel === null ? abs : rel.replace(WORKTREE, "");
}

// Caminho do alvo da ferramenta, relativo à raiz do projeto, com barras normais.
export function targetPath(event) {
  const raw =
    event?.tool_input?.file_path ??
    event?.tool_input?.notebook_path ??
    event?.tool_input?.path ??
    "";
  if (typeof raw !== "string" || raw === "") return "";
  return caminhoRelativo(raw, event);
}

// Pastas e arquivos do usuário que decidem como o agente roda (N10, B22): o
// agente não escreve neles. ~/.claude/projects e ~/.claude/plans ficam livres
// (memória e plano do próprio Claude Code).
const CASA = [
  ".claude.json", ".claude", ".codex", ".config/opencode", ".gemini", ".agents",
  ".zshrc", ".zprofile", ".zshenv", ".bashrc", ".bash_profile", ".profile",
  ".gitconfig", ".config/git", ".ssh",
];
const CASA_LIVRE = [".claude/projects", ".claude/plans"];
export function emCasaProtegida(abs) {
  const h = realDe(homedir()).toLowerCase();
  const a = abs.toLowerCase();
  const dentro = (sub) => a === `${h}/${sub}` || a.startsWith(`${h}/${sub}/`);
  return CASA.some(dentro) && !CASA_LIVRE.some(dentro);
}

// Bypass declarado pelo humano ao abrir a sessão: HARNESS_BYPASS=1 claude
export function bypassed() {
  return process.env.HARNESS_BYPASS === "1";
}

// Liberação para mudar regra: bypass da sessão, ou o arquivo que SÓ o humano
// cria (`touch .claude/liberar-regras`, no terminal dele).
export function liberado(event) {
  return bypassed() || existsSync(join(projectDir(event), ".claude", "liberar-regras"));
}

// Escrita síncrona na saída padrão (não se perde ao encerrar o processo).
export function saida(texto) {
  writeSync(1, texto);
}
