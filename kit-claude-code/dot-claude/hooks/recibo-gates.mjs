#!/usr/bin/env node
// Roda os gates de verdade e grava o recibo: node .claude/hooks/recibo-gates.mjs <demanda>
// Em cada pasta com package.json (as mesmas do pre-commit) roda `npm run lint`, `typecheck` e `test`;
// o código de saída de cada gate é o pior entre as pastas. Script ausente conta como falha.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hashArvore } from "./formatos-lib.mjs";

const demanda = process.argv[2];
const raiz = process.cwd();
if (!demanda || !existsSync(join(raiz, "docs", "fluxo", demanda))) {
  console.error("uso: node .claude/hooks/recibo-gates.mjs <demanda>   (rode na raiz do projeto)");
  process.exit(2);
}
const listar = existsSync(join(raiz, ".githooks", "verificar-gates.mjs"))
  ? spawnSync("node", [join(raiz, ".githooks", "verificar-gates.mjs"), "--listar"], { cwd: raiz, encoding: "utf8" })
  : null;
const pastas = (listar?.status === 0 ? listar.stdout.split("\n").filter(Boolean) : ["."]).filter((p) => existsSync(join(raiz, p, "package.json")));
if (pastas.length === 0) pastas.push(".");

const resultado = { lint: 0, typecheck: 0, test: 0 };
const comandos = [];
for (const gate of Object.keys(resultado)) {
  for (const pasta of pastas) {
    const pkg = join(raiz, pasta, "package.json");
    const existe = existsSync(pkg) && Boolean(JSON.parse(readFileSync(pkg, "utf8")).scripts?.[gate]);
    const r = existe ? spawnSync("npm", ["run", gate, "--silent"], { cwd: join(raiz, pasta), encoding: "utf8", stdio: "inherit" }) : { status: 127 };
    const code = r.status ?? 1;
    comandos.push(`npm run ${gate} (${pasta}) → EXIT ${code}${existe ? "" : " (script ausente)"}`);
    resultado[gate] = Math.max(resultado[gate], code);
  }
}
const texto = [
  "# Recibo dos gates",
  "",
  "GERADO_POR: recibo-gates.mjs",
  `DEMANDA: ${demanda}`,
  `DATA: ${new Date().toISOString()}`,
  `ARVORE: ${hashArvore(raiz)}`,
  "",
  "COMANDOS:",
  ...comandos.map((c) => `  ${c}`),
  "",
  `lint: EXIT ${resultado.lint}`,
  `typecheck: EXIT ${resultado.typecheck}`,
  `test: EXIT ${resultado.test}`,
  "",
].join("\n");
mkdirSync(join(raiz, "docs", "fluxo", demanda), { recursive: true });
writeFileSync(join(raiz, "docs", "fluxo", demanda, "recibo-gates.md"), texto);
console.log(texto);
process.exit(Object.values(resultado).some((c) => c !== 0) ? 1 : 0);
