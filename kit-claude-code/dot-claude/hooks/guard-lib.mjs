// Biblioteca das travas (não é um hook). Um único lugar para:
//   - a lista do que é "regra" e só o humano muda (PROTEGIDOS);
//   - o parser de comando de shell que o rules-guard e o commit-guard usam (N33).
// Limite honesto: shell tem formas demais; isto reduz o que passa, não garante.
// A única camada que fecha o Bash de verdade é o sandbox do sistema operacional
// (ver README, "Sandbox").
import { homedir } from "node:os";
import { caminhoRelativo, emCasaProtegida } from "./hook-io.mjs";

// Comparação sem diferenciar maiúsculas (o macOS não diferencia). Os arquivos de
// config valem em qualquer profundidade: backend/eslint.config.mjs também.
export const PROTEGIDOS = [
  /(^|\/)eslint(\.[a-z]+)?\.config\.[cm]?[jt]s$/i,
  /(^|\/)\.eslintrc(\.[a-z]+)?$/i,
  /(^|\/)\.eslintignore$/i,
  /(^|\/)eslint-rules(\/|$)/i,
  /(^|\/)biome\.jsonc?$/i,
  /(^|\/)sem-supressao\.mjs$/i,
  /(^|\/)selftest(-[a-z0-9-]+)?\.mjs$/i,
  /(^|\/)tsconfig(\.[^/]*)?\.json$/i,
  /(^|\/)(vitest|jest|playwright)\.config\.[^/]*$/i,
  /(^|\/)lefthook\.ya?ml$/i,
  /^\.githooks(\/|$)/i,
  /^\.husky(\/|$)/i,
  /^\.git(\/|$)/i,
  /^\.github\/(workflows|actions)(\/|$)/i,
  /^\.mcp\.json$/i,
  /^opencode\.jsonc?$/i,
  /^\.(codex|opencode)(\/|$)/i,
  /^\.claude(\/|$)/i,
  /^(AGENTS|CLAUDE)\.md$/i,
  /^\.agents(\/(?!memory(\/|$)).*)?$/i,
  /(^|\/)docs\/fluxo\/[^/]+\/aprovacoes\.json$/i,
];
export const protegido = (p) => PROTEGIDOS.some((re) => re.test(p));

// Código gerado por ferramenta (prisma, openapi...): ninguém edita à mão, e o
// lint não olha esta pasta. Só vale para as ferramentas de edição; a ferramenta
// que gera roda por Bash.
export const GERADOS = /(^|\/)generated\//i;

// ---- Shell ---------------------------------------------------------------

export const limpa = (t) => t.replace(/^["'<>(]+|["')]+$/g, "").replace(/^\.\//, "");

// Corpo de heredoc é texto, não comando. Fica a linha que abre (com o
// redirecionamento depois do delimitador) e sai o corpo.
export function semHeredoc(cmd) {
  return cmd.replace(/(<<-?\s*(['"]?)(\w+)\2[^\n]*)\n[\s\S]*?\n[ \t]*\3[ \t]*(?=\n|$)/g, "$1");
}

// "descartar": texto entre aspas com espaço vira "" (mensagem de commit que cita
// "git push" não é comando). "manter": o texto fica visível, com espaço e
// separadores trocados por "_" (o caminho `"AGENTS.md"` continua visível).
export function segmentos(cmd, modo = "manter") {
  const t = semHeredoc(cmd).replace(/"((?:[^"\\]|\\.)*)"|'([^']*)'/g, (_m, a, b) => {
    const s = a ?? b ?? "";
    if (modo === "descartar") return /\s/.test(s) ? '""' : s;
    return s.replace(/[\s;&|<>]/g, "_");
  });
  return t
    .split(/&&|\|\||;|\||\n|(?<![>&])&(?![>&])/)
    .map((x) => x.trim())
    .filter(Boolean);
}

const SH = /\b(?:sh|bash|zsh|dash|ksh)\b(?:\s+-[A-Za-z-]+)*\s+-[A-Za-z]*c\s+("(?:[^"\\]|\\.)*"|'[^']*')/g;
const EVAL = /\beval\s+("(?:[^"\\]|\\.)*"|'[^']*'|\S+)/g;
const SUBST = /\$\(([^()]*)\)|`([^`]*)`/g;

// O comando e todo comando escondido dentro dele: `sh -c "..."`, `eval ...`,
// `$(...)` e crase. Cada um é analisado como um comando de verdade.
export function comandosInternos(cmd, prof = 0) {
  const todos = [cmd];
  if (prof > 3) return todos;
  const dentro = [];
  for (const m of cmd.matchAll(SH)) dentro.push(m[1].slice(1, -1));
  for (const m of cmd.matchAll(EVAL)) dentro.push(m[1].replace(/^["']|["']$/g, ""));
  for (const m of cmd.matchAll(SUBST)) dentro.push(m[1] ?? m[2]);
  for (const d of dentro) todos.push(...comandosInternos(d, prof + 1));
  return todos;
}

// Caminho de um argumento de comando, relativo à raiz do projeto (ou absoluto,
// se fora dele). Expande ~ e $HOME.
export function caminhoDoToken(t, event) {
  let x = limpa(t.replace(/^of=/, ""));
  x = x.replace(/^(~|\$HOME|\$\{HOME\})(?=\/|$)/, homedir());
  if (x === "" || x.startsWith("-")) return "";
  return caminhoRelativo(x, event);
}

const EH_PROTEGIDO = (p) => p !== "" && (protegido(p) || (p.startsWith("/") && emCasaProtegida(p)));

// Verbos que escrevem, movem ou apagam o arquivo que recebem como argumento.
const ESCREVE =
  /^(tee|truncate|rm|mv|touch|install|ln|chmod|chown|chflags|unlink|rmdir|shred|dd|patch|ed|ex|sponge)$/;
const PREFIXOS = ["sudo", "command", "env", "time", "nice", "nohup", "exec", "xargs", "builtin", "stdbuf", "caffeinate"];
const GIT_MEXE = new Set([
  "checkout", "restore", "apply", "am", "cherry-pick", "revert", "rm", "mv", "stash",
  "reset", "clean", "update-index", "checkout-index", "read-tree",
]);

// Os caminhos que um comando de shell escreve, move ou apaga. É a única fonte
// para as travas (rules-guard, escopo-guard): cada uma decide o que fazer com a lista.
// `amplo: true` marca o que é só suspeita (argumento de `git checkout` pode ser ramo, não
// arquivo): vale para "é arquivo de regra?", mas não para "é código?".
function alvosSegmento(seg, event) {
  const achados = [];
  const add = (t, amplo = false) => {
    const p = caminhoDoToken(t, event);
    if (p !== "") achados.push({ p, amplo });
  };
  for (const m of [...seg.matchAll(/(?<![0-9&])>>?\|?\s*(?!&)(\S+)/g), ...seg.matchAll(/&>>?\s*(\S+)/g)]) add(m[1]);

  const toks = seg.trim().split(/\s+/);
  const i = toks.findIndex((t) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) && !PREFIXOS.includes(limpa(t)));
  if (i === -1) return achados;
  const verbo = limpa(toks[i]).split("/").pop();
  const todos = toks.slice(i + 1);
  const args = todos.filter((t) => !t.startsWith("-"));
  // chmod/chown/sed/perl/awk: o primeiro argumento é modo, dono ou programa, não arquivo.
  const semPrimeiro = () => (todos.some((t) => t === "-e" || t === "-f") ? args : args.slice(1));

  if (ESCREVE.test(verbo)) {
    if (/^(chmod|chown|chflags)$/.test(verbo)) {
      // -R, -f... são opções; o primeiro token que sobra é o modo (pode ser `-x`) ou o dono.
      let k = 0;
      while (/^-[RfvhHLP]+$/.test(todos[k] ?? "")) k++;
      todos.slice(k + 1).forEach((t) => add(t));
    }
    else todos.forEach((t) => add(t));
  }
  if ((verbo === "cp" || verbo === "rsync") && args.length > 0) add(args[args.length - 1]);
  if (verbo === "rsync" && todos.some((t) => t.startsWith("--delete"))) args.forEach((t) => add(t));
  if ((verbo === "sed" || verbo === "perl") && todos.some((t) => /^-[A-Za-z]*i/.test(t) || t === "--in-place")) semPrimeiro().forEach((t) => add(t));
  if (verbo === "awk" && todos.includes("inplace")) semPrimeiro().forEach((t) => add(t));
  if (verbo === "git") {
    let j = 0;
    while (j < todos.length && (todos[j].startsWith("-") || ["-C", "-c"].includes(todos[j - 1] ?? ""))) j++;
    if (GIT_MEXE.has(todos[j])) {
      const depois = todos.slice(j + 1);
      const marca = depois.indexOf("--");
      depois.forEach((t, k) => add(t, marca === -1 || k < marca));
    }
  }
  return achados;
}

export function alvosDeEscrita(cmd, event) {
  return comandosInternos(cmd).flatMap((c) => segmentos(c, "manter").flatMap((s) => alvosSegmento(s, event)));
}

export function escreveEmProtegido(cmd, event) {
  return alvosDeEscrita(cmd, event).some((a) => EH_PROTEGIDO(a.p));
}

// CLIs de agente: uma sessão aninhada (`claude -p`, `codex exec`) roda com as
// travas do projeto onde ela abrir, não com as desta (B05).
const CLIS = new Set(["claude", "codex", "opencode", "gemini", "agy", "antigravity", "cursor-agent", "aider", "goose", "crush", "amp"]);
export function cliAninhada(cmd) {
  for (const c of comandosInternos(cmd)) {
    for (const seg of segmentos(c, "descartar")) {
      const toks = seg.split(/\s+/);
      const i = toks.findIndex((t) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) && !PREFIXOS.includes(limpa(t)));
      if (i === -1) continue;
      const verbo = limpa(toks[i]).split("/").pop();
      const resto = toks.slice(i + 1);
      const soAjuda = resto.length > 0 && resto.every((a) => /^(--version|-v|-V|--help|-h|version|help)$/.test(a));
      if (CLIS.has(verbo) && !soAjuda) return verbo;
    }
  }
  return null;
}

// Variável de ambiente do harness atribuída num comando (HARNESS_BYPASS=1 ...).
export const ATRIBUI_HARNESS = /(^|[\s;&|(])(export\s+|env\s+)?HARNESS_[A-Z_]+=/;

// Interpretador com código inline ou lido da entrada: o texto do código não é
// analisável. Se ele cita um arquivo de regra, bloqueia (`node -e "fs.writeFileSync('eslint.config.mjs', ...)"`).
const INLINE = [
  /\b(node|nodejs|bun|deno|python3?|perl|ruby|php)\b(?:\s+-[-\w]+(?:=\S+)?)*\s+(-e|-c|-p|-E|--eval|--print)\b/,
  /\b(node|nodejs|bun|deno|python3?|perl|ruby|php)\b[^\n|;&]*<<-?\s*['"]?\w+/,
  /\|\s*(node|nodejs|bun|python3?|perl|ruby|sh|bash|zsh)\b/,
];
const CITA_REGRA =
  /eslint|\.claude|\.githooks|\.git\/|\.husky|AGENTS\.md|CLAUDE\.md|\.agents|liberar-regras|selftest|tsconfig|\.mcp\.json|aprovacoes|biome|vitest|jest\.config|playwright\.config|\.github|\.codex|\.opencode|opencode\.json|HARNESS_|settings\.local|gates\.lock|~\/\.|\$HOME|\.zshrc|\.bashrc|\.zprofile|\.ssh|\.gitconfig/i;
// Aqui o corpo de heredoc CONTA: é o código do interpretador.
export function inlineQueCitaRegra(cmd) {
  return INLINE.some((re) => re.test(cmd)) && CITA_REGRA.test(cmd);
}
