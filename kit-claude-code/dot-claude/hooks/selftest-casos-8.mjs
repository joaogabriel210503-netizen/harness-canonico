// Casos dos hooks, parte 8: guarda das CLIs externas (Codex, OpenCode), adaptadores do Codex e vault em TOML.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AQUI, T, raiz, w } from "./selftest-lib.mjs";

const G = join(AQUI, "guarda-externa.mjs");
// No kit os adaptadores ficam em kit-codex/ e kit-opencode/; no projeto instalado, em .codex/, .opencode/ e opencode.json.
const KIT = [join(AQUI, "..", ".."), join(AQUI, "..", "..", "..")].find((d) => existsSync(join(d, "kit-codex")) || existsSync(join(d, ".codex"))) ?? join(AQUI, "..", "..", "..");
const DONDE = (rel) =>
  rel
    .replace("kit-codex/dot-codex/", ".codex/")
    .replace("kit-opencode/dot-opencode/", ".opencode/")
    .replace("kit-opencode/opencode.json", "opencode.json");
const rodaG = (fonte, papel, ev, bruto) =>
  spawnSync("node", [G, fonte, papel], { input: bruto ?? JSON.stringify({ cwd: raiz, ...ev }), encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: raiz, HARNESS_BYPASS: "" } });
const caso = (nome, fonte, papel, ev, esperado, bruto) => {
  const r = rodaG(fonte, papel, ev, bruto);
  const ok = r.status === esperado;
  if (!ok) T.falhas++;
  console.log(`${ok ? "OK    " : "FALHOU"} guarda-externa.mjs  ${`${fonte}/${papel}: ${nome}`.padEnd(66)} saída=${r.status} esperado=${esperado}${ok ? "" : ` | ${r.stderr.trim()}`}`);
};
const patch = (...arqs) => ({ tool_name: "apply_patch", tool_input: { command: `*** Begin Patch\n${arqs.map((a) => `*** Update File: ${a}\n@@\n-a\n+b`).join("\n")}\n*** End Patch` } });
const sh = (command) => ({ tool_name: "Bash", tool_input: { command } });

w("docs/fluxo/x/estado.md", "# estado\n");
// Codex, papel tech-lead
caso("apply_patch em docs/definicao", "codex", "tech-lead", patch("docs/definicao/d.md"), 0);
caso("apply_patch em docs/fluxo", "codex", "tech-lead", patch("docs/fluxo/x/revisao-spec.md"), 0);
caso("apply_patch em src (código)", "codex", "tech-lead", patch("src/a.ts"), 2);
caso("apply_patch com um arquivo bom e um ruim", "codex", "tech-lead", patch("docs/fluxo/x/a.md", "src/b.ts"), 2);
caso("apply_patch em docs/ fora de definicao e fluxo", "codex", "tech-lead", patch("docs/superpowers/specs/s.md"), 2);
caso("apply_patch em .agents/rules (protegido)", "codex", "tech-lead", patch(".agents/rules/ondas.md"), 2);
caso("apply_patch em .claude/hooks", "codex", "tech-lead", patch(".claude/hooks/x.mjs"), 2);
caso("Bash: git commit", "codex", "tech-lead", sh("git commit -m x"), 2);
caso("Bash: git add .", "codex", "tech-lead", sh("git add ."), 2);
caso("Bash: git -C . push", "codex", "tech-lead", sh("git -C . push"), 2);
caso("Bash: sh -c 'git checkout main'", "codex", "tech-lead", sh("sh -c 'git checkout main'"), 2);
caso("Bash: git diff main...x (leitura)", "codex", "tech-lead", sh("git diff main...x"), 0);
caso("Bash: git status && git log", "codex", "tech-lead", sh("git status && git log --oneline"), 0);
caso("Bash: array bash -lc com git commit", "codex", "tech-lead", { tool_name: "shell", tool_input: { command: ["bash", "-lc", "git commit -m x"] } }, 2);
caso("Bash: echo x > src/a.ts", "codex", "tech-lead", sh("echo x > src/a.ts"), 2);
caso("Bash: echo x > docs/fluxo/x/a.md", "codex", "tech-lead", sh("echo x > docs/fluxo/x/a.md"), 0);
caso("Bash: cat vault/01-projetos/x.md", "codex", "tech-lead", sh("cat vault/01-projetos/x.md"), 2);
caso("Bash: ls src (leitura)", "codex", "tech-lead", sh("ls src"), 0);
caso("Bash: maestri ask com a frase de aprovação", "codex", "tech-lead", sh('maestri ask "Orquestrador" "Aprovo a SPEC."'), 2);
caso("Bash: maestri ask só com o caminho", "codex", "tech-lead", sh('maestri ask "Orquestrador" "ordem: docs/fluxo/x/ordem-01.md"'), 0);
caso("apply_patch com segredo no conteúdo", "codex", "tech-lead", { tool_name: "apply_patch", tool_input: { command: `*** Begin Patch\n*** Add File: docs/fluxo/x/s.md\n+chave AKIA${"ABCDEFGHIJKLMNOP"}\n*** End Patch` } }, 2);
caso("MCP: harness-vault-comum escrita", "codex", "tech-lead", { tool_name: "mcp__harness-vault-comum__create_note_tool", tool_input: {} }, 2);
caso("MCP: harness-vault leitura", "codex", "tech-lead", { tool_name: "mcp__harness-vault__read_note_tool", tool_input: {} }, 0);
caso("MCP: obsidian pessoal", "codex", "tech-lead", { tool_name: "mcp__obsidian__create_note", tool_input: {} }, 2);
caso("entrada ilegível bloqueia", "codex", "tech-lead", undefined, 2, "isto não é json");
caso("papel desconhecido bloqueia", "codex", "revisor-x", sh("ls"), 2);
// OpenCode, papel devops-engineer
caso("write do roteiro em docs/fluxo", "opencode", "devops-engineer", { tool_name: "write", tool_input: { filePath: "docs/fluxo/x/deploy-01.md", content: "r" } }, 0);
caso("write de Dockerfile", "opencode", "devops-engineer", { tool_name: "write", tool_input: { filePath: "Dockerfile", content: "FROM node" } }, 0);
caso("write em src", "opencode", "devops-engineer", { tool_name: "write", tool_input: { filePath: "src/a.ts", content: "x" } }, 2);
caso("edit em package.json", "opencode", "devops-engineer", { tool_name: "edit", tool_input: { filePath: "package.json", newString: "x" } }, 2);
caso("bash: git push", "opencode", "devops-engineer", sh("git push origin main"), 2);
caso("bash: docker compose config (leitura)", "opencode", "devops-engineer", sh("docker compose config"), 0);
caso("read de vault/", "opencode", "devops-engineer", { tool_name: "read", tool_input: { filePath: "vault/01-projetos/x.md" } }, 2);
caso("ferramenta harness-vault-comum_create_note_tool", "opencode", "devops-engineer", { tool_name: "harness-vault-comum_create_note_tool", tool_input: {} }, 2);
caso("ferramenta harness-vault-comum_read_note_tool", "opencode", "devops-engineer", { tool_name: "harness-vault-comum_read_note_tool", tool_input: {} }, 0);

// Codex modo código: exec com tools.apply_patch / tools.exec_command embutidos (teste-mac defeito 6)
const execJS = (js) => ({ tool_name: "exec", tool_input: { command: js } });
const execPatch = (f) => execJS(`await tools.apply_patch(\`*** Begin Patch\n*** Add File: ${f}\n+x\n*** End Patch\`);`);
caso("exec modo código: apply_patch em src (código) bloqueia", "codex", "tech-lead", execPatch("src/y.ts"), 2);
caso("exec modo código: apply_patch em docs/fluxo passa", "codex", "tech-lead", execPatch("docs/fluxo/x/n.md"), 0);
caso("exec modo código: exec_command git commit bloqueia", "codex", "tech-lead", execJS('await tools.exec_command({ cmd: "git commit -m x" });'), 2);
caso("exec modo código: exec_command git status passa", "codex", "tech-lead", execJS('await tools.exec_command({ cmd: "git status" });'), 0);

// OpenCode 2.x manda o caminho ABSOLUTO; o escopo precisa relativizar (teste-mac defeito 7)
caso("write caminho absoluto em src (dentro do projeto) bloqueia", "opencode", "devops-engineer", { tool_name: "write", tool_input: { path: join(raiz, "src/y.ts"), content: "x" } }, 2);
caso("write caminho absoluto em docs/fluxo (dentro do projeto) passa", "opencode", "devops-engineer", { tool_name: "write", tool_input: { path: join(raiz, "docs/fluxo/x/deploy-02.md"), content: "x" } }, 0);
caso("write caminho absoluto FORA do projeto bloqueia", "opencode", "devops-engineer", { tool_name: "write", tool_input: { path: "/tmp/fora-do-harness-teste.ts", content: "x" } }, 2);

// Arquivos de adaptação do Codex e do OpenCode
const ok = (nome, cond) => {
  if (!cond) T.falhas++;
  console.log(`${cond ? "OK    " : "FALHOU"} adaptadores         ${nome}`);
};
const le = (rel) => [join(KIT, rel), join(KIT, DONDE(rel))].map((f) => (existsSync(f) ? readFileSync(f, "utf8") : "")).find(Boolean) ?? "";
for (const a of ["code-reviewer", "security-reviewer"]) {
  const t = le(`kit-codex/dot-codex/agents/${a}.toml`);
  ok(`.codex/agents/${a}.toml: name, description, developer_instructions, somente leitura e nível Forte`, new RegExp(`^name = "${a}"`, "m").test(t) && /^description = /m.test(t) && /developer_instructions = """/.test(t) && /sandbox_mode = "read-only"/.test(t) && /model_reasoning_effort = "high"/.test(t));
  ok(`${a}: aponta para a persona e proíbe edição`, t.includes(`.agents/personas/${a}.md`) && /não edita arquivo/.test(t) && existsSync(join(KIT, ".agents", "personas", `${a}.md`)));
}
const hj = (() => {
  try {
    return JSON.parse(le("kit-codex/dot-codex/hooks.json"));
  } catch {
    return undefined;
  }
})();
const h = hj?.hooks?.PreToolUse?.[0];
ok(".codex/hooks.json: PreToolUse chama guarda-externa com papel tech-lead", /guarda-externa\.mjs.* codex tech-lead/.test(h?.hooks?.[0]?.command ?? "") && (() => { try { const re = new RegExp(h?.matcher ?? "$^"); return re.test("Bash") && re.test("apply_patch") && re.test("exec"); } catch { return false; } })());
ok(".codex/config.toml liga os hooks e limita a profundidade dos subagentes", /hooks = true/.test(le("kit-codex/dot-codex/config.toml")) && /max_depth = 1/.test(le("kit-codex/dot-codex/config.toml")));
ok(".codex/rules/harness.rules proíbe git push e commit", /pattern = \["git", "push"\][\s\S]*forbidden/.test(le("kit-codex/dot-codex/rules/harness.rules")) && /pattern = \["git", "commit"\]/.test(le("kit-codex/dot-codex/rules/harness.rules")));
const plugin = le("kit-opencode/dot-opencode/plugin/harness-guard.ts");
ok(".opencode/plugin (API v2): export default id+setup, execute.before chama a guarda e lança erro se ela falhar", /export default/.test(plugin) && /\bid:/.test(plugin) && /setup/.test(plugin) && /execute\.before/.test(plugin) && /guarda-externa\.mjs/.test(plugin) && /throw new Error/.test(plugin) && /r\.status !== 0/.test(plugin));
let oc;
try {
  oc = JSON.parse(le("kit-opencode/opencode.json"));
} catch {}
ok("opencode.json nega git push e git commit", oc?.permission?.bash?.["git push*"] === "deny" && oc?.permission?.bash?.["git commit*"] === "deny");
let vers;
try {
  vers = JSON.parse(readFileSync(join(KIT, ".agents", "versoes.json"), "utf8"));
} catch {}
ok(".agents/versoes.json: Claude Code, Codex e OpenCode com versão testada", vers?.claude_code?.minima === "2.1.295" && Boolean(vers?.codex?.testada) && Boolean(vers?.opencode?.testada));

// vault em TOML para o Codex
const vc = (...a) => spawnSync("node", [join(AQUI, "vault-config.mjs"), ...a], { encoding: "utf8" }).stdout;
const mcp = join(raiz, "base-mcp8.json");
w("base-mcp8.json", JSON.stringify({ mcpServers: { "harness-vault": { command: "uvx", args: ["obsidian-mcp"], env: { OBSIDIAN_VAULT_PATH: "./vault" } } } }));
const tl = vc("toml", mcp);
const tu = vc("toml", mcp, "slon");
ok("toml local: um servidor harness-vault em ./vault", /\[mcp_servers\.harness-vault\]/.test(tl) && /OBSIDIAN_VAULT_PATH = "\.\/vault"/.test(tl) && !/comum/.test(tl));
ok("toml universal: módulo e comum, comum só com search e read", /HARNESS_VAULT_CENTRAL\/slon/.test(tu) && /HARNESS_VAULT_CENTRAL\/_comum/.test(tu) && /enabled_tools = \["search_notes_tool", "read_note_tool"\]/.test(tu) && /env_vars = \["HARNESS_VAULT_CENTRAL"\]/.test(tu));
