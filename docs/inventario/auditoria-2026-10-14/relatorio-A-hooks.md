> **Nota de 14/10/2026:** relatório de evidência da auditoria consolidada em `docs/inventario/2026-10-14-auditoria-profunda-central-x-canonico.md`. Os caminhos citam a cópia de auditoria: `…/scratchpad/auditoria/central/` = `~/Desktop/Projetos/` e `…/scratchpad/auditoria/canonico-kit/` = `~/development/harness-canonico/`. Linhas valem para os arquivos de 14/10.

# Relatório A: hooks, travas, permissões e settings

- **Data:** 14/10/2026
- **Método:** só leitura dos arquivos copiados em `scratchpad/auditoria/`. Nenhum hook foi executado, nada foi instalado, nenhuma rede foi usada.
- **Caminhos abreviados neste relatório:**
  - `C/` = `scratchpad/auditoria/central/`
  - `CI/` = `C/Central ISO/` (repositório do hub)
  - `CH/` = `C/Central ISO Harness/`
  - `K/` = `scratchpad/auditoria/canonico-kit/`
  - `KC/` = `K/kit-claude-code/dot-claude/`
- **Legenda:** **[FATO]** = lido no código ou na config. **[HIPÓTESE]** = inferência minha, a confirmar.

## Antes de ler: o que não consegui verificar

1. **Não li:** `CI/.claude/settings.local.json`, `C/.claude/settings.local.json` e `C/.claude/settings.json.central-iso-backup` (ficaram fora da cópia, ver `C/_PULADOS.txt`). Um `settings.local.json` pode ter regras `allow` que afrouxam tudo o que está descrito aqui.
2. **Não li:** `CI/.central-iso/state/harness-approval.json`, porque `state/` não veio na cópia. Não vi a aprovação real que está valendo hoje.
3. **Não li:** `~/.claude/settings.json` do Mac, nem os hooks que os plugins ligados registram (aia-harness, hookify, superpowers, ponytail, caveman, pr-review-toolkit, code-review). **[HIPÓTESE H7]** Plugin ligado pode registrar hook próprio, invisível no `settings.json` do projeto.
4. **Comportamento do Claude Code:** não consultei a documentação, porque a rede estava proibida. Tudo o que depende de como o Claude Code trata os hooks aparece como hipótese:

| ID | Hipótese | Por que importa |
|---|---|---|
| H1 | Só bloqueiam: exit 2, `permissionDecision: "deny"` ou `decision: "block"`. Exit 1, exceção não tratada e timeout contam como erro **não bloqueante**, e a ação segue. | Define o que é fail-open |
| H2 | Texto em stderr com exit 0 (PostToolUse/Stop) não chega ao modelo. | Avisos da Central podem não ter efeito |
| H3 | O campo `reminder` não é reconhecido no SubagentStop. | Torna o SubagentStop da Central inútil |
| H4 | Sessão aberta numa pasta não carrega o `.claude/settings.json` de subpastas. | Sessão na raiz controladora pula as travas dos repositórios |
| H5 | `defaultMode: "auto"` é o modo em que um classificador decide. Não é determinístico. | Push e merge podem ser aprovados sozinhos |
| H6 | Mudar o bloco `hooks` do settings só vale depois de reiniciar a sessão. Editar o arquivo `.mjs` do hook vale na hora. | Proteger o arquivo do hook é vital |
| H8 | Em worktree do Claude Code (`.claude/worktrees/<nome>`), `CLAUDE_PROJECT_DIR` continua apontando para a raiz original. O comentário em `CI/.claude/hooks/guard-main-branch.mjs` L39-42 afirma isso. | Abre uma brecha no canonico |
| H9 | `deny Read(./.env)` não impede `cat .env` pelo Bash. | Proteção de segredo |
| H10 | O sandbox de Bash do Claude Code aplica as regras `Edit`/`Read` de deny no nível do sistema operacional. | Seria a correção real para "Bash é trava de bom senso" |
| H11 | O formato `"command": "node", "args": [...]` usado pela Central funciona. **Evidência indireta:** existem logs gerados por hooks registrados assim (`CI/.claude/hooks/log/pending/03881716-….json`, feito pelo `session-log.mjs` em 11/09/2026; e `compile.log`, citado em `_PULADOS.txt`). | Se não funcionasse, todos os hooks da Central estariam mortos |
| H12 | `maestri ask` entrega o texto como prompt do usuário e dispara `UserPromptSubmit`. | Afeta a proposta de aprovação por frase digitada |

---

## Inventário de hooks — Central ISO

A Central tem três escopos com settings diferentes. O mais importante é o repositório `CI/`.

### A) Repositório `CI/` (settings: `CI/.claude/settings.json`)

| Arquivo | Evento / matcher | Registrado? | O que faz | Fail-closed? | Teste |
|---|---|---|---|---|---|
| `CI/.central-iso/hooks/central-iso-pretooluse.mjs` | PreToolUse `Read\|Grep\|Glob\|Write\|Edit\|MultiEdit\|NotebookEdit\|Bash\|PowerShell` | **Sim** (settings L82-95) | (1) Nega se o JSON bruto da entrada casar com a regex `rm -rf /`, `git push --force`, `.env`, `BEGIN … KEY` ou `sk-…` (L15). (2) Nega Write/Edit/NotebookEdit, e Bash fora de uma lista "somente leitura" (L64), se não houver `.central-iso/state/harness-approval.json` válido com sha256 da SPEC e do plano iguais ao conteúdo atual (L70-107). | **Parcial.** Sem state file, bloqueia. Mas: stdin inválido libera (L21-25). E se a SPEC aprovada for apagada ou virar diretório, `readFileSync` (L105, fora de try) lança exceção, o processo sai com 1 e **[H1]** a ação segue. | `CH/scripts/test-hook-contracts.mjs` e `test-pretooluse-approval-state-file.mjs`. Os dois testam a cópia do **template**; o `diff` mostra que ela é idêntica à viva. |
| `CI/.central-iso/hooks/central-iso-userprompt-intake.mjs` | UserPromptSubmit | **Não** no `CI/`. Está registrado no template `CH/templates/repo-consumer/.claude/settings.json` e no CTP-ATP; falta no Agend. | Classifica o prompt por palavra-chave e **bloqueia o prompt do humano** se tiver "token", ".env", "senha", "sync", "limpeza", "cleanup" ou "sem spec" (L158-165). Grava `state/intake/latest.json`. | Fail-open (try/catch, exit 0, L25-29) | `CH/scripts/test-userprompt-intake-hook.mjs` (template) |
| `CI/.claude/hooks/graphify-orient.mjs` | PreToolUse `Read\|Grep\|Glob\|Bash` | Sim (L96-108) | Injeta 5 linhas "consulte o Graphify" quando lê arquivo de código, roda Grep ou um Bash com grep/find (L152-193). Sem grafo, dispara `graphify extract --force` em segundo plano (L143-146). | Não bloqueia | `CI/.claude/hooks/tests/graphify-orient.test.mjs` |
| `CI/.claude/hooks/central-iso-posttooluse.mjs` | PostToolUse `Edit\|Write\|MultiEdit` | Sim (L110-124) | Escreve um aviso em stderr e sai com 0 | No-op provável **[H2]** | Nenhum |
| `CI/.claude/hooks/central-iso-subagentstop.mjs` | SubagentStop | Sim (L125-138) | Imprime `{"reminder": …}`. Não lê stdin, não confere relatório, não bloqueia. | **No-op [H3]** | `test-hook-contracts.mjs` L98-103. O teste confirma justamente que ele não faz nada. |
| `CI/.claude/hooks/central-iso-stop.mjs` | Stop | Sim (L141-149) | Lembrete em stderr | No-op **[H2]** | `test-hook-contracts.mjs` L92-96 |
| `CI/.claude/hooks/verify-on-stop.mjs` | Stop (timeout 900 s) | Sim (L150-157) | Com árvore suja, roda `CI/scripts/verify.mjs` (front: test, lint, build; back: test e `--check`; testes do harness). Sempre roda `graphify-ecosystem-sync.mjs`, com `--extract` se o código mudou. Bloqueia com `decision: block`. Guarda um fingerprint de sucesso por sessão. | **Parcial.** Bloqueia quando o git falha ou o script falta. Mas no **segundo Stop com o mesmo estado ele libera** (L322 e L333, `stop_hook_active`). Crash ou timeout: **[H1]** libera. | `CI/.claude/hooks/tests/verify-on-stop.test.mjs` (L147-153 confere o registro e o timeout no settings) |
| `CI/.claude/hooks/session-log.mjs` | SessionEnd | Sim (L161-174) | Se a sessão teve 4 turnos ou mais, dispara `session-log-runner.mjs`, uma sub-sessão do Agent SDK com `model: "sonnet"` (runner L229) que grava no cofre | Fail-open | `tests/session-log.test.mjs` |
| `CI/.claude/hooks/compile.mjs` | SessionStart | Sim (L175-188) | Se há nota diária pendente, dispara `compile-runner.mjs`, sub-sessão do Agent SDK com `model: "sonnet"` (L460) | Fail-open | `CI/.claude/scripts/tests/compile-runner.test.mjs` e `tests/vault-pipeline-shared.test.mjs` |
| `CI/.claude/hooks/vault-orient.mjs` | UserPromptSubmit | Sim (L189-202) | Injeta 7 linhas "MEMÓRIA OBRIGATÓRIA" a cada prompt | Não bloqueia | `tests/vault-orient.test.mjs` |
| `vault-guard.mjs` | PreToolUse (pensado para todas as ferramentas) | **Não** | Nega acesso direto a `.central-iso-vault` / `Central ISO Knowledge`. Exceção: consulta Graphify ao grafo global. Desliga com `CLAUDE_INVOKED_BY` (L11). | Fail-open | `tests/vault-guard.test.mjs`. O teste **roda no gate do Stop** (`CI/scripts/verify.mjs` L46-53), mas o hook não está ligado. |
| `secret-scan.mjs` | PreToolUse Edit\|Write | **Não** | Exit 2 para AKIA, chave privada, `sk-`, `ghp_`, `xox`, `AIza` | Fail-open | Nenhum |
| `guard-main-branch.mjs` | PreToolUse Bash | **Não** | Nega commit e push em main/master. **Contradiz** `CI/.claude/rules/git-solo-main.md` L3 e L11, que permitem a main. | Fail-open | Nenhum |
| `subagent-model-guard.mjs` | PreToolUse Agent | **Não** | Força `model: sonnet` quando o despacho não declara modelo | Fail-open | Nenhum |
| `worktree-write-guard.mjs` | PreToolUse Write\|Edit | **Não** | `ask` quando a escrita sai do worktree ativo | Nunca bloqueia | Nenhum |
| `rtk-hook.mjs` | PreToolUse Bash | **Não** | Delega para `rtk hook claude` | Fail-open | Nenhum |
| `gh-scope-guard.mjs` | PostToolUse Bash | **Não** | Explica erro de escopo OAuth do `gh` | Não bloqueia | `tests/gh-scope-guard.test.mjs` |
| `format-on-edit.mjs` | PostToolUse | **Não** | Roda biome ou prettier no arquivo editado | Não bloqueia | Nenhum |
| `set-files-changed.mjs` | PostToolUse | **Não** | Anota os arquivos editados. O comentário (L3-5) diz que o `verify-on-stop` usa essa lista, mas o `verify-on-stop` atual usa `git diff` (L76-78). **Obsoleto.** | — | Nenhum |
| `sql-idempotent-review.mjs` | PostToolUse + Stop | **Não** | Pede SQL idempotente; no Stop, bloqueia uma vez | Fail-open | Nenhum |
| `large-file-warning.mjs` | PostToolUse + Stop | **Não** | Teto de 350 linhas (L27); no Stop, bloqueia uma vez | Fail-open | Nenhum |
| `validate-settings-schema.mjs` | PostToolUse | **Não** | Baixa o schema do SchemaStore pela rede (L125) e sai com 2 se o settings for inválido | Fail-open sem rede | Nenhum |
| `memory-stop.mjs` | Stop | **Não** | Pede reflexão de memória; depende de `set-files-changed` | Não bloqueia | Nenhum |
| `check-deps-on-start.mjs` | SessionStart | **Não** | Chama `bin/harness.mjs` do plugin aia-harness (L29-52) | Fail-open | Nenhum |
| `orchestration-mode.mjs` | UserPromptSubmit | **Não** no `CI/` (a versão da raiz está ligada) | Injeta 6 linhas do fluxo | — | Nenhum |
| `worktree-create.mjs`, `worktree-remove.mjs`, `worktree-session-ctx.mjs`, `worktree-subagent-ctx.mjs`, `worktree-prompt-ctx.mjs` | WorktreeCreate/Remove, SessionStart, SubagentStart, UserPromptSubmit | **Não** | Criam e semeiam worktree e injetam contexto | Fail-open | Nenhum |
| `hook-io.mjs`, `session-scratch.mjs`, `vault-pipeline-shared.mjs`, `vault-note-merge.mjs`, `worktree-seed.mjs` | — (auxiliares) | n/a | Bibliotecas e scripts chamados por hooks | — | `vault-pipeline-shared.test.mjs`, `vault-note-merge.test.mjs` |

**Contagem [FATO]:**
- 33 arquivos `.mjs` em `CI/.claude/hooks/`: 8 registrados, 5 auxiliares e **20 hooks que existem e não estão registrados**.
- Some-se `central-iso-userprompt-intake.mjs`, que também não está registrado.
- O inventário do canonico (`K/docs/inventario/…` L47) fala em 25; a diferença provavelmente vem de ter contado os auxiliares.

### B) Raiz controladora `C/` (settings: `C/.claude/settings.json`)

| Arquivo | Evento | Registrado? | O que faz | Fail-closed? | Teste |
|---|---|---|---|---|---|
| `C/.claude/hooks/vault-guard.mjs` | PreToolUse todas (L76-89) | Sim | Nega quando **qualquer** valor de texto da entrada tem o segmento do cofre precedido de `/` ou no início (L10-13). Exceções: graphify, graph-sync/doctor e bootstrap. | Fail-open; desliga com `CLAUDE_INVOKED_BY` (L5) | Nenhum (o teste do repo cobre outra versão) |
| `C/.claude/hooks/secret-scan.mjs` | PreToolUse Edit\|Write\|MultiEdit (L90-102) | Sim | Exit 2 para os mesmos 6 padrões | Fail-open | Nenhum |
| `C/.claude/hooks/workspace-context.mjs` | SessionStart + UserPromptSubmit (L104-137) | Sim | Varre a árvore até profundidade 7 **a cada prompt** e injeta o inventário de projetos | — | Nenhum |
| `C/.claude/hooks/orchestration-mode.mjs` | UserPromptSubmit | Sim | Injeta 5 linhas do fluxo | — | Nenhum |
| `C/.claude/hooks/central-iso-pretooluse.mjs` (versão curta: só regex e exit 2) | — | **Não** | — | — | — |
| `C/.claude/hooks/central-iso-posttooluse.mjs`, `central-iso-stop.mjs`, `central-iso-subagentstop.mjs` | — | **Não** | — | — | — |

**[FATO]** A raiz **não tem trava de aprovação nem de commit**. `allow` libera `git add/commit/merge/rebase/checkout/tag…` (L9-23) e `defaultMode` é `auto` (L8). A política `CH/docs/03_POLITICA_DE_HOOKS.md` L26 exige "bloqueio de mutação de produto na raiz", e esse bloqueio não existe.

### C) Módulos (resumo, para mostrar a deriva)

| Repositório | Situação [FATO] |
|---|---|
| `Mod. Agend` | Settings igual ao template, **menos o intake** |
| `Mod. CTP-ATP` | Settings igual ao template. Tem uma cópia velha e morta em `.claude/hooks/central-iso-pretooluse.mjs`, que lê `.claude/state/…` |
| `Mod. Frete` | Conjunto antigo do aia-harness com **21 registros** (guard-main-branch, rtk, subagent-model-guard, secret-scan, worktree-*, verify-on-stop com timeout 300, etc.). **Sem gate de aprovação**: não tem `.central-iso/hooks/`. `defaultMode: default`. |

---

## Inventário de hooks — canonico

Settings: `KC/settings.json`.

| Arquivo | Evento / matcher | Registrado? | O que faz | Fail-closed? | Teste |
|---|---|---|---|---|---|
| `KC/hooks/session-start.mjs` | SessionStart | Sim (L10-19) | Injeta etapa e branch de cada `docs/fluxo/*/estado.md` (L7-26) | Fail-open (não é trava) | `KC/hooks/selftest.mjs` L175-183 |
| `KC/hooks/vault-guard.mjs` | PreToolUse `Read\|Grep\|Glob\|Write\|Edit\|MultiEdit\|NotebookEdit\|Bash\|mcp__obsidian__.*` | Sim (L20-29) | Bloqueia acesso direto a `vault/`, exceto leitura em `vault/daily` (L62). Bloqueia o MCP pessoal `obsidian` (L47). No Bash, separa o comando em pedaços e procura caminho do vault (L18-35). | **Fail-open** por desenho (`hook-io.mjs` L39-61) | selftest L48-73 (24 casos) |
| `KC/hooks/rules-guard.mjs` | PreToolUse `Write\|Edit\|MultiEdit\|NotebookEdit\|Bash` | Sim (L30-38) | Bloqueia edição de arquivos de regra (`PROTEGIDOS` L15-27: eslint, biome, `.githooks`, husky, lefthook, `.mcp.json`, settings, `.claude/hooks\|agents`, `AGENTS.md`/`CLAUDE.md`, `.agents/fluxo.md\|rules\|personas`). Bloqueia escrever `eslint-disable`, `@ts-ignore`, `@ts-nocheck`, `.skip` e `.only` em código (L32-38, L92-103). Libera com `.claude/liberar-regras` ou `HARNESS_BYPASS=1` (L43-45). | Fail-open | selftest L75-105 (25 casos) |
| `KC/hooks/plano-guard.mjs` | PreToolUse `Write\|Edit\|MultiEdit\|NotebookEdit` | Sim (L39-47) | Bloqueia edição fora de `LIVRE` (L18) se nenhuma demanda tiver SPEC e Plano preenchidos no `estado.md` (L41), com os dois arquivos existindo e a SPEC tendo `## Consultas feitas` (L47) | Fail-open | selftest L137-159 (11 casos) |
| `KC/hooks/escopo-guard.mjs` | PreToolUse `Write\|Edit\|MultiEdit\|NotebookEdit` | Sim (L48-56) | Pelo `agent_type`: revisores e validador só escrevem em `docs/fluxo/`; test-engineer e debugger só em arquivos de teste (L11-31) | Fail-open | selftest L161-173 (11 casos) |
| `KC/hooks/commit-guard.mjs` | PreToolUse Bash | Sim (L57-65) | Bloqueia: push, merge, `gh pr merge`, `--no-verify`/`-n`, `core.hooksPath`, apagar `.git/hooks`, `reset --hard`, `clean -f`, `branch -D`, `checkout -- .`, `restore .`, `add .`/`-A`/`-u`/`*`, `commit -a`. Subagente não pode commit/add/stash/restore/checkout/switch/rebase/cherry-pick/tag (L37-84). | Fail-open | selftest L107-135 (27 casos) |
| `KC/hooks/hook-io.mjs` | — (auxiliar) | n/a | `run()` engole qualquer exceção e libera (L51-61). Também `isSubagent`, `targetPath` e `bypassed`. | — | Coberto indiretamente |
| `KC/hooks/selftest.mjs` | — (prova) | n/a | Alimenta cada hook com eventos reais. Confere o registro dos **6 hooks esperados** e o deny de push (L185-215). | — | É o teste. Contei 98 casos `caso()` + 1 do session-start + 6 de registro + 1 de deny = **106 verificações**. O inventário fala em 119; não achei a diferença, talvez some o `gates:selftest`. |
| `K/.githooks/pre-commit` | hook do **git** (vale para qualquer CLI) | Instalado por `K/.githooks/instalar.sh`, não pelo settings | Roda `npm run lint`. Sem `package.json`, libera (L10-13). Sem script `lint`, falha (L16-19). | Fail-closed para script ausente | **Sem teste** do próprio arquivo |
| `permissions.deny` | — | Sim (L3-7) | Nega `Bash(git push *)`, `Read(./.env)` e `Read(./.env.*)` | Determinístico | selftest confere só o push |

**[FATO]** O canonico **não tem** hooks de PostToolUse, Stop, SubagentStop, UserPromptSubmit nem SessionEnd.

---

## Matriz de capacidades

| Capacidade | Central (como + arquivo) | canonico (como + arquivo) | Quem cobre melhor | Recomendação para o novo |
|---|---|---|---|---|
| Código só depois de SPEC e plano aprovados | PreToolUse lê o state file e exige os dois aprovados (`CI/.central-iso/hooks/central-iso-pretooluse.mjs` L27-30, L70-97) | `plano-guard` lê a tabela "Aprovações" do `estado.md` (`KC/hooks/plano-guard.mjs` L24-54) | Empate. Os dois são forjáveis (ver a seção de aprovação). | Aprovação de origem humana com hash (Rec. 1) |
| Aprovação presa ao conteúdo (hash) | sha256 da SPEC e do plano (L99-107) | Não tem: a SPEC pode mudar depois de aprovada | **Central** | Trazer o hash |
| Aprovação por demanda, sessão e expiração | Um arquivo por repositório. `sessionId` só precisa não ser vazio (L88). Não expira. | Lista de demandas, mas **basta uma** liberada (L61). Expira só com "concluída" (L40). | Nenhum | Por demanda e por `Files:` do plano (Rec. 2) |
| Bash mutante antes da aprovação | Bloqueia Bash fora da lista somente leitura, mas a regex só confere o **começo** do comando (L64) | Não confere Bash (matcher L40 sem Bash) | Central (fraco) | Sandbox + guarda de interpretadores (Rec. 3) |
| Só o orquestrador commita | Só regra escrita (`CI/.central-iso/instructions/AGENTS.md` L39). `allow` libera `git commit` para todos (`CI/.claude/settings.json` L13-14). | `commit-guard` bloqueia commit e add vindos de subagente (L81-83) | **canonico** | Manter e reforçar (Rec. 7) |
| Push e merge só do humano | Nega só `git push --force*` (settings L26 e regex L15). `git push -f` e `+main` passam. Raiz: `allow` inclui `git merge` (`C/.claude/settings.json` L17). | `commit-guard` (L60-62) + `deny Bash(git push *)` | **canonico** | Fechar alias, `sh -c` e `gh api` (Rec. 7) |
| `--no-verify` / `core.hooksPath` | Não tem | `commit-guard` L51-59 | **canonico** | Manter; adicionar alias (Rec. 7) |
| `git add .` / `-A` / `commit -a` | Não tem | `commit-guard` L75-80 | **canonico** | Manter |
| Destrutivos (`reset --hard`, `clean -f`, `rm -rf /`) | Regex `rm -rf /` (L15) | `commit-guard` L63-74 (só git) | canonico | Juntar os dois |
| Branch main | `guard-main-branch.mjs` existe mas **não está registrado** no `CI/`, e a regra permite a main | Não tem: nenhum hook olha a branch | Nenhum | Bloquear commit fora de `demanda/*` (Rec. 13) |
| Ler `.env` | `deny Read` com `./**/.env*` e `secrets/**` (settings L21-25) + a regex `.env` em qualquer entrada, Bash incluído (L15) | `deny Read` só de `./.env` e `./.env.*` na raiz (L5-6). `backend/.env` fica exposto. | **Central** | Glob recursivo + deny de Edit/Write (Rec. 11) |
| Escrever segredo em código | `secret-scan` ligado **só na raiz**; no `CI/` só a regex `sk-` e chave privada do pretool | Não tem | Central | Portar o secret-scan (Rec. 11) |
| Commitar `.env` / varrer segredo no commit | Não há pre-commit de segredo. `.worktreeinclude` **copia `.env` para todo worktree** (`CI/.worktreeinclude`). | Pre-commit só roda lint. O `.gitignore` do kit não tem `.env` (`K/.gitignore` L1-4). `git add .env` passa. | Nenhum | gitleaks no pre-commit e bloquear `git add .env*` (Rec. 11) |
| Arquivos de regra (lint, hooks, constituição, settings) | **Não tem proteção.** Com aprovação, o agente edita o próprio hook de aprovação. | `rules-guard` + `liberar-regras` do humano | **canonico** | Ampliar a lista; fechar alias e worktree (Rec. 5 e 6) |
| Atalhos que calam o verificador | Não tem | `rules-guard` L32-38 | **canonico** | Manter |
| Revisor não edita | `tools: [Read, Bash]` nos revisores. Bash escreve arquivo. `react-reviewer` e `security-auditor` não têm `tools:` e herdam tudo. Nenhum hook. | `escopo-guard` por `agent_type` (Write/Edit). Bash livre. Adaptadores sem `tools:`. | canonico | Hook + `tools:` + sandbox (Rec. 10) |
| Cofre só por MCP | Só na raiz (`C/.claude/hooks/vault-guard.mjs`). No `CI/` e nos módulos o guard **não está registrado**. `cat "Central ISO Knowledge/x"` com aspas passa na regex da raiz (L12). | `vault-guard` ligado e testado; bloqueia o MCP pessoal | **canonico** | Manter; Grep sem path continua aberto |
| Gates no fim (Stop) | `verify-on-stop` real, mas pesado; libera no 2º Stop | Não tem; só regra escrita (`K/AGENTS.md` regra 6) | Central (com ressalvas) | Stop leve com recibo (Rec. 8) |
| Pre-commit do git | Não tem pre-commit de lint (graphify instala só post-commit/post-checkout) | `K/.githooks/pre-commit` roda lint | **canonico** | Somar gitleaks e conferir os scripts (Rec. 6 e 11) |
| Relatório obrigatório do subagente | `central-iso-subagentstop.mjs` não faz nada [H3] | Não tem | Nenhum | SubagentStop que bloqueia (Rec. 9) |
| Intake do prompt | Classificador por palavra-chave que bloqueia o humano, e nem está registrado no `CI/` | Não tem | Nenhum útil | Só etapa atual + captura da frase de aprovação (Rec. 1 e 14) |
| Contexto inicial | `compile.mjs` (sub-sessão LLM) e `workspace-context` na raiz | `session-start.mjs` leve | **canonico** | Manter o leve |
| Orientação Graphify | `graphify-orient` a cada Read/Grep de código | Só regra escrita | Central (caro) | Não trazer por chamada; no máximo uma vez por sessão |
| RTK | `rtk-hook.mjs` não está registrado no `CI/`; está no Frete | Hook global por `rtk init -g` + `exclude_commands` para os gates (`K/modo-facil/01-…` L54-71) | canonico (exclusão documentada) | Doctor confere a exclusão (Rec. 16) |
| Worktrees | Conjunto completo, não registrado no `CI/` | Não tem; worktree abre brecha **[H8]** | Nenhum | Normalizar o caminho do worktree (Rec. 5) |
| Modelo por subagente | `model:` no frontmatter de todos os agentes; `subagent-model-guard` não está registrado | Não tem `model:`; só regra escrita (`K/AGENTS.md` L72) | **Central** | Frontmatter + guarda no Agent (Rec. 10) |
| Permissões | `defaultMode: auto`; `allow` com `node *`, `npm install`, `git add/commit` (`CI/.claude/settings.json` L8-19) | Sem `defaultMode`, sem `allow`, deny mínimo | canonico (menos largo) | Deny determinístico mais completo (Rec. 11 e 18) |
| Autoteste dos hooks | Testes contra o **template**, espalhados em 4 lugares | Um `selftest.mjs` que roda a cópia instalada | **canonico** | Manter |
| Teste de "hook registrado" | Só do timeout do `verify-on-stop` (teste L147-153) | Só os 6 esperados (selftest L189-208) | canonico | Todo arquivo em `hooks/` registrado (Rec. 12) |
| Bypass declarado pelo humano | Não existe. `CLAUDE_INVOKED_BY` desliga vault-guard, intake e orient, e qualquer processo pode setar. | `HARNESS_BYPASS=1` na abertura e `.claude/liberar-regras` | canonico | Manter; bloquear a sessão aninhada (Rec. 3) |
| Teto de 350 linhas | `large-file-warning` (não registrado) + gate ESLint em `.central-iso/gates/` | Gate ESLint com autoteste | canonico | Só ESLint |
| Memória automática | `session-log` + `compile` (sub-sessões sonnet) | Não tem (E10 manual) | Central (funcional, custa token) | Avaliar o custo antes de trazer |

---

## Aprovação: como cada um pode ser burlado

### Central: state file com sha256 (`CI/.central-iso/hooks/central-iso-pretooluse.mjs`)

**Respostas diretas [FATO]:**
- **É por demanda?** Não. Um arquivo por repositório (L72).
- **Expira?** Não. `approvedAt` só precisa ser uma data válida (L90).
- **Confere o sessionId?** Não. Só exige que não esteja vazio (L88); nunca compara com `event.session_id`.
- **Exige ação humana?** Não. O gerador `CH/scripts/generate-approval-manifest.mjs` aceita `--approved-by` de qualquer um (L17-20, L38-49), e os docs 12 e 13 dizem com todas as letras que o manifest "não é aprovação".
- **Restringe arquivos?** Não. Aprovado, qualquer arquivo do repositório pode ser editado.

**Como um agente burla:**
1. **Prefixo "somente leitura" [FATO, L64-65].** A regex só testa o **começo** do comando e não separa por `&&`, `;` ou `|`. Por isso `git status && npm install x`, `ls; rm -rf src` e `node --check a.js; node -e "…"` passam como leitura, mesmo **sem aprovação nenhuma**.
2. **Autoaprovação sem aprovação prévia [FATO por inferência direta do código].**
   - `find docs -name spec.md -exec shasum -a 256 {} \;` começa com `find`, então passa como leitura e calcula o hash.
   - `cat > .central-iso/state/harness-approval.json <<'EOF' … EOF` começa com `cat`, então passa e grava um state válido.
   - A partir daí, todas as mutações ficam liberadas. A pasta `state/` está no `.gitignore` (`CI/.gitignore`, bloco "Central ISO harness runtime"), então não fica rastro no git.
3. **Gerador.** `ls && node "…/generate-approval-manifest.mjs" --spec … --plan … --session x --approved-by "João" --out .central-iso/state/harness-approval.json` produz um manifest aceito pelo hook.
4. **Aprovação velha.** Enquanto a SPEC e o plano aprovados não mudarem, qualquer trabalho novo está liberado, em qualquer sessão. O inventário do canonico (`K/docs/inventario/…` L49) cita uma aprovação de 28/09 ainda válida; não confirmei, porque o arquivo não veio na cópia.
5. **Crash = liberação [FATO + H1].** Apague a SPEC aprovada (por exemplo `ls; mv docs/x.md /tmp`) ou aponte `specPath` para um diretório. O `readFileSync` da L105 lança exceção, o processo sai com código 1 e não imprime nada no stdout. Pela H1, o Claude Code segue com a ação.
6. **Trocar o diretório lido [FATO L71 + inferência].** O hook usa `event.cwd` **antes** de `CLAUDE_PROJECT_DIR`. Depois de `ls && cd /tmp/x`, onde existe um state forjado com cópias da SPEC e do plano, um Write com caminho absoluto dentro do `CI/` é validado contra o state de `/tmp/x`.
7. **Abrir a sessão na raiz `C/` [H4].** O settings do `CI/` não carrega; a raiz não tem gate. Tudo dentro de `Central ISO/` fica editável.
8. **Editar o próprio hook.** Com qualquer aprovação valendo, o agente pode reescrever `central-iso-pretooluse.mjs`; nada protege o arquivo. Pela H6, a mudança vale na hora.
9. **Outra CLI.** Codex, OpenCode e Antigravity não carregam esses hooks.

### canonico: `plano-guard` lendo `estado.md` (`KC/hooks/plano-guard.mjs`)

**Respostas diretas [FATO]:**
- **É por demanda?** Lê todas as demandas, mas **basta uma** liberada para abrir edição de qualquer código (L61). O README admite (`KC/README.md` L36).
- **Expira?** Só quando a etapa vira "concluída" (L40). Demanda esquecida em "E9" mantém o código aberto para sempre.
- **Confere o sessionId?** Não existe sessão no mecanismo.
- **Exige ação humana?** Não. Exige só três células preenchidas (L41). O README admite (L34).
- **Hash?** Não. A SPEC pode mudar depois de aprovada.

**Como um agente burla:**
1. **Escrever a aprovação.** `docs/` está em `LIVRE` (L18) e o `rules-guard` não protege `docs/fluxo/`. O agente escreve a linha `| SPEC | docs/…/s.md | "aprovo" | 2026-10-14 |` e uma SPEC com `## Consultas feitas`. Pronto.
2. **Bash.** O `plano-guard` não roda em Bash (matcher L40). `node -e`, `python -c`, `cat > src/a.ts`, `sed -i` e `tee` escrevem código sem aprovação. O README admite (L33).
3. **Fail-open por crash [FATO: `hook-io.mjs` L51-61 + `plano-guard.mjs` L30-35].** `mkdir -p docs/fluxo/zz/estado.md` cria um **diretório** com esse nome. O `readFileSync` lança EISDIR, `run()` engole a exceção e sai com 0. **Toda edição de código fica liberada**, sem forjar nada. Variante: transformar `docs/fluxo` num arquivo faz o `readdirSync` lançar ENOTDIR.
4. **Worktree [H8].** Num worktree do Claude Code, o alvo vira `.claude/worktrees/<n>/src/a.ts` relativo à raiz. Isso casa com `^\.claude\/` em `LIVRE`, então o arquivo fica **livre de aprovação**. O mesmo caminho também escapa do `rules-guard`, porque `^eslint…` não casa.
5. **Caminho absoluto "de fora" [FATO L59 + `hook-io.mjs` L77-79].** Um caminho que não começa literalmente com `CLAUDE_PROJECT_DIR` vira "fora do projeto" e é liberado. Exemplos possíveis no macOS: diferença de maiúscula/minúscula, `/private/tmp` contra `/tmp`, symlink.
6. **Sessão aninhada.** `HARNESS_BYPASS=1 claude -p "…"` pelo Bash: nenhum hook bloqueia (o `commit-guard` só olha git e gh). A sessão filha roda com todas as travas desligadas. Também dá para pôr `env.HARNESS_BYPASS` no `~/.claude/settings.json`: é caminho absoluto fora do projeto, então não é protegido, e vale na próxima sessão.
7. **Outra CLI**, igual à Central.

**Conclusão:**
- A Central tem a melhor **integridade**: o hash impede que a SPEC mude depois de aprovada.
- O canonico tem a melhor **legibilidade**: aprovação por demanda, num arquivo que o humano lê.
- **Nenhum dos dois tem autenticidade**: nada garante que foi o humano quem aprovou.
- O próprio desenho aprovado do canonico já aponta o caminho (`K/docs/superpowers/specs/2026-10-14-esteira-e0-e13-design.md` L119): "um agente consegue forjar um arquivo, mas não consegue forjar o que o Gabriel digita".

---

## Oneroso, duplicado ou quebrado

### Oneroso (custo sem ganho claro)

1. **Stop da Central roda build e grafo a cada encerramento.**
   - `CI/.claude/hooks/verify-on-stop.mjs` L338-350 roda o gate canônico sempre que há **qualquer** arquivo alterado, `.md` incluído.
   - O gate faz test, lint e **build** do front, mais os testes do back (`CI/scripts/verify.mjs` L8-55).
   - Depois vem `graphify-ecosystem-sync` com `--extract`, que pode levar até 660 s (L349).
   - O timeout total é de 900 s (settings L156).
   - Há notas no cofre que sugerem atrito real: `stop-hook-verify-mjs-etimedout-docker-desktop-parado.md` e `stop-hook-gate-teste-falso-positivo-working-tree-parcial-wave.md`. Os títulos aparecem em `CH/auditoria/00_RELATORIO_ESTADO_ATUAL.md` L124-125; não li o conteúdo.
2. **Contexto injetado em todo prompt ou ferramenta (custo de token).**
   - `vault-orient.mjs` injeta 7 linhas por prompt (L20-28).
   - `graphify-orient.mjs` injeta 5 linhas por Read/Grep de código (L179-186).
   - Na raiz, `workspace-context.mjs` varre o disco até profundidade 7 e injeta o inventário **a cada prompt** (settings L118-138, hook L16-50); `orchestration-mode.mjs` injeta mais 5 linhas.
   - **[HIPÓTESE, estimativa]** Na ordem de 100 a 250 tokens por prompt, mais cerca de 100 por leitura de código.
3. **Sub-sessões de LLM a cada sessão.**
   - `session-log.mjs` (SessionEnd) e `compile.mjs` (SessionStart) disparam sub-sessões do Agent SDK com sonnet (`session-log-runner.mjs` L229, `compile-runner.mjs` L460).
   - O runner tem 1.109 linhas e o pipeline inteiro passa de 2.700 linhas entre hooks e scripts.
   - O valor existe (memória automática), mas o custo e a complexidade são altos.
4. **Intake da Central bloqueia o humano por palavra-chave.**
   - `central-iso-userprompt-intake.mjs` L158-165: "o token do Sankhya expirou" ou "sincronizar a tabela" bloqueiam o prompt.
   - Não protege nada, porque o humano reescreve e segue.
5. **Regex `.env` sobre o JSON inteiro.** `central-iso-pretooluse.mjs` L15 bloqueia qualquer entrada com `.env.`, incluindo Read de `.env.example` e edição de README com `cp .env.example .env`. A nota `guard-env-bloqueia-docker-compose-rebuild-ctp-atp.md` (L117 do relatório de estado) indica atrito real.
6. **`validate-settings-schema.mjs`** depende de rede a cada edição de settings (L125). Está desligado no `CI/`, mas ligado no Frete.
7. **Três "parsers de shell" diferentes no canonico.** `commit-guard.mjs` L10-21, `rules-guard.mjs` L52-67 e `vault-guard.mjs` L18-35 tratam aspas de jeitos diferentes: um troca por `""`, os outros trocam espaço por `_`. Três lugares para errar e testar.

### Duplicado

1. **Três `hook-io.mjs` com APIs diferentes:** `C/.claude/hooks/hook-io.mjs` (`readHookEvent`/`emitContext`), `CI/.claude/hooks/hook-io.mjs` e `CI/.central-iso/hooks/hook-io.mjs` (`parseHookEvent`), e `KC/hooks/hook-io.mjs` (`run`/`block`).
2. **vault-guard em duas versões divergentes na Central.** A da raiz (ligada) varre todos os valores de texto e não pega comando com aspas. A do `CI/` (desligada) usa `includes` no comando e é mais forte, mas não está registrada.
3. **Segredo em três lugares com regex diferentes:**
   - `C/.claude/hooks/secret-scan.mjs` L10-17;
   - `CI/.claude/hooks/secret-scan.mjs` L31-38;
   - regex do pretool L15 (`sk-[A-Za-z0-9_-]` contra `sk-[A-Za-z0-9]`; variações de `BEGIN … KEY`).
4. **Pretool em três cópias:** raiz (só regex, desligado), `CI/.central-iso/hooks` (ligado) e `Mod. CTP-ATP/.claude/hooks/central-iso-pretooluse.mjs` (morto, lê `.claude/state`, L72).
5. **Dois hooks no Stop da Central:** `central-iso-stop.mjs` (lembrete inútil) e `verify-on-stop.mjs` (gate real).
6. **Teto de 350 linhas em dois lugares:** `large-file-warning.mjs` L27 e o gate ESLint em `CI/.central-iso/gates/eslint-quality/`.
7. **Heurística de intake duplicada de propósito** entre o hook e `CH/scripts/intake-prompt.mjs` (comentário do hook L5-9). Risco de deriva.
8. **Schema da aprovação duplicado** entre o hook (L85-97) e `CH/scripts/approval-manifest-lib.mjs` L28-44. Documentado como deliberado no doc 13.
9. **canonico: `commit-guard` + `deny Bash(git push *)`.** É duplicação **intencional** (defesa em camadas) e deve continuar.

### Quebrado ou morto

1. **20 hooks não registrados em `CI/.claude/hooks/`** (lista no inventário A). Entre eles, guards críticos: `vault-guard`, `secret-scan`, `guard-main-branch`, `subagent-model-guard`, `worktree-write-guard`. Some-se o intake.
2. **4 hooks não registrados na raiz:** `C/.claude/hooks/central-iso-{pretooluse,posttooluse,stop,subagentstop}.mjs`.
3. **`central-iso-subagentstop.mjs`** não lê o evento e emite um campo fora do contrato (`reminder`). **[H3]** É no-op. O teste (`test-hook-contracts.mjs` L98-103) **consagra** o no-op.
4. **`central-iso-stop.mjs` e `central-iso-posttooluse.mjs`** só escrevem em stderr com exit 0. **[H2]** Provavelmente o modelo nunca vê.
5. **`set-files-changed.mjs`** diz alimentar o `verify-on-stop` (L3-5), que não lê esse arquivo (usa git, L76-78). `memory-stop` e `large-file-warning` dependem dele, e os três estão desligados.
6. **O teste do vault-guard roda no gate do Stop** (`CI/scripts/verify.mjs` L46-53) para um hook que não está ligado no `CI/`. Dá falsa sensação de proteção.
7. **Docs desatualizados.** `CH/docs/12_…` L9 e L33 e `CH/docs/13_…` L121-124 citam `.claude/state/harness-approval.json` e `templates/repo-consumer/.claude/hooks/central-iso-pretooluse.mjs`. O código usa `.central-iso/state/` e `.central-iso/hooks/` (pretool L72).
8. **Deriva entre template e consumidores.**
   - O template liga o intake; `CI/` e Agend não ligam.
   - O Frete não tem gate de aprovação.
   - `verify-harness.mjs` (L20-69) não confere registro de hooks nem o conteúdo do settings, só a existência de pastas e instruções.
9. **`sync-harness.mjs --apply`** está bloqueado de propósito (L27-31). A sincronização é manual, o que explica a deriva.
10. **`guard-main-branch.mjs`** contradiz a regra `git-solo-main.md`. Se fosse ligado, bloquearia o fluxo oficial.
11. **canonico:** `gates:selftest` (`selftest.mjs` na raiz do projeto) e os scripts de gate em `package.json` **não estão** em `PROTEGIDOS` (`rules-guard.mjs` L15-27). Um agente com demanda aprovada pode trocar `"lint"` por `"echo ok"`, e o pre-commit (`K/.githooks/pre-commit` L21) passa.
12. **canonico:** o `.gitignore` do kit (`K/.gitignore`) não inclui `.env`, e o instalador (`K/instalar-no-projeto.sh` L58-68) só acrescenta essas linhas.

---

## Brechas comuns aos dois

1. **Bash é bypass universal.**
   - canonico: o `plano-guard` e o `escopo-guard` não olham Bash; o `rules-guard` só pega verbos conhecidos (L31).
   - Central: a regex de "somente leitura" só olha o começo (L64).
   - Nos dois, `node -e`, `python -c`, `sh -c "…"` e `eval` escrevem qualquer arquivo.
2. **A aprovação pode ser forjada pelo próprio agente** (seção anterior). Nenhum dos dois usa algo que só o humano produz.
3. **A aprovação não limita escopo nem expira.** Uma aprovação abre o repositório inteiro, sem amarrar a `Files:`, à sessão ou a prazo.
4. **Hooks de trava falham abertos.** canonico por desenho (`hook-io.mjs` L39-61); Central por crash não tratado (pretool L105, [H1]). Uma entrada que provoca exceção desliga a trava.
5. **Sessão aninhada e outras CLIs.** Nada bloqueia `claude -p` (com `HARNESS_BYPASS=1` no canonico, ou `CLAUDE_INVOKED_BY=1` na Central, que desliga vault-guard, intake e orient), `codex exec` ou `opencode run` pelo Bash. Os hooks só existem no Claude Code.
6. **Sessão fora da raiz certa.** Na Central, a raiz controladora não tem gate [H4]. No canonico, terminal do Maestri com role (documentado em `K/.agents/adaptadores.md` L118-123) e worktree em `.claude/worktrees` [H8].
7. **A definição dos gates fica em arquivo desprotegido** (`package.json` scripts, `tsconfig`, `CI/scripts/verify.mjs`). Na Central, nada é protegido.
8. **Segredo.** Nenhum tem deny de **escrita** em `.env*`. Nenhum tem varredura de segredo no commit (gitleaks). `Read` negado não cobre `cat` pelo Bash [H9]; a Central compensa em parte com a regex, o canonico não.
9. **Relatório de subagente não é exigido por trava** (Central no-op, canonico ausente).
10. **"A sessão principal orquestra e não implementa"** é só texto nos dois (`K/AGENTS.md` regra 4; `CI/.central-iso/instructions/AGENTS.md` L11). O `escopo-guard` ignora a sessão principal (`escopo-guard.mjs` L18-19).
11. **Hooks de plugin e globais não são auditados.** Nenhum dos dois confere `~/.claude/settings.json` (por exemplo `disableAllHooks`, hooks de terceiros) nem os hooks que os plugins ligados registram [H7]. A Central liga hookify, aia-harness, pr-review-toolkit e code-review (`CI/.claude/settings.json` L30-48).
12. **Teste de registro incompleto.** canonico: só os 6 esperados, e um hook novo não registrado passa. Central: só o timeout do `verify-on-stop`.
13. **Commit na main** não é bloqueado no canonico (nenhum hook olha a branch) e é permitido pela regra da Central.
14. **Caminho por symlink.** Exemplo: `ln -s .claude c`. O `rules-guard` não bloqueia porque `.claude` sem barra não casa (L24). Depois, `Edit c/hooks/commit-guard.mjs` vira o alvo `c/hooks/…` e passa. A Central não protege nada, então nem precisa disso.

---

## Recomendações concretas para o harness novo

Ordem: **primeiro fechar o que permite burlar a aprovação**, depois as travas de commit e regra, por último custo e conforto.

1. **Aprovação de origem humana, por demanda, com hash.**
   - **Por quê:** fecha a forja nos dois harness e junta a integridade da Central com a legibilidade do canonico.
   - **Como:**
     - Um hook `UserPromptSubmit` reconhece a frase exata digitada pelo humano (`Aprovo a SPEC <slug>.` / `Aprovo o plano <slug>.`).
     - Na hora, ele grava `docs/fluxo/<slug>/aprovacoes.json` com: sha256 da SPEC e do plano, `session_id`, data, sha256 do prompt e uma assinatura HMAC com chave fora do repositório (`~/.config/harness/chave`, com deny de Read).
     - O arquivo é versionado no git, para ficar o rastro.
     - O `plano-guard` passa a exigir a assinatura válida e o hash igual; a tabela do `estado.md` vira só espelho.
   - **Risco residual [H12]:** `maestri ask` pode injetar o texto como prompt. O commit-guard (ou um guarda de Bash) deve bloquear `maestri ask` cujo texto contenha "Aprovo".
   - **Como testar (selftest):**
     - linha forjada no `estado.md` sem `aprovacoes.json` → bloqueia (2);
     - HMAC errado → 2;
     - SPEC editada depois da aprovação → 2;
     - evento `UserPromptSubmit` com a frase → cria o registro;
     - `maestri ask … "Aprovo a SPEC x."` → 2.
2. **Escopo por `Files:` do plano aprovado.**
   - **Por quê:** fecha "basta uma demanda" (canonico) e "aprovação abre o repositório inteiro" (Central).
   - **Como:** o `plano-guard` lê os planos das demandas aprovadas e não concluídas e libera só caminhos que aparecem em algum `Files:`.
   - **Teste:** editar um arquivo fora de qualquer `Files:` → 2; dentro → 0; arquivo de outra demanda não aprovada → 2.
3. **Fechar o Bash.**
   - **Por quê:** é a brecha comum número 1.
   - **Como, em duas camadas:**
     - (a) **[H10, confirmar na documentação]** ligar o sandbox de Bash do Claude Code com deny de `Edit` para os caminhos protegidos (regras, `aprovacoes.json`, `.git/hooks`, `vault/`) e sem comandos fora do sandbox. Se funcionar como suponho, a proteção passa a ser do sistema operacional, não de regex.
     - (b) Um guarda de Bash que bloqueia, ou pede `ask`, para: interpretador com código inline (`node -e`, `python -c`, `perl -e`, `sh -c`, `bash -c`, `eval`), CLI de agente aninhada (`claude`, `codex`, `opencode`, `gemini`, `agy`) e qualquer comando com `HARNESS_BYPASS` ou `CLAUDE_INVOKED_BY`.
     - O `plano-guard` passa a inspecionar redirecionamentos e verbos de escrita no Bash, reusando o parser único (Rec. 19).
   - **Teste:**
     - selftest: `node -e "require('fs').writeFileSync('src/a.ts','x')"` → 2; `HARNESS_BYPASS=1 claude -p x` → 2; `echo x > src/a.ts` sem aprovação → 2.
     - Para o sandbox: roteiro manual numa sessão real (`echo x >> eslint.config.mjs` deve falhar com erro de permissão).
4. **Travas falham fechadas.**
   - **Por quê:** hoje, crash significa ação liberada.
   - **Como:** no `hook-io.mjs`, `run()` recebe um modo. Guardas (vault, rules, plano, escopo, commit) saem com 2 e uma mensagem clara quando há exceção numa ferramenta mutante. Hooks de contexto continuam fail-open.
   - **Teste:** `docs/fluxo/x/estado.md` como diretório → 2 (hoje dá 0); SPEC aprovada apagada → 2; stdin `{quebrado` num Write → 2.
5. **Normalizar caminho de verdade.**
   - **Por quê:** fecha worktree, symlink e alias no macOS.
   - **Como:** resolver `realpath` do ancestral que existe; comparar sem diferenciar maiúscula no darwin; tirar o prefixo `.claude/worktrees/<n>/` antes de aplicar as regras; tratar como "fora do projeto" só o que, depois do realpath, estiver fora.
   - **Teste:** `ln -s .claude c` + `Edit c/hooks/x.mjs` → 2; `Write .claude/worktrees/w/eslint.config.mjs` → 2; `Write .claude/worktrees/w/src/a.ts` sem aprovação → 2.
6. **Proteger quem define os gates.**
   - **Por quê:** trocar `"lint"` por `"echo ok"` anula o pre-commit.
   - **Como:**
     - Incluir em `PROTEGIDOS`: `selftest.mjs`, `tsconfig*.json`, `vitest|jest.config.*`, `.agents/stack.md`, `.agents/templates/gates-web/`, `docs/fluxo/*/aprovacoes.json`.
     - Para `package.json`, que muda muito por causa de dependências: um `.harness/gates.lock` protegido, com o sha256 dos scripts `lint`, `typecheck`, `lint:types` e `test`. O pre-commit e o selftest falham se os scripts divergirem.
   - **Teste:** mudar o script `lint` → pre-commit sai com 1; Edit em `tsconfig.json` → 2.
7. **commit-guard sem atalhos.**
   - **Por quê:** hoje `git config alias.p push && git p`, `git -c alias.p=push p`, `sh -c "git push"` e `gh api -X PUT …/merge` passam.
   - **Como:**
     - bloquear `git config alias.*` e `-c alias.*`;
     - bloquear git dentro de `sh -c`, `bash -c` e `eval`;
     - para a sessão principal, trocar a lista de proibidos por uma **lista de permitidos** de subcomandos (`status`, `diff`, `log`, `show`, `add <arquivos>`, `commit -m`, `rev-parse`, `switch -c demanda/*`);
     - bloquear `gh api` com merge e `gh pr create`;
     - bloquear `git push -f` e `+ref` também na camada de deny.
   - **Teste:** um caso no selftest para cada uma dessas strings → 2.
8. **Stop leve com recibo de gates (em vez do Stop pesado da Central).**
   - **Por quê:** o canonico não tem nada; o da Central custa minutos e libera no 2º Stop.
   - **Como:**
     - Um script `node .harness/gates.mjs` roda lint, typecheck e test sem RTK e grava um recibo com o fingerprint da árvore (sha256 dos arquivos alterados mais o HEAD) num caminho protegido.
     - O hook de Stop **não roda os gates**: só confere se existe recibo aprovado para o fingerprint atual quando há código alterado.
     - No 2º bloqueio, libera o encerramento, mas grava "PENDENTE: gates" no `estado.md` e emite `systemMessage` para o humano. Nada de passar em silêncio.
   - **Teste:** fixture com árvore suja sem recibo → `decision: block`; recibo com o fingerprint certo → 0; recibo antigo → block; 2º Stop → 0 com a marca no `estado.md`.
9. **SubagentStop que exige o relato.**
   - **Por quê:** "relatório obrigatório" hoje é texto ou no-op.
   - **Como:** por `agent_type`, conferir se existe o arquivo de relato (`handoff/wave-N-*.md` ou `revisao-wave-N-<persona>.md`) com os títulos obrigatórios (status, arquivos tocados, saída dos gates, Consultas feitas). Se faltar, `decision: block` com a lista. **[HIPÓTESE]** Confirmar quais campos o evento SubagentStop traz (`agent_type`, transcript).
   - **Teste:** evento SubagentStop de `backend-specialist` sem relato → block; com relato completo → 0.
10. **Modelo e ferramentas por subagente.**
    - **Por quê:** o canonico herda o modelo caro e todas as ferramentas.
    - **Como:**
      - `model:` no frontmatter de cada adaptador em `KC/agents/`, trazendo a disciplina da Central.
      - Guarda `PreToolUse` com matcher `Agent|Task`: só `subagent_type` da lista de personas (sem `general-purpose` para implementação) e `model` explícito ou presente no frontmatter.
      - Revisores com `tools:` restrito; a escrita do relato continua controlada pelo `escopo-guard`.
    - **Teste:** evento Agent com `general-purpose` → 2; persona sem modelo → 2; selftest confere `model:` em todos os adaptadores.
11. **Segredo de ponta a ponta.**
    - **Por quê:** o canonico está mais fraco que a Central aqui.
    - **Como:**
      - deny de `Read`, `Edit` e `Write` para `./**/.env*` (com exceção explícita de `.env.example`);
      - portar o `secret-scan` como PreToolUse em Write/Edit/Bash, com a regex unificada;
      - `.env*` no `.gitignore` do kit;
      - commit-guard bloqueia `git add` de `.env*`;
      - pre-commit roda `gitleaks protect --staged` e **falha se o gitleaks não estiver instalado**.
    - **Teste:** Write com `AKIA…` → 2; `git add backend/.env` → 2; Read de `backend/.env` negado; pre-commit com segredo no stage → 1.
12. **Teste de registro total.**
    - **Por quê:** "hook escrito não é hook ativo" (20 mortos na Central).
    - **Como:** o selftest lista todo `*.mjs` em `hooks/` (menos uma lista explícita de auxiliares) e falha se algum não estiver no settings, ou se o settings apontar para arquivo inexistente. Avisa se `~/.claude/settings.json` tiver `disableAllHooks` ou hooks de terceiros.
    - **Teste:** criar `hooks/dummy.mjs` → selftest sai com 1.
13. **Commit só em `demanda/*`.**
    - **Por quê:** a regra existe (`K/.agents/rules/commit.md` L13-15), a trava não.
    - **Teste:** fixture git na main + `git commit -m x` → 2; em `demanda/x` → 0.
14. **Intake mínimo.**
    - **Por quê:** o classificador da Central custa e erra.
    - **Como:** o `UserPromptSubmit` só (a) injeta uma linha com a demanda ativa e a etapa, e (b) captura a frase de aprovação da Rec. 1. Nunca bloqueia o humano por palavra.
    - **Teste:** prompt com "token" → 0 e sem `decision`; prompt "Aprovo a SPEC x." → registro criado.
15. **Raiz certa.**
    - **Por quê:** sessão aberta fora da raiz desliga tudo [H4].
    - **Como:**
      - `SessionStart` confere se `CLAUDE_PROJECT_DIR` contém `AGENTS.md` e o settings do harness; se não, emite `systemMessage` de alerta.
      - Na raiz controladora da Central, registrar um PreToolUse que nega Write/Edit/Bash mutante dentro de repositórios filhos (exigência do doc 03 L26).
    - **Teste:** na raiz, `Write "Central ISO/src/x.js"` → deny.
16. **RTK conferido pelo doctor.**
    - **Por quê:** a exclusão dos gates está só no `config.toml` global.
    - **Como:** o selftest roda `rtk rewrite "npm run lint"` e exige saída 1 (não reescrito) quando o RTK está instalado.
    - **Teste:** remover a exclusão → selftest falha.
17. **Plugins com hooks desligados no projeto.**
    - **Por quê:** hooks invisíveis [H7]; o próprio canonico quer desligar 10 plugins (`K/modo-facil/01-…` L122).
    - **Como:** `enabledPlugins` com `false` explícito para esses plugins no `KC/settings.json`, e o selftest confere.
    - **Teste:** selftest falha se algum estiver `true`.
18. **Deny determinístico como segunda camada.**
    - **Por quê:** o deny não depende do parser do hook.
    - **Como:** além de `git push`, negar `Bash(git merge *)`, `Bash(* --no-verify*)`, `Bash(gh pr merge *)` e `Edit`/`Write` dos caminhos de regra. **[HIPÓTESE]** Confirmar a semântica do curinga no Claude Code. Não usar `defaultMode: auto` nem `allow` amplo como `Bash(node *)` ou `Bash(npm install:*)`, que a Central usa.
    - **Teste:** o selftest confere a presença de cada regra; roteiro manual numa sessão real.
19. **Um parser de shell só, com teste próprio.**
    - **Por quê:** três parsers divergentes hoje (ver "Oneroso" item 7).
    - **Como:** `hook-io.mjs` exporta `segmentos()` e `alvosDeEscrita()`, usados por commit, rules, vault e plano.
    - **Teste:** bateria única com aspas, heredoc, `&`, `$(...)` e redirecionamento sem espaço.
20. **O que NÃO trazer da Central:**
    - `verify-on-stop` como está (pesado, libera no 2º Stop);
    - `graphify-orient` por chamada de ferramenta;
    - `vault-orient` e `workspace-context` por prompt;
    - o intake por palavra-chave;
    - os 20 hooks aia-harness desligados;
    - `central-iso-stop`/`subagentstop`/`posttooluse` (no-ops);
    - `.worktreeinclude` copiando `.env`.
    - **Avaliar antes** as sub-sessões `session-log`/`compile`: medir o custo em tokens contra o ganho de memória.
    - **Como testar o corte:** depois de aplicar, o teste de registro total (Rec. 12) deve passar sem lista de exceções para esses arquivos.
