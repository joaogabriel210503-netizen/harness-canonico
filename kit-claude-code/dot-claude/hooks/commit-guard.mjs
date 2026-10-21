#!/usr/bin/env node
// PreToolUse em Bash. Faz cumprir .agents/rules/commit.md:
//   - só a sessão principal (orquestradora) commita, e só arquivo por arquivo;
//   - merge e push são do humano; nunca na main;
//   - nunca --no-verify, nunca git add . / -A / commit -a, nunca mexer na config do git.
// Falha da própria trava BLOQUEIA (hook-io.mjs, modo "guarda").
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { block, bypassed, isSubagent, principal } from "./hook-io.mjs";
import { comandosInternos, segmentos } from "./guard-lib.mjs";

// "git -C x -c a=b commit -m y" -> { sub: "commit", args: ["-m", "y"], dir: "x", confs: ["a=b"] }
function parseGit(seg) {
  const t = seg.split(/\s+/);
  const i = t.findIndex((x) => x === "git" || x.endsWith("/git"));
  if (i === -1) return null;
  let j = i + 1;
  let dir = "";
  const confs = [];
  while (j < t.length) {
    if (t[j] === "-C") { dir = t[j + 1] ?? ""; j += 2; }
    else if (t[j] === "-c") { confs.push(t[j + 1] ?? ""); j += 2; }
    else if (["--git-dir", "--work-tree"].includes(t[j])) j += 2;
    else if (t[j].startsWith("-")) j += 1;
    else break;
  }
  return t[j] ? { sub: t[j], args: t.slice(j + 1), dir, confs } : null;
}

function ramoAtual(cwd) {
  try {
    return execFileSync("git", ["-C", cwd, "symbolic-ref", "--short", "-q", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const PROTEGIDAS = new Set(["main", "master"]);
const SO_ORQUESTRADORA = ["commit", "add", "stash", "restore", "checkout", "switch", "rebase", "cherry-pick", "tag"];
const REESCREVE_HISTORIA = ["update-ref", "filter-branch", "filter-repo", "replace", "symbolic-ref", "reflog", "gc"];
const ENV_PULA_HOOK = /(^|[\s;&|(])(HUSKY|SKIP_HOOKS|SKIP|LEFTHOOK|GIT_SKIP)[A-Z_]*=/;
const SO_HUMANO = "(.agents/rules/commit.md)";

function gh(seg) {
  const m = /^\s*(?:\S+\/)?gh\s+(.*)$/.exec(seg);
  if (!m) return;
  const resto = m[1];
  if (/^pr\s+(merge|create)\b/.test(resto)) block(`gh pr ${resto.split(/\s+/)[1]} é do humano ${SO_HUMANO}.`);
  if (/^api\b/.test(resto) && (/(-X|--method)[\s=]*(PUT|DELETE|PATCH|POST)/i.test(resto) || /\/merge\b/.test(resto))) {
    block(`gh api que altera o repositório (merge, PUT, DELETE, POST) é do humano ${SO_HUMANO}.`);
  }
  if (/^(repo\s+(delete|edit|rename)|secret|release\s+(create|delete)|workflow\s+run)\b/.test(resto)) {
    block(`Este comando do gh altera o repositório no GitHub: é do humano ${SO_HUMANO}.`);
  }
}

export function checar(event) {
  if (event.tool_name !== "Bash" || bypassed()) return;
  const cmd = String(event.tool_input?.command ?? "");
  if (!/\b(git|gh)\b|\.git\/hooks/.test(cmd)) return;
  const sub = isSubagent(event);
  const cwd = event.cwd || process.cwd();
  const vistos = new Set();

  for (const interno of comandosInternos(cmd)) {
    for (const seg of segmentos(interno, "descartar")) {
      if (vistos.has(seg)) continue;
      vistos.add(seg);
      gh(seg);
      if (/\b(rm|mv|unlink)\b[^|;&]*\.git\/hooks/.test(seg)) block("Não apague nem mova os hooks do git: isso desliga o pre-commit.");
      const g = parseGit(seg);
      if (!g) continue;
      const { sub: s, args, dir, confs } = g;
      const tem = (...f) => args.some((a) => f.includes(a));

      if (ENV_PULA_HOOK.test(seg) && ["commit", "push"].includes(s)) {
        block("Variável que pula os hooks do git (HUSKY, SKIP, ...). Se o lint barrou, a wave não estava pronta: volte para E8.");
      }
      if (
        args.some((a) => /^--no-ver/.test(a)) ||
        (s === "commit" && args.some((a) => /^-[a-zA-Z]*n[a-zA-Z]*$/.test(a)))
      ) {
        block("Nunca pule o pre-commit (--no-verify, -n). Se o lint barrou, a wave não estava pronta: volte para E8.");
      }
      if (/core\.hookspath/i.test(seg)) {
        block("Não mexa em core.hooksPath: isso desliga o pre-commit. Se o lint barrou, volte para E8.");
      }
      if (confs.some((c) => /^alias\./i.test(c)) || (s === "config" && /alias\./i.test(args.join(" ")))) {
        block("Alias de git dá a volta nas travas (`alias.p=push`). Config do git é do humano.");
      }
      if (s === "config") {
        const soLeitura = tem("--get", "--get-all", "--list", "-l", "--get-regexp") || args.filter((a) => !a.startsWith("-")).length < 2;
        if (!soLeitura || tem("--unset", "--unset-all", "--replace-all", "--add", "-e", "--edit")) {
          block("Mudar a config do git (inclusive user, hooks, alias) é do humano. Só leitura é permitida.");
        }
      }
      if (["push", "merge"].includes(s)) {
        block(`git ${s} é do humano ${SO_HUMANO}. Avise que a branch está pronta e pare.`);
      }
      if (REESCREVE_HISTORIA.includes(s) && !(s === "reflog" && args[0] === "show")) {
        block(`git ${s} reescreve ou apaga história: é do humano.`);
      }
      if (s === "reset" && tem("--hard")) block("git reset --hard descarta trabalho sem volta. Peça ao humano.");
      if (s === "clean" && args.some((a) => /^-[a-zA-Z]*f/.test(a))) block("git clean -f apaga arquivos sem volta. Peça ao humano.");
      if (s === "branch" && (tem("-D") || (tem("--delete", "-d") && tem("--force", "-f")))) {
        block("Apagar branch à força não tem volta. Peça ao humano.");
      }
      if (s === "checkout" && args.includes("--") && args.some((a) => a === "." || a === "./")) {
        block("git checkout -- . descarta trabalho sem volta. Peça ao humano.");
      }
      if (s === "restore" && args.some((a) => a === "." || a === "./")) {
        block("git restore . descarta trabalho sem volta. Peça ao humano.");
      }
      if (s === "add" && (tem(".", "./", ":/", ":/.", "-A", "--all", "-u", "--update") || args.includes("*"))) {
        block("Nunca git add . ou -A. Adicione só os arquivos de Files: da tarefa, um por um (.agents/rules/commit.md).");
      }
      if (s === "add" && (tem("-f", "--force") || args.some((a) => /(^|\/)\.env(\.(?!example$)[^/]*)?$/.test(a.replace(/^["']|["']$/g, ""))))) {
        block("Nunca git add de arquivo .env* nem git add -f (força arquivo ignorado). Segredo não entra no git.");
      }
      if (s === "commit" && (tem("-a", "--all") || args.some((a) => /^-[a-zA-Z]*a[a-zA-Z]*m?$/.test(a) && !a.startsWith("--")))) {
        block("Nunca git commit -a. Adicione os arquivos da tarefa explicitamente e commite.");
      }
      if (s === "commit") {
        const ramo = ramoAtual(dir ? resolve(cwd, dir) : cwd);
        if (PROTEGIDAS.has(ramo)) {
          block(`Commit direto em ${ramo} não. O trabalho é na branch da demanda (demanda/<slug>); a ${ramo} só recebe merge do humano.`);
        }
      }
      if (sub && SO_ORQUESTRADORA.includes(s)) {
        block(`git ${s} é só da orquestradora. Implementador não commita nem mexe no índice (.agents/rules/commit.md). Termine o relato e devolva.`);
      }
    }
  }
}

principal(import.meta.url, checar);
