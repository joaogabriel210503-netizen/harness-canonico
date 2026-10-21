# Revisão: wave [N]

- **Tarefas revisadas:** T00, T00
- **Revisores:** `code-reviewer` ([modelo]), `security-reviewer` ([modelo])
- **Data:**

## Achados de cada revisor

Cada revisor escreve a sua parte em arquivo próprio (`revisao-wave-N-code-reviewer.md`, `revisao-wave-N-security-reviewer.md`), sem ler a do outro. O orquestrador copia as duas tabelas para este arquivo, que é a síntese (`revisao-wave-N.md`).

### code-reviewer

| Arquivo:linha | Severidade | O que está errado | Cenário que quebra | Regra ou critério violado |
|---|---|---|---|---|

### security-reviewer

| Arquivo:linha | Severidade | O que está errado | Cenário que quebra | Regra ou critério violado |
|---|---|---|---|---|

## Síntese (orquestrador)

Gere o veredito por script: `node .claude/hooks/validar-saida.mjs sintese revisao-wave-N-code-reviewer.md revisao-wave-N-security-reviewer.md` (F5). Cada revisor entrega as linhas `ACHADO | ...` do F4 (`.agents/rules/formatos.md`); as tabelas abaixo são a leitura humana delas. Confira também o hash: o sha256 da SPEC e do plano tem de bater com o `estado.md`.


1. Junte achados repetidos em um só e anote quais revisores concordaram.
2. Confira cada achado no código antes de aceitar ou descartar.
3. Descarte o que não tem cenário concreto de falha.
4. Ordene por severidade.

| # | Severidade | Arquivo:linha | Resumo | Quem apontou | Destino |
|---|---|---|---|---|---|

Destino: `reparo`, `volta ao plano`, `volta à SPEC`, ou `aceito pelo humano`.

## Resultado

- [ ] Nenhum CRÍTICO ou ALTO em aberto: a wave segue para E7.
- [ ] Há CRÍTICO ou ALTO: abrir reparo antes de seguir.
