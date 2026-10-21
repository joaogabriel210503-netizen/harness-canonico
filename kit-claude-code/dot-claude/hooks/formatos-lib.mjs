// Biblioteca dos formatos de saída (W4, .agents/rules/formatos.md). Não é um hook.
// Reúne o que o validar-saida.mjs, o relato-guard (SubagentStop) e o recibo-guard (Stop)
// leem como FATO, fora do controle do agente: estado.md, o plano aprovado, git status e hashes.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const SEQUENCIA = ["E0", "E1", "E2", "E3", "E3b", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "CONCLUIDA"];
export const STATUS = ["CONCLUIDA", "CONCLUIDA_COM_RESSALVA", "PRECISA_CONTEXTO", "BLOQUEADA"];
export const SEVERIDADES = ["CRITICO", "ALTO", "MEDIO", "BAIXO"];
export const IMPLEMENTADORES = new Set(["backend-specialist", "frontend-specialist", "database-architect", "test-engineer", "debugger"]);
export const REVISORES = new Set(["code-reviewer", "security-reviewer"]);

export const hash12 = (arquivo) => createHash("sha256").update(readFileSync(arquivo)).digest("hex").slice(0, 12);
export const hashTexto = (texto) => createHash("sha256").update(texto).digest("hex").slice(0, 12);

const celulas = (linha) => linha.split("|").slice(1, -1).map((c) => c.trim().replace(/^`|`$/g, ""));

// Cada demanda de docs/fluxo/*/estado.md: etapa e as linhas SPEC e Plano da tabela de aprovações.
export function lerDemandas(raiz) {
  const base = join(raiz, "docs", "fluxo");
  const saida = [];
  if (!existsSync(base)) return saida;
  for (const nome of readdirSync(base)) {
    const arq = join(base, nome, "estado.md");
    if (!existsSync(arq) || !statSync(arq).isFile()) continue;
    const texto = readFileSync(arq, "utf8");
    const linhas = texto.split("\n").filter((l) => l.trim().startsWith("|")).map(celulas);
    const pega = (r) => linhas.find((c) => c[0] === r);
    const aprov = (c) => (c && c[1] ? { arquivo: c[1], frase: c[2] ?? "", data: c[3] ?? "", hash: (c[4] ?? "").toLowerCase() } : null);
    const etapaTexto = /\*\*Etapa atual:\*\*\s*(.+)/.exec(texto)?.[1] ?? "";
    const etapa = /conclu/i.test(etapaTexto) ? "CONCLUIDA" : (/\bE\d+b?\b/.exec(etapaTexto)?.[0] ?? "");
    saida.push({ nome, etapa, spec: aprov(pega("SPEC")), plano: aprov(pega("Plano")), texto });
  }
  return saida;
}

// Tarefas do plano: { T01: ["src/a.ts", ...] }.
export function tarefasDoPlano(texto) {
  const mapa = {};
  for (const b of texto.split(/^(?=###\s+T\w+)/m).filter((x) => /^###\s+T\w+/.test(x))) {
    const id = /^###\s+(T\w+)/.exec(b)[1];
    const f = /^\s*[-*]?\s*(?:\*\*)?Files:(?:\*\*)?\s*(.*)$/im.exec(b);
    mapa[id] = f ? [...f[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]) : [];
  }
  return mapa;
}

// Arquivos alterados ou novos segundo o git (null se não é repositório git).
export function arquivosAlterados(raiz) {
  try {
    const out = execFileSync("git", ["-C", raiz, "status", "--porcelain", "-uall"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.split("\n").filter(Boolean).map((l) => l.slice(3).replace(/^"|"$/g, "").split(" -> ").pop());
  } catch {
    return null;
  }
}

// Valor de um campo "CHAVE: valor" (primeira ocorrência, até o fim da linha).
// Vale também para campos na mesma linha, separados por barra vertical (`TAREFA: T01 | WAVE: 1`).
export const campo = (texto, chave) => new RegExp(`(?:^|\\|)[ \\t]*${chave}:[ \\t]*([^|\\n]*)`, "m").exec(texto)?.[1].trim();

// Lista separada por vírgula, espaço ou barra vertical, sem crases.
export const lista = (valor) => (valor ?? "").split(/[,\s]+/).map((x) => x.replace(/^`|`$/g, "").trim()).filter((x) => x && x !== "nenhum" && x !== "nada");

export const primeiraLinha = (texto) => texto.split("\n").find((l) => l.trim() !== "") ?? "";

// Caminho do Files: casa com o arquivo (igual, pasta com / no fim, ou glob * e **).
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
export const dentroDeFiles = (files, p) => files.some((f) => casa(f, p));

// Plano aprovado de cada demanda: { demanda, tarefas } (só as que têm o arquivo).
export function planosAprovados(raiz) {
  return lerDemandas(raiz)
    .filter((d) => d.plano && existsSync(join(raiz, d.plano.arquivo)))
    .map((d) => ({ demanda: d, tarefas: tarefasDoPlano(readFileSync(join(raiz, d.plano.arquivo), "utf8")) }));
}

// Código de produto: o que o recibo dos gates cobre. Documentação, regras e memória não entram.
export const ehCodigo = (p) => !/^(docs\/|\.agents\/|\.claude\/|\.githooks\/|vault\/|graphify-out\/|\.maestri\/|node_modules\/)/i.test(p) && !/^[^/]+\.md$/i.test(p);

// Impressão digital do código no momento: diff contra HEAD e arquivos novos, só de código.
export function hashArvore(raiz) {
  const git = (...a) => execFileSync("git", ["-C", raiz, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 256 * 1024 * 1024 });
  const mudados = git("diff", "HEAD", "--name-only").split("\n").filter((f) => f && ehCodigo(f)).sort();
  const novos = git("ls-files", "--others", "--exclude-standard").split("\n").filter((f) => f && ehCodigo(f)).sort();
  const partes = mudados.map((f) => `${f}\n${git("diff", "HEAD", "--", f)}`);
  for (const f of novos) partes.push(`${f}\n${createHash("sha256").update(readFileSync(join(raiz, f))).digest("hex")}`);
  return hashTexto(partes.join("\n--\n"));
}

// Lê o recibo de docs/fluxo/<demanda>/recibo-gates.md.
export function lerRecibo(raiz, demanda) {
  const arq = join(raiz, "docs", "fluxo", demanda, "recibo-gates.md");
  if (!existsSync(arq)) return null;
  const t = readFileSync(arq, "utf8");
  const gates = Object.fromEntries([...t.matchAll(/^(lint|typecheck|test):\s*EXIT\s+(\d+)/gm)].map((m) => [m[1], Number(m[2])]));
  return { arvore: /^ARVORE:\s*([0-9a-f]{12})/m.exec(t)?.[1], gates, gerado: /^GERADO_POR:\s*recibo-gates\.mjs/m.test(t) };
}
