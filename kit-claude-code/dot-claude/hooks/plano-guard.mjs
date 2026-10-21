#!/usr/bin/env node
// PreToolUse em Edit|Write|MultiEdit. Faz cumprir o fluxo (.agents/fluxo.md):
// código só muda depois que a SPEC e o plano foram aprovados pelo humano, e a
// SPEC aprovada traz a seção "Consultas feitas" (E2).
//
// Lê docs/fluxo/*/estado.md: tabela "Aprovações", linhas SPEC e Plano, com
// arquivo e frase preenchidos. Basta UMA demanda nesse estado para liberar;
// o hook não sabe a qual demanda cada edição pertence, e a conferência fina
// (arquivo dentro de Files: da tarefa) fica com a revisão.
// W2 (B02): a linha da aprovação traz o sha256 (12 caracteres) do arquivo aprovado;
// se o arquivo mudou depois, a demanda deixa de liberar código. O plano precisa ter,
// em cada tarefa (`### T..`), `Files:` e `Resources:`; só o que está em algum `Files:`
// das demandas liberadas pode ser editado.
// Limite conhecido (N02): a frase na tabela é texto e não é conferida contra o que o
// humano digitou. O hash torna a alteração posterior detectável, não impossível.
// Sem bypass para código: HARNESS_BYPASS=1 aberto pelo humano, para o início do
// projeto (scaffold) e para correção emergencial.
// Falha da própria trava BLOQUEIA (hook-io.mjs, modo "guarda").
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { block, bypassed, projectDir, targetPath, principal } from "./hook-io.mjs";

// O que pode mudar sem plano aprovado: documentação do fluxo, memória, vault
// (vault-guard) e o que o rules-guard já protege (.claude/, .agents/). Não entram
// .maestri/ nem graphify-out/: nenhum agente escreve ali por ferramenta.
// O caminho já chega sem o prefixo .claude/worktrees/<n>/ (hook-io.mjs), então o
// código de um worktree não cai em `.claude/`.
const LIVRE = /^(docs\/|\.agents\/|\.claude\/|vault\/|[^/]+\.md$|\.gitignore$)/i;

function celulas(linha) {
  return linha.split("|").slice(1, -1).map((c) => c.trim().replace(/^`|`$/g, ""));
}

const eArquivo = (caminho) => {
  try {
    return statSync(caminho).isFile();
  } catch {
    return false;
  }
};

const hash12 = (caminho) => createHash("sha256").update(readFileSync(caminho)).digest("hex").slice(0, 12);

// Tarefas do plano: cada `### T..` tem de declarar Files: (com caminhos entre crases) e Resources:.
// Devolve { erro } ou { files: [padrões] }.
export function lePlano(texto) {
  const blocos = texto.split(/^(?=###\s+T\w+)/m).filter((b) => /^###\s+T\w+/.test(b));
  if (blocos.length === 0) return { erro: "o plano não tem tarefas com ID (### T01 ...)" };
  const files = [];
  for (const b of blocos) {
    const id = /^###\s+(T\w+)/.exec(b)[1];
    const f = /^\s*[-*]?\s*(?:\*\*)?Files:(?:\*\*)?\s*(.*)$/im.exec(b);
    const caminhos = f ? [...f[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]) : [];
    if (caminhos.length === 0) return { erro: `a tarefa ${id} não declara Files: com caminhos entre crases` };
    if (!/^\s*[-*]?\s*(?:\*\*)?Resources:(?:\*\*)?/im.test(b)) return { erro: `a tarefa ${id} não declara Resources: (escreva "nenhum" se não há)` };
    files.push(...caminhos);
  }
  return { files };
}

// Caminho do Files: casa com o arquivo: igual, pasta (termina em /) ou glob com * e **.
export function casa(padrao, p) {
  const alvo = padrao.replace(/^\.\//, "");
  if (alvo.endsWith("/")) return p.startsWith(alvo);
  if (!/[*?]/.test(alvo)) return p === alvo;
  const re = alvo
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "\u0000")
    .replace(/\*\*/g, "\u0001")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\u0000/g, "(?:.*/)?")
    .replace(/\u0001/g, ".*");
  return new RegExp(`^${re}$`).test(p);
}

function aprovacoes(raiz) {
  const base = join(raiz, "docs", "fluxo");
  if (!existsSync(base)) return { demandas: 0, ok: [], motivos: [], files: [] };
  const ok = [];
  const motivos = [];
  const files = [];
  let demandas = 0;
  for (const nome of readdirSync(base)) {
    const arq = join(base, nome, "estado.md");
    if (!existsSync(arq)) continue;
    demandas++;
    if (!eArquivo(arq)) { motivos.push(`${nome}: estado.md não é um arquivo`); continue; }
    const linhasTodas = readFileSync(arq, "utf8");
    const linhas = linhasTodas.split("\n").filter((l) => l.trim().startsWith("|"));
    const pega = (rotulo) => linhas.map(celulas).find((c) => c[0] === rotulo);
    const spec = pega("SPEC");
    const plano = pega("Plano");
    const etapa = /\*\*Etapa atual:\*\*\s*(.+)/.exec(linhasTodas)?.[1] ?? "";
    if (/conclu/i.test(etapa)) { motivos.push(`${nome}: demanda concluída`); continue; }
    const preenchido = (c) => c && c[1] && c[2] && c[3] && c[4] && !/^\[.*\]$/.test(c[1]);
    if (!preenchido(spec)) { motivos.push(`${nome}: SPEC sem aprovação registrada`); continue; }
    if (!preenchido(plano)) { motivos.push(`${nome}: plano sem aprovação registrada`); continue; }
    const caminho = join(raiz, spec[1]);
    if (!eArquivo(caminho)) { motivos.push(`${nome}: a SPEC aprovada (${spec[1]}) não existe`); continue; }
    if (!eArquivo(join(raiz, plano[1]))) { motivos.push(`${nome}: o plano aprovado (${plano[1]}) não existe`); continue; }
    const mudou = [["SPEC", spec], ["plano", plano]].find(([, c]) => hash12(join(raiz, c[1])) !== c[4].toLowerCase());
    if (mudou) {
      motivos.push(`${nome}: o ${mudou[0]} (${mudou[1][1]}) mudou depois da aprovação (o sha256 do estado.md não bate). Reapresente ao humano e registre a nova aprovação`);
      continue;
    }
    if (!/^##\s+Consultas feitas/m.test(readFileSync(caminho, "utf8"))) {
      motivos.push(`${nome}: a SPEC aprovada não tem a seção "Consultas feitas" (.agents/rules/consulta.md)`);
      continue;
    }
    const lido = lePlano(readFileSync(join(raiz, plano[1]), "utf8"));
    if (lido.erro) { motivos.push(`${nome}: ${lido.erro}`); continue; }
    ok.push(nome);
    files.push(...lido.files);
  }
  return { demandas, ok, motivos, files };
}

export function checar(event) {
  if (bypassed()) return;
  const p = targetPath(event);
  if (p === "" || p.startsWith("/") || LIVRE.test(p)) return;
  const { demandas, ok, motivos, files } = aprovacoes(projectDir(event));
  if (ok.length > 0) {
    if (files.some((f) => casa(f, p))) return;
    block(
      `Bloqueado: ${p} não está em nenhum Files: do plano aprovado. Permitido: ${files.join(", ")}. Se o arquivo faz parte da tarefa, o plano muda e o humano aprova de novo; senão, relate ao orquestrador.`,
    );
  }
  const detalhe =
    demandas === 0
      ? "Não há demanda em docs/fluxo/. O trabalho começa em E0: descreva o pedido ao tech-lead."
      : `Nenhuma demanda está liberada para código: ${motivos.join("; ")}.`;
  block(
    `Bloqueado: editar ${p} antes de SPEC e plano aprovados pelo humano. ${detalhe} Veja .agents/fluxo.md. Se o humano quer pular uma etapa, responda com a etapa atual, a etapa que o pedido pularia e o que falta.`,
  );
}

principal(import.meta.url, checar);
