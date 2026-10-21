# Auditoria profunda: Central ISO × harness canônico

- **Data:** 14/10/2026
- **Status:** insumo para o adendo da SPEC (`docs/superpowers/specs/2026-10-14-esteira-e0-e13-design.md`) e para o plano em waves. **Este documento não muda nada** em nenhum repositório.
- **Substitui:** `docs/inventario/2026-10-14-comparacao-central-iso.md`, a primeira comparação, mais rasa. Aquele arquivo fica como histórico.
- **Pergunta que este documento responde:** o que o canônico cobre e a Central não; o que a Central cobre e o canônico não; o que a Central tem de bom; o que ela tem de ruim (quebrado, oneroso, duplicado); onde os dois têm a mesma brecha; e, para cada brecha, como fechar e como testar.
- **Como foi feito:**
  - Quatro auditorias independentes, só leitura, sobre uma cópia da Central sem segredos e sobre o kit: **A** hooks e permissões; **B** processo, agentes, regras e saídas; **C** memória, grafo, distribuição e multi-fornecedor; **D** drift, custo e quality gates. Os quatro relatórios completos estão em `docs/inventario/auditoria-2026-10-14/`.
  - Dois achados críticos foram conferidos de novo direto no código: o fail-open do kit (`hook-io.mjs`) e o `allow` do `guard-main-branch` do Frete.
  - O comportamento das CLIs (o que é bloqueante, o que cada ferramenta aceita por projeto) foi conferido na documentação oficial. Resultado na seção 11.
- **Legenda:** **FATO** = lido no arquivo citado. **HIPÓTESE** = inferência, sempre com o teste que confirma. `arquivo:N` = linha N, na versão de 14/10.
- **IDs usados no texto:** `K` = só o canônico cobre; `C` = só a Central cobre; `Q` quebrado, `O` oneroso, `DU` duplicado, `X` contraditório, `M` morto (todos da Central); `N` = defeito do canônico; `B` = brecha comum aos dois; `W` = wave do plano; `DP` = decisão pendente do Gabriel; `D1` a `D11` = decisões já aprovadas no `[E13]`.

## Caminhos abreviados

| Sigla | Caminho no Mac |
|---|---|
| `[R]` | `~/Desktop/Projetos/` (raiz controladora da Central, não é git) |
| `[CI]` | `~/Desktop/Projetos/Central ISO/` (repositório do hub) |
| `[H]` | `~/Desktop/Projetos/Central ISO Harness/` (padrão da Central, não é git) |
| `[T]` | `[H]/templates/repo-consumer/` (modelo que vai para cada repositório) |
| `[KN]` | `~/Desktop/Projetos/Central ISO Knowledge/` (cofre do ecossistema, git sem remoto) |
| `[FW]` | `~/Desktop/Projetos/FrameWork Central ISO/` |
| `[AG]`, `[CT]`, `[FR]` | `~/Desktop/Projetos/Módulos Central/Mod. Agend/`, `…/Mod. CTP-ATP/`, `…/Mod. Frete/` |
| `[K]` | `~/development/harness-canonico/` (o kit novo) |
| `[KC]` | `[K]/kit-claude-code/dot-claude/` (o que vira `.claude/` no projeto) |
| `[E13]` | `[K]/docs/superpowers/specs/2026-10-14-esteira-e0-e13-design.md` (desenho aprovado, ainda não aplicado ao kit) |

---

## 0. Resumo em 12 linhas

1. **Nenhum dos dois está amarrado.** Nos dois, o próprio agente consegue desligar as travas sem o Gabriel ver.
2. **A aprovação é forjável nos dois.** Na Central, `find … shasum` e `cat > state` passam como "somente leitura" e gravam uma aprovação válida. No kit, o agente escreve a linha de aprovação no `estado.md`.
3. **As travas falham abertas nos dois.** No kit, `mkdir -p docs/fluxo/x/estado.md` desliga o `plano-guard` (FATO, conferido no código).
4. **Bash passa por cima de tudo nos dois** (`node -e`, `sh -c`, `cat >`, `sed -i`).
5. **A Central tem** a melhor integridade de aprovação (hash da SPEC e do plano), o melhor bloqueio de `.env` e o melhor doctor. **O kit tem** as melhores travas de git, de regra e de escopo, e o único gate que vale para qualquer CLI (o pre-commit do git).
6. **Na Central:** o teto de 350 linhas não é aplicado a código nenhum; o gate de testes é pulado quando o agente commita antes do Stop; 21 hooks existem sem estar ligados, entre eles `secret-scan` e `vault-guard`.
7. **Risco ativo hoje:** no Frete, o `guard-main-branch` aprova sozinho commit e push na `main` (FATO, conferido no código).
8. **Previsibilidade:** a Central tem nove textos de fluxo que se contradizem, o kit tem cinco mapas de papéis, e há nove vocabulários de saída em uso. Sem lista fechada, não dá para prever nem conferir o que um agente entrega.
9. **Agentes:** a Central tem 21, e 14 deles têm o mesmo corpo. O kit tem contratos melhores, mas os adaptadores não fixam modelo nem ferramentas.
10. **Memória:** o cofre da Central não tem cópia fora do Mac, o índice de memória não carrega em três repositórios, e o pipeline de dailies por LLM é caro e falha calado. O kit deixa Codex, Antigravity e OpenCode sem cofre nenhum.
11. **Distribuição:** a Central tem quatro mecanismos e nenhum grava versão. O kit tem um só, mas sem versão, sem `verificar` e sem `atualizar`.
12. **A Central ainda não consegue obedecer ao kit:** é JavaScript, sem `typecheck` nem `lint:types`, e o pre-commit do kit passa em branco quando não há `package.json` na raiz, que é o layout dela.

---

## 1. Placar por frente

| Frente | Central | Canônico | Melhor hoje | Direção para o harness novo |
|---|---|---|---|---|
| Aprovação de SPEC e plano | State file com sha256, mas forjável e sem escopo | `estado.md` por demanda, legível, forjável, sem hash | Empate | Frase digitada pelo humano + hash + assinatura, por demanda, limitada aos `Files:` (B01, B02) |
| Trava falha fechada | Crash libera | `run()` engole a exceção e libera | Nenhum | Guardas falham fechadas (B03) |
| Bash | Regex que só olha o começo do comando | Não olha | Central, fraca | Guarda de Bash + sandbox do sistema (B04) |
| Commit, push, merge | Qualquer sessão commita; só `--force` é negado | `commit-guard` + deny de push | **Canônico** | Lista de permitidos + alias + branch (B13) |
| Gates de qualidade | Stop pesado e pulável; 350 linhas não aplicado | pre-commit com lint + selftest; typecheck e test só no texto | **Canônico** | pre-commit + pre-push + recibo no Stop (B07) |
| Segredo | Deny amplo + regex parcial; `secret-scan` desligado | Deny só de `./.env`; mais nada | **Central** | Deny amplo + varredura no pre-commit (B08) |
| Proteção das próprias regras | Nenhuma | `rules-guard` + liberação só pelo humano | **Canônico** | Ampliar a lista e fechar worktree e symlink (B07, B14) |
| Agentes | 21, com modelo fixo e corpo genérico | 10 personas com contrato, sem modelo | Canônico no conteúdo, Central no frontmatter | Personas do kit + `model`/`tools` + guarda no despacho (B10) |
| Fluxo | Nove textos contraditórios | Um fluxo, cinco mapas de papéis | Canônico | Aplicar o E0–E13 em todos os arquivos (N19) |
| Formato de saída | Nove vocabulários | 3 status, contra 4 do Superpowers | Nenhum | Vocabulário único + F1–F10 + validador (seção 8) |
| Memória do agente | Três destinos; o índice não carrega | Um índice importado, sem trava | Canônico | Um índice + checagem mecânica (B21) |
| Cofre | Do ecossistema, sem remoto, nome global que colide | `vault/` por projeto, MCP de projeto | Canônico, para projeto | Dois níveis, a decidir (DP-02) |
| Grafo | Local + global com âncoras, roda no Stop | Local, manual no fechamento | Central, na ideia | Local na base + global como perfil opcional (C28) |
| Distribuição | Quatro mecanismos, sem versão | Um instalador, sem versão | Empate | Manifesto com versão + `verificar`/`atualizar` (N28) |
| Máquina nova | Doctor amplo, que exige configuração global | Nada | Central, mas contra o D10 | Doctor só leitura, sem exigir nada global (N30) |
| Multi-fornecedor | `AGENTS.md` escondido | `AGENTS.md` na raiz; MCP só no Claude | Canônico | Uma política com adaptador por CLI; regras, MCP e hooks no formato de cada uma (B23, seção 11) |
| Custo | Alto e escondido | Baixo | **Canônico** | Não trazer o custo da Central |

---

## 2. O que o canônico cobre e a Central não (manter)

| ID | O quê | Evidência no kit | O que a Central tem no lugar | Ajuste necessário |
|---|---|---|---|---|
| K01 | Gate no git (pre-commit), que vale para qualquer CLI | `[K]/.githooks/pre-commit` | Nada no git. Só o Stop do Claude Code | Não passar em branco sem `package.json` (N11); somar segredo (B08) |
| K02 | Teto de 350 linhas aplicado de verdade ao código (`max: 351` compensa a linha fantasma) | `[K]/.agents/templates/gates-web/eslint.config.mjs:79` | Regra copiada e nunca aplicada (Q13) | Estender a JS e às pastas isentas (B16) |
| K03 | Brecha da issue 7 fechada para `index`, `types`, `constants` em TS | `eslint.config.mjs:29-35, 92-97` | Aberta e testada como correta (Q14) | Idem |
| K04 | Selftest de integração com a config real do ESLint | `[K]/…/gates-web/selftest.mjs` | RuleTester com código sintético | Cobrir JS |
| K05 | Limites de complexidade (complexity 12, max-depth 4, max-statements 20, max-params 4, max-lines-per-function 150) | `eslint.config.mjs` | Não há | Casos no selftest |
| K06 | `commit-guard`: subagente não faz commit, add, stash, restore, checkout, switch, rebase, cherry-pick, tag; ninguém faz push, merge, `gh pr merge`, `--no-verify`, `core.hooksPath`, `reset --hard`, `clean -f`, `branch -D`, `checkout -- .`, `restore .`, `add .`/`-A`/`-u`/`*`, `commit -a` | `[KC]/hooks/commit-guard.mjs:37-84` | `git commit` liberado para qualquer sessão; só `push --force` negado (Q09, Q10) | Fechar alias, `sh -c` e `gh api` (B13) |
| K07 | Deny determinístico de `git push` como segunda camada | `[KC]/settings.json:3-7` | Só `--force` | Ampliar (B13) |
| K08 | `rules-guard`: o agente não edita lint, biome, `.githooks`, husky, lefthook, `.mcp.json`, settings, hooks, agents, `AGENTS.md`/`CLAUDE.md`, fluxo, rules, personas | `[KC]/hooks/rules-guard.mjs:15-27` | Nenhuma proteção. Com aprovação, o agente edita o próprio hook de aprovação (Q08) | Ampliar para gates, aprovações e memória (B07) |
| K09 | Bloqueio dos atalhos que calam o verificador (`eslint-disable`, `@ts-ignore`, `@ts-nocheck`, `.skip`, `.only`) | `rules-guard.mjs:32-38` | Nada | Completar com `noInlineConfig` (B15) |
| K10 | Liberação de regra só pelo humano (`touch .claude/liberar-regras`, `HARNESS_BYPASS=1` na abertura) | `rules-guard.mjs:43-45` | `CLAUDE_INVOKED_BY`, que qualquer processo pode setar (Q30) | Bloquear a sessão aninhada (B05) |
| K11 | `escopo-guard` por `agent_type`: revisores e validador só escrevem o próprio relato; test-engineer e debugger só escrevem teste | `[KC]/hooks/escopo-guard.mjs:11-31` | Revisores com Bash; 7 agentes sem `tools` | Cobrir Bash, MCP, `general-purpose` e a sessão principal (B10) |
| K12 | `vault-guard` ligado e testado (24 casos); bloqueia acesso direto ao cofre e o MCP pessoal `obsidian` | `[KC]/hooks/vault-guard.mjs`; `selftest.mjs:48-73` | Ligado só na raiz controladora; nos repositórios, desligado (Q16) | Grep sem caminho continua aberto |
| K13 | Cofre `vault/` dentro do repositório: vem com o clone, segue a branch, entra no merge | `[K]/kit-claude-code/dot-mcp.json:3-21` | Cofre externo, sem remoto, ligado por link fora do git (Q23) | Decidir os dois níveis (DP-02) |
| K14 | MCP de projeto com nome exclusivo (`harness-vault`), servidor fixado em commit, modo strict, teto de linhas | `dot-mcp.json` | `obsidian` global, que colide com o cofre pessoal (Q21) | Espelhar o servidor (P2) |
| K15 | `estado.md` por demanda (etapa, aprovações, waves, reparos) | `[K]/.agents/templates/estado.md` | Não há arquivo de estado; só o `progress.md` em texto livre | Formato F6 + histórico só de acréscimo |
| K16 | Branch `demanda/<slug>` e merge só do humano | `[K]/.agents/rules/commit.md:9-15` | Trabalho direto na `main` permitido (X11) | Trava mecânica da branch (B13) |
| K17 | Reparo com teto de 3 tentativas e "por que errei" antes de corrigir | `[K]/.agents/rules/reparo.md` | Sem limite de tentativas | Dizer quando o debugger entra (N22) |
| K18 | Seção "Consultas feitas" obrigatória, com trava parcial | `rules/consulta.md`; `plano-guard.mjs:47` | Só regra escrita | — |
| K19 | Personas com contrato, checklist e formato de relato | `[K]/.agents/personas/*.md` | 14 agentes com o mesmo corpo de 18 linhas (DU01) | Fixar modelo e ferramentas (N16) |
| K20 | Plano com `Owner` e verificação por tarefa | `rules/ondas.md:17-27` | Só `Files:` e `Depends-on:` | — |
| K21 | `AGENTS.md` na raiz, que as quatro CLIs leem sozinhas | `[K]/AGENTS.md` | Escondido em `.central-iso/instructions/`; o verify da Central reprova na raiz (Q34) | — |
| K22 | Um selftest único que roda a cópia instalada dos hooks (cerca de 106 verificações) | `[KC]/hooks/selftest.mjs` | Testes contra o modelo, espalhados em 4 lugares | Teste de registro total (B12) |
| K23 | Instalador idempotente que nunca sobrescreve e lista os conflitos | `[K]/instalar-no-projeto.sh` | Quatro mecanismos; `sync --apply` bloqueado (M10) | Versão + `verificar`/`atualizar` (N28) |
| K24 | SessionStart leve (só etapa e branch) | `[KC]/hooks/session-start.mjs` | Sub-sessão Sonnet no início e varredura de disco a cada prompt (O02, O03) | — |
| K25 | RTK com exclusão documentada dos comandos de gate | `[K]/modo-facil/01-fase-2-instalar-ferramentas.md:54-71` | `rtk-hook` desligado no hub | Doctor confere a exclusão (W7) |
| K26 | Permissões estreitas: sem `defaultMode: auto` e sem `allow` amplo | `[KC]/settings.json` | `defaultMode: auto`; `allow` com `node *`, `npm install`, `git add/commit` (Q07) | Completar o deny (B08, B13) |
| K27 | Pedido para pular etapa: três linhas e não executa; a regra só muda editando o `AGENTS.md` | `[K]/AGENTS.md:11`; `fluxo.md:33-35` | Aceita "autorização específica" no meio da conversa | Formato F2 |
| K28 | Global limpo (D10): tudo no escopo do projeto | `[E13]` D10 | O bootstrap força `defaultMode=auto`, MCP e plugins globais (Q32) | — |
| K29 | (desenho) Revisão final por outra família de modelo (Codex na E10), com gitleaks e npm audit | `[E13]:137-145` | Revisão de branch inteira pela mesma família | Templates F4 e F5 |
| K30 | (desenho) Deploy preparado por um agente e executado pelo humano, com backup e plano de volta | `[E13]` D4 | `/deploy` com autorização | Template a partir do checklist da Central (C14) |

---

## 3. O que a Central cobre e o canônico não

Coluna **Trazer como:** **Igual** = copiar; **Adaptar** = trazer com correção; **Ideia** = reescrever do zero com o conceito; **Decidir** = depende do Gabriel (seção 10).

| ID | O quê | Evidência na Central | Trazer como | Observação |
|---|---|---|---|---|
| C01 | Aprovação presa ao conteúdo: sha256 da SPEC e do plano | `[CI]/.central-iso/hooks/central-iso-pretooluse.mjs:99-107` | Adaptar | Sem a regex de "somente leitura" e sem o gerador com `--approved-by` livre (B01) |
| C02 | Deny recursivo de segredo: `Read(./**/.env*)`, `Read(./secrets/**)` | `[CI]/.claude/settings.json:21-25` | Adaptar | Somar deny de Edit e Write, com exceção explícita de `.env.example` |
| C03 | Padrões de segredo (AKIA, `ghp_`, `xox`, `AIza`, `sk-`, chave privada) | `[CI]/.claude/hooks/secret-scan.mjs:31-38` | Adaptar | Regex com borda de palavra (`\bsk-`); também no pre-commit via gitleaks |
| C04 | Gate de testes e build automático no fim do turno | `[CI]/.claude/hooks/verify-on-stop.mjs` | Ideia | Não trazer o hook (pesado e pulável). Trazer como pre-push + recibo no Stop (B07) |
| C05 | `model:` no frontmatter de todo agente | `[CI]/.claude/agents/*.md` | Igual | Com a tabela de níveis de C06 |
| C06 | Disciplina de modelo em três níveis, com exemplos | `[R]/.claude/rules/model-discipline.md:5-9` | Igual | — |
| C07 | Ponte "o tipo do agente é a persona; o corpo do prompt é o contrato da skill" | `[CI]/.claude/rules/08-parallel-subagent-driven-development.md:57-65` | Igual | Explica e fecha os subagentes `general-purpose` que o Gabriel viu |
| C08 | Tabela "quando o Superpowers usaria `general-purpose`, despache X" | `[FR]/CLAUDE.md:48-66` | Igual | Junto com a guarda de despacho (B10) |
| C09 | Proveniência do plugin `quality/*` com sha256 por arquivo | `[T]/.central-iso/gates/eslint-quality/manifest.json` | Igual | O kit só grava o commit (N31) |
| C10 | Manifesto de arquivos geridos com sha256 | `[KN]/.central-iso/bootstrap/project-overlay.json` | Adaptar | Vira o `harness.json` do projeto (N28) |
| C11 | Recusa de sobrescrever, com backup antes de substituir | `[KN]/.central-iso/bootstrap/README.md:95-101` | Igual | — |
| C12 | Namespace único, com estado de execução fora do git | `.central-iso/{state,logs,tmp,reports,cache}/` | Adaptar | No kit: `.agents/` versionado + `.agents/.runtime/` ignorado |
| C13 | Doctor de máquina nova (programas, links, plugins, handshake do MCP) | `[KN]/.central-iso/bootstrap/doctor.mjs`; `lib/mcp-probe.mjs` | Adaptar | Só leitura e sem exigir nada global (D10) |
| C14 | Checklist de deploy feito de erros reais: backup primeiro, `node:20-slim` com openssl e curl, `binaryTargets`, rede `external`, healthcheck com curl, porta 808x, mesmo `JWT_SECRET`, plano de volta | `[FW]/CONTRATO_DE_MODULO_E_DEPLOY.md:109-262`; `[CI]/.claude/commands/deploy.md` | Adaptar | Base do template `deploy-NN.md` da E13 |
| C15 | Contrato de domínio Central × módulo; 12 perguntas para módulo novo; template de arquitetura | `[H]/canonico/03-criacao-de-modulo.md:7-20`; `[FW]/MODULO_X_ARCHITECTURE_TEMPLATE.md` | Adaptar | Fica no perfil `ecossistema-central`, não no harness base |
| C16 | Classificação do pedido (o Frete usa "≥ 2 de 4 critérios, senão é pequeno") | `[FR]/CLAUDE.md:28-35`; `[H]/canonico/02-fluxo-operacional.md:22-31` | Adaptar | Uma tabela só, C0–C5 (N23), sem pular aprovação |
| C17 | Portões extras: dependência nova, apagar dado, mudança material do plano | `[FW]/AI_PROTOCOL.md:98-99, 167, 171`; `[H]/docs/superpowers/specs/2026-08-26-…-design.md:399-407` | Adaptar | Frases fixas (seção 8) |
| C18 | Critério de pronto com "sem expansão silenciosa de escopo" e "push e deploy continuam pendentes" | `[FW]/AI_PROTOCOL.md:231-242` | Igual | Entra no checklist da E11 |
| C19 | Varredura de conflitos antes de cada wave (tabela tarefa × tarefa, com arquivos e interfaces) | `[CI]/.superpowers/sdd/2026-09-11-atendimento-perfis-acesso/progress.md:6-20` | Igual | Seção obrigatória do plano |
| C20 | "Rulings" do orquestrador, com o custo se estiver errado | `progress.md:22-28`; hotfix do Agend, "Rulings 1-5" | Adaptar | Vira F8, com trava: decisão que muda status ou plano exige frase do humano (B17) |
| C21 | Registro do agente, do modelo e do id de cada despacho; RED medido; teste de mutantes | `progress.md` do hub e do Agend | Igual | Campos no F3 e no `estado.md` |
| C22 | Sintetizador de revisão que calcula o veredito | `[H]/scripts/synthesize-review-panel.mjs:73-104` | Adaptar | Falha fechada, revisores esperados, português, caminho com espaço (Q22) |
| C23 | Revisão final da branch inteira | `progress.md:59`; `08-…:138-143` | Igual | Já está no desenho (E10, Codex) |
| C24 | Lentes de revisão: OWASP 2025; tabela de padrões de segurança; lista de severidade de React; gate de 4 perguntas antes de reportar; prova obrigatória para ALTO e CRÍTICO; "zero achados é válido" | `security-auditor.md:64-77`; `[FR]/.claude/agents/security-reviewer.md:55-69`; `react-reviewer.md:13-16`; `[FR]/.claude/agents/code-reviewer.md:21-66` | Adaptar | Dentro das duas personas de revisão, sem agentes novos. **Não** trazer a política do ECC "ALTO = WARNING, pode mergear" |
| C25 | Regra de segurança completa (faça e não faça, 73 linhas) | `[CI]/.claude/rules/06-security.md` | Adaptar | Lente do `security-reviewer` |
| C26 | Rubrica de quando testar: teste o que pode quebrar (complexidade ciclomática ≥ 2); UI só de apresentação pode pular | `[CI]/.claude/rules/05-testing.md:28-37, 50-59` | Decidir | Conflita com "teste primeiro em tudo" do kit (DP-05) |
| C27 | Regras para quem escreve hook (multiplataforma, resolução de `cwd`) | `hooks-cross-platform.md`; `hooks-cwd-resolution.md` | Igual | Só no repositório do kit |
| C28 | Grafo global com contrato por âncora exata, sem LLM | `[KN]/.central-iso/graphify/README.md:95` | Adaptar | Perfil opcional: roda na E2 (`impact`) e na E11 (`sync`), nunca no Stop |
| C29 | Cofre do ecossistema para decisões transversais (ADR com `decision_id` e `affected_components`) | `[KN]/30-Decisoes-Transversais/` | Decidir | Depende da topologia do cofre (DP-02) |
| C30 | Ideias do pipeline de memória: sucesso só com prova da ferramenta; impressão digital contra duplicata; guarda de wikilink quebrado; trava ao escrever no cofre | `[CI]/.claude/scripts/compile-runner.mjs:13-75`; `[CI]/.claude/memory/sdk-subsession-mcp-tools.md` | Ideia | Não trazer o pipeline (O02) |
| C31 | Conferir `built_at_commit` do grafo contra o HEAD | `verify-on-stop.mjs:219-225` | Igual | No `memoria-check` da E11 (B21) |
| C32 | `graphify extract --code-only` (evita LLM em arquivo que não é código) | `[KN]/.central-iso/graphify/README.md:28` | Decidir | Testar o custo em `graphify-out/cost.json` |
| C33 | Playwright E2E repetível na validação | `[H]/…design.md:353-355, 383-384` | Decidir | Conflita com o kit, que desliga o MCP do Playwright (DP-06) |
| C34 | `documentation-writer` usado de verdade num hotfix (runbook) | hotfix do Agend, `progress.md` | Adaptar | Dono do runbook = `devops-engineer`; do README = implementador da área (DP-07) |
| C35 | `code-archaeologist` (mapa de código legado, só leitura) | `[CI]/.claude/agents/code-archaeologist.md` | Decidir | Ajudaria a E2 em repositório legado grande (DP-07) |
| C36 | Bloqueio de comando destrutivo fora do git (`rm -rf /`) | `central-iso-pretooluse.mjs:15` | Adaptar | Com a borda certa: hoje bloqueia também `rm -rf /tmp/x` |
| C37 | Doctor que confere o frontmatter de todas as notas do cofre | `[KN]/.central-iso/bootstrap/doctor.mjs:276` | Ideia | Somar ao modo strict que o kit já tem |

---

## 4. O melhor da Central, em ordem de valor

1. **C01** Hash da aprovação. É o que impede a SPEC de mudar depois de aprovada.
2. **C02 + C03** Bloqueio amplo de `.env` e os padrões de segredo.
3. **C07 + C08** Ponte entre Superpowers e persona. Resolve o `general-purpose`.
4. **C05 + C06** Modelo fixo por agente, em três níveis.
5. **C14** Checklist de deploy feito de erros reais.
6. **C19 + C20 + C21** Práticas reais das waves: varredura de conflitos, Rulings, registro de agente e modelo, RED medido.
7. **C22** Sintetizador, corrigido. Deixa o veredito mecânico.
8. **C10 + C11 + C13** Manifesto com sha256, recusa de sobrescrever, doctor.
9. **C24 + C25** Lentes de revisão de segurança, React e o gate de prova do ECC.
10. **C17 + C18** Portões extras e critério de pronto.
11. **C28** Grafo global, como perfil opcional.
12. **C16** Classificação do pedido.

---

## 5. O que a Central tem de ruim (não trazer; apagar ou arquivar na migração)

Gravidade: **A** alta, **M** média, **B** baixa.

### 5.1 Quebrado ou arriscado

| ID | Achado | Evidência | Grav. |
|---|---|---|---|
| Q01 | **Frete:** `guard-main-branch` devolve `permissionDecision: "allow"` para commit e push na `main`, com a mensagem "blocked". `allow` pula o pedido de permissão. Conferido no código | `[FR]/.claude/hooks/guard-main-branch.mjs:81`; registrado em `[FR]/.claude/settings.json:80` | **A** |
| Q02 | Aprovação forjável sem aprovação prévia: a regex de "somente leitura" só olha o começo do comando (`git status && npm install x`, `ls; rm -rf src` passam). `find … -exec shasum` + `cat > .central-iso/state/harness-approval.json` gravam um state válido. O state está no `.gitignore`, então não fica rastro | `central-iso-pretooluse.mjs:64-65, 72`; `[CI]/.gitignore` | **A** |
| Q03 | O gerador de manifesto aceita `--approved-by` de qualquer um, e foi usado num brief real | `[H]/scripts/generate-approval-manifest.mjs:13, 38-48`; `[AG]/.superpowers/sdd/2026-09-29-…/task-11-brief.md:300` | **A** |
| Q04 | Aprovação sem prazo, sem demanda, sem sessão e sem limite de arquivos: um arquivo por repositório, `sessionId` só precisa não ser vazio | `central-iso-pretooluse.mjs:72, 88, 90` | **A** |
| Q05 | Crash libera: com a SPEC aprovada apagada ou virada diretório, o `readFileSync` (fora de try) lança exceção, o processo sai com 1 e a ação segue | `central-iso-pretooluse.mjs:105` | **A** |
| Q06 | O hook usa `event.cwd` antes de `CLAUDE_PROJECT_DIR`: depois de `cd /tmp/x` com um state forjado, um Write no hub é validado contra `/tmp/x` | `central-iso-pretooluse.mjs:71` | M |
| Q07 | Raiz controladora sem gate: `allow` de `git add/commit/merge/rebase/checkout/tag`, `defaultMode: auto` (a documentação diz que `auto` no settings de projeto é ignorado; o risco real é o modo do usuário, que o inventário mostra). Sessão aberta na raiz pode não carregar as travas dos repositórios (não documentado; teste na seção 11) | `[R]/.claude/settings.json:8-23` | **A** |
| Q08 | Hook de aprovação desprotegido: com qualquer aprovação valendo, o agente reescreve o próprio hook | — | **A** |
| Q09 | Commit liberado para qualquer sessão (`allow` de `git commit`). "Implementador não commita" é só texto | `[CI]/.claude/settings.json:13-14` | **A** |
| Q10 | Só `git push --force*` é negado. `git push -f` e `git push origin +main` passam | `settings.json:26`; `central-iso-pretooluse.mjs:15` | **A** |
| Q11 | O gate é pulado com árvore limpa: commitar antes do Stop pula os testes. Não há pre-commit | `verify-on-stop.mjs:338` | **A** |
| Q12 | No segundo Stop com o mesmo estado, o gate libera (`stop_hook_active`) | `verify-on-stop.mjs:322, 333` | M |
| Q13 | O teto de 350 linhas nunca é aplicado ao código. O "gate eslint-quality" só roda o autoteste da regra; o "quality/max-lines: ok" do relatório é o autoteste | `[H]/auditoria/wave-reports/ROLLOUT_mod_ctp_atp_check_final.txt` | **A** |
| Q14 | Issue 7 aberta e testada como correta ("barrel files are never checked") | `[T]/…/eslint-rules/utils.cjs:35`; `verify.mjs:56` | M |
| Q15 | Regras de domínio trocadas: o hub recebe "Agendamento é satélite… não acesse o banco da Central"; os módulos recebem a regra do hub | `[CI]/.claude/rules/module-central-iso.md:2, 13-14` | **A** |
| Q16 | Regra que promete trava inexistente: `obsidian.md` diz que o `vault-guard` bloqueia, mas ele não está ligado nos repositórios. Notas do cofre já foram alteradas direto | `[CI]/.claude/rules/obsidian.md:23`; `[H]/docs/superpowers/plans/2026-08-30-…-final-report.md:79` | **A** |
| Q17 | `secret-scan` desligado. A regex do pretool tem falso positivo (`src/task-management-dashboard-panel.jsx`, `rm -rf /tmp/build-cache`) e brecha (`cat backend/.e*v` passa) | `central-iso-pretooluse.mjs:15` | **A** |
| Q18 | O `.worktreeinclude` copia o `.env` para cada worktree novo, que ninguém limpa | `.worktreeinclude` do hub, Agend, CTP e Frete | **A** |
| Q19 | Lacunas no `.gitignore`: `.claude/worktrees/` (1,4 GB no hub), `.claude/scheduled_tasks.lock`, `.claude/state/`, `.env.production`; `.env.local` no Agend; o Frete não ignora logs nem `graphify-out/` (HIPÓTESE sobre o que já está versionado: a cópia não tem `.git`) | `.gitignore` de cada repositório | M |
| Q20 | O índice de memória não carrega no hub, no Agend e no CTP: nenhum `CLAUDE.md` deles importa `.claude/memory` | `[CI]/.claude/memory/INSTRUCTIONS.md:3`; só `[FR]/CLAUDE.md:112-113` importa | **A** |
| Q21 | Um nome `obsidian` global para dois cofres; o `bootstrap --configure-global` sobrescreve o global do Claude e do Antigravity apontando para o Knowledge. HIPÓTESE: ou a Central escreve no cofre pessoal, ou o cofre pessoal foi trocado. Teste: `claude mcp get obsidian` (parte do inventário `modo-facil/00`) | `[KN]/.central-iso/bootstrap/bootstrap.mjs` (`configureGlobalMcp`); `[CI]/.claude/hooks/vault-orient.mjs:20-27` | **A** |
| Q22 | O sintetizador de revisão falha aberto: linha fora do formato some em silêncio, e "nenhum achado sobreviveu" casa com o marcador de aprovado. Um revisor que escreveu CRÍTICO em português gera APROVADO | `[H]/docs/14_REVIEW_PANEL_EXECUTOR.md:41-43`; `validate-review-panel.mjs:25, 28` | **A** se usado |
| Q23 | Cofre e padrão sem cópia fora do Mac: Knowledge sem remoto e com 85 alterações pendentes; Harness não é git; o pipeline **apaga** as dailies depois de promover | `[CI]/.claude/scripts/compile-runner.mjs:955` | **A** (perda irreversível) |
| Q24 | Pipeline de dailies falha calado: pendências de 10 e 11/09 nunca reprocessadas, uma com OAuth expirado ("recovery is manual/forensic by design") | `[CI]/.claude/hooks/log/pending/03881716-….json`; `[CT]/.claude/hooks/log/pending/ce0e015b-….json`; `session-log-runner.mjs:176` | M |
| Q25 | O resumo da conversa (cerca de 64 mil caracteres) fica em texto puro em `log/pending/` quando a escrita falha. Pode conter algo sensível | idem | M |
| Q26 | Frete fora de tudo: fora dos destinos do Harness, do `ecosystem.json` e do manifesto YAML; placeholders `__OBSIDIAN_VAULT_DIR__` nunca trocados; `.mcp.json` local, que o doctor reprova; outra geração de harness (faltam 19 dos 21 agentes) | `[H]/scripts/harness-lib.mjs:71-79`; `[FR]/CLAUDE.md:119` | M |
| Q27 | Três registros de projetos que não batem. O `project.json` do modelo usa `projectId`, mas a descoberta exige `id`: módulo novo não é descoberto | `[T]/.central-iso/project.json:3`; `[KN]/.central-iso/bootstrap/lib/common.mjs:92` | M |
| Q28 | Inventário de templates desatualizado: declara 105 arquivos, existem 116; lista 4 que não existem | `[H]/templates/template-inventory.json` | B |
| Q29 | Caminho absoluto `/Users/joaogabrielaragaodesouza/Desktop/Projetos` no código e dentro de modelo | `harness-lib.mjs:6`; `[H]/templates/knowledge-root/.central-iso/graphify/registry.local.json:3` | M |
| Q30 | `CLAUDE_INVOKED_BY` desliga `vault-guard`, intake e orient, e qualquer processo pode setar | `vault-guard.mjs:11` | M |
| Q31 | O Graphify bloqueia o fim do turno por motivo que não é qualidade (grafo fora do HEAD, dispatcher faltando) | `verify-on-stop.mjs:385-400` | M |
| Q32 | O doctor exige configuração global (`defaultMode=auto`, MCP e plugins de usuário, skills globais). Contra o D10 | `doctor.mjs:373, 418-421, 444-447, 781` | M |
| Q33 | Servidor do cofre de terceiro, baixado na hora, fixado em commits diferentes na Central (`ada4352`) e no kit (`6e2916e`) | `vault-pipeline-shared.mjs:26`; `[K]/kit-claude-code/dot-mcp.json:8` | M |
| Q34 | HIPÓTESE: Codex e OpenCode abertos num repositório da Central não acham constituição (o `AGENTS.md` fica escondido e o verify reprova na raiz). Teste na seção 11 | `[H]/scripts/verify-harness.mjs:33-34` | M |
| Q35 | `frontend/CLAUDE.md` e `backend/CLAUDE.md` mandam ler `../AGENTS.md`, que não existe; o README aponta para arquivos que não estão na raiz | `[CI]/frontend/CLAUDE.md:3`; `[CI]/README.md:9-14` | B |
| Q36 | HIPÓTESE: imports `@.claude/rules/...` relativos errados. Teste: `/memory` numa sessão no hub | `[CI]/.central-iso/instructions/CLAUDE.md:4-6` | B |
| Q37 | As ferramentas de drift não veem o Frete e contam worktrees (1.945 arquivos falsos no relatório do hub) | `harness-lib.mjs:37, 71-79` | B |
| Q38 | O intake bloqueia o humano por palavra ("token", "senha", "sync", "limpeza"), e o CTP trabalha com token de SSO e do Sankhya | `central-iso-userprompt-intake.mjs:158-165`; `[H]/scripts/intake-prompt.mjs:83-84` | M |
| Q39 | **Na prática:** o orquestrador tratou um `BLOCKED` como `DONE`, e em outra execução desviou do plano aprovado só registrando um ADR. É exatamente o erro que o Gabriel quer conseguir enxergar | `[CI]/.superpowers/sdd/2026-09-11-…/progress.md:34-39`; hotfix do Agend, "Ruling 5" | **A** |
| Q40 | A Central é JS sem `typecheck` nem `lint:types`; o backend não tem lint; o Agend não tem lint no gate | `[CI]/docs/harness/strategies.md:15-16`; `[CI]/backend/CLAUDE.md:15-16` | **A** (bloqueia a migração) |
| Q41 | No Antigravity, os workflows param de funcionar em **19/10/2026**. A Central tem `.agents/workflows/` em cinco lugares (raiz, hub, Agend, CTP, Frete). O comando `/migrate-workflows` do Antigravity converte em skills | `.agents/workflows/` (conferido no Mac); documentação do Antigravity (seção 11) | M (prazo em 5 dias) |

### 5.2 Oneroso

| ID | Achado | Evidência |
|---|---|---|
| O01 | `verify-on-stop`: build, testes e Graphify, até 900 s, em todo Stop com qualquer diferença (até em `.md`) | `verify-on-stop.mjs:338-350`; timeout no settings |
| O02 | Pipeline de dailies por LLM: cerca de 3.575 linhas copiadas em 4 lugares; SDK de 325 a 341 MB por repositório (1 a 1,36 GB no total); Sonnet no SessionEnd e até 5 sub-sessões de 20 turnos no SessionStart; só no Claude Code; depende de OAuth e rede | `session-log-runner.mjs:229`; `compile-runner.mjs:460, 729` |
| O03 | Contexto repetido: `graphify-orient` em todo Read ou Grep de código (5 linhas, sem deduplicar); `vault-orient` em todo prompt (7 linhas); na raiz, `workspace-context` varre o disco até profundidade 7 a cada prompt, mais `orchestration-mode` | `graphify-orient.mjs:179-186`; `vault-orient.mjs:20-28`; `[R]/.claude/hooks/workspace-context.mjs:16-50` |
| O04 | Regex `.env` sobre o JSON inteiro bloqueia `.env.example` e README com `cp .env.example .env` (atrito real registrado no cofre) | `central-iso-pretooluse.mjs:15` |
| O05 | `validate-settings-schema` baixa o schema pela rede a cada edição de settings (ligado no Frete) | `validate-settings-schema.mjs:125` |
| O06 | 10 plugins ligados, inclusive o `aia-harness`, com a raiz dizendo "não execute `/aia-harness:init`" | `[T]/.claude/settings.json`; `[R]/CLAUDE.md` |
| O07 | Cerca de 24 KB de regras sempre carregadas (HIPÓTESE: uns 6 mil tokens), mais 26 a 29 skills locais | `[T]/.claude/rules/` |
| O08 | Spec da Central com 1.113 linhas, 38 critérios, máquina de 22 estados e um `approvalProvider` que nunca foi implementado | `[H]/…design.md:336-362, 409-415` |
| O09 | Regra de waves com 150 linhas em inglês para o que o `ondas.md` do kit diz em 57 | `[CI]/.claude/rules/08-…` |
| O10 | 1,4 GB de worktrees velhos no hub; `.superpowers/sdd/` acumulando sem limpeza | `[CI]/.claude/worktrees`; `[AG]/.superpowers/sdd` |
| O11 | Dois processos node por Read ou Bash (pretool + orient). O kit tem quatro por Write (N33) | settings |

### 5.3 Duplicado

| ID | Achado |
|---|---|
| DU01 | 21 agentes por repositório, em 3 repositórios, mais 14 na raiz; 14 deles com o mesmo corpo de 18 linhas |
| DU02 | Segurança em seis papéis (`security-reviewer`, `security-auditor`, `penetration-tester`, o ECC do Frete, o do kit e o subagente do Codex na E10), cada um com severidade própria |
| DU03 | Revisão de código em sete papéis (`code-reviewer`, `js-ts-reviewer`, `react-reviewer`, o ECC do Frete, o revisor do Superpowers, o do kit e o subagente do Codex na E10) |
| DU04 | Browser e QA em quatro (`qa-automation-engineer`, `validador-visual`, `browser-tester` e `ui-reviewer` só na spec) mais o Impeccable; exploração em dois; produto em três (`product-manager`, `product-owner`, `tech-lead`); depuração em dois |
| DU05 | Plugin `quality/*` em cinco cópias idênticas (modelo, hub, Agend, CTP, kit) |
| DU06 | `hook-io` com três APIs (`readHookEvent`, `parseHookEvent`, `run`) e duas cópias por repositório |
| DU07 | `vault-guard` em duas versões: a da raiz está ligada e é fraca; a do repositório é forte e está desligada |
| DU08 | Segredo em três regex diferentes; pretool em três cópias (uma morta no CTP) |
| DU09 | Skills sem dono: hub e Agend idênticos (248 KB); o CTP tem outro conjunto, com 5 arquivos de mesmo nome e conteúdo diferente; o Frete tem outro |
| DU10 | Regras repetidas no mesmo repositório (`testing.md` + `05-testing.md`; `parallel-…` + `08-parallel-…`); 5 regras e 14 agentes da raiz iguais aos do repositório |
| DU11 | Quatro mecanismos de distribuição; duas cópias do controlador da raiz; duas do grafo, inclusive o `registry.local.json` com caminho absoluto |
| DU12 | Três destinos para a memória do agente: `.claude/memory/` (teto 130), `.agents/memory/` via `/remember` (teto 200) e a memória nativa (`autoMemoryEnabled`) |
| DU13 | Duas variáveis para o mesmo cofre (`CENTRAL_ISO_VAULT` e `CENTRAL_ISO_VAULT_PATH`/`OBSIDIAN_VAULT_PATH`) |
| DU14 | Memória sobre o próprio harness gravada dentro do repositório de produto (iguais no hub e no Agend) |
| DU15 | `graphify-ecosystem-sync.mjs` e `install-plugins.mjs` em três cópias; `.agents/rules/graphify.md` em quatro, mais uma variante |
| DU16 | Dois hooks no Stop (um lembrete inútil e o gate real); teto de 350 linhas em dois lugares (`large-file-warning` e ESLint) |
| DU17 | Esquema de aprovação e heurística de intake "duplicados de propósito" entre hook e biblioteca. O risco de divergência está declarado no próprio código |

### 5.4 Contraditório ou obsoleto

| ID | Achado |
|---|---|
| X01 | Nove textos de fluxo: `[R]/AGENTS.md`, `[FW]/AI_PROTOCOL.md`, `[CI]/.central-iso/instructions/AGENTS.md`, `[H]/docs/02_FLUXO_PROMPT_PARA_EXECUCAO.md`, a máquina de estados da spec, `[H]/canonico/02-fluxo-operacional.md`, `detalhamento_modulo.md`, `detalhamento_manutencao.md`, e os comandos `/create` e `/enhance` |
| X02 | "V.E.E.I.E combinado com Superpowers" nas instruções e no modelo (então volta a cada sincronização) × "V.E.E.I.E não governa este repositório" × a decisão que rejeitou manter os dois |
| X03 | `AI_PROTOCOL.md` é "registro histórico" num lugar e "comportamento obrigatório" em outro |
| X04 | SPEC obrigatória × condicional ("quando houver ambiguidade"). Na prática, o próprio agente decide se precisa |
| X05 | Uma aprovação × duas; o `/create` não para para aprovar o plano |
| X06 | Commit por tarefa × por onda × "ONE combined commit" |
| X07 | Gates antes da revisão × depois |
| X08 | "Não crie outro brainstorm ou planejador" × `/brainstorm` e `/plan` instalados |
| X09 | RTK "referência futura" × RTK em uso |
| X10 | A spec diz que nenhum consumidor seria tocado antes dos 38 critérios; o rollout foi feito, e um "harness operacional 0.1" correu em paralelo |
| X11 | Git: `git-solo-main.md` (pode na `main`) × `guard-main-branch` (nega a `main`) × spec (exige branch) × "o agente faz o merge" |
| X12 | O Frete contradiz a si mesmo: "a sessão principal não implementa" × "implemente inline"; "mudança cirúrgica" × "corrija todo erro de lint da sessão, mesmo em arquivo que você não editou" |
| X13 | O gerador de plano diz "nenhum hash de aprovação gerado por script"; o gerador de manifesto gera |
| X14 | Obsoletos: `detalhamento_modulo.md` (esquema errado, pasta errada, `bootstrap.sh` que não existe, `git add .`, "agente faz merge"); `fluxo_criacao_modulo.md`; `/plan` (agente `project-planner` que não existe); `/remember` (caminhos que não existem, teto 200); `07-subagent-dispatch.md` (aponta para uma seção que não existe); docs 12 e 13 (caminho do state errado) |
| X15 | Nove vocabulários de saída (seção 8) |

### 5.5 Morto (existe e nada executa)

| ID | Achado |
|---|---|
| M01 | 20 hooks em `.claude/hooks/` sem registro: `check-deps-on-start`, `format-on-edit`, `gh-scope-guard`, `guard-main-branch`, `large-file-warning`, `memory-stop`, `orchestration-mode`, `rtk-hook`, `secret-scan`, `set-files-changed`, `sql-idempotent-review`, `subagent-model-guard`, `validate-settings-schema`, `vault-guard` e os `worktree-*`. Mais o intake, ligado só no CTP |
| M02 | `central-iso-stop` e `central-iso-posttooluse` só escrevem em stderr com exit 0; `central-iso-subagentstop` devolve um campo `reminder` fora do contrato. O teste consagra o no-op (seção 11 confirma o efeito) |
| M03 | `set-files-changed` obsoleto: o `verify-on-stop` usa `git diff` |
| M04 | `harness.json` com política ("commit exige aprovação humana") que nenhum código lê. É decorativa |
| M05 | 6 dos 8 testes de hooks ligados nunca rodam no gate, enquanto testes de hooks desligados rodam e dão falsa sensação de proteção |
| M06 | `.claude/.aia-harness-pending/` com atualização nunca aplicada |
| M07 | Biome 2.5.14 na raiz do CTP, morto e em conflito com o 1.9.4 do schema |
| M08 | Cópia legada do pretool no CTP, ignorada duas vezes no `.gitignore` |
| M09 | Geradores de intake, SPEC e plano sem uso fora dos testes das waves. O de plano devolve sempre as mesmas três tarefas fixas |
| M10 | `sync-harness --apply` bloqueado desde a Wave 3: a sincronização é manual, e daí vem o drift |
| M11 | No Frete, `compile`, `session-log`, `vault-*` e `gh-scope-guard` sem registro; scripts sem `package.json` |
| M12 | Backup solto `[R]/.claude/settings.json.central-iso-backup` |

---

## 6. O que o canônico tem de ruim (corrigir antes de usar em demanda real)

| ID | Defeito | Evidência | Grav. | Fecha em |
|---|---|---|---|---|
| N01 | **Travas falham abertas.** `run()` engole qualquer exceção e sai com 0. `mkdir -p docs/fluxo/x/estado.md` provoca EISDIR e libera todo código. Conferido no código | `[KC]/hooks/hook-io.mjs:51-61`; `plano-guard.mjs:30-35` | **A** | B03 |
| N02 | Aprovação escrita pelo próprio agente: `docs/` está em `LIVRE`, o `rules-guard` não protege `docs/fluxo/`, bastam três células preenchidas e a frase exata não é conferida | `plano-guard.mjs:18, 41` | **A** | B01 |
| N03 | Basta uma demanda aprovada para liberar qualquer código, e a liberação só acaba com "concluída" | `plano-guard.mjs:40, 61` | **A** | B02 |
| N04 | Sem hash: a SPEC pode mudar depois de aprovada | — | **A** | B01 |
| N05 | O `plano-guard` não olha Bash (`node -e`, `cat >`, `sed -i`, `tee`) | matcher sem Bash | **A** | B04 |
| N06 | Worktree: `.claude/worktrees/<n>/src/a.ts` casa com `^\.claude\/` em `LIVRE`, então o código fica livre de aprovação; o mesmo caminho escapa do `rules-guard` | `plano-guard.mjs:18` | **A** | B06 |
| N07 | Caminho "de fora" liberado (maiúscula no macOS, `/private/tmp` × `/tmp`, symlink). `ln -s .claude c` seguido de Edit em `c/hooks/…` passa | `hook-io.mjs:77-79`; `rules-guard.mjs:24` | M | B14 |
| N08 | `commit-guard` com atalhos: `git config alias.p push && git p`, `git -c alias.p=push p`, `sh -c "git push"`, `gh api -X PUT …/merge`, `gh pr create` | `commit-guard.mjs` | M | B13 |
| N09 | Nenhum hook olha a branch: commit na `main` passa | — | M | B13 |
| N10 | Sessão aninhada desliga tudo: `HARNESS_BYPASS=1 claude -p "…"` pelo Bash; ou `env.HARNESS_BYPASS` no settings de usuário, que fica fora do projeto e não é protegido | `hook-io.mjs` (`bypassed`) | **A** | B05 |
| N11 | O pre-commit sai com 0 sem `package.json` na raiz (o layout backend/ + frontend/ da Central); `typecheck` e `test` são só regra escrita; o pre-commit só roda `lint` | `[K]/.githooks/pre-commit:10-13` | **A** | B07 |
| N12 | Desligar regra por comentário inline passa (`/* eslint quality/max-lines: "off" */`); disable escrito pelo Bash passa; falta `noInlineConfig` | `rules-guard.mjs:32` | **A** | B15 |
| N13 | Isenção por nome fechada só em TS: `constants.js`, `types.js` e `enums.mjs` ficam isentos; as isenções de pasta (`locales/`, `migration(s)/`, `generated/`) e de `*.config.*`/`*.stories.*` nem estão documentadas; o selftest só testa `**/*.ts`; 351 linhas sem newline final passa | `eslint.config.mjs:31`; `selftest.mjs:41`; `utils.cjs:40` | **A** para a Central | B16 |
| N14 | Gate esvaziável sem tocar arquivo protegido: trocar `"lint"` por `"echo ok"` no `package.json`; editar `selftest.mjs`, `tsconfig*.json` ou `.agents/stack.md` | `rules-guard.mjs:15-27`; `pre-commit:16` | **A** | B07 |
| N15 | Segredo descoberto: `.env` fora do `.gitignore` do kit (e o instalador não acrescenta); deny só de `./.env` da raiz (`backend/.env` fica exposto); sem varredura; `git add .env` passa; um `.DS_Store` dentro do kit | `[K]/.gitignore:1-4`; `[KC]/settings.json:5-6` | **A** | B08 |
| N16 | Adaptadores de subagente sem `tools`, `model` e `skills`: herdam todas as ferramentas e o modelo da sessão (seção 11) | `[KC]/agents/*.md` | **A** | W4 |
| N17 | Nenhum hook olha o despacho de subagente: `general-purpose` passa, o `escopo-guard` não o reconhece e um revisor despachado assim fica sem restrição. O `escopo-guard` também ignora a sessão principal, então "o orquestrador não implementa" é só texto | `escopo-guard.mjs:11-19` | M | B10 |
| N18 | Sem hooks de Stop, SubagentStop, UserPromptSubmit e PostToolUse: relato do subagente, gates no fim e captura da aprovação não têm trava | `[KC]/settings.json` | **A** | B01, B07, B09 |
| N19 | Cinco mapas de papéis: `AGENTS.md`, `adaptadores.md:49-57`, `ondas.md:8`, `maestri/papeis.md`, `modo-facil/04`. A lista de mudanças do `[E13]` esquece `modo-facil/04`, `ondas.md:8`, `adaptadores.md:49-57`, `templates/ordem.md`, `templates/relatorio.md`, `README.md:13`, `origem.md:41`, `maestri/notas/*` e `docs/inventario/…:43` | `[E13]:182-195` | **A** (erro que não parece erro) | W5 |
| N20 | Templates errados ou ausentes: o `relatorio.md` é de ordem do Maestri e serve de relatório final; o `ordem.md` diz "Emitida por: Orquestrador (Codex)"; faltam `relatorio-final`, `revisao-final`, `deploy` e as personas do `devops-engineer` e dos três agentes externos | `templates/relatorio.md:3-4`; `templates/ordem.md:4-5` | M | W5 |
| N21 | Status em 3 valores no handoff × o contrato do Superpowers com 4, que o `ondas.md:57` manda manter | `templates/handoff.md:47` | M | seção 8 |
| N22 | O `debugger` não tem gatilho (só aparece na tabela do `AGENTS.md`); demanda pequena ainda exige o Codex na E0 (dois terminais, quatro colagens) | `fluxo.md:37-39`; `AGENTS.md:67` | M | W5 |
| N23 | Sem classificação do pedido: bug urgente e pergunta pura não têm caminho | `fluxo.md:9` | M | W5 |
| N24 | Sem portões para dependência nova, apagar dado e mudança de `Files:` no meio da wave | — | M | W5 |
| N25 | "Teste primeiro" para todo implementador, inclusive componente só de apresentação | `personas/frontend-specialist.md:10` | B | DP-05 |
| N26 | Codex, Antigravity e OpenCode sem cofre (sem MCP e com leitura direta proibida). O Codex define a demanda sem memória institucional | `adaptadores.md:71`; `AGENTS.md:100` | **A** | B20 |
| N27 | Memória sem trava para subagente: `.agents/memory/` fora do `rules-guard`; escrita MCP no cofre por subagente não bloqueada; `vault/daily/` sem dono; `vault/.obsidian/` e `graphify-out/` sem decisão no `.gitignore` | `rules-guard.mjs:15-26`; `escopo-guard.mjs:5-6` | M | W6 |
| N28 | Distribuição sem versão: não grava versão nem commit do kit no projeto; sem `verificar` e `atualizar`; arquivo removido do kit vira órfão; arquivo personalizado vira conflito em toda execução; `selftest.mjs` e `eslint-rules/` vão para a raiz do projeto; o modelo de nota de entrega fica em três lugares | `instalar-no-projeto.sh:49-51` | M | W7 |
| N29 | O selftest confere uma lista fixa de 6 hooks: um hook novo sem registro passa | `selftest.mjs:185-215` | M | B12 |
| N30 | Sem doctor de máquina nova. Não vêm com o clone: a aprovação do MCP (`enabledMcpjsonServers`, em `settings.local.json`) e o pre-commit (`core.hooksPath` exige rodar `sh .githooks/instalar.sh`) | `modo-facil/01:97-102`; `.githooks/instalar.sh:3` | M | W7 |
| N31 | Proveniência do plugin `quality/*` só com o commit, sem sha256 | `[K]/.agents/origem.md:3` | B | C09 |
| N32 | Biome: `stack.md:44` diz que é gate; `gates.md` e o README dizem que é formatador | `stack.md:44` | B | DP-09 |
| N33 | Três parsers de shell diferentes (`commit-guard`, `rules-guard`, `vault-guard`) e quatro processos node por Write | `commit-guard.mjs:10-21`; `rules-guard.mjs:52-67`; `vault-guard.mjs:18-35` | B | W1 |
| N34 | `lint:types` só na E8, depois da revisão: se reprovar, a revisão é refeita | `rules/gates.md` | B | P3 |
| N35 | As 6 regras de `.agents/rules/` não têm o frontmatter `trigger:` que o Antigravity exige. Pela documentação, ele as descarta em silêncio (arquivos conferidos no Mac; confirmar no Antigravity). As regras também citam nomes de ferramenta de um fornecedor só (`mcp__harness-vault__*`) | `.agents/rules/*.md` | **A** | B23 |
| N36 | Hooks de plugin e do usuário não são auditados; `enabledPlugins` não fixa `false`; `autoMemoryEnabled` não é declarado | `[KC]/settings.json` | M | B11 |
| N37 | O kit não é git; há uma pasta `.auditoria-tmp/` com cópia duplicada dentro dele (sujeira desta auditoria) | `[K]/.auditoria-tmp/` | B | W7 |

---

## 7. Brechas comuns aos dois: como fechar e como testar

Cada teste está no formato **entrada → resultado esperado**. Eles viram casos do selftest e, os que não dão para automatizar, viram o roteiro manual do teste de aceitação. "→ 2" quer dizer que o hook bloqueia (exit 2 ou `deny`).

### B01. A aprovação pode ser forjada pelo agente
- **Central:** Q02, Q03. **Canônico:** N02, N04.
- **Como fechar (defesa em camadas):**
  1. Um hook `UserPromptSubmit` reconhece a frase exata **digitada pelo Gabriel** (lista fechada na seção 8). Agente não dispara `UserPromptSubmit`.
  2. Na hora, o hook calcula o sha256 da SPEC e do plano e grava `docs/fluxo/<slug>/aprovacoes.json` com: frase, hash da SPEC, hash do plano, `session_id`, data, sha256 do prompt e uma assinatura HMAC com uma chave que fica fora do repositório.
  3. O arquivo é versionado (rastro no git) e protegido contra escrita do agente pelo `rules-guard` e pela guarda de Bash.
  4. O `plano-guard` exige assinatura válida e hash igual ao atual. A tabela do `estado.md` vira só espelho.
  5. Tech-lead e assistente nunca escrevem a frase de aprovação pronta para colar.
  6. A guarda de Bash bloqueia `maestri ask` cujo texto contenha uma frase de aprovação.
- **O que a documentação oficial mudou neste desenho (seção 11):**
  - O `UserPromptSubmit` **não** dispara só para o que o Gabriel digita. Dispara também com relatório de subagente, mensagem de outra sessão, `/loop` e tarefa agendada. Por isso o hook só aceita quando o prompt **inteiro** é exatamente a frase (o relatório de subagente chega embrulhado em outro texto), e a guarda impede o agente de mandar a frase para outra sessão (`SendMessage`, `maestri ask`). Falta um teste prático: ver se a entrada do hook traz algum campo que diga a origem do prompt.
  - O sandbox do Bash é imposto pelo sistema operacional (Seatbelt, no macOS) e aplica as regras de deny de `Read` e `Edit`. Os hooks rodam **fora** do sandbox. Então dá para negar ao Bash do agente a leitura da pasta da chave e o hook continuar lendo. A ferramenta Read do agente é barrada pelo deny de permissão.
- **Risco residual:** se o agente sair do sandbox (`dangerouslyDisableSandbox`) e ler a chave, ele assina. Fechar isso exige negar a saída do sandbox (DP-12). Sem sandbox, a guarda de Bash reduz o risco, mas não zera. A última camada é o git: `aprovacoes.json` só muda no mesmo commit da aprovação, e o validador da E10 confere isso.
- **Alternativa mais forte (DP-03, opção b):** a aprovação é um comando de uma linha que o Gabriel cola num terminal comum do Maestri, fora do Claude. O script exige teclado de verdade (TTY), mostra os dois hashes e pede confirmação. O Bash do agente não tem TTY. Custa uma colagem por aprovação.
- **Testes:**
  - linha de aprovação forjada no `estado.md`, sem `aprovacoes.json` → 2;
  - `aprovacoes.json` com HMAC errado → 2;
  - SPEC editada depois da aprovação → 2;
  - evento `UserPromptSubmit` com "Aprovo a SPEC x." → registro criado com os dois hashes;
  - evento `UserPromptSubmit` com a frase dentro de um texto maior (relatório de subagente) → nada gravado;
  - `SendMessage` do agente para outra sessão com a frase → 2;
  - Write do agente em `aprovacoes.json` → 2; `echo … > docs/fluxo/x/aprovacoes.json` pelo Bash → 2;
  - `maestri ask … "Aprovo a SPEC x."` → 2.

### B02. A aprovação não limita escopo nem expira
- **Central:** Q04. **Canônico:** N03.
- **Como fechar:** o `plano-guard` libera só caminhos que aparecem em `Files:` de tarefas de demandas aprovadas e não concluídas, e só quando a branch atual é a da demanda (`demanda/<slug>`).
- **Testes:** Write fora de qualquer `Files:` → 2; dentro → 0; arquivo de outra demanda ainda não aprovada → 2; arquivo certo na branch errada → 2.

### B03. As travas falham abertas
- **Central:** Q05. **Canônico:** N01.
- **Como fechar:** `run(body, { modo: "guarda" })` sai com 2 e mensagem clara quando há exceção numa ferramenta que altera arquivo (Write, Edit, MultiEdit, NotebookEdit, Bash). Hooks de contexto continuam falhando abertos. Toda trava ganha um timeout curto e o registro `"onFailure": "block"`, que faz o próprio Claude Code bloquear quando o hook falha ou estoura o tempo (exige Claude Code 2.1.295 ou mais novo; o doctor confere a versão). Sem isso, exit 1 e timeout deixam a ação passar (FATO, seção 11).
- **Testes:** `docs/fluxo/x/estado.md` como diretório → 2 (hoje dá 0); `docs/fluxo` como arquivo → 2; SPEC aprovada apagada → 2; stdin `{quebrado` num Write → 2; o mesmo num Read → 0.

### B04. Bash passa por cima de tudo
- **Central:** a regex só olha o começo. **Canônico:** N05.
- **Como fechar:**
  1. **Sandbox do Bash do Claude Code**, com escrita negada nos caminhos protegidos e leitura negada na chave e no `.env`. A seção 11 confirma: é imposto pelo macOS (Seatbelt), vem desligado por padrão e usa as regras de deny de `Read` e `Edit`. É a única camada que fecha de verdade. A saída do sandbox (`dangerouslyDisableSandbox`) precisa ser negada (DP-12).
  2. **Guarda de Bash**: bloqueia ou pede confirmação para interpretador com código inline (`node -e`, `python -c`, `perl -e`, `ruby -e`, `sh -c`, `bash -c`, `eval`, `xargs sh`), CLI de agente aninhada (`claude`, `codex`, `opencode`, `gemini`, `agy`) e qualquer comando com `HARNESS_BYPASS` ou `CLAUDE_INVOKED_BY`.
  3. O `plano-guard` passa a inspecionar redirecionamento e verbos de escrita (`>`, `>>`, `tee`, `sed -i`, `cp`, `mv`, `rm`, `install`, `dd`) com um parser único de shell.
- **Confiança:** alta para o sandbox, média para a guarda por padrão de texto. A própria documentação avisa que regra de deny de Bash não pega o programa chamado por caminho nem dentro de `sh -c`. Shell tem formas demais; regex reduz, não garante.
- **Testes:** `node -e "require('fs').writeFileSync('src/a.ts','x')"` → 2; `echo x > src/a.ts` sem aprovação → 2; `sed -i 's/a/b/' eslint.config.mjs` → 2; `ls && rm -rf src` → 2. Roteiro manual numa sessão real: `echo x >> eslint.config.mjs` falha com erro de permissão do sistema.

### B05. Sessão aninhada e outras CLIs não passam pelas travas
- **Central:** Q30. **Canônico:** N10.
- **Como fechar:** a guarda de Bash (B04, item 2). A trava que vale para **todas** as CLIs são os hooks do git (pre-commit, commit-msg, pre-push). Em cada outra CLI, ligar o equivalente nativo que ela tiver no escopo do projeto (seção 11).
- **Testes:** `HARNESS_BYPASS=1 claude -p x` → 2; `codex exec "…"` pelo Bash do Claude → 2; commit feito por outra CLI com lint quebrado → pre-commit sai com 1.

### B06. Sessão fora da raiz, worktree e terminal do Maestri com "responsabilidade"
- **Central:** Q07. **Canônico:** N06.
- **Como fechar:** o SessionStart confere se `CLAUDE_PROJECT_DIR` tem `AGENTS.md` e o settings do harness, e alerta se não tiver; os hooks tiram o prefixo `.claude/worktrees/<n>/` antes de aplicar as regras (confirmado na documentação: em worktree, `CLAUDE_PROJECT_DIR` aponta para a raiz principal e o `cwd` do hook para a raiz do worktree); na raiz controladora da Central, um PreToolUse nega mutação dentro dos repositórios filhos; o guia do Maestri diz para não usar "responsabilidade" no terminal do Claude Code.
- **Testes:** `Write .claude/worktrees/w/src/a.ts` sem aprovação → 2; `Write .claude/worktrees/w/eslint.config.mjs` → 2; numa sessão aberta na raiz da Central, `Write "Central ISO/src/x.js"` → 2.

### B07. A definição dos gates é desprotegida e os gates são incompletos
- **Central:** Q11, Q13. **Canônico:** N11, N14.
- **Como fechar:**
  - `PROTEGIDOS` passa a incluir `selftest.mjs`, `tsconfig*.json`, configs de vitest e jest, `.agents/stack.md`, `.agents/gates/` e `docs/fluxo/*/aprovacoes.json`.
  - `.agents/gates.lock` (protegido) guarda o sha256 dos scripts `lint`, `typecheck`, `lint:types` e `test`; o pre-commit compara.
  - O pre-commit percorre as pastas de código declaradas no manifesto. Sem `package.json`, falha. A única forma de pular é o manifesto declarar `docsOnly: true`.
  - O pre-push roda `typecheck`, `test` e `lint:types`. O push é do humano, então o custo cai na hora certa.
  - O Stop **não roda** gates: confere se existe um recibo dos gates para o estado atual da árvore e, se faltar, bloqueia uma vez e registra "PENDENTE: gates" no `estado.md`.
  - O Graphify roda no post-commit e nunca bloqueia.
- **Testes:** trocar `"lint"` por `"echo ok"` → o commit falha; Edit em `tsconfig.json` → 2; repositório com `backend/package.json` e sem `package.json` na raiz → o commit falha; teste quebrado → passa no commit e falha no push; Graphify ausente → commit e Stop passam; árvore suja sem recibo → Stop bloqueia; recibo do estado atual → Stop passa.

### B08. Segredo
- **Central:** Q17, Q18. **Canônico:** N15.
- **Como fechar:**
  - deny de `Read` e `Edit` (a documentação diz que regra de caminho em `Write(...)` nunca é consultada) para `./**/.env*` (com exceção de `.env.example`), `./**/secrets/**`, `./**/*.pem` e `./**/.token`;
  - `secret-scan` no PreToolUse de Write, Edit e Bash, com regex unificada e borda de palavra;
  - `.env*` no `.gitignore` do kit, com `!.env.example`;
  - `commit-guard` bloqueia `git add` de `.env*`;
  - pre-commit roda `gitleaks protect --staged` e **falha se o gitleaks não estiver instalado**;
  - tirar `.env` do `.worktreeinclude`.
- **Testes:** Write com `AKIA` + 16 caracteres → 2; `git add backend/.env` → 2; Read de `backend/.env` → negado; `cat backend/.env` → 2; commit com segredo no stage → 1; caminho `src/task-management-panel.tsx` → 0 (sem falso positivo).

### B09. O relato do subagente não é exigido por trava
- **Central:** M02. **Canônico:** N18.
- **Como fechar:** o SubagentStop identifica a persona e roda `validar-saida.mjs` sobre o arquivo de relato (F3 para implementador, F4 para revisor). Se faltar campo ou houver incoerência, devolve `decision: block` com a lista. Os campos que o evento traz estão na seção 11.
- **Testes:** SubagentStop de `backend-specialist` sem relato → block; relato com `STATUS: CONCLUIDA` e `lint: EXIT 1` → block; relato completo e coerente → 0.

### B10. A sessão principal implementa; despacho `general-purpose`
- **Central:** DU01, revisores com Bash. **Canônico:** N16, N17.
- **Como fechar:** o `escopo-guard` trata a sessão principal como orquestrador (escreve em `docs/`, `.agents/memory/` e no cofre pelo MCP; código → 2). Uma guarda PreToolUse no despacho de subagente aceita só `subagent_type` da tabela de personas, com modelo explícito ou no frontmatter. Cada adaptador fixa `model`, `tools` e `skills` (os três campos existem, seção 11). Campo com nome errado é ignorado sem erro, então o selftest confere os nomes dos campos.
- **Testes:** sessão principal com `Write src/a.ts` → 2; despacho com `general-purpose` → 2; persona sem modelo → 2; selftest confere `model:` em todos os adaptadores.

### B11. Hooks de plugin e configuração global não são auditados
- **Central:** O06. **Canônico:** N36.
- **Como fechar:** `enabledPlugins` com `false` explícito no projeto para os plugins que registram hooks e não fazem parte da esteira; o doctor avisa se o `~/.claude/settings.json` tem `disableAllHooks`, hooks de terceiros ou `env.HARNESS_BYPASS`.
- **Testes:** plugin com hook marcado `true` → selftest falha; `disableAllHooks: true` no settings de usuário → doctor acusa.

### B12. O teste de registro de hooks é incompleto
- **Central:** M01, M05. **Canônico:** N29.
- **Como fechar:** todo `*.mjs` em `hooks/` está registrado no settings ou numa lista explícita de bibliotecas; todo caminho registrado existe.
- **Testes:** criar `hooks/dummy.mjs` → selftest sai com 1; apagar um hook registrado → 1.

### B13. Commit, push, merge e branch
- **Central:** Q09, Q10, X11. **Canônico:** N08, N09.
- **Como fechar:** lista de **permitidos** de subcomandos git para a sessão principal (`status`, `diff`, `log`, `show`, `add <arquivos>`, `commit -m`, `rev-parse`, `switch -c demanda/*`); bloquear `git config alias.*`, `-c alias.*`, git dentro de `sh -c` ou `eval`, `gh api` com merge, `gh pr create`, `git push -f` e `+ref`; commit só em `demanda/*`, no hook e também no pre-commit.
- **Testes:** cada uma dessas strings → 2; commit na `main` → 2 no hook e 1 no pre-commit; commit em `demanda/x` → 0.

### B14. Caminho por symlink ou grafia diferente
- **Canônico:** N07.
- **Como fechar:** `realpath` do ancestral que existe; comparação sem diferenciar maiúscula no macOS; "fora do projeto" só o que continua fora depois do `realpath`; bloquear `ln -s` cujo destino é pasta protegida.
- **Testes:** `ln -s .claude c` → 2; Edit `c/hooks/x.mjs` → 2; o mesmo arquivo por `/private/tmp/…` e por `/tmp/…` → mesmo resultado.

### B15. Desligar o lint por comentário
- **Canônico:** N12. **Central:** não tem proteção nenhuma.
- **Como fechar:** `linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" }`. Vale para qualquer CLI e qualquer forma de escrita.
- **Testes:** arquivo com `/* eslint quality/max-lines: "off", max-lines: "off" */` e 400 linhas → lint falha; `// eslint-disable-next-line` + `console.log` → lint falha.

### B16. Arquivo isento pelo nome ou pela pasta
- **Central:** Q14. **Canônico:** N13.
- **Como fechar:** isenção por nome desligada em todas as extensões JS e TS; `max-lines` nativo também para `*.config.*`, `*.stories.*`, `*.conf.*`, `locales/`, `migration(s)/` e `generated/` dentro das pastas de código; `"eol-last": ["error", "always"]`; selftest em `**/*.{js,jsx,mjs,cjs,ts,tsx}`.
- **Testes:** `constants.js` com 400 linhas → falha; `enums.mjs` com 400 → falha; `app.config.ts` com 400 → falha; `src/x/migration/a.ts` com 400 → falha; 351 linhas sem newline final → falha.

### B17. O orquestrador muda status ou plano sozinho
- **Central:** Q39. **Canônico:** sem regra.
- **Como fechar:** formato F8. O `validar-saida.mjs` confere o histórico do `estado.md`: `BLOQUEADA` só vira `CONCLUIDA`, e desvio de `Files:` ou de critério de aceite só acontece, com "Aprovo a decisão D-NN." capturada pelo `UserPromptSubmit`. Fora isso, volta para a E4.
- **Teste:** `estado.md` com transição `BLOQUEADA → CONCLUIDA` sem a frase → o validador sai com 1.

### B18. Vocabulário de saída aberto
- **Central:** X15. **Canônico:** N21.
- **Como fechar:** vocabulário único e formatos F1–F10 (seção 8), conferidos pelo `validar-saida.mjs`.
- **Teste:** relato com "DONE", "Approved" ou "WARNING" → o validador sai com 1.

### B19. Revisores podem ler o relato um do outro
- **Canônico:** regra sem trava (`personas/code-reviewer.md:10`). **Central:** não tem regra.
- **Como fechar:** o `escopo-guard` bloqueia, durante a E6, a leitura do arquivo de revisão de outro revisor, pela persona. Pelo Bash, só o sandbox fecha.
- **Teste:** `code-reviewer` com `Read revisao-wave-2-security-reviewer.md` → 2.

### B20. Memória e cofre fora do Claude Code
- **Central:** só Claude e Antigravity por MCP global. **Canônico:** N26.
- **Como fechar:** MCP do cofre no escopo do projeto em cada CLI, gerado de uma fonte só: `.codex/config.toml` (`[mcp_servers]`, exige projeto confiável), `opencode.json(c)` (`mcp.servers` na V2) e `.agents/mcp_config.json` (Antigravity). Segredo nunca no arquivo. Onde não der, leitura direta do `vault/` liberada por regra e escrita só pelo Claude Code.
- **Teste:** em cada CLI, "busque no vault a nota X e diga a primeira frase" → resposta certa; depois, `git status --short` vazio.

### B21. O fechamento da memória é só uma caixinha
- **Central:** Q20, Q24. **Canônico:** N27.
- **Como fechar:** `.agents/bin/memoria-check.mjs`, chamado no fim da E11 e antes do merge. Confere: nota em `vault/01-projetos/<slug>/`; a nota cita os hashes dos commits da branch; frontmatter válido; `MEMORY.md` com no máximo 130 linhas; `graphify-out/graph.json` com `built_at_commit` igual ao HEAD.
- **Testes:** demanda sem nota → 1; nota sem os hashes → 1; grafo atrasado → 1; tudo certo → 0.

### B22. O agente pode desligar as travas pelo settings local (achado novo, vindo da documentação)
- **Por quê:** o Claude Code recarrega os arquivos de settings assim que eles mudam, e o `.claude/settings.local.json` (fora do git) tem precedência sobre o settings do projeto. Um agente que escreve ali `disableAllHooks: true`, ou um `allow` amplo, desliga as travas na hora, sem rastro no git. Vale para os dois harness. Na Central, nada protege o settings.
- **Como fechar:** o `rules-guard` protege `.claude/settings*.json`, inclusive o local (conferir se a regex atual pega o `.local`); o sandbox nega escrita em `.claude/`; o SessionStart e o doctor avisam se o `settings.local.json` tiver qualquer chave além de `enabledMcpjsonServers`.
- **Testes:** Write em `.claude/settings.local.json` → 2; `echo '{}' > .claude/settings.local.json` pelo Bash → 2 (e erro de permissão do sistema, com o sandbox ligado); `settings.local.json` com `disableAllHooks` → SessionStart e doctor acusam.

### B23. Agentes externos sem trava, e configuração que depende de confiança por máquina
- **Central:** Q34; a regra do Antigravity diz que "o Stop executa" a sincronização do grafo, mas Stop é hook do Claude Code. **Canônico:** N26, N35; "agente externo só escreve em `docs/`" é só texto (`adaptadores.md:59-65`).
- **Por quê:** a documentação de 2026 mostra que Codex, Antigravity e OpenCode têm hooks no escopo do projeto. Dá para travar os três, cada um no seu formato. Mas o Codex e o Antigravity só carregam a configuração do projeto depois que o Gabriel confia nele, naquela máquina, e essa confiança não vem no git.
- **Como fechar:**
  - o núcleo das guardas fica neutro, em `.agents/guardas/`, com um adaptador fino por CLI: `.claude/settings.json`, `.codex/hooks.json`, `.agents/hooks.json` (Antigravity) e um plugin em `.opencode/plugins/`;
  - Codex, OpenCode e Antigravity só escrevem em `docs/fluxo/<demanda>/relatorios/` e `docs/definicao/`;
  - regras com `trigger:` para o Antigravity;
  - passo de onboarding "confiar no projeto" em cada CLI, conferido pelo doctor;
  - versões das CLIs fixadas no manifesto.
- **Testes:** em cada CLI, pedir para criar `src/x.ts` → o hook dela bloqueia; perguntar "qual é a regra 1 sem exceção?" → a resposta cita o `AGENTS.md`; no Codex, `codex debug prompt-input` mostra o `AGENTS.md` e o config do projeto carregados; no Antigravity, as regras de `.agents/rules/` aparecem como ativas.

---

## 8. Vocabulário único e formatos fixos (F1–F10)

**Princípio:** cada saída tem campos com nome fixo, valores de uma lista fechada e ordem fixa. O Gabriel, ou um script, confere a saída contra fatos que o agente não controla: `git status`, código de saída, `estado.md`, `aprovacoes.json` e a lista de `Files:`.

### Vocabulário (vale para todos os formatos)

| Campo | Valores permitidos | Tradução do Superpowers e da Central |
|---|---|---|
| `STATUS` (tarefa) | `CONCLUIDA`, `CONCLUIDA_COM_RESSALVA`, `PRECISA_CONTEXTO`, `BLOQUEADA` | DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED |
| `SEVERIDADE` | `CRITICO`, `ALTO`, `MEDIO`, `BAIXO` | CRITICAL, HIGH, MEDIUM, LOW. "Important" = `ALTO`. "Minor" = `BAIXO` |
| `VEREDITO` (calculado por script, nunca opinado) | `BLOQUEADO` (há CRITICO ou ALTO), `APROVADO_COM_RESSALVA` (há MEDIO), `APROVADO` | APPROVE, WARNING e BLOCK **não valem** |
| `ETAPA` | `E0` … `E13`, `CONCLUIDA` | nada além disso |

### Frases do humano (lista fechada, capturadas pelo `UserPromptSubmit`)

| Frase | Efeito |
|---|---|
| `Aprovo a SPEC <slug>.` | Grava a aprovação com o hash da SPEC |
| `Aprovo o plano <slug>.` | Grava a aprovação com o hash do plano |
| `Aprovo a decisão D-NN.` | Libera uma decisão F8 que muda status, plano ou escopo |
| `Aceito o risco do achado N.` | Aceita um achado de revisão sem corrigir |
| `Aprovo a dependência <pacote>.` | Libera dependência nova |
| `Aprovo apagar <o quê>.` | Libera ação destrutiva em dado |

O `<slug>` nas duas primeiras é proposta nova (o `[E13]` aprovou "Aprovo a SPEC." sem slug). Com mais de uma demanda aberta, o slug evita aprovar a errada. Decisão DP-03.

### F1. Primeira linha de toda resposta de agente
```
PAPEL: <persona> | DEMANDA: <slug ou "nenhuma"> | ETAPA: <Ex lida no estado.md agora>
```
**Erro se:** o papel não bate com o terminal; a etapa difere do `estado.md`; a linha falta.

### F2. Resposta a um pedido para pular etapa
```
ETAPA ATUAL: E3 SPEC (estado.md, atualizado em AAAA-MM-DD HH:MM)
O PEDIDO PULARIA: E4 Plano e aprovação do plano
FALTA: frase "Aprovo a SPEC <slug>." registrada; plano escrito; frase "Aprovo o plano <slug>."
NÃO EXECUTADO.
```
**Erro se:** qualquer ferramenta altera arquivo no mesmo turno, ou o texto começa a executar o pedido.

### F3. Relato do implementador
```
STATUS: CONCLUIDA | CONCLUIDA_COM_RESSALVA | PRECISA_CONTEXTO | BLOQUEADA
TAREFA: T07 | WAVE: 2 | PERSONA: backend-specialist | MODELO: <modelo>
SPEC_SHA256: <hash> | PLANO_SHA256: <hash>
ARQUIVOS_TOCADOS: <lista exata>
FORA_DE_FILES: NAO | SIM: <lista>
TESTE_VIU_FALHAR: SIM: <nome do teste e trecho da falha> | NAO_SE_APLICA: <motivo>
GATES:
  lint: EXIT <n>
  typecheck: EXIT <n>
  test: EXIT <n> (<passaram>/<total>)
SAIDA_DOS_GATES: (bloco cru, sem resumo)
COMMIT_FEITO: NAO
SUPOSICOES: <lista ou "nenhuma">
FICOU_DE_FORA: <lista ou "nada">
```
**Erro se:** `ARQUIVOS_TOCADOS` difere de `git status --short`; `FORA_DE_FILES: NAO` com arquivo fora de `Files:`; `STATUS: CONCLUIDA` com algum `EXIT` diferente de 0; `TESTE_VIU_FALHAR: SIM` sem o trecho; `COMMIT_FEITO: NAO` com hash novo no `git log`; hash da SPEC ou do plano diferente do aprovado.

### F4. Achado de revisão (uma linha por achado, no arquivo do próprio revisor)
```
ACHADO | <arquivo>:<linha> | <SEVERIDADE> | <o que está errado> | CENARIO: <entrada ou estado que faz falhar> | REGRA: <critério da SPEC ou regra violada> | REVISOR: <persona>
```
Rodapé obrigatório:
```
ARQUIVOS_REVISADOS: <lista = união dos Files: da wave>
ACHADOS_DESCARTADOS_POR_FALTA_DE_CENARIO: <n>
RESULTADO: NENHUM_ACHADO | <n> ACHADOS
```
ALTO e CRITICO exigem trecho de código e o motivo de a proteção existente não pegar. O revisor **não** escreve veredito.
**Erro se:** `ARQUIVOS_REVISADOS` deixa de fora um arquivo da wave; ALTO ou CRITICO sem `CENARIO`; arquivo sem nenhuma linha válida **e** sem `RESULTADO: NENHUM_ACHADO` (o sintetizador para).

### F5. Síntese da revisão (gerada por script)
```
REVISORES_ESPERADOS: code-reviewer, security-reviewer
REVISORES_RECEBIDOS: code-reviewer, security-reviewer
LINHAS_INVALIDAS: <n por revisor>
ACHADOS (repetidos juntados): <lista F4 com todos os revisores>
VEREDITO: BLOQUEADO | APROVADO_COM_RESSALVA | APROVADO
DESTINO DE CADA ACHADO: reparo | volta ao plano | volta à SPEC | aceito pelo humano ("Aceito o risco do achado N.")
```
**Erro se:** falta um revisor esperado; `LINHAS_INVALIDAS` maior que 0; `APROVADO` com MEDIO ou mais; achado "aceito pelo humano" sem a frase registrada.

### F6. Estado da demanda (acréscimo ao `estado.md`)
```
ETAPA_ATUAL: E5 (wave 2)
PROXIMA_ETAPA_PERMITIDA: E6
ESPERA_HUMANO: NAO | SIM: <frase exata esperada>
SPEC: <caminho> sha256=<hash na aprovação>
PLANO: <caminho> sha256=<hash na aprovação>
```
Mais uma seção "Histórico", só de acréscimo:
```
AAAA-MM-DD HH:MM | <quem> | <evento> | <evidência: caminho, hash ou EXIT>
```
**Erro se:** o hash atual difere do gravado; `ETAPA_ATUAL` pula etapa no histórico; evento sem evidência.

### F7. Handoff (acréscimo ao template)
`SPEC_SHA256`, `PLANO_SHA256`, `ETAPA_NO_ESTADO_NO_DESPACHO` e `MODELO_E_MOTIVO`. O implementador confirma que leu a mesma versão aprovada.

### F8. Decisão do orquestrador
```
DECISAO D-NN | <o que decidi> | MOTIVO: <...> | CUSTO SE ERRADO: <...> | MUDA ESCOPO, PLANO OU STATUS: NAO | SIM: exige "Aprovo a decisão D-NN."
```
**Erro se:** uma decisão muda status (`BLOQUEADA` para `CONCLUIDA`), arquivos, plano ou critério de aceite sem a frase registrada.

### F9. Relatório de agente externo (Codex na E0 e na E10, OpenCode na E13, Antigravity na pesquisa)
```
F1 na primeira linha
ESCREVI_EM: <caminhos>   (dentro de docs/fluxo/<demanda>/relatorios/)
COMANDOS_RODADOS: <comando> → EXIT <n>   (ou "nenhum")
ACHADOS: formato F4 (E10) | FONTES: <link e data por afirmação> (pesquisa) | ROTEIRO: deploy-NN.md (E13)
O_QUE_NAO_FOI_VERIFICADO: <lista; nunca vazio sem dizer "nada">
DECISAO_QUE_O_HUMANO_PRECISA_TOMAR: <ou "nenhuma">
```
**Erro se:** `git status --short` mostra arquivo fora de `ESCREVI_EM`; comando sem EXIT.

### F10. Fechamento de etapa pelo orquestrador
```
ETAPA_CONCLUIDA: E6 wave 2 | EVIDENCIA: <caminho> | PROXIMA: E7 | ESPERA_HUMANO: NAO
```
**Erro se:** a evidência não existe, ou a próxima etapa não é a seguinte da tabela do `fluxo.md`.

### Conferência automática
`validar-saida.mjs`, com uma função por formato (F3, F4, F5, F6, F8), falha fechada, chamado em três momentos: pelo `SubagentStop`; pelo orquestrador antes de cada etapa; e pelo Gabriel quando quiser. Os casos negativos que a Central já escreveu servem de base para os testes (`[H]/auditoria/wave-reports/WAVE_4_10_review_panel_negative_fixture.md`).

---

## 9. Recomendações priorizadas

### P0. Agora, fora do kit
1. **Frete:** trocar `"allow"` por `"deny"` no `guard-main-branch.mjs:81` (exceção ao D11; decisão DP-01). `deny`, e não `ask`, por dois motivos: o push na `main` é do Gabriel, no terminal dele, e o hook só afeta o agente; e no modo `auto` (padrão desde agosto, segundo a documentação) quem responde um `ask` pode ser o classificador, não o Gabriel (HIPÓTESE a testar). Teste: o evento de `git push origin main` precisa devolver `deny`.
2. **Cópia fora do Mac:** commitar as 85 pendências do Knowledge, criar remoto no Gitea e fazer push; transformar o `harness-canonico` em git com remoto. Teste: `git remote -v` não vazio, `git status --short` vazio, clone numa pasta temporária abre.
3. **Rodar o inventário** (`modo-facil/00-inventario.md`). Ele confirma Q21 (para onde aponta o `obsidian` global), os hooks globais e os plugins.
4. **Antigravity, prazo de 19/10:** se você usa os workflows do Antigravity na Central (o do Graphify fica em `.agents/workflows/`), rode `/migrate-workflows` antes do dia 19, ou aceite que eles param e migre junto com a Central (decisão DP-13).
5. **Antes de qualquer mudança na Central:** backup do banco (`docker exec central-isobras-db pg_dump -U postgres central_db > ~/backup-central-$(date +%Y%m%d).sql`).

### P1. No kit, antes da primeira demanda real (esboço de waves, **não aprovado**)

| Wave | Conteúdo | Fecha |
|---|---|---|
| W1 Base das travas | `hook-io` falha fechada; parser único de shell + `alvosDeEscrita()`; normalização de caminho (worktree, symlink, maiúscula); um despachante por evento; teste de registro total | B03, B04.3, B06, B12, B14, N33 |
| W2 Aprovação | Captura no `UserPromptSubmit`; `aprovacoes.json` com hash e HMAC; `plano-guard` com hash, `Files:` e branch; guarda de Bash (interpretador inline, CLI aninhada, bypass, `maestri ask`) | B01, B02, B04.2, B05 |
| W3 Git e gates | `commit-guard` com lista de permitidos e branch; pre-commit para qualquer layout + `gates.lock` + gitleaks; pre-push; `noInlineConfig`, `eol-last`, JS e pastas isentas; `PROTEGIDOS` ampliado; `.gitignore` completo; deny amplo | B07, B08, B13, B15, B16, B22 |
| W4 Agentes e saídas | Vocabulário + F1–F10; `validar-saida.mjs` + SubagentStop; guarda de despacho + `model`/`tools`/`skills` nos adaptadores; ponte Superpowers → persona; Stop com recibo; sintetizador corrigido; escopo da sessão principal; revisores sem ler um ao outro | B09, B10, B17, B18, B19, C07, C08, C22 |
| W5 Fluxo e documentos | Aplicar o E0–E13 em **todos** os arquivos; templates que faltam (relatório final, revisão final, deploy com C14); classificação C0–C5; portões extras; debugger no reparo; rubrica de testes; práticas de wave (C19–C21); personas dos externos e do `devops-engineer` | N19–N25, C14, C16–C21 |
| W6 Memória e cofre | Índice único + memória nativa desligada; `memoria-check`; trava de memória para subagente; cofres declarados no manifesto (dois níveis, se aprovado); MCP por CLI; `.gitignore` do cofre e do grafo | B20, B21, N26, N27 |
| W7 Distribuição e máquina nova | `harness.json` com versão, commit, perfil e sha256; `verificar` e `atualizar --ensaio/--aplicar`; `selftest` e `eslint-rules` em `.agents/gates/`; doctor só leitura; `enabledPlugins: false` + checagem do global; RTK no doctor; limpar `.auditoria-tmp/` | B11, N28–N31, N36, N37, C09–C13 |
| W8 Multi-fornecedor | Núcleo de guardas + adaptadores de Codex, OpenCode e Antigravity; regras com `trigger:`; skills em `.agents/skills/` com cópia conferida em `.claude/skills/`; MCP do cofre nos três formatos; onboarding de confiança; versões das CLIs fixadas | B05, B20, B23, N26, N35 |
| W9 Teste de aceitação | Selftest completo; roteiro 11.4 numa sessão real (sandbox, origem do `UserPromptSubmit`, `maestri ask`, cada CLI responde F1); perguntas por IA com a resposta esperada de cada uma | tudo |

### P2. Migração da Central (documento próprio, esboço já existe)
Perfil web-JS (Q40); domínio fora do modelo (Q15); apagar mortos e duplicados (DU e M, seções 5.3 e 5.5); grafo global como perfil (C28); cofre do ecossistema (C29, se aprovado); `AGENTS.md` na raiz de cada repositório (Q34); remover caminhos absolutos (Q29); um commit só do `obsidian-mcp` com espelho no Gitea (Q33); o Gabriel revisa e roda `git worktree prune` no hub (O10); absorver as lentes nas personas (C24, C25).

### P3. Melhorias
`lint:types` e os três gates antes da revisão (N34); medir custo de tokens por demanda; `graphify-orient` no máximo uma vez por sessão, se fizer falta.

---

## 10. Decisões que dependem do Gabriel

São as próximas perguntas do brainstorming, uma por vez, antes do adendo da SPEC.

| ID | Decisão | Opções | Recomendação |
|---|---|---|---|
| DP-01 | Corrigir o Frete agora, como exceção ao D11 | `deny` / `ask` / esperar a migração | `deny` agora |
| DP-02 | Topologia do cofre | (a) dois níveis: `vault/` por projeto + `ecossistema-vault` só na Central; (b) cofre externo único para a Central | (a), confiança média |
| DP-03 | Mecanismo de aprovação | (a) frase digitada no Claude, capturada pelo `UserPromptSubmit`, com hash e HMAC; (b) comando de uma linha colado num terminal comum, que exige teclado de verdade, com hash e HMAC | (a), se o teste mostrar que dá para saber a origem do prompt; senão (b). Nos dois, chave fora do repositório e sandbox protegendo a leitura |
| DP-04 | Caminho curto (C1) | O orquestrador escreve um pedido de 5 linhas sem o Codex na E0; as duas frases continuam | Sim |
| DP-05 | Quando testar | Rubrica da Central (CC ≥ 2), com TDD quando exigido / TDD em tudo | Rubrica |
| DP-06 | Validação visual | agent-browser + DevTools / Playwright E2E repetível / os dois (E2E só nos fluxos críticos) | Os dois |
| DP-07 | Documentação e legado | Runbook com o `devops-engineer` e README com o implementador / voltar o `documentation-writer`; `code-archaeologist` sim ou não | Sem agente novo |
| DP-08 | `graphify-out/` | Versionado / ignorado | Ignorado |
| DP-09 | Biome | Gate / só formatador | Só formatador |
| DP-10 | Pipeline de memória por LLM | Trazer / não trazer | Não trazer |
| DP-11 | Onde rodam typecheck e testes | pre-push + recibo no Stop / Stop pesado | pre-push + recibo |
| DP-13 | Workflows do Antigravity na Central (param em 19/10) | Migrar agora, como exceção ao D11 / deixar parar e migrar junto com a Central | Depende de você usar. Se não usa, deixar parar |
| DP-12 | Sandbox do Bash | (a) ligado no settings do projeto, com a saída do sandbox negada por regra de permissão (testar se basta); (b) além disso, `allowUnsandboxedCommands: false` em managed settings, que é arquivo do sistema e foge do D10 | (a); (b) só se o teste mostrar que (a) não segura |

---

## 11. Hipóteses conferidas na documentação oficial

Lido em 14/10/2026, só em fonte oficial (documentação e changelog de cada fornecedor). Limites: a página de hooks do Claude Code veio truncada, então os itens marcados "(resumo)" saíram de extração, não de texto literal; nenhuma página traz data de atualização. O roteiro 11.4 confirma tudo numa sessão real, em uns 15 minutos.

### 11.1 Claude Code (code.claude.com/docs)

| ID | O que a documentação diz | Veredito | O que muda no harness |
|---|---|---|---|
| H1 | Exit 2 bloqueia. Exit 1, exceção não tratada e timeout **não** bloqueiam: a ação segue | CONFIRMADO | O fail-open dos dois harness é real (N01, Q05) |
| H1 | Existe `"onFailure": "block"` no registro do hook: bloqueia quando o hook falha ou estoura o tempo (Claude Code 2.1.295 ou mais novo) | CONFIRMADO | Usar em todas as guardas, além do fail-closed no script (B03) |
| H1 | `permissionDecision` aceita `allow`, `deny`, `ask` e `defer`; `allow` pula o pedido de permissão | CONFIRMADO | O `allow` do Frete aprova sem perguntar (Q01) |
| H1 | Um `allow` de hook **não** passa por cima de `permissions.deny` | CONFIRMADO | O deny do settings é uma segunda camada real |
| H2 | stderr com exit 0 nunca chega ao modelo | CONFIRMADO | M02 vira FATO: `central-iso-stop` e `central-iso-posttooluse` não fazem nada |
| H3 | Não existe campo `reminder` na saída. SubagentStop pode bloquear com `decision: "block"` e recebe `agent_id`, `agent_type`, `agent_transcript_path` e `stop_hook_active` (SDK) | CONFIRMADO / PARCIAL | `central-iso-subagentstop` é no-op (FATO). B09 é viável; falta testar se o motivo do bloqueio volta ao subagente |
| H4 | Sessão aberta na pasta-mãe carrega o settings dos repositórios filhos? | NÃO DOCUMENTADO | Manter o alerta do SessionStart (B06) e testar (11.4) |
| H5 | Modos: `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. No `auto`, um classificador decide no lugar do humano. `auto` no settings de **projeto** é ignorado. `auto` virou o padrão em agosto de 2026 (resumo do What's New) | CONFIRMADO; o último item, a confirmar | As travas usam `deny` e exit 2, nunca `ask`, porque um `ask` pode ser respondido pelo classificador. O doctor mostra o modo efetivo |
| H6 | O Claude Code recarrega os arquivos de settings assim que eles mudam | CONFIRMADO | Escrever no settings desliga trava na hora (B22) |
| H8 | Em worktree, `CLAUDE_PROJECT_DIR` aponta para a raiz principal e o `cwd` do hook para a raiz do worktree; o script do hook vem do checkout principal | CONFIRMADO | A brecha do worktree no kit é real (N06) |
| H9 | Deny de `Read` vale para as ferramentas de arquivo; para o Bash, só com o sandbox ligado | CONFIRMADO | Sem sandbox, `cat .env` passa nos dois harness |
| H10 | O sandbox é imposto pelo sistema (Seatbelt, no macOS), vem **desligado** e usa as regras de deny de `Read` e `Edit`. Hooks, MCP local e a ferramenta Read ficam fora dele. A saída é `dangerouslyDisableSandbox`; uma regra `allow` que casa aprova a nova tentativa sem perguntar; `allowUnsandboxedCommands: false` fecha a saída quando posto em managed settings | CONFIRMADO | Base de B01, B04 e B08. Decisão DP-12 |
| H11 | O formato `"command": "node", "args": [...]` é suportado | CONFIRMADO | Os hooks da Central que não rodam estão mortos por falta de registro, não por formato |
| H12 | `UserPromptSubmit` recebe `prompt`, `session_id`, `cwd` e `permission_mode`; pode bloquear e injetar contexto; **dispara também** com relatório de subagente, mensagem de outra sessão, `/loop` e tarefa agendada. Texto vindo de simulação de teclado: não documentado | CONFIRMADO / NÃO DOCUMENTADO | B01 exige prompt exato, bloqueio de envio entre sessões e teste da origem. Decisão DP-03 |
| E1 | Frontmatter de subagente: `tools`, `disallowedTools`, `model`, `permissionMode`, `skills`, `hooks`, `memory`, `maxTurns`, `mcpServers`, `background`, `isolation`, `effort`. Sem `tools`, herda todas; sem `model`, herda o da sessão. Campo desconhecido é ignorado sem erro. O `permissionMode` do subagente é ignorado se a sessão estiver em bypass, acceptEdits ou auto | CONFIRMADO (resumo) | N16 vira FATO. O Gabriel escolhe as skills no `.md` de cada agente, porque o campo existe. O selftest valida os nomes dos campos |
| E2 | A ferramenta de despacho se chama `Agent`; `Task` continua como apelido | CONFIRMADO | Guarda de despacho com matcher para os dois nomes (B10) |
| E3 | Dentro de subagente, o evento traz `agent_type` e `agent_id` | CONFIRMADO (SDK) | O `escopo-guard` por persona funciona |
| E5 | `Bash(x:*)` e `Bash(x *)` são iguais. Deny vale se qualquer subcomando casar (`&&`, `;`, pipe). **Não** casa o programa chamado por caminho nem dentro de `sh -c` | CONFIRMADO | O deny pega comando composto; `sh -c` precisa da guarda (B04) |
| E6 | `enabledPlugins: false` no projeto: as fontes se juntam chave a chave; hooks de plugin não são citados | PARCIAL | Testar se o hook do plugin some (11.4) |
| E7 | `autoMemoryEnabled` liga ou desliga a memória automática, guardada em `~/.claude/projects/<projeto>/memory/` | CONFIRMADO | `false` no projeto: é memória por máquina, fora do git, e não serve ao harness |
| E8, E9 | Em valor simples (como `disableAllHooks`), vale a fonte mais alta; as listas de hooks do usuário e do projeto se somam; o projeto não impede hook do usuário (só managed settings impede) | CONFIRMADO / PARCIAL | B11 e B22 |
| E10 | Timeout padrão de 600 s (30 s no `UserPromptSubmit`); no timeout, a ação segue | CONFIRMADO | Timeout curto + `onFailure: "block"` |
| E11 | Matcher `mcp__<servidor>__<ferramenta>` funciona | CONFIRMADO | Dá para bloquear escrita no cofre por subagente (N27) |
| — | Regra de caminho em `Write(...)` nunca é consultada; `.claudeignore` não faz nada | CONFIRMADO | Deny de escrita sempre com `Edit(...)` (B08) |
| — | Fora de managed settings, Team ou Enterprise, um "mod" instalado pode aprovar uma chamada que o deny recusa | CONFIRMADO; o termo precisa ser entendido | Investigar o que "mod" significa ali; manter plugins desligados no projeto |

### 11.2 Codex, OpenCode e Antigravity

**Três mudanças de 2026 que pedem ação:**
1. **Antigravity: os workflows param de funcionar em 19/10/2026.** A Central tem `.agents/workflows/` em cinco lugares (Q41). O `/migrate-workflows` converte em skills.
2. **OpenCode V2** (estável desde 11/09/2026) só lê `AGENTS.md`, não lê mais `CLAUDE.md`, mudou as chaves de configuração e não roda plugins da V1.
3. **O Codex aposentou `approval_policy = "untrusted"`**, que pode impedir o Codex de iniciar. O kit não usa essa chave (conferido).

| Item | Codex (0.162) | OpenCode (V1 1.19 / V2 2.0) | Antigravity (CLI `agy` 1.3, app 2.x) |
|---|---|---|---|
| Regras do projeto | `AGENTS.md` da raiz até a pasta atual, um por pasta (`AGENTS.override.md` vence); teto de 32 KiB no total | `AGENTS.md`. A V2 junta todos da pasta atual até a raiz; a V1 usa `CLAUDE.md` só como reserva | `AGENTS.md` ou `GEMINI.md`. Regras em `.agents/rules/*.md` com frontmatter `trigger:` **obrigatório**; trigger inválido é descartado em silêncio; 24 KB por arquivo e 20 mil tokens no total |
| Configuração no projeto | `.codex/config.toml`, **só em projeto confiável**. A confiança fica no config do usuário, por máquina | `opencode.json(c)` ou `.opencode/`, sem pedir confiança | `<projeto>/.gemini/config.json`; a CLI pede para confiar no workspace |
| MCP no projeto | `[mcp_servers.<nome>]` no `.codex/config.toml` (projeto confiável) | V1: `mcp.<nome>`. V2: `mcp.servers.<nome>` | `.agents/mcp_config.json` (CLI e IDE; no app, não documentado) |
| Hooks | `.codex/hooks.json`. PreToolUse bloqueia com `deny` ou exit 2; `ask` não existe. Cada hook é aprovado no `/hooks` e volta para revisão quando muda. A própria doc diz que "not a complete enforcement boundary" | Plugin em `.opencode/plugins/` (V1: `tool.execute.before` com erro; V2: `permission.hook("evaluate")` devolvendo deny), carregado sem confirmação | `.agents/hooks.json`. PreToolUse com `decision: "deny"` (bloqueio rígido), `ask`, `auto_approve` e outros. Exit 2 não documentado |
| Travas declarativas | `.codex/rules/*.rules` (Starlark, `forbidden`; experimental). No modo `workspace-write`, `.git`, `.codex` e `.agents` ficam somente leitura | `permissions` com deny (formato novo na V2) | Permissões `action(target)`; o arquivo de projeto não tem caminho documentado |
| Subagentes | `.codex/agents/*.toml` com `name`, `description`, `developer_instructions`, `model`. **Sem lista de ferramentas**; `sandbox_mode` e `mcp_servers` no arquivo do agente são ignorados | `.opencode/agents/<nome>.md` com `model` e permissões próprias | `.agents/agents/<nome>.md` com `tools`, `model`, `commandExecutionPolicy` e `mcpServers` |
| Skills | `.agents/skills/` | `.agents/skills/`, `.claude/skills/`, `.opencode/skills/` | `.agents/skills/` |
| Sem interface | `codex exec` (somente leitura por padrão); `codex review --base <branch>` | não conferido | `agy -p`; o que pediria aprovação é negado em silêncio |

### 11.3 O que isso muda no desenho

1. **Revisão final no Codex (E10):** `codex review --base <branch>` faz exatamente a revisão do diff da branch, sem interface. Os dois subagentes de `.codex/agents/` não restringem ferramentas, então o "somente leitura" vem da sessão (`workspace-write`, que já protege `.git`, `.codex` e `.agents`) mais o hook do Codex limitando a escrita a `docs/fluxo/<demanda>/relatorios/`.
2. **Uma política, quatro adaptadores (B23):** as guardas viram um núcleo neutro e cada CLI ganha um adaptador fino. A regra "agente externo só escreve em `docs/`", hoje só texto, passa a ter trava em cada CLI.
3. **A confiança é por máquina e não vem no git.** Sem confiar no projeto, o Codex ignora todo o `.codex/` (config, MCP, hooks e rules), e o Antigravity também pede. Isso entra no onboarding e no doctor.
4. **Regras para o Antigravity:** as 6 regras do kit não têm `trigger:` (N35). Correção: `trigger: always_on`, ou `model_decision` com `description`, cada arquivo abaixo de 24 KB. O `AGENTS.md` do kit tem 6.775 bytes, bem abaixo do teto de 32 KiB do Codex.
5. **Skills num lugar só:** `.agents/skills/` é lido por Codex, OpenCode e Antigravity; o Claude Code lê `.claude/skills/`. Fonte única em `.agents/skills/`, com cópia (ou link) em `.claude/skills/` conferida pelo `verificar`. É ali que entram a skill de segurança e a de frontend do Gabriel.
6. **MCP do cofre em três formatos gerados de uma fonte** (o manifesto), com segredo fora do arquivo.
7. **O OpenCode carrega config, MCP e plugins do repositório sem pedir confirmação.** É prático, mas um repositório clonado pode rodar código ao abrir. Fixar a versão (V1 ou V2) e saber qual está instalada (inventário).
8. **Fixar as versões das CLIs** no manifesto e conferir no doctor. Muita coisa mudou em 2026.

### 11.4 Roteiro de teste prático (numa sessão real, uns 15 minutos)

1. Hook PreToolUse que sai com 1, e outro que estoura o timeout → a ação segue? (confirma H1 na versão instalada)
2. O mesmo hook com `"onFailure": "block"` → bloqueia?
3. `UserPromptSubmit` que grava a entrada inteira, disparado por: (a) prompt digitado, (b) relatório de subagente, (c) `maestri ask`, (d) mensagem de outra sessão. Existe algum campo que diga a origem? (decide DP-03)
4. SubagentStop com `decision: "block"` → o subagente continua e vê o motivo?
5. Sandbox ligado: `cat .env`, `echo x >> eslint.config.mjs` e leitura da pasta da chave falham com erro de permissão do sistema? Uma tentativa com `dangerouslyDisableSandbox` é negada pela regra de permissão do projeto? (decide DP-12)
6. Sessão aberta em `~/Desktop/Projetos`: editar um arquivo do Central ISO dispara os hooks dele? (H4)
7. `enabledPlugins: false` no projeto → o hook do plugin some? (E6)
8. Modo efetivo com e sem `defaultMode: "default"` no projeto; no modo `auto`, um `ask` de hook é respondido pelo classificador? (H5)
9. Codex: `codex debug prompt-input` mostra o `AGENTS.md` e o config do projeto carregados, com e sem confiança no projeto?
10. Antigravity: uma regra com `trigger: always_on` e outra sem `trigger` → só a primeira aparece como ativa?

---

## 12. Fontes

- Relatórios completos, em `docs/inventario/auditoria-2026-10-14/`:
  - `relatorio-A-hooks.md` (hooks, travas, permissões e settings);
  - `relatorio-B-processo.md` (fluxo, agentes, regras, geradores, formatos de saída);
  - `relatorio-C-memoria-sync.md` (memória, grafo, distribuição, máquina nova, multi-fornecedor);
  - `relatorio-D-drift-gates.md` (drift por repositório, custo, quality gates).
- Os relatórios citam caminhos da cópia de auditoria. Equivalência: `scratchpad/auditoria/central/` = `~/Desktop/Projetos/`; `scratchpad/auditoria/canonico-kit/` = `~/development/harness-canonico/`.
- Conferência direta no código (14/10): `[KC]/hooks/hook-io.mjs` (`run()` engole a exceção e sai com 0) e `[FR]/.claude/hooks/guard-main-branch.mjs:81` (`permissionDecision: "allow"`).
- Desenho aprovado: `[E13]`. Esboço da migração: `[K]/docs/superpowers/specs/2026-10-14-migracao-harness-existente-esboco.md`.
- Documentação oficial consultada em 14/10/2026 (seção 11):
  - Claude Code: [hooks](https://code.claude.com/docs/en/hooks.md), [permissions](https://code.claude.com/docs/en/permissions.md), [permission-modes](https://code.claude.com/docs/en/permission-modes.md), [sandboxing](https://code.claude.com/docs/en/sandboxing.md), [settings](https://code.claude.com/docs/en/settings.md), [sub-agents](https://code.claude.com/docs/en/sub-agents.md), [worktrees](https://code.claude.com/docs/en/worktrees.md), [memory](https://code.claude.com/docs/en/memory.md), [agent-sdk/hooks](https://code.claude.com/docs/en/agent-sdk/hooks.md).
  - Codex: [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [config](https://learn.chatgpt.com/docs/config-file/config-basic), [MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [hooks](https://learn.chatgpt.com/docs/hooks), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [aprovação e segurança](https://learn.chatgpt.com/docs/agent-approvals-security), [code review](https://learn.chatgpt.com/docs/code-review), [skills](https://learn.chatgpt.com/docs/build-skills).
  - OpenCode: [rules V1](https://opencode.ai/docs/rules/), [instructions V2](https://opencode.ai/v2/docs/instructions/), [config V2](https://opencode.ai/v2/docs/config/), [MCP V2](https://opencode.ai/v2/docs/mcp-servers/), [agents V2](https://opencode.ai/v2/docs/agents/), [permissions V2](https://opencode.ai/v2/docs/permissions/), [migração V1→V2](https://opencode.ai/v2/docs/migrate-v1/).
  - Antigravity: [rules](https://antigravity.google/docs/rules), [workflows](https://antigravity.google/docs/ide/workflows), [MCP](https://antigravity.google/docs/mcp), [hooks](https://antigravity.google/docs/hooks), [permissions](https://antigravity.google/docs/permissions), [skills](https://antigravity.google/docs/skills).
