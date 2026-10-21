// Casos dos hooks, parte 3: session-start, registro em settings.json e adaptadores de subagente.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AQUI, AWS, CHAVE_PRIVADA, T, bash, caso, edita, ferr, escreve, estado, raiz, roda, sub, w } from "./selftest-lib.mjs";

// ---- session-start
const SS = roda("session-start.mjs", {});
let saidaOk = false;
try {
  const j = JSON.parse(SS.out);
  saidaOk = SS.code === 0 && j.hookSpecificOutput.hookEventName === "SessionStart" && j.hookSpecificOutput.additionalContext.includes("demo: etapa E5");
} catch {}
if (!saidaOk) T.falhas++;
console.log(`${saidaOk ? "OK    " : "FALHOU"} session-start.mjs    JSON válido com a demanda e a etapa`);
w(".claude/settings.local.json", JSON.stringify({ disableAllHooks: true }));
const SS2 = roda("session-start.mjs", {});
let alertaOk = false;
try {
  const j = JSON.parse(SS2.out);
  alertaOk = j.hookSpecificOutput.additionalContext.includes("ALERTAS DO HARNESS") && j.hookSpecificOutput.additionalContext.includes("settings.local.json") && Boolean(j.systemMessage);
} catch {}
if (!alertaOk) T.falhas++;
console.log(`${alertaOk ? "OK    " : "FALHOU"} session-start.mjs    settings.local.json com disableAllHooks gera alerta (B22)`);
rmSync(join(raiz, ".claude", "settings.local.json"));
const SS3 = roda("session-start.mjs", {}, {}, "{quebrado");
if (SS3.code !== 0) T.falhas++;
console.log(`${SS3.code === 0 ? "OK    " : "FALHOU"} session-start.mjs    entrada inválida não impede a sessão de abrir (hook de contexto)`);

// ---- registro em settings.json: cada hook está ligado, no evento, nas ferramentas e com onFailure?
// Um hook que existe mas não está registrado não protege nada.
const TODAS_ESCRITAS = ["Write", "Edit", "MultiEdit", "NotebookEdit"];
const ESPERADO = {
  "vault-guard.mjs": ["Read", "Grep", "Glob", ...TODAS_ESCRITAS, "Bash", "mcp__obsidian__.*", "mcp__harness-vault-.*"],
  "rules-guard.mjs": [...TODAS_ESCRITAS, "Bash", "SendMessage"],
  "segredo-guard.mjs": [...TODAS_ESCRITAS, "Bash"],
  "plano-guard.mjs": TODAS_ESCRITAS,
  "escopo-guard.mjs": [...TODAS_ESCRITAS, "Bash"],
  "despacho-guard.mjs": ["Agent", "Task"],
  "commit-guard.mjs": ["Bash"],
};
// Arquivos de hooks/ que NÃO são hooks registrados: bibliotecas, ferramentas e as guardas (que o despachante chama).
const BIBLIOTECAS = new Set(["hook-io.mjs", "guard-lib.mjs", "doctor.mjs", "selftest.mjs", "selftest-lib.mjs", "selftest-git.mjs", "formatos-lib.mjs", "validar-saida.mjs", "recibo-gates.mjs", "vault-lib.mjs", "vault-config.mjs", "memoria-check.mjs", "harness-manifesto.mjs", "guarda-externa.mjs", ...readdirSync(AQUI).filter((f) => /^selftest-casos-\d+\.mjs$/.test(f)), ...Object.keys(ESPERADO)]);
try {
  const cfg = JSON.parse(readFileSync(join(AQUI, "..", "settings.json"), "utf8"));
  const registrados = new Set();
  const { GUARDAS } = await import("./despachante.mjs");
  const registra = (arq, evento, ferramentas) => {
    const achou = (cfg.hooks?.[evento] ?? []).find((e) =>
      (e.hooks ?? []).some((h) => h.type === "command" && String(h.command).includes(`$CLAUDE_PROJECT_DIR/.claude/hooks/${arq}`)),
    );
    const tools = new Set(String(achou?.matcher ?? "").split("|"));
    const bloqueia = evento !== "PreToolUse" || (achou?.hooks ?? []).every((h) => h.onFailure === "block" && h.timeout > 0);
    const ok = Boolean(achou) && (ferramentas === null || ferramentas.every((t) => tools.has(t))) && bloqueia;
    if (!ok) T.falhas++;
    registrados.add(arq);
    console.log(`${ok ? "OK    " : "FALHOU"} settings.json      ${arq} registrado em ${evento}${ok ? "" : " (ausente, sem todas as ferramentas ou sem onFailure:block/timeout)"}`);
  };
  // O PreToolUse tem um registro só (o despachante), com a união das ferramentas das guardas.
  registra("despachante.mjs", "PreToolUse", [...new Set(Object.values(ESPERADO).flat())]);
  registra("session-start.mjs", "SessionStart", null);
  registra("relato-guard.mjs", "SubagentStop", null);
  registra("recibo-guard.mjs", "Stop", null);
  // Cada guarda está na tabela do despachante, com as ferramentas esperadas.
  for (const [arq, ferramentas] of Object.entries(ESPERADO)) {
    const linha = GUARDAS.find((g) => g[0] === arq);
    const tools = new Set(String(linha?.[2] ?? "").split("|"));
    const ok = Boolean(linha) && typeof linha[1].checar === "function" && ferramentas.every((t) => tools.has(t));
    if (!ok) T.falhas++;
    console.log(`${ok ? "OK    " : "FALHOU"} despachante.mjs    ${arq} chamado nas ferramentas esperadas${ok ? "" : " (ausente, sem checar() ou sem todas as ferramentas)"}`);
  }
  const sobra = GUARDAS.map((g) => g[0]).filter((a) => !(a in ESPERADO));
  if (sobra.length) T.falhas++;
  console.log(`${sobra.length ? "FALHOU" : "OK    "} despachante.mjs    nenhuma guarda sem caso esperado${sobra.length ? `: ${sobra.join(", ")}` : ""}`);
  // B12/N29: nenhum hook novo fica de fora, nenhum caminho registrado fica sem arquivo
  const naPasta = readdirSync(AQUI).filter((f) => f.endsWith(".mjs"));
  const orfaos = naPasta.filter((f) => !registrados.has(f) && !BIBLIOTECAS.has(f));
  if (orfaos.length) T.falhas++;
  console.log(`${orfaos.length ? "FALHOU" : "OK    "} settings.json      todo hook da pasta está registrado${orfaos.length ? `: sem registro ${orfaos.join(", ")}` : ""}`);
  const sumidos = [...registrados].filter((f) => !naPasta.includes(f));
  if (sumidos.length) T.falhas++;
  console.log(`${sumidos.length ? "FALHOU" : "OK    "} settings.json      todo hook registrado existe na pasta${sumidos.length ? `: faltam ${sumidos.join(", ")}` : ""}`);
  const nega = (cfg.permissions?.deny ?? []).some((r) => String(r).startsWith("Bash(git push"));
  const negaEnv = ["Read(./**/.env)", "Edit(./**/.env)", "Agent(general-purpose)"].every((r) => (cfg.permissions?.deny ?? []).includes(r));
  if (!nega || !negaEnv) T.falhas++;
  console.log(`${nega && negaEnv ? "OK    " : "FALHOU"} settings.json      permissions.deny bloqueia git push, .env em qualquer pasta e Agent(general-purpose)`);
  // Plugin desligado no kit não pode ser o dono de uma skill que um agente pré-carrega (DP-17):
  // o preload falharia calado. Prefixo da skill = nome do plugin (ponytail:ponytail -> ponytail).
  const desligados = Object.entries(cfg.enabledPlugins ?? {}).filter(([, v]) => v === false).map(([k]) => k.split("@")[0]);
  const dirA = join(AQUI, "..", "agents");
  const usados = existsSync(dirA)
    ? readdirSync(dirA).filter((x) => x.endsWith(".md")).flatMap((f) => [...readFileSync(join(dirA, f), "utf8").matchAll(/^\s+-\s+([\w-]+):[\w-]+\s*$/gm)].map((m) => m[1]))
    : [];
  const conflito = [...new Set(usados.filter((u) => desligados.includes(u)))];
  if (conflito.length) T.falhas++;
  console.log(`${conflito.length ? "FALHOU" : "OK    "} settings.json      nenhum plugin desligado é dono de skill pré-carregada${conflito.length ? `: ${conflito.join(", ")}` : ""}`);
} catch (e) {
  T.falhas++;
  console.log(`FALHOU settings.json      não foi possível ler: ${e.message}`);
}

// ---- adaptadores de subagente: o nome do campo errado é ignorado sem erro (seção 11 da auditoria)
const dirAg = join(AQUI, "..", "agents");
if (existsSync(dirAg)) {
  for (const f of readdirSync(dirAg).filter((x) => x.endsWith(".md"))) {
    const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dirAg, f), "utf8"))?.[1] ?? "";
    const campos = [...fm.matchAll(/^([A-Za-z][\w-]*):/gm)].map((m) => m[1]);
    const validos = new Set(["name", "description", "tools", "disallowedTools", "model", "skills", "hooks", "memory", "permissionMode", "color", "maxTurns", "effort"]);
    const errados = campos.filter((c) => !validos.has(c));
    const completo = ["name", "description", "model"].every((c) => campos.includes(c)) && (campos.includes("tools") || campos.includes("disallowedTools"));
    const ok = errados.length === 0 && completo;
    if (!ok) T.falhas++;
    console.log(`${ok ? "OK    " : "FALHOU"} agents/             ${f.padEnd(28)} campos válidos, com model e limite de ferramentas${ok ? "" : ` (errados: ${errados.join(",") || "nenhum"}; falta model ou tools/disallowedTools: ${!completo})`}`);
  }
}

