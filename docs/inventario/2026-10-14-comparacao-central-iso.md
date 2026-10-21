# Comparação: harness da Central ISO × harness-canonico

- **Data:** 14 de outubro de 2026
- **Quem leu:** Claude (sessão de chat), só leitura, pela pasta `~/Desktop/Projetos` conectada pelo Gabriel.
- **Não foi aberto:** código de produto, `.env`, `.token`, notas do cofre.

## Fontes lidas

- Raiz `~/Desktop/Projetos`: `AGENTS.md`, `CLAUDE.md`, `.claude/rules/*`, árvore de `.claude/`.
- `Central ISO Harness/`: `canonico/` (README, 00, 01, 02, 06, 07, 08, 09), `docs/01`, `02`, `03`, `06`, `12`, `13`, `templates/` (árvore e README), `scripts/README.md`.
- `Central ISO/` (repositório do hub): árvore de `.central-iso/` e `.claude/`, `.claude/settings.json` (com `env` oculto), `.claude/CLAUDE.md`, início de `.central-iso/instructions/AGENTS.md`, `.claude/memory/MEMORY.md`, `.gitignore`, chaves de `.central-iso/state/harness-approval.json`.
- `Central ISO Knowledge/`: árvore de `.central-iso/`, `git log`.
- Estado git de cada pasta (remoto, branch, `core.hooksPath`).

## Como a Central ISO está organizada

São quatro camadas:

| Camada | Pasta | Git | Papel |
|---|---|---|---|
| Raiz controladora | `~/Desktop/Projetos` | Não, de propósito | Só roteia: descobre o projeto dono pelo `.central-iso/project.json` e manda o agente trabalhar dentro dele |
| Produto harness | `Central ISO Harness/` | **Não** | Fonte do padrão: documentos, modelos por perfil (`controller-root`, `repo-consumer`, `knowledge-root`), scripts de inventário, diferença, verificação, diagnóstico e sincronização |
| Repositórios consumidores | `Central ISO/`, `Mod. Frete`, `Mod. Agend`, `Mod. CTP-ATP` | Sim, Gitea em `192.168.1.6:3000`, branch `main` | Produto real, com o harness copiado do modelo `repo-consumer` |
| Memória institucional | `Central ISO Knowledge/` | Sim, **sem remoto**, branch `chore/ecosystem-harness`, 85 alterações não commitadas | Cofre Obsidian único do ecossistema, grafo global e scripts de bootstrap da máquina |

Cada consumidor liga o cofre por um link simbólico `.central-iso-vault → ../Central ISO Knowledge`, que fica fora do git.

## O que a Central faz melhor (vale trazer)

1. **Harness separado do produto dentro do repositório.** Tudo do harness mora em `.central-iso/`: `instructions/` (AGENTS.md e CLAUDE.md), `hooks/`, `gates/`, `state/`, `logs/`, `tmp/`, `reports/`. Há um manifesto do projeto (`project.json`: id, nome, papel) e um da política (`harness.json`: versão do layout, origem, regras como "commit exige aprovação humana"). O estado de execução (`state/`, `logs/`, `tmp/`, `reports/`) fica fora do git.
2. **O canônico é tratado como produto, com perfis e sincronização.** Os scripts `inventory`, `diff`, `verify`, `doctor` e `sync` comparam o modelo com cada consumidor e só aplicam depois de um ensaio (dry-run) e revisão. Isso responde a "como o canônico chega aos projetos novos e antigos sem divergir".
3. **Aprovação amarrada por hash.** O hook `central-iso-pretooluse.mjs` só libera edição se `.central-iso/state/harness-approval.json` tiver SPEC e plano aprovados **e** o sha256 dos dois arquivos bater com o conteúdo atual. Se alguém mexer na SPEC depois de aprovada, a edição trava.
4. **Hooks no ciclo inteiro da sessão.** `UserPromptSubmit` (orientação), `SubagentStop` (exige relatório do subagente), `Stop` (roda os gates no fim), `SessionStart` e `SessionEnd` (contexto e registro).
5. **Diagnóstico de máquina.** `doctor.mjs` (só leitura) e `bootstrap.mjs --check` / `--apply` conferem e preparam a máquina. É o "roteiro de máquina nova" que faltava no nosso.
6. **Memória e grafo de ecossistema.** Um cofre só para vários repositórios que conversam entre si, e um grafo global que mede o impacto de uma mudança num módulo sobre os outros.
7. **Negação explícita no settings.** `permissions.deny` para `.env`, `secrets/` e `git push --force`.

## O que o harness-canonico faz melhor (manter)

1. **Vários fornecedores de verdade.** O `AGENTS.md` fica na raiz, onde Codex, Antigravity e OpenCode o leem sem configuração. Na Central ISO a constituição está em `.central-iso/instructions/AGENTS.md`, e a raiz do repositório não tem `AGENTS.md`: o Claude Code chega lá pelo `.claude/CLAUDE.md`, mas Codex, Antigravity e OpenCode abertos no repositório provavelmente não carregam regra nenhuma. Isso é hipótese: confirmar como cada CLI procura o `AGENTS.md`.
2. **Só o orquestrador commita, e é o hook que garante.** O `commit-guard` bloqueia commit de subagente, `git add .`, `--no-verify` e push. Na Central, `git add` e `git commit` estão liberados para qualquer sessão no `permissions.allow`, e a regra "implementador não commita" existe só por escrito.
3. **Mais travas registradas e testadas.** `escopo-guard` (revisor não edita), `rules-guard` (bloqueia `eslint-disable`, `@ts-ignore` e mudança de regra), `vault-guard` ligado, teto de 350 linhas com autoteste, 119 casos de teste dos hooks.
4. **Fluxo com estado e reparo.** Etapas E0–E13 com `estado.md` por demanda, personas com contrato e checklist, reparo com três tentativas escalonadas.

## Problemas encontrados na Central (fatos verificados nos arquivos)

1. **25 hooks existem em `.claude/hooks/` mas não estão registrados no `settings.json`**, então não protegem nada. Entre eles: `secret-scan.mjs`, `vault-guard.mjs`, `guard-main-branch.mjs`, `subagent-model-guard.mjs`, `worktree-write-guard.mjs`, `large-file-warning.mjs`, `sql-idempotent-review.mjs`.
2. **O hook de intake não está ligado.** `.central-iso/hooks/central-iso-userprompt-intake.mjs` existe, mas o `UserPromptSubmit` roda `vault-orient.mjs`.
3. **Aprovação velha continua valendo.** A aprovação de 28 de setembro (integração frete × Central) está em `.central-iso/state/harness-approval.json`. Enquanto aqueles dois arquivos não mudarem, o PreToolUse libera edição para qualquer trabalho, em qualquer sessão. Pela documentação 13, o `sessionId` só precisa não estar vazio; ele não é comparado com a sessão atual.
4. **O canônico e a memória não têm cópia fora da máquina.** `Central ISO Harness` não é repositório git, e `Central ISO Knowledge` é git sem remoto, com 85 alterações pendentes. Se o Mac se perder, perde-se o padrão e a memória institucional.
5. **Plugins ligados que o nosso desliga por conflito:** `aia-harness`, `pr-review-toolkit` e `code-review` estão `true` no `settings.json` do hub.
6. **Permissões largas.** `defaultMode: auto` e `allow` para `git add`, `git commit`, `npm install` e `node *`.
7. Conferido: `.env` e `.token` do CTP-ATP e o `.env` do Agend estão no `.gitignore` e não estão no git.

## Brechas que os dois têm (precisam fechar no harness novo)

1. **A aprovação não é por demanda e não expira.** No nosso, "basta uma demanda aprovada para liberar"; na Central, o arquivo de estado vale para tudo até alguém mexer na SPEC.
2. **A aprovação pode ser forjada por um agente.** No nosso, basta escrever a frase no `estado.md`; na Central, basta rodar o gerador de manifest. A aprovação precisa depender de algo que só o humano faz.
3. **Codex, Antigravity e OpenCode não têm hooks** em nenhum dos dois. A trava deles é instrução, conferência do orquestrador e pre-commit do git.
4. **Hook escrito não é hook ativo.** Nenhum dos dois tem um teste que falhe quando um hook existe na pasta mas não está registrado.

## O que levar para o harness novo (proposta, a validar com o Gabriel)

1. O layout com um namespace só para o harness e manifestos `project.json` e `harness.json` (com a versão do canônico), e estado de execução fora do git.
2. `AGENTS.md` na raiz, curto, apontando para o namespace, para os quatro agentes.
3. Os scripts `inventory`, `diff`, `verify`, `doctor` e `sync` com ensaio obrigatório, incluindo o perfil "máquina nova".
4. Aprovação por demanda, amarrada por hash, que expira no fechamento da demanda e depende de ação humana.
5. Hooks de ciclo completo (intake, relatório de subagente, gates no fim) somados às travas que já temos.
6. Um teste de "hook registrado": todo arquivo em `hooks/` precisa estar no `settings.json` ou numa lista explícita de desligados.
7. Canônico e memória sempre com remoto.
