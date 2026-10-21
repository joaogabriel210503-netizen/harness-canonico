#!/usr/bin/env node
// Parte do selftest que precisa de um repositório git de verdade: gates.lock,
// pre-commit, pre-push, varredura de segredo no stage e doctor. Chamado por
// selftest.mjs; também roda sozinho: node .claude/hooks/selftest-git.mjs
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const GITHOOKS = [join(AQUI, "..", "..", ".githooks"), join(AQUI, "..", "..", "..", ".githooks")].find((d) => existsSync(d));
if (!GITHOOKS) {
  console.log("FALHOU selftest-git       não achei a pasta .githooks ao lado do kit");
  process.exit(1);
}
const RAIZ_KIT = dirname(GITHOOKS);
const g = mkdtempSync(join(tmpdir(), "harness-git-"));
const casa = mkdtempSync(join(tmpdir(), "harness-casa-"));
const AWS = `${"AK"}${"IA"}ABCDEFGHIJKLMNOP`;

const w = (rel, txt) => {
  mkdirSync(dirname(join(g, rel)), { recursive: true });
  writeFileSync(join(g, rel), txt);
};
const run = (cmd, args, env = {}) =>
  spawnSync(cmd, args, { cwd: g, encoding: "utf8", env: { ...process.env, HOME: casa, HARNESS_BYPASS: "", ...env } });
const git = (...a) => run("git", a);
const node = (arq, env) => run("node", [join(g, arq)], env);
const pkg = (scripts) => JSON.stringify({ name: "x", private: true, scripts }, null, 2);
const OK = { lint: "node -e 0", typecheck: "node -e 0", "lint:typed": "node -e 0", test: "node -e 0", "gates:verify": "node -e 0", "gates:selftest": "node -e 0" };

let falhas = 0;
function caso(nome, r, esperado, contem) {
  const ok = r.status === esperado && (contem === undefined || `${r.stdout}${r.stderr}`.includes(contem));
  if (!ok) falhas++;
  console.log(`${ok ? "OK    " : "FALHOU"} git/gates          ${nome.padEnd(66)} saída=${r.status} esperado=${esperado}${ok ? "" : ` | ${`${r.stderr}${r.stdout}`.trim().slice(0, 160)}`}`);
}

// repositório descartável com o .githooks do kit
for (const f of ["gates-lib.mjs", "verificar-gates.mjs", "travar-gates.mjs", "secret-scan.mjs", "pre-commit", "pre-push", "instalar.sh"]) {
  mkdirSync(join(g, ".githooks"), { recursive: true });
  copyFileSync(join(GITHOOKS, f), join(g, ".githooks", f));
}
git("init", "-q", "-b", "main");
git("config", "user.email", "t@t");
git("config", "user.name", "t");
git("symbolic-ref", "HEAD", "refs/heads/demanda/x");
const verificar = (env) => node(".githooks/verificar-gates.mjs", env);
const travar = () => node(".githooks/travar-gates.mjs");
const preCommit = (env, path) => run("/bin/sh", [".githooks/pre-commit"], { ...env, ...(path ? { PATH: path } : {}) });

// Lock inicial próprio (docsOnly), gerado aqui: não depende do gates.lock do projeto,
// que num projeto travado com package.json é docsOnly:false (teste-mac defeito 2).
travar();

// ---- gates.lock
caso("só documentação (docsOnly), sem código: passa", verificar(), 0);
w("src/a.ts", "export const a = 1;\n");
git("add", "src/a.ts");
caso("docsOnly mas há código no commit: reprova", verificar(), 1, "só documentação");
git("rm", "-q", "--cached", "src/a.ts");
rmSync(join(g, "src"), { recursive: true });
w("backend/package.json", pkg({ lint: "node -e 0", typecheck: "node -e 0", test: "node -e 0" }));
caso("backend/package.json existe e o lock diz docsOnly: reprova", verificar(), 1, "só documentação");
caso("travar-gates com script lint ausente: recusa", (() => { w("backend/package.json", pkg({ test: "node -e 0" })); return travar(); })(), 1, "lint");
w("backend/package.json", pkg(OK));
w("backend/eslint.config.mjs", "export default [];\n");
caso("travar-gates com backend/ (sem package.json na raiz): grava", travar(), 0);
caso("lock confere", verificar(), 0);
w("backend/package.json", pkg({ ...OK, lint: "echo ok" }));
caso('"lint" trocado por "echo ok": reprova (N14)', verificar(), 1, "package.json#scripts");
w("backend/package.json", pkg({ ...OK, lint: "eslint . || true" }));
caso('"lint" com "|| true": reprova', verificar(), 1);
w("backend/package.json", pkg(OK));
caso("script restaurado: passa", verificar(), 0);
w("backend/eslint.config.mjs", "export default [{ rules: { 'max-lines': 'off' } }];\n");
caso("backend/eslint.config.mjs alterado: reprova", verificar(), 1, "eslint.config.mjs");
travar();
w("backend/biome.jsonc", "{}\n");
caso("biome.jsonc novo depois do lock: reprova", verificar(), 1, "biome.jsonc");
travar();
w("backend/sem-supressao.mjs", "process.exit(0);\n");
caso("sem-supressao.mjs novo depois do lock: reprova", verificar(), 1, "sem-supressao.mjs");
travar();
w("backend/sem-supressao.mjs", "process.exit(1);\n");
caso("sem-supressao.mjs alterado: reprova", verificar(), 1, "sem-supressao.mjs");
travar();
w("backend/tsconfig.json", "{}\n");
caso("tsconfig.json novo depois do lock: reprova", verificar(), 1, "tsconfig.json");
travar();
w("backend/eslint-rules/x.cjs", "module.exports = {};\n");
caso("eslint-rules/ alterado: reprova", verificar(), 1, "eslint-rules");
travar();
w("frontend/package.json", pkg(OK));
caso("segundo pacote (frontend/) sem travar: reprova", verificar(), 1, "frontend/package.json");
travar();
caso("listar mostra backend e frontend", (() => { const r = verificar(); return { status: r.status, stdout: "", stderr: "" }; })(), 0);
const lista = node(".githooks/verificar-gates.mjs").status === 0 ? run("node", [join(g, ".githooks/verificar-gates.mjs"), "--listar"]).stdout : "";
const listaOk = lista.includes("backend") && lista.includes("frontend");
if (!listaOk) falhas++;
console.log(`${listaOk ? "OK    " : "FALHOU"} git/gates          --listar imprime as duas pastas`);
rmSync(join(g, ".githooks", "gates.lock.json"));
caso("lock apagado: reprova", verificar(), 1, "não existe");
travar();

// ---- pre-commit
caso("pre-commit em demanda/x com tudo certo", preCommit(), 0);
w("backend/package.json", pkg({ ...OK, lint: "node -e \"process.exit(1)\"" }));
travar();
caso("pre-commit com lint que reprova: barra", preCommit(), 1, "lint reprovou");
w("backend/package.json", pkg(OK));
travar();
caso("pre-commit: gates.lock desatualizado: barra", (() => { w("backend/package.json", pkg({ ...OK, test: "echo ok" })); return preCommit(); })(), 1, "gates.lock");
w("backend/package.json", pkg(OK));
travar();
git("symbolic-ref", "HEAD", "refs/heads/main");
caso("pre-commit na main: barra", preCommit(), 1, "main");
caso("pre-commit na main com HARNESS_COMMIT_MAIN=1 (humano): passa", preCommit({ HARNESS_COMMIT_MAIN: "1" }), 0);
git("symbolic-ref", "HEAD", "refs/heads/demanda/x");
w(".env", "X=1\n");
git("add", "-f", ".env");
caso("pre-commit com .env no stage: barra", preCommit(), 1, ".env");
git("rm", "-q", "--cached", ".env");
rmSync(join(g, ".env"));
w("backend/seg.ts", `export const k = "${AWS}";\n`);
git("add", "backend/seg.ts");
caso("pre-commit com chave AWS no stage: barra", preCommit(), 1, "segredo");
git("rm", "-q", "--cached", "backend/seg.ts");
rmSync(join(g, "backend", "seg.ts"));
w("backend/task-management-panel.tsx", "export const a = 1;\n");
git("add", "backend/task-management-panel.tsx");
caso("pre-commit com arquivo de nome comprido (sem falso positivo)", preCommit(), 0);
git("rm", "-q", "--cached", "backend/task-management-panel.tsx");
const semNode = mkdtempSync(join(tmpdir(), "harness-bin-"));
symlinkSync(spawnSync("which", ["git"], { encoding: "utf8" }).stdout.trim(), join(semNode, "git"));
caso("pre-commit sem node no PATH: barra (falha fechada)", preCommit({}, semNode), 1, "node não encontrado");
rmSync(semNode, { recursive: true, force: true });

// ---- instalar.sh e pre-push
const inst = run("sh", [".githooks/instalar.sh"]);
caso("instalar.sh instala pre-commit e pre-push", inst, 0);
const hooksDir = git("rev-parse", "--path-format=absolute", "--git-path", "hooks").stdout.trim();
const iguais = ["pre-commit", "pre-push"].every((h) => existsSync(join(hooksDir, h)) && readFileSync(join(hooksDir, h), "utf8") === readFileSync(join(g, ".githooks", h), "utf8"));
if (!iguais) falhas++;
console.log(`${iguais ? "OK    " : "FALHOU"} git/gates          hooks instalados são idênticos aos de .githooks/`);
caso("pre-push com todos os scripts: passa", run("/bin/sh", [".githooks/pre-push"]), 0);
w("backend/package.json", pkg({ lint: "node -e 0", typecheck: "node -e 0", "lint:typed": "node -e 0", "gates:verify": "node -e 0", "gates:selftest": "node -e 0" }));
travar();
caso('pre-push sem o script "test": barra', run("/bin/sh", [".githooks/pre-push"]), 1, '"test"');
w("backend/package.json", pkg({ ...OK, test: "node -e \"process.exit(1)\"" }));
travar();
caso("pre-push com teste quebrado: barra", run("/bin/sh", [".githooks/pre-push"]), 1, "reprovou");
w("backend/package.json", pkg(OK));
travar();

// ---- doctor
mkdirSync(join(g, ".claude", "hooks"), { recursive: true });
copyFileSync(join(AQUI, "..", "settings.json"), join(g, ".claude", "settings.json"));
w("AGENTS.md", "# x\n");
w(".agents/memory/MEMORY.md", "# Índice\n");
copyFileSync(join(RAIZ_KIT, ".gitignore"), join(g, ".gitignore"));
const doctor = (env) => run("node", [join(AQUI, "doctor.mjs")], { CLAUDE_PROJECT_DIR: g, ...env });
caso("doctor: tudo instalado e travado", doctor(), 0);
rmSync(join(g, ".agents", "memory", "MEMORY.md"));
caso("doctor: memória sem índice reprova", doctor(), 1, "Memória");
w(".agents/memory/MEMORY.md", "# Índice\n");
const cfgG = JSON.parse(readFileSync(join(g, ".claude", "settings.json"), "utf8"));
cfgG.hooks.PreToolUse.push({ matcher: "Glob|Grep", hooks: [{ type: "command", command: "echo graphify" }] });
w(".claude/settings.json", JSON.stringify(cfgG));
caso("doctor: hook de terceiro (graphify) sem onFailure não reprova", doctor(), 0);
delete cfgG.hooks.PreToolUse[0].hooks[0].onFailure;
w(".claude/settings.json", JSON.stringify(cfgG));
caso("doctor: guarda do harness sem onFailure:block reprova", doctor(), 1, "onFailure");
copyFileSync(join(AQUI, "..", "settings.json"), join(g, ".claude", "settings.json"));
rmSync(join(hooksDir, "pre-push"));
caso("doctor: pre-push sumiu do .git/hooks", doctor(), 1, "pre-push");
run("sh", [".githooks/instalar.sh"]);
git("config", "core.hooksPath", "/dev/null");
caso("doctor: core.hooksPath definido", doctor(), 1, "core.hooksPath");
git("config", "--unset", "core.hooksPath");
w(".claude/settings.local.json", JSON.stringify({ hooks: {} }));
caso("doctor: settings.local.json com hooks", doctor(), 1, "settings.local.json");
rmSync(join(g, ".claude", "settings.local.json"));
mkdirSync(join(casa, ".claude"), { recursive: true });
writeFileSync(join(casa, ".claude", "settings.json"), JSON.stringify({ disableAllHooks: true }));
caso("doctor: disableAllHooks no settings do usuário", doctor(), 1, "disableAllHooks");

rmSync(g, { recursive: true, force: true });
rmSync(casa, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} caso(s) de git/gates falharam.` : "\nCasos de git/gates: todos como esperado.");
process.exit(falhas ? Math.min(falhas, 250) : 0);
