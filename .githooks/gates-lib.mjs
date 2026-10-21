// Biblioteca do gates.lock (não é hook). O lock guarda a impressão digital (sha256)
// do que DEFINE os gates: configs do lint e do TypeScript, o Biome, o sem-supressao.mjs, o selftest, eslint-rules/
// e os scripts lint, typecheck, lint:typed, test, gates:verify e gates:selftest do
// package.json. Sem isto, trocar `"lint": "eslint ."` por `"lint": "echo ok"`
// esvazia o gate sem tocar em nenhum arquivo protegido (N14).
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const SCRIPTS = ["lint", "typecheck", "lint:typed", "test", "gates:verify", "gates:selftest"];
export const LOCK = ".githooks/gates.lock.json";
const IGNORA = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next", "worktrees", "vault", "graphify-out"]);
const CONFIG = [
  /^eslint(\.[a-z]+)?\.config\.[cm]?[jt]s$/i,
  /^\.eslintrc(\.[a-z]+)?$/i,
  /^biome\.jsonc?$/i,
  /^sem-supressao\.mjs$/i,
  /^selftest\.mjs$/i,
  /^tsconfig(\.[^/]*)?\.json$/i,
  /^(vitest|jest|playwright)\.config\.[^/]*$/i,
];

const sha = (txt) => createHash("sha256").update(txt).digest("hex");

// Pastas com package.json, até 3 níveis (backend/ + frontend/ também contam).
export function pacotes(raiz, dir = raiz, nivel = 0) {
  const achados = [];
  if (existsSync(join(dir, "package.json"))) achados.push(relative(raiz, dir) || ".");
  if (nivel >= 3) return achados;
  for (const nome of readdirSync(dir)) {
    if (IGNORA.has(nome) || nome.startsWith(".")) continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) achados.push(...pacotes(raiz, p, nivel + 1));
  }
  return achados;
}

function arquivosRegra(dir, base) {
  const lista = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isFile() && CONFIG.some((re) => re.test(nome))) lista.push(p);
  }
  const regras = join(dir, "eslint-rules");
  if (existsSync(regras)) {
    const anda = (d) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) anda(p);
        else lista.push(p);
      }
    };
    anda(regras);
  }
  return lista.map((p) => relative(base, p));
}

export function impressao(raiz) {
  const pastas = pacotes(raiz);
  const arquivos = {};
  for (const pasta of pastas) {
    const dir = join(raiz, pasta);
    for (const rel of arquivosRegra(dir, raiz)) arquivos[rel] = sha(readFileSync(join(raiz, rel)));
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const scripts = Object.fromEntries(SCRIPTS.map((s) => [s, pkg.scripts?.[s] ?? null]));
    arquivos[`${pasta === "." ? "" : `${pasta}/`}package.json#scripts`] = sha(JSON.stringify(scripts));
  }
  return { pastas, arquivos };
}

export function lerLock(raiz) {
  const p = join(raiz, LOCK);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}
