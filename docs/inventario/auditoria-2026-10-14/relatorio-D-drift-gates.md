> **Nota de 14/10/2026:** relatório de evidência da auditoria consolidada em `docs/inventario/2026-10-14-auditoria-profunda-central-x-canonico.md`. Os caminhos citam a cópia de auditoria: `…/scratchpad/auditoria/central/` = `~/Desktop/Projetos/` e `…/scratchpad/auditoria/canonico-kit/` = `~/development/harness-canonico/`. Linhas valem para os arquivos de 14/10.

# Relatório D: divergência entre os repositórios, custo e quality gates

- **Data:** 14/10/2026
- **Modo:** só leitura sobre as cópias locais. Nada foi instalado e nada foi acessado pela rede. Nenhum segredo foi lido (o `env` dos `settings.json` já vinha oculto na cópia, e o `.mcp.json` do Frete foi lido com cabeçalhos ocultos).
- **Método:** sha256 arquivo a arquivo contra o modelo `repo-consumer`. Os scripts usados estão em `/tmp/claude-0/-home-claude/d40a5fd9-9768-56ee-97e9-71e16c66241c/scratchpad/work/drift.py` (divergência) e `/tmp/claude-0/-home-claude/d40a5fd9-9768-56ee-97e9-71e16c66241c/scratchpad/work/reach.py` (quais hooks o `settings.json` alcança, seguindo os `import`).
- **Limite da cópia:** não há `.git`, `node_modules`, `package.json` de backend/frontend nem configuração de ESLint dos produtos. Então "o que está versionado" só dá para inferir pelo `.gitignore`. Onde isso importa, o texto marca **HIPÓTESE**.

**Atalhos de caminho usados no texto:**

| Atalho | Caminho real |
|---|---|
| `C:` | `/tmp/claude-0/-home-claude/d40a5fd9-9768-56ee-97e9-71e16c66241c/scratchpad/auditoria/central/` |
| `K:` | `/tmp/claude-0/-home-claude/d40a5fd9-9768-56ee-97e9-71e16c66241c/scratchpad/auditoria/canonico-kit/` |
| `T:` | `C:Central ISO Harness/templates/repo-consumer/` |
| `WR:` | `C:Central ISO Harness/auditoria/wave-reports/` |
| `CI:` / `AG:` / `CT:` / `FR:` | `C:Central ISO/`, `C:Módulos Central/Mod. Agend/`, `C:Módulos Central/Mod. CTP-ATP/`, `C:Módulos Central/Mod. Frete/` |

---

## Resumo em 10 linhas

1. O Agend e o Central ISO são cópias quase exatas do modelo. O CTP-ATP também é, com uma adaptação de domínio. O **Mod. Frete é outro harness** (geração aia-harness): 19 dos 21 agentes faltam, não há `.central-iso/hooks`, `gates` nem `instructions`, e o `settings.json` é outro. Além disso, as ferramentas de divergência nem enxergam o Frete.
2. **O teto de 350 linhas não é aplicado no código de nenhum consumidor da Central.** O "gate eslint-quality" só roda o autoteste da própria regra (RuleTester), nunca o lint dos arquivos do projeto. O Biome não tem teto de linhas e não entra no gate.
3. A Central e o canônico usam **a mesma regra `quality/max-lines`, byte a byte** (vibe-coding-toolkit, commit `13add21`). A Central **não fecha** a brecha da issue 7 e até a testa como comportamento esperado. O canônico fecha, mas **só para `.ts/.tsx/.mts/.cts`**: `constants.js`, `types.js` e `dto.mjs` continuam isentos.
4. Os dois deixam desligar a regra com comentário inline (`/* eslint quality/max-lines: "off" */`). Falta `linterOptions.noInlineConfig`.
5. O `verify-on-stop` da Central **não roda o gate se a árvore estiver limpa**. Basta commitar antes de encerrar o turno para pular os testes.
6. O pre-commit do canônico **passa direto (exit 0) quando não há `package.json` na raiz**, que é exatamente o layout backend/ + frontend/ dos repositórios da Central.
7. De 33 hooks em `.claude/hooks/`, **21 não estão ligados** em nenhum consumidor da Central. Entre eles estão `secret-scan`, `vault-guard`, `large-file-warning` e `guard-main-branch`. A regra `obsidian.md` afirma que o `vault-guard` bloqueia, mas ele não está ligado.
8. O modelo carrega **regras de domínio misturadas**. O hub Central ISO recebe `module-central-iso.md`, que diz "Agendamento é satélite… não acesse o banco da Central", e os módulos recebem a regra do hub.
9. Custo: cerca de 1,36 GB de `node_modules` repetido (341 MB × 4, só para o SDK do pipeline de memória por LLM) e 1,4 GB de worktrees velhos sem `.gitignore`. Também há subsessões Sonnet escondidas no SessionStart e no SessionEnd, e orientação do Graphify injetada a cada Read ou Grep.
10. Achado grave no Frete: o `guard-main-branch.mjs` diz "blocked", mas devolve `permissionDecision: "allow"` para commit e push na `main`.

---

## Drift por consumidor

Legenda: **igual** = mesmo sha256 do modelo. **dif.** = existe nos dois com conteúdo diferente. **falta** = está no modelo e não no consumidor. **sobra** = está no consumidor e não no modelo.

O modelo `T:` tem 116 arquivos. O `C:Central ISO Harness/templates/template-inventory.json` declara 105 e está desatualizado: lista 4 arquivos que não existem (`.claude/hooks/central-iso-pretooluse.mjs`, `AGENTS.md`, `CLAUDE.md` e `DOMAIN_VARIATION.md` na raiz) e omite 15 que existem (`.central-iso/**`, `.claude/CLAUDE.md`). FATO.

### Central ISO (`CI:`)

| Pasta / arquivo | Modelo | Consumidor | Igual | Dif. | Falta | Sobra | Leitura |
|---|---|---|---|---|---|---|---|
| `.claude/agents` | 21 | 21 | 21 | 0 | 0 | 0 | Sincronizado |
| `.claude/hooks` (com `tests/`) | 41 | 42 | 41 | 0 | 0 | 1 | A sobra é `log/pending/03881716-….json`: estado de execução, ignorado pelo git. Lixo local |
| `.claude/rules` | 20 | 20 | 20 | 0 | 0 | 0 | "Igual", mas **errado para o hub**: inclui `module-central-iso.md`, que é do Agendamento. **Acidental** (ver seção de riscos) |
| `.claude/commands` | 12 | 12 | 12 | 0 | 0 | 0 | Sincronizado |
| `.claude/skills` | 0 | 52 arq. (26 skills) | — | — | — | 52 | O modelo não gerencia skills, então elas divergem livremente. **Acidental** (falta de governança) |
| `.claude/scripts` | 5 | 5 | 5 | 0 | 0 | 0 | Sincronizado (o `node_modules` de 341 MB não está na cópia) |
| `.central-iso/hooks` | 3 | 3 | 3 | 0 | 0 | 0 | Sincronizado |
| `.central-iso/gates` | 6 | 6 | 6 | 0 | 0 | 0 | Sincronizado, mas não ligado a nenhum lint (ver gates) |
| `.central-iso/instructions` | 2 | 2 | 0 | 2 | 0 | 0 | **Intencional**: o domínio está preenchido (`CI:.central-iso/instructions/AGENTS.md`) |
| `.claude/settings.json` | 1 | 1 | — | sim | — | — | **Acidental**: falta registrar o `central-iso-userprompt-intake.mjs` no `UserPromptSubmit`. O `WR:ROLLOUT_ALL_EXCEPT_MOD_FRETE_RELATORIO.md` afirma que ele foi registrado, mas o arquivo atual não tem o registro |
| `.central-iso/harness.json` | 1 | 1 | — | sim | — | — | Intencional: só muda `consumer: "central"` |
| `.central-iso/project.json` | 1 | 1 | — | sim | — | — | Valores intencionais, esquema divergente (`id` + `projectId`, `role: "hub"`, sem `canonicalCommands`). **Parcialmente acidental** |
| `.central-iso/DOMAIN_VARIATION.md` | 1 | 0 | — | — | 1 | — | Acidental (pequeno) |
| `.claude/CLAUDE.md` | 1 | 1 | 1 | — | — | — | Sincronizado |
| Fora do modelo | — | `biome.json`, `scripts/verify.mjs`, `scripts/graphify-ecosystem-sync.mjs`, `scripts/install-plugins.mjs`, `.graphifyignore`, `.worktreeinclude`, `.claude/memory/`, `.claude/.aia-harness-pending/` | — | — | — | — | Não governados pelo modelo |

### Mod. Agend (`AG:`)

| Pasta / arquivo | Modelo | Consumidor | Igual | Dif. | Falta | Sobra | Leitura |
|---|---|---|---|---|---|---|---|
| `.claude/agents` | 21 | 21 | 21 | 0 | 0 | 0 | Sincronizado |
| `.claude/hooks` | 41 | 41 | 41 | 0 | 0 | 0 | Sincronizado |
| `.claude/rules` | 20 | 20 | 20 | 0 | 0 | 0 | Contém `central-iso.md`, a regra **do hub** ("A Central é dona de autenticação…"). **Acidental** |
| `.claude/commands` | 12 | 12 | 12 | 0 | 0 | 0 | Sincronizado |
| `.claude/skills` | 0 | 52 (26 skills) | — | — | — | 52 | Idênticas byte a byte às do Central ISO. Duplicado |
| `.claude/scripts` | 5 | 5 | 5 | 0 | 0 | 0 | Sincronizado |
| `.central-iso/hooks` / `gates` | 3 / 6 | 3 / 6 | 3 / 6 | 0 | 0 | 0 | Sincronizado |
| `.central-iso/instructions` | 2 | 2 | 0 | 2 | 0 | 0 | Intencional (domínio) |
| `.claude/settings.json` | — | — | — | sim | — | — | **Acidental**: mesma falta do intake do Central ISO |
| `harness.json` / `project.json` | — | — | — | sim | — | — | Intencional: `consumer: "agendamento"`, `role: "module"` |
| `DOMAIN_VARIATION.md` | 1 | 0 | — | — | 1 | — | Acidental (pequeno) |

### Mod. CTP-ATP (`CT:`)

| Pasta / arquivo | Modelo | Consumidor | Igual | Dif. | Falta | Sobra | Leitura |
|---|---|---|---|---|---|---|---|
| `.claude/agents` | 21 | 21 | 21 | 0 | 0 | 0 | Sincronizado |
| `.claude/hooks` | 41 | 43 | 41 | 0 | 0 | 2 | A sobra é `central-iso-pretooluse.mjs`, a **cópia legada** (sha diferente do canônico `.central-iso/hooks/`, ignorada **duas vezes** no `CT:.gitignore`), mais um `log/pending/*.json`. Arquivo morto |
| `.claude/rules` | 20 | 20 | 19 | 1 | 0 | 0 | `module-central-iso.md` adaptado ao CTP-ATP: **intencional**. A regra do hub `central-iso.md` continua presente: **acidental** |
| `.claude/commands` | 12 | 12 | 12 | 0 | 0 | 0 | Sincronizado |
| `.claude/skills` | 0 | 55 (29 skills) | — | — | — | 55 | Conjunto diferente do Central ISO e do Agend. 5 arquivos com o mesmo nome têm conteúdo diferente (`documentation-templates/SKILL.md` e 4 scripts `.py`). Acidental |
| `.claude/scripts` | 5 | 5 | 5 | 0 | 0 | 0 | Sincronizado |
| `.central-iso/hooks` / `gates` | 3 / 6 | 3 / 6 | 3 / 6 | 0 | 0 | 0 | Sincronizado |
| `.central-iso/instructions` | 2 | 2 | 0 | 2 | 0 | 0 | Intencional |
| `.claude/settings.json` | — | — | **igual** | — | — | — | Único consumidor com o intake ligado |
| `DOMAIN_VARIATION.md` | 1 | 1 | 1 | — | — | — | OK |
| `.graphifyignore` | — | ausente | — | — | — | — | Os outros dois têm. Acidental |
| `.central-iso/legacy-framework/` | — | 5 arq. | — | — | — | 5 | Cópia do `C:FrameWork Central ISO/` dentro do repositório. Duplicado |

### Mod. Frete (`FR:`)

O `WR:ROLLOUT_ALL_EXCEPT_MOD_FRETE_RELATORIO.md` registra que o Frete foi excluído do rollout **de propósito**. Mas o `C:Central ISO Harness/scripts/harness-lib.mjs:71` (`knownTargets`) nem lista o Frete. Ou seja, `diff`, `doctor` e `sync` nunca vão apontar essa divergência. FATO.

| Pasta / arquivo | Modelo | Consumidor | Igual | Dif. | Falta | Sobra | Leitura |
|---|---|---|---|---|---|---|---|
| `.claude/agents` | 21 | 2 | 0 | 2 | 19 | 0 | Outra geração (descrições "MUST BE USED…", `tools` diferentes) |
| `.claude/hooks` | 41 | 29 | 18 | 11 | 12 | 0 | Faltam `central-iso-posttooluse/stop/subagentstop`, `graphify-orient` e os 8 testes. Diferem `verify-on-stop` (lembrete que nunca bloqueia), `large-file-warning`, `compile`, `vault-*`, `guard-main-branch` (**"allow" no lugar de "deny"**, ver riscos) e outros |
| `.claude/rules` | 20 | 26 | 2 | 7 | 11 | 17 | Só `05-testing.md` e `06-security.md` são iguais. Sobram `01-ddd`…`04-code-quality`, `ecc/common/*` (10), `frontend-quality`, `lint-quality-gates` e `security-review-tools` |
| `.claude/commands` | 12 | **pasta ausente** | — | — | 12 | — | — |
| `.claude/skills` | 0 | 19 (11 skills) | — | — | — | 19 | `uncle-bob-craft/SKILL.md` difere da versão do CTP-ATP |
| `.claude/scripts` | 5 | 2 | 0 | 2 | 3 | 0 | Sem `package.json`: `compile-runner.mjs` e `session-log-runner.mjs` não carregariam, mas também não estão ligados. Mortos |
| `.central-iso/hooks` / `gates` / `instructions` | 3 / 6 / 2 | **ausentes** | — | — | todos | — | Sem harness `.central-iso` (só `project.json`) |
| `.claude/settings.json` | — | — | — | totalmente diferente | — | — | `defaultMode: default`, 19 hooks aia-harness, 4 plugins (em vez de 10), `outputStyle: Concise`. **Geração diferente** |
| `.central-iso/project.json` | — | — | — | sim | — | — | `graphifyId: "<gerado-pelo-bootstrap>"`: placeholder nunca preenchido |
| `biome.json`, `scripts/verify.mjs`, `.graphifyignore` | — | ausentes | — | — | — | — | Os gates são outros (ESLint core no backend, oxlint no frontend, segundo a memória do repositório) |

### Raiz controladora (`C:.claude/`, `C:AGENTS.md`, `C:CLAUDE.md`)

`diff -rq` contra `C:Central ISO Harness/templates/controller-root/` não mostra diferença. FATO. Mas as 5 regras e os 14 agentes da raiz são **cópias idênticas** dos do `repo-consumer`, e os hooks `hook-io`, `secret-scan`, `vault-guard` e `orchestration-mode` existem em **duas linhagens** diferentes (raiz usa `readHookEvent`, consumidor usa `parseHookEvent`). Isso é manutenção duplicada. Ficou um backup solto: `/Projetos/.claude/settings.json.central-iso-backup` (listado em `C:_PULADOS.txt`).

---

## Custo: mortos, duplicados, pesados, versionado por engano

### Mortos (existem e nada os executa)

| Item | Evidência | Tipo |
|---|---|---|
| **21 de 33 hooks** em `.claude/hooks/`: `check-deps-on-start`, `format-on-edit`, `gh-scope-guard`, `guard-main-branch`, `large-file-warning`, `memory-stop`, `orchestration-mode`, `rtk-hook`, `secret-scan`, `set-files-changed`, `sql-idempotent-review`, `subagent-model-guard`, `validate-settings-schema`, `vault-guard` e os 7 `worktree-*` | Nenhum aparece em `T:.claude/settings.json` nem é importado por um hook ligado (`reach.py`). Igual no CI, no AG e no CT. A comparação de 14/10 (`K:docs/inventario/2026-10-14-comparacao-central-iso.md`) contou 25, com outro critério | FATO |
| `.central-iso/hooks/central-iso-userprompt-intake.mjs` e `.central-iso/hooks/hook-io.mjs` no CI e no AG | Não registrados nesses dois `settings.json` | FATO |
| `CT:.claude/hooks/central-iso-pretooluse.mjs` | Cópia legada, diferente da canônica, ignorada pelo git | FATO |
| `central-iso-stop.mjs` e `central-iso-posttooluse.mjs` (3 a 10 linhas) | Só escrevem em stderr e saem com 0 (`T:.claude/hooks/central-iso-stop.mjs`, `T:.claude/hooks/central-iso-posttooluse.mjs`). Pela semântica documentada do Claude Code, stderr com exit 0 não chega ao modelo. Então custam um spawn e não fazem nada | Código = FATO. Efeito = **HIPÓTESE forte** |
| `central-iso-subagentstop.mjs` | Devolve `{"reminder": …}`, um campo que não está no contrato de saída dos hooks | Campo = FATO. "Ignorado" = HIPÓTESE |
| `.central-iso/gates/eslint-quality/` (CI, AG, CT) | Nenhum lint usa `eslint-rules/index.cjs`. No CT, o `npm run check` só roda o autoteste (`WR:ROLLOUT_mod_ctp_atp_check_final.txt`) | FATO |
| `.central-iso/harness.json` (política "commit exige aprovação humana", etc.) | Nenhum `.mjs`, `.js` ou `.cjs` da cópia lê esse arquivo (grep) | FATO: a política é decorativa |
| 6 dos 8 testes de hooks no CI e no AG | `CI:scripts/verify.mjs` e `AG:scripts/verify.mjs` só rodam `verify-on-stop.test` e `vault-guard.test`. Os testes de `graphify-orient`, `session-log`, `vault-orient`, `vault-note-merge` e `vault-pipeline-shared` (hooks **ligados**) nunca rodam no gate | FATO |
| Testes de hooks **desligados** dentro do gate | O CI, o AG e o CT testam `vault-guard`, e o CT também testa `gh-scope-guard`. Gasta tempo e passa a falsa impressão de que estão protegendo | FATO |
| `.claude/.aia-harness-pending/obsidian-memory-instructions/…/INSTRUCTIONS.md` (CI, AG) | Atualização pendente do plugin, nunca aplicada. sha `e65a…`, igual à do Frete, diferente da que está em uso (`3527…`) | FATO |
| `@biomejs/biome@2.5.14` na raiz do CT | `WR:WAVE_ESLINT_INSTALL_RELATORIO.md`: instalado na raiz, mas o `check` chama o Biome de backend e frontend (`^1.9.4`). O `CT:biome.json` usa o esquema 1.9.4 | FATO: dependência morta e versão conflitante |
| Hooks `compile`, `session-log`, `vault-*` e `gh-scope-guard` no Frete | Não registrados em `FR:.claude/settings.json` | FATO |
| `C:Central ISO Harness/templates/template-inventory.json` | Desatualizado (ver acima) | FATO |

### Duplicados (poderiam vir de uma fonte só)

| O quê | Cópias | Evidência |
|---|---|---|
| Plugin `quality/*` (`utils.cjs`, `core-rules.cjs`, `index.cjs`, `verify.mjs`) | 4 na Central (modelo + CI + AG + CT) + 1 no canônico (`K:.agents/templates/gates-web/eslint-rules/`), **todas com o mesmo sha256** | sha `348b7f…`, `9610051…`, `9b7daa…`, `225f0d…` |
| `hook-io.mjs` | 2 por repositório (`.claude/hooks/` e `.central-iso/hooks/`, idênticos) × 3, mais a variante da raiz | sha `7ee5210…` / `924013…` |
| Skills | CI e AG com 248.129 bytes idênticos. O CT tem outro conjunto (259.729 bytes) e o FR outro ainda (107.589). O modelo não tem nenhuma | `drift.py` |
| Regras repetidas dentro do mesmo repositório | `testing.md` (resumo) + `05-testing.md` (completo). `parallel-subagent-driven-development.md` + `08-parallel-subagent-driven-development.md` | `T:.claude/rules/` |
| Regras e agentes entre a raiz e o consumidor | 5 regras e 14 agentes com o mesmo sha | Ver drift da raiz |
| Memória de harness gravada no produto | `hook-stdin-null-crash.md` e `sdk-subsession-mcp-tools.md` idênticos no CI e no AG | `CI:.claude/memory/`, `AG:.claude/memory/` |
| `scripts/graphify-ecosystem-sync.mjs` e `scripts/install-plugins.mjs` | 3 cópias idênticas de cada (CI, AG, CT), mais uma variante de `install-plugins` no FR | sha `3a4fcc…` / `cc575b…` |
| `.agents/rules/graphify.md` e `.agents/workflows/graphify.md` | 4 cópias idênticas, mais uma versão diferente na raiz | sha `cd2f4f…` / `4da047…` |
| Lógica `resolveCommonGitDir` | Repetida em `T:.claude/hooks/verify-on-stop.mjs` e `CI:scripts/graphify-ecosystem-sync.mjs` | Leitura do código |
| Esquema de aprovação e heurística de intake | "Duplicado deliberadamente" (comentário em `T:.central-iso/hooks/central-iso-pretooluse.mjs:6` e no intake) | FATO. O risco de divergência é declarado no próprio código |

### Pesados

| Item | Tamanho | Fonte |
|---|---|---|
| `.claude/scripts/node_modules` (só `@anthropic-ai/claude-agent-sdk 0.3.235`, `T:.claude/scripts/package.json`) | 341 MB × 4 consumidores ≈ 1,36 GB (cerca de 5.551 arquivos cada, `C:Central ISO Harness/auditoria/00_RELATORIO_ESTADO_ATUAL.md`) | Medido pelo Gabriel |
| `CI:.claude/worktrees` | 1,4 GB. O diff-harness listou 1.945 arquivos "extra" só em worktrees `retrofit/wave*` (`WR:WAVE_CLEAN_LAYOUT_diff_final.json`) | Medido pelo Gabriel + relatório |
| `AG:.superpowers/sdd` | 4,0 MB, 257 arquivos, mais 28 logs não copiados. Ignorado pelo git (`.superpowers/sdd/.gitignore` = `*`), então é só lixo local que não é limpo | `du` + `C:_PULADOS.txt` |
| `FR:.superpowers/sdd` | 1,3 MB, inclui um diff "grande" | idem |
| `WR:` | 2,8 MB, 270 arquivos (JSON de diff que repetem as worktrees) | `du` |

**Custo de tokens e tempo (não aparece em disco):**

- **SessionStart e SessionEnd abrem subsessões Sonnet.** `T:.claude/hooks/compile.mjs` e `session-log.mjs` disparam `compile-runner.mjs` (`model: "sonnet"`, `maxTurns: 20`) e `session-log-runner.mjs` (`maxTurns: 6`), conforme `T:.claude/scripts/compile-runner.mjs:460,729` e `session-log-runner.mjs:229,285`. FATO. O custo por sessão não foi medido.
- **Orientação do Graphify repetida.** `T:.claude/hooks/graphify-orient.mjs` injeta 5 linhas de `additionalContext` em **todo** Read de código, Grep ou `grep/rg/find` no Bash, sem deduplicar por sessão. FATO.
- **Spawns por chamada de ferramenta.** Cada Read ou Bash dispara 2 processos node (pretooluse + graphify-orient). No canônico, cada Write dispara 4 (vault, rules, plano, escopo). FATO. A latência não foi medida.
- **Stop caro.** O `verify-on-stop` roda o `scripts/verify.mjs` inteiro (testes e build, até 180 s) e o sync do Graphify (até 660 s, com `--extract` se houve mudança de código) em **todo Stop com diferença de bytes**. O timeout no settings é 900 s (`T:.claude/hooks/verify-on-stop.mjs:338-349`, `T:.claude/settings.json`). FATO.
- **Regras sempre carregadas.** Cerca de 24 KB de regras com `paths: "**/*"` ou sem `paths` (`T:.claude/rules/`), mais 10 plugins habilitados e 26 a 29 skills locais. FATO. "Em torno de 6 mil tokens" é HIPÓTESE (4 caracteres por token).

### Versionado por engano (lacunas do `.gitignore`)

Sem `.git` na cópia, "não ignorado" significa **pode ser versionado** por um `git add -A`. O estado real é HIPÓTESE.

| Caminho | CI | AG | CT | FR |
|---|---|---|---|---|
| `.claude/worktrees/` (1,4 GB no CI) | **não** (só `.worktrees/`) | **não** | sim | **não** |
| `.claude/scheduled_tasks.lock` (existe no CI, CT e FR, segundo `C:_PULADOS.txt`) | **não** | **não** | **não** | **não** |
| `.claude/hooks/log/` | sim | sim | sim | **não** |
| `.claude/state/` | **não** | **não** | sim | **não** |
| `.central-iso/state|logs|tmp|reports|cache/` | sim | sim | sim | não (sem harness) |
| `*.log` em geral | sim | sim | só `.claude/**/*.log` | **não** |
| `.env` / `.env.local` | sim / sim | sim / **não** | sim / sim | sim / sim |
| `.env.production` e similares | **não** | **não** | **não** | **não** |
| `graphify-out/` | sim | sim | sim | **não** |
| `.superpowers/sdd/` | sim (o `.gitignore` interno tem `*`) | sim | sim | sim |
| `.claude/.aia-harness-pending/` | sim | sim | sim | sim |

Evidência: `CI:.gitignore`, `AG:.gitignore`, `CT:.gitignore` e `FR:.gitignore`. Um risco extra: o `.worktreeinclude` do CI, AG, CT e FR **copia o `.env` para cada worktree novo**, o que espalha segredo por pastas que ninguém limpa (`CI:.worktreeinclude`). FATO.

O canônico tem a mesma lacuna, maior: `K:.gitignore` tem 4 linhas e **não ignora `.env`**, nem `graphify-out/`, `dist/`, `.DS_Store` ou `.claude/worktrees/`. Como o `K:instalar-no-projeto.sh` só acrescenta as linhas do kit, um projeto novo nasce sem `.env` no `.gitignore`. FATO. E o próprio kit leva um `K:.DS_Store`.

---

## Quality gates comparados

**Os dois usam a mesma regra?** Sim. `T:.central-iso/gates/eslint-quality/eslint-rules/*` e `K:.agents/templates/gates-web/eslint-rules/*` têm o mesmo sha256, conferido também contra o `manifest.json` da Central. A origem é o `soumatheusgomes/vibe-coding-toolkit`, commit `13add21` (`T:.central-iso/gates/eslint-quality/manifest.json`, `K:.agents/origem.md:3`). A Central registra o sha de cada arquivo. O canônico só registra o commit. FATO.

**A Central fecha a brecha da issue 7?** Não. O `TYPE_BARREL_BASENAME` (`…/eslint-rules/utils.cjs:35`) isenta pelo nome, e o autoteste da Central **afirma** isso como correto (`T:.central-iso/gates/eslint-quality/verify.mjs:56`, "barrel files are never checked"). O `large-file-warning.mjs`, que só está ligado no Frete, tem a mesma isenção (`T:.claude/hooks/large-file-warning.mjs:136`). Pior: na Central a regra nem é aplicada ao código. FATO.

| Checagem | Central | Canônico | Bloqueia? | Autoteste? |
|---|---|---|---|---|
| Teto de 350 linhas (`quality/max-lines`) | Regra copiada, **não aplicada ao código** em CI, AG nem CT. Só aparece como conselho em `typescript/coding-standards.md:22` (repositórios JS). No Frete: `large-file-warning` (Stop, block) mais `max-lines` core no backend, segundo `FR:.claude/memory/reference_backend_eslint_setup.md` | Aplicada em `SOURCE_DIRS` com `max: 351` (compensa a linha fantasma) e `includeTests` (`K:…/eslint.config.mjs:79`) | Central: não. Canônico: sim, no pre-commit (`npm run lint`) | Central: só a regra isolada (RuleTester). Canônico: regra + integração (`selftest.mjs`) |
| Brecha da issue 7 (`index`/`types`/`constants`…) | **Aberta** e testada como "válida" | Fechada com `max-lines` nativo em 350 (`K:…/eslint.config.mjs:29-35, 92-97`) | Canônico: sim | Canônico: casos `index.ts`, `pasta_a/index.ts`, `types.ts`, `constants.ts`, `dtos.ts` |
| Mesma brecha em `.js/.jsx/.mjs/.cjs` (`constants.js`, `types.js`, `dto.mjs`) | Aberta | **Aberta**: `EXEMPT_BY_NAME` só cobre `types|constants|…` em `{ts,tsx,mts,cts}`. Só `index` cobre todas as extensões (`:31`). A regex do toolkit isenta qualquer extensão | Não | Não: o selftest só faz `lintFiles('**/*.ts')` (`K:…/selftest.mjs:41`) |
| Outras isenções do toolkit: `*.config.*`, `*.stories.*`, `*.conf.*`, pastas `locales/`, `migration(s)/`, `generated/` dentro de `src` | Abertas | Abertas. O doc assume as de nome (`K:.agents/rules/gates.md` item 3) e **não menciona as de pasta** (`utils.cjs:40`) | Não | Não |
| 351 linhas **sem** newline final | n/a | Passa (documentado, `gates.md` item 2). Depende de formatador "opcional" | Não | Não testa o caso ruim |
| Desligar por comentário inline (`/* eslint quality/max-lines: "off" */`, `eslint-disable`) | Sem proteção | Hook bloqueia `eslint-disable` escrito por Write/Edit (`rules-guard.mjs:32`), mas **não** `/* eslint regra: off */` e não pelo Bash. Sem `linterOptions.noInlineConfig` (grep vazio) | Canônico: parcial, e só no Claude Code | Canônico: casos de `eslint-disable` no selftest de hooks |
| `@ts-ignore`, `@ts-nocheck`, `.skip`, `.only` | Sem proteção | Hook bloqueia (Claude Code). `@ts-expect-error`, `it.todo` e `skipIf` passam | Parcial | Sim (hooks) |
| Complexidade, profundidade, params, statements, tamanho de função | Não | Sim (`complexity 12`, `max-depth 4`, `max-statements 20`, `max-params 4`, `max-lines-per-function 150`) | Canônico: sim | Não há caso no selftest |
| `no-direct-console` | Copiada, não aplicada | Aplicada | Canônico: sim | Sim (ambos testam a regra; o canônico também a integração) |
| `no-direct-data-access` | Copiada, não aplicada | Desligada por padrão (README) | Não | Só a regra |
| Lint consciente de tipo (`lint:types`, 14 regras) | Não | Sim, só na revisão E8, fora do pre-commit | Não (depende do orquestrador) | Não. Em repositório JS é vazio (só casa `.ts`) |
| `typecheck` (`tsc --noEmit`) | Não | Exigido pela regra escrita, sem trava mecânica | Não | Não |
| Testes | `scripts/verify.mjs` (CI: front test, back test. AG: só back test. CT: front e back test) | Exigido pela regra escrita, sem trava mecânica | Central: o Stop bloqueia, **mas só com árvore suja** (`verify-on-stop.mjs:338`). Canônico: não | Central: testes de hooks no verify |
| Build | `verify.mjs` (front build). AG e CT têm build mas **não têm lint** | Fora dos gates (`stack.md`) | Central: Stop (com árvore suja) | — |
| Lint de produto | CI: `frontend npm run lint` (config não copiada). AG: **nenhum** (o Biome fica fora do gate, `AG:frontend/CLAUDE.md:13`). CT: só Biome via `npm run check`, fora do `verify.mjs` | `eslint . --max-warnings 0` | Central: só o lint do frontend do CI, no Stop | — |
| Biome | `biome.json` idêntico nos 3 (`recommended: false`, muitas regras em `warn`). Esquema 1.9.4, mas a raiz do CT instalou a 2.5.14 | Formatador opcional. O `stack.md:44` lista "Biome" como gate, contradizendo `gates.md` e o README | Não (warn não falha) | Não |
| Quando roda | Stop do Claude Code (`verify-on-stop`), só se a árvore tem mudança | `git pre-commit` (`K:.githooks/pre-commit`) | — | — |
| Bloqueia commit? | **Não**. Não há pre-commit. Commitar antes do Stop pula o gate | Sim (lint), **exceto** sem `package.json` na raiz → `exit 0` (`pre-commit:10-12`) | — | — |
| Vale para Codex, Antigravity e outras CLIs? | Não (hook do Claude) | Sim (git) | — | — |
| Protege os arquivos que definem o gate | Não | Protege `eslint*.config.*`, `eslint-rules/`, `biome.json`, `.githooks/` e `.claude/hooks`. **Não protege** `package.json` (script `lint`), `selftest.mjs`, `tsconfig*.json` nem `.agents/stack.md` (`rules-guard.mjs:15-27`) | — | — |
| Proveniência da regra | Commit + sha256 por arquivo | Só o commit | — | — |
| Varredura de segredo ao escrever | Regex parcial no pretooluse (`sk-`, chave privada, `.env`). `secret-scan.mjs` (AWS, GitHub, Slack, Google) **desligado** | Não há | Central: sim (parcial). Canônico: não | Não |
| Hook existe mas não está ligado | Não há teste | O selftest confere uma lista fixa de 6 hooks, mas não detecta hook novo fora da lista (`K:kit-claude-code/dot-claude/hooks/selftest.mjs:185-215`) | — | Parcial |

---

## Oneroso, duplicado, quebrado ou arriscado

### Quebrado ou arriscado (prioridade alta)

1. **Commit e push na `main` liberados sem confirmação no Frete.** FATO + HIPÓTESE forte. `FR:.claude/hooks/guard-main-branch.mjs:81` devolve `permissionDecision: "allow"` com a mensagem "blocked direct commit/push". O cabeçalho diz "asks the user" e o modelo usa `"deny"` (`T:…/guard-main-branch.mjs:81`). O hook está ligado no PreToolUse Bash do Frete (`FR:.claude/settings.json`). Pela semântica do Claude Code, `allow` **pula o pedido de permissão**, então um `git push origin main` passaria sem perguntar. Isso não foi testado aqui.
2. **O gate da Central é pulado quando o agente commita antes do Stop.** FATO. `T:.claude/hooks/verify-on-stop.mjs:338` só roda o `scripts/verify.mjs` se `snapshot.files.length > 0` (diferença contra HEAD + não rastreados). Depois de um commit, a árvore fica limpa e só roda o Graphify. E não existe pre-commit na Central.
3. **O teto de 350 linhas não existe na prática nos consumidores da Central.** FATO. O `npm run check` do CT roda o `verify:eslint-quality` (RuleTester com código sintético) e o `biome lint`, e a saída "quality/max-lines: ok" é o **autoteste**, não o lint do projeto (`WR:ROLLOUT_mod_ctp_atp_check_final.txt`, `WR:WAVE_ESLINT_INSTALL_RELATORIO.md`). O CI e o AG nem isso têm.
4. **Regra de domínio trocada.** FATO. O `CI:.claude/rules/module-central-iso.md` diz ao **hub** "Agendamento é satélite… Não crie login local nem acesse o banco da Central". O `AG:` e o `CT:` recebem o `central-iso.md` do hub ("A Central é dona de autenticação…"). As duas carregam em `frontend/**` e `backend/**`. A origem é o `T:.claude/rules/`, que tem as duas.
5. **Regra que promete trava inexistente.** FATO. `T:.claude/rules/obsidian.md:23` diz "`vault-guard.mjs` bloqueia Read/Grep/Glob/Write/Edit/Bash diretos", mas o `vault-guard` não está ligado em nenhum consumidor. O cofre fica acessível pelo link `.central-iso-vault`.
6. **Secret scan desligado nos consumidores.** FATO. O `secret-scan.mjs` (AKIA, ghp_, xox, AIza) não está registrado. Sobra a regex do pretooluse, que tem:
   - **falso positivo:** `sk-[A-Za-z0-9_-]{20,}` sem borda de palavra bloqueia qualquer caminho com "…sk-" seguido de 20 caracteres, como `src/task-management-dashboard-panel.jsx` e `risk-assessment-for-the-module.md`. `rm\s+-rf\s+\/` bloqueia `rm -rf /tmp/build-cache`. Reproduzido em Python com o mesmo padrão (`T:.central-iso/hooks/central-iso-pretooluse.mjs:15`).
   - **brecha:** `cat backend/.e*v` passa.
7. **O pre-commit do canônico não protege repositórios sem `package.json` na raiz.** O código é FATO (`K:.githooks/pre-commit:10-12`). Que o CI e o AG não têm `package.json` na raiz é **HIPÓTESE forte**: `CI:.central-iso/instructions/AGENTS.md` só usa `npm --prefix backend|frontend`, e o CT só ganhou um `package.json` de raiz numa wave própria. Ao "obedecer ao novo", esses repositórios passariam no pre-commit sem lint.
8. **O gate do canônico pode ser esvaziado sem tocar em arquivo protegido.** FATO. Dá para trocar `"lint"` no `package.json` (por exemplo, tirar `--max-warnings 0` ou apontar para uma pasta vazia) ou editar o `selftest.mjs` para sempre passar. Nenhum dos dois está em `PROTEGIDOS`, e o pre-commit só confere que o script `"lint"` existe (`pre-commit:16`).
9. **Desligar por comentário inline passa nos dois.** FATO. Não há `linterOptions.noInlineConfig` (grep vazio em `K:.agents` e `K:kit-claude-code`), e o `rules-guard` só procura a string `eslint-disable`.
10. **Brecha de nome em JS no canônico.** FATO. Ver tabela: `constants.js`, `types.js`, `enums.mjs` etc. ficam fora das duas regras de tamanho, e o selftest não cobre JS. É grave para a Central, cujo produto é JS (`FR:.central-iso/project.json`, `CI:.central-iso/instructions/AGENTS.md`).
11. **O perfil "web (TypeScript)" do canônico não serve para a Central como está.** HIPÓTESE forte. `lint:types` só casa `.ts` (vazio em JS), `typecheck` exige `tsconfig`, e os `globals` mínimos (`K:…/eslint.config.mjs`) não incluem `require`, `module`, `window` ou `document`. Ao adotar, há risco de "gate verde vazio" ou de gate impossível. O próprio `K:.agents/stack.md` diz que "um perfil só entra em uso depois que os quatro gates existem".
12. **`.env` fora do `.gitignore` do canônico e `deny` estreito.** FATO. `K:.gitignore` não tem `.env`. `K:kit-claude-code/dot-claude/settings.json` nega só `Read(./.env)` e `Read(./.env.*)`, e não nega `backend/.env`. A Central nega `./**/.env` e `./secrets/**` (`T:.claude/settings.json`).
13. **O Graphify trava o fim de turno por motivo que não é qualidade.** FATO. O `verify-on-stop` bloqueia se o grafo não bate com o HEAD ou se faltam os dispatchers `post-commit` e `post-checkout` (`verify-on-stop.mjs:385-400`). Um problema no Graphify vira bloqueio de entrega.
14. **As ferramentas de drift não veem o Frete e contam worktrees.** FATO. `harness-lib.mjs:71-79` (sem Frete). O `listFiles` não pula `worktrees` (`harness-lib.mjs:37`), então o relatório do hub soma 1.945 arquivos de worktree. `DEFAULT_ROOT` está fixo no caminho do Mac (`:6`).

### Oneroso

- `verify-on-stop`: build, testes e Graphify (até 900 s) em todo Stop com mudança (ver custo).
- Subsessões Sonnet no SessionStart e no SessionEnd, mais 1,36 GB de SDK repetido só para isso.
- `graphify-orient` repetindo o mesmo texto em cada Read ou Grep.
- 10 plugins habilitados, mesmo com a raiz dizendo "Não execute `/aia-harness:init`" (`C:CLAUDE.md`). O `aia-harness` continua `true` em todo consumidor (`T:.claude/settings.json`).
- O canônico gasta 4 spawns de node por Write (4 hooks separados no mesmo evento).

### Duplicado

Ver a tabela de duplicados. Os principais são: plugin `quality/*` em 5 lugares, skills sem dono, regras repetidas dentro do repositório, duas linhagens dos mesmos hooks (raiz e consumidor) e memória de harness dentro de repositório de produto.

---

## Recomendações concretas para o harness novo

Em ordem de prioridade. Cada item diz o porquê e como testar.

1. **Corrigir já o `guard-main-branch` do Frete (`allow` → `deny`, ou `ask`).**
   - *Por quê:* hoje ele aprova commit e push na `main` sem perguntar (risco 1).
   - *Teste:* `echo '{"tool_name":"Bash","tool_input":{"command":"git push origin main"},"cwd":"<Frete>"}' | node .claude/hooks/guard-main-branch.mjs` precisa devolver `deny` (ou `ask`), nunca `allow`.

2. **Fazer o gate de commit valer para qualquer CLI e para qualquer layout.**
   - *Por quê:* a Central não tem pre-commit (risco 2), e o pre-commit do canônico passa em branco sem `package.json` na raiz (risco 7).
   - *Como:* trocar o `exit 0` por falha quando o projeto declara código, lendo uma marca no `project.json`/`harness.json`, por exemplo `"docsOnly": true`, como única forma de pular. Para backend/ + frontend/, ou cria `package.json` de raiz só de orquestração (o padrão que o CT já usa), ou o pre-commit itera as pastas de código.
   - *Teste:* repositório com `backend/package.json` e sem `package.json` na raiz. O `git commit` precisa falhar.

3. **Fechar de vez a família "isento pelo nome".**
   - *Por quê:* a issue 7 só foi fechada para TS (risco 10), e as isenções por pasta nem estão documentadas.
   - *Como:* em `eslint.config.mjs`, estender `EXEMPT_BY_NAME` para `{js,jsx,mjs,cjs,ts,tsx,mts,cts}` em todos os nomes, e aplicar o `max-lines` nativo também a `*.config.*`, `*.stories.*`, `*.conf.*` e `**/{locales,migration,migrations,generated,__generated__}/**` dentro de `SOURCE_DIRS`. Exceção, só pela lista aprovada.
   - *Teste:* novos casos no `selftest.mjs` (e trocar `lintFiles('**/*.ts')` por `**/*.{js,jsx,mjs,cjs,ts,tsx}`): `constants.js` com 400 linhas, `enums.mjs` com 400, `app.config.ts` com 400 e `src/x/migration/a.ts` com 400. Todos precisam reprovar.

4. **Neutralizar desligamento inline no próprio ESLint.**
   - *Por quê:* hoje o hook só barra a string `eslint-disable` escrita pelo Write/Edit, e `/* eslint regra: off */` ou um disable escrito pelo Bash passam (risco 9).
   - *Como:* `linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" }`. Assim vale para qualquer CLI e qualquer forma de escrita.
   - *Teste:* caso no selftest com `/* eslint quality/max-lines: "off", max-lines: "off" */` + 400 linhas, e outro com `// eslint-disable-next-line` + `console.log`. Os dois precisam reprovar.

5. **Tornar obrigatório o newline final com `"eol-last": ["error", "always"]`.**
   - *Por quê:* fecha o caso "351 linhas sem newline passa" sem depender de formatador opcional.
   - *Teste:* caso `ruim_351_sem_newline.ts` no selftest precisa reprovar.

6. **Proteger o que define o gate.**
   - *Por quê:* o gate pode ser esvaziado editando `package.json` ou `selftest.mjs` (risco 8).
   - *Como:* acrescentar ao `rules-guard` `selftest.mjs`, `tsconfig*.json` e `.agents/stack.md`. Para o `package.json`, que muda por dependência, o pre-commit compara `npm pkg get scripts.lint scripts.typecheck scripts.test` com os valores gravados num arquivo protegido.
   - *Teste:* trocar `"lint"` por `"echo ok"` faz o commit falhar. Editar `selftest.mjs` pelo agente é bloqueado.

7. **Pôr testes e typecheck numa trava mecânica, sem trazer o `verify-on-stop` como está.**
   - *Por quê:* no canônico, `typecheck` e `test` são só regra escrita. Na Central, rodam no Stop, são pulados com árvore limpa, custam até 900 s e misturam Graphify com qualidade (riscos 2 e 13).
   - *Como:* pre-commit = `lint` (rápido). `pre-push` = `typecheck` + `test` + `lint:types` (o push é do humano, então o custo cai no momento certo). Graphify vai para o `post-commit`, onde o dispatcher já existe. Se quiser algo no Stop, só aviso, nunca bloqueio por Graphify.
   - *Teste:* commitar um teste quebrado passa no commit e falha no `git push`. Um erro de tipo falha no push. Graphify ausente nunca bloqueia commit nem Stop.

8. **Criar um perfil "web-js" antes de a Central obedecer.**
   - *Por quê:* o perfil TypeScript gera gate vazio ou impossível em JS (risco 11).
   - *Como:* `SOURCE_DIRS = ["backend/src","frontend/src"]`, `globals` de node e de browser por pasta, `typecheck` = `tsc --noEmit --allowJs --checkJs` ou "não se aplica" registrado como exceção aprovada, `test` = `node --test` ou `vitest run`.
   - *Teste:* `npm run gates:selftest` verde nas duas pastas, e `npm run lint` no CT acusando os arquivos reais acima de 350 linhas, se houver.

9. **Uma fonte só para o plugin `quality/*`, com manifest.**
   - *Por quê:* hoje há 5 cópias idênticas, e o canônico não registra o sha.
   - *Como:* adotar o `manifest.json` da Central (commit + sha256 por arquivo) no canônico. Ao migrar, apagar `.central-iso/gates/eslint-quality/` dos 3 consumidores para não ficar com duas pastas de regra.
   - *Teste:* `doctor` recalcula o sha de `eslint-rules/*` em cada repositório e falha se divergir do manifest.

10. **Teste bidirecional "hook existe ⇔ hook ligado".**
    - *Por quê:* 21 hooks mortos na Central, e o selftest do canônico só confere uma lista fixa.
    - *Como:* todo `.mjs` em `.claude/hooks/` precisa estar registrado no `settings.json` ou numa lista explícita de bibliotecas (`hook-io.mjs`, `selftest.mjs`). Todo caminho registrado precisa existir. Na migração, apagar os 21 mortos, `central-iso-stop`, `central-iso-posttooluse` e `central-iso-subagentstop` (efeito nulo, HIPÓTESE forte) e a cópia legada do CT.
    - *Teste:* criar `.claude/hooks/dummy.mjs` faz o selftest falhar. Apagar um hook registrado também faz falhar.

11. **Varredura de segredo no pre-commit, absorvendo os padrões da Central.**
    - *Por quê:* não existe no canônico e está desligada na Central (risco 6).
    - *Como:* rodar sobre `git diff --cached` a lista do `secret-scan.mjs` + chave privada + `sk-`, **com borda de palavra** (`\bsk-`). Ampliar o `deny` do settings com os padrões da Central: `Read(./**/.env)`, `Read(./**/.env.*)`, `Read(./secrets/**)` e um `Read(./**/.token)`.
    - *Teste:* arquivo preparado com `AKIA` + 16 caracteres faz o commit falhar. O caminho `src/task-management-panel.tsx` passa. `Read backend/.env` é negado.

12. **`.gitignore` canônico completo.**
    - *Por quê:* o canônico não ignora `.env`, e os consumidores deixam escapar worktrees, lock e logs (tabela acima).
    - *Como:* `.env`, `.env.*`, `!.env.example`, `.claude/worktrees/`, `.claude/scheduled_tasks.lock`, `.claude/hooks/log/`, `.claude/state/`, `.central-iso/{state,logs,tmp,reports,cache}/`, `*.log`, `.DS_Store`, `dist/`, `coverage/`. `graphify-out/` também, a não ser que se decida versionar o grafo. Tirar `.env` do `.worktreeinclude`, ou documentar o porquê.
    - *Teste:* `git check-ignore -v .env backend/.env.production .claude/worktrees/x .claude/scheduled_tasks.lock .claude/hooks/log/a.log` precisa listar todos.

13. **Separar domínio do modelo.**
    - *Por quê:* hoje o hub recebe a regra do Agendamento, e vice-versa (risco 4).
    - *Como:* tirar `central-iso.md` e `module-central-iso.md` do modelo. Cada repositório mantém só a sua, numa pasta de domínio fora do sync (por exemplo `.claude/rules/dominio/`). O `doctor` confere que o `description` da regra de domínio cita o `id` do `project.json`.
    - *Teste:* `grep -r "Agendamento é satélite" "Central ISO/.claude"` precisa voltar vazio.

14. **Modelo e ferramentas honestos.**
    - *Por quê:* inventário desatualizado, Frete invisível e worktrees inflando o diff (risco 14).
    - *Como:* gerar o `template-inventory.json` a partir dos arquivos. Pôr o Frete em `knownTargets` (ou numa lista "excluídos", com aviso do `doctor`). Pular `.claude/worktrees` no `listFiles`. Colocar skills sob o modelo, ou declarar explicitamente que são locais. Unificar o esquema do `project.json` (`id`, `role`, `canonicalCommands`).
    - *Teste:* `diff-harness` contra o próprio modelo dá 0/0/0. O inventário bate 1:1 com `find`. O Frete aparece no relatório.

15. **Cortar o custo pesado e escondido.**
    - *Por quê:* 1,36 GB de SDK repetido, 1,4 GB de worktrees e subsessões Sonnet sem visibilidade de custo.
    - *Como:*
      - (a) decidir se o pipeline de memória por LLM (`compile`, `session-log`) fica. O canônico já resolve memória pelo MCP do vault sem subsessão. Se ficar, uma instalação só do SDK, compartilhada.
      - (b) o humano revisa e roda `git worktree list` e `git worktree prune` no Central ISO.
      - (c) `graphify-orient` injeta uma vez por sessão (marca no scratch da sessão).
      - (d) apagar as regras repetidas (`testing.md`, `parallel-subagent-driven-development.md`) e o `.aia-harness-pending`.
      - (e) no canônico, juntar os hooks do mesmo evento num despachante só, que roda as travas no mesmo processo: menos spawns e um registro só para testar.
    - *Teste:* `du -sh */.claude/scripts/node_modules */.claude/worktrees` antes e depois. Contar o `additionalContext` do `graphify-orient` numa sessão com 20 Reads: no máximo 1 injeção. O selftest de hooks continua verde depois do despachante.

16. **Decidir o papel do Biome.**
    - *Por quê:* na Central ele está em `warn` e fora do gate (`AG:frontend/CLAUDE.md:13`), há duas versões em conflito no CT, e o canônico se contradiz (`stack.md:44` × `gates.md`).
    - *Como:* ESLint é o único gate de lint. Biome (ou Prettier), só como formatador. Remover `@biomejs/biome@2.5.14` da raiz do CT.
    - *Teste:* `npm ls @biomejs/biome` mostra uma versão só. `stack.md` e `gates.md` dizem a mesma coisa.

**O que vale manter da Central nesta frente:** o manifest com sha256 do plugin, os `deny` amplos de `.env` e `secrets`, a ideia de amarrar a aprovação por hash (corrigindo a regex do pretooluse) e a varredura de segredo (ligada, e no git).

**O que vale manter do canônico:** o pre-commit no git, o selftest de integração com a config real, o `rules-guard` e o teto aplicado de fato.
