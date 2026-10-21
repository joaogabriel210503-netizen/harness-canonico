// Casos dos hooks, parte 5 (W4): relato-guard (SubagentStop), recibo-guard (Stop), recibo-gates e validar-saida.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AQUI, T, caso, estado, w } from "./selftest-lib.mjs";
import { sintese, validaF2, validaF6, validaF8, validaF9, validaF10 } from "./validar-saida.mjs";
import { lerDemandas } from "./formatos-lib.mjs";

const r5 = mkdtempSync(join(tmpdir(), "harness-w4-"));
const git = (...a) => spawnSync("git", ["-C", r5, "-c", "user.email=t@t", "-c", "user.name=t", ...a], { encoding: "utf8" });
const h12 = (rel) => createHash("sha256").update(readFileSync(join(r5, rel))).digest("hex").slice(0, 12);
const SPEC = "docs/superpowers/specs/s.md";
const PLANO = "docs/superpowers/plans/p.md";
w(SPEC, "# SPEC\n\n## Consultas feitas\n- nada\n", r5);
w(PLANO, "# Plano\n\n### T01 Soma\n- **Files:** `src/a.ts`\n- **Resources:** nenhum\n", r5);
const grava = (etapa = "E5") =>
  w("docs/fluxo/demo/estado.md", estado(`${SPEC} | "Aprovo a SPEC." | 2026-10-20 | ${h12(SPEC)}`, `${PLANO} | "Aprovo o plano." | 2026-10-20 | ${h12(PLANO)}`).replace("**Etapa atual:** E5", `**Etapa atual:** ${etapa}`), r5);
grava();
w("package.json", JSON.stringify({ scripts: { lint: "node -e 0", typecheck: "node -e 0", test: "node -e 0" } }), r5);
git("init", "-q", "-b", "demanda/demo");
git("add", "-A");
git("commit", "-qm", "base");
w("src/a.ts", "export const a = 1;\n", r5);
w("src/b.ts", "export const b = 1;\n", r5);

const SH = h12(SPEC);
const PH = h12(PLANO);
const f3 = (o = {}) => `${o.f1 ?? "PAPEL: backend-specialist | DEMANDA: demo | ETAPA: E5"}
STATUS: ${o.status ?? "CONCLUIDA"}
TAREFA: T01 | WAVE: 1 | PERSONA: backend-specialist | MODELO: haiku
SPEC_SHA256: ${o.spec ?? SH} | PLANO_SHA256: ${o.plano ?? PH}
ARQUIVOS_TOCADOS: ${o.tocados ?? "src/a.ts"}
FORA_DE_FILES: ${o.fora ?? "NAO"}
TESTE_VIU_FALHAR: NAO_SE_APLICA: constante
GATES:
  lint: EXIT ${o.lint ?? 0}
  typecheck: EXIT 0
  test: EXIT 0 (1/1)
SAIDA_DOS_GATES: (bloco cru)
COMMIT_FEITO: NAO
SUPOSICOES: nenhuma
FICOU_DE_FORA: nada`;
const ACH = "ACHADO | src/a.ts:1 | MEDIO | texto | CENARIO: entrada x quebra | REGRA: SPEC 2 | REVISOR: code-reviewer";
const f4 = (o = {}) => `PAPEL: code-reviewer | DEMANDA: demo | ETAPA: E5
${o.achados ?? ""}
ARQUIVOS_REVISADOS: ${o.revisados ?? "src/a.ts"}
ACHADOS_DESCARTADOS_POR_FALTA_DE_CENARIO: 0
RESULTADO: ${o.resultado ?? "NENHUM_ACHADO"}
${o.extra ?? ""}`;
const sstop = (agent_type, last_assistant_message, extra = {}) => ({ hook_event_name: "SubagentStop", agent_type, agent_id: "a1", last_assistant_message, stop_hook_active: false, ...extra });

// ---- relato-guard
const RG = "relato-guard.mjs";
caso("relato F3 completo e coerente", RG, sstop("backend-specialist", f3()), 0, {}, undefined, r5);
caso("relato CONCLUIDA com lint EXIT 1", RG, sstop("backend-specialist", f3({ lint: 1 })), 2, {}, undefined, r5);
caso("relato sem a linha F1", RG, sstop("backend-specialist", f3().split("\n").slice(1).join("\n")), 2, {}, undefined, r5);
caso("relato com PAPEL diferente de quem respondeu", RG, sstop("backend-specialist", f3({ f1: "PAPEL: frontend-specialist | DEMANDA: demo | ETAPA: E5" })), 2, {}, undefined, r5);
caso("relato com ETAPA diferente do estado.md", RG, sstop("backend-specialist", f3({ f1: "PAPEL: backend-specialist | DEMANDA: demo | ETAPA: E7" })), 2, {}, undefined, r5);
caso("relato cita arquivo sem mudança no git", RG, sstop("backend-specialist", f3({ tocados: "src/fantasma.ts" })), 2, {}, undefined, r5);
caso("relato FORA_DE_FILES: NAO com arquivo fora do plano", RG, sstop("backend-specialist", f3({ tocados: "src/a.ts src/b.ts" })), 2, {}, undefined, r5);
caso("relato FORA_DE_FILES: SIM declarado e verdadeiro", RG, sstop("backend-specialist", f3({ tocados: "src/a.ts src/b.ts", fora: "SIM: src/b.ts" })), 0, {}, undefined, r5);
caso("relato com hash da SPEC que não é o aprovado", RG, sstop("backend-specialist", f3({ spec: "000000000000" })), 2, {}, undefined, r5);
caso("relato ruim na segunda tentativa (stop_hook_active) passa", RG, sstop("backend-specialist", "pronto", { stop_hook_active: true }), 0, {}, undefined, r5);
caso("relato 'pronto' na primeira tentativa", RG, sstop("backend-specialist", "pronto"), 2, {}, undefined, r5);
caso("agente sem formato (Explore) passa", RG, sstop("Explore", "achei"), 0, {}, undefined, r5);
caso("entrada ilegível não prende o subagente", RG, {}, 0, {}, "{quebrado", r5);
w("docs/fluxo/demo/relato-T01.md", f3().split("\n").slice(1).join("\n"), r5);
caso("F1 na mensagem e o resto no arquivo do relato", RG, sstop("backend-specialist", "PAPEL: backend-specialist | DEMANDA: demo | ETAPA: E5\nRelato em docs/fluxo/demo/relato-T01.md"), 0, {}, undefined, r5);
caso("revisor: F4 sem achados", RG, sstop("code-reviewer", f4()), 0, {}, undefined, r5);
caso("revisor: F4 com um achado válido", RG, sstop("code-reviewer", f4({ achados: ACH, resultado: "1 ACHADO" })), 0, {}, undefined, r5);
caso("revisor escreve VEREDITO", RG, sstop("code-reviewer", f4({ extra: "VEREDITO: APROVADO" })), 2, {}, undefined, r5);
caso("revisor: ALTO sem cenário", RG, sstop("code-reviewer", f4({ achados: "ACHADO | src/a.ts:1 | ALTO | x | CENARIO:  | REGRA: y | REVISOR: code-reviewer", resultado: "1 ACHADO" })), 2, {}, undefined, r5);
caso("revisor: RESULTADO não bate com as linhas", RG, sstop("code-reviewer", f4({ achados: ACH, resultado: "NENHUM_ACHADO" })), 2, {}, undefined, r5);
caso("revisor deixa de fora arquivo alterado da wave", RG, sstop("code-reviewer", f4({ revisados: "src/outro.ts" })), 2, {}, undefined, r5);

// ---- recibo-guard (Stop) e recibo-gates
const RB = "recibo-guard.mjs";
const stop = (extra = {}) => ({ hook_event_name: "Stop", stop_hook_active: false, ...extra });
caso("Stop na E5 com código alterado: sem recibo ainda", RB, stop(), 0, {}, undefined, r5);
grava("E8");
caso("Stop na E8 com código alterado e sem recibo", RB, stop(), 2, {}, undefined, r5);
caso("Stop na E8, segunda tentativa (stop_hook_active)", RB, stop({ stop_hook_active: true }), 0, {}, undefined, r5);
caso("Stop de subagente não exige recibo", RB, stop({ agent_id: "a1" }), 0, {}, undefined, r5);
const rodou = spawnSync("node", [join(AQUI, "recibo-gates.mjs"), "demo"], { cwd: r5, encoding: "utf8" });
if (rodou.status !== 0) T.falhas++;
console.log(`${rodou.status === 0 ? "OK    " : "FALHOU"} recibo-gates.mjs   roda os três gates e grava o recibo`);
caso("Stop na E8 com recibo valido", RB, stop(), 0, {}, undefined, r5);
w("src/a.ts", "export const a = 2;\n", r5);
caso("Stop na E8: código mudou depois do recibo", RB, stop(), 2, {}, undefined, r5);
writeFileSync(join(r5, "package.json"), JSON.stringify({ scripts: { lint: "node -e 0", typecheck: "node -e 0", test: "node -e process.exit(1)" } }));
const falhou = spawnSync("node", [join(AQUI, "recibo-gates.mjs"), "demo"], { cwd: r5, encoding: "utf8" });
if (falhou.status === 0) T.falhas++;
console.log(`${falhou.status !== 0 ? "OK    " : "FALHOU"} recibo-gates.mjs   gate que falha sai com código diferente de zero`);
caso("Stop na E8 com recibo de gate que falhou", RB, stop(), 2, {}, undefined, r5);
caso("Stop: entrada ilegível não tranca a sessão", RB, {}, 0, {}, "{quebrado", r5);

// ---- validar-saida: formatos que não passam por hook
const confere = (nome, erros, queroErro) => {
  const ok = queroErro ? erros.length > 0 : erros.length === 0;
  if (!ok) T.falhas++;
  console.log(`${ok ? "OK    " : "FALHOU"} validar-saida.mjs ${nome.padEnd(62)} erros=${erros.length}${ok ? "" : ` | ${erros.join("; ")}`}`);
};
const ESTADO_F6 = `ETAPA_ATUAL: E5 (wave 1)\nPROXIMA_ETAPA_PERMITIDA: E6\nESPERA_HUMANO: NAO\nSPEC: ${SPEC} sha256=${SH}\nPLANO: ${PLANO} sha256=${PH}\n\n2026-10-20 00:10 | orquestrador | wave 1 despachada | docs/fluxo/demo/passagem-T01.md\n`;
confere("F6 coerente", validaF6(ESTADO_F6, r5), false);
confere("F6 com hash que não bate", validaF6(ESTADO_F6.replace(SH, "000000000000"), r5), true);
confere("F6 com histórico sem evidência", validaF6(`${ESTADO_F6}2026-10-20 00:11 | orquestrador | fez algo | \n`, r5), true);
confere("F6 ESPERA_HUMANO inválido", validaF6(ESTADO_F6.replace("ESPERA_HUMANO: NAO", "ESPERA_HUMANO: talvez"), r5), true);
confere("F8 completa", validaF8("DECISAO D-01 | usar X | MOTIVO: custo | CUSTO SE ERRADO: um dia | MUDA ESCOPO, PLANO OU STATUS: NAO"), false);
confere("F8 que muda status declarada", validaF8("DECISAO D-02 | y | MOTIVO: a | CUSTO SE ERRADO: b | MUDA ESCOPO, PLANO OU STATUS: SIM: aguarda o humano"), false);
confere("F8 sem custo", validaF8("DECISAO D-03 | y | MOTIVO: a | MUDA ESCOPO, PLANO OU STATUS: NAO"), true);
confere("F10 etapa seguinte", validaF10("ETAPA_CONCLUIDA: E6 wave 1 | EVIDENCIA: docs/fluxo/demo/estado.md | PROXIMA: E7 | ESPERA_HUMANO: NAO", r5), false);
confere("F10 pulando etapa", validaF10("ETAPA_CONCLUIDA: E6 wave 1 | EVIDENCIA: docs/fluxo/demo/estado.md | PROXIMA: E9 | ESPERA_HUMANO: NAO", r5), true);
confere("F10 com evidência inexistente", validaF10("ETAPA_CONCLUIDA: E6 | EVIDENCIA: docs/nao-existe.md | PROXIMA: E7 | ESPERA_HUMANO: NAO", r5), true);
confere("F10 volta ao E5 depois da E9 (outra wave)", validaF10("ETAPA_CONCLUIDA: E9 wave 1 | EVIDENCIA: docs/fluxo/demo/estado.md | PROXIMA: E5 | ESPERA_HUMANO: NAO", r5), false);
confere("F2 resposta a pedido de pular etapa", validaF2("ETAPA ATUAL: E3 SPEC\nO PEDIDO PULARIA: E4\nFALTA: aprovação\nNÃO EXECUTADO."), false);
confere("F2 sem 'NÃO EXECUTADO'", validaF2("ETAPA ATUAL: E3\nO PEDIDO PULARIA: E4\nFALTA: x"), true);
const ctx5 = { demandas: lerDemandas(r5), alterados: [] };
confere("F9 relatório externo", validaF9("PAPEL: tech-lead | DEMANDA: demo | ETAPA: E8\nESCREVI_EM: docs/fluxo/demo/relatorios/\nCOMANDOS_RODADOS: npm test → EXIT 0\nO_QUE_NAO_FOI_VERIFICADO: nada\nDECISAO_QUE_O_HUMANO_PRECISA_TOMAR: nenhuma", ctx5), false);
confere("F9 comando sem EXIT", validaF9("PAPEL: tech-lead | DEMANDA: demo | ETAPA: E8\nESCREVI_EM: docs/\nCOMANDOS_RODADOS: npm test\nO_QUE_NAO_FOI_VERIFICADO: nada\nDECISAO_QUE_O_HUMANO_PRECISA_TOMAR: nenhuma", ctx5), true);
const rev = (persona, texto) => ({ persona, texto });
const s1 = sintese([rev("code-reviewer", f4({ achados: ACH, resultado: "1 ACHADO" })), rev("security-reviewer", f4())]);
confere("F5: só MEDIO dá APROVADO_COM_RESSALVA", s1.veredito === "APROVADO_COM_RESSALVA" ? [] : [s1.veredito], false);
const s2 = sintese([rev("code-reviewer", f4({ achados: ACH.replace("MEDIO", "ALTO"), resultado: "1 ACHADO" })), rev("security-reviewer", f4())]);
confere("F5: ALTO dá BLOQUEADO", s2.veredito === "BLOQUEADO" ? [] : [s2.veredito], false);
confere("F5: sem achados dá APROVADO", sintese([rev("code-reviewer", f4()), rev("security-reviewer", f4())]).veredito === "APROVADO" ? [] : ["x"], false);
confere("F5: falta um revisor esperado", sintese([rev("code-reviewer", f4())]).erros, true);
const cli = spawnSync("node", [join(AQUI, "validar-saida.mjs"), "relato", join(r5, "docs/fluxo/demo/relato-T01.md")], { cwd: r5, encoding: "utf8" });
console.log(`INFO  validar-saida.mjs CLI relato sai com ${cli.status} (relato sem linha F1 é inválido)`);
if (cli.status !== 1) T.falhas++;
rmSync(r5, { recursive: true, force: true });
