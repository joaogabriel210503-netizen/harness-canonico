# Estado: [nome da demanda]

> Única fonte sobre "onde estamos". Todo agente lê antes de agir. Só o orquestrador escreve (o `tech-lead` cria o arquivo em E0).

- **Demanda:** [slug]
- **Branch:** `demanda/[slug]`
- **Etapa atual:** E0
- **Atualizado em:** AAAA-MM-DD HH:MM

> Quando o relatório final sair, troque a etapa atual por `concluída`. A partir daí o hook `plano-guard` deixa de liberar edição de código por esta demanda.

## Aprovações

| O quê | Arquivo aprovado | Frase do humano | Data | sha256 (12) |
|---|---|---|---|---|
| SPEC | | | | |
| Plano | | | | |

Sem linha preenchida, a etapa seguinte não começa. A frase é copiada como o humano escreveu. O hash é `sha256sum <arquivo> | cut -c1-12` do arquivo aprovado, calculado no momento da aprovação; o `plano-guard` o recalcula a cada edição de código e, se não bater, não libera.

## Etapas

| Etapa | Situação | Evidência |
|---|---|---|
| E0 Definição | | `docs/definicao/...` |
| E1 Preparação | | branch |
| E2 Consulta prévia | | seção "Consultas feitas" da SPEC |
| E3 SPEC | | caminho e hash |
| E3b Revisão da SPEC (Codex; não se aplica no C1) | | `revisao-spec.md` |
| E4 Plano | | caminho e hash |
| E10 Revisão final (Codex) | | `revisao-final.md` |
| E11 Memória | | nota no vault, grafo |
| E12 Merge (humano) | | commit de merge |
| E13 Deploy (OpenCode prepara, humano executa) | | `deploy-NN.md`, teste rápido |

Caminho curto C1: [sim | não]. Se sim, itens conferidos: até 3 arquivos, uma wave, sem banco, sem dependência nova, sem segurança, sem arquivo protegido.

## Waves

| Wave | Tarefas | E5 | E6 | E7 | E8 | E9 (hashes) |
|---|---|---|---|---|---|---|
| 1 | | | | | | |

## Reparos abertos

| Wave e tarefa | Tentativa | Arquivo |
|---|---|---|

## E11

- [ ] Índice de memória avaliado
- [ ] Nota de entrega no vault, lida de volta
- [ ] Grafo atualizado depois do último commit
- [ ] Relatório final

## Estado (F6)

```
ETAPA_ATUAL: E0
PROXIMA_ETAPA_PERMITIDA: E1
ESPERA_HUMANO: NAO | SIM: <frase exata esperada>
SPEC: <caminho> sha256=<12 caracteres na aprovação>
PLANO: <caminho> sha256=<12 caracteres na aprovação>
```

## Histórico (só de acréscimo)

`AAAA-MM-DD HH:MM | <quem> | <evento> | <evidência: caminho, hash ou EXIT>`

## Pendências e decisões que esperam o humano

- 
