# .claude/: as travas mecânicas do Claude Code

Tudo aqui é lido pelo Claude Code a partir da raiz do projeto. As regras escritas estão em `AGENTS.md` e `.agents/`; estes arquivos fazem cumpri-las sem depender de o agente lembrar.

**Versão mínima do Claude Code: 2.1.295.** É a primeira que entende `"onFailure": "block"`, que faz o próprio Claude Code bloquear quando um hook quebra, estoura o tempo ou não roda (sem ele, saída 1, timeout e `node` ausente deixam a ação passar). O `doctor.mjs` confere a versão.

## O que cada hook faz

Toda guarda abaixo **falha fechada**: se ela mesma quebrar (erro, entrada ilegível, pasta de estado corrompida), a ação é bloqueada e a mensagem manda avisar o humano. Só `session-start.mjs` falha aberto, porque só informa.

| Hook | Quando dispara | O que impede |
|---|---|---|
| `despachante.mjs` | Todo `PreToolUse` | **É o único registrado no `settings.json` para esse evento.** Lê o evento uma vez e chama, na ordem, as guardas abaixo cujo conjunto de ferramentas casa; a primeira que bloquear encerra. Uma guarda que quebra bloqueia. Cada guarda também roda sozinha (`node x-guard.mjs`), que é como o selftest a prova |
| `session-start.mjs` | Início da sessão | Nada. Informa a etapa de cada demanda e, se o `doctor` achar algo grave, avisa o agente e o humano |
| `vault-guard.mjs` | Leitura, escrita, Bash e MCP | Acesso direto a `vault/` (modo local) ou à pasta de `HARNESS_VAULT_CENTRAL` (modo universal, sem exceção). Só pelas ferramentas MCP. Exceção local: leitura em `vault/daily/`. Barra escrita no `harness-vault-comum` e qualquer `harness-vault-<outro módulo>` |
| `rules-guard.mjs` | Escrita, Bash e `SendMessage` | Editar arquivo de regra em qualquer profundidade (ESLint, `tsconfig*`, `selftest`, configs de teste, `.githooks/`, `.git/`, `.github/workflows/`, `.claude/`, `.agents/` salvo `memory/`, `AGENTS.md`, `.mcp.json`, configs de outras CLIs); editar `generated/`; escrever em `~/.claude`, rc de shell, `~/.ssh`; escrever `eslint-disable`, `/* eslint regra: off */`, `biome-ignore`, `@ts-ignore`, `@ts-nocheck`, `.skip`, `.only`; por Bash: escrever nesses arquivos (inclusive dentro de `sh -c`, `eval`, `$(...)`), subir sessão aninhada de outra CLI, atribuir `HARNESS_*`, rodar `travar-gates`, rodar `biome ... --suppress` ou `--unsafe`, mandar a frase de aprovação a outra sessão (`maestri ask`, `SendMessage`), rodar interpretador com código inline que cita arquivo de regra |
| `segredo-guard.mjs` | Escrita e Bash | Texto com chave AWS, token do GitHub, chave privada, URL de banco com senha etc. (mesma varredura do pre-commit) |
| `plano-guard.mjs` | Escrita | Editar código sem SPEC e plano aprovados em `estado.md` (com o sha256 do arquivo conferido: se SPEC ou plano mudaram depois, não libera), sem "Consultas feitas" na SPEC, com plano sem `Files:`/`Resources:` em cada tarefa, ou em arquivo que não está em nenhum `Files:` (aceita pasta e glob). Vale também dentro de `.claude/worktrees/<n>/` |
| `escopo-guard.mjs` | Escrita e Bash | **Sessão principal e orquestrador escrevendo código** (só escrevem `docs/`, `.agents/memory/` e `.md` da raiz; por Bash vale o mesmo, pelos alvos de `alvosDeEscrita()` da `guard-lib`, e apagar `node_modules`, `dist`, `build` é livre); revisoras e validador escrevendo fora de `docs/fluxo/`; `test-engineer` e `debugger` escrevendo fora de teste; qualquer subagente escrevendo a memória |
| `despacho-guard.mjs` | Despacho de subagente (`Agent`, `Task`) | `general-purpose`, despacho sem tipo ou com persona que não existe em `agents/`; despacho sem `model` quando o frontmatter da persona é `inherit` |
| `relato-guard.mjs` | `SubagentStop` | Subagente implementador ou revisor terminar com relato fora do formato (F1 + F3, F1 + F4: `.agents/rules/formatos.md`), conferido contra `git status`, `Files:` da tarefa e hashes do `estado.md`. O subagente recebe a lista de erros e corrige; na segunda tentativa libera (não prende a sessão). **Falha aberta** |
| `recibo-guard.mjs` | `Stop` | Da E8 em diante, com código alterado, a sessão principal parar sem `recibo-gates.md` válido (gerado por `recibo-gates.mjs`, que roda lint, typecheck e test; vale enquanto o código não mudar e os três forem EXIT 0). **Falha aberta** |
| `commit-guard.mjs` | Bash | `git push`, `merge`, `add .`, `add -A`, `add -f`, `add` de `.env*`, `commit -a`, `--no-verify`, `reset --hard`, mexer na config do git (alias, hooksPath, user), `update-ref`, `filter-branch`; atalhos (`sh -c "git push"`, `eval`, `gh api` que altera, `gh pr create`, `HUSKY=0`); **commit direto na `main`/`master`**; qualquer commit ou `add` vindo de subagente |

`validar-saida.mjs` confere qualquer saída contra os formatos (`relato`, `sintese`, `estado`, `decisao`, `etapa`, `externo`, `pulo`); `recibo-gates.mjs <demanda>` roda os gates e grava o recibo. `formatos-lib.mjs` é a biblioteca dos dois.

`doctor.mjs` (`node .claude/hooks/doctor.mjs`) confere o que não viaja com o clone e o que desliga as travas sem rastro: `onFailure` em cada guarda, `settings.local.json` e `~/.claude/settings.json` sem `disableAllHooks`, `hooks` ou `HARNESS_*`, pre-commit e pre-push instalados e idênticos aos de `.githooks/`, `core.hooksPath` vazio, `gates.lock` conferindo, MCP do cofre aprovado, vault do modo universal (variável, pastas, servidor comum), memória (`memoria-check.mjs`: teto de 130, links, campos de frescor, aviso de entrada com mais de 90 dias), `.gitignore` completo e a versão do Claude Code.

Os subagentes em `agents/` são adaptadores finos: cada um manda ler `.agents/personas/<nome>.md`, que é a fonte única, e fixa no frontmatter `model: inherit` (o modelo vai em cada despacho) e `disallowedTools` (nenhum despacha subagente; revisores não editam; ninguém escreve no cofre; o `Agent` fica de fora). O campo `skills:` fica para o Gabriel escolher por agente. `tech-lead` e `orquestrador` não têm adaptador: o primeiro conversa com o humano e o segundo é a sessão principal. Campo com nome errado no frontmatter é ignorado sem erro; o selftest confere os nomes.

`permissions.deny` em `settings.json` bloqueia também `git push`, `Agent(general-purpose)` e a leitura e edição de `.env*` em qualquer pasta (`.env.example` fica livre).

`enabledPlugins` em `settings.json` desliga, só nos projetos com o harness, os plugins que duplicam o que o harness já faz ou trazem fluxo próprio: `aia-harness`, `feature-dev`, `code-review`, `pr-review-toolkit`, `code-simplifier`, `ui-theme-designer`, `frontend-design`, `gsap-skills` e `github`. Fica no kit (e não no `settings.json` de cada projeto) para o arquivo do projeto continuar igual ao do kit e receber as atualizações. O selftest reprova se algum plugin desligado for dono de uma skill que um agente pré-carrega (`skills:`). Prova no Claude Code real: item F2 de `modo-facil/06-teste-no-mac.md`.

## Como o humano libera uma exceção

- **Mudar uma regra** (lint, hook, constituição, gates): **você**, no seu terminal, roda `touch .claude/liberar-regras`. O próprio arquivo é protegido: o agente não consegue criá-lo. Apague quando terminar. Está no `.gitignore`. Vale para o `rules-guard` e para o `escopo-guard`.
- **Mudar o que define os gates** (lint, typecheck, teste, tsconfig): depois de aprovar, você roda `node .githooks/travar-gates.mjs` e commita `.githooks/gates.lock.json`. O agente não roda o `travar-gates`.
- **Início do projeto ou emergência** (scaffold antes de existir demanda): abra a sessão com `HARNESS_BYPASS=1 claude`. Desliga todos os hooks daquela sessão.
- **Commit na `main`** (o primeiro commit do projeto, ou uma correção sua): `HARNESS_COMMIT_MAIN=1 git commit ...`, no seu terminal.

O agente não deve criar o arquivo nem pedir o bypass por conta própria: a mensagem de bloqueio manda parar e perguntar.

## Provas

`node .claude/hooks/selftest.mjs` (base em `selftest-lib.mjs`, casos em `selftest-casos-1..8.mjs`, cada arquivo até 350 linhas) alimenta cada hook com eventos no formato real e confere saída e mensagem: cada guarda, o registro em `settings.json` (com `onFailure`), todo hook da pasta registrado, os campos dos adaptadores e, no `selftest-git.mjs`, o `gates.lock`, o pre-commit, o pre-push, a varredura de segredo e o `doctor` num repositório git descartável. Rode depois de qualquer mudança nos hooks e depois de atualizar o Claude Code. Foi também provado de ponta a ponta com o Claude Code real no piloto: o `plano-guard` bloqueou uma escrita sem demanda aprovada, e, dentro de um subagente `code-reviewer`, o `escopo-guard` e o `commit-guard` bloquearam uma escrita de código e um `git commit`. **Provado também com o Claude Code 2.1.302 real em 18/10/2026** (`docs/inventario/2026-10-18-prova-claude-code-real.md`): `onFailure` (sem ele, saída 1 e timeout deixam passar; com ele, bloqueiam), `plano-guard`, `escopo-guard` (sessão principal e `code-reviewer`), `commit-guard` (main, push e `git add` de subagente), `rules-guard` (Write e Bash), `despacho-guard`, `segredo-guard` e o `deny` de `.env`. **Ainda sem prova real:** `enabledPlugins`, modo interativo com `ask` e Stop/SubagentStop (não existem ainda).

## O que isto NÃO garante

- **Bash é trava de bom senso.** O `rules-guard` agora lê `sh -c`, `eval`, `$(...)`, heredoc, `git checkout -- arquivo` e interpretador com código inline que cita arquivo de regra, mas shell tem formas demais: um script escrito antes e rodado depois (`node x.mjs`) passa. A única camada que fecha o Bash de verdade é o **sandbox do Claude Code** (imposto pelo sistema operacional, desligado por padrão, com saída `dangerouslyDisableSandbox` que só se fecha em settings gerenciado). Decisão pendente DP-12. Até lá, a defesa final é a revisão do `git diff`, o `gates.lock` e o pre-commit.
- **A aprovação em `estado.md` é um arquivo.** O `plano-guard` confere que a linha de aprovação está preenchida (arquivo, frase, data), que a SPEC e o plano existem e que a SPEC tem "Consultas feitas". Ele não consegue saber se a frase é mesmo do humano: um agente pode escrever `estado.md`. A aprovação assinada pelo `UserPromptSubmit` está desenhada (B01, DP-03) e não implementada.
- **Arquivos fora de `Files:`.** Nenhum hook sabe qual tarefa está rodando; a conferência "só os arquivos de `Files:`" é do revisor, pelo `git diff` (B02, não implementado).
- **Várias demandas ao mesmo tempo.** Basta uma demanda liberada para o `plano-guard` deixar editar código; ele não sabe a qual demanda a edição pertence.
- **Busca sem caminho.** O Grep da ferramenta, sem `path`, varre a pasta inteira, vault incluído. O `vault-guard` só barra Grep quando o `path` aponta para `vault/`.
- **Pre-commit.** O `commit-guard` barra `--no-verify` (e as abreviações), `core.hooksPath` e mexer em `.git/hooks`. Fora do Claude Code, qualquer um pode pular o pre-commit; por isso o CI (quando existir) repete os gates. O `doctor` avisa se o hook do git saiu do lugar.
- **Sessão fora da raiz do projeto (provado em 18/10).** Sessão aberta na pasta-mãe ou numa subpasta **não carrega nenhum hook**, nem o `session-start` que avisaria. Abra sempre na raiz. **Terminal do Maestri com responsabilidade (role):** o Claude Code roda numa subpasta e não lê este `settings.json`. Por isso o harness proíbe role nos terminais (`.agents/adaptadores.md`). O `session-start` avisa se a sessão abriu fora da raiz.
- **Outras CLIs.** Estes hooks são do Claude Code. O pre-commit e o pre-push do git (`.githooks/`) valem para todas. Codex, OpenCode e Antigravity têm hooks próprios no projeto (B23, não implementado), e o Codex e o Antigravity só carregam a configuração do projeto depois de você confiar nele, por máquina.
- **Hooks de terceiros.** `graphify install` e `impeccable install` acrescentam hooks e arquivos em `.claude/`. Depois de instalar qualquer ferramenta, rode `node .claude/hooks/selftest.mjs` e `node .claude/hooks/doctor.mjs`: eles conferem que os nossos hooks continuam registrados e com `onFailure`.

## Vault em dois modos (W6)

`.claude/vault.json` diz o modo (ausente = local). **Local:** `vault/` no projeto. **Universal:** vault da Central fora do projeto, no caminho da variável `HARNESS_VAULT_CENTRAL` (por máquina, não vai para o git; o `doctor` confere), uma pasta por módulo e `_comum/`; o servidor `harness-vault` aponta para a pasta do módulo e o `harness-vault-comum` para `_comum/`, com escrita negada pelo `deny` e pelo `vault-guard`. `vault-config.mjs` gera os arquivos (`json`, `mcp`, `iniciar`); o instalador chama.

## Distribuição (W7)

O kit tem `VERSAO` e `harness.json` (sha256 de cada arquivo que o instalador copia; gere com `node kit-claude-code/dot-claude/hooks/harness-manifesto.mjs gerar .` depois de mudar o kit: o selftest confere). O instalador grava no projeto o seu `harness.json` (versão e a "base" de cada arquivo).

- `node .claude/hooks/harness-manifesto.mjs verificar .` (ou `verificar <projeto> <kit>`): arquivo do kit ausente ou **hook alterado** é grave; outro arquivo alterado é aviso; com o kit à mão, diz se há atualização.
- `node <kit>/kit-claude-code/dot-claude/hooks/harness-manifesto.mjs atualizar <kit> <projeto>`: mostra o plano. Com `--aplicar`: copia o que é novo e o que o projeto não mexeu; o que o projeto mexeu e o kit também vira `<arquivo>.kit-novo` e conflito (saída 2). `AGENTS.md`, `stack.md`, memória, `.mcp.json`, `vault/`, `docs/` e `gates.lock.json` nunca são tocados; nada é apagado. Faça commit antes e rode selftest e doctor depois.
- O `doctor` confere o registro, o grafo (`graphify-out`, até 14 dias), o `gitleaks`, o plugin Superpowers e `autoMemoryEnabled` (a memória é a do harness; a automática do Claude Code duplica).

## Outras CLIs (W8)

`guarda-externa.mjs <codex|opencode> <tech-lead|devops-engineer>` é chamada pelo `.codex/hooks.json` e pelo plugin `.opencode/plugin/harness-guard.ts`. Traduz o evento e reaproveita `vault-guard`, `rules-guard` e `segredo-guard`; acrescenta o escopo do papel (Codex: `docs/definicao/` e `docs/fluxo/`; OpenCode: `docs/fluxo/` e a configuração de entrega) e a proibição de git que muda a árvore. Detalhe e limites em `.agents/adaptadores.md`.
