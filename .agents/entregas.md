# Entregas: o que cada parte do fluxo gera

O `fluxo.md` diz **quando** cada etapa começa e **quem** a faz. Este arquivo diz **o que ela precisa deixar gravado**. Etapa sem a entrega gravada não está feita, e a próxima não começa. Tudo da demanda fica em `docs/fluxo/<demanda>/`, exceto a definição (`docs/definicao/`), a SPEC e o plano (`docs/superpowers/`).

## Parte 1: Entrada da demanda (E0)

A definição é o que alimenta todo o resto: sem ela, a SPEC inventa. Ela traz quatro conteúdos, que podem ser **quatro arquivos ou um só** (a aglutinação é livre, desde que as quatro seções existam):

| Conteúdo | O que tem | Para quem serve |
|---|---|---|
| PRD | problema, objetivo, quem usa, o que o sistema faz, como saber que deu certo | gestão e desenvolvimento |
| Regras de negócio | uma por linha, numeradas, testáveis, com exemplo que cumpre e exemplo que viola | desenvolvimento e testes |
| Contexto do projeto | de onde vem, o que já existe, tentativas anteriores (o que funcionou e o que não), restrições | gestão e orquestrador |
| MVP | o que entra na primeira entrega e o que fica fora de propósito | gestão e plano |

Modelo: `templates/definicao.md`.

### Duas formas de entrar

- **A. Conversa separada, antes ou fora do harness (preferida).** O humano conduz a definição numa conversa à parte, com a skill `brainstorming` do Superpowers: uma pergunta por vez, até não restar ambiguidade. Pode acontecer antes de o harness existir no projeto. O produto é o arquivo (ou os quatro) no modelo acima. O humano o coloca em `docs/definicao/` do projeto e chama o `tech-lead` para **receber**.
- **B. Conduzida pelo `tech-lead` (Codex).** Quando não existe definição, ele conduz a conversa dentro do projeto, do mesmo jeito (`personas/tech-lead.md`).

Nas duas formas a **recepção** é do `tech-lead`. Ele confere a definição contra o checklist da persona, pergunta o que faltar (sem refazer o que já está bom) e grava o resto.

| Quem | Gera | Onde | Pronto quando |
|---|---|---|---|
| Humano + agente com Superpowers (forma A) ou `tech-lead` (forma B) | a definição | `docs/definicao/` | as quatro seções existem; cada regra de negócio é testável; o MVP diz o que fica fora; nenhuma decisão de stack ou arquitetura |
| `tech-lead` (recepção) | o estado da demanda | `docs/fluxo/<demanda>/estado.md` (modelo `estado.md`) | existe, em E0 |
| `tech-lead` (recepção) | o pedido ao orquestrador | `docs/fluxo/<demanda>/handoff/pedido.md` | traz o caminho da definição, resumo de até 5 linhas e as perguntas em aberto |

**Pedido pequeno (C1):** sem definição longa. O pedido é o próprio texto do humano em `handoff/pedido.md`.

## Parte 2: Preparação e SPEC (E1, E2, E3, E3b, aprovação)

| Etapa | Quem | Gera | Onde | Pronto quando |
|---|---|---|---|---|
| E1 | orquestrador | branch e conferência do git | branch `demanda/<slug>`; nota em `estado.md` | `git status --short` limpo ou explicado |
| E2 | orquestrador | consultas prévias | seção "Consultas feitas" da SPEC (`rules/consulta.md`) | vault, grafo, documentos, estrutura e Context7 consultados e registrados |
| E3 | orquestrador | a SPEC | `docs/superpowers/specs/AAAA-MM-DD-<slug>.md` (modelo `modelo-spec.md`) | objetivo, escopo, critérios de aceite observáveis, regras de negócio **tiradas da definição** (a SPEC não cria regra nova), declaração C1 ou completo, riscos, decisões do humano; hash calculado |
| E3b | Codex | parecer da SPEC (pulado no C1) | `revisao-spec.md` | contradição com a definição, lacuna e risco, cada achado com o cenário que quebra |
| Aprovação | humano | a frase `Aprovo a SPEC.` | `estado.md` (frase, data, sha256) | registrada pelo orquestrador |

## Parte 3: Plano (E4 e aprovação)

| Etapa | Quem | Gera | Onde | Pronto quando |
|---|---|---|---|---|
| E4 | orquestrador | a stack, se faltar | `.agents/stack.md` (arquivo de regra: pede liberação ao humano) | registrada |
| E4 | orquestrador | o plano | `docs/superpowers/plans/AAAA-MM-DD-<slug>.md` | cada tarefa tem ID, `Files:`, `Resources:`, `Depends-on:`, dono e verificação; tarefa de contrato quando há dependência entre implementadores; hash calculado |
| Aprovação | humano | a frase `Aprovo o plano.` | `estado.md` | registrada |

## Parte 4: Execução e verificação (E5 a E9), repetida a cada wave

| Etapa | Quem | Gera | Onde | Pronto quando |
|---|---|---|---|---|
| E5 | personas implementadoras | código, testes e o relato da tarefa | arquivos da tarefa; `handoff/wave-N-<tarefa>.md` (modelo `handoff.md`, relato F3) | relato no formato fixo; ninguém commitou |
| E6 | `code-reviewer` e `security-reviewer` | um parecer cada, independentes; depois a síntese | `revisao-wave-N-<persona>.md` e `revisao-wave-N.md` (modelo `revisao-wave.md`) | hash da SPEC e do plano conferidos; sem crítico ou alto aberto |
| E7 | `validador-visual` | validação contra os critérios de aceite | `validacao-wave-N.md` (modelo `validacao-wave.md`), ou "não se aplica" | console, rede e critérios verificados no navegador |
| E8 | orquestrador | o recibo dos gates | `recibo-gates.md` | `lint`, `typecheck`, `lint:typed` e `test` passaram, sem compressão |
| E9 | orquestrador | um commit por tarefa | git; hashes em `estado.md` | gates verdes; outra wave no plano volta ao E5 |
| Reparo | quem falhou | o registro do reparo | modelo `reparo.md` | três tentativas no máximo, depois o humano decide |

## Parte 5: Fechamento técnico (E10 e E11)

| Etapa | Quem | Gera | Onde | Pronto quando |
|---|---|---|---|---|
| E10 | orquestrador | a entrada da revisão: saída crua de `gitleaks` e `npm audit` | anexada ao pedido de revisão (modelo `revisao-final.md`) | antes do pedido, nunca depois |
| E10 | Codex | a revisão final da branch | `revisao-final.md` | hash conferido; dois subagentes (código e segurança); sem crítico ou alto |
| E11 | orquestrador | índice de memória, nota de entrega, grafo e relatório | vault (modelo `nota-entrega.md`, lida de volta); `graphify update`; `relatorio.md` | `estado.md` passa a `concluída` |

## Parte 6: Entrega (E12 e E13)

| Etapa | Quem | Gera | Onde | Pronto quando |
|---|---|---|---|---|
| E12 | humano | o merge na `main` | git | feito pelo humano; agente nunca faz merge nem push |
| E13 | `devops-engineer` (OpenCode) | o roteiro de deploy | `deploy-NN.md` (modelo `deploy.md`) | backup do banco, pré-condições, passos, teste rápido e plano de volta; diz o que **não** executou |
| E13 | humano | a execução e o teste rápido no ar | produção | teste rápido passando |

## Regra de ouro

Cada documento nasce do anterior: a SPEC cita a definição, o plano cita a SPEC, o relato cita a tarefa, a revisão cita o hash. Quem escreve um documento não o aprova, e quem aprova (o humano) só aprova o que leu. A cadeia está em `estado.md`.
