// Casos dos hooks, parte 1: vault-guard e rules-guard.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AQUI, AWS, CHAVE_PRIVADA, T, bash, caso, edita, ferr, escreve, estado, raiz, roda, sub, w } from "./selftest-lib.mjs";

// ---- vault-guard
const V = "vault-guard.mjs";
caso("Read em vault/03-conhecimento", V, ferr("Read", { file_path: join(raiz, "vault/03-conhecimento/x.md") }), 2);
caso("Write em vault/01-projetos", V, escreve("vault/01-projetos/x.md", "a"), 2);
caso("Grep com path em vault/", V, ferr("Grep", { pattern: "foo", path: "vault/01-projetos" }), 2);
caso("Grep procurando o texto 'vault/' (é pattern, não path)", V, ferr("Grep", { pattern: "vault/" }), 0);
caso("Glob em vault/**", V, ferr("Glob", { pattern: "vault/**/*.md" }), 2);
caso("Read com ../ saindo para vault/", V, ferr("Read", { file_path: "vault/daily/../01-projetos/x.md" }), 2);
caso("Read em Vault/ (maiúscula, macOS)", V, ferr("Read", { file_path: "Vault/x.md" }), 2);
caso("Read em vault/daily (exceção de leitura)", V, ferr("Read", { file_path: "vault/daily/2026-10-06.md" }), 0);
caso("Write em vault/daily", V, escreve("vault/daily/2026-10-06.md", "a"), 2);
caso("Bash: cat vault/x.md", V, bash("cat vault/x.md"), 2);
caso("Bash: git add vault/", V, bash("git add vault/"), 0);
caso("Bash: echo x >vault/a.md (sem espaço)", V, bash("echo x >vault/a.md"), 2);
caso("Bash: git status && cat vault/x.md", V, bash("git status && cat vault/x.md"), 2);
caso("Bash: ls vault", V, bash("ls vault"), 2);
caso("Bash: grep -r foo vault", V, bash("grep -r foo vault"), 2);
caso("Bash: grep -n vault AGENTS.md (busca o texto)", V, bash("grep -n vault AGENTS.md"), 0);
caso("Bash: ls .agents/templates/vault-skeleton", V, bash("ls .agents/templates/vault-skeleton"), 0);
caso("Bash: cat src/vault/x.ts", V, bash("cat src/vault/x.ts"), 0);
caso("Read em src/a.ts", V, ferr("Read", { file_path: "src/a.ts" }), 0);
caso("entrada 'null': a trava falha FECHADA", V, {}, 2, {}, "null");
caso("entrada JSON inválido: a trava falha FECHADA", V, {}, 2, {}, "{quebrado");
caso("MCP do vault pessoal (servidor obsidian)", V, { tool_name: "mcp__obsidian__create_note_tool", tool_input: {}, cwd: raiz }, 2);
caso("MCP do vault do projeto (harness-vault)", V, { tool_name: "mcp__harness-vault__create_note_tool", tool_input: {}, cwd: raiz }, 0);
caso("bypass do humano", V, ferr("Read", { file_path: "vault/x.md" }), 0, { HARNESS_BYPASS: "1" });

// ---- rules-guard: arquivos de regra, em qualquer profundidade
const R = "rules-guard.mjs";
for (const p of [
  "eslint.config.mjs", "eslint.typed.config.mjs", "backend/eslint.config.mjs", "eslint-rules/index.cjs", "frontend/eslint-rules/x.cjs",
  ".claude/hooks/vault-guard.mjs", ".claude/settings.json", ".claude/settings.local.json", ".claude/agents/debugger.md",
  "AGENTS.md", "CLAUDE.md", ".agents/stack.md", ".agents/rules/gates.md", ".agents/templates/gates-web/eslint.config.mjs",
  "tsconfig.json", "backend/tsconfig.build.json", "selftest.mjs", "vitest.config.ts", "jest.config.js", "biome.json", "biome.jsonc", "backend/biome.jsonc", "sem-supressao.mjs", "frontend/sem-supressao.mjs",
  ".githooks/pre-commit", ".githooks/gates.lock.json", ".git/hooks/pre-commit", ".git/config", ".github/workflows/ci.yml",
  ".mcp.json", ".codex/config.toml", "opencode.json", "docs/fluxo/x/aprovacoes.json", ".claude/liberar-regras",
]) caso(`Write em ${p}`, R, escreve(p), 2);
caso("Edit em .agents/memory/MEMORY.md (permitido)", R, edita(".agents/memory/MEMORY.md"), 0);
caso("Edit ESLINT.config.mjs (maiúscula, macOS)", R, edita("ESLINT.config.mjs"), 2);
caso("Edit src/../.claude/settings.json (traversal)", R, edita("src/../.claude/settings.json"), 2);
caso("MultiEdit em .claude/settings.json", R, ferr("MultiEdit", { file_path: ".claude/settings.json", edits: [{ new_string: "x" }] }), 2);
caso("Write em src/generated/client.ts (gerado)", R, escreve("src/generated/client.ts"), 2);
// worktree: o prefixo .claude/worktrees/<n>/ não esconde nada (N06)
caso("worktree: Write em eslint.config.mjs", R, escreve(".claude/worktrees/w/eslint.config.mjs"), 2);
caso("worktree: Write em .claude/hooks/x.mjs", R, escreve(".claude/worktrees/w/.claude/hooks/x.mjs"), 2);
// symlink e caminho absoluto por outro nome (N07)
mkdirSync(join(raiz, ".claude", "hooks"), { recursive: true });
symlinkSync(join(raiz, ".claude"), join(raiz, "atalho"));
symlinkSync(raiz, `${raiz}-link`);
caso("symlink: Edit em atalho/hooks/x.mjs (aponta para .claude)", R, edita("atalho/hooks/x.mjs"), 2);
caso("caminho absoluto por link da raiz", R, edita(`${raiz}-link/.claude/settings.json`), 2);
// pastas do usuário que decidem como o agente roda (N10, B22)
caso("Write em ~/.claude/settings.json", R, escreve(join(homedir(), ".claude/settings.json")), 2);
caso("Write em ~/.zshrc", R, escreve(join(homedir(), ".zshrc")), 2);
caso("Write em ~/.claude/projects/x/memory/a.md (livre)", R, escreve(join(homedir(), ".claude/projects/x/memory/a.md")), 0);
// Bash que escreve em arquivo de regra
for (const [c, esp] of [
  ["sed -i 's/350/999/' eslint.config.mjs", 2],
  ["sed -i '' 's/a/b/' backend/eslint.config.mjs", 2],
  ["cat eslint.config.mjs", 0],
  ["node .claude/hooks/selftest.mjs 2>&1 | tail -3", 0],
  ["git diff AGENTS.md 2>/dev/null", 0],
  ["cp AGENTS.md /tmp/x", 0],
  ["cp /tmp/x AGENTS.md", 2],
  ["echo x > AGENTS.md", 2],
  ["echo x >>AGENTS.md", 2],
  ["echo x > \"AGENTS.md\"", 2],
  ["echo x &> AGENTS.md", 2],
  ["cat > AGENTS.md <<'EOF'\nnovo\nEOF", 2],
  ["cat > docs/a.md <<'EOF'\nrm eslint.config.mjs\nEOF", 0],
  ["touch .claude/liberar-regras", 2],
  ["tee -a tsconfig.json < /dev/null", 2],
  ["rm -rf .claude/hooks", 2],
  ["mv eslint.config.mjs /tmp/x", 2],
  ["ln -s .claude c", 2],
  ["dd if=/dev/null of=AGENTS.md", 2],
  ["echo x > .git/hooks/pre-commit", 2],
  ["chmod -x .git/hooks/pre-commit", 2],
  ["cp /dev/null .git/hooks/pre-commit", 2],
  ["echo '{}' > .claude/settings.local.json", 2],
  ["echo x >> ~/.zshrc", 2],
  ["echo x > $HOME/.claude/settings.json", 2],
  ["git checkout HEAD~1 -- eslint.config.mjs", 2],
  ["git restore --source=HEAD~1 tsconfig.json", 2],
  ["git status && git log --oneline", 0],
  ["sh -c \"echo x > AGENTS.md\"", 2],
  ["bash -c 'rm -rf .claude/hooks'", 2],
  ["echo $(echo x > AGENTS.md)", 2],
  ["eval \"echo x > AGENTS.md\"", 2],
  ["xargs rm < lista-eslint.config.mjs", 0],
  ["echo a | xargs rm AGENTS.md", 2],
]) caso(`Bash: ${c.replace(/\n/g, "\\n").slice(0, 52)}`, R, bash(c), esp);
// sessão aninhada e variável do harness (N10)
for (const [c, esp] of [
  ["HARNESS_BYPASS=1 claude -p 'x'", 2],
  ["export HARNESS_BYPASS=1; npm test", 2],
  ["env HARNESS_BYPASS=1 npm test", 2],
  ["claude -p 'faça x'", 2],
  ["codex exec 'faça x'", 2],
  ["opencode run 'x'", 2],
  ["sh -c \"codex exec x\"", 2],
  ["claude --version", 0],
  ["node .githooks/travar-gates.mjs", 2],
  ["npx biome lint --write --suppress src", 2],
  ["npx @biomejs/biome check --unsafe --write .", 2],
  ["sh -c 'npx biome lint --suppress'", 2],
  ["npx biome check --write src", 0],
  ["npx biome check .", 0],
  ["echo x >> sem-supressao.mjs", 2],
  ["sed -i 's/ignore/x/' biome.jsonc", 2],
  ["sh -c 'node .githooks/travar-gates.mjs'", 2],
  ["grep -n HARNESS_BYPASS AGENTS.md", 0],
  ["maestri ask Codex 'revise'", 0],
]) caso(`Bash: ${c.slice(0, 52)}`, R, bash(c), esp);
// interpretador com código inline que cita arquivo de regra
for (const [c, esp] of [
  ["node -e \"require('fs').writeFileSync('eslint.config.mjs','x')\"", 2],
  ["python3 -c \"open('AGENTS.md','w').write('x')\"", 2],
  ["perl -e 'unlink \".claude/hooks/x.mjs\"'", 2],
  ["node <<'EOF'\nrequire('fs').writeFileSync('tsconfig.json','{}')\nEOF", 2],
  ["echo 'x' | node", 0],
  ["node -e \"console.log(1+1)\"", 0],
  ["python3 -c \"print('ola')\"", 0],
]) caso(`Bash: ${c.replace(/\n/g, "\\n").slice(0, 52)}`, R, bash(c), esp);
// atalhos que calam o verificador
caso("NotebookEdit com eslint-disable", R, ferr("NotebookEdit", { notebook_path: "src/a.mjs", new_source: "// eslint-disable" }), 2);
caso("arquivo .mts com @ts-ignore", R, escreve("src/a.mts", "// @ts-ignore\nx"), 2);
caso("código com eslint-disable", R, escreve("src/a.ts", "// eslint-disable-next-line\nconst a = 1;"), 2);
caso("código com /* eslint max-lines: off */ (N12)", R, escreve("src/a.ts", "/* eslint max-lines: \"off\" */\nconst a = 1;"), 2);
caso("código com biome-ignore", R, escreve("src/a.ts", "// biome-ignore lint: x\nconst a = 1;"), 2);
caso("código com @ts-ignore", R, edita("src/a.ts", "// @ts-ignore\nx"), 2);
caso("teste com it.skip(", R, escreve("src/a.test.ts", "it.skip('x', () => {})"), 2);
caso("teste com describe.only(", R, escreve("src/a.test.ts", "describe.only('x', () => {})"), 2);
caso("código limpo", R, escreve("src/a.ts", "export const a = 1;\n"), 0);
caso("trava falha FECHADA com JSON inválido", R, {}, 2, {}, "{quebrado");
writeFileSync(join(raiz, "x"), "");
mkdirSync(join(raiz, ".claude"), { recursive: true });
writeFileSync(join(raiz, ".claude", "liberar-regras"), "");
caso("Edit em eslint.config.mjs com liberar-regras", R, edita("eslint.config.mjs"), 0);
rmSync(join(raiz, ".claude", "liberar-regras"));

