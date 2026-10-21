# Revisão da SPEC (E3b): [nome da demanda]

> Parecer do Codex (persona `tech-lead`), por escrito, **antes** da frase de aprovação (DP-22). **Pulada no C1.**
> O Codex não aprova nem reprova: quem aprova é o humano, com "Aprovo a SPEC.". Este parecer só informa.
> Formatos: cabeçalho F1 e relatório F9; os achados seguem o F4 (`.agents/rules/formatos.md`).

PAPEL: tech-lead | DEMANDA: [slug] | ETAPA: E3b

- **SPEC revisada:** [caminho]
- **SHA256 (12) da SPEC revisada:** [calcule você; confira com o do `estado.md` quando houver]
- **Definição de origem:** [caminho do `pedido.md` ou `docs/definicao/`]
- **Data:**

## O que revisar

1. **Contradição com a definição:** a SPEC diz algo que o pedido ou as regras de negócio negam?
2. **Lacuna:** regra de negócio, caso de erro, perfil de usuário ou critério de aceite que a definição pede e a SPEC não cobre.
3. **Risco:** autorização, dado sensível, migration, concorrência, dependência nova, algo que o C1 teria barrado.
4. **Consultas feitas:** a seção existe e os achados dela batem com o que a SPEC assume?
5. **Declaração do caminho:** se a SPEC diz C1, confira cada item da tabela; se algum falha, é achado ALTO.

Achado sem cenário concreto de falha é palpite: descarte você mesmo.

## Achados

```
ACHADO | <arquivo>:<linha> | <SEVERIDADE> | <o que está errado> | CENARIO: <entrada ou estado que faz falhar> | REGRA: <trecho da definição ou regra violada> | REVISOR: tech-lead
```

ARQUIVOS_REVISADOS: [SPEC e definição]
ACHADOS_DESCARTADOS_POR_FALTA_DE_CENARIO: [n]
RESULTADO: NENHUM_ACHADO | [n] ACHADOS

## Relatório (F9)

ESCREVI_EM: docs/fluxo/<demanda>/revisao-spec.md
COMANDOS_RODADOS: [comando → EXIT n, ou nenhum]
O_QUE_NAO_FOI_VERIFICADO: [lista, ou nada]
DECISAO_QUE_O_HUMANO_PRECISA_TOMAR: [ou nenhuma]
