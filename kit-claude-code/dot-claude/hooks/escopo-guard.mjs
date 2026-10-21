#!/usr/bin/env node
// PreToolUse em Edit|Write|MultiEdit|NotebookEdit. Faz cumprir a coluna
// "Edita código" de AGENTS.md, pelo agent_type que o Claude Code informa no evento:
//   revisoras e validador-visual: só escrevem em docs/fluxo/ (o relato delas);
//   test-engineer e debugger: só arquivos de teste, mais docs/fluxo/;
//   sessão principal (sem agent_type) e orquestrador/tech-lead: não implementam;
//     escrevem só documentação (docs/), memória (.agents/memory/) e .md da raiz.
// Implementadoras: não são limitadas aqui. Dentro de uma tarefa, a regra "só os
// arquivos de Files:" fica com a revisão (git diff).
// Vale também para escrita por Bash (alvosDeEscrita, da guard-lib): `echo x > src/a.ts` não é saída.
// Liberação: HARNESS_BYPASS=1 (início do projeto) ou .claude/liberar-regras.
import { block, liberado, targetPath, principal } from "./hook-io.mjs";
import { alvosDeEscrita } from "./guard-lib.mjs";

const SO_RELATO = new Set(["code-reviewer", "security-reviewer", "validador-visual", "devops-engineer"]);
const SO_TESTE = new Set(["test-engineer", "debugger"]);
const NAO_IMPLEMENTA = new Set(["orquestrador", "tech-lead"]);
const RELATO = /^docs\/fluxo\//;
const TESTE = /(^|\/)(__tests__|__mocks__|__snapshots__|tests?|e2e|fixtures|mocks|test-utils|testing)\/|\.(test|spec)\.[cm]?[jt]sx?(\.snap)?$|(^|\/)(test-utils|setupTests|vitest\.setup|jest\.setup)\.[cm]?[jt]sx?$|\.snap$/;
const ORQUESTRA_ESCREVE = /^(docs\/|\.agents\/memory\/|[^/]+\.md$)/i;
const MEMORIA = /^\.agents\/memory\//i;

// Artefato de build que a orquestradora pode apagar ou recriar por Bash.
const ARTEFATO = /^(node_modules|dist|build|coverage|\.next|\.turbo|graphify-out)(\/|$)/i;

function avalia(tipo, p, bash) {
  if (p === "") return;
  if (!tipo || NAO_IMPLEMENTA.has(tipo)) {
    if (p.startsWith("/") || ORQUESTRA_ESCREVE.test(p) || (bash && ARTEFATO.test(p))) return;
    block(
      `A sessão principal orquestra, não implementa (AGENTS.md, regra 4). ${p} não é documentação nem memória. Despache a persona da tabela de AGENTS.md (com \`model\`) e deixe-a escrever. Para mudar regra ou iniciar o projeto, o humano libera (HARNESS_BYPASS=1 ou touch .claude/liberar-regras).`,
    );
  }
  if (p.startsWith("/")) return;
  if (MEMORIA.test(p)) {
    block(
      `${tipo} não atualiza a memória (${p}). Só a orquestradora, em E11, depois do último commit (.agents/rules/memoria.md). Escreva o que vale lembrar no seu relato e devolva.`,
    );
  }
  if (SO_RELATO.has(tipo) && !RELATO.test(p)) {
    block(
      `${tipo} é só leitura: escreve apenas o próprio relato em docs/fluxo/. ${p} é código ou configuração. Registre como achado no relato e devolva.`,
    );
  }
  if (SO_TESTE.has(tipo) && !RELATO.test(p) && !TESTE.test(p)) {
    block(
      `${tipo} edita só arquivos de teste (e o próprio relato em docs/fluxo/). ${p} não é teste. Relate a causa ou a necessidade ao orquestrador, que despacha a persona certa.`,
    );
  }
}

export function checar(event) {
  if (liberado(event)) return;
  const tipo = event.agent_type;
  if (event.tool_name === "Bash") {
    for (const a of alvosDeEscrita(String(event.tool_input?.command ?? ""), event)) if (!a.amplo) avalia(tipo, a.p, true);
    return;
  }
  avalia(tipo, targetPath(event), false);
}

principal(import.meta.url, checar);
