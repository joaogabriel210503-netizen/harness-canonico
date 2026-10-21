#!/usr/bin/env node
// Varredura de segredo. CLI-neutra: serve ao pre-commit (--staged) e ao hook do
// Claude Code (--stdin). Pega formatos conhecidos de chave (prefixo e tamanho
// fixos, com borda de palavra, para não dar falso positivo em nome de arquivo
// como `task-management-panel.tsx`). Não substitui o gitleaks: se ele estiver
// instalado, o pre-commit roda os dois.
// Saída: o tipo e o lugar do achado, NUNCA o valor. Sai com 1 se achar.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const PADROES = [
  ["chave de acesso AWS", /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["token do GitHub", /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/],
  ["chave de API (Anthropic ou OpenAI)", /\bsk-(ant-|proj-)?[A-Za-z0-9_-]{32,}\b/],
  ["token do Slack", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ["chave de API do Google", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["chave live do Stripe", /\b[sr]k_live_[0-9A-Za-z]{20,}\b/],
  ["chave privada", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY(?: BLOCK)?-----/],
];
// postgres://usuario:SENHA@host com senha de verdade (não placeholder).
const URL_COM_SENHA = /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^:\s/@]+:([^@\s]{4,})@/g;
const PLACEHOLDER = /^(pass(word)?|senha|secret|changeme|example|x+|\*+|<.*>|\$\{.*\}|\$[A-Z_]+|\{\{.*\}\})$/i;
const ENV_REAL = /(^|\/)\.env(\.(?!example$)[^/]*)?$/;

export function acha(texto) {
  const achados = [];
  texto.split("\n").forEach((linha, i) => {
    for (const [nome, re] of PADROES) if (re.test(linha)) achados.push({ nome, linha: i + 1 });
    for (const m of linha.matchAll(URL_COM_SENHA)) {
      if (!PLACEHOLDER.test(m[1])) achados.push({ nome: "URL com usuário e senha", linha: i + 1 });
    }
  });
  return achados;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function staged() {
  const achados = [];
  for (const arq of git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]).split("\n").filter(Boolean)) {
    if (ENV_REAL.test(arq)) achados.push({ nome: "arquivo .env*", arquivo: arq });
  }
  let arquivo = "";
  let linhaNova = 0;
  for (const l of git(["diff", "--cached", "--no-ext-diff", "-U0", "--diff-filter=ACMR"]).split("\n")) {
    if (l.startsWith("+++ ")) { arquivo = l.slice(6); continue; }
    const h = /^@@ -\S+ \+(\d+)/.exec(l);
    if (h) { linhaNova = Number(h[1]) - 1; continue; }
    if (!l.startsWith("+")) continue;
    linhaNova++;
    for (const a of acha(l.slice(1))) achados.push({ nome: a.nome, arquivo, linha: linhaNova });
  }
  return achados;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const modo = process.argv[2];
  let achados;
  if (modo === "--staged") achados = staged();
  else if (modo === "--stdin") achados = acha(readFileSync(0, "utf8"));
  else {
    console.error("uso: secret-scan.mjs --staged | --stdin");
    process.exit(2);
  }
  for (const a of achados) {
    console.error(`segredo: ${a.nome}${a.arquivo ? ` em ${a.arquivo}` : ""}${a.linha ? `:${a.linha}` : ""}`);
  }
  process.exit(achados.length ? 1 : 0);
}
