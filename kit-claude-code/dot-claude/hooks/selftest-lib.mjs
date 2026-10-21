// Base comum dos selftests dos hooks: projeto descartável, executor de hook e o `caso`.
// Não roda nada sozinho; selftest.mjs importa isto e os selftest-casos-*.mjs.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const AQUI = dirname(fileURLToPath(import.meta.url));
export const raiz = mkdtempSync(join(tmpdir(), "harness-hooks-"));
export const w = (rel, txt, base = raiz) => {
  mkdirSync(dirname(join(base, rel)), { recursive: true });
  writeFileSync(join(base, rel), txt);
};
// O .githooks fica ao lado de .claude no projeto e três níveis acima no kit.
const GITHOOKS = [join(AQUI, "..", "..", ".githooks"), join(AQUI, "..", "..", "..", ".githooks")].find((d) => existsSync(d));
if (GITHOOKS) w(".githooks/secret-scan.mjs", readFileSync(join(GITHOOKS, "secret-scan.mjs"), "utf8"));

export const estado = (spec, plano) => `# Estado: demo
- **Branch:** \`demanda/demo\`
- **Etapa atual:** E5
## Aprovações
| O quê | Arquivo aprovado | Frase do humano | Data | sha256 (12) |
|---|---|---|---|---|
| SPEC | ${spec} |
| Plano | ${plano} |
`;

export function roda(hook, evento, env = {}, bruto, cwd = raiz) {
  const r = spawnSync("node", [join(AQUI, hook)], {
    input: bruto ?? JSON.stringify({ cwd, ...evento }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: cwd, HARNESS_BYPASS: "", ...env },
    encoding: "utf8",
  });
  return { code: r.status, err: r.stderr, out: r.stdout };
}
export const ferr = (tool_name, tool_input, extra = {}) => ({ tool_name, tool_input, ...extra });
export const sub = (tipo) => ({ agent_id: "a1", agent_type: tipo });
export const bash = (command, extra) => ferr("Bash", { command }, extra);
export const escreve = (file_path, content = "x\n", extra) => ferr("Write", { file_path, content }, extra);
export const edita = (file_path, new_string = "x", extra) => ferr("Edit", { file_path, new_string }, extra);
// Valores que parecem segredo são montados na hora, para o próprio selftest não ser lido como segredo.
export const AWS = `${"AK"}${"IA"}ABCDEFGHIJKLMNOP`;
export const CHAVE_PRIVADA = `-----BEGIN ${"RSA"} PRIVATE ${"KEY"}-----`;

export const T = { falhas: 0 };
export function caso(nome, hook, evento, esperado, env, bruto, cwd) {
  const { code, err } = roda(hook, evento, env, bruto, cwd);
  const ok = code === esperado;
  if (!ok) T.falhas++;
  console.log(`${ok ? "OK    " : "FALHOU"} ${hook.padEnd(18)} ${nome.padEnd(62)} saída=${code} esperado=${esperado}${ok ? "" : ` | ${err.trim()}`}`);
}

