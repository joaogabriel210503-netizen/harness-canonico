#!/usr/bin/env node
// SÓ O HUMANO RODA ISTO, no terminal dele, depois de aprovar uma mudança nos gates.
// Grava .githooks/gates.lock.json com a impressão digital atual do que define os
// gates. Recusa travar se algum pacote não tiver o script `lint` (gate que não
// existe não pode ser travado). Depois, commite o lock.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { LOCK, impressao } from "./gates-lib.mjs";
import { readFileSync } from "node:fs";

const raiz = process.cwd();
const { pastas, arquivos } = impressao(raiz);

for (const pasta of pastas) {
  const pkg = JSON.parse(readFileSync(join(raiz, pasta, "package.json"), "utf8"));
  if (!pkg.scripts?.lint) {
    console.error(`${pasta}/package.json não tem o script "lint". Crie-o antes de travar (.agents/rules/gates.md, "Script ausente").`);
    process.exit(1);
  }
}

const lock = { versao: 1, docsOnly: pastas.length === 0, gravadoEm: new Date().toISOString().slice(0, 10), arquivos };
writeFileSync(join(raiz, LOCK), `${JSON.stringify(lock, null, 2)}\n`);
console.log(
  pastas.length === 0
    ? "Lock gravado: projeto só de documentação (docsOnly)."
    : `Lock gravado para ${pastas.length} pacote(s): ${pastas.join(", ")} (${Object.keys(arquivos).length} impressões). Commite ${LOCK}.`,
);
