# Como usar a memória

- No início da sessão, leia `.agents/memory/MEMORY.md`. Cada linha aponta para um arquivo de tópico nesta pasta; abra só os que tocam o trabalho atual.
- Para o que não está no índice, busque no `vault/` pelas ferramentas MCP. Nunca leia o vault por arquivo.
- Só o orquestrador grava memória, em E11. As regras estão em `.agents/rules/memoria.md`.
- Teste para salvar: uma sessão futura ficaria surpresa e grata de saber disto antes de começar? Na dúvida, não salve.
- O índice tem teto de 130 linhas. Passou, migre para o vault antes de acrescentar. Toda entrada traz fonte, evidência, data da última verificação e condição de invalidação (`rules/memoria.md`, "Frescor").

Formato de um arquivo de tópico:

```markdown
---
name: slug-em-kebab-case
description: resumo de uma linha, usado para julgar relevância
metadata:
  type: feedback | architecture | business-rule | reference
---

O fato, o motivo, e o commit ou arquivo que comprova.

Fonte: <commit, arquivo ou conversa>
Evidência: <o que comprova hoje>
Verificado em: AAAA-MM-DD
Invalida se: <condição>
```
