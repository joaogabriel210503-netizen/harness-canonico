#!/usr/bin/env node
// Confere a saída de um agente contra os formatos de .agents/rules/formatos.md (W4).
// Uma função por formato; cada uma devolve a lista de erros ([] = válido). Os erros
// citam o campo e o fato que o contradiz (git status, estado.md, plano), nunca opinião.
// Chamado pelo relato-guard (SubagentStop), pelo orquestrador antes de cada etapa e pelo humano:
//   node .claude/hooks/validar-saida.mjs relato <arquivo> [--papel <persona>]   (F1 + F3 ou F4, pelo papel da linha F1)
//   node .claude/hooks/validar-saida.mjs sintese <relato-revisor> [<relato-revisor> ...]   (F5)
//   node .claude/hooks/validar-saida.mjs estado <demanda>   (F6)
//   node .claude/hooks/validar-saida.mjs decisao|etapa|externo|pulo <arquivo>   (F8, F10, F9, F2)
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  IMPLEMENTADORES, REVISORES, SEQUENCIA, SEVERIDADES, STATUS,
  arquivosAlterados, campo, dentroDeFiles, hash12, lerDemandas, lista, planosAprovados, primeiraLinha,
} from "./formatos-lib.mjs";

const ctxDe = (raiz) => ({ raiz, demandas: lerDemandas(raiz), planos: planosAprovados(raiz), alterados: arquivosAlterados(raiz) });

// F1: PAPEL | DEMANDA | ETAPA na primeira linha, conferidos contra o estado.md.
export function validaF1(texto, { papel, demandas }) {
  const m = /^PAPEL:\s*(\S+)\s*\|\s*DEMANDA:\s*(.+?)\s*\|\s*ETAPA:\s*(E\d+b?|CONCLUIDA)\b/.exec(primeiraLinha(texto));
  if (!m) return ["F1: a primeira linha não é `PAPEL: <persona> | DEMANDA: <slug ou nenhuma> | ETAPA: <Ex>`"];
  const erros = [];
  if (papel && m[1] !== papel) erros.push(`F1: PAPEL é ${m[1]}, mas quem respondeu é ${papel}`);
  if (m[2] !== "nenhuma") {
    const d = demandas.find((x) => x.nome === m[2]);
    if (!d) erros.push(`F1: DEMANDA ${m[2]} não existe em docs/fluxo/`);
    else if (d.etapa && d.etapa !== m[3]) erros.push(`F1: ETAPA ${m[3]} difere da etapa do estado.md (${d.etapa})`);
  }
  return erros;
}

// F2: resposta a pedido para pular etapa.
export function validaF2(texto) {
  const erros = [];
  for (const c of ["ETAPA ATUAL", "O PEDIDO PULARIA", "FALTA"]) if (campo(texto, c) === undefined) erros.push(`F2: falta o campo ${c}`);
  if (!/^NÃO EXECUTADO\.?\s*$/m.test(texto) && !/^NAO EXECUTADO\.?\s*$/m.test(texto)) erros.push("F2: falta a linha `NÃO EXECUTADO.`");
  return erros;
}

// F3: relato do implementador.
export function validaF3(texto, ctx) {
  const erros = [];
  const status = campo(texto, "STATUS");
  if (!STATUS.includes(status)) erros.push(`F3: STATUS ${status ?? "ausente"} fora de ${STATUS.join(" | ")}`);
  const tarefa = /\bT\w+/.exec(campo(texto, "TAREFA") ?? "")?.[0];
  for (const c of ["TAREFA", "WAVE", "PERSONA", "MODELO", "SUPOSICOES", "FICOU_DE_FORA"]) if (!campo(texto, c)) erros.push(`F3: falta o campo ${c}`);
  if (!/^\s*SAIDA_DOS_GATES:/m.test(texto)) erros.push("F3: falta SAIDA_DOS_GATES");
  if (!/^NAO\b/.test(campo(texto, "COMMIT_FEITO") ?? "")) erros.push("F3: COMMIT_FEITO tem de ser NAO (implementador não commita)");

  for (const [chave, rotulo] of [["SPEC_SHA256", "spec"], ["PLANO_SHA256", "plano"]]) {
    const h = (campo(texto, chave) ?? "").toLowerCase().slice(0, 12);
    if (!/^[0-9a-f]{12}$/.test(h)) erros.push(`F3: ${chave} ausente ou fora do formato`);
    else if (!ctx.demandas.some((d) => d[rotulo]?.hash === h)) erros.push(`F3: ${chave} ${h} não é o hash aprovado no estado.md`);
  }

  const gates = Object.fromEntries([...texto.matchAll(/^\s*(lint|typecheck|test):\s*EXIT\s+(\d+)/gm)].map((m) => [m[1], Number(m[2])]));
  if (status === "CONCLUIDA" || status === "CONCLUIDA_COM_RESSALVA") {
    for (const g of ["lint", "typecheck", "test"]) {
      if (gates[g] === undefined) erros.push(`F3: ${status} sem a linha \`${g}: EXIT <n>\``);
      else if (gates[g] !== 0) erros.push(`F3: ${status} com ${g}: EXIT ${gates[g]}`);
    }
  }

  const viu = campo(texto, "TESTE_VIU_FALHAR") ?? "";
  if (!/^(SIM|NAO_SE_APLICA):\s*\S/.test(viu)) erros.push("F3: TESTE_VIU_FALHAR precisa de `SIM: <teste e trecho>` ou `NAO_SE_APLICA: <motivo>`");

  const tocados = lista(campo(texto, "ARQUIVOS_TOCADOS"));
  if (ctx.alterados) {
    const falsos = tocados.filter((a) => !ctx.alterados.includes(a));
    if (falsos.length) erros.push(`F3: ARQUIVOS_TOCADOS cita arquivo sem mudança no git status: ${falsos.join(", ")}`);
  }
  const files = ctx.planos.flatMap((p) => (tarefa && p.tarefas[tarefa]) || []);
  const fora = files.length ? tocados.filter((a) => !dentroDeFiles(files, a)) : [];
  const decl = campo(texto, "FORA_DE_FILES") ?? "";
  if (!/^(NAO|SIM:\s*\S)/.test(decl)) erros.push("F3: FORA_DE_FILES precisa ser `NAO` ou `SIM: <lista>`");
  else if (files.length) {
    if (decl.startsWith("NAO") && fora.length) erros.push(`F3: FORA_DE_FILES: NAO, mas ${fora.join(", ")} não está em Files: de ${tarefa}`);
    if (decl.startsWith("SIM") && fora.length === 0) erros.push(`F3: FORA_DE_FILES: SIM, mas todos os arquivos estão em Files: de ${tarefa}`);
  } else if (tarefa) erros.push(`F3: a tarefa ${tarefa} não existe no plano aprovado`);
  return erros;
}

// F4: achados de revisão. O revisor não escreve veredito.
export function validaF4(texto, ctx) {
  const erros = [];
  const achados = texto.split("\n").filter((l) => /^\s*ACHADO\b/.test(l));
  let validos = 0;
  for (const l of achados) {
    const c = l.split("|").map((x) => x.trim());
    const ok = c.length >= 7 && /:\d+$/.test(c[1]) && SEVERIDADES.includes(c[2]) && /^CENARIO:/.test(c[4]) && /^REGRA:/.test(c[5]) && /^REVISOR:/.test(c[6]);
    if (!ok) erros.push(`F4: linha de achado inválida: ${l.trim().slice(0, 80)}`);
    else if ((c[2] === "CRITICO" || c[2] === "ALTO") && c[4].replace(/^CENARIO:/, "").trim() === "") erros.push(`F4: achado ${c[2]} sem cenário: ${c[1]}`);
    else validos++;
  }
  if (/^\s*VEREDITO\b/m.test(texto)) erros.push("F4: o revisor não escreve veredito (ele é calculado pela síntese F5)");
  const revisados = lista(campo(texto, "ARQUIVOS_REVISADOS"));
  if (revisados.length === 0) erros.push("F4: falta ARQUIVOS_REVISADOS");
  const files = ctx.planos.flatMap((p) => Object.values(p.tarefas).flat());
  const esperados = ctx.alterados && files.length ? ctx.alterados.filter((a) => dentroDeFiles(files, a)) : [];
  const faltam = esperados.filter((a) => !revisados.includes(a));
  if (faltam.length) erros.push(`F4: ARQUIVOS_REVISADOS deixa de fora arquivos alterados da wave: ${faltam.join(", ")}`);
  if (campo(texto, "ACHADOS_DESCARTADOS_POR_FALTA_DE_CENARIO") === undefined) erros.push("F4: falta ACHADOS_DESCARTADOS_POR_FALTA_DE_CENARIO");
  const res = campo(texto, "RESULTADO");
  if (res === undefined) erros.push("F4: falta RESULTADO");
  else if (res === "NENHUM_ACHADO" && achados.length) erros.push("F4: RESULTADO: NENHUM_ACHADO, mas há linhas ACHADO");
  else if (res !== "NENHUM_ACHADO" && Number(/^(\d+) ACHADOS?$/.exec(res)?.[1] ?? -1) !== validos) erros.push(`F4: RESULTADO (${res}) não bate com as ${validos} linhas válidas`);
  return erros;
}

// F5: síntese calculada por script. Devolve { texto, veredito, erros }.
export function sintese(relatos, esperados = ["code-reviewer", "security-reviewer"]) {
  const recebidos = relatos.map((r) => r.persona);
  const erros = [];
  for (const e of esperados) if (!recebidos.includes(e)) erros.push(`F5: falta o revisor ${e}`);
  const linhas = [];
  let invalidas = 0;
  for (const r of relatos) {
    for (const l of r.texto.split("\n").filter((x) => /^\s*ACHADO\b/.test(x))) {
      const c = l.split("|").map((x) => x.trim());
      if (c.length >= 7 && SEVERIDADES.includes(c[2])) linhas.push({ sev: c[2], linha: l.trim() });
      else invalidas++;
    }
  }
  if (invalidas) erros.push(`F5: ${invalidas} linha(s) de achado inválida(s)`);
  const temBloqueio = linhas.some((x) => x.sev === "CRITICO" || x.sev === "ALTO");
  const veredito = temBloqueio ? "BLOQUEADO" : linhas.some((x) => x.sev === "MEDIO") ? "APROVADO_COM_RESSALVA" : "APROVADO";
  const unicos = [...new Set(linhas.map((x) => x.linha))];
  const texto = [
    `REVISORES_ESPERADOS: ${esperados.join(", ")}`,
    `REVISORES_RECEBIDOS: ${recebidos.join(", ")}`,
    `LINHAS_INVALIDAS: ${invalidas}`,
    "ACHADOS (repetidos juntados):",
    ...(unicos.length ? unicos.map((x) => `  ${x}`) : ["  nenhum"]),
    `VEREDITO: ${erros.length ? "BLOQUEADO" : veredito}`,
    "DESTINO DE CADA ACHADO: reparo | volta ao plano | volta à SPEC | aceito pelo humano (frase registrada no estado.md)",
  ].join("\n");
  return { texto, veredito: erros.length ? "BLOQUEADO" : veredito, erros };
}

// F6: bloco de estado e histórico de acréscimo.
export function validaF6(texto, raiz) {
  const erros = [];
  const etapa = (campo(texto, "ETAPA_ATUAL") ?? "").split(/\s/)[0];
  if (!SEQUENCIA.includes(etapa)) erros.push(`F6: ETAPA_ATUAL ${etapa || "ausente"} inválida`);
  const prox = campo(texto, "PROXIMA_ETAPA_PERMITIDA");
  if (!SEQUENCIA.includes(prox ?? "")) erros.push(`F6: PROXIMA_ETAPA_PERMITIDA ${prox ?? "ausente"} inválida`);
  if (!/^(NAO|SIM:\s*\S)/.test(campo(texto, "ESPERA_HUMANO") ?? "")) erros.push("F6: ESPERA_HUMANO precisa ser NAO ou `SIM: <frase exata esperada>`");
  for (const c of ["SPEC", "PLANO"]) {
    const m = new RegExp(`^${c}:\\s*(\\S+)\\s+sha256=([0-9a-f]{12})`, "m").exec(texto);
    if (!m) erros.push(`F6: falta ${c}: <caminho> sha256=<hash>`);
    else if (!existsSync(join(raiz, m[1]))) erros.push(`F6: ${c} ${m[1]} não existe`);
    else if (hash12(join(raiz, m[1])) !== m[2]) erros.push(`F6: o hash de ${m[1]} mudou depois da aprovação`);
  }
  for (const l of texto.split("\n").filter((x) => /^\d{4}-\d\d-\d\d \d\d:\d\d \|/.test(x))) {
    const c = l.split("|").map((x) => x.trim());
    if (c.length < 4 || c.slice(1, 4).some((x) => x === "")) erros.push(`F6: linha do histórico sem quem, evento ou evidência: ${l.slice(0, 60)}`);
  }
  return erros;
}

// F8: decisão do orquestrador.
export function validaF8(texto) {
  const decisoes = texto.split("\n").filter((l) => /^\s*DECISAO\s+D-\d+/.test(l));
  if (decisoes.length === 0) return ["F8: nenhuma linha `DECISAO D-NN | ...`"];
  return decisoes.flatMap((l) => {
    const c = l.split("|").map((x) => x.trim());
    const ok = c.length >= 5 && /^MOTIVO:\s*\S/.test(c[2]) && /^CUSTO SE ERRADO:\s*\S/.test(c[3]) && /^MUDA ESCOPO, PLANO OU STATUS:\s*(NAO|SIM:\s*\S)/.test(c[4]);
    return ok ? [] : [`F8: decisão incompleta: ${l.trim().slice(0, 70)}`];
  });
}

// F9: relatório de agente externo (Codex, OpenCode, Antigravity).
export function validaF9(texto, ctx) {
  const erros = validaF1(texto, { papel: undefined, demandas: ctx.demandas });
  for (const c of ["ESCREVI_EM", "COMANDOS_RODADOS", "O_QUE_NAO_FOI_VERIFICADO", "DECISAO_QUE_O_HUMANO_PRECISA_TOMAR"]) if (!campo(texto, c)) erros.push(`F9: falta o campo ${c}`);
  const cmds = campo(texto, "COMANDOS_RODADOS") ?? "";
  if (cmds && cmds !== "nenhum" && !/EXIT\s+\d+/.test(cmds)) erros.push("F9: COMANDOS_RODADOS sem `EXIT <n>`");
  const escrevi = lista(campo(texto, "ESCREVI_EM"));
  if (ctx.alterados) {
    const fora = ctx.alterados.filter((a) => !escrevi.some((e) => a === e || a.startsWith(e.endsWith("/") ? e : `${e}/`)));
    if (fora.length) erros.push(`F9: o git status mostra arquivo fora de ESCREVI_EM: ${fora.slice(0, 5).join(", ")}`);
  }
  return erros;
}

// F10: fechamento de etapa.
export function validaF10(texto, raiz) {
  const m = /^ETAPA_CONCLUIDA:\s*(E\d+b?)\b[^|]*\|\s*EVIDENCIA:\s*(\S+)\s*\|\s*PROXIMA:\s*(E\d+b?|CONCLUIDA)\s*\|\s*ESPERA_HUMANO:\s*(NAO|SIM)/m.exec(texto);
  if (!m) return ["F10: linha fora de `ETAPA_CONCLUIDA: Ex | EVIDENCIA: <caminho> | PROXIMA: Ey | ESPERA_HUMANO: NAO`"];
  const erros = [];
  const i = SEQUENCIA.indexOf(m[1]);
  const volta = ["E5", "E4", "E3"].includes(m[3]) && i > SEQUENCIA.indexOf(m[3]);
  if (SEQUENCIA[i + 1] !== m[3] && !volta && !(m[1] === "E3" && m[3] === "E4")) erros.push(`F10: depois de ${m[1]} não vem ${m[3]} (fluxo.md)`);
  if (/[\/.]/.test(m[2]) && !existsSync(resolve(raiz, m[2]))) erros.push(`F10: a evidência ${m[2]} não existe`);
  return erros;
}

// Escolhe o formato pelo papel da linha F1 (ou pelo --papel).
export function validaRelato(texto, raiz, papelEsperado) {
  const ctx = ctxDe(raiz);
  const papel = papelEsperado ?? /^PAPEL:\s*(\S+)/.exec(primeiraLinha(texto))?.[1];
  const erros = validaF1(texto, { papel: papelEsperado, demandas: ctx.demandas });
  if (IMPLEMENTADORES.has(papel)) erros.push(...validaF3(texto, ctx));
  else if (REVISORES.has(papel)) erros.push(...validaF4(texto, ctx));
  else if (papel) erros.push(`F1: o papel ${papel} não tem formato de relato definido`);
  return erros;
}

function cli(args) {
  const [modo, ...resto] = args;
  const raiz = process.cwd();
  const le = (a) => readFileSync(a, "utf8");
  let erros;
  if (modo === "relato") {
    const i = resto.indexOf("--papel");
    erros = validaRelato(le(resto[0]), raiz, i >= 0 ? resto[i + 1] : undefined);
  } else if (modo === "sintese") {
    const r = sintese(resto.map((a) => ({ persona: /^PAPEL:\s*(\S+)/.exec(primeiraLinha(le(a)))?.[1] ?? a, texto: le(a) })));
    console.log(r.texto);
    erros = r.erros;
  } else if (modo === "estado") erros = validaF6(le(join(raiz, "docs", "fluxo", resto[0], "estado.md")), raiz);
  else if (modo === "decisao") erros = validaF8(le(resto[0]));
  else if (modo === "etapa") erros = validaF10(le(resto[0]), raiz);
  else if (modo === "externo") erros = validaF9(le(resto[0]), ctxDe(raiz));
  else if (modo === "pulo") erros = validaF2(le(resto[0]));
  else {
    console.error("uso: validar-saida.mjs relato|sintese|estado|decisao|etapa|externo|pulo <arquivo...>");
    process.exit(2);
  }
  if (erros.length) {
    console.error(erros.map((e) => `ERRO ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("válido");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    cli(process.argv.slice(2));
  } catch (e) {
    console.error(`validar-saida falhou: ${e.message}`);
    process.exit(2);
  }
}
