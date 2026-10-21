---
trigger: always_on
description: Loop de reparo com três tentativas quando revisão ou gate reprova
---

# Loop de reparo

Quando a revisão reprova, a validação acha um defeito ou um gate falha, o erro volta para quem pode corrigir. O loop tem teto: três tentativas, cada uma diferente da anterior. Repetir a mesma tentativa no mesmo contexto repete o mesmo erro.

## Primeiro: de onde vem a falha

| O que falhou | Para onde volta |
|---|---|
| Lint, tipos ou teste | Implementador da tarefa |
| Achado de revisão sobre o código | Implementador da tarefa |
| Defeito visto no navegador | Implementador da tarefa |
| A revisão mostra que o plano está errado (tarefa mal cortada, dependência faltando) | Etapa E4, com nova aprovação do plano |
| A revisão mostra que a SPEC está errada ou incompleta | Etapa E3, com nova aprovação da SPEC |
| Achado da revisão final do Codex (E10) | Tarefa nova no plano (`Files:`, verificação), executada de volta no E5. Se muda `Files:` ou escopo, o plano muda e precisa de nova aprovação ("Aprovo o plano.") |

Não remende código em cima de plano errado.

## O arquivo de reparo

O orquestrador abre `docs/fluxo/<demanda>/reparo/wave-N-<tarefa>.md` com o modelo `templates/reparo.md`. Ele leva:

- a **saída crua** do que falhou (a mensagem do gate, ou o achado com arquivo, linha e cenário de falha), sem resumo;
- o caminho da SPEC e do plano;
- o caminho do arquivo de passagem original da tarefa.

A mensagem para o agente é só o caminho desse arquivo.

## O que o agente faz antes de corrigir

1. Relê a SPEC e a tarefa no plano.
2. Consulta a memória: `.agents/memory/MEMORY.md` e busca no vault pelo assunto.
3. Compara o que fez com o que estava pedido e escreve no arquivo de reparo, em uma ou duas linhas, **por que errou**: entendeu errado o pedido, inventou uma API, esqueceu uma regra, ou o pedido estava ambíguo.
4. Só então corrige, roda os três gates e reporta.

O passo 3 é obrigatório. Sem a causa escrita, a correção é tentativa e erro.

## As três tentativas

| Tentativa | Quem | Como |
|---|---|---|
| 1 | O mesmo agente, na mesma sessão | Recebe o arquivo de reparo. Resolve o erro simples |
| 2 | A mesma persona, em **sessão nova** | Lê só SPEC, plano, arquivo de passagem e arquivo de reparo. Resolve o contexto deteriorado |
| 3 | A mesma persona com **outro modelo** | Também em sessão nova. Resolve o ponto cego do modelo |

Depois da terceira, o orquestrador **para** e chama o humano com: o que falhou, as três causas registradas e o que ele recomenda. Não há quarta tentativa sem decisão humana.

## Quando parar de revisar

A revisão para quando os achados relevantes (crítico e alto) estão resolvidos ou registrados com destino e os gates passam. Outra rodada de revisão só com evidência nova (código que mudou depois, teste novo, achado com cenário novo). Rodada repetida sobre o mesmo código, só para "ter certeza", é custo sem informação.

## Depois da correção

A tarefa corrigida volta para a etapa que a reprovou e passa de novo por ela e pelas seguintes. Um achado crítico corrigido precisa aparecer como corrigido na nova revisão.

## Registro

Cada tentativa fica no arquivo de reparo: causa, o que mudou, saída dos gates. Se a causa foi uma regra que o agente não conhecia, o orquestrador avalia se ela merece entrar na memória (`rules/memoria.md`).
