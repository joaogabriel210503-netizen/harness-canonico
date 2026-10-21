# SPEC: [nome da demanda]

> Escrita só pelo orquestrador, em E3 (adendo v1, DP-04). O Codex não escreve a SPEC: ele a revisa na E3b (`revisao-spec.md`).
> Uma SPEC sem a seção "Consultas feitas" preenchida não libera código (`plano-guard`).

- **Demanda:** [slug]
- **Definição de origem:** `docs/fluxo/<demanda>/handoff/pedido.md` (ou `docs/definicao/...`)
- **SHA256 (12):** [12 primeiros caracteres do sha256 deste arquivo, preenchidos na apresentação ao humano; vão para o `estado.md` junto com a frase "Aprovo a SPEC."]

## Objetivo

Uma frase: o que muda quando isto estiver pronto.

## Consultas feitas

Obrigatória (`.agents/rules/consulta.md`). Escreva o que foi consultado e o que se achou, mesmo quando foi "nada".

- **Vault (MCP `harness-vault`):**
- **Grafo (`graphify-out/`):**
- **Documentos do projeto:**
- **Estrutura do código (pastas e arquivos que a mudança toca):**
- **Context7 (bibliotecas e versões):**

## Escopo

**Entra:**

- 

**Fica fora, de propósito:**

- 

## Critérios de aceite

Observáveis e testáveis, numerados. Cada um vira verificação de tarefa no plano.

1. 

## Regras de negócio aplicáveis

RN do pedido que esta SPEC cumpre (copie o número).

## Declaração do caminho (C1 ou completo)

Declare: **C1** ou **completo**. É C1 só se valer tudo (DP-25). Confira item a item e escreva o resultado:

| Critério do C1 | Vale? | Evidência |
|---|---|---|
| Até 3 arquivos | sim / não | lista dos arquivos |
| Uma wave só | sim / não | |
| Sem banco de dados nem migration | sim / não | |
| Sem dependência nova | sim / não | |
| Sem autenticação nem segurança | sim / não | |
| Sem arquivo protegido (regras, hooks, config de lint, `AGENTS.md`, `.agents/`) | sim / não | |

Um "não" ou uma dúvida em qualquer linha: **não é C1**. Se for C1, a SPEC é curta (objetivo, consultas, critérios), pula a E3b e o pedido pode ser o próprio texto do Gabriel. As duas aprovações e a revisão final do Codex (E10) continuam.

## Riscos e pontos de atenção

| Risco | Probabilidade | O que fazer |
|---|---|---|

## Decisões que o humano precisa tomar

Liste cada uma com a recomendação. A SPEC não segue com pergunta em aberto que mude o escopo.

## Apresentação para aprovação (preencha ao pedir a frase)

- **Arquivo:** caminho desta SPEC
- **Resumo (até 5 linhas):**
- **SHA256 (12):** igual ao campo do topo
- **Parecer do Codex (E3b):** `docs/fluxo/<demanda>/revisao-spec.md`, ou "pulada: C1"

O humano responde só com a frase: `Aprovo a SPEC.`
