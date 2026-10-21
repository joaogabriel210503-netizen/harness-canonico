---
trigger: always_on
description: Consulta prévia obrigatória antes de planejar ou alterar
---

# Consulta prévia

Antes de planejar, decidir ou alterar qualquer coisa, consulte nesta ordem. O objetivo é saber o que já existe e o que a mudança vai afetar, antes de escrever uma linha.

## Ordem

1. **Vault (memória longa).** Busque pelo assunto da demanda com as ferramentas MCP do vault. Busque, não leia tudo. Leia só as notas que a busca devolver.
2. **Grafo do código.** `graphify query "<nome do símbolo ou arquivo>"` e `graphify explain "<nó>"`. A busca casa por **nome de nó** (função, classe, arquivo): `graphify query "calcularFrete"` acha, `graphify query "o que existe neste projeto?"` devolve "No matching nodes found" com código de saída 0. Leia a saída, não o código de saída para as partes que a demanda toca. Anote o que muda junto e o que pode quebrar. Relação marcada `INFERRED` é hipótese: confira no código antes de confiar.
3. **Documentos do repositório.** `docs/definicao/`, SPECs e planos anteriores relacionados, `AGENTS.md`.
4. **Estrutura atual.** Onde o código da área mora, que padrão ele segue, o que já resolve parte do pedido.
5. **Context7.** Obrigatório quando a decisão depende de biblioteca, framework ou API: resolva a biblioteca e consulte a documentação da versão instalada. Não responda de memória sobre API de terceiros.

## O que registrar

Toda SPEC e todo arquivo de passagem trazem a seção **Consultas feitas**:

```markdown
## Consultas feitas
- Vault: <termos buscados> → <notas lidas, ou "nada encontrado">
- Grafo: <consultas> → <o que depende, o que pode quebrar>
- Documentos: <arquivos lidos>
- Estrutura: <pastas e arquivos examinados>
- Context7: <biblioteca e versão>, ou "não se aplica: nenhuma decisão depende de biblioteca"
```

O orquestrador recusa SPEC, plano ou relato de tarefa que chegue sem essa seção.

## Quando a ferramenta não responde

Não simule a consulta. Escreva na seção o que falhou, por exemplo "Grafo: `graphify` não encontrado", diga o que isso deixa de garantir e pergunte ao humano se segue sem ela.

## O que já existe vem primeiro

Antes de criar arquivo, função, regra ou abstração, procure uma existente que resolva. Se achar, use ou estenda. Se criar mesmo assim, diga em uma linha por que a existente não servia.
