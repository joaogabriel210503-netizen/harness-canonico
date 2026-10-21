#!/usr/bin/env node
// Confere a memória do projeto (.agents/memory): teto do índice, links, formato dos arquivos de
// tópico e os quatro campos de frescor (fonte, evidência, verificado em, invalida se).
// Uso: node .claude/hooks/memoria-check.mjs   Sai com 1 se houver erro; entrada velha é só aviso.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const TETO = 130;
export const DIAS_VELHA = 90;
const CAMPOS = ["Fonte", "Evidência", "Verificado em", "Invalida se"];

export function conferir(raiz, hoje = new Date()) {
  const erros = [];
  const avisos = [];
  const dir = join(raiz, ".agents", "memory");
  const indice = join(dir, "MEMORY.md");
  if (!existsSync(indice)) return { erros: [".agents/memory/MEMORY.md não existe"], avisos };
  const linhas = readFileSync(indice, "utf8").split("\n");
  if (linhas.length > TETO) erros.push(`MEMORY.md tem ${linhas.length} linhas (teto ${TETO}): migre para o vault antes de acrescentar`);
  const ligados = new Set();
  for (const l of linhas) {
    const m = /^- \[[^\]]+\]\(([^)]+)\)/.exec(l);
    if (!m) continue;
    ligados.add(m[1]);
    if (!existsSync(join(dir, m[1]))) erros.push(`índice aponta para ${m[1]}, que não existe`);
  }
  const topicos = readdirSync(dir).filter((f) => f.endsWith(".md") && !["MEMORY.md", "INSTRUCTIONS.md"].includes(f));
  for (const f of topicos) {
    const txt = readFileSync(join(dir, f), "utf8");
    if (!ligados.has(f)) erros.push(`${f} não está no índice`);
    const fm = /^---\n([\s\S]*?)\n---/.exec(txt)?.[1] ?? "";
    for (const k of ["name", "description", "type"]) if (!new RegExp(`^\\s*${k}:\\s*\\S`, "m").test(fm)) erros.push(`${f}: frontmatter sem ${k}`);
    const corpo = txt.replace(/^---\n[\s\S]*?\n---/, "");
    for (const c of CAMPOS) if (!new RegExp(`^${c}:\\s*\\S`, "m").test(corpo)) erros.push(`${f}: falta o campo "${c}:"`);
    const d = /^Verificado em:\s*(\d{4})-(\d{2})-(\d{2})/m.exec(corpo);
    if (d) {
      const dt = new Date(Date.UTC(+d[1], +d[2] - 1, +d[3]));
      if (Number.isNaN(dt.getTime()) || dt.getUTCMonth() !== +d[2] - 1) erros.push(`${f}: "Verificado em" não é data válida (AAAA-MM-DD)`);
      else if ((hoje - dt) / 864e5 > DIAS_VELHA) avisos.push(`${f}: verificada há mais de ${DIAS_VELHA} dias; confira a evidência ou apague`);
    } else if (new RegExp("^Verificado em:", "m").test(corpo)) erros.push(`${f}: "Verificado em" precisa de AAAA-MM-DD`);
  }
  return { erros, avisos };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const { erros, avisos } = conferir(raiz);
  for (const e of erros) console.log(`ERRO   ${e}`);
  for (const a of avisos) console.log(`AVISO  ${a}`);
  console.log(erros.length ? `\n${erros.length} erro(s) na memória.` : "\nMemória em ordem.");
  process.exit(erros.length ? 1 : 0);
}
