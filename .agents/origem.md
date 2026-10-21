# Origem: o que veio do vibe-coding-toolkit e o que é diferente

Este padrão parte do repositório [soumatheusgomes/vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit), desenhado a partir do commit `13add21` (3 de setembro de 2026) e **relido no commit `de66fe3` (17 de outubro de 2026)**, que trouxe 14 commits novos. A análise do impacto está em `docs/inventario/2026-10-18-impacto-do-toolkit-atualizado.md`. Toda diferença está aqui, com o motivo.

## Igual

| Peça | De onde vem |
|---|---|
| Sessão principal orquestra, não implementa | `docs/00-overview.md`, `templates/CLAUDE.md.template` |
| As cinco diretrizes de comportamento | `templates/CLAUDE.md.template` |
| Brainstorm, depois plano, depois código, com Superpowers | `docs/tools/01-superpowers.md` |
| Personas com uma frase de "quando usar" como regra de roteamento | `docs/tools/02-subagent-orchestration.md` |
| Modelo definido a cada despacho, o mais barato que resolve | `docs/tools/02-subagent-orchestration.md`, Parte B |
| Marcação `Files:` e `Depends-on:`; wave só com arquivos disjuntos | `templates/rules/parallel-subagent-driven-development.md` |
| Implementador não commita; um único responsável pelo commit | Idem |
| Revisores independentes; achado sem cenário de falha é descartado | `docs/prompts/03-multi-agent-code-review.md` |
| Teto de 350 linhas por arquivo, com as três regras copiadas sem alteração | `docs/prompts/08-eslint-quality-gates-install.md` |
| `lint:typed` (antes `lint:types`) fora do pre-commit | `docs/tools/06-eslint-biome-quality-gates.md` |
| Memória em duas camadas; índice com teto de 130 linhas; teste restrito para salvar | `docs/tools/09-claude-memory-system.md`, `docs/prompts/06-memory-bootstrap.md` |
| Vault acessado só por MCP, com modelo por pasta | `docs/tools/08-obsidian-memory.md` |
| Hooks como mecanismo de trava | `docs/tools/10-hooks-best-practices.md` (aqui falham fechados, ver abaixo) |
| agent-browser para dirigir, Chrome DevTools para diagnosticar | `docs/tools/11-agent-browser.md`, `14-chrome-devtools-mcp.md` |

## Diferente

| Aqui | No toolkit | Motivo |
|---|---|---|
| `AGENTS.md` é a constituição; `CLAUDE.md` só importa | Desde 17/10 o toolkit faz o mesmo (`templates/CLAUDE.md.template` virou `@AGENTS.md`); em 3/9 o `CLAUDE.md` era o principal | Passou a ser igual. Vários fornecedores leem `AGENTS.md` |
| Fonte da verdade em `.agents/`, com adaptadores finos por CLI | Tudo em `.claude/` | O padrão precisa valer fora do Claude Code |
| Etapa de definição antes do harness: PRD, regras, contexto, MVP | Começa no brainstorm | A demanda chega informal e precisa servir também à gestão |
| Revisão, validação e gates **antes** do commit | Commit por tarefa antes da revisão | Só entra no histórico o que passou; o revisor olha os arquivos da tarefa, não um intervalo de commits |
| Duas aprovações humanas registradas em arquivo | Portão de aprovação só dentro da skill | A aprovação precisa sobreviver à troca de sessão e de agente |
| Arquivo de estado por demanda; o agente recusa pular etapa | Não há | O padrão é percorrido por agentes diferentes, em sessões curtas |
| Consulta ao vault e ao grafo é obrigatória antes de planejar | Graphify e Obsidian são opcionais; o hook do grafo só orienta | Reduzir alucinação por estrutura |
| Validação visual em toda wave com tela, por quem não implementou | agent-browser é extra opcional | O defeito de tela não aparece em teste nem em revisão de código |
| Loop de reparo com três tentativas escalonadas e parada | Não há | Sem teto, um agente travado gasta tokens em silêncio |
| Nota de entrega detalhada no vault, além das notas de conhecimento | Só o critério restrito | O vault também é a documentação legível do projeto |
| `max-lines` nativo do ESLint em todo arquivo de código, sem `quality/max-lines` | Regra própria, com `index` isento pelo nome e brecha em `// eslint-disable` | Issue 7 do repositório e a auditoria de 14/10/2026: o teto era contornável. `noInlineConfig` mais `gates.lock` fecham a brecha |
| Hooks falham fechados (`onFailure: block`) | Hooks que falham abertos | Hook que quebra deixava passar a ação que deveria barrar |
| Commit em branch de trabalho; merge só do humano | O orquestrador commita | Decisão do dono do padrão |
| RTK é o binário público `rtk-ai/rtk`; os gates ficam fora dele | Padrão descrito, sem binário | Já existe e já estava em uso; o resumo não pode esconder o erro do gate |
| Tech lead e segundo revisor em outro fornecedor | Uma CLI só | Definição e SPEC escritas por modelos diferentes expõem divergência |
| Perfil de stack separado do fluxo | Só JavaScript e TypeScript | O mesmo fluxo vai servir a web e a mobile |

## Impressão digital dos arquivos de origem

Sha256 dos arquivos do toolkit usados como base (commit `13add21`), para detectar mudança quando a origem for relida:

| Arquivo | sha256 |
|---|---|
| `core-rules.cjs` | `74ebcc0235d16fc58d20cebe52148ff40606754a993b63743e721ab594244319` (de66fe3; em 13add21 era `348b7fe3…`) |
| `index.cjs` | `9610051b37cf4832532cce223060a328851727c85e2d1c0b8745a5f0c837e550` |
| `utils.cjs` | `b2ab939d3a6c157daf6fe840c0dc401ae570863fbd81bf23971e69a12cb79a33` (de66fe3; em 13add21 era `9b7daa0c…`) |
| `verify.mjs` | `9b7a37f0b208500f483648f30b7ab6e0863c6c90af44e8234827eeb049c0d12c` (de66fe3; em 13add21 era `225f0d94…`) |

## Divergências assumidas em relação ao toolkit de 17/10/2026

O toolkit declarou, em `AGENTS.md` e em `templates/AGENTS.md.template`, escolhas que são o oposto das nossas. São decisões do dono do padrão e ficam registradas aqui para não serem "corrigidas" por engano:

| Tema | Toolkit (17/10) | Aqui | Motivo |
|---|---|---|---|
| Hooks de git e bloqueio na `main` | "Do not add Git blockers, branch/worktree requirements, or commit/push hooks" por padrão; só quando pedido | Pre-commit, pre-push, bloqueio na `main` e `commit-guard` | O dono pediu um harness amarrado; o próprio toolkit admite "added when requested" |
| Delegação | Condicional: só quando isolar contexto, especializar ou paralelizar compensa; execução direta para tarefa simples | Obrigatória para código: a sessão principal não escreve código (`escopo-guard`) | Revisão independente e previsibilidade. Custo: tokens em mudança trivial. Decidido em 18/10 (DP-15): manter |
| Modelo dos subagentes | Sem política autorizada, usa o modelo da sessão | `model` exigido em cada despacho (`despacho-guard`) | Precisa constar em `AGENTS.md` como política autorizada pelo dono (DP-14) |
| Falha de hook | Fail-open como regra geral; fail-closed só para requisito duro de segurança | Fail-closed em toda guarda; `session-start` aberto | As guardas são fronteira de segurança |
| Aprovações | Não repetir aprovações já dadas; execução já autorizada prevalece | Duas aprovações humanas por demanda (SPEC e plano) | A aprovação precisa sobreviver à troca de sessão e de agente |
| Teto de linhas | Isenção por conteúdo (módulo só de re-exports e de tipos) e testes isentos por padrão | `max-lines` nativo do ESLint em todo arquivo de código, sem isenção | Isenção é brecha; a auditoria de 14/10 achou 17 contornos |
| Script do lint tipado | `lint:typed` | `lint:typed`, igual ao toolkit (DP-16, 18/10) | Os prompts de instalação do toolkit já geram esse nome |
