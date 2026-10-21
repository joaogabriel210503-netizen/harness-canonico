# Revisão final (E10): [nome da demanda]

> Feita pelo Codex sobre o diff da branch inteira, depois do último commit e antes do merge. Sempre nível **Forte** (DP-14).
> Formatos: cabeçalho F1, relatório F9, achados no F4 (`.agents/rules/formatos.md`).

PAPEL: [tech-lead | revisor do Codex] | DEMANDA: [slug] | ETAPA: E10

- **Branch:** `demanda/[slug]` | **Base:** `main`
- **Diff revisado:** `git diff main...demanda/[slug]`
- **Data:**

## Entrada que o orquestrador anexa ANTES do pedido (DP-29)

Sem isto o Codex não começa. O orquestrador roda e cola a saída crua:

1. `gitleaks detect --no-banner` (ou `gitleaks protect` no diff): saída e EXIT.
2. `npm audit` em cada pasta com `package.json`: saída e EXIT.
3. Recibo dos gates: `docs/fluxo/<demanda>/recibo-gates.md`.

## Conferência de hash

Recalcule o sha256 (12 primeiros caracteres) da SPEC e do plano e compare com as linhas de aprovação do `estado.md`. Se não bate, o documento mudou depois da aprovação: reprove e pare.

| Documento | Caminho | Hash no `estado.md` | Hash agora | Bate? |
|---|---|---|---|---|
| SPEC | | | | |
| Plano | | | | |

## Como revisar

O Codex despacha **dois subagentes próprios**, independentes, só leitura, em nível Forte, sobre o diff da branch (não sobre a wave):

- **Código:** contra os critérios de aceite da SPEC, regras de negócio, tarefas fora de `Files:`, testes que não provam nada, caminho C1 declarado sem cumprir o critério.
- **Segurança:** autorização no servidor, validação de entrada, segredos, dependências novas (`npm audit`), exposição de dado, a saída do gitleaks.

Cada subagente trabalha sem ler o relato do outro e **devolve o relato completo na resposta** (o sandbox deles é somente leitura). O tech-lead salva cada um, sem mudar uma linha, em `docs/fluxo/<demanda>/relatorios/e10-codigo.md` e `e10-seguranca.md`.

## Achados

Uma linha por achado (F4):

```
ACHADO | <arquivo>:<linha> | <SEVERIDADE> | <o que está errado> | CENARIO: <entrada ou estado que faz falhar> | REGRA: <critério da SPEC ou regra> | REVISOR: <código | segurança>
```

ARQUIVOS_REVISADOS: [todo arquivo do diff]
ACHADOS_DESCARTADOS_POR_FALTA_DE_CENARIO: [n]
RESULTADO: NENHUM_ACHADO | [n] ACHADOS

## Síntese e destino

`node .claude/hooks/validar-saida.mjs sintese <relato-codigo> <relato-seguranca>` calcula o veredito. Cada achado ganha destino: `reparo`, `volta ao plano`, `volta à SPEC` ou `aceito pelo humano`. Achado da E10 vira tarefa nova no plano (e o plano novo precisa de nova aprovação com hash).

- [ ] Nenhum CRÍTICO ou ALTO em aberto: segue para E11.
- [ ] Há CRÍTICO ou ALTO: abrir reparo e voltar ao E5.

## Relatório (F9)

ESCREVI_EM: docs/fluxo/<demanda>/relatorios/
COMANDOS_RODADOS: [comando → EXIT n, ou nenhum]
O_QUE_NAO_FOI_VERIFICADO: [lista, ou nada]
DECISAO_QUE_O_HUMANO_PRECISA_TOMAR: [ou nenhuma]
