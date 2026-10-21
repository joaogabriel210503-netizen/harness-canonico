#!/usr/bin/env node
// Doctor do harness: confere o que NÃO viaja com o clone nem com o git e o que
// desliga as travas sem deixar rastro. Rode: node .claude/hooks/doctor.mjs
// Sai com 1 se algum item grave falhar. O SessionStart usa a versão rápida.
//   - registro dos hooks com "onFailure": "block" (hook que quebra bloqueia);
//   - settings.local.json e ~/.claude/settings.json sem nada que desligue hook;
//   - pre-commit e pre-push instalados e idênticos aos de .githooks/;
//   - gates.lock confere; MCP do cofre aprovado nesta máquina;
//   - versão do Claude Code que entende "onFailure".
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { realDe } from "./hook-io.mjs";
import { conferir as conferirMemoria } from "./memoria-check.mjs";
import { verificar as verificarRegistro } from "./harness-manifesto.mjs";
import { existeCentral } from "./vault-lib.mjs";

const VERSAO_MINIMA = [2, 1, 295];
const AQUI = dirname(fileURLToPath(import.meta.url));

const exec = (cmd, args, cwd) => {
  try {
    return { ok: true, out: execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim() };
  } catch (e) {
    return { ok: false, out: String(e.stderr ?? e.message ?? "").trim() };
  }
};
const lerJson = (arq) => {
  try {
    return JSON.parse(readFileSync(arq, "utf8"));
  } catch {
    return undefined;
  }
};
const comparaVersao = (a, b) => (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]);

export function verificar(raiz, { rapido = false } = {}) {
  const r = [];
  const item = (nome, passou, detalhe = "", grave = true) => r.push({ nome, passou, detalhe, grave });

  // Estrutura (B06): a sessão aberta fora da raiz roda sem as travas.
  item(
    "AGENTS.md e .claude/settings.json existem na raiz",
    existsSync(join(raiz, "AGENTS.md")) && existsSync(join(raiz, ".claude", "settings.json")),
    "Abra o Claude Code na raiz do projeto: fora dela as travas não carregam.",
  );

  // Registro dos hooks.
  const cfg = lerJson(join(raiz, ".claude", "settings.json"));
  // Só as guardas do harness: o Graphify e outras ferramentas acrescentam hooks próprios.
  const guardas = (cfg?.hooks?.PreToolUse ?? [])
    .flatMap((e) => e.hooks ?? [])
    .filter((h) => String(h.command).includes("/.claude/hooks/"));
  const semBloqueio = guardas.filter((h) => h.onFailure !== "block").length;
  item(
    'Toda guarda PreToolUse tem "onFailure": "block"',
    cfg !== undefined && guardas.length > 0 && semBloqueio === 0,
    `${semBloqueio} guarda(s) sem o campo: hook que quebra ou estoura o tempo deixaria a ação passar.`,
  );

  // Versão do Claude Code (o campo onFailure existe a partir da 2.1.295).
  if (!rapido) {
    const v = exec("claude", ["--version"]);
    const num = /(\d+)\.(\d+)\.(\d+)/.exec(v.out)?.slice(1).map(Number);
    item(
      `Claude Code ≥ ${VERSAO_MINIMA.join(".")}`,
      Boolean(num) && comparaVersao(num, VERSAO_MINIMA) >= 0,
      num ? `instalado: ${num.join(".")}. Atualize.` : "`claude --version` não respondeu; confira a versão à mão.",
      Boolean(num),
    );
  }

  // B22: o settings local tem precedência sobre o do projeto e não está no git.
  const local = lerJson(join(raiz, ".claude", "settings.local.json"));
  const perigosas = ["disableAllHooks", "hooks", "env", "sandbox"].filter((k) => local && k in local);
  if (Object.values(local?.enabledPlugins ?? {}).some((v) => v === true)) perigosas.push("enabledPlugins (ligando plugin)");
  if (local?.permissions?.defaultMode) perigosas.push("permissions.defaultMode");
  item(
    ".claude/settings.local.json sem chave que desliga ou muda as travas",
    perigosas.length === 0,
    `contém: ${perigosas.join(", ")}. Isso vale mais que o settings do projeto e não aparece no git.`,
  );

  // Settings do usuário (fora do projeto).
  const user = lerJson(join(homedir(), ".claude", "settings.json"));
  const envBypass = Object.keys(user?.env ?? {}).filter((k) => /^HARNESS_/.test(k));
  item(
    "~/.claude/settings.json sem disableAllHooks nem HARNESS_* em env",
    !(user?.disableAllHooks === true) && envBypass.length === 0,
    `${user?.disableAllHooks === true ? "disableAllHooks: true. " : ""}${envBypass.length ? `env: ${envBypass.join(", ")}.` : ""}`,
  );
  const hooksUsuario = Object.keys(user?.hooks ?? {});
  item(
    "~/.claude/settings.json sem hooks de terceiros",
    hooksUsuario.length === 0,
    `eventos com hook global: ${hooksUsuario.join(", ")}. Rodam em todo projeto, antes e depois das travas.`,
    false,
  );
  const plugins = Object.entries(user?.enabledPlugins ?? {}).filter(([, v]) => v === true).map(([k]) => k);
  item("Plugins ligados no usuário (podem registrar hooks)", plugins.length === 0, plugins.join(", "), false);

  // Hooks do git.
  const gitDir = exec("git", ["rev-parse", "--path-format=absolute", "--git-path", "hooks"], raiz);
  if (!gitDir.ok) {
    item("Projeto é um repositório git", false, "Rode `git init` e depois `sh .githooks/instalar.sh`.");
  } else {
    const hp = exec("git", ["config", "core.hooksPath"], raiz);
    item("core.hooksPath não está definido", !hp.ok || hp.out === "", `vale ${hp.out}: os hooks de .git/hooks são ignorados.`);
    for (const nome of ["pre-commit", "pre-push"]) {
      const fonte = join(raiz, ".githooks", nome);
      const instalado = join(gitDir.out, nome);
      const igual =
        existsSync(fonte) && existsSync(instalado) && readFileSync(fonte, "utf8") === readFileSync(instalado, "utf8");
      item(`${nome} do git instalado e igual a .githooks/${nome}`, igual, "Rode `sh .githooks/instalar.sh` (hook de git não viaja com o clone).");
    }
  }

  // gates.lock.
  if (!rapido && existsSync(join(raiz, ".githooks", "verificar-gates.mjs"))) {
    const g = exec("node", [join(raiz, ".githooks", "verificar-gates.mjs")], raiz);
    item("gates.lock confere com o lint, o typecheck e o teste do projeto", g.ok, g.out.split("\n").slice(0, 3).join(" | "));
  }

  // MCP do cofre: a aprovação fica em settings.local.json, fora do git.
  const mcp = lerJson(join(raiz, ".mcp.json"));
  if (mcp?.mcpServers?.["harness-vault"]) {
    const aprovado =
      local?.enableAllProjectMcpServers === true || (local?.enabledMcpjsonServers ?? []).includes("harness-vault");
    item("MCP harness-vault aprovado nesta máquina", aprovado, "Abra o Claude Code e aprove o servidor do .mcp.json (a aprovação não vem no clone).", false);
  }

  // Vault do modo universal: a raiz vem de HARNESS_VAULT_CENTRAL, que muda por máquina.
  const v = existeCentral(raiz);
  if (v.config.modo === "universal") {
    item(
      "HARNESS_VAULT_CENTRAL aponta para o vault da Central, com a pasta do módulo e _comum/",
      Boolean(v.raiz && v.modulo && v.comum),
      `modo universal (módulo ${v.config.modulo}): ${v.raiz ? "faltam pastas em " + v.raiz : "variável não definida nesta máquina"}. Defina a variável e rode vault-config.mjs iniciar.`,
    );
    item("Servidor harness-vault-comum no .mcp.json", Boolean(mcp?.mcpServers?.["harness-vault-comum"]), "Rode o instalador com --modo universal.");
  }

  // Memória: teto, links, campos de frescor.
  const mem = conferirMemoria(raiz);
  item("Memória (.agents/memory) com teto, links e campos de frescor", mem.erros.length === 0, mem.erros.slice(0, 3).join(" | "));
  if (mem.avisos.length) item("Memória sem entrada velha demais", false, mem.avisos.slice(0, 3).join(" | "), false);

  // Distribuição (W7): hook do harness alterado em relação ao registro da instalação.
  if (existsSync(join(raiz, "harness.json"))) {
    const gravesReg = verificarRegistro(raiz).itens.filter((i) => i.nivel === "grave");
    item("Arquivos do harness iguais ao registro da instalação (harness.json)", gravesReg.length === 0, gravesReg.slice(0, 3).map((i) => i.msg).join(" | "));
  } else {
    item("harness.json (registro da instalação) existe", false, "Rode o instalar-no-projeto.sh de novo: ele só registra, não sobrescreve.", false);
  }

  if (!rapido) {
    // Grafo: o Graphify é consultado na E2 e atualizado na E11.
    const grafo = join(raiz, "graphify-out", "graph.json");
    const idade = existsSync(grafo) ? (Date.now() - statSync(grafo).mtimeMs) / 864e5 : undefined;
    item("Grafo (graphify-out) existe e tem menos de 14 dias", idade !== undefined && idade <= 14, idade === undefined ? "ausente: rode `graphify` na raiz." : `velho (${Math.round(idade)} dias): rode \`graphify update\`.`, false);
    // gitleaks: roda antes da E10 (DP-29).
    item("gitleaks instalado", exec("gitleaks", ["version"]).ok, "Sem ele a E10 não tem a varredura de segredo. Instale (brew install gitleaks).", false);
    // CLIs externas: versão instalada contra a testada (.agents/versoes.json).
    const versoes = lerJson(join(raiz, ".agents", "versoes.json"));
    for (const [cli, bin] of [["codex", "codex"], ["opencode", "opencode"]]) {
      const v = exec(bin, ["--version"]);
      const atual = /(\d+\.\d+\.\d+)/.exec(v.out)?.[1];
      const testada = versoes?.[cli]?.testada;
      if (atual && testada) item(`${cli} na versão testada (${testada})`, atual === testada, `instalado ${atual}. O harness foi provado com ${testada}; rode o selftest e confira ${cli} antes de confiar nas travas dele.`, false);
    }
    // Superpowers: o fluxo (brainstorming, writing-plans) depende dele.
    const todos = { ...(user?.enabledPlugins ?? {}), ...(cfg?.enabledPlugins ?? {}) };
    item("Plugin Superpowers ligado", Object.entries(todos).some(([k, v]) => /superpowers/i.test(k) && v === true), "O fluxo usa brainstorming e writing-plans do Superpowers.", false);
    // A memória automática do Claude Code duplica a do harness (.agents/memory).
    const auto = cfg?.autoMemoryEnabled ?? local?.autoMemoryEnabled ?? user?.autoMemoryEnabled;
    item("autoMemoryEnabled desligado (a memória é a do harness)", auto === false, "Ligado ou não definido: o Claude Code grava memória própria, fora do índice e do vault. Ponha `\"autoMemoryEnabled\": false` no settings.", false);
  }

  // .gitignore.
  const ign = existsSync(join(raiz, ".gitignore")) ? readFileSync(join(raiz, ".gitignore"), "utf8").split("\n").map((l) => l.trim()) : [];
  const faltam = [".env", ".env.*", ".claude/worktrees/", ".claude/settings.local.json", ".claude/liberar-regras", "node_modules/"].filter((l) => !ign.includes(l));
  item(".gitignore protege segredo, worktrees e arquivos locais", faltam.length === 0, `faltam: ${faltam.join(", ")}`);

  if (!rapido) {
    // Codex só roda o hook do projeto depois que você confia no projeto E no hook,
    // por máquina, em ~/.codex/config.toml (não vem no git). Confere de verdade em
    // vez de só avisar (teste-mac: o OK antigo era fixo e enganava).
    const codexCfg = join(realDe(homedir()), ".codex", "config.toml");
    const txt = existsSync(codexCfg) ? readFileSync(codexCfg, "utf8") : "";
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const caminhos = [...new Set([raiz, realDe(raiz)])];
    const projConfiado = caminhos.some((c) => new RegExp(`${esc(c)}[\\s\\S]{0,200}?trust_level\\s*=\\s*"trusted"`).test(txt));
    const hookConfiado = caminhos.some((c) => new RegExp(`hooks\\.state\\."${esc(c)}/\\.codex/hooks\\.json`).test(txt)) && /trusted_hash/.test(txt);
    item(
      "Codex: projeto e hook confiados nesta máquina (~/.codex/config.toml)",
      Boolean(txt) && projConfiado && hookConfiado,
      txt
        ? `confie no projeto e no hook: abra 'codex' interativo na raiz do projeto e aceite (projeto=${projConfiado}, hook=${hookConfiado})`
        : "~/.codex/config.toml não existe: o Codex ainda não rodou aqui",
      false,
    );
    item(
      "Antigravity: sem config legível para conferir (manual)",
      true,
      "Abra o projeto no Antigravity uma vez e confirme a confiança; não há hook do harness, só a regra escrita.",
      false,
    );
  }
  return r;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = process.env.CLAUDE_PROJECT_DIR || join(AQUI, "..", "..");
  const itens = verificar(raiz);
  let graves = 0;
  for (const i of itens) {
    if (!i.passou && i.grave) graves++;
    const marca = i.passou ? "OK    " : i.grave ? "FALHOU" : "AVISO ";
    console.log(`${marca} ${i.nome}${i.passou || !i.detalhe ? "" : `\n         ${i.detalhe}`}`);
  }
  console.log(graves ? `\n${graves} item(ns) grave(s): as travas podem estar desligadas.` : "\nNenhum item grave.");
  process.exit(graves ? 1 : 0);
}
