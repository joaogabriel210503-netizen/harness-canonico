#!/usr/bin/env node
// PreToolUse. Travas de "mudança de regra", que só o humano decide
// (.agents/rules/gates.md, "O que nunca fazer para passar"):
//   1. editar o arquivo que define as regras (lint, hooks, constituição, gates,
//      settings, hooks do git) ou o arquivo que as libera;
//   2. escrever, em qualquer código, um atalho que cala o verificador:
//      eslint-disable, comentário de config do eslint, @ts-ignore, @ts-nocheck,
//      teste ignorado (.skip, xit) ou .only;
//   3. editar à mão código gerado (generated/);
//   4. escrever em pasta do usuário que decide como o agente roda (~/.claude, rc de shell);
//   5. mandar a frase de aprovação a outra sessão (maestri ask, SendMessage);
//   6. por Bash: escrever nesses arquivos, subir sessão aninhada de outra CLI,
//      atribuir HARNESS_*, rodar interpretador com código inline que cita arquivo de regra.
// Liberação: o humano, no terminal dele, roda `touch .claude/liberar-regras` ou
// abre a sessão com HARNESS_BYPASS=1. Apague o arquivo ao terminar.
// Falha da própria trava BLOQUEIA (hook-io.mjs, modo "guarda").
import { block, emCasaProtegida, liberado, targetPath, principal } from "./hook-io.mjs";
import {
  ATRIBUI_HARNESS,
  GERADOS,
  cliAninhada,
  escreveEmProtegido,
  inlineQueCitaRegra,
  protegido,
} from "./guard-lib.mjs";

const ATALHOS = [
  [/eslint-disable|eslint-enable/, "comentário eslint-disable"],
  [/\/\*\s*eslint(?!-)\s/, "comentário de configuração do eslint (/* eslint regra: off */)"],
  [/biome-ignore|oxlint-disable/, "comentário que cala o linter"],
  [/@ts-ignore/, "@ts-ignore"],
  [/@ts-nocheck/, "@ts-nocheck"],
  [/\b(it|test|describe)\.skip\s*\(|\b(xit|xtest|xdescribe)\s*\(/, "teste ignorado (skip, xit)"],
  [/\b(it|test|describe)\.only\s*\(/, ".only em teste"],
];
const CODIGO = /\.[cm]?[jt]sx?$|\.(vue|svelte)$/i;
// Arquivos que descrevem esses atalhos sem usá-los: não são código de produto.
const SEM_ATALHO = /^(docs\/|\.agents\/|\.claude\/|vault\/|selftest\.mjs$|eslint-rules\/)/i;

// `biome check --write` (formatar) é permitido; `--suppress` e `--unsafe` não.
const BIOME_SUPRIME = /\bbiome\b[^|;&\n]*--(suppress|unsafe)\b/;

// A frase de aprovação é do humano. O agente que a manda para outra sessão (maestri ask,
// SendMessage) tenta fazê-la chegar como se fosse digitada (N02).
const FRASE_APROVACAO = /\baprovo\s+(a\s+spec|o\s+plano)\b/i;
const MSG_FRASE =
  "A frase de aprovação (\"Aprovo a SPEC.\", \"Aprovo o plano.\") é só do humano, digitada por ele. Não a envie a outra sessão. Peça a aprovação ao humano.";

const MSG_REGRA = (p) =>
  `${p} define ou libera as regras do harness. Mudar regra é decisão do humano. Pare, explique ao humano o que você queria mudar e por quê; se ele aprovar, ele mesmo roda \`touch .claude/liberar-regras\` no terminal dele.`;

function bash(event, cmd) {
  if (/\bmaestri\b/.test(cmd) && FRASE_APROVACAO.test(cmd)) block(MSG_FRASE);
  if (/travar-gates/.test(cmd)) {
    block(
      "travar-gates.mjs grava a impressão digital dos gates: quem decide que o lint, o tsconfig ou o teste mudou é o humano, no terminal dele. Pare e peça a ele.",
    );
  }
  if (BIOME_SUPRIME.test(cmd)) {
    block(
      "biome com --suppress ou --unsafe escreve comentário que cala o linter ou reescreve código sem revisão. Calar o verificador é mudança de regra, não de código (.agents/rules/gates.md). Corrija a causa ou peça ao humano.",
    );
  }
  if (ATRIBUI_HARNESS.test(cmd)) {
    block("Variável HARNESS_* num comando: é a forma de desligar as travas. Só o humano abre a sessão com ela.");
  }
  const cli = cliAninhada(cmd);
  if (cli) {
    block(
      `Sessão aninhada de outra CLI (${cli}) não passa pelas travas deste projeto. Use o terminal do Maestri (\`maestri ask\`) ou peça ao humano.`,
    );
  }
  if (inlineQueCitaRegra(cmd)) {
    block(
      "Interpretador com código inline que cita arquivo de regra ou variável do harness. O texto do código não dá para conferir: use as ferramentas Read e Edit (que passam pelas travas) ou peça ao humano.",
    );
  }
  if (escreveEmProtegido(cmd, event)) {
    block(
      "Este comando altera um arquivo de regras (lint, hooks, constituição, gates, settings, hooks do git) ou uma pasta do usuário que decide como o agente roda. Mudar regra é decisão do humano. Pare e peça a ele; se ele aprovar, ele mesmo roda `touch .claude/liberar-regras` no terminal dele.",
    );
  }
}

export function checar(event) {
  if (liberado(event)) return;
  const tool = event.tool_name;
  const input = event.tool_input ?? {};

  if (tool === "Bash") return bash(event, String(input.command ?? ""));
  if (tool === "SendMessage") {
    if (FRASE_APROVACAO.test(JSON.stringify(input))) block(MSG_FRASE);
    return;
  }

  const p = targetPath(event);
  if (p === "") return;

  if (protegido(p) || (p.startsWith("/") && emCasaProtegida(p))) block(MSG_REGRA(p));

  if (GERADOS.test(p)) {
    block(
      `${p} é código gerado por ferramenta: ninguém edita à mão, e o lint não confere esta pasta. Mude a origem e rode o comando que gera.`,
    );
  }

  if (CODIGO.test(p) && !SEM_ATALHO.test(p)) {
    const novo = [input.content, input.new_string, ...(input.edits ?? []).map((e) => e?.new_string), input.new_source]
      .filter((x) => typeof x === "string")
      .join("\n");
    for (const [re, nome] of ATALHOS) {
      if (re.test(novo)) {
        block(
          `Bloqueado: ${nome} em ${p}. Calar o verificador é mudança de regra, não de código (.agents/rules/gates.md). Corrija a causa. Se for exceção legítima, pare e peça ao humano.`,
        );
      }
    }
  }
}

principal(import.meta.url, checar);
