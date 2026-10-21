#!/usr/bin/env node
// Confere o gates.lock. Chamado pelo pre-commit, pelo pre-push e pelo doctor.
//   node .githooks/verificar-gates.mjs            confere; sai com 1 se divergir
//   node .githooks/verificar-gates.mjs --listar   imprime as pastas com package.json
// Roda na raiz do repositório. Falha SEMPRE fechada: erro aqui reprova o commit.
import { execFileSync } from "node:child_process";
import { impressao, lerLock } from "./gates-lib.mjs";

const raiz = process.cwd();
const CODIGO = /\.(?:[cm]?[jt]sx?|vue|svelte)$/i;

function falha(msg) {
  console.error(`gates.lock: ${msg}`);
  process.exit(1);
}

try {
  const lock = lerLock(raiz);
  if (lock === null) falha("não existe .githooks/gates.lock.json. Um humano roda `node .githooks/travar-gates.mjs` e commita o arquivo.");
  const { pastas, arquivos } = impressao(raiz);

  if (process.argv[2] === "--listar") {
    console.log(pastas.join("\n"));
    process.exit(0);
  }

  if (pastas.length === 0) {
    if (!lock.docsOnly) falha("o lock espera um projeto com package.json, mas não há nenhum.");
    let staged = [];
    try {
      staged = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { encoding: "utf8" }).split("\n");
    } catch {
      // fora de um commit (doctor): não há índice a conferir
    }
    const codigo = staged.filter((f) => CODIGO.test(f) && !/^(docs|\.agents|\.claude)\//.test(f));
    if (codigo.length) falha(`o lock diz "só documentação", mas há código no commit: ${codigo.slice(0, 5).join(", ")}. Crie o projeto (package.json + gates) e rode travar-gates.`);
    process.exit(0);
  }

  if (lock.docsOnly) falha("há package.json, mas o lock ainda diz \"só documentação\". Um humano roda `node .githooks/travar-gates.mjs`.");

  const dif = [];
  for (const k of new Set([...Object.keys(lock.arquivos), ...Object.keys(arquivos)])) {
    if (lock.arquivos[k] !== arquivos[k]) {
      dif.push(`${k} (${lock.arquivos[k] === undefined ? "novo" : arquivos[k] === undefined ? "removido" : "mudou"})`);
    }
  }
  if (dif.length) {
    falha(
      `o que define os gates mudou sem o humano travar de novo:\n  ${dif.slice(0, 12).join("\n  ")}\nSe a mudança foi aprovada: o humano roda \`node .githooks/travar-gates.mjs\` e commita o lock. Senão, desfaça a mudança.`,
    );
  }
} catch (e) {
  falha(`erro ao conferir (${e.message}). Reprovado por segurança.`);
}
