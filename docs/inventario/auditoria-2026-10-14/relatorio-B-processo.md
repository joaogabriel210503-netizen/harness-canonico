> **Nota de 14/10/2026:** relatório de evidência da auditoria consolidada em `docs/inventario/2026-10-14-auditoria-profunda-central-x-canonico.md`. Os caminhos citam a cópia de auditoria: `…/scratchpad/auditoria/central/` = `~/Desktop/Projetos/` e `…/scratchpad/auditoria/canonico-kit/` = `~/development/harness-canonico/`. Linhas valem para os arquivos de 14/10.

# Relatório B: processo, fluxo, agentes, regras, geradores e previsibilidade

- **Data:** 14 de outubro de 2026
- **Quem fez:** Claude, como auditor, só lendo arquivos locais. Não rodei script, não instalei nada, não acessei rede.
- **Pergunta:** o que o harness novo (harness-canonico) deve absorver da Central ISO, o que está duplicado, contraditório ou sem trava, e como deixar a saída de cada agente previsível, para o Gabriel conferir quando ele errar.

## Como ler

Todos os caminhos são relativos a `/tmp/claude-0/-home-claude/d40a5fd9-9768-56ee-97e9-71e16c66241c/scratchpad/auditoria/`. Para as tabelas caberem, uso estas abreviações:

| Abreviação | Pasta |
|---|---|
| `[R]` | `central/` (raiz controladora: `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.agents/` e os documentos soltos) |
| `[CI]` | `central/Central ISO/` (repositório do hub) |
| `[H]` | `central/Central ISO Harness/` |
| `[F]` | `central/FrameWork Central ISO/` |
| `[M]` | `central/Módulos Central/` |
| `[K]` | `canonico-kit/` (harness novo) |
| `[E13]` | `canonico-kit/docs/superpowers/specs/2026-10-14-esteira-e0-e13-design.md` (desenho aprovado, ainda não aplicado ao kit) |

- **FATO:** li no arquivo citado. `arquivo:N` quer dizer linha N.
- **HIPÓTESE:** é inferência minha. Precisa ser confirmada antes de virar decisão.
- **Limite da cópia:** veio só o que é harness. Quase não há código de produto, e `central/_PULADOS.txt` lista o que ficou de fora (configurações locais, logs, `.DS_Store`). Quando digo que um arquivo "não existe", vale para esta cópia.
- **Limite da frente:** li os hooks só no que eles mudam o processo. A auditoria dos hooks em si é de outra frente.

## Resumo

1. **O kit tem cinco mapas de papéis diferentes ao mesmo tempo** (FATO). `AGENTS.md`, `adaptadores.md`, `ondas.md`, `maestri/papeis.md` e `modo-facil/04` atribuem revisão, validação e coordenação a agentes diferentes. O `[E13]` aprovado resolve no papel, mas a própria lista de arquivos que ele manda mudar esquece vários deles.
2. **A Central tem pelo menos nove textos de fluxo** que discordam em pontos que mudam o resultado: quantas aprovações existem, se a SPEC é obrigatória, se o commit é por tarefa ou por onda, se pode trabalhar direto na `main`. O texto principal que os repositórios carregam (`.central-iso/instructions/AGENTS.md`) ainda manda combinar o fluxo antigo com o Superpowers, opção que a própria Central rejeitou.
3. **Agentes:** a Central tem 21 agentes por repositório. Catorze deles têm o mesmo corpo de 18 linhas, só muda a descrição. Há três grupos duplicados (segurança, revisão de código, exploração). Sete agentes não têm `tools` no frontmatter, então herdam todas as ferramentas, inclusive os que se dizem "somente leitura". O kit tem contratos muito melhores, mas os adaptadores não fixam ferramentas nem modelo.
4. **Vocabulário de saída:** contei 9 vocabulários de status e veredito em uso (FATO). Do jeito que está, não dá para prever a saída de um agente nem conferir a saída por script.
5. **Geradores da Central:** o intake classifica por palavra-chave e bloqueia prompts legítimos que contêm "token" ou "sync". O gerador de plano devolve sempre as mesmas três tarefas fixas. O sintetizador de revisão tem um defeito grave: um relatório fora do formato vira "APROVADO". Não achei uso real de nenhum deles fora dos testes das waves.
6. **A prática real da Central** (pastas `.superpowers/sdd/`) tem coisas excelentes que o kit não tem: varredura de conflitos antes da wave, "Rulings" com custo se errado, registro de agente, modelo e id, e até teste de mutantes. Ela mostra também o erro que o Gabriel quer pegar: o orquestrador tratou um `BLOCKED` como `DONE` e se desviou do plano aprovado por decisão própria.
7. **Compatibilidade:** a Central é JavaScript, sem `typecheck` nem `lint:types`. Pela regra do kit, um perfil sem os quatro gates não entra em uso, então hoje a Central não consegue obedecer ao harness novo.

---

## Fluxo comparado

### Quantas descrições de fluxo existem

**No kit (FATO), cinco mapas de papéis:**

| Arquivo | O que diz |
|---|---|
| `[K]AGENTS.md:59-70` e `[K].agents/fluxo.md:17-18` | E6 é feita por `code-reviewer` e `security-reviewer`, subagentes do Claude. E7 é feita por `validador-visual` |
| `[K].agents/adaptadores.md:49-57` | Revisor 2 da E6 é o Antigravity. Segurança fica com o Codex ou o OpenCode. O OpenCode é "dúvida pontual e reserva" |
| `[K].agents/rules/ondas.md:8` | O Codex é o segundo revisor e o Antigravity faz a validação visual |
| `[K]maestri/papeis.md:5-11` | O Codex é o Orquestrador (coordena, escreve ordens, revisa segurança). O Claude Code é o "Dev Sênior". O OpenCode é Analista de Infra |
| `[K]modo-facil/04-rotina-de-uma-demanda.md:7-9` | O Codex é o tech lead e consultor. O OpenCode é "Dúvida" |
| `[E13]:45-53, 112-117` (aprovado, não aplicado) | O Codex é tech lead na E0 e revisor final na E10. O Antigravity faz pesquisa. O OpenCode cuida de infra e deploy |

**Na Central (FATO), nove textos de fluxo com diferenças que mudam o resultado:** `[R]AGENTS.md`, `[F]AI_PROTOCOL.md`, `[CI].central-iso/instructions/AGENTS.md`, `[H]docs/02_FLUXO_PROMPT_PARA_EXECUCAO.md`, a máquina de estados em `[H]docs/superpowers/specs/2026-08-26-central-iso-harness-canonico-design.md:336-393`, `[H]canonico/02-fluxo-operacional.md`, `[R]detalhamento_modulo.md`, `[R]detalhamento_manutencao.md` e os comandos `[CI].claude/commands/create.md` e `enhance.md`. O `Mod. Frete` segue um harness diferente, gerado pelo aia-harness (`[M]Mod. Frete/CLAUDE.md:114`).

### Tabela etapa a etapa

A coluna "Etapa" usa a numeração nova (E0 a E13).

| Etapa | Kit hoje (E0–E10) | Desenho aprovado `[E13]` | Central | Observação |
|---|---|---|---|---|
| **Entrada e classificação do pedido** | Não classifica. Toda demanda começa na E0 (`[K].agents/fluxo.md:9`). "Demanda pequena" só encolhe os documentos (`fluxo.md:37-39`) | Igual ao kit | Quatro classificações diferentes: 7 categorias (`[H]docs/02...:30-42`), 8 tipos (`[H]canonico/02-fluxo-operacional.md:22-31`), "correção pequena pode ir direto" (`[H]canonico/05-mudanca-correcao-feature.md:19`), spike/bounded/architectural (`[H]...design.md:341,370`). O Frete usa "≥2 de 4 critérios, senão implemente inline" (`[M]Mod. Frete/CLAUDE.md:28-35`) | FATO: a Central classifica com riqueza, mas se contradiz. O kit não classifica nada. Bug urgente e pergunta pura não têm caminho definido no kit |
| **E0 Definição** | `tech-lead`, uma pergunta por vez. Grava definição, `estado.md` e `pedido.md` (`fluxo.md:9`, `personas/tech-lead.md`) | Codex (D3, `[E13]:61-65`) | Não há etapa separada: a descoberta é do Superpowers, dentro do Claude Code (`[R]AGENTS.md:17`, `[F]AI_PROTOCOL.md:76-80`). O "tech lead" é um assistente de IDE que escreve prompts e revisa o Claude (`[R]🤖 System Prompt.md:4-11`). Módulo novo tem 12 perguntas (`[H]canonico/03-criacao-de-modulo.md:7-20`) e um template de arquitetura (`[F]MODULO_X_ARCHITECTURE_TEMPLATE.md`) | A Central tem contrato de domínio (Central × módulo) que o kit não tem. O `templates/definicao.md` do kit é genérico |
| **E1 Preparação** | Branch `demanda/<slug>` (`fluxo.md:10`, `rules/commit.md:13-15`) | Igual | Trabalho direto na `main` permitido (`[R].claude/rules/git-solo-main.md:3,10`, `[CI].central-iso/instructions/AGENTS.md:61`). A spec da Central exige worktree ou branch (`[H]...design.md:347,376`). O `detalhamento_modulo.md:121-122` diz que "/create gera branch e o agente faz o merge" | **Conflito direto** (FATO) |
| **E2 Consulta prévia** | Ordem vault, grafo, documentos, estrutura e Context7. Seção "Consultas feitas" obrigatória (`rules/consulta.md:5-26`). O `plano-guard` confere só o título da seção (`[K]kit-claude-code/dot-claude/hooks/plano-guard.mjs:47`) | Igual | Seção "Contexto consultado" no plano (`[CI].claude/rules/planning-requires-knowledge-and-graphify.md:15-22`), com exceção para tarefa mecânica (`:28-30`). Grafo local e grafo global (`[R].agents/rules/graphify.md:10-15`) | Mesma ideia com nomes diferentes. Só a Central prevê grafo global (impacto entre repositórios) |
| **E3 SPEC** | Superpowers brainstorming, com critério de aceite por tela e por regra (`fluxo.md:12`) | Igual | SPEC obrigatória só "quando houver ambiguidade, risco ou mudança estrutural" (`[CI].central-iso/instructions/AGENTS.md:36`) ou "quando o comportamento não está claro" (`[H]canonico/02...:34`). Em outro texto, é obrigatória para toda mudança de comportamento (`[R]AGENTS.md:17`) | FATO: na Central, o próprio agente decide se precisa de SPEC. A saída fica imprevisível |
| **Aprovação da SPEC** | Frase explícita, com data, em `estado.md` (`[K]AGENTS.md:15-16`) | "Aprovo a SPEC." (`[E13]:129`) | Frases diferentes em cada texto (ver tabela de portões) | |
| **E4 Plano** | `Files:`, `Depends-on:`, `Owner`, verificação e waves (`rules/ondas.md:17-27`) | Mais a tarefa de contrato na primeira wave (D8, `[E13]:88-92`) | `Files:` e `Depends-on:` (`[CI].claude/rules/08-parallel-subagent-driven-development.md:67-77`). O comando `/plan` do ag-kit grava `{slug}.md` na raiz usando um agente que não existe (`[CI].claude/commands/plan.md:15-38`) | O kit é melhor: tem `Owner` e verificação |
| **Aprovação do plano** | Separada da SPEC (`fluxo.md:15`) | "Aprovo o plano." | `/create` e `/enhance` não param para aprovar o plano (`[CI].claude/commands/create.md:11-13`, `enhance.md:9`). O AI_PROTOCOL tem uma aprovação só (`[F]AI_PROTOCOL.md:95-99`). O doc 02 e o detalhamento_manutencao têm duas | FATO: na Central, o comando principal pula a segunda aprovação |
| **E5 Execução da wave** | Um arquivo de passagem por tarefa, despacho numa mensagem só, ninguém commita (`ondas.md:38-47`) | Implementadores não conversam entre si (D8) | Igual, mais a ponte "tipo do agente × corpo do prompt" (`08-...:57-65`). Na prática: `task-N-brief.md` e `task-N-report.md` em `.superpowers/sdd/<plano>/` (`[CI].superpowers/sdd/2026-09-11-atendimento-perfis-acesso/`) | Só a Central diz como juntar a persona com o contrato do Superpowers |
| **E6 Revisão interna** | `code-reviewer` e `security-reviewer`, independentes, cada um no próprio arquivo, síntese do orquestrador (`fluxo.md:17`) | Igual | Revisores da skill (dois vereditos: aderência à spec e qualidade) mais os exigidos pelo CLAUDE.md (`08-...:105-109`). Protocolo cego com 5 lentes (`[H]docs/08_PROTOCOLO_REVIEW_MULTIAGENTE.md:19-27`). Na prática, o revisor é escolhido pelo tipo de arquivo: `react-reviewer`, `js-ts-reviewer`, `database-architect` (`[CI].superpowers/sdd/2026-09-11-.../progress.md:41,46`, `[M]Mod. Agend/.superpowers/sdd/2026-10-07-hotfix-fuso-chegada/progress.md`, linha "Reviews (somente leitura") | A Central usa mais lentes, mas com vocabulário próprio |
| **E7 Validação visual** | `validador-visual` com agent-browser e Chrome DevTools. Wave sem tela pula (`fluxo.md:18,23`) | Mais Impeccable (`[E13]:134,180`) | "Validação no browser/agent-browser" (`[R].claude/rules/memory-graphify-browser-policy.md:15-18`). A spec da Central exige agente independente mais Playwright E2E repetível (`[H]...design.md:353-355,383-384`). Na prática usa Playwright (hotfix `progress.md`, "Passo 10 browser (Playwright") | **Conflito de ferramenta:** o kit desliga o MCP do Playwright (`[K]modo-facil/01-fase-2-instalar-ferramentas.md:122`) |
| **E8 Gates** | `lint`, `typecheck`, `lint:types` e `test` (`rules/gates.md:7-13`) | Igual | `node scripts/verify.mjs` (`[CI].claude/rules/verification.md:8`). O projeto é JS, sem etapa TypeScript (`[CI]docs/harness/strategies.md:15-16`). O backend não tem lint (`[CI]backend/CLAUDE.md:15-16`). O doc 02 roda os gates antes da revisão (`[H]docs/02...:23-24`) | FATO: faltam dois dos quatro gates na Central, e `[K].agents/stack.md:48` impede usar o perfil assim |
| **E9 Commit** | Só o orquestrador, um commit por tarefa, só os `Files:` (`rules/commit.md`). O `commit-guard` trava subagente (`[K]kit-claude-code/dot-claude/README.md:14`) | Igual | Por tarefa (`08-...:113-115`). Por onda (`[H]canonico/05-...:29`). O plano pode mandar "ONE combined commit" (`[CI].superpowers/.../progress.md:28,55`). `git commit` está no `allow` de qualquer sessão (`[CI].claude/settings.json`, bloco `permissions.allow`) | **Três regras de commit diferentes** na Central |
| **E10 Revisão final (nova)** | Não existe | Codex, com `gitleaks` e `npm audit` antes e dois subagentes Codex sobre o diff da branch. Até três rodadas (`[E13]:137,145`) | "Final whole-branch review" feita por `code-reviewer` com Opus (`[CI].superpowers/.../progress.md:59`). Mantida por `08-...:138-143` | A Central já faz revisão da branch inteira, mas com a mesma família de modelo |
| **E11 Memória** | Hoje é E10: índice, nota de entrega, `graphify update` e relatório (`rules/memoria.md:65-70`) | Passa a ser depois do Codex (`[E13]:179`) | Memória e grafos depois do commit, mas a "memória leve" entra dentro do commit (`[F]AI_PROTOCOL.md:129-137`, item 1) | Ordem diferente |
| **E12 Merge** | Humano (`rules/commit.md:9`) | Gabriel | Não há merge, trabalha na `main`. Um texto diz que "o agente faz o merge" (`[R]detalhamento_modulo.md:122`) | Conflito |
| **E13 Deploy** | Não existe | OpenCode prepara `deploy-NN.md` e o Gabriel executa (D4) | Checklist de deploy completo (`[F]CONTRATO_DE_MODULO_E_DEPLOY.md:109-262`) e o comando `/deploy` (`[CI].claude/commands/deploy.md`) | O checklist da Central é o melhor ponto de partida para o template de deploy |

### Portões de aprovação humana

| Portão | Kit | `[E13]` | Central |
|---|---|---|---|
| SPEC | "Aprovo a SPEC.", sozinha numa mensagem, gravada em `estado.md` (`[K]AGENTS.md:16`, `[K]modo-facil/04...:39-41`) | Igual (`:129`) | "aprovo" (`[R]detalhamento_modulo.md:24`). "Aprovo a especificação. Faça o plano." (`[R]detalhamento_manutencao.md:69`). Manifesto com hash gerado por script com `--approved-by` livre (`[H]scripts/generate-approval-manifest.mjs:13,38-48`) |
| Plano | "Aprovo o plano." | Igual | "Aprovado" (`[F]AI_PROTOCOL.md:97`). "Aprovo o plano. Execute somente esse escopo..." (`detalhamento_manutencao.md:80`). `/create` não para (`create.md:11-13`) |
| Ordem entre agentes | "Aprovo a ordem NN." (`[K]maestri/papeis.md:15`) | Não fala | Não existe |
| Mudar regra ou hook | O humano roda `touch .claude/liberar-regras` (`[K]kit-claude-code/dot-claude/README.md:22`) | Não fala | "Auditoria + plano + review autônomo" (`[H]docs/02...:41`) |
| Desligar tudo | `HARNESS_BYPASS=1` (`README.md:23`) | Não fala | Não existe |
| Push e merge | Só o humano | E12, Gabriel | Push "quando autorizado na sessão" (`git-solo-main.md:10`) |
| Deploy | Não existe | O Gabriel executa (D4) | Autorização explícita (`deploy.md:9`, `CONTRATO...:113-125`) |
| Dependência nova | Não há portão (só o revisor confere) | Não fala | Exige aprovação (`[F]AI_PROTOCOL.md:167`, `[H]...design.md:404`) |
| Apagar dado | Não há portão | Não fala | Exige aprovação (`AI_PROTOCOL.md:171`, `[H]...design.md:405`) |
| Mudança material do plano no meio da execução | Não há portão. O implementador "para e reporta" (`personas/backend-specialist.md:11`) | Não fala | Nova aprovação (`AI_PROTOCOL.md:98-99` fala em "nova consulta" ao Gabriel, `[H]...design.md:403`) |

### Quando algo reprova

- **Kit (FATO):** abre reparo com no máximo três tentativas: mesma sessão, sessão nova e outro modelo. O agente precisa escrever "por que errei" antes de corrigir. Se o erro for do plano ou da SPEC, volta para E4 ou E3 com nova aprovação (`[K].agents/rules/reparo.md`).
- **`[E13]`:** achado da E10 vira tarefa nova, que passa de novo por E5 a E9. Até três rodadas, e o desempate é do Gabriel (`[E13]:145-146`).
- **Central (FATO):** depuração sistemática do Superpowers, "uma causa por vez", sem limite de tentativas (`[F]AI_PROTOCOL.md:184-195`). A spec da Central fala em três tentativas e parada (`[H]...design.md:391-393`). Há um laço de correção por tarefa antes do commit (`08-...:110-112`).
- **Central na prática (FATO), o erro que importa:** o `backend-specialist` reportou `BLOCKED` e o controlador decidiu sozinho "treated as DONE" (`[CI].superpowers/sdd/2026-09-11-atendimento-perfis-acesso/progress.md:34-39`). Em outra execução, o controlador fez o runbook divergir do plano aprovado, só registrando um ADR, sem nova aprovação (`[M]Mod. Agend/.superpowers/sdd/2026-10-07-hotfix-fuso-chegada/progress.md`, "Ruling 5"). O kit também não tem regra que proíba isso.
- **Kit (FATO):** o `debugger` aparece só na tabela do `AGENTS.md:67`. Nem `fluxo.md` nem `rules/reparo.md` dizem quando ele entra. O `[E13]:160` diz "dentro do reparo", mas o reparo não o menciona.

### Critério de pronto

- **Kit (FATO):** tarefa pronta é tarefa com três gates passando. Wave pronta tem quatro gates, revisão e validação. Demanda pronta cumpre o checklist da E10 de `[K].agents/templates/estado.md:42-47`.
- **Central (FATO):** quatro versões parecidas. A mais completa é a de `[F]AI_PROTOCOL.md:231-242` (oito itens, incluindo "sem expansão silenciosa de escopo" e "push e deploy continuam pendentes"). As outras estão em `[R]AGENTS.md:38`, `[H]canonico/02...:53-62` e `[CI].central-iso/instructions/AGENTS.md:63-65`.

### Quando o humano pede para pular etapa

- **Kit (FATO):** responde em três linhas e não executa, nem se o humano insistir. Para mudar a regra, o humano edita o `AGENTS.md` (`[K]AGENTS.md:11`, `fluxo.md:33-35`, `personas/orquestrador.md:25-27`). O `plano-guard` repete essa instrução na mensagem de bloqueio (`plano-guard.mjs:67`).
- **Central (FATO):** "bloquear, pedir autorização específica ou redirecionar" (`[H]docs/02...:109-121`), ou seja, aceita exceção no meio da conversa. O intake bloqueia só "pula spec", "sem spec" e "direto no código" (`[H]scripts/intake-prompt.mjs:82`). Basta escrever "pule a especificação" para passar.

### Achados do fluxo

1. **FATO:** a lista do que mudar no kit (`[E13]:182-195`) não inclui `modo-facil/04` (OpenCode como "Dúvida"), `ondas.md:8`, as linhas 49-57 de `adaptadores.md`, `templates/ordem.md` e `templates/relatorio.md` (feitos para o Codex orquestrador), `README.md:13` ("E0 a E10"), `origem.md:41` e `docs/inventario/...:43`. Este último já afirma "Etapas E0–E13" como se existissem.
2. **FATO:** o template de relatório final da E10 (`[K].agents/rules/memoria.md:70` aponta para `templates/relatorio.md`) é o relatório de uma ordem do Maestri, com os campos "Ordem: .../ordem-NN.md" e "Executor" (`[K].agents/templates/relatorio.md:3-4`). Ele não serve para o fechamento de uma demanda.
3. **FATO:** `[K].agents/templates/ordem.md:4-5` diz "Emitida por: Orquestrador (Codex)", o que contradiz a decisão D1 (o Codex deixa de coordenar).
4. **HIPÓTESE (provável):** os subagentes `general-purpose` vistos pelo Gabriel (`[E13]:214`) vêm das skills do Superpowers, que usam `general-purpose` nos exemplos. O Frete documenta exatamente isso (`[M]Mod. Frete/CLAUDE.md:51-55`), e a Central tem uma ponte para corrigir (`[CI].claude/rules/08-...:57-65`). O kit não tem ponte nem trava.
5. **FATO:** no kit, uma "demanda pequena" ainda exige a E0 no Codex (`fluxo.md:37-39`). Para uma correção de uma linha, são dois terminais e quatro colagens. Isso pesa para o Gabriel.

---

## Agentes comparados

### Tabela 1: harness canônico

Os adaptadores do Claude ficam em `[K]kit-claude-code/dot-claude/agents/<nome>.md`. Todos têm só `name` e `description` no frontmatter, sem `tools`, `model` nem `skills` (FATO, 11 linhas cada). Cada um manda ler `.agents/personas/<nome>.md`.

| Agente | Papel | Edita código? | Frontmatter (ferramentas, modelo, skills) | Contrato ou checklist | Formato de relatório exigido |
|---|---|---|---|---|---|
| `tech-lead` (sessão, Codex) | E0 e consultor do humano | Não, só `docs/definicao` e `docs/fluxo` | Sem adaptador (`dot-claude/README.md:16`) | Brainstorming, checklist de 5 itens, limites (`personas/tech-lead.md:15-43`) | Só o caminho de `handoff/pedido.md` (`:23-25`) |
| `orquestrador` (sessão, Claude Code) | E1–E10, despacho, gates, commit | Não, só documentos | Sem adaptador | "O que faz" e "o que nunca faz" (`personas/orquestrador.md`) | `estado.md` e relatório final. Sem formato de mensagem fixo |
| `backend-specialist` | Implementador | Sim, só os `Files:` | Nenhum campo | Contrato de 7 passos e checklist de 6 itens | Seção "Relato" do handoff: status (3 valores), arquivos tocados, saída real de 3 gates, o que ficou de fora (`personas/backend-specialist.md:30-32`) |
| `frontend-specialist` | Implementador | Sim, só os `Files:` | Nenhum campo | 7 passos e checklist de 6 itens | Igual ao backend |
| `database-architect` | Implementador | Sim, só os `Files:` | Nenhum campo | 7 passos e checklist de 6 itens (inclui lembrar o backup) | Igual ao backend |
| `test-engineer` | Implementador de testes | Só testes (`escopo-guard`) | Nenhum campo | Contrato de 5 passos e checklist de 4 itens | Status, arquivos, gates e "regras sem teste" |
| `debugger` | Causa raiz | Só o teste que reproduz (`escopo-guard`) | Nenhum campo | Systematic-debugging em 5 passos | Reprodução, causa raiz com arquivo e linha, teste e hipóteses descartadas. **Não tem campo de status** (`personas/debugger.md:17-19`) |
| `code-reviewer` | E6 | Não, só o próprio relato (`escopo-guard`) | Nenhum campo | 5 regras, 4 severidades e 6 perguntas de lente | Arquivo próprio com tabela de 5 colunas (`personas/code-reviewer.md:33-35`) |
| `security-reviewer` | E6 | Não, só o próprio relato | Nenhum campo | Igual ao code-reviewer. A definição de severidade é idêntica, sem adaptação para segurança (`personas/security-reviewer.md:15-20`) | Igual |
| `validador-visual` | E7 | Não | Nenhum campo | 6 passos e a definição do que é defeito | `validacao-wave-N.md` (`templates/validacao-wave.md`) |
| `devops-engineer` (aprovado em D5, ainda não existe) | Implementador de Docker, CI, `.env.example` e scripts de build | Sim, só os `Files:`, sem tocar servidor | Ainda não existe | Mesmo contrato dos implementadores, checklist de 4 itens (`[E13]:167-172`) | Não definido |
| Codex revisor final, 2 subagentes (aprovado, não existe) | E10, código e segurança | Não | `.codex/agents/*.toml`, ainda não existe | Não definido | `revisao-final.md`, ainda não existe (`[E13]:189`) |
| OpenCode infra e deploy (aprovado) | E13 | Não | Não existe persona em `.agents/personas` | Só a versão 2 de "Analista de Infra" (`maestri/papeis.md:37-41`) | `infra-NN.md` e `deploy-NN.md`, ainda sem template |
| Antigravity pesquisa (aprovado) | Sob demanda | Não | Não existe persona | Só a versão 2 de "Pesquisa e Criativo" (`maestri/papeis.md:43-48`) | `pesquisa-NN.md` com fonte e data |

### Tabela 2: Central ISO

**Onde existem (FATO):** `[CI].claude/agents/` tem 21 agentes, e `Mod. Agend` e `Mod. CTP-ATP` têm cópias idênticas (comparei com `diff`). `[R].claude/agents/` tem 14, idênticos aos do hub. `[M]Mod. Frete/.claude/agents/` tem só 2 (ECC). A spec da Central lista 12 personas, cinco delas sem arquivo: `controller`, `ui-reviewer`, `browser-tester`, `documentation-reviewer` e `graph-memory-reviewer` (`[H]...design.md:419-432`).

**"Contrato padrão":** o mesmo corpo para os 14 agentes curtos. Status `DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED`, arquivos, comandos, riscos e evidência (`[CI].claude/agents/backend-specialist.md:10-18`).

| Agente | Papel (descrição) | Edita código? (`tools`) | Modelo | Skills | Contrato ou checklist | Formato de relatório | Equivalente no kit | Veredito |
|---|---|---|---|---|---|---|---|---|
| backend-specialist | APIs Express/Node | Sim: Read, Edit, Write, Bash | sonnet | não | Só o contrato padrão | Contrato padrão | backend-specialist | O do kit é melhor. Trazer só o modelo no frontmatter |
| frontend-specialist | React/Vite | Sim | sonnet | não | Contrato padrão | Contrato padrão | frontend-specialist | Igual ao anterior |
| database-architect | "**Reviews** schema, migrations" | Sim (descrição de revisor com ferramentas de escrita) | opus | não | Contrato padrão | Contrato padrão | database-architect | Usado como revisor na prática (`[CI].superpowers/.../progress.md:46`). Papel ambíguo |
| debugger | Causa raiz | Sim | sonnet | não | Contrato padrão | Contrato padrão | debugger | O do kit é melhor |
| devops-engineer | "**Reviews** Docker, env, deploy, CI/CD, networking" | Sim | sonnet | não | Contrato padrão | Contrato padrão | devops-engineer (novo) | Trazer o nome. O escopo do kit (só arquivos do repo) é mais seguro |
| test-engineer | Testes RED/GREEN | Sim | sonnet | não | Contrato padrão | Contrato padrão | test-engineer | O do kit é melhor |
| code-reviewer | Revisão somente leitura | Read, Bash (com Bash dá para escrever arquivo) | sonnet | não | Contrato padrão | Contrato padrão | code-reviewer | Fundir |
| security-reviewer | Auth, segredos, dependências | Read, Bash | opus | não | Contrato padrão | Contrato padrão | security-reviewer | Fundir. Trazer o modelo forte |
| js-ts-reviewer | Corretude JS/TS, async | Read, Bash | sonnet | não | Contrato padrão | Contrato padrão | Lente do code-reviewer | **Duplicado** |
| penetration-tester | Revisão ofensiva controlada | Read, Bash | opus | não | Uma frase e o contrato padrão | Contrato padrão | security-reviewer e Codex E10 | **Duplicado**, descartar |
| code-archaeologist | Mapa de código legado | Read, Bash | sonnet | não | Contrato padrão | Contrato padrão | Nenhum (o D5 recusou o explorer-agent) | Ver lacunas |
| performance-optimizer | Acha e corrige gargalo | Sim | sonnet | não | Contrato padrão | Contrato padrão | Nenhum | Genérico, descartar |
| qa-automation-engineer | Browser real e E2E | Sim | sonnet | não | Contrato padrão | Contrato padrão | validador-visual | **Duplicado**. O do kit é melhor |
| orchestrator | Coordena e escreve planos como **subagente** | Sim | opus | não | Contrato padrão | Contrato padrão | Sessão principal | **Erro de conceito.** Descartar |
| documentation-writer | README, API docs, runbook | **Sem `tools`** (herda tudo, HIPÓTESE pelo comportamento padrão do Claude Code) | sonnet | não | Checklist ag-kit em inglês (`documentation-writer.md:85-91`) | Nenhum | Nenhum (o D5 recusou) | Usado de verdade para runbook (hotfix `progress.md`, "Agentes da Wave 1"). Ver lacunas |
| explorer-agent | Mapear base desconhecida | **Sem `tools`** | sonnet | não | ag-kit. Manda "pare e pergunte ao usuário", coisa que subagente não consegue (`explorer-agent.md:44-51`) | Nenhum | Nenhum | Descartar |
| product-manager | Consultor de valor dentro do brainstorming | **Sem `tools`**, mas o texto diz "não escreva arquivos" | sonnet | não | 5 regras | "Evidências, opções, trade-offs, perguntas" | Checklist do tech-lead | Absorver como checklist |
| product-owner | Critérios de aceite e coerência de escopo | **Sem `tools`** | sonnet | não | 4 regras | Sem formato | Checklist do tech-lead | Absorver como checklist |
| react-build-resolver | Falha de build Vite/React | **Sem `tools`** | sonnet | não | 6 passos (`react-build-resolver.md:9-18`) | "Comando, resultado e riscos" | debugger | Fundir como checklist |
| react-reviewer | Revisão React | **Sem `tools`**, mas o texto diz "somente leitura" | sonnet | não | Lista de severidade específica de React (`react-reviewer.md:13-16`) | Achados por severidade com arquivo e linha | Lente do code-reviewer | Trazer a lista como lente |
| security-auditor | SAST e ameaças (ag-kit, 174 linhas) | **Sem `tools`** | sonnet | não | Tabela OWASP 2025 (`security-auditor.md:64-77`). Manda rodar `python scripts/security_scan.py`, que não existe nesse caminho (o arquivo real é `[CI].claude/skills/vulnerability-scanner/scripts/security_scan.py`) | "Clear findings with remediation" | security-reviewer | **Duplicado.** Trazer só a tabela OWASP |
| Frete code-reviewer (ECC, 358 linhas) | Revisão geral | **Sem `tools`** | sonnet | Cita a skill `uncle-bob-craft` só no texto (`[M]Mod. Frete/CLAUDE.md:110`) | Exige >80% de confiança, gate de 4 perguntas antes de reportar, ALTO e CRÍTICO com prova, "zero achados é válido", conferência contra as regras (`code-reviewer.md:21-66, 319-358`) | `[SEVERIDADE]`, tabela-resumo e veredito **APPROVE/WARNING/BLOCK**, em que **ALTO = WARNING, pode mergear** (`:282-287`) | code-reviewer | Trazer o gate e a exigência de prova. **Não** trazer a política de veredito |
| Frete security-reviewer (ECC) | OWASP e segredos | **Sem `tools`** | sonnet | não | Tabela de padrões com severidade (`security-reviewer.md:55-69`) | Sem formato fixo | security-reviewer | Trazer a tabela de padrões |

### Duplicados

1. **Segurança, seis papéis para uma lente (FATO):** `security-reviewer`, `security-auditor` e `penetration-tester` (Central), o security-reviewer do Frete (ECC), o `security-reviewer` do kit e o subagente de segurança do Codex na E10. Cada um classifica severidade de um jeito: o security-auditor usa EPSS e CVSS (`security-auditor.md:85-91`), o ECC diz que "No rate limiting" é ALTO (`Frete security-reviewer.md:69`), e o kit tem uma definição genérica.
   - **Recomendação:** um só `security-reviewer` interno (o do kit), enriquecido com a tabela OWASP 2025 e a tabela de padrões. A segunda opinião vem do Codex na E10. O lado mecânico fica com `gitleaks` e `npm audit`.
2. **Revisão de código, sete papéis (FATO):** `code-reviewer`, `js-ts-reviewer` e `react-reviewer` (Central), o code-reviewer do Frete (ECC), o revisor de tarefa do Superpowers (dois vereditos, usado na prática, `[CI].superpowers/.../progress.md:41`), o `code-reviewer` do kit e o subagente de código do Codex na E10.
   - **Recomendação:** um `code-reviewer` com "lentes condicionais" ativadas pela extensão dos `Files:` (JS/TS async, React hooks), escritas como checklist dentro da persona. Não criar agentes separados.
3. **Browser e QA (FATO):** `qa-automation-engineer`, `validador-visual`, `browser-tester` e `ui-reviewer` (os dois últimos só na spec da Central) e o Impeccable. Fica o `validador-visual`.
4. **Exploração (FATO):** `explorer-agent` e `code-archaeologist`.
5. **Produto (FATO):** `product-manager`, `product-owner` e o `tech-lead` do kit. O tech-lead cobre a E0.
6. **Depuração (FATO):** `debugger` e `react-build-resolver`.

### O que falta no canônico e vale trazer

1. **Ponte entre Superpowers e persona.** Na Central, o tipo do agente e o corpo do prompt são coisas separadas (`[CI].claude/rules/08-...:57-65`), e o Frete tem uma tabela "quando o Superpowers usaria general-purpose, despache X" (`[M]Mod. Frete/CLAUDE.md:48-66`). Sem isso, o despacho cai em `general-purpose` (achado 4 do fluxo).
2. **Modelo padrão por persona no frontmatter**, com a tabela de níveis de `[R].claude/rules/model-discipline.md:5-9`. O kit diz "defina a cada despacho e registre" (`[K]AGENTS.md:72`), mas sem valor padrão o subagente herda o modelo da sessão (HIPÓTESE pelo comportamento padrão do Claude Code). O custo e a qualidade ficam imprevisíveis.
3. **Dono para tarefa de documentação ou runbook.** O `Owner` precisa ser um nome da tabela (`[K].agents/rules/ondas.md:24`), e nenhuma persona do kit escreve runbook ou README. A Central usou `documentation-writer` num hotfix real. Opções: dar ao `devops-engineer` (runbook e documentação de operação) e ao implementador da área (README), ou rever o D5.
4. **`code-archaeologist` como ajudante só de leitura da E2 em repositório legado.** É uma HIPÓTESE de valor: a Central é legada e grande, e a E2 do orquestrador vai consumir muito contexto. O Gabriel recusou o explorer-agent no D5, então cabe a ele decidir. O ganho é contexto limpo. O custo é mais um agente.
5. **Personas para os três agentes externos** (Codex na E10, OpenCode na E13, Antigravity na pesquisa) em `.agents/personas/`, com o formato de saída fixo. Hoje só existe a versão 2 do Maestri, com papéis antigos.

### Genéricos demais ou quebrados

- **FATO:** os 14 agentes curtos da Central têm o mesmo corpo de 18 linhas, só a descrição muda (`[CI].claude/agents/*.md`). Na prática, são um agente genérico com 14 nomes, porque o contrato real vem do Superpowers (`08-...:57-65`).
- **FATO:** os agentes vendidos do ag-kit (documentation-writer, explorer-agent, security-auditor) estão em inglês, não foram adaptados e não têm formato de saída.
- **FATO:** a raiz controladora "somente roteia" (`[R]CLAUDE.md:5`), mas tem 14 agentes, nove deles com Edit e Write (`[R].claude/agents/`).

### Frontmatter: ferramentas, modelo e skills

- **FATO:** nenhum agente, de nenhum dos dois lados, declara `skills` no frontmatter (procurei por `^skills:` em `[CI].claude/agents/`; os adaptadores do kit só têm `name` e `description`). Hoje as skills só entram pela descrição, por acaso.
- **FATO:** os revisores da Central têm `tools: [Read, Bash]`. Com Bash dá para escrever arquivo, então "somente leitura" depende de o agente obedecer.
- **FATO:** sete agentes da Central não têm `tools`. **HIPÓTESE:** pelo comportamento documentado do Claude Code, eles herdam todas as ferramentas da sessão. Conferir na documentação.
- **FATO:** no kit, o `escopo-guard` só reconhece `code-reviewer`, `security-reviewer`, `validador-visual`, `test-engineer` e `debugger` pelo `agent_type`, e só olha Write e Edit (`[K]kit-claude-code/dot-claude/hooks/escopo-guard.mjs:11-14,18-19`). Um revisor despachado como `general-purpose` não tem nenhuma restrição.

---

## Regras comparadas

### Tabela por tema

| Tema | Central | Kit | Situação |
|---|---|---|---|
| Waves paralelas | `parallel-subagent-driven-development.md` (curto, na raiz e em cada repo) e `08-parallel-subagent-driven-development.md` (150 linhas, em inglês). Três cópias do mesmo assunto | `rules/ondas.md` | Iguais no centro. O kit acrescenta `Owner` e verificação. A Central tem a ponte persona × prompt e a frase "sem limite numérico de concorrência" (`08-...:145-150`) |
| Despacho de subagente | `07-subagent-dispatch.md`, que manda consultar "`## Agentes e reviews` no CLAUDE.md raiz", **seção que não existe em nenhum CLAUDE.md** (FATO, procurei: só aparece num `progress.md`) | `AGENTS.md:57` ("nunca um agente genérico") | Na Central, a regra aponta para o vazio |
| Modelo | `model-discipline.md` (3 níveis com exemplos) | `AGENTS.md:72` (sem níveis) | Trazer a tabela da Central |
| Testes | `05-testing.md` e `testing.md`: teste só o que pode quebrar, pule a UI apresentacional (`05-testing.md:28-37, 50-59`) | Todo implementador "teste primeiro" (`personas/frontend-specialist.md:10`). `test-engineer`: toda regra de negócio tem teste | **Conflito.** TDD em tudo, ou rubrica de quando testar |
| Segurança | `06-security.md` (73 linhas, faça e não faça) | Checklist dentro das personas | A Central é mais completa. Pode virar a lente do security-reviewer |
| Verificação e gates | `verification.md` (`node scripts/verify.mjs`) | `rules/gates.md` (4 gates, lista do que nunca fazer para passar, autoteste) | O kit é muito mais forte. Os comandos não são compatíveis |
| Git | `git-solo-main.md`: direto na `main`, push "quando autorizado na sessão" | `rules/commit.md`: branch `demanda/<slug>`, sem "só desta vez", push e merge só do humano | **Conflito direto** |
| Memória e cofre | `obsidian.md`: **um cofre só para o ecossistema**, MCP global, "não crie `.mcp.json` local" (`obsidian.md:8`) | `rules/memoria.md` e D10: `vault/` por projeto, MCP no escopo do projeto, global limpo (`[E13]:102-106`) | **Conflito de arquitetura** (ver recomendação 10) |
| Consulta antes de planejar | `planning-requires-knowledge-and-graphify.md` ("Contexto consultado"), `memory-graphify-browser-policy.md` | `rules/consulta.md` ("Consultas feitas") | Iguais na ideia. O kit tem trava parcial |
| Segredos e RTK | `secrets-and-rtk.md`: o RTK pode trocar `git diff` por `git diff --stat` (`:7-8`) | `AGENTS.md:78`, `gates.md:19`: gates sem compressão | Compatíveis. Atenção: o revisor precisa do diff inteiro |
| Hooks (para quem escreve hook) | `hooks-cross-platform.md` e `hooks-cwd-resolution.md`, com `paths` em `hooks/**` | Não existe | Só na Central. Vale trazer para desenvolver o harness |
| Padrão de linguagem | `javascript.md`, `typescript/`, `react/` | Não existe (fica no lint e no `stack.md`) | Pertence ao projeto, não ao harness |
| Domínio | `central-iso.md`, `module-central-iso.md` | Não existe | Pertence ao projeto. **FATO:** o `module-central-iso.md` do hub descreve o módulo de Agendamento ("Agendamento é satélite... não acesse o banco da Central", `[CI].claude/rules/module-central-iso.md:2,13-14`) e carrega em `frontend/**` e `backend/**` do hub |
| Reparo | Não existe como regra | `rules/reparo.md` | Só no kit |
| Fluxo e estado | Não existe arquivo de estado por demanda | `fluxo.md` e `templates/estado.md` | Só no kit |

### Conflitos diretos entre os dois

1. **Git (FATO):** `[R].claude/rules/git-solo-main.md:3,10` contra `[K].agents/rules/commit.md:9-11,13-15`. Agravante: a mesma regra da Central gerou dois comportamentos. Numa execução, o controlador leu "consentimento permanente" e commitou direto (`[CI].superpowers/sdd/2026-09-11-.../progress.md:4,24`). Em outra, esperou a autorização do João (hotfix `progress.md`, "Ruling 4").
2. **Exceção no meio da conversa (FATO):** a Central aceita "autorização específica" na conversa (`[H]docs/02...:121`, `git-solo-main.md:10`). O kit proíbe: o humano muda a regra editando o `AGENTS.md` (`[K]AGENTS.md:11`).
3. **Testes (FATO):** ver a tabela.
4. **Cofre (FATO):** ver a tabela.
5. **Validação visual (FATO):** a Central exige Playwright E2E (`[H]...design.md:384,1027`), e o kit desliga o Playwright (`[K]modo-facil/01...:122`).
6. **Plugin aia-harness (FATO):** ligado na Central (`[R].claude/settings.json:42`, e o passo 3 de `[F]README.md:33` manda aplicar). O kit desliga por conflito (`[K]modo-facil/01...:122`).

### Regra escrita sem trava no kit

| Regra | Onde | Trava hoje |
|---|---|---|
| Nenhum código antes de SPEC e plano aprovados | `AGENTS.md:15` | **Parcial.** O `plano-guard` vê Write e Edit, mas não Bash. Basta **uma** demanda aprovada para liberar qualquer edição (`plano-guard.mjs:7-9`) |
| A aprovação é a frase exata do humano | `AGENTS.md:16` | **Nenhuma.** O `plano-guard` só confere se a célula está preenchida, não se a frase é exata (`plano-guard.mjs:41`). E o agente pode escrever no `estado.md` |
| A sessão principal não implementa | `AGENTS.md:18` | **Nenhuma.** O `escopo-guard` ignora a sessão principal (`escopo-guard.mjs:6-7,19`) |
| Gates no mesmo turno, com a saída colada | `AGENTS.md:20`, `gates.md:17-22` | **Nenhuma.** O pre-commit roda só o `lint` (`gates.md:11`) |
| Só os arquivos de `Files:` | `ondas.md:22`, personas | **Nenhuma** (o kit admite: `dot-claude/README.md:35`) |
| Nunca agente genérico | `AGENTS.md:57` | **Nenhuma.** Nenhum hook olha a ferramenta Agent ou Task (`dot-claude/settings.json`) |
| Modelo registrado a cada despacho | `AGENTS.md:72` | **Nenhuma** |
| Revisores não leem o arquivo um do outro | `personas/code-reviewer.md:10` | **Nenhuma.** Nada bloqueia leitura |
| Teto de três tentativas no reparo | `reparo.md:36-44` | **Nenhuma** |
| Pedido para pular: três linhas e não executa | `fluxo.md:33-35` | **Nenhuma** (é só instrução, repetida na mensagem do `plano-guard`) |
| Agentes externos escrevem só em `docs/` | `adaptadores.md:59-65` | **Nenhuma** (é a conferência do orquestrador com `git status`) |
| Implementador não commita | `rules/commit.md:11` | **Travada** pelo `commit-guard`. O bypass por `node -e` é admitido (`dot-claude/README.md:33`) |
| Teto de 350 linhas | `AGENTS.md:22` | **Travada** pelo ESLint mais o pre-commit |
| Vault só por MCP | `memoria.md:25` | **Travada** pelo `vault-guard`, com a brecha do Grep sem caminho (`README.md:37`) |

### Regra escrita sem trava na Central

| Regra | Onde | Trava hoje |
|---|---|---|
| Implementador não commita | `08-...:113-115`, os agentes | **Nenhuma.** `git commit` está liberado para qualquer sessão (`[CI].claude/settings.json`, `allow`) |
| O subagente precisa entregar relatório | `[H]docs/02...:105-107` ("deve exigir") | **Só um lembrete.** O hook imprime um texto e não confere nada (`[CI].claude/hooks/central-iso-subagentstop.mjs:2-4`) |
| Fechar só com gates e evidência | `[R]AGENTS.md:38` | O `central-iso-stop.mjs` só imprime um lembrete (`[CI].claude/hooks/central-iso-stop.mjs:2`). Existe também um `verify-on-stop.mjs` registrado, que não analisei |
| Waves com arquivos disjuntos | `08-...:79-90` | **Nenhuma** |
| Contexto consultado antes do plano | `planning-requires-...:15-22` | **Nenhuma** (o `graphify-orient` só orienta) |
| Revisor só lê | Agentes | **Parcial.** O frontmatter tem Read e Bash. Sete agentes não restringem nada |

### Regras que dizem ter uma trava que não está ligada

- **FATO:** `[CI].claude/rules/obsidian.md:23` diz "`vault-guard.mjs` bloqueia Read/Grep/Glob/Write/Edit/Bash diretos". Mas o `PreToolUse` registrado em `[CI].claude/settings.json` só chama `central-iso-pretooluse.mjs` e `graphify-orient.mjs`, e o `central-iso-pretooluse.mjs` não tem nenhuma referência a vault ou Obsidian (`[CI].central-iso/hooks/central-iso-pretooluse.mjs`, 121 linhas). **Consequência registrada:** o relatório final do saneamento diz que notas do cofre foram "alteradas diretamente", com backup (`[H]docs/superpowers/plans/2026-08-30-harness-operacional-0.1-final-report.md:79`), quando a proposta dizia para corrigir só pelo MCP ou à mão (`...obsidian-frontmatter-repair-proposal.md:5,113`).
- **FATO:** `[CI].claude/memory/INSTRUCTIONS.md:3` diz que o arquivo é "auto-loaded via `@.claude/memory/INSTRUCTIONS.md`". Nenhum CLAUDE.md do hub, do Agend ou do CTP-ATP faz essa importação. Só o do Frete faz (`[M]Mod. Frete/CLAUDE.md:112`).
- **FATO:** o doc 13 diz que o estado da aprovação fica em `.claude/state/harness-approval.json` (`[H]docs/13_PRETOOLUSE_APPROVAL_STATE_FILE.md:9-11`). O hook lê `.central-iso/state/harness-approval.json` (`[CI].central-iso/hooks/central-iso-pretooluse.mjs:72`).
- **HIPÓTESE:** `[CI].central-iso/instructions/CLAUDE.md:4-6` importa `@.claude/rules/...` por caminho relativo. Pela documentação do Claude Code, o caminho relativo resolve a partir do arquivo que importa, ou seja, de `.central-iso/instructions/`, onde essas regras não existem. O impacto é baixo, porque o Claude Code carrega `.claude/rules/` sozinho. Testar.

---

## Geradores e automação da Central

| Script | O que faz de verdade (FATO, pelo código) | Usado? | Problemas | Vale trazer? |
|---|---|---|---|---|
| `[H]scripts/intake-prompt.mjs` e o hook `[CI].central-iso/hooks/central-iso-userprompt-intake.mjs` | Classifica o prompt por palavra-chave (`:32-42`), sugere repo, agentes e gates (`:44-78`) e devolve `nextGate`. Qualquer "red flag" vira `BLOCKED` (`:89`). No hook, `BLOCKED` vira `decision: block` no `UserPromptSubmit` (`central-iso-userprompt-intake.mjs:38-50`) | O hook só está registrado no CTP-ATP (`[M]Mod. CTP-ATP/.claude/settings.json`, `UserPromptSubmit`). Não achei referência ao script em nenhum `.superpowers/sdd` (procurei nas pastas dos 4 repositórios) | 1. Bloqueia qualquer prompt com "token", "senha", "sync", "limpeza" ou "cleanup" (`:83-84`), e o CTP-ATP trabalha com token de SSO e do Sankhya. 2. A ordem das palavras faz qualquer menção a "claude" ou "agents" virar `harness` (`:36`). 3. Não conhece o `Mod. Frete` (`:44-50`). 4. Sugere `react-reviewer` e `qa-automation-engineer`, que não estão na lista de "Agentes canônicos" (`[CI].central-iso/instructions/AGENTS.md:43`). 5. Basta reescrever o pedido para passar | **Não** trazer o classificador nem o bloqueio. Trazer só a **ideia** dos estados `nextGate` como vocabulário do `estado.md` |
| `[H]scripts/generate-spec-from-intake.mjs` | Gera um rascunho em Markdown com faixas "NÃO É APROVAÇÃO". Escopo e critérios de aceite são **sempre** "TODO humano" (`:110-127`). Status `BLOCKED`, `NEEDS_CONTEXT` ou `DRAFT_NOT_APPROVED` | Sem uso fora dos testes das waves | Não produz conteúdo: só copia os campos do intake e preenche com TODO. O Superpowers brainstorming faz isso melhor | **Não** |
| `[H]scripts/generate-plan-from-spec.mjs` | Lê o `## Status` da SPEC e devolve **sempre as mesmas 3 tarefas fixas** T0.1–T0.3, de revisão humana, e nunca uma tarefa de implementação (`:82-107`) | Sem uso fora dos testes das waves | É um carimbo. O texto diz "Nenhum hash de aprovação gerado por script" (`:160`), mas `generate-approval-manifest.mjs` faz exatamente isso. **Contradição entre os scripts** | **Não** |
| `[H]scripts/synthesize-review-panel.mjs` e `validate-review-panel.mjs` | Junta os arquivos dos revisores, remove achados repetidos (mesmo `arquivo:linha` com afirmação ou cenário iguais), ordena e calcula o veredito: CRITICAL ou HIGH dá BLOQUEADO, MEDIUM dá APROVADO COM RESSALVAS, o resto dá APROVADO (`synthesize:73-104`). O validador confere a coerência entre veredito e achados (`validate:27-34`) | Sem uso fora dos testes das waves. Na prática, a síntese é feita à mão no `progress.md` | 1. **Falha aberta:** linha fora do formato é "descartada silenciosamente" (`[H]docs/14_REVIEW_PANEL_EXECUTOR.md:41-43`). Se nada sobra, o texto sai com "Nenhum achado sobreviveu...", e esse texto casa com o marcador `nenhum achado` do validador (`validate:25,28`). Resultado: um revisor que escreveu na tabela do kit, em português (CRÍTICO, ALTO), gera **APROVADO**. 2. Não exige um arquivo por revisor esperado. 3. Não informa quantas linhas descartou. 4. `hasUnresolvedWords` casa "open" em "OpenCode" ou "openssl" (`validate:24`). 5. Caminho com espaço não casa (`synthesize:6`, `[^\s:]+`) | **Sim, adaptado:** formato em português, falha fechada, lista de revisores esperados e contagem de descartes. É a peça que deixa o veredito mecânico e previsível |
| `[H]scripts/generate-approval-manifest.mjs` (relacionado) | Calcula o sha256 da SPEC e do plano e grava o manifesto. `--approved-by` aceita qualquer texto (`:13,18,38-48`) | **Sim**: é citado num brief real (`[M]Mod. Agend/.superpowers/sdd/2026-09-29-agendamento-pos-reuniao/task-11-brief.md:300`) e o hotfix confere os hashes (`progress.md:4`) | Qualquer agente pode rodar e "aprovar". A aprovação não expira e vale para tudo (já registrado em `[K]docs/inventario/...:49,57-58`) | **Trazer a ideia do hash** para dentro do `estado.md` (ver recomendação 6), não o script como está |

**Veredito geral (FATO mais HIPÓTESE):** os geradores foram construídos e testados em waves (`[H]auditoria/wave-reports/WAVE_4_11` a `WAVE_4_17`), mas não achei sinal de uso no trabalho real. Eles "nunca aprovam", e por isso também não ajudam a prever a saída. O que tem valor real é o sintetizador corrigido, mais o hash da aprovação.

---

## Formatos de saída e previsibilidade

### O que cada harness exige hoje

| Saída | Kit | Central |
|---|---|---|
| Relato do implementador | Seção "Relato" do handoff, com status em 3 valores (`[K].agents/templates/handoff.md:45-55`) | Status em 4 valores (`[CI].claude/agents/*.md:12`), report JSON conceitual com "status livre não é aceito" (`[H]...design.md:477-495`). Na prática, Markdown livre com ✔ (`[CI].superpowers/sdd/2026-09-11-.../task-1-report.md`) |
| Achado de revisão | Tabela de 5 colunas, severidade em português (`templates/revisao-wave.md:13-19`) | Uma linha `file:line — severity — claim — failure scenario — reviewer` (`[H]docs/08...:38-44`). Na prática, "spec ✅, qualidade Approved, 0 Critical, 0 Important" (hotfix `progress.md`) |
| Handoff | Um arquivo por tarefa (`templates/handoff.md`) | `task-N-brief.md` (Superpowers). Brief JSON conceitual com `specHash`, `planHash` e `commitAllowed` (`[H]...design.md:454-475`) |
| Estado da demanda | `estado.md` com aprovações, etapas, waves e reparos (`templates/estado.md`) | Não há arquivo de estado. Há o ledger `progress.md` por plano, em texto livre |
| Pedido para pular | Três linhas, conteúdo definido sem formato fixo (`fluxo.md:33-35`) | Não há formato |
| Relatório de agente externo | `templates/relatorio.md` (versão 2 do Maestri) | Não há |
| Validação visual | `templates/validacao-wave.md` | "Fluxo testado, resultado e limitações" (`memory-graphify-browser-policy.md:18`) |

### Vocabulários em uso (FATO)

| # | Valores | Onde |
|---|---|---|
| 1 | concluída / bloqueada / precisa de decisão | `[K].agents/templates/handoff.md:47` |
| 2 | DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED | `[CI].claude/agents/*.md:12`, `08-...:47`. É o contrato do Superpowers, que o kit manda manter (`[K].agents/rules/ondas.md:57`), **contra o vocabulário 1** |
| 3 | CRÍTICO / ALTO / MÉDIO / BAIXO | `[K]personas/code-reviewer.md:17-20` |
| 4 | CRITICAL / HIGH / MEDIUM / LOW e APROVADO / APROVADO COM RESSALVAS / BLOQUEADO | `[H]docs/08...:46-66` |
| 5 | APPROVE / WARNING / BLOCK (ALTO = WARNING) | `[M]Mod. Frete/.claude/agents/code-reviewer.md:282-287` |
| 6 | Critical / Important / Minor, spec ✅/❌, Approved / Needs fixes | Revisor do Superpowers na prática (`[CI].superpowers/.../progress.md:41,59`, hotfix `progress.md`) |
| 7 | OK / WARN / FAIL | `[H]docs/07_CRITERIOS_DE_ACEITE.md:57-63` |
| 8 | BLOCKED / NEEDS_CONTEXT / DRAFT_NOT_APPROVED / NEEDS_SPEC_APPROVAL | `[H]scripts/generate-spec-from-intake.mjs:78-82`, `generate-plan-from-spec.mjs:62-67` |
| 9 | NEEDS_CONTEXT … READY_FOR_EXECUTION / BLOCKED | `[H]docs/09_INTAKE_UNIVERSAL_DE_PROMPT.md:150-160` |

**Consequência (HIPÓTESE forte):** com nove vocabulários, o mesmo resultado pode sair escrito de várias formas. Um ALTO pode virar WARNING e passar. Um "Important" não tem regra de bloqueio no kit. Um script não consegue conferir nada. **Previsibilidade exige um vocabulário só, com tradução fixa para os termos do Superpowers.**

### Proposta: formatos fixos

**Princípio:** cada saída tem campos com nome fixo e valores de uma lista fechada, numa ordem fixa. O Gabriel (ou um script) confere a saída comparando com fatos que o agente não controla: `git status`, código de saída, o `estado.md` e a lista de `Files:`.

**Vocabulário único (para todos os formatos):**

| Campo | Valores permitidos | Tradução do Superpowers e da Central |
|---|---|---|
| `STATUS` (tarefa) | `CONCLUIDA`, `CONCLUIDA_COM_RESSALVA`, `PRECISA_CONTEXTO`, `BLOQUEADA` | DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED |
| `SEVERIDADE` | `CRITICO`, `ALTO`, `MEDIO`, `BAIXO` | CRITICAL, HIGH, MEDIUM, LOW. "Important" é ALTO. "Minor" é BAIXO |
| `VEREDITO` (calculado, não opinado) | `BLOQUEADO` (há CRITICO ou ALTO), `APROVADO_COM_RESSALVA` (há MEDIO), `APROVADO` | APPROVE, WARNING e BLOCK **não** valem |
| `ETAPA` | `E0` … `E13`, `CONCLUIDA` | Nada além disso |

**F1. Primeira linha de toda resposta de agente**

```
PAPEL: <persona> | DEMANDA: <slug ou "nenhuma"> | ETAPA: <Ex lida no estado.md agora>
```

- **Como conferir:** o papel está errado (prompt colado no terminal errado). A etapa é diferente da que está no `estado.md`. A linha falta. Qualquer um desses é erro.
- **Origem:** formaliza `[K]modo-facil/04...:11` e a "PRIMEIRA AÇÃO" de `[K]maestri/papeis.md:20`.

**F2. Resposta quando o humano pede para pular etapa**

```
ETAPA ATUAL: E3 SPEC (estado.md, atualizado em AAAA-MM-DD HH:MM)
O PEDIDO PULARIA: E4 Plano e aprovação do plano
FALTA: frase "Aprovo a SPEC." registrada; plano escrito; frase "Aprovo o plano."
NÃO EXECUTADO.
```

- **Como conferir:** qualquer chamada de ferramenta que altere arquivo no mesmo turno é erro. Qualquer texto que comece a executar o pedido também.

**F3. Relato do implementador** (substitui a seção "Relato" do handoff)

```
STATUS: CONCLUIDA | CONCLUIDA_COM_RESSALVA | PRECISA_CONTEXTO | BLOQUEADA
TAREFA: T07 | WAVE: 2 | PERSONA: backend-specialist | MODELO: <modelo>
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

- **Como conferir:**
  - `ARQUIVOS_TOCADOS` diferente de `git status --short`.
  - `FORA_DE_FILES: NAO` com um arquivo que não está em `Files:`.
  - `STATUS: CONCLUIDA` com algum `EXIT` diferente de 0.
  - `TESTE_VIU_FALHAR: SIM` sem o trecho da falha.
  - `COMMIT_FEITO: NAO` com hash novo no `git log`.

**F4. Achado de revisão** (uma linha por achado, em arquivo próprio do revisor)

```
ACHADO | <arquivo>:<linha> | <SEVERIDADE> | <o que está errado> | CENARIO: <entrada ou estado que faz falhar> | REGRA: <critério da SPEC ou regra violada> | REVISOR: <persona>
```

Rodapé obrigatório:

```
ARQUIVOS_REVISADOS: <lista = união dos Files: da wave>
ACHADOS_DESCARTADOS_POR_FALTA_DE_CENARIO: <n>
RESULTADO: NENHUM_ACHADO | <n> ACHADOS
```

- **Regras:**
  - ALTO e CRITICO exigem trecho de código e o motivo de a proteção existente não pegar (vem do ECC, `[M]Mod. Frete/.claude/agents/code-reviewer.md:47-56`).
  - O veredito **não** é escrito pelo revisor. É calculado pelo sintetizador.
- **Como conferir:**
  - `ARQUIVOS_REVISADOS` sem um arquivo da wave (o revisor não olhou tudo).
  - Achado ALTO ou CRITICO sem `CENARIO`.
  - Arquivo sem nenhuma linha válida **e** sem `RESULTADO: NENHUM_ACHADO` (falha fechada: o sintetizador para).

**F5. Síntese da revisão** (gerada por script, não pelo orquestrador)

```
REVISORES_ESPERADOS: code-reviewer, security-reviewer
REVISORES_RECEBIDOS: code-reviewer, security-reviewer
LINHAS_INVALIDAS: <n por revisor>
ACHADOS (após juntar repetidos): <lista no formato F4, com todos os revisores>
VEREDITO: BLOQUEADO | APROVADO_COM_RESSALVA | APROVADO
DESTINO DE CADA ACHADO: reparo | volta ao plano | volta à SPEC | aceito pelo humano ("Aceito o risco do achado N.")
```

- **Como conferir:**
  - Faltou um revisor esperado.
  - `LINHAS_INVALIDAS` maior que 0.
  - `VEREDITO: APROVADO` com MEDIO ou mais.
  - Achado com destino "aceito pelo humano" sem a frase do humano no `estado.md`.

**F6. Estado da demanda** (o que acrescentar ao `estado.md`)

```
ETAPA_ATUAL: E5 (wave 2)
PROXIMA_ETAPA_PERMITIDA: E6
ESPERA_HUMANO: NAO | SIM: <frase exata esperada>
SPEC: <caminho> sha256=<hash na aprovação>
PLANO: <caminho> sha256=<hash na aprovação>
```

E uma seção "Histórico", só de acréscimo, com uma linha por evento:

```
AAAA-MM-DD HH:MM | <quem> | <evento> | <evidência: caminho, hash ou EXIT>
```

- **Como conferir:**
  - O hash atual da SPEC ou do plano é diferente do gravado (alguém mexeu depois da aprovação).
  - `ETAPA_ATUAL` pula uma etapa no histórico.
  - Há evento sem evidência.

**F7. Handoff:** acrescentar `SPEC_SHA256` e `PLANO_SHA256` (o implementador confirma que leu a mesma versão), `ETAPA_NO_ESTADO_NO_DESPACHO` e `MODELO_E_MOTIVO`. Vem do brief conceitual da Central (`[H]...design.md:454-475`).

**F8. Registro de decisão do orquestrador** (absorve os "Rulings" da Central, com trava)

```
DECISAO D-NN | <o que decidi> | MOTIVO: <...> | CUSTO SE ERRADO: <...> | MUDA ESCOPO, PLANO OU STATUS: NAO | SIM: exige "Aprovo a decisão D-NN."
```

- **Como conferir:** uma decisão que muda status (BLOQUEADA para CONCLUIDA), arquivos, plano ou critério de aceite sem a frase humana é erro. Vem da prática da Central (`[CI].superpowers/.../progress.md:22-28`, hotfix `progress.md`, "Rulings 1-5").

**F9. Relatório de agente externo** (Codex na E10, OpenCode na E13, Antigravity na pesquisa)

```
F1 na primeira linha
ESCREVI_EM: <caminhos>   (precisa estar dentro de docs/fluxo/<demanda>/relatorios/)
COMANDOS_RODADOS: <comando> → EXIT <n>   (ou "nenhum")
ACHADOS: formato F4   (E10)  |  FONTES: <link e data por afirmação>   (pesquisa)  |  ROTEIRO: deploy-NN.md   (E13)
O_QUE_NAO_FOI_VERIFICADO: <lista, nunca vazio sem dizer "nada">
DECISAO_QUE_O_HUMANO_PRECISA_TOMAR: <ou "nenhuma">
```

- **Como conferir:** o `git status --short` mostra arquivo fora de `ESCREVI_EM`. Há comando sem EXIT.

**F10. Fechamento de etapa pelo orquestrador**

```
ETAPA_CONCLUIDA: E6 wave 2 | EVIDENCIA: <caminho> | PROXIMA: E7 | ESPERA_HUMANO: NAO
```

- **Como conferir:** a evidência não existe, ou a próxima etapa não é a seguinte da tabela do `fluxo.md`.

### Como conferir automaticamente

**HIPÓTESE de desenho:** um script `validar-saida.mjs` com uma função por formato (F3, F4, F5, F6), chamado em três momentos:
1. pelo hook `SubagentStop`, para bloquear o retorno do subagente fora do formato (a Central só imprime um lembrete);
2. pelo orquestrador antes de cada etapa;
3. pelo humano, a qualquer momento.

Ele falha fechado (o contrário do sintetizador da Central). Os testes podem reaproveitar os casos negativos que a Central já escreveu (`[H]auditoria/wave-reports/WAVE_4_10_review_panel_negative_fixture.md`).

---

## Oneroso, duplicado, contraditório ou obsoleto

### Contradições dentro da Central

1. **V.E.E.I.E × Superpowers (FATO):** `[CI].central-iso/instructions/AGENTS.md:35` diz "Fluxo: Visão → Link → Arquitetura → Estilo → Gatilho, **combinado com** Superpowers". O mesmo texto está em `[M]Mod. Agend/...:33`, em `[M]Mod. CTP-ATP/...:33` e no template `[H]templates/repo-consumer/.central-iso/instructions/AGENTS.md:57`, então cada sincronização devolve a frase. Ao mesmo tempo, `[CI].claude/rules/central-iso.md:19` diz "V.E.E.I.E não governa este repositório", `[R]AGENTS.md:17` diz "apenas referência histórica", e a decisão `central/Central ISO Knowledge/30-Decisoes-Transversais/Registros/fluxo-vibe-coding-central-iso.md:35` **rejeitou** manter os dois em paralelo.
2. **AI_PROTOCOL atual ou histórico (FATO):** `[CI]README.md:11` diz que é "registro histórico do fluxo V.E.E.I.E substituído". O `[F]AI_PROTOCOL.md` é todo Superpowers e é chamado de "comportamento obrigatório" em `[F]README.md:11`.
3. **SPEC obrigatória ou condicional (FATO):** `[R]AGENTS.md:17`, contra `[CI].central-iso/instructions/AGENTS.md:36` e `[H]canonico/02...:34-35`.
4. **Uma ou duas aprovações (FATO):** `[F]AI_PROTOCOL.md:95-99` (uma), `[R]detalhamento_manutencao.md:34-40` (duas), `[CI].claude/commands/create.md:11-13` (só a SPEC).
5. **Commit por tarefa, por onda ou um só (FATO):** `08-...:113-115`, `[H]canonico/05...:29`, `[H]canonico/templates/checklist-aceite.md:33` e o "single combined commit" (`[CI].superpowers/.../progress.md:55`).
6. **Gates antes ou depois da revisão (FATO):** antes em `[H]docs/02...:23-24`. Depois em `08-...:105-112`.
7. **"Não crie outro brainstorm ou planejador" (`create.md:16`) × `/brainstorm` e `/plan` do ag-kit instalados (`[CI].claude/commands/brainstorm.md`, `plan.md`) (FATO).**
8. **RTK (FATO):** "referência futura" (`[H]canonico/01-matheus-vs-central-iso.md:19`) contra "RTK comprime saída" em uso (`[R]AGENTS.md:21`).
9. **Spec da Central × execução real (FATO):** a decisão diz "nenhum consumidor pode ser tocado antes dos 38 critérios" (`[H]...design.md:22,1071`). Os relatórios mostram rollout nos consumidores (`[H]auditoria/wave-reports/ROLLOUT_ALL_EXCEPT_MOD_FRETE_RELATORIO.md`) e um "harness operacional 0.1" paralelo (`[H]docs/superpowers/plans/2026-08-30-...-saneamento-e-padronizacao.md:7`).
10. **Frete dentro do próprio arquivo (FATO):** "a sessão principal não implementa" (`[M]Mod. Frete/CLAUDE.md:13`) contra "implemente inline" para coisa pequena (`:35`). "Mudança cirúrgica" (`:11`) contra "corrija todo erro de lint da sessão, mesmo em arquivo que você não editou" (`:109`).
11. **Gerador de plano × gerador de manifesto (FATO):** "nenhum hash de aprovação gerado por script" (`[H]scripts/generate-plan-from-spec.mjs:160`) contra `generate-approval-manifest.mjs`, que gera.

### Contradições dentro do kit

1. **Cinco mapas de papéis (FATO):** ver o começo do relatório.
2. **Status em 3 valores (`handoff.md:47`) × "o contrato da skill continua" (`ondas.md:57`), que tem 4 (FATO).**
3. **Template de relatório final é o de ordem do Maestri (FATO):** `memoria.md:70` contra `relatorio.md:3-4`.
4. **`docs/inventario/...:43` afirma "Etapas E0–E13" (FATO)**, e `[E13]:4` diz que o desenho não foi aplicado.

### Duplicado

- **FATO:** na Central, três arquivos de waves (`parallel-subagent-driven-development.md` na raiz e em cada repositório, mais `08-...`) e dois de teste (`testing.md` e `05-testing.md`).
- **FATO:** 21 agentes repetidos em três repositórios, e mais 14 na raiz.
- Seis papéis de segurança e sete de revisão (ver a seção de agentes).
- **FATO:** no kit, cada `maestri/notas/*.md` é cópia literal de um bloco de `maestri/papeis.md`.

### Oneroso

- **FATO:** a spec da Central tem 1.113 linhas, 38 critérios e um `approvalProvider` com capacidade em processo, `WeakSet` e nonce (`[H]...design.md:409-415`). Não achei `consumeGrant` nem `approvalProvider` em nenhum `.mjs` ou `.js` da cópia, ou seja, nunca saiu do papel.
- **FATO:** a máquina de estados da Central tem 22 estados (`:336-362`).
- **FATO:** o `08-...` da Central tem 150 linhas em inglês para dizer o que o `ondas.md` diz em 57.
- **FATO:** no kit, demanda pequena exige o Codex na E0 (ver os achados do fluxo).
- **HIPÓTESE:** no kit, o `lint:types` roda só na E8, depois da revisão. Se reprovar, o código volta e a revisão precisa ser refeita.

### Obsoleto ou quebrado

- **FATO:** `[R]detalhamento_modulo.md` não descreve a realidade:
  - o `project.json` tem outro esquema (`moduleId`, `owner`, `graphifyId`) em vez do real (`id`, `role`, `harnessLayout`) (compare `:31-46` com `[CI].central-iso/project.json`);
  - manda criar o módulo dentro de `Central ISO/` (`:62-63`), quando os módulos ficam em `Módulos Central/`;
  - manda rodar `./scripts/bootstrap.sh`, que não existe (`[CI]scripts/` tem só `graphify-ecosystem-sync.mjs`, `install-plugins.mjs` e `verify.mjs`; o bootstrap real está em `Central ISO Knowledge/.central-iso/bootstrap/bootstrap.mjs`, segundo `[R]CLAUDE.md:20-21`);
  - usa `git add .` (`:80`);
  - diz que "o agente faz o merge" (`:122`).
- **FATO:** `[R]fluxo_criacao_modulo.md:9,23-25` usa `/superpowers:start` e `./scripts/bootstrap.sh`, e mostra "pequenos commits iterativos".
- **FATO:** `[CI].claude/commands/plan.md` usa o agente `project-planner`, que não existe, e grava o plano na raiz do repositório.
- **FATO:** `[CI].claude/commands/remember.md:14,16,28` usa `.agents/skills/memory-system/SKILL.md` e `.agents/memory/`, que não existem no hub (a memória fica em `.claude/memory/`). O teto é de 200 linhas, contra 130 nas outras regras.
- **FATO:** `[CI]frontend/CLAUDE.md:3` e `[CI]backend/CLAUDE.md:3` mandam ler `../AGENTS.md`, que não existe na raiz do hub (a política `rootMarkdownHarnessFiles: false`, em `[CI].central-iso/harness.json:15`, põe o arquivo em `.central-iso/instructions/`). O mesmo vale para `[CI]README.md:9-14`, que aponta para `AGENTS.md`, `AI_PROTOCOL.md` e outros na raiz.
- **FATO:** `[M]Mod. Frete/CLAUDE.md:119` tem o marcador `__OBSIDIAN_VAULT_DIR__`, que nunca foi substituído.
- **FATO:** a pasta `[CI].claude/.aia-harness-pending/` tem instruções de memória pendentes de aplicação.

---

## Recomendações concretas para o harness novo

**P1 = antes da próxima demanda real. P2 = antes de migrar a Central. P3 = melhoria.**

1. **(P1) Aplicar o `[E13]` em todos os arquivos que ainda descrevem papéis antigos**, não só nos oito que ele lista. Somar: `modo-facil/04`, `ondas.md:8`, `adaptadores.md:49-57`, `templates/ordem.md`, `templates/relatorio.md`, `README.md:13`, `origem.md:41`, `maestri/notas/*` e `docs/inventario/...:43`. **Por quê:** hoje um agente que lê o arquivo "errado" segue outro mapa e age certo segundo aquele texto. É erro que não aparece como erro.
2. **(P1) Adotar o vocabulário único e os formatos F1 a F10**, e proibir os outros nove vocabulários. Traduzir explicitamente os 4 status do Superpowers para os 4 status em português. **Por quê:** sem lista fechada, não dá para prever nem conferir a saída. É a base de tudo o que o Gabriel pediu.
3. **(P1) Fixar `tools` e `model` no frontmatter de cada adaptador do kit.**
   - Revisores e validador: sem Edit. O Write fica limitado pelo `escopo-guard`. Bash só se a persona precisar.
   - `model`: valor padrão por nível, com a tabela de `model-discipline.md` da Central.
   - Verificar na documentação do Claude Code se o campo `skills` existe para subagente e, se existir, declarar as skills que cada persona deve usar (por exemplo, `systematic-debugging` no debugger).
   - **Por quê:** hoje herdam tudo, e custo e permissão ficam imprevisíveis.
4. **(P1) Ponte Superpowers → persona e trava contra `general-purpose`.**
   - Trazer para `ondas.md` a regra "o tipo do agente é a persona e o corpo do prompt é o contrato da skill" (`[CI].claude/rules/08-...:57-65`) e a tabela do Frete (`[M]Mod. Frete/CLAUDE.md:62-66`).
   - Criar um hook `PreToolUse` em `Agent|Task` que bloqueia `subagent_type` fora da tabela de personas.
   - **Por quê:** explica e fecha o caso `general-purpose` do `[E13]:214`. Sem isso, o `escopo-guard` não reconhece o agente e o revisor pode editar.
5. **(P1) Criar os templates que faltam:**
   - `relatorio-final.md` (E11), porque o `relatorio.md` atual é de ordem do Maestri;
   - `revisao-final.md` (E10, formato F4 e F5);
   - `deploy.md` (E13), partindo do `[F]CONTRATO_DE_MODULO_E_DEPLOY.md` Parte 2: backup primeiro, `node:20-slim` com openssl e curl, `binaryTargets`, rede `external`, healthcheck com `curl`, porta 808x, mesmo `JWT_SECRET` e plano de volta.
   - **Por quê:** a E10 e a E13 não têm formato, e o conteúdo de deploy da Central é experiência real ("cada item resolve um problema que já aconteceu").
6. **(P1) Aprovação amarrada por hash dentro do `estado.md`.**
   - Gravar o sha256 da SPEC e do plano na linha de aprovação.
   - O `plano-guard` confere três coisas: (a) a frase exata ("Aprovo a SPEC." e "Aprovo o plano."), (b) o hash atual igual ao gravado, (c) a demanda certa.
   - Passo seguinte: um hook `UserPromptSubmit` grava a frase quando o humano a digita, num arquivo que o `rules-guard` não deixa o agente escrever.
   - **Atenção (HIPÓTESE):** o `maestri ask` injeta texto no terminal. Testar se outro agente consegue "digitar" a frase e se dá para distinguir.
   - **Por quê:** junta o melhor dos dois. A Central invalida a aprovação por hash; o kit grava por demanda, com frase. E fecha a brecha "agente escreve a aprovação" registrada nos dois lados (`[K]docs/inventario/...:57-58`).
7. **(P1) Proibir o orquestrador de mudar status ou plano sozinho.** `BLOQUEADA` só vira `CONCLUIDA`, e desvio do plano aprovado só acontece, com a frase "Aprovo a decisão D-NN." registrada (formato F8). Conferir por script no `estado.md`. **Por quê:** foi exatamente o que aconteceu na Central (`[CI].superpowers/.../progress.md:38-39`, hotfix "Ruling 5"). É o erro mais difícil de ver depois.
8. **(P1) Classificar o pedido e formalizar o caminho curto, sem pular aprovação.**

   | Classe | Exemplo | Exigência |
   |---|---|---|
   | C0 Consulta | Pergunta pura | Sem demanda, só leitura |
   | C1 Pequena | Atende menos de 2 dos 4 critérios do Frete (`[M]Mod. Frete/CLAUDE.md:28-33`) | O orquestrador escreve um `pedido.md` de 5 linhas, sem precisar do Codex. SPEC e plano num arquivo só. As duas frases continuam |
   | C2 Bug | Falha com causa desconhecida | Entra o `debugger`. A SPEC vira "comportamento esperado + teste de regressão" |
   | C3 Funcionalidade | Novo recurso | Fluxo inteiro |
   | C4 Harness | Mudança de regra ou hook | `liberar-regras` mais revisão |
   | C5 Ação externa | Push, deploy, migração | Só o humano |

   Escrever no `fluxo.md` quando o `debugger` entra (hoje não está escrito). **Por quê:** hoje uma correção de uma linha custa dois terminais. Isso empurra o Gabriel a pedir exceção, e a regra proíbe exceção.
9. **(P2) Criar o perfil "web JavaScript" em `stack.md` para a Central**, com o equivalente de `typecheck` (por exemplo, `tsc --checkJs` ou declarar "não se aplica" com a compensação) e `lint` no backend. Decidir se o `verify.mjs` vira o "gate integral" do perfil. **Por quê:** pela regra de `stack.md:48`, a Central hoje não pode entrar no harness novo.
10. **(P2) Decidir a arquitetura da memória antes de migrar:** cofre único do ecossistema (Central) ou `vault/` por projeto (kit e D10). **HIPÓTESE de saída:** um cofre por ecossistema, acessado pelo `harness-vault` com pasta por projeto, mantém as decisões transversais (Central × módulos) sem quebrar o D10. **Por quê:** é a maior diferença de arquitetura entre os dois, e decide onde ficam as notas de entrega de cada módulo.
11. **(P2) Enriquecer as duas personas de revisão, sem criar agentes novos.**
    - No `code-reviewer`: o gate de 4 perguntas e "ALTO e CRITICO exigem prova" (ECC), a conferência contra o `AGENTS.md` e as regras (ECC), e as lentes condicionais de JS/TS e React (lista de `react-reviewer.md:13-16`).
    - No `security-reviewer`: a tabela OWASP 2025 (`security-auditor.md:64-77`) e a tabela de padrões (Frete, `security-reviewer.md:55-69`), com severidade própria de segurança.
    - **Por quê:** aproveita o que há de bom nos seis papéis de segurança e nos sete de revisão sem multiplicar agentes.
12. **(P2) Dar dono para documentação e runbook:** `devops-engineer` para operação e runbook, e o implementador da área para README. **Por quê:** o `Owner` precisa existir na tabela (`ondas.md:24`), e a Central já precisou disso num hotfix.
13. **(P2) Trazer as práticas reais das execuções da Central como seções obrigatórias:**
    - "Varredura de conflitos" antes de cada wave (tabela tarefa × tarefa, com arquivos e interfaces);
    - registro do id e do modelo de cada subagente;
    - RED medido (quantos testes falharam antes).

    Fontes: `[CI].superpowers/sdd/2026-09-11-.../progress.md:6-20` e hotfix `progress.md`. **Por quê:** é evidência que o Gabriel confere sem ler código.
14. **(P2) Trazer o sintetizador de revisão da Central, corrigido:**
    - formato F4 em português;
    - falha fechada quando o arquivo não tem linha válida nem `NENHUM_ACHADO`;
    - lista de revisores esperados;
    - contagem de linhas descartadas;
    - aceitar caminho com espaço.

    Usar na E6 e na E10, para a síntese não depender do orquestrador nem do Codex principal. **Não trazer** o intake, o gerador de SPEC nem o gerador de plano. **Por quê:** veredito mecânico é previsível. Os outros três não produzem conteúdo e o intake bloqueia pedidos legítimos.
15. **(P2) Tech-lead e assistente de chat nunca escrevem as frases de aprovação** num "prompt pronto para colar". **Por quê:** o System Prompt da Central manda o tech lead dar "o texto exato para aprovar" (`[R]🤖 System Prompt.md:18`). Assim a aprovação vira carimbo de outro agente.
16. **(P2) Na migração da Central, apagar ou arquivar:**
    - `/brainstorm`, `/plan` e `/remember` (ag-kit, quebrados);
    - `orchestrator` como subagente;
    - os 14 agentes curtos idênticos;
    - `security-auditor`, `penetration-tester`, `js-ts-reviewer` e `qa-automation-engineer` (absorvidos);
    - `detalhamento_modulo.md` e `fluxo_criacao_modulo.md` (desatualizados);
    - `git-solo-main.md`;
    - `module-central-iso.md` no hub;
    - a linha "Visão → Link…" do `instructions/AGENTS.md` e do template.

    **Por quê:** cada um desses é um caminho alternativo que um agente pode seguir de boa-fé.
17. **(P2) Acrescentar portões que a Central tem e o kit não:** dependência nova ("Aprovo a dependência X."), dado destrutivo ou migração em base real (com backup antes, como a persona `database-architect` já lembra) e mudança de `Files:` durante a wave (volta para a E4). **Por quê:** a lista de aprovações da spec da Central (`[H]...design.md:399-407`) cobre riscos reais que o kit deixa para o "bom senso".
18. **(P2) Resolver o conflito de testes:** adotar a rubrica `05-testing.md` da Central como critério de "quando o teste é exigido", com TDD sempre que for exigido, e a exceção escrita no handoff (campo `TESTE_VIU_FALHAR: NAO_SE_APLICA: <motivo>`). **Por quê:** TDD em componente só de apresentação gera teste sem valor, e a Central já decidiu isso com critério objetivo (CC ≥ 2).
19. **(P3) Rodar `lint:types` (e os três gates) pelo orquestrador no fim da E5, antes de chamar os revisores**, e manter a E8 como confirmação. **Por quê (HIPÓTESE):** evita gastar duas revisões em código que vai reprovar no tier pesado.
20. **(P3) Personas dos externos em `.agents/personas/`** (`codex-revisor-final`, `opencode-infra`, `antigravity-pesquisa`), com F1 e F9, e os dois `.codex/agents/*.toml` da E10 usando F4. A síntese da E10 é feita pelo script (recomendação 14), não pelo Codex principal. **Por quê:** hoje esses papéis só existem na versão 2 do Maestri, com outro mapa.
21. **(P3) Validador de saída (`validar-saida.mjs`) ligado ao `SubagentStop`**, para bloquear o retorno de subagente fora de F3 ou F4. **Por quê:** a Central tem esse hook, mas ele só imprime um lembrete (`central-iso-subagentstop.mjs:2-4`). Regra sem trava "não é garantia, é orientação", como a própria Central escreveu (`[H]docs/05_POLITICA_DE_RULES.md:49-58`).
