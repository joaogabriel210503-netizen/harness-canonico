# Fluxo

Toda demanda percorre as etapas abaixo, nesta ordem. O estado de cada demanda fica em `docs/fluxo/<demanda>/estado.md` e é a única fonte sobre "onde estamos". Leia antes de agir; atualize ao terminar uma etapa.

Uma etapa só começa quando a coluna **Só começa quando** é verdadeira. Se não for, pare e diga ao humano o que falta. Toda resposta de agente começa pela linha F1 e os relatos seguem os formatos de `rules/formatos.md`.

| Etapa | Quem | Só começa quando | O que acontece | O que fica gravado |
|---|---|---|---|---|
| **E0 Definição** | `tech-lead` (Codex) com o humano | O humano trouxe uma demanda, em qualquer linguagem | Uma pergunta por vez até fechar PRD, regras de negócio, contexto e MVP. Conduz a definição; **não escreve a SPEC** | `docs/definicao/`, `estado.md`, `handoff/pedido.md` |
| **E1 Preparação** | `orquestrador` | Existe `handoff/pedido.md` | Confere o git, cria `demanda/<slug>` e confere o que agente externo deixou (`git status --short`) | Branch criada |
| **E2 Consulta prévia** | `orquestrador` | E1 feita | Vault (MCP), grafo, documentos, estrutura, Context7. Ver `rules/consulta.md` | Seção "Consultas feitas" |
| **E3 SPEC** | `orquestrador` | E2 feita | Superpowers `brainstorming`; critérios de aceite; declara se a demanda é C1 | `docs/superpowers/specs/AAAA-MM-DD-<slug>.md`, com hash |
| **E3b Revisão da SPEC** | Codex | SPEC escrita. **Pulada no C1** | Parecer por escrito: contradição com a definição, lacuna, risco | `revisao-spec.md` |
| **Aprovação da SPEC** | Humano | SPEC e parecer entregues | Ver "Aprovação com hash". Frase: `Aprovo a SPEC.` | Frase, data e sha256 em `estado.md` |
| **E4 Plano** | `orquestrador` | Aprovação da SPEC registrada | Registra a stack em `.agents/stack.md` se faltar (arquivo de regra: pede ao humano a liberação e o religamento); `writing-plans`: tarefas com ID, `Files:`, `Resources:`, `Depends-on:`, dono e verificação; tarefa de contrato quando implementadores dependem um do outro. Ver `rules/ondas.md` | `docs/superpowers/plans/AAAA-MM-DD-<slug>.md`, com hash |
| **Aprovação do plano** | Humano | Plano apresentado | Frase: `Aprovo o plano.` | Frase, data e sha256 em `estado.md` |
| **E5 Wave N** | Personas implementadoras | Plano aprovado; wave anterior commitada | Em paralelo, um arquivo de passagem por tarefa; teste primeiro só para lógica; ninguém commita | `handoff/wave-N-<tarefa>.md` (relato F3) |
| **E6 Revisão interna** | `code-reviewer` e `security-reviewer` | Todos reportaram | Independentes, só leitura, um não vê o outro; cada um confere o hash da SPEC e do plano; síntese F5 por script | `revisao-wave-N-<persona>.md`, `revisao-wave-N.md` |
| **E7 Navegador** | `validador-visual` | E6 sem crítico ou alto; a wave toca tela | agent-browser e Chrome DevTools contra os critérios de aceite. Wave sem tela pula e registra "não se aplica" | `validacao-wave-N.md` |
| **E8 Gates** | `orquestrador` | E6 e E7 sem pendência | `lint`, `typecheck`, `lint:typed`, `test`, sem compressão; `recibo-gates.mjs` grava o recibo. Ver `rules/gates.md` | `recibo-gates.md` |
| **E9 Commit** | `orquestrador` | E8 passou inteira | Um commit por tarefa. Outra wave no plano: volta ao E5. Ver `rules/commit.md` | Hashes no estado |
| **E10 Revisão final** | Codex | Última wave commitada | O orquestrador roda antes `gitleaks` e `npm audit` e anexa a saída (DP-29). O Codex despacha dois subagentes próprios (código e segurança) sobre o diff da branch, sempre nível Forte | `revisao-final.md` (achados F4) |
| **E11 Memória** | `orquestrador` | E10 sem crítico ou alto | Índice, nota de entrega no vault (lida de volta), `graphify update`, relatório. Ver `rules/memoria.md` | `relatorio.md`; nota no vault; grafo |
| **E12 Merge** | Humano | E11 feita | Leva a branch para a `main`. Merge e push nunca são do agente | Merge feito |
| **E13 Deploy** | `devops-engineer` (OpenCode) prepara; humano executa | E12 feita | `deploy-NN.md`: backup do banco, passos, plano de volta, teste rápido no ar | Teste rápido passando |

## Caminho curto C1

É C1 só se valer tudo: até 3 arquivos; uma wave; sem banco ou migration; sem dependência nova; sem autenticação ou segurança; sem arquivo protegido. Na dúvida, não é C1. O orquestrador lista, ao pedir a aprovação, cada item conferido. No C1: sem E0 longa (o pedido pode ser o texto do humano) e sem E3b. As duas aprovações e a E10 continuam. A E6 reprova C1 que não cumpre o critério.

## Aprovação com hash

1. O orquestrador apresenta o caminho do arquivo, um resumo de até 5 linhas e os 12 primeiros caracteres do sha256.
2. O humano responde só com a frase: `Aprovo a SPEC.` ou `Aprovo o plano.` Nenhuma outra frase vale.
3. O orquestrador registra arquivo, frase como digitada, data e hash em `estado.md`.
4. O revisor da E6 e o Codex na E10 recalculam o hash. Se não bate, reprovam: o documento mudou depois da aprovação. O `plano-guard` também recalcula a cada edição de código.

## Quando algo reprova

Reprovação em E6, E7, E8 ou E10 não recomeça do zero: abre um reparo (`rules/reparo.md`).

- Falha mecânica ou achado de implementação: volta ao implementador da tarefa.
- O **plano** está errado: volta para E4, com nova aprovação do plano.
- A **SPEC** está errada: volta para E3, com nova aprovação da SPEC.
- Achado da E10: vira tarefa nova no plano e volta ao E5.
- Desempate entre agentes é do humano.

A revisão para quando os achados relevantes estão resolvidos ou registrados e os gates passam; outra rodada só com evidência nova.

## Quando o humano pede para pular

Responda no formato F2: a etapa atual, a etapa que o pedido pularia e o que falta. Não execute o pedido.
