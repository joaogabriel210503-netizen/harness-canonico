# Registro de correções do harness canônico (N01–N37)

Data: 14/10/2026. Origem: seção "O que o nosso tem de ruim" da auditoria `2026-10-14-auditoria-profunda-central-x-canonico.md`.

Status: **Corrigido** (mudança feita e provada por teste), **Parcial** (o que foi feito e o que sobra), **Adiado** (depende de decisão DP ou de onda planejada). Provas: `hooks/selftest.mjs` e `selftest-git.mjs` (300 casos OK no Mac) e `templates/gates-web/selftest.mjs`.

Siglas: `[KC]` = `kit-claude-code/dot-claude/`, `[GW]` = `.agents/templates/gates-web/`.

## Garantia pedida: teto de 350 e lint sem brecha

Brechas fechadas (17 contornos antes, 0 agora, cada um é caso do `[GW]/selftest.mjs`): `max-lines` nativo do ESLint em todo arquivo de código (`js jsx ts tsx mjs cjs mts cts`) em vez da regra própria com isenção por nome; `noInlineConfig: true` (comentário `eslint-disable` e `/* eslint x: off */` não valem); `reportUnusedDisableDirectives: "error"`; `max-len` 160; `gates.lock.json` com sha256 do lint, tsconfig, selftest, `eslint-rules/` e dos scripts do `package.json` de cada pasta (trocar `"lint"` por `"echo ok"` reprova); `rules-guard` bloqueia por Edit e por Bash a escrita nesses arquivos, em qualquer profundidade; `travar-gates` só o humano roda.

Quem acompanha: `gates:selftest` (prova que o gate reprova o que deve; roda no pre-push), `verificar-gates` (no pre-commit), `doctor.mjs` (confere o lock e os hooks) e o selftest dos hooks.

## Registro

| ID | Problema | Correção | Onde | Status |
|---|---|---|---|---|
| N01 | Travas falhavam abertas; exceção liberava tudo | `run()` falha fechada por padrão (modo `guarda`); `onFailure:"block"` e `timeout:20` em todo guarda; `session-start` continua aberto (só informa) | `[KC]/hooks/hook-io.mjs`, `settings.json` | **Corrigido** |
| N02 | Aprovação em `estado.md` forjável pelo agente | Nada além de proteger `docs/fluxo/*/aprovacoes.json` no `rules-guard`. Aprovação assinada pelo `UserPromptSubmit` desenhada, não feita | `rules-guard`/`guard-lib` | **Adiado** (B01, DP-03) |
| N03 | Uma demanda aprovada libera qualquer código | Sem mudança | `plano-guard` | **Corrigido** (W2, 20/10/2026: escopo por `Files:` e hash na aprovação) |
| N04 | SPEC muda depois de aprovada (sem hash) | Sem mudança | — | **Adiado** (B01, DP-03) |
| N05 | `plano-guard` não olha Bash | Sem mudança no `plano-guard`. O `rules-guard` agora lê Bash (`sh -c`, `eval`, `$()`, heredoc, interpretador inline) para arquivos de regra. Fechar de verdade exige sandbox | `rules-guard` | **Adiado** (B04, DP-12) |
| N06 | `.claude/worktrees/<n>/` escapava do `plano-guard` e do `rules-guard` | O prefixo do worktree é removido antes de casar caminhos | `hook-io.mjs` (`caminhoRelativo`) | **Corrigido** |
| N07 | Maiúscula no macOS, `/private/tmp`, symlink escapavam | `realDe` (realpath do ancestral existente), comparação sem caixa, `emCasaProtegida` com `realpath(home)` | `hook-io.mjs` | **Corrigido** (o caso de caminho totalmente inexistente segue limitado pela heurística) |
| N08 | Atalhos no `commit-guard` | Alias (`-c alias.`, `git config alias.`), `sh -c`/`eval` recursivo, `gh pr merge/create`, `gh api` mutante, `gh repo delete`, `update-ref`, `filter-branch`, `HUSKY`/`SKIP` | `commit-guard.mjs` | **Corrigido** |
| N09 | Commit na `main` passava | Bloqueio no hook (via `git symbolic-ref`) e no pre-commit; humano usa `HARNESS_COMMIT_MAIN=1` | `commit-guard`, `.githooks/pre-commit` | **Corrigido** (só `main`/`master`; exigir `demanda/*` não foi imposto) |
| N10 | Sessão aninhada e `env.HARNESS_BYPASS` desligavam tudo | Bloqueia CLI aninhada (claude, codex, opencode, gemini, agy…), atribuição `HARNESS_*`, escrita em `~/.claude*`, `.codex`, `.config/opencode`, `.gemini`, rc de shell, `.ssh`; `doctor` acusa `disableAllHooks`, `hooks` e `HARNESS_*` em settings de usuário e local; `liberar-regras` é protegido | `rules-guard`, `guard-lib`, `doctor` | **Parcial** (o Bash segue heurístico; resíduo fecha com DP-12) |
| N11 | Pre-commit passava sem `package.json` na raiz; só rodava `lint` | Pre-commit por pasta (profundidade ≤ 3), falha fechada sem `node`; pre-push roda `gates:selftest`, `typecheck`, `test`, `lint:types`; script ausente reprova | `.githooks/` | **Corrigido** |
| N12 | Desligar regra por comentário inline passava | `noInlineConfig`, `reportUnusedDisableDirectives`, `rules-guard` barra os atalhos no texto escrito | `[GW]/eslint.config.mjs`, `rules-guard` | **Corrigido** |
| N13 | Isenção por nome (`constants.js`…) e brecha só em TS | Isenção por nome removida; teto vale em todo arquivo de código; selftest cobre `js`, `mjs`, `cjs`, `mts`, `cts` | `[GW]` | **Corrigido** |
| N14 | Gate esvaziável pelo `package.json`/tsconfig/selftest | `gates.lock.json` + `verificar-gates` + proteção por hook | `.githooks/*gates*`, `guard-lib` | **Corrigido** |
| N15 | Segredo: `.env` fora do `.gitignore`, deny só da raiz, sem varredura | `.gitignore` completo; deny de `.env*` em qualquer pasta (`.env.example` livre); `secret-scan.mjs` embutido no pre-commit e no `segredo-guard`; gitleaks usado se existir | `.gitignore`, `settings.json`, `segredo-guard` | **Corrigido** |
| N16 | Subagentes sem `tools`/`model`/`skills` | `model: inherit` + `disallowedTools` nos 8 adaptadores (ninguém despacha; revisores não editam; ninguém escreve no cofre). `skills:` por agente fica para o Gabriel | `[KC]/agents/*.md` | **Parcial** (`skills`) |
| N17 | Despacho de subagente sem trava; sessão principal ignorada | `despacho-guard` (tipo existente, sem `general-purpose`, `model` presente); `escopo-guard` limita sessão principal e orquestrador a `docs/`, memória e `.md` da raiz; `Agent(general-purpose)` no deny | `despacho-guard`, `escopo-guard` | **Corrigido** |
| N18 | Sem Stop/SubagentStop/UserPromptSubmit/PostToolUse | Sem mudança (onFailure não vale nesses eventos) | — | **Corrigido em parte** (W4, 20/10/2026): `SubagentStop` (`relato-guard`) e `Stop` (`recibo-guard`) provados no Claude Code real; `UserPromptSubmit` e `PostToolUse` não adotados (DP-03b) |
| N19 | Cinco mapas de papéis divergentes | Sem mudança | docs | **Adiado** (W5, depende de DP-04…DP-07) |
| N20 | Templates errados ou ausentes | Sem mudança | `templates/` | **Adiado** (W5) |
| N21 | Status em 3 valores × contrato com 4 | Quatro valores (`CONCLUIDA`, `CONCLUIDA_COM_RESSALVA`, `PRECISA_CONTEXTO`, `BLOQUEADA`) em `handoff.md` e nas 3 personas | `templates/handoff.md`, `personas/*` | **Corrigido** (revisar `ondas.md:57` na W5) |
| N22 | `debugger` sem gatilho; demanda pequena exige Codex na E0 | Sem mudança | — | **Adiado** (W5) |
| N23 | Sem classificação do pedido | Sem mudança | — | **Adiado** (W5) |
| N24 | Sem portões para dependência, apagar dado, mudar `Files:` | Sem mudança | — | **Adiado** (W5) |
| N25 | "Teste primeiro" para todo implementador | Sem mudança | — | **Adiado** (DP-05) |
| N26 | Outras CLIs sem cofre | Sem mudança | — | **Adiado** (B20, DP-02) |
| N27 | Memória sem trava para subagente | `escopo-guard` bloqueia subagente em `.agents/memory/`; `disallowedTools` bloqueia escrita MCP no cofre; `.gitignore` decidido | `escopo-guard`, adaptadores | **Parcial** (`vault/daily/` sem dono; `vault-guard` ainda tem parser próprio) |
| N28 | Distribuição sem versão, verificar ou atualizar | Sem mudança no instalador | `instalar-no-projeto.sh` | **Adiado** (manifesto com versão e `verificar`) |
| N29 | Selftest com lista fixa de hooks | Todo `.mjs` da pasta de hooks precisa estar registrado em `settings.json`; confere `onFailure` e campos dos adaptadores | `hooks/selftest.mjs` | **Corrigido** |
| N30 | Sem doctor de máquina nova | `doctor.mjs` (estrutura, `onFailure`, versão do Claude Code ≥ 2.1.295, settings local e do usuário, git hooks instalados e idênticos, `core.hooksPath`, `gates.lock`, aprovação do MCP, `.gitignore`); chamado pelo `session-start` e no passo M6 | `hooks/doctor.mjs` | **Corrigido** |
| N31 | Proveniência do `quality/*` sem sha256 | Tabela de sha256 em `origem.md`; linha de `max-lines` nativo e de hooks fechados | `.agents/origem.md` | **Corrigido** |
| N32 | Biome: gate ou formatador? | Sem mudança | `stack.md` | **Corrigido** (DP-09; W3, 19/10/2026) |
| N33 | Três parsers de shell | Parser compartilhado em `guard-lib.mjs` usado por `rules-guard` e `commit-guard` | `guard-lib.mjs` | **Parcial** (`vault-guard` fora) |
| N34 | `lint:types` só na E8 | Sem mudança | `rules/gates.md` | **Adiado** (processo P3) |
| N35 | Regras sem `trigger:` (Antigravity descarta) | `trigger: always_on` e `description` nas 6 regras | `.agents/rules/*.md` | **Corrigido** (confirmar no Antigravity) |
| N36 | Hooks de plugin/usuário não auditados | `doctor` lê `settings.json` do usuário e `settings.local.json`; acusa plugins habilitados e hook sem `onFailure` só para guardas do harness | `doctor.mjs` | **Parcial** (`enabledPlugins` e `autoMemoryEnabled` não fixados) |
| N37 | Kit sem git; `.auditoria-tmp/` | `.auditoria-tmp/` no `.gitignore`; limpeza pendente de permissão para apagar; `git init` com remote é passo seu | `.gitignore` | **Parcial** |

## Totais

Corrigidos: 18 (N01, N03, N06, N07, N08, N09, N11, N12, N13, N14, N15, N17, N21, N29, N30, N31, N32, N35). Parciais: 7 (N10, N16, N18, N27, N33, N36, N37). Adiados: 12 (N02, N04, N05, N19, N20, N22, N23, N24, N25, N26, N28, N34), cada um com sua decisão ou onda. Total 37.

## O que mudou no documento e o que fazer

| Mudança apontada | Correção | Status |
|---|---|---|
| Hooks falham abertos | Falha fechada + `onFailure:"block"` | Corrigido |
| Aprovação forjável | Aprovação assinada pelo `UserPromptSubmit` | Adiado (DP-03) |
| Bash fura qualquer hook | Sandbox do Claude Code | Decisão sua (DP-12) |
| `settings.local.json` desliga travas | `rules-guard` e `doctor` | Corrigido |
| Outras CLIs sem travas | Hooks por CLI | Adiado (W8) |
| Antigravity descarta regras sem `trigger:` | Frontmatter | Corrigido |
| Workflows do Antigravity deixam de funcionar em 19/10/2026 | Converter com `/migrate-workflows` ou deixar caducar | Decisão sua (DP-13) |
| Frete: `guard-main-branch` em `allow` | Trocar para `deny` | Aguardando sua resposta (DP-01) |
