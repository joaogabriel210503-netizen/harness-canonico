// Casos dos hooks, parte 2: commit, plano, escopo, despacho e segredo.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AQUI, AWS, CHAVE_PRIVADA, T, bash, caso, edita, ferr, escreve, estado, raiz, roda, sub, w } from "./selftest-lib.mjs";

// ---- commit-guard
const C = "commit-guard.mjs";
for (const [c, esp] of [
  ["git push origin demanda/demo", 2], ["git push -f", 2], ["git commit --no-verify -m x", 2], ["git commit -n -m x", 2],
  ["git add .", 2], ["git add -A", 2], ["git commit -am 'x'", 2], ["git commit --no-verif -m x", 2],
  ["git -c core.hooksPath=/dev/null commit -m x", 2], ["git config core.hooksPath /dev/null", 2],
  ["rm -rf .git/hooks/pre-commit", 2], ["git add \".\"", 2], ["git add ./", 2], ["git checkout -- .", 2], ["git restore .", 2],
  ["git branch --delete --force x", 2], ["gh pr merge 12", 2], ["git commit -m \"feat: x\"; git push", 2], ["FOO=1 git push", 2],
  ["git merge demanda/demo", 2], ["git -C . reset --hard HEAD~1", 2],
  // N08: os atalhos
  ["git config alias.p push && git p", 2], ["git -c alias.p=push p", 2], ["sh -c \"git push\"", 2], ["bash -c 'git push origin x'", 2],
  ["eval \"git push\"", 2], ["gh api -X PUT repos/o/r/pulls/1/merge", 2], ["gh api repos/o/r/pulls/1/merge -f x=1", 2],
  ["gh pr create --fill", 2], ["gh repo delete o/r", 2], ["gh pr view 3", 0], ["gh api repos/o/r/pulls/1", 0],
  ["git config user.name x", 2], ["git config --get user.name", 0], ["git config --global user.email a@b", 2],
  ["git update-ref -d HEAD", 2], ["git filter-branch --all", 2], ["git reflog show", 0],
  ["HUSKY=0 git commit -m x", 2], ["SKIP=lint git commit -m x", 2],
  // segredo no git
  ["git add .env", 2], ["git add backend/.env", 2], ["git add .env.production", 2], ["git add .env.example", 0],
  ["git add -f src/a.ts", 2],
  ["git add src/a.ts && git commit -m \"feat(a): x [T01]\"", 0],
  ["git commit -m \"docs: nunca use git push nem -a\"", 0],
  ["git commit -m \"$(cat <<'EOF'\nfeat: x\n\ngit push --force\nEOF\n)\"", 0],
  ["npm test", 0], ["git status && git diff --stat", 0],
]) caso(`${c.replace(/\n/g, "\\n").slice(0, 62)}`, C, bash(c), esp);
caso("subagente: git commit", C, bash("git commit -m \"feat: x\"", sub("backend-specialist")), 2);
caso("subagente: git add arquivo", C, bash("git add src/a.ts", sub("backend-specialist")), 2);
caso("subagente: git status / diff (leitura)", C, bash("git status && git diff --stat", sub("code-reviewer")), 0);
caso("commit-guard falha FECHADA com JSON inválido", C, {}, 2, {}, "{quebrado");
// N09: commit na main
spawnSync("git", ["-C", raiz, "init", "-q", "-b", "main"]);
caso("commit na branch main", C, bash("git commit -m \"feat: x\""), 2);
spawnSync("git", ["-C", raiz, "symbolic-ref", "HEAD", "refs/heads/demanda/demo"]);
caso("commit na branch demanda/demo", C, bash("git add src/a.ts && git commit -m \"feat: x\""), 0);

// ---- plano-guard
const P = "plano-guard.mjs";
const codigo = escreve("src/a.ts", "export const a = 1;\n");
caso("sem docs/fluxo: editar código", P, codigo, 2);
caso("sem docs/fluxo: editar docs/", P, escreve("docs/definicao/prd.md"), 0);
caso("sem docs/fluxo: editar README.md", P, escreve("README.md"), 0);
caso("worktree: código em .claude/worktrees/w/src/a.ts (N06)", P, escreve(".claude/worktrees/w/src/a.ts"), 2);
caso("código em .maestri/ sem plano", P, escreve(".maestri/x.ts"), 2);
const SPEC = "docs/superpowers/specs/s.md";
const PLANO = "docs/superpowers/plans/p.md";
const h12 = (rel) => createHash("sha256").update(readFileSync(join(raiz, rel))).digest("hex").slice(0, 12);
const FALSO = "aaaaaaaaaaaa";
const aprova = (spec, plano) => w("docs/fluxo/demo/estado.md", estado(spec, plano));
const linha = (arq, frase, data = "2026-10-06", hash = h12(arq)) => `${arq} | "${frase}" | ${data} | ${hash}`;
const PLANO_OK = "# Plano\n\n### T01 Algo\n- **Files:** `src/a.ts`, `src/lib/**`\n- **Resources:** nenhum\n";
const SPEC_OK = "# SPEC\n\n## Consultas feitas\n- Vault: nada\n\n## Critérios de aceite\n- x\n";
aprova(`${SPEC} | "Aprovo a SPEC." | 2026-10-06 | ${FALSO}`, " | | | ");
caso("SPEC aprovada, plano não", P, codigo, 2);
aprova(`${SPEC} | "Aprovo a SPEC." | 2026-10-06 | ${FALSO}`, `${PLANO} | "Aprovo o plano." | 2026-10-06 | ${FALSO}`);
caso("as duas aprovadas, SPEC inexistente", P, codigo, 2);
w(SPEC, "# SPEC\n");
caso("SPEC existe, plano inexistente", P, codigo, 2);
w(PLANO, PLANO_OK);
w(SPEC, "# SPEC\n\n## Critérios de aceite\n- x\n");
aprova(linha(SPEC, "Aprovo a SPEC."), linha(PLANO, "Aprovo o plano."));
caso("SPEC aprovada sem 'Consultas feitas'", P, codigo, 2);
w(SPEC, SPEC_OK);
aprova(linha(SPEC, "Aprovo a SPEC."), linha(PLANO, "Aprovo o plano."));
caso("tudo aprovado, hash conferindo, arquivo em Files:", P, codigo, 0);
caso("worktree: código aprovado em .claude/worktrees/w/src/a.ts", P, escreve(".claude/worktrees/w/src/a.ts"), 0);
// W2: escopo por Files:
caso("arquivo fora de qualquer Files:", P, escreve("src/b.ts"), 2);
caso("arquivo coberto por glob de Files: (src/lib/**)", P, escreve("src/lib/x/y.ts"), 0);
caso("Edit também respeita Files:", P, edita("src/outro.ts"), 2);
caso("docs/ segue livre", P, escreve("docs/qualquer.md"), 0);
// W2: hash da aprovação
w(SPEC, `${SPEC_OK}\n- critério novo, depois da aprovação\n`);
caso("SPEC mudou depois da aprovação (hash não bate)", P, codigo, 2);
w(SPEC, SPEC_OK);
w(PLANO, `${PLANO_OK}### T02 Outra\n- **Files:** \`src/b.ts\`\n- **Resources:** nenhum\n`);
caso("plano mudou depois da aprovação (hash não bate)", P, escreve("src/b.ts"), 2);
aprova(linha(SPEC, "Aprovo a SPEC."), linha(PLANO, "Aprovo o plano."));
caso("plano reaprovado com o hash novo libera o arquivo novo", P, escreve("src/b.ts"), 0);
w(PLANO, PLANO_OK);
aprova(`${SPEC} | "Aprovo a SPEC." | 2026-10-06 |`, linha(PLANO, "Aprovo o plano."));
caso("SPEC aprovada sem hash", P, codigo, 2);
aprova(linha(SPEC, "Aprovo a SPEC.", ""), linha(PLANO, "Aprovo o plano."));
caso("SPEC aprovada sem data", P, codigo, 2);
// W2: forma do plano
for (const [nome, texto] of [
  ["plano sem tarefas com ID", "# Plano\n\nsó texto\n"],
  ["tarefa sem Files:", "# Plano\n\n### T01 Algo\n- **Resources:** nenhum\n"],
  ["tarefa sem Resources:", "# Plano\n\n### T01 Algo\n- **Files:** `src/a.ts`\n"],
  ["Files: sem caminho entre crases", "# Plano\n\n### T01 Algo\n- **Files:** src/a.ts\n- **Resources:** nenhum\n"],
]) {
  w(PLANO, texto);
  aprova(linha(SPEC, "Aprovo a SPEC."), linha(PLANO, "Aprovo o plano."));
  caso(nome, P, codigo, 2);
}
w(PLANO, PLANO_OK);
aprova(linha(SPEC, "Aprovo a SPEC."), linha(PLANO, "Aprovo o plano."));
w("docs/fluxo/demo/estado.md", readFileSync(join(raiz, "docs/fluxo/demo/estado.md"), "utf8").replace("**Etapa atual:** E5", "**Etapa atual:** concluída"));
caso("demanda concluída não libera código", P, codigo, 2);
aprova(linha(SPEC, "Aprovo a SPEC."), linha(PLANO, "Aprovo o plano."));
caso("bypass do humano sem aprovação", P, escreve("src/zzz.ts"), 0, { HARNESS_BYPASS: "1" });
// N01: nada que quebre pode liberar código
const raizQuebrada = mkdtempSync(join(tmpdir(), "harness-quebrada-"));
w("docs/fluxo", "isto é um arquivo, não uma pasta", raizQuebrada);
caso("docs/fluxo é um arquivo (EISDIR/ENOTDIR): bloqueia", P, escreve("src/a.ts"), 2, {}, undefined, raizQuebrada);
mkdirSync(join(raizQuebrada, "docs", "x"), { recursive: true });
rmSync(join(raizQuebrada, "docs", "fluxo"));
mkdirSync(join(raizQuebrada, "docs", "fluxo", "x", "estado.md"), { recursive: true });
caso("estado.md é uma pasta (mkdir -p docs/fluxo/x/estado.md): bloqueia", P, escreve("src/a.ts"), 2, {}, undefined, raizQuebrada);
caso("entrada 'null': falha FECHADA", P, {}, 2, {}, "null");
rmSync(raizQuebrada, { recursive: true, force: true });

// ---- escopo-guard
const E = "escopo-guard.mjs";
caso("code-reviewer escreve código", E, escreve("src/a.ts", "x", sub("code-reviewer")), 2);
caso("code-reviewer escreve o relato", E, escreve("docs/fluxo/demo/revisao-wave-1.md", "x", sub("code-reviewer")), 0);
caso("validador-visual escreve código", E, edita("src/a.tsx", "x", sub("validador-visual")), 2);
caso("test-engineer escreve código de produto", E, escreve("src/a.ts", "x", sub("test-engineer")), 2);
caso("test-engineer escreve mock em __mocks__", E, escreve("src/__mocks__/db.ts", "x", sub("test-engineer")), 0);
caso("test-engineer escreve fixture", E, escreve("src/fixtures/user.ts", "x", sub("test-engineer")), 0);
caso("test-engineer escreve setupTests.ts", E, escreve("src/setupTests.ts", "x", sub("test-engineer")), 0);
caso("test-engineer escreve teste", E, escreve("src/a.test.ts", "x", sub("test-engineer")), 0);
caso("debugger escreve em tests/", E, escreve("tests/repro.ts", "x", sub("debugger")), 0);
caso("backend-specialist escreve a memória (.agents/memory)", E, escreve(".agents/memory/MEMORY.md", "x", sub("backend-specialist")), 2);
caso("backend-specialist escreve código", E, escreve("src/a.ts", "x", sub("backend-specialist")), 0);
// N17: a sessão principal orquestra, não implementa
caso("sessão principal escreve código", E, escreve("src/a.ts"), 2);
caso("sessão principal escreve docs/", E, escreve("docs/definicao/prd.md"), 0);
caso("sessão principal escreve README.md", E, escreve("README.md"), 0);
caso("sessão principal escreve .agents/memory/", E, escreve(".agents/memory/MEMORY.md"), 0);
caso("sessão principal escreve fora do projeto (/tmp)", E, escreve("/tmp/x.txt"), 0);
caso("orquestrador (agent_type) escreve código", E, escreve("src/a.ts", "x", sub("orquestrador")), 2);
caso("tech-lead escreve docs/fluxo", E, escreve("docs/fluxo/demo/definicao.md", "x", sub("tech-lead")), 0);
caso("sessão principal com bypass do humano", E, escreve("src/a.ts"), 0, { HARNESS_BYPASS: "1" });
caso("escopo-guard falha FECHADA com JSON inválido", E, {}, 2, {}, "{quebrado");

// ---- despacho-guard (N17, B10)
w(".claude/agents/backend-specialist.md", "---\nname: backend-specialist\ndescription: x\n---\n");
w(".claude/agents/code-reviewer.md", "---\nname: code-reviewer\nmodel: opus\n---\n");
w(".claude/agents/debugger.md", "---\nname: debugger\nmodel: inherit\n---\n");
const D = "despacho-guard.mjs";
const desp = (tipo, extra = {}, tool = "Agent") => ferr(tool, { description: "x", prompt: "y", ...(tipo === undefined ? {} : { subagent_type: tipo }), ...extra });
caso("despacho general-purpose", D, desp("general-purpose", { model: "sonnet" }), 2);
caso("despacho sem subagent_type (vira general-purpose)", D, desp(undefined, { model: "sonnet" }), 2);
caso("despacho de persona inexistente", D, desp("hacker", { model: "sonnet" }), 2);
caso("despacho persona com model no despacho", D, desp("backend-specialist", { model: "sonnet" }), 0);
caso("despacho persona sem model (frontmatter sem model)", D, desp("backend-specialist"), 2);
caso("despacho persona com model fixo no frontmatter", D, desp("code-reviewer"), 0);
caso("despacho persona com model: inherit e sem model", D, desp("debugger"), 2);
caso("ferramenta Task também é conferida", D, desp("general-purpose", { model: "sonnet" }, "Task"), 2);
caso("ferramenta que não é despacho", D, ferr("Read", { file_path: "a" }), 0);
caso("despacho-guard falha FECHADA com JSON inválido", D, {}, 2, {}, "{quebrado");

// ---- segredo-guard (N15)
const S0 = "segredo-guard.mjs";
caso("Write com chave AWS", S0, escreve("src/a.ts", `const k = "${AWS}";\n`), 2);
caso("Write com chave privada", S0, escreve("src/a.ts", `${CHAVE_PRIVADA}\n`), 2);
caso("Write com URL de banco com senha de verdade", S0, escreve("src/a.ts", `const u = '${["postgres", "://app:S3nhaMuitoReal@db:5432/x"].join("")}';\n`), 2);
caso("Write com URL de banco com placeholder", S0, escreve("README.md", "postgres://usuario:senha@localhost:5432/x\n"), 0);
caso("Edit com token em new_string", S0, edita("src/a.ts", `x ${AWS}`), 2);
caso("Bash com chave no comando", S0, bash(`curl -H "x: ${AWS}" https://exemplo`), 2);
caso("caminho src/task-management-panel.tsx (sem falso positivo)", S0, escreve("src/task-management-panel.tsx", "export const a = 1;\n"), 0);
caso("texto limpo", S0, escreve("src/a.ts", "export const a = 1;\n"), 0);

