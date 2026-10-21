> **Nota de 14/10/2026:** relatório de evidência da auditoria consolidada em `docs/inventario/2026-10-14-auditoria-profunda-central-x-canonico.md`. Os caminhos citam a cópia de auditoria: `…/scratchpad/auditoria/central/` = `~/Desktop/Projetos/` e `…/scratchpad/auditoria/canonico-kit/` = `~/development/harness-canonico/`. Linhas valem para os arquivos de 14/10.

# Relatório C: memória, grafo, distribuição, máquina nova e multi-fornecedor

- **Data:** 14 de outubro de 2026
- **Método:** só leitura dos arquivos copiados. Não rodei hook, script do harness nem comando de rede. A única execução foi um script Python meu, na scratchpad, que recalcula os hashes do `project-overlay.json` da Central sobre os arquivos copiados.
- **Convenção:** **FATO** = visto no arquivo citado. **HIPÓTESE** = dedução ou comportamento de ferramenta que não verifiquei; vem com o jeito de testar.

## Abreviações de caminho

| Sigla | Caminho completo |
|---|---|
| `C/` | `/tmp/claude-0/-home-claude/d40a5fd9-9768-56ee-97e9-71e16c66241c/scratchpad/auditoria/central/` (raiz controladora `Projetos`) |
| `H/` | `C/Central ISO Harness/` |
| `K/` | `C/Central ISO Knowledge/` (cofre) |
| `HUB/` | `C/Central ISO/` |
| `AG/`, `CTP/`, `FR/` | `C/Módulos Central/Mod. Agend/`, `.../Mod. CTP-ATP/`, `.../Mod. Frete/` |
| `N/` | `/tmp/claude-0/-home-claude/d40a5fd9-9768-56ee-97e9-71e16c66241c/scratchpad/auditoria/canonico-kit/` |

## Limites desta cópia (leia antes)

1. A cópia trocou segredos por `<oculto>` dentro de alguns arquivos. Exemplos: `env` de todos os `settings.json`, um comentário de `HUB/.claude/scripts/session-log-runner.mjs` e `HUB/.claude/rules/08-parallel-subagent-driven-development.md`. Por isso, uma comparação por hash nesses arquivos não prova nada.
2. Não há pastas `.git` na cópia. Remoto, branch e alterações pendentes vêm do inventário de 14/10 (`N/docs/inventario/2026-10-14-comparacao-central-iso.md:19-26`), não de verificação minha.
3. Links simbólicos não vieram. O `.central-iso-vault` de cada repositório não aparece.
4. Logs foram pulados (`C/_PULADOS.txt`).

---

## Memória: camadas comparadas

| Camada | Central ISO (hoje) | harness-canonico | Codex, Antigravity e OpenCode |
|---|---|---|---|
| **1. Carregada sempre (constituição)** | **FATO:** a raiz dos repositórios consumidores não tem `AGENTS.md`. A constituição fica em `HUB/.central-iso/instructions/AGENTS.md`. O Claude Code chega lá por `HUB/.claude/CLAUDE.md:3-4` (`@../.central-iso/instructions/AGENTS.md`). O verificador da Central **reprova** um `AGENTS.md` na raiz do modelo (`H/scripts/verify-harness.mjs:33-34`). Quem escreve: o humano. Validação: o verify confere só que o arquivo existe. | **FATO:** `AGENTS.md` na raiz. `CLAUDE.md` é só `@AGENTS.md` (`N/CLAUDE.md:1`). O `rules-guard` impede o agente de editar o `AGENTS.md` (`N/kit-claude-code/dot-claude/hooks/rules-guard.mjs:15-26`). | Central: **HIPÓTESE** (já levantada em `N/docs/inventario/...:40`): Codex e OpenCode abertos no repo não encontram constituição, porque procuram `AGENTS.md` no caminho entre a raiz do git e a pasta atual. Canônico: leem `AGENTS.md` sozinhos (`N/.agents/adaptadores.md:9`). |
| **2. Memória do agente (índice + tópicos)** | **FATO:** `.claude/memory/MEMORY.md` mais arquivos de tópico. O `INSTRUCTIONS.md` diz que é "auto-loaded via `@.claude/memory/INSTRUCTIONS.md`" (`HUB/.claude/memory/INSTRUCTIONS.md:3`). Só o Mod. Frete faz essa importação (`FR/CLAUDE.md:112-113`). HUB, AG e CTP **não importam**: nenhum `CLAUDE.md` deles cita `.claude/memory`. Quem escreve: qualquer sessão, quando o agente acha que deve. O lembrete `memory-stop.mjs` só está registrado no Frete (`FR/.claude/settings.json`, Stop). Validação: nenhuma; o teto de 130 linhas é só aviso (`HUB/.claude/hooks/memory-stop.mjs:115-123`). Há um terceiro destino: `/remember` grava em `.agents/memory/`, com teto de 200 linhas (`HUB/.claude/commands/remember.md:13-15,26-34`). | **FATO:** `.agents/memory/MEMORY.md` (teto de 130) mais tópicos com frontmatter, importados pelo `AGENTS.md` (`N/AGENTS.md:104-107`). Só o orquestrador grava, em E10 (`N/.agents/memory/INSTRUCTIONS.md:5`). Validação: uma caixinha no `estado.md` (`N/.agents/templates/estado.md:44`). Nenhum hook protege `.agents/memory/`: a lista do `rules-guard` não inclui essa pasta (`rules-guard.mjs:15-26`). Então a regra "só o orquestrador grava" depende do agente obedecer. | Os índices são texto: qualquer CLI lê, se abrir o arquivo. A linha `@...` só funciona no Claude Code; nas outras é texto, e o `AGENTS.md` pede que elas abram o índice (`N/AGENTS.md:104`). Nada orienta nem impede a escrita por elas. |
| **3. Memória nativa da CLI** | **FATO:** `autoMemoryEnabled: true` em todos os settings (`C/.claude/settings.json:6`, `HUB/.claude/settings.json`, `FR/.claude/settings.json`). **HIPÓTESE:** fica em `~/.claude/projects/...`, fora do git e só nesta máquina. | **FATO:** o settings do kit não declara nada. A regra diz que a memória nativa é complemento e que nada essencial pode existir só nela (`N/.agents/rules/memoria.md:11`). Nenhuma trava garante isso. | Cada CLI tem a sua memória, e uma não vê a da outra. |
| **4. Cofre institucional** | **FATO:** cofre único `Central ISO Knowledge`, ligado em cada repositório por um link `.central-iso-vault`, que fica fora do git (`HUB/.gitignore:51`). O agente acessa pelo MCP **global** `obsidian` (`C/AGENTS.md:28`, `HUB/.claude/rules/obsidian.md:8`). Validação: servidor em modo strict, com teto de 500 linhas (`K/.central-iso/bootstrap/config.json`), e o doctor confere o frontmatter de todas as notas (`K/.central-iso/bootstrap/doctor.mjs:276`). Trava: o `vault-guard.mjs` só está registrado na raiz controladora (`C/.claude/settings.json`). Nos consumidores o arquivo existe, mas **não está registrado** (`HUB/.claude/settings.json`, `AG/`, `CTP/`), embora a regra diga que ele bloqueia (`HUB/.claude/rules/obsidian.md:23`). | **FATO:** `vault/` dentro do repositório, versionado no git. Acesso só pelo MCP de projeto `harness-vault`, fixado no commit `6e2916e`, com caminho `./vault`, modo strict, teto de 300 linhas e modelo por pasta (`N/kit-claude-code/dot-mcp.json:3-21`). O `vault-guard` bloqueia o acesso direto e também `mcp__obsidian__*` (`vault-guard.mjs:11,47`). Escrita pelo orquestrador em E10, com leitura de volta obrigatória (`N/.agents/rules/memoria.md:59`). | Central: **FATO:** o bootstrap grava o `obsidian` no global do Antigravity (`K/.central-iso/bootstrap/bootstrap.mjs`, `configureGlobalMcp`, `~/.gemini/config/mcp_config.json`). Codex e OpenCode não recebem nada. Canônico: **FATO:** só o Claude Code tem o MCP. Codex, Antigravity e OpenCode ficam para a "fase 6" (`N/.agents/adaptadores.md:71`). Como a regra proíbe ler o vault direto (`N/AGENTS.md:100`), essas CLIs ficam **sem cofre nenhum**. |
| **5. Registro de sessão (daily)** | **FATO:** é automático. No fim da sessão (SessionEnd), uma sub-sessão Sonnet escreve em `60-Sessoes-e-Auditorias/Daily/AAAA-MM-DD.md` (`HUB/.claude/scripts/session-log-runner.mjs:229,235,285`). No início da sessão seguinte (SessionStart), até 5 dailies por vez são revisadas por Sonnet, com até 20 turnos cada; o conteúdo durável vai para pastas fixas e a daily é **apagada** (`compile-runner.mjs:460,729,955,971`). Só roda no Claude Code e só onde os hooks estão registrados: HUB, AG e CTP. Não roda no Frete nem na raiz. | **FATO:** `vault/daily/` tem modelo, mas nenhuma regra diz quem escreve nem quem limpa. A pasta é "temporária" (`N/.agents/rules/memoria.md:41`) e versionada no git. Na prática, essa camada não existe. | Nenhum dos dois harness registra sessão de Codex, Antigravity ou OpenCode. |
| **6. Decisões** | **FATO:** registros no estilo ADR no cofre, com `decision_id` e `affected_components` (`K/30-Decisoes-Transversais/Registros/politica-tamanho-notas-vault-strict.md:1-25`), mais `20-Modulos/<M>/Decisoes`. As SPECs do Superpowers ficam em cada repositório. | **FATO:** a SPEC e as aprovações ficam no `estado.md`; a nota de entrega tem uma seção "Decisões"; o que vale além da entrega vai para `vault/03-conhecimento`. Duas peças estão pendentes: a regra sobre onde ficam as decisões do próprio harness e o vault do kit (`N/docs/superpowers/specs/2026-10-14-esteira-e0-e13-design.md:190,195`). | Codex grava a definição em `docs/definicao/` (`N/.agents/adaptadores.md:52`). É arquivo, então todos leem. |

### Os dois esquemas de frontmatter não conversam

- **FATO:** a nota da Central exige `id`, `type`, `scope`, `status`, `owner`, `created`, `updated`, `source_repo`, `source_path`, `migration_status` e `tags` (`K/50-Padroes-e-Templates/Politica-de-Frontmatter.md:44-58`).
- **FATO:** a nota do canônico usa `name`, `description` e `metadata.type` (`N/.agents/templates/vault-skeleton/templates/*.md`).
- **FATO:** o teto de linhas é 500 na Central e 300 no canônico. O servidor é o mesmo, mas fixado em commits diferentes: `ada4352` na Central (`HUB/.claude/hooks/vault-pipeline-shared.mjs:26`) e `6e2916e` no canônico (`N/kit-claude-code/dot-mcp.json:8`).
- **Consequência:** para a Central obedecer ao canônico, é preciso migrar as notas ou aceitar os dois esquemas no servidor.

### Pipeline de dailies e promoção da Central: o que faz e quanto pesa

**O que faz (FATO):**

1. `session-log.mjs` (SessionEnd) roda filtros baratos: pelo menos 4 turnos de conteúdo, o cofre existe, e a sessão não foi registrada no último minuto (`HUB/.claude/hooks/session-log.mjs:213-214`). Passando, ele dispara em segundo plano o `session-log-runner.mjs`, que usa o Claude Agent SDK com Sonnet e só a ferramenta `add_daily_note_tool`.
2. `compile.mjs` (SessionStart) procura dailies anteriores a hoje que ainda não foram compiladas, compara por hash, pega uma trava global no cofre e dispara o `compile-runner.mjs` (`HUB/.claude/hooks/compile.mjs`; trava e estado em `vault-pipeline-shared.mjs:248-250,661-663`).
3. O runner promove para as pastas aprovadas e tem várias defesas: bloqueia promoção repetida por impressão digital, guarda pós-escrita contra wikilink quebrado e só registra sucesso com evidência real de escrita. Depois **apaga** a daily (`compile-runner.mjs:13-75`).
4. Uma falha vira um arquivo em `.claude/hooks/log/pending/`, e **ninguém reprocessa**: "Recovery is manual/forensic by design" (`session-log-runner.mjs:176`).

**Evidência de que falha em silêncio (FATO):**

- `HUB/.claude/hooks/log/pending/03881716-....json`: `outcome = "completed without a write"`, em 11/09/2026. O resumo da sessão tinha cerca de 64 mil caracteres e se perdeu.
- `CTP/.claude/hooks/log/pending/ce0e015b-....json`: `"crashed: ... OAuth session expired and could not be refreshed"`, em 10/09/2026.
- `AG/.claude/memory/feedback-wave-end-obsidian-graphify.md`: o Gabriel precisou perguntar se a wave tinha sido registrada no Obsidian. Não tinha. Com o pipeline automático ligado, o registro detalhado de fim de wave continuou dependendo de pedido explícito.

**Peso (FATO e HIPÓTESE separados):**

- **FATO:** são cerca de 3.575 linhas só nas peças do pipeline (vault-pipeline-shared, compile-runner, session-log-runner, vault-note-merge, compile, session-log, vault-orient, memory-stop, session-scratch), copiadas idênticas em HUB, AG, CTP e no modelo. A cópia do Frete é de outra geração.
- **FATO:** o SDK `@anthropic-ai/claude-agent-sdk@0.3.235` (`HUB/.claude/scripts/package.json`) ocupa 325 MB de `node_modules` por repositório, em três repositórios (`H/auditoria/00_RELATORIO_ESTADO_ATUAL.md:611-613`).
- **HIPÓTESE:** cada sessão com conteúdo custa uma chamada Sonnet ao fechar, e cada início de sessão com daily pendente custa até 5 sub-sessões Sonnet de até 20 turnos. O custo real não foi medido; dá para ver em `compile.log` e `session-log.log` (pulados nesta cópia).
- **FATO:** a trava global depende de o cofre ser o mesmo para todos os repositórios (`vault-pipeline-shared.mjs:119-121`). Com um cofre por projeto, essa trava deixa de fazer sentido.

**Veredito:** oneroso e frágil. Só funciona no Claude Code, falha sem avisar, apaga a fonte e precisa de SDK, OAuth válido e rede. Vale trazer **as ideias**, não o pipeline:

- "sucesso declarado pelo SDK não é prova; só a resposta da ferramenta é" (`HUB/.claude/memory/sdk-subsession-mcp-tools.md`);
- impressão digital contra duplicata;
- guarda de wikilink;
- trava ao escrever no cofre.

O canônico já tem o essencial de forma determinística: nota de entrega em E10, com leitura de volta.

### O que acontece fora do Claude Code

- **FATO:** nos dois harness, as travas de memória e de cofre são hooks do Claude Code (`N/kit-claude-code/dot-claude/README.md:40`, `HUB/.claude/settings.json`). Codex, Antigravity e OpenCode só seguem a instrução escrita.
- **FATO:** o Codex, quando faz a definição (E0) e a revisão final (E10/E13 na esteira nova), não tem cofre no canônico. Ele define a demanda sem acesso a decisões passadas (`N/docs/superpowers/specs/...:115,125`).
- **HIPÓTESE:** se o Gabriel abre o Claude Code na raiz `Projetos`, valem os hooks da raiz e não os do repositório onde ele trabalha. Nesse caso, o Stop, o pipeline e o grafo do repositório não rodam. Teste: abrir na raiz, editar um arquivo do HUB e ver se o `verify-on-stop` dispara.

---

## Cofre por projeto × cofre do ecossistema

| | Cofre por projeto (`vault/` no repo, canônico) | Cofre único do ecossistema (Central, por link) |
|---|---|---|
| Chega com `git clone` | Sim. Sem link, sem passo extra. | Não. O cofre é outro repositório, sem remoto (`N/docs/inventario/...:24`), e o link fica fora do git (`HUB/.gitignore:51`). |
| Cópia fora da máquina | Vai junto com o push do código. | **FATO** (inventário): sem remoto e com 85 alterações não commitadas. Se perder o Mac, perde a memória. |
| Segue a branch | Sim. A nota da demanda fica na branch e entra no merge junto com o código. | Não. A nota é escrita direto, fora de qualquer branch, e pode descrever código que nunca foi integrado. |
| Conhecimento entre projetos (contratos Central↔módulo) | Fraco. Wikilink não atravessa cofres, então a decisão transversal se repete ou fica numa ponta só. | Forte. Uma nota serve a todos (`K/30-Decisoes-Transversais/`). |
| Clientes isolados (SouzaTech) | Bom. Cada cliente tem o seu, sem mistura. **Cuidado:** se o repositório for entregue ao cliente, as notas internas vão junto. | Ruim. Misturaria clientes no mesmo cofre. |
| Concorrência | Sessões paralelas em branches diferentes podem gerar conflito de merge na mesma nota. | Precisa da trava global que a Central construiu (`vault-pipeline-shared.mjs:242-300`). |
| MCP | Projeto, caminho relativo `./vault` (`N/kit-claude-code/dot-mcp.json:12`). | Global `obsidian`, que **colide** com o cofre pessoal do Gabriel (ver "arriscado", item 1). |
| Ruído no git | `vault/.obsidian/` e `vault/daily/` podem sujar o `git status` (`N/modo-facil/04-rotina-de-uma-demanda.md:33` admite `vault/.obsidian/`). O kit não ignora isso (`N/.gitignore:1-4`). | Nenhum no produto. |
| Segredo | Nota vai para o remoto do produto: precisa de varredura de segredo (gitleaks na E10 da esteira nova, `N/docs/superpowers/specs/...:137`). | A daily é escrita por LLM a partir da conversa e pode carregar algo sensível. Fica só local, porque não há remoto. |

**Recomendação (confiança média):** dois níveis, com o mesmo servidor e nomes diferentes.

1. **Nível projeto, sempre:** `vault/` no repositório, como no canônico. Projeto de cliente usa **só** isso. Defina no contrato do cliente se o `vault/` vai junto na entrega; se não for, mantenha-o num repositório irmão privado.
2. **Nível ecossistema, só na Central:** o `Central ISO Knowledge` vira repositório com remoto no Gitea e guarda apenas o que atravessa projetos: decisões transversais, contratos, o manifesto do grafo global e padrões. Cada repositório da Central declara um **segundo** servidor de projeto, por exemplo `ecossistema-vault`, no seu `.mcp.json`. Ele aponta para um caminho irmão por convenção (`../Central ISO Knowledge` no HUB, `../../Central ISO Knowledge` nos módulos) ou para o link criado e conferido pelo doctor.
3. **Migração:** o conteúdo de `20-Modulos/<Módulo>/` vai para o `vault/` de cada módulo. Fica no cofre do ecossistema o que tem mais de um dono.
4. **Alternativa B (mais simples de migrar):** manter um cofre externo único para a Central, sem `vault/` nos módulos. O canônico passaria a aceitar "vault externo" declarado no manifesto. O preço é seguir sem nota por branch e com o cofre fora do clone.

---

## Grafo

| | Local (Graphify por projeto) | Global (ecossistema Central) |
|---|---|---|
| Onde | `graphify-out/` em cada repositório | `K/.central-iso/generated/graphify/graph.json`, ignorado no git (`K/.gitignore:15`) |
| Como é feito | Central: `graphify extract . --code-only --force` (`K/.central-iso/graphify/README.md:28`). Canônico: `graphify install --project`, `hook install`, `update .` (`N/modo-facil/01-fase-2-instalar-ferramentas.md:76-82`) | `graph-sync.mjs sync --strict`: compõe os grafos locais e liga os contratos por âncora exata, sem LLM e sem semelhança de nome (`K/.central-iso/graphify/README.md:95`) |
| Roda sozinho | Os dois usam o post-commit do `graphify hook install`, que fica em `.git/hooks` e não vem com o clone. A Central ainda roda no **Stop** de cada turno: gate de 180 s mais sincronização local e global de até 660 s (`HUB/.claude/hooks/verify-on-stop.mjs:339-349`) | Disparo assíncrono no post-commit e post-checkout, mais o Stop síncrono. Uma falha **bloqueia** o encerramento (`K/.central-iso/graphify/README.md:100-106`) |
| Manual | Canônico: `graphify update .` em E10, com conferência da data (`N/.agents/rules/memoria.md:63`) | `discover` grava o registro local da máquina com caminho absoluto (`K/.central-iso/graphify/registry.local.json:3`). Incluir um módulo exige editar `ecosystem.json` e as âncoras |
| Cobertura real | Por projeto | **FATO:** 3 projetos e 5 contratos, todos Central↔Agendamento. O CTP-ATP está registrado sem contrato; o Frete está ausente (`K/.central-iso/graphify/ecosystem.json`) |
| Quem enxerga | Qualquer CLI que rode shell (é CLI) | Idem, desde que saiba o caminho. A regra do Antigravity cita o caminho pelo link (`K/.central-iso/bootstrap/templates/antigravity/project/.agents/rules/graphify.md:16`) |
| Custo | **HIPÓTESE:** sem `--code-only`, o Graphify pode chamar LLM para arquivos que não são código. A Central ignora `graphify-out/cost.json` (`HUB/.gitignore:49`), sinal de que há custo rastreado. Teste: rodar `graphify update .` e olhar `cost.json`. | Tempo, não token: até 11 minutos de Stop após edição de código. 857 + 219 linhas de script, mais schema e testes |

**Veredito:**

- **Grafo local:** essencial, barato e neutro de fornecedor. Fica no harness base.
- **Grafo global:** a ideia é boa (contrato com âncora exata e impacto entre repositórios), mas hoje cobre um par de módulos e custa caro em manutenção e espera. Deve ser um **perfil opcional** do canônico, rodando na consulta (E2, `impact`) e no fechamento (E11, `sync`), e não no fim de cada turno.

---

## Distribuição e versionamento do canônico

### Central: quatro caminhos para a mesma coisa (FATO)

1. **`H/templates/` com scripts.** `inventory`, `diff`, `verify` e `doctor` funcionam. O `sync --apply` está **bloqueado desde a "Wave 3"** (`H/scripts/sync-harness.mjs:20,28-31`).
   - A política descreve `diff-harness --target <repo>` e `sync-harness --apply <repo>` (`H/docs/06_POLITICA_DE_SYNC.md:72-84`), mas os scripts só aceitam a raiz como argumento.
   - Os destinos estão fixos no código, **sem o Mod. Frete**, com raiz absoluta `/Users/joaogabrielaragaodesouza/Desktop/Projetos` (`H/scripts/harness-lib.mjs:6,71-79`).
   - O diff só olha `AGENTS.md`, `CLAUDE.md`, `.claude/` e `.central-iso/`; ignora `.agents/`, `scripts/` e `.mcp.json` (`harness-lib.mjs:93-98`).
2. **`K/.central-iso/bootstrap/project-overlay.json`.** A fonte é o **repositório HUB**, não os templates (`canonicalProjectId: "central"`), com sha256 por pasta. É aplicado por `bootstrap.mjs --apply --project-overlay` (`K/.central-iso/bootstrap/README.md:95-101`).
   - Meu recálculo: `.claude/CLAUDE.md` e `.claude/hooks` do próprio HUB **não batem** com o manifesto, e nenhum dos dois foi alterado pela cópia. **FATO** nesta cópia; no Mac, o README diz que o bootstrap se recusa a propagar nesse caso (linha 96).
3. **Plugin AIA Harness** (`aia-harness@leandro-plugins-registry`). Gera a base, que depois é sobrescrita pelo overlay (`K/50-Padroes-e-Templates/Registros/bootstrap-e-overlay-portatil.md`, passos 4 e 5). Deixa sobras em `HUB/.claude/.aia-harness-pending/`.
4. **Duas cópias do controlador da raiz:** `H/templates/controller-root/` e `K/.central-iso/bootstrap/templates/workspace/`, com os mesmos arquivos `.claude` (comparei byte a byte). O grafo também tem duas cópias: `H/templates/knowledge-root/.central-iso/graphify/` é idêntico a `K/.central-iso/graphify/`, inclusive o `registry.local.json` com caminho absoluto.

### Versão e drift na Central (FATO)

- `harness.json` tem só `schemaVersion: 1`, sem versão nem commit do harness (`H/templates/repo-consumer/.central-iso/harness.json:2`). O `Central ISO Harness` não é git (`N/docs/inventario/...:22`). Não dá para saber de qual versão cada consumidor veio.
- O inventário dos templates está velho: lista 105 arquivos no `repo-consumer`, que tem 116. Ainda cita `AGENTS.md` e `CLAUDE.md` na raiz, que não existem mais (`H/templates/template-inventory.json`).
- O modelo de `project.json` usa `projectId` (`H/templates/repo-consumer/.central-iso/project.json:3`), mas a descoberta exige `id` e `role` (`K/.central-iso/bootstrap/lib/common.mjs:92`, `C/.claude/hooks/workspace-context.mjs:31`). Um módulo novo criado pelo modelo **não é descoberto** até alguém acrescentar `id`.
- Drift real: HUB, AG e CTP batem com o modelo, com variações de domínio. O **Frete está noutra geração**: faltam 71 arquivos do modelo e 25 são diferentes. Ainda tem placeholders do AIA sem trocar: `__OBSIDIAN_VAULT_DIR__` em `FR/.claude/hooks/compile.mjs:96`, `FR/CLAUDE.md:119` e `FR/.claude/rules/obsidian.md`.

### Canônico (FATO)

- Um só caminho: `instalar-no-projeto.sh`. Copia arquivo por arquivo, nunca sobrescreve, lista os conflitos e sai com código 2. Pode repetir sem risco (`N/instalar-no-projeto.sh:4-8,21-28,77-84`). Isso é bom.
- Não grava no projeto **qual versão** do kit foi instalada. Não tem `verificar` nem `atualizar`. Arquivo removido do kit continua no projeto. Todo arquivo personalizado (`AGENTS.md` com nome, `stack.md`, `settings.json` com hooks do Graphify e do Impeccable, `MEMORY.md`) aparece como conflito a cada nova execução, e a mescla é manual.
- O kit ainda não é repositório git; isso está no plano (`N/docs/superpowers/specs/...:195`).
- Mistura harness com produto na raiz: `selftest.mjs` e `eslint-rules/` vão para a raiz do projeto (`instalar-no-projeto.sh:49-51`).
- Copia `.agents/templates/` inteiro, incluindo `vault-skeleton` e `gates-web`, e depois copia de novo para `vault/` e para a raiz. Resultado: o modelo de entrega fica em **três lugares** dentro do projeto (`.agents/templates/nota-entrega.md`, `.agents/templates/vault-skeleton/templates/entrega.md`, `vault/templates/entrega.md`). A regra admite as duas primeiras como "a mesma coisa" (`N/.agents/rules/memoria.md:35`).
- O autoteste de hooks confere uma **lista fixa** de seis hooks (`N/kit-claude-code/dot-claude/hooks/selftest.mjs:189-196`). Ele não falha se aparecer um hook novo na pasta sem registro.

### O que levar da Central

- O manifesto de arquivos geridos com sha256, que é o melhor mecanismo dos quatro.
- A recusa explícita de sobrescrever, com backup antes de substituir.
- O namespace único (`.central-iso/`, com estado de execução fora do git).

O que deixar: as quatro fontes, a lista de destinos fixa no código e o caminho absoluto.

---

## Máquina nova: o que vem pelo git e o que não vem

| Item | Central: vem pelo clone? | Central: quem confere | Canônico: vem pelo clone? | Canônico: quem confere |
|---|---|---|---|---|
| Constituição e regras do repositório | Sim (`.central-iso/instructions`, `.claude/rules`) | doctor e verify | Sim (`AGENTS.md`, `.agents/`) | ninguém, além do selftest dos hooks |
| Hooks do Claude Code | Sim (`.claude/settings.json`, `hooks/`) | doctor (lista mínima, `doctor.mjs:590-603`) | Sim | `selftest.mjs` |
| Raiz controladora `Projetos` | **Não**, não é git. O bootstrap a gera a partir de `K/` (`C/AGENTS.md:3`) | doctor | não se aplica | não se aplica |
| Padrão do harness | **Não.** `Central ISO Harness` não é git | ninguém | **Não** por enquanto: o kit não é git | ninguém |
| Cofre | **Não.** É git sem remoto, então nem dá para clonar | doctor (estrutura e frontmatter) | **Sim** (`vault/` no repositório) | MCP strict ao escrever |
| Link `.central-iso-vault` | Não (`.gitignore`) | `bootstrap --apply` cria; doctor confere (`doctor.mjs:630-636`) | não se aplica | não se aplica |
| Pastas vazias obrigatórias do cofre | **HIPÓTESE:** não vêm. Na cópia não existem `20-Modulos/Central/Decisoes`, `40-Infraestrutura-e-Nuvem/Registros`, `60-Sessoes-e-Auditorias/Daily` e `90-Arquivo`, que o doctor exige (`doctor.mjs:195-211`), e o git não guarda pasta vazia | doctor falha | `.gitkeep` no esqueleto (`N/.agents/templates/vault-skeleton/*/.gitkeep`) | não se aplica |
| SDK do pipeline (325 MB) | Não (`HUB/.gitignore:53`) | `bootstrap --install-tools`; doctor | não se aplica | não se aplica |
| MCP do cofre | Não: fica no `~/.claude.json` global | `bootstrap --configure-global` (**sobrescreve** `obsidian`); doctor | `.mcp.json` sim. A aprovação (`enabledMcpjsonServers`) fica em `.claude/settings.local.json`, ignorado, e **não vem** (`N/modo-facil/01-fase-2-instalar-ferramentas.md:97-102`) | ninguém |
| Plugins (Superpowers, Ponytail…) | Não: o doctor exige no escopo **user** (`doctor.mjs:444-447`) | doctor | **HIPÓTESE:** `enabledPlugins` do projeto vem; a instalação do plugin é por usuário | ninguém |
| pre-commit do git | não se aplica | não se aplica | **Não**: rodar `sh .githooks/instalar.sh` (`N/.githooks/instalar.sh:3`) | o instalador avisa |
| post-commit do Graphify | Não (`graphify hook install`) | doctor e Stop | Não | ninguém |
| `graphify-out/` | Não (ignorado) | Stop regenera | Indefinido: o kit não ignora e a montagem manda adicionar ao commit (`N/modo-facil/03-projeto-do-zero.md:257`) | conferência manual |
| Registro local do grafo global | Não, por máquina (`registry.local.json`) | `discover` | não se aplica | não se aplica |
| Aprovações (`.central-iso/state/`) | Não (ignorado) | não se aplica | Sim (`estado.md`) | `plano-guard` |
| Programas: node, uv/uvx, graphify, rtk, gitleaks, CLIs | Não | doctor: node, npm, claude, uvx, graphify, rtk, impeccable. **Não confere** Codex nem OpenCode (zero ocorrências em `K/.central-iso/bootstrap/*.mjs`) | Não | só o inventário manual em prosa (`N/modo-facil/00-inventario.md`) |
| Login (Claude OAuth, Context7, `gh`) | Não | doctor tenta o handshake MCP | Não | ninguém |

**Resumo:**

- A Central tem um doctor bom e amplo, mas ele **exige configuração global**: `defaultMode=auto` no global (`doctor.mjs:373`), MCP e plugins de usuário, skills globais do Impeccable e do Graphify (`doctor.mjs:418-421,781`). Isso vai contra a decisão D10 de global limpo (`N/docs/superpowers/specs/...:106`).
- O canônico não tem doctor. Ele precisa de um doctor que só confira o projeto e os programas, sem tocar no global.

---

## Multi-fornecedor

| | Claude Code | Codex | Antigravity | OpenCode |
|---|---|---|---|---|
| **Constituição (Central)** | Por `.claude/CLAUDE.md`, que importa `.central-iso/instructions/` | **HIPÓTESE:** nada no repositório; só o `AGENTS.md` da raiz controladora, se aberto em `Projetos` | Só `.agents/rules/graphify.md` (`trigger: always_on`) | Igual ao Codex |
| **Constituição (canônico)** | `CLAUDE.md` → `@AGENTS.md` | `AGENTS.md` nativo | `AGENTS.md` nativo, mais `.agents/rules/*.md` no primeiro nível (`N/.agents/adaptadores.md:10`) | `AGENTS.md` nativo |
| **Regras curtas (Central)** | `.claude/rules/*` | nada | `graphify.md`, que afirma que "o Stop… executa" a sincronização, mas Stop é hook só do Claude (`K/.../antigravity/project/.agents/rules/graphify.md:20`) | nada |
| **Regras curtas (canônico)** | `.agents/rules/` via `AGENTS.md` | idem, por instrução | **HIPÓTESE:** lê `.agents/rules/*.md`, mas os arquivos não têm o frontmatter `trigger:` que a Central usa; o modo de ativação no Antigravity não foi testado. O conteúdo cita ferramentas do Claude (`mcp__harness-vault__*`) | idem Codex |
| **Índice de memória** | `@` funciona | Por instrução | Por instrução | Por instrução |
| **MCP do cofre (Central)** | `obsidian` global (`~/.claude.json`) | nada | `obsidian` global (`~/.gemini/config/mcp_config.json`) | nada |
| **MCP do cofre (canônico)** | `harness-vault` em `.mcp.json` | previsto em `config.toml`, não feito (`adaptadores.md:17,71`) | "configuração própria", não feito | previsto em `opencode.json`, não feito |
| **Hooks** | Completos nos dois | Central: nada. Canônico: `.codex/hooks.json` previsto, cada hook aprovado em `/hooks` (`adaptadores.md:12`), não feito | não confirmado | por plugin, não feito |
| **Trava comum a todos** | pre-commit do git (canônico, `N/.githooks/pre-commit`); post-commit do Graphify (os dois) | idem | idem | idem |
| **Grafo** | CLI | CLI | CLI | CLI |

Onde fica o `AGENTS.md`:

- **Central:** escondido em `.central-iso/instructions/`, e o verify proíbe colocar na raiz.
- **Canônico:** na raiz, que é o certo para quatro fornecedores.

---

## Oneroso, duplicado, quebrado ou arriscado

Severidade: **A** = alta, **M** = média, **B** = baixa.

1. **[ARRISCADO, A] Um único nome `obsidian` global serve a dois cofres.**
   - **FATO:** o canônico afirma que o `obsidian` de usuário do Gabriel aponta para o **cofre pessoal** (`N/modo-facil/02-fase-2b-fechar-pendencias.md:13,17`).
   - **FATO:** a Central manda o agente usar `mcp__obsidian__search_notes_tool` (`HUB/.claude/hooks/vault-orient.mjs:20-27`).
   - **FATO:** o `bootstrap --configure-global` **sobrescreve** `mcpServers.obsidian` no `~/.claude.json` e no Antigravity apontando para o Knowledge (`K/.central-iso/bootstrap/bootstrap.mjs`, `configureGlobalMcp`).
   - **HIPÓTESE:** hoje, ou a Central lê e escreve no cofre pessoal, ou o cofre pessoal foi substituído. Teste: `claude mcp get obsidian` e ver `OBSIDIAN_VAULT_PATH`.
2. **[ARRISCADO, A] O cofre e o padrão da Central não têm cópia fora do Mac.** O Knowledge é git sem remoto, com 85 alterações pendentes; o Harness não é git (`N/docs/inventario/...:22-24`). O pipeline ainda **apaga** dailies depois de promovê-las (`HUB/.claude/scripts/compile-runner.mjs:955`).
3. **[QUEBRADO, A] O índice de memória não é carregado em HUB, AG e CTP.** Nenhum `CLAUDE.md` deles importa `.claude/memory/` (a busca por `@.claude/memory` só acha `FR/CLAUDE.md:112-113`). Indício que bate com isso: o Frete tem 13 memórias de domínio; o HUB tem 3, todas sobre o próprio harness (`*/.claude/memory/MEMORY.md`).
4. **[QUEBRADO, M] HIPÓTESE: imports relativos errados.** `HUB/.central-iso/instructions/CLAUDE.md:4-6` importa `@.claude/rules/...`. Se o Claude Code resolve `@` relativo ao arquivo que importa (o próprio `.claude/CLAUDE.md` da Central usa `@../`, o que sugere isso), o caminho vira `.central-iso/instructions/.claude/rules/…`, que não existe, e as três regras não carregam. Teste: `/memory` numa sessão no HUB.
5. **[QUEBRADO, A] O `vault-guard` não está registrado em HUB, AG, CTP e Frete** (`*/.claude/settings.json`), embora a regra afirme que bloqueia (`HUB/.claude/rules/obsidian.md:23`). Só a raiz controladora o registra (`C/.claude/settings.json`). Dentro do repositório, o cofre fica aberto para leitura e escrita direta pelo link.
6. **[QUEBRADO, M] O Mod. Frete está fora de tudo.**
   - Ausente dos destinos do Harness (`H/scripts/harness-lib.mjs:71-79`), do `ecosystem.json`, do `Manifesto-de-Repositorios.yaml` (`K/10-Ecossistema/Manifesto-de-Repositorios.yaml:9-19`) e dos modelos de pasta do cofre (`vault-pipeline-shared.mjs:28-59`).
   - Tem placeholders `__OBSIDIAN_VAULT_DIR__` sem trocar.
   - Tem `.mcp.json` local, que o doctor reprova (`doctor.mjs:627`).
   - Sua especificação vive em `20-Modulos/Frete/` no cofre (`FR/CLAUDE.md:88`), pasta que nenhum modelo cobre.
7. **[QUEBRADO, M] Três registros de projetos que não batem.** `ecosystem.json` tem 3, o manifesto YAML tem 2, `harness-lib` tem 4 destinos sem o Frete, e os markers `project.json` são 4. O modelo de `project.json` usa `projectId`, e a descoberta exige `id` (`H/templates/repo-consumer/.central-iso/project.json:3` × `K/.central-iso/bootstrap/lib/common.mjs:92`).
8. **[QUEBRADO, M] O pipeline falha sem ninguém ver.** Há pendências de 10 e 11/09 nunca reprocessadas, uma delas com OAuth expirado (`HUB/.claude/hooks/log/pending/03881716-....json`, `CTP/.claude/hooks/log/pending/ce0e015b-....json`, `session-log-runner.mjs:176`).
9. **[QUEBRADO, B] Links e pastas citados que não existem na cópia.** `K/README.md:27` aponta para `Manifesto-de-Migracao-2026-08-18`; `K/20-Modulos/Indice-de-Modulos.md` aponta para `20-Modulos/Central/Indice-Central`; `ecosystem.json` cita `knowledgeNote` em `20-Modulos/*`. Nenhum desses existe na cópia. **HIPÓTESE:** estão entre as alterações não commitadas ou faltam de verdade.
10. **[ONEROSO, A] Pipeline de dailies.** Cerca de 3.575 linhas copiadas em 4 lugares, 325 MB de SDK por repositório, chamadas Sonnet por sessão, só no Claude Code (seção Memória).
11. **[ONEROSO, M] Stop síncrono de até cerca de 14 minutos** (gate de 180 s mais grafo de 660 s), que bloqueia o encerramento se faltar o cofre ou o dispatcher (`HUB/.claude/hooks/verify-on-stop.mjs:339-349,353-357,386-399`). Numa máquina sem o link, todo fim de turno bloqueia.
12. **[DUPLICADO, M] Quatro mecanismos de distribuição na Central** e duas cópias do controlador e do grafo (seção Distribuição).
13. **[DUPLICADO, M] Três destinos de memória do agente na Central:** `.claude/memory/` com teto 130, `.agents/memory/` via `/remember` com teto 200, e a memória nativa via `autoMemoryEnabled`. No canônico, o modelo de entrega aparece três vezes em cada projeto.
14. **[DUPLICADO, B] Duas variáveis de ambiente para o mesmo cofre:** `CENTRAL_ISO_VAULT` (`verify-on-stop.mjs:164`) e `CENTRAL_ISO_VAULT_PATH`/`OBSIDIAN_VAULT_PATH` (`vault-pipeline-shared.mjs:69-72`). O comentário de `compile.mjs:28-29` cita `.claude/hooks/log/compile-state.json`, mas o código grava no runtime do cofre (`vault-pipeline-shared.mjs:661-663`).
15. **[ARRISCADO, M] Caminhos absolutos fixos.**
   - `/Users/joaogabrielaragaodesouza/Desktop/Projetos` em `H/scripts/harness-lib.mjs:6` e `H/scripts/README.md:15`, e no `registry.local.json` **dentro do modelo** (`H/templates/knowledge-root/.central-iso/graphify/registry.local.json:3`).
   - `/opt/homebrew/bin/uvx` preferido em `vault-pipeline-shared.mjs:457`, com alternativa.
   - **HIPÓTESE:** se o Desktop sincroniza com o iCloud, repositórios e `node_modules` ali correm risco de corrupção ou de serem baixados para a nuvem. Teste: Ajustes do Sistema → iCloud → "Mesa e Documentos".
16. **[ARRISCADO, M] O bootstrap da Central altera o global** (`--configure-global`: força `defaultMode=auto`, grava `obsidian` e `context7` no Claude e no Antigravity, `--clean-global-hooks`). O doctor reprova se o global não estiver assim (`doctor.mjs:373,444-447`). Isso contradiz a D10.
17. **[ARRISCADO, M] Dependência de terceiro buscada na hora.** Os dois harness baixam `obsidian-mcp` do GitHub `Swapo-Finance` via `uvx` (`N/kit-claude-code/dot-mcp.json:8`, `config.json`), fixado em **commits diferentes**. Se o repositório sumir, o cofre para numa máquina nova.
18. **[ARRISCADO, M] O canônico deixa Codex, Antigravity e OpenCode sem cofre** (sem MCP e com leitura direta proibida). O Codex define a demanda (E0) sem memória institucional.
19. **[ARRISCADO, B] Canônico: `.agents/memory/` e as escritas MCP no vault não são travadas para subagentes.** O `escopo-guard` só olha Write/Edit por caminho (`N/kit-claude-code/dot-claude/hooks/escopo-guard.mjs:5-6`), e o `rules-guard` não protege a memória.
20. **[QUEBRADO, B] Canônico: `vault/daily/` sem dono nem limpeza, `vault/.obsidian/` sem ignore, `graphify-out/` sem decisão** (`N/.gitignore:1-4`, `N/modo-facil/03-projeto-do-zero.md:257`). Se `graphify-out/` for versionado, o post-commit o altera depois de cada commit e o `git status` nunca fica limpo (**HIPÓTESE**).
21. **[ARRISCADO, B] A daily da Central guarda o resumo da conversa** (cerca de 64 mil caracteres) em `.claude/hooks/log/pending/`, em texto, se a escrita falhar. Pode conter algo sensível digitado na sessão.

---

## Recomendações concretas para o harness novo

Prioridade: **P0** = antes de migrar a Central; **P1** = na migração; **P2** = depois.

1. **P0. Dê remoto ao cofre e ao padrão hoje.**
   - **O quê:** commitar as 85 pendências do Knowledge, criar remoto no Gitea e fazer push. Transformar `harness-canonico` em git com remoto (já previsto no item 8 da spec).
   - **Por quê:** é o único risco de perda irreversível.
   - **Como testar:** `git -C "Central ISO Knowledge" remote -v` não vazio; `git status --short` vazio; clonar numa pasta temporária e abrir uma nota.

2. **P0. Acabe com o nome `obsidian` global para cofre de projeto.**
   - **O quê:** cofre de projeto só por servidor de **projeto** com nome exclusivo: `harness-vault` para o `vault/` e `ecossistema-vault` para o Knowledge, nos repositórios da Central. Retirar `--configure-global` do bootstrap da Central e trocar `mcp__obsidian__` por `mcp__harness-vault__` no `vault-orient` e nas regras.
   - **Por quê:** item 1 da lista acima, mais a D10.
   - **Como testar:** `claude mcp get obsidian` mostra o cofre pessoal intacto. No HUB, pedir `search_notes_tool` por um termo que só existe no Knowledge: tem que achar. Pedir uma ferramenta `mcp__obsidian__*`: o `vault-guard` bloqueia.

3. **P0. Um só índice de memória, carregado de verdade.**
   - **O quê:** padronizar `.agents/memory/MEMORY.md` mais tópicos em todo projeto. Migrar os `.claude/memory/*` da Central para lá. Apagar `/remember`, que grava em outro lugar. Definir `autoMemoryEnabled: false` no settings do projeto, para não haver memória escondida por máquina (**HIPÓTESE** sobre onde ela fica; confirmar com `/memory`).
   - **Por quê:** itens 3, 4 e 13.
   - **Como testar:** o selftest confere que `AGENTS.md` contém `@.agents/memory/MEMORY.md` e que só existe um `MEMORY.md` no repositório (`find . -name MEMORY.md` = 1). Em cada CLI, perguntar "qual é a primeira entrada do índice de memória?" numa sessão nova.

4. **P0. Não traga o pipeline LLM de dailies.**
   - **O quê:** a memória do fechamento continua explícita (E11 na esteira nova: índice, nota de entrega, leitura de volta). Do pipeline, aproveitar só a regra "sucesso só com prova da ferramenta" e a guarda de wikilink. Remover `vault/daily/` do kit ou ignorá-lo no git, com retenção definida.
   - **Por quê:** itens 8 e 10, mais a evidência do Agend de que o pipeline não supriu a nota de fim de wave.
   - **Como testar:** depois da migração, `grep -rl claude-agent-sdk` nos repositórios = 0. Fechar uma demanda de teste e conferir que a nota está em `vault/01-projetos/<slug>/`.

5. **P1. Trava mecânica para o fechamento da memória.**
   - **O quê:** um script `.agents/bin/memoria-check.mjs`, chamado no fim da E11 e no pre-merge. Ele confere:
     - existe uma nota em `vault/01-projetos/<slug>/`;
     - a nota cita os hashes dos commits da branch;
     - o frontmatter está válido;
     - `MEMORY.md` tem no máximo 130 linhas;
     - `graphify-out/graph.json` → `built_at_commit` é igual ao HEAD (campo que a Central já usa em `verify-on-stop.mjs:219-225`).
   - **Por quê:** hoje é só uma caixinha em `estado.md`.
   - **Como testar:** uma demanda falsa sem nota sai com código diferente de zero; com nota e grafo em dia, sai com zero.

6. **P1. Cofre em dois níveis**, conforme a seção "Cofre por projeto × cofre do ecossistema".
   - **O quê:** declarar no manifesto do projeto (recomendação 8) uma lista `vaults`, com nome, caminho e servidor. O `vault-guard` e o doctor leem dessa lista, em vez de fixar `vault/`.
   - **Por quê:** a Central precisa proteger `.central-iso-vault` ou o caminho irmão; projeto de cliente usa só `vault/`.
   - **Como testar:** casos novos no `selftest.mjs` com `Read .central-iso-vault/x.md` (bloqueia) e `Read vault/x.md` (bloqueia); num projeto de cliente, a lista tem um item só.

7. **P1. Cofre e MCP para as outras três CLIs.**
   - **O quê:** gerar a partir de uma fonte só (o manifesto):
     - `.codex/config.toml` com o mesmo servidor fixado (**HIPÓTESE:** o Codex aceita configuração por projeto; testar);
     - `opencode.json` na raiz;
     - para o Antigravity, sem configuração por projeto confirmada, liberar por regra a **leitura** direta do `vault/` para CLIs sem MCP, mantendo a escrita só no Claude Code.
   - **Por quê:** item 18.
   - **Como testar:** em cada CLI, "busque no vault a nota X e diga a primeira frase". Depois, `git status --short` e `git diff --stat` mostram que nada foi escrito.

8. **P1. Um só mecanismo de distribuição, com versão.**
   - **O quê:** no projeto, `.agents/harness.json` com `kit_versao`, `kit_commit`, `perfil` (`base`, `web`, `ecossistema-central`) e a lista de arquivos geridos com sha256 (ideia do `project-overlay.json`). No kit, três comandos:
     - `instalar`, que já existe;
     - `verificar`, que compara com o kit, aponta drift e órfãos e sai diferente de zero;
     - `atualizar --ensaio` / `--aplicar`, que só substitui arquivo gerido cujo hash bate com a versão anterior; os personalizados vão para um relatório.
   - Aposentar `H/templates`, `H/scripts/*-harness.mjs`, `project-overlay.json` e o AIA Harness depois da migração.
   - **Por quê:** itens 7 e 12.
   - **Como testar:** editar um hook no projeto faz o `verificar` acusar. Subir a versão do kit faz o `atualizar --ensaio` listar o que muda; depois de `--aplicar`, o `selftest` passa e o `verificar` dá zero.

9. **P1. Separe harness de produto dentro do repositório.**
   - **O quê:** manter tudo do harness em `.agents/` (o namespace já existe). Mover `selftest.mjs` e `eslint-rules/` para `.agents/gates/`; o `eslint.config.mjs` da raiz só importa de lá. Não copiar `vault-skeleton` nem `gates-web` para dentro de `.agents/templates/` do projeto.
   - **Por quê:** decisão de não misturar harness com produto; modelo de entrega em três cópias.
   - **Como testar:** depois de instalar, `find . -name entrega.md -not -path './node_modules/*'` = 1, e não há arquivo de harness solto na raiz além de `AGENTS.md`, `CLAUDE.md`, `.mcp.json`, `eslint.config.mjs` e os de ignore.

10. **P1. Doctor de máquina nova no canônico, só leitura e sem exigir nada global.**
    - **O quê:** `node .agents/bin/doctor.mjs` confere:
      - programas: node, git, uv/uvx, graphify, rtk, gitleaks, claude, codex, opencode, antigravity;
      - pre-commit e post-commit instalados;
      - `enabledMcpjsonServers` aprovado;
      - handshake do servidor do vault (o `K/.central-iso/bootstrap/lib/mcp-probe.mjs` serve de base);
      - no perfil `ecossistema-central`, o cofre irmão presente, com remoto e limpo;
      - e só **avisa** sobre hooks, MCP e plugins globais (D10).
    - Saída em linguagem simples, com uma linha pronta para o agente executar cada correção (modo fácil).
    - **Por quê:** a seção "Máquina nova".
    - **Como testar:** num clone novo, numa pasta temporária, a lista bate exatamente com o que falta. Depois de seguir as correções, zero falhas. Com `~/.claude/settings.json` vazio, não falha.

11. **P1. `.gitignore` do kit.**
    - **O quê:** acrescentar `vault/.obsidian/`, `graphify-out/` (recomendado ignorar, como a Central, porque o hook regenera) e `vault/daily/`, se a pasta continuar existindo.
    - **Por quê:** item 20.
    - **Como testar:** abrir o `vault/` no app Obsidian, fazer um commit de código e conferir que `git status --short` fica vazio.

12. **P1. Grafo global como perfil opcional e sob demanda.**
    - **O quê:** no perfil `ecossistema-central`, rodar `graph-sync impact` na E2 e `graph-sync sync --strict` na E11, e **não** no Stop de cada turno. Registrar o Frete e os contratos do CTP-ATP, ou admitir que o global cobre só Central↔Agendamento.
    - **Por quê:** item 11 e cobertura de um único par.
    - **Como testar:** `graph-sync verify` dá zero; um turno do Claude Code que edita código termina sem esperar o grafo; a E11 falha se o grafo global não estiver em dia.

13. **P1. Entregue as regras a cada CLI no formato dela.**
    - **O quê:** na Central, colocar `AGENTS.md` na **raiz** de cada repositório (curto, apontando para `.agents/`) e retirar a regra do verify que reprova isso (`H/scripts/verify-harness.mjs:33-34`). No canônico, escrever `.agents/rules/*.md` sem nomes de ferramenta de um fornecedor só (os nomes vão para `adaptadores.md`) e com o frontmatter que o Antigravity espera, depois de testar.
    - **Por quê:** a seção "Multi-fornecedor".
    - **Como testar:** em cada uma das quatro CLIs, aberta na raiz do repositório, perguntar "qual é a regra 1 sem exceção?" e "onde fica a memória longa?". As respostas têm de citar o `AGENTS.md` do projeto.

14. **P2. Fixe e espelhe o servidor do vault.**
    - **O quê:** um único commit do `obsidian-mcp`, declarado no manifesto e conferido pelo doctor, e um espelho no Gitea (ou o pacote em cache), para não depender do GitHub de terceiro.
    - **Por quê:** item 17.
    - **Como testar:** `grep -rho 'obsidian-mcp@[0-9a-f]*'` em todos os repositórios devolve um valor só; numa máquina nova, o servidor sobe a partir do espelho.

15. **P2. Remova os caminhos absolutos.**
    - **O quê:** descobrir a raiz do workspace a partir da posição do script (como o bootstrap já faz em `K/.central-iso/bootstrap/lib/common.mjs:9-10`). Tirar o `registry.local.json` dos modelos.
    - **Por quê:** item 15.
    - **Como testar:** `grep -rn "/Users/" --include=*.mjs --include=*.json` no harness = 0; rodar o doctor a partir de outra pasta-mãe funciona.

16. **P2. Trave a memória para subagentes.**
    - **O quê:** o `escopo-guard` passa a bloquear escrita de subagente em `.agents/memory/` e chamadas `mcp__harness-vault__create_note_tool`, `update_note_tool` e `edit_note_section_tool` vindas de subagente. O autoteste passa a reprovar qualquer arquivo em `hooks/` que não esteja registrado nem numa lista explícita de desligados.
    - **Por quê:** itens 19 e 5, mais a lista fixa do selftest.
    - **Como testar:** novos casos no `selftest.mjs` com `agent_type` preenchido; criar um hook falso na pasta faz o selftest falhar.
