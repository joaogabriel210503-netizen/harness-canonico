---
name: formatos
description: Vocabulário único e formatos fixos de saída de agente (F1 a F10), conferidos pelo validar-saida.mjs
---

# Formatos de saída

Cada saída tem campos com nome fixo, valores de uma lista fechada e ordem fixa. Quem confere é um script, contra fatos que o agente não controla: `git status`, `estado.md`, o plano aprovado e o código de saída dos gates. O conferidor é `node .claude/hooks/validar-saida.mjs` (uso no cabeçalho do arquivo). O hook `SubagentStop` (`relato-guard.mjs`) o roda sozinho no relato de implementador e de revisor: relato fora do formato **não deixa o subagente terminar**; ele recebe a lista de erros e corrige. Na segunda tentativa o hook libera (para nunca prender a sessão); o orquestrador roda o conferidor antes de aceitar.

## Vocabulário

| Campo | Valores |
|---|---|
| `STATUS` (tarefa) | `CONCLUIDA`, `CONCLUIDA_COM_RESSALVA`, `PRECISA_CONTEXTO`, `BLOQUEADA` |
| `SEVERIDADE` | `CRITICO`, `ALTO`, `MEDIO`, `BAIXO` |
| `VEREDITO` (calculado pela síntese, nunca opinado) | `BLOQUEADO` (há CRITICO ou ALTO), `APROVADO_COM_RESSALVA` (há MEDIO), `APROVADO` |
| `ETAPA` | `E0` a `E13` (inclui `E3b`), `CONCLUIDA` |

As frases do humano são só duas: "Aprovo a SPEC." e "Aprovo o plano." (adendo v1, seção 4.2). Não há outras frases de autorização.

## F1. Primeira linha de toda resposta de agente

```
PAPEL: <persona> | DEMANDA: <slug ou nenhuma> | ETAPA: <Ex, lida no estado.md agora>
```
Erro se: o papel difere de quem respondeu; a etapa difere do `estado.md`; a demanda não existe em `docs/fluxo/`; a linha falta.

## F2. Resposta a pedido para pular etapa

```
ETAPA ATUAL: E3 SPEC (estado.md, atualizado em AAAA-MM-DD HH:MM)
O PEDIDO PULARIA: E4 Plano e aprovação do plano
FALTA: frase "Aprovo a SPEC." registrada; plano escrito; frase "Aprovo o plano."
NÃO EXECUTADO.
```
Erro se: qualquer ferramenta altera arquivo no mesmo turno.

## F3. Relato do implementador (conferido pelo `relato-guard`)

```
PAPEL: backend-specialist | DEMANDA: <slug> | ETAPA: E5
STATUS: CONCLUIDA | CONCLUIDA_COM_RESSALVA | PRECISA_CONTEXTO | BLOQUEADA
TAREFA: T07 | WAVE: 2 | PERSONA: backend-specialist | MODELO: <modelo>
SPEC_SHA256: <12 caracteres> | PLANO_SHA256: <12 caracteres>
ARQUIVOS_TOCADOS: <lista exata, separada por espaço ou vírgula>
FORA_DE_FILES: NAO | SIM: <lista>
TESTE_VIU_FALHAR: SIM: <teste e trecho da falha> | NAO_SE_APLICA: <motivo>
GATES:
  lint: EXIT <n>
  typecheck: EXIT <n>
  test: EXIT <n> (<passaram>/<total>)
SAIDA_DOS_GATES: (bloco cru, sem resumo)
COMMIT_FEITO: NAO
SUPOSICOES: <lista ou "nenhuma">
FICOU_DE_FORA: <lista ou "nada">
```
Erro se: algum `ARQUIVOS_TOCADOS` não aparece no `git status`; `FORA_DE_FILES: NAO` com arquivo fora do `Files:` da tarefa (ou `SIM` quando todos estão dentro); `CONCLUIDA` sem as três linhas `EXIT` ou com `EXIT` diferente de 0; os hashes não são os aprovados no `estado.md`; `TESTE_VIU_FALHAR` sem trecho ou motivo; `COMMIT_FEITO` diferente de `NAO`; a tarefa não existe no plano aprovado.

## F4. Achado de revisão (conferido pelo `relato-guard`)

Uma linha por achado, no relato do próprio revisor:
```
ACHADO | <arquivo>:<linha> | <SEVERIDADE> | <o que está errado> | CENARIO: <entrada ou estado que faz falhar> | REGRA: <critério da SPEC ou regra> | REVISOR: <persona>
```
Rodapé obrigatório:
```
ARQUIVOS_REVISADOS: <lista: inclui todo arquivo alterado que está nos Files: do plano>
ACHADOS_DESCARTADOS_POR_FALTA_DE_CENARIO: <n>
RESULTADO: NENHUM_ACHADO | <n> ACHADOS
```
O revisor **não** escreve veredito. `CRITICO` e `ALTO` exigem cenário. Erro se: linha de achado mal formada; `ALTO` ou `CRITICO` sem cenário; `ARQUIVOS_REVISADOS` deixa de fora arquivo alterado da wave; `RESULTADO` não bate com as linhas válidas; existe linha `VEREDITO`.

## F5. Síntese da revisão (gerada por script)

`node .claude/hooks/validar-saida.mjs sintese <relato-code-reviewer> <relato-security-reviewer>` junta os achados e calcula o veredito pela tabela do vocabulário. Erro se: falta um revisor esperado; há linha de achado inválida. Cada achado ganha destino: `reparo`, `volta ao plano`, `volta à SPEC` ou `aceito pelo humano`.

## F6. Estado da demanda (acréscimo ao `estado.md`)

```
ETAPA_ATUAL: E5 (wave 2)
PROXIMA_ETAPA_PERMITIDA: E6
ESPERA_HUMANO: NAO | SIM: <frase exata esperada>
SPEC: <caminho> sha256=<12 caracteres na aprovação>
PLANO: <caminho> sha256=<12 caracteres na aprovação>
```
Mais uma seção "Histórico", só de acréscimo: `AAAA-MM-DD HH:MM | <quem> | <evento> | <evidência: caminho, hash ou EXIT>`. Conferido por `validar-saida.mjs estado <demanda>`. Erro se: o hash atual difere do gravado; linha do histórico sem evidência.

## F7. Passagem (handoff)

O template `.agents/templates/handoff.md` traz os campos `SPEC_SHA256`, `PLANO_SHA256`, `ETAPA_NO_ESTADO_NO_DESPACHO`, `MODELO_E_MOTIVO`, o estado verificado com data, a evidência, os recursos abertos e o contexto a revisitar. O implementador confirma que leu a versão aprovada repetindo os hashes no F3.

## F8. Decisão do orquestrador

```
DECISAO D-NN | <o que decidi> | MOTIVO: <...> | CUSTO SE ERRADO: <...> | MUDA ESCOPO, PLANO OU STATUS: NAO | SIM: aguarda o humano
```
Decisão que muda escopo, plano ou status não é executada: espera o humano.

## F9. Relatório de agente externo (Codex, OpenCode, Antigravity)

```
PAPEL: ... | DEMANDA: ... | ETAPA: ...
ESCREVI_EM: <caminhos>   (docs/fluxo/<demanda>/relatorios/)
COMANDOS_RODADOS: <comando> → EXIT <n>   (ou "nenhum")
ACHADOS: formato F4 (E10) | FONTES: <link e data por afirmação> (pesquisa) | ROTEIRO: deploy-NN.md (E13)
O_QUE_NAO_FOI_VERIFICADO: <lista; "nada" se nada>
DECISAO_QUE_O_HUMANO_PRECISA_TOMAR: <ou "nenhuma">
```
Erro se: o `git status` mostra arquivo fora de `ESCREVI_EM`; comando sem `EXIT`.

## F10. Fechamento de etapa pelo orquestrador

```
ETAPA_CONCLUIDA: E6 wave 2 | EVIDENCIA: <caminho> | PROXIMA: E7 | ESPERA_HUMANO: NAO
```
Erro se: a evidência não existe; a próxima etapa não é a seguinte do `fluxo.md` (voltar a E5, E4 ou E3 é permitido, pelos caminhos de volta).

## Recibo dos gates (DP-11)

Da E8 em diante, enquanto houver código alterado, o hook `Stop` (`recibo-guard.mjs`) só deixa a sessão principal parar se existir `docs/fluxo/<demanda>/recibo-gates.md` gerado por `node .claude/hooks/recibo-gates.mjs <demanda>`: o script **roda** `lint`, `typecheck` e `test` em cada pasta com `package.json` e grava o código de saída de cada um mais o hash do código (`ARVORE`). O recibo vale enquanto o código não mudar e os três forem `EXIT 0`. Limite: é um arquivo; a trava real é o pre-push.

## Hooks de parada falham abertos

`relato-guard.mjs` e `recibo-guard.mjs` liberam se quebrarem (erro, entrada ilegível): uma guarda de parada que quebra não pode trancar a sessão. Isso é exceção à regra de falhar fechado e está coberto no selftest.
