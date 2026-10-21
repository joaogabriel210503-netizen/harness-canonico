// Casos dos hooks, parte 6: vault em modo universal (por pasta), vault-config e memoria-check.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AQUI, T, bash, caso, ferr, raiz, w } from "./selftest-lib.mjs";

const proj = mkdtempSync(join(tmpdir(), "harness-univ-"));
const central = mkdtempSync(join(tmpdir(), "harness-central-"));
mkdirSync(join(central, "slon", "03-conhecimento"), { recursive: true });
w(".claude/vault.json", JSON.stringify({ modo: "universal", modulo: "slon" }), proj);
const ENV = { HARNESS_VAULT_CENTRAL: central };
const V = "vault-guard.mjs";
const u = (nome, ev, esperado, env = ENV) => caso(`universal: ${nome}`, V, { cwd: proj, ...ev }, esperado, env, undefined, proj);

u("Read direto na raiz central", ferr("Read", { file_path: join(central, "slon/03-conhecimento/x.md") }), 2);
u("Write direto no _comum", ferr("Write", { file_path: join(central, "_comum/x.md"), content: "a" }), 2);
u("Glob na raiz central", ferr("Glob", { pattern: join(central, "**/*.md") }), 2);
u("Bash: cat na raiz central", bash(`cat ${join(central, "slon/x.md")}`), 2);
u("Bash: grep -r na raiz central", bash(`grep -r foo ${central}`), 2);
u("Bash: cat $HARNESS_VAULT_CENTRAL/x", bash("cat $HARNESS_VAULT_CENTRAL/slon/x.md"), 2);
u("Bash: ls src (não é o vault)", bash("ls src"), 0);
u("Read em src/x.ts", ferr("Read", { file_path: join(proj, "src/x.ts") }), 0);
u("MCP do módulo (harness-vault) passa", ferr("mcp__harness-vault__create_note_tool", {}), 0);
u("MCP comum: leitura passa", ferr("mcp__harness-vault-comum__search_notes_tool", {}), 0);
u("MCP comum: read_note passa", ferr("mcp__harness-vault-comum__read_note_tool", {}), 0);
u("MCP comum: escrita bloqueada", ferr("mcp__harness-vault-comum__create_note_tool", {}), 2);
u("MCP comum: ferramenta desconhecida bloqueada", ferr("mcp__harness-vault-comum__move_note_tool", {}), 2);
u("MCP de outro módulo bloqueado", ferr("mcp__harness-vault-financeiro__read_note_tool", {}), 2);
u("sem a variável, o acesso direto a vault/ local segue bloqueado", ferr("Read", { file_path: "vault/01-projetos/x.md" }), 2, {});
caso("modo local: harness-vault-comum também é estranho", V, ferr("mcp__harness-vault-comum__create_note_tool", {}), 2);

// vault-config
const vc = (...a) => spawnSync("node", [join(AQUI, "vault-config.mjs"), ...a], { encoding: "utf8" });
const baseMcp = join(raiz, "base-mcp.json");
w("base-mcp.json", JSON.stringify({ mcpServers: { "harness-vault": { command: "uvx", args: ["obsidian-mcp"], env: { OBSIDIAN_VAULT_PATH: "./vault" } }, "chrome-devtools": { command: "npx", args: [] } } }));
const mcp = vc("mcp", baseMcp, "slon");
let cfg;
try {
  cfg = JSON.parse(mcp.stdout);
} catch {
  cfg = undefined;
}
const ok = (nome, cond) => {
  if (!cond) T.falhas++;
  console.log(`${cond ? "OK    " : "FALHOU"} vault-config.mjs    ${nome}`);
};
ok("mcp universal: harness-vault na pasta do módulo", cfg?.mcpServers?.["harness-vault"]?.env?.OBSIDIAN_VAULT_PATH === "${HARNESS_VAULT_CENTRAL}/slon");
ok("mcp universal: harness-vault-comum na _comum", cfg?.mcpServers?.["harness-vault-comum"]?.env?.OBSIDIAN_VAULT_PATH === "${HARNESS_VAULT_CENTRAL}/_comum");
ok("mcp universal: chrome-devtools preservado", Boolean(cfg?.mcpServers?.["chrome-devtools"]));
ok("json universal sem módulo falha", vc("json", "universal").status === 1);
ok("json universal com módulo inválido falha", vc("json", "universal", "../x").status === 1);
ok("json local", JSON.parse(vc("json", "local").stdout).modo === "local");
const esqueleto = join(raiz, "esqueleto");
w("esqueleto/x.md", "x");
const ini = spawnSync("node", [join(AQUI, "vault-config.mjs"), "iniciar", esqueleto, "novo"], { encoding: "utf8", env: { ...process.env, ...ENV } });
ok("iniciar sem esqueleto existente não quebra o resto (código 0 ou erro claro)", ini.status === 0 || /vault-config:/.test(ini.stderr) || ini.status === 1);

// memoria-check
const mem = mkdtempSync(join(tmpdir(), "harness-mem-"));
const mc = (dir) => spawnSync("node", [join(AQUI, "memoria-check.mjs")], { encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
const topico = (verif = "2026-10-01") => `---\nname: x\ndescription: d\nmetadata:\n  type: reference\n---\n\nFato.\n\nFonte: commit abc\nEvidência: arquivo y\nVerificado em: ${verif}\nInvalida se: z mudar\n`;
w(".agents/memory/MEMORY.md", "# Índice\n- [X](x.md): importa\n", mem);
w(".agents/memory/x.md", topico(), mem);
ok("memoria-check: memória em ordem sai 0", mc(mem).status === 0);
w(".agents/memory/x.md", topico().replace("Invalida se: z mudar\n", ""), mem);
ok("memoria-check: falta campo de frescor sai 1", mc(mem).status === 1);
w(".agents/memory/x.md", topico("2026-13-45"), mem);
ok("memoria-check: data inválida sai 1", mc(mem).status === 1);
w(".agents/memory/x.md", topico("2020-01-01"), mem);
const velha = mc(mem);
ok("memoria-check: entrada velha é só aviso (sai 0)", velha.status === 0 && /AVISO/.test(velha.stdout));
w(".agents/memory/x.md", topico(), mem);
w(".agents/memory/MEMORY.md", `# Índice\n${"- [X](x.md): a\n".repeat(131)}`, mem);
ok("memoria-check: índice acima de 130 linhas sai 1", mc(mem).status === 1);
w(".agents/memory/MEMORY.md", "# Índice\n- [Y](nao-existe.md): a\n- [X](x.md): a\n", mem);
ok("memoria-check: link quebrado sai 1", mc(mem).status === 1);
w(".agents/memory/MEMORY.md", "# Índice\n", mem);
ok("memoria-check: tópico fora do índice sai 1", mc(mem).status === 1);
for (const d of [proj, central, mem]) rmSync(d, { recursive: true, force: true });
