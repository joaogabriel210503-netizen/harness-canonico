---
trigger: always_on
description: Memória em três lugares, atualizada em E11
---

# Memória

São três lugares, com papéis diferentes. Todos são atualizados em E11, depois do último commit, pelo orquestrador.

| Lugar | O que guarda | Tamanho | Como se acessa |
|---|---|---|---|
| `.agents/memory/MEMORY.md` | Índice: o que toda sessão precisa saber antes de começar | Até 130 linhas | Carregado sempre |
| `vault/` | Conhecimento do projeto e registro de cada entrega | Sem limite | Só pelas ferramentas MCP do vault |
| `graphify-out/` | Grafo do código | Gerado | `graphify query`, `explain`, `path` |

A memória nativa de cada CLI é complemento. Outros agentes não a enxergam, então nada essencial pode existir só nela.

## Índice

Uma linha por memória, apontando para um arquivo de tópico em `.agents/memory/`. Só entra o que passa neste teste:

> Uma sessão futura ficaria surpresa e grata de saber disto antes de começar?

Entra: erro que precisou ser corrigido, padrão de arquitetura achado depois de tentativa falha, regra de negócio que o código não mostra, onde mora algo fora do repositório. Não entra: o que se lê no código ou no git, prazo, receita de depuração.

Passou de 130 linhas: migre as entradas de menor valor para o vault. A ordem é buscar duplicata, seguir o modelo da pasta, criar, **ler de volta**, e só então apagar do índice.

## Frescor

Cada linha do índice e cada nota de conhecimento carrega quatro campos, para saber quando desconfiar dela:

- **fonte:** de onde veio (commit, arquivo, conversa);
- **evidência:** o que a comprova hoje (arquivo e commit, comando e saída);
- **verificado em:** data da última conferência;
- **invalida se:** a condição que a torna falsa (mudou tal arquivo, tal dependência, tal decisão).

`node .claude/hooks/memoria-check.mjs` (e o `doctor`) confere o teto, os links do índice, o formato dos arquivos de tópico e esses quatro campos; entrada verificada há mais de 90 dias vira aviso.

Memória sem evidência ou com a condição de invalidação já ocorrida não é fonte: verifique no repositório antes de usar e corrija ou apague.

## Vault

O vault tem dois modos (decisão DP-23; a implementação do modo universal é a W6):

- **Local (padrão):** `vault/` no repositório do projeto, um servidor `harness-vault`. Vale para clientes, projetos pessoais e qualquer projeto fora da Central.
- **Universal (ecossistema Central):** o vault fica no repositório da Central, uma pasta por módulo mais `_comum/`; um servidor por módulo e um `harness-vault-comum` somente leitura. Sem `[[link]]` entre pastas.

Nunca leia nem escreva arquivo do vault direto. Só pelas ferramentas MCP, que validam frontmatter, modelo da pasta e links. O hook `vault-guard` bloqueia o acesso direto.

| Para | Ferramenta (prefixo `mcp__harness-vault__`) |
|---|---|
| Buscar | `search_notes_tool`, `search_by_property_tool`, `list_notes_tool` |
| Ler | `read_note_tool`, `get_backlinks_tool`, `get_outgoing_links_tool` |
| Ver o modelo da pasta | `get_note_template_tool` |
| Criar ou editar | `create_note_tool`, `update_note_tool`, `edit_note_section_tool` |
| Conferir | `find_broken_links_tool`, `find_orphaned_notes_tool` |

O servidor está fixado num commit em `.mcp.json` e foi provado: rejeita link para nota inexistente, nota sem uma seção exigida pelo modelo e nota acima de 300 linhas (`OBSIDIAN_MAX_NOTE_LINES`). Os modelos que ele aplica ficam em `vault/templates/` (cópia de `.agents/templates/vault-skeleton/templates/`; `entrega.md` é a mesma coisa que `.agents/templates/nota-entrega.md`).

| Pasta | Guarda | Critério |
|---|---|---|
| `vault/03-conhecimento/` | Regras, decisões e lições que valem além de uma entrega | O teste restrito do índice |
| `vault/01-projetos/<demanda>/` | Uma nota por entrega | Sempre, ao fim de cada demanda |
| `vault/daily/` | Rascunho do dia | Temporário |

### Nota de entrega

Uma por demanda, com o modelo `templates/nota-entrega.md`. Ela registra decisões, regras, arquitetura, alterações, impactos, limitações, comandos e próximos passos.

Como escrever:

- Linguagem simples. Quem nunca abriu o código precisa entender.
- Sem sigla ou nome interno sem explicar na primeira vez.
- Frases completas. A compressão do Caveman não vale aqui.
- Detalhada, mas dentro do teto de linhas do servidor do vault. Passou, divida em duas notas ligadas.
- Ligue a nota às relacionadas com `[[wikilink]]`. O link precisa apontar para nota que existe.

### Só o que foi verificado

Toda afirmação sobre o código cita o commit e o arquivo. Sem evidência no repositório, não entra. "Deve", "provavelmente" e "em teoria" não são registro.

Depois de criar ou editar uma nota, **leia de volta**. Escrita não confirmada por leitura conta como não feita.

## Grafo

Depois do último commit: `graphify update .`. O hook `post-commit` faz isso sozinho; confira que a data do grafo é posterior ao último commit.

## Ordem em E11

1. Índice: avaliar se algo da demanda passa no teste.
2. Vault: nota de entrega; notas de conhecimento, se houver.
3. Grafo: atualizar e conferir.
4. Relatório final (`templates/relatorio.md`).
