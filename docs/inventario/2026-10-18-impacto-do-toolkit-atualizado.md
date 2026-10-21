# Impacto do toolkit do Matheus Gomes atualizado (18/10/2026)

Base do harness: commit `13add21` (3/9/2026). Relido: `de66fe3` (17/10/2026). São 14 commits, 114 arquivos, 10 mil linhas novas. Fonte lida diretamente do repositório. O que **não** li por inteiro: `docs/tools/17` a `22`, `docs/03`, `04`, `05`, `06`, `scripts/validate-*.mjs` e os modelos do Next.js; só os conferi por título e por busca. A conclusão sobre o que muda para nós se limita ao que foi lido.

## 1. O que afeta o que construímos (prioridade alta)

| # | Mudança do toolkit | Efeito no harness | Ação |
|---|---|---|---|
| 1 | `AGENTS.md` do toolkit e `templates/AGENTS.md.template`: "não adicionar bloqueios de git, exigência de branch/worktree, hooks de commit/push". O prompt 12 (projeto existente) repete | Nosso pre-commit, pre-push, bloqueio na `main` e `commit-guard` ficam contra o padrão do toolkit. O texto ressalva "por padrão" e "quando pedido", então a divergência é legítima | Registrada em `origem.md`. Ao migrar a Central, tratar os hooks como decisão do dono, não como padrão do toolkit |
| 2 | Delegação virou condicional: "delegar só quando isolar contexto, especializar ou paralelizar compensa; preferir execução direta para tarefa simples". A diretriz "orquestrador, não implementador" **saiu** do `CLAUDE.md.template` | Nosso `escopo-guard` proíbe a sessão principal de escrever código. É o ponto mais divergente | **Decisão sua (DP-15)** |
| 3 | Modelo: "sem política de seleção autorizada, o subagente usa o modelo da sessão; escolher modelo dinamicamente exige política escolhida pelo usuário" | Nosso `despacho-guard` exige `model` em cada despacho. Sem a política escrita em `AGENTS.md`, estamos acima do que o toolkit permite | Escrever a política autorizada em `AGENTS.md` (**DP-14**) |
| 4 | Lint: saiu a isenção por nome (`index`, `types`, `constants`...); entrou isenção **por conteúdo** (módulo só de tipos ou só de re-exports) e testes isentos por padrão, em `warn` com `includeTests`. A mudança confirma que a isenção por nome era brecha | Nossa decisão (sem isenção) é mais estrita. Os hashes de `core-rules.cjs`, `utils.cjs` e `verify.mjs` mudaram | Hashes atualizados em `origem.md`. Manter nossa regra; registrar a divergência |
| 5 | Script `lint:types` virou `lint:typed`; novo `lint:rules` (autoteste das regras) e `check` que junta tudo. Os prompts de instalação dele já geram `lint:typed` | Nosso pre-push exige `lint:types` e falha fechado. Um projeto preparado pelos prompts do toolkit **reprovaria** no nosso pre-push | **Decisão sua (DP-16)** |
| 6 | `CLAUDE.md.template` virou só `@AGENTS.md` | Igual ao que decidimos desde o início | `origem.md` atualizado: de "diferente" para "igual" |

## 2. O que melhora o que temos (prioridade média)

| # | Novo no toolkit | Onde entra em nós |
|---|---|---|
| 7 | **Avaliação de harness** (`docs/07`, prompt 14, fixture com falha proposital, `scripts/validate-harness.mjs`): sete casos comportamentais (correção de fronteira, handoff velho, revisão só de leitura, reaplicar setup, conflito de recurso, bloqueio parcial, pausa e retomada). Regra: observação ausente é "não rodado", nunca "passou" | **Onda W9, teste de aceitação.** Usar os sete casos como base e acrescentar o nosso: o que cada IA deve responder. Atualiza o roteiro 11.4 |
| 8 | **Prompt 12, projeto existente**: backup antes de mexer, matriz de cobertura por componente, reaplicação sem duplicar seção, MCP, hook ou script, registro da revisão do toolkit em `docs/setup.md`, aprovação por etapa sem reenviar as já dadas | Base do **documento de migração de projeto que já tem harness** e da migração da Central |
| 9 | **Handoff** (`task-handoff.md.template`): estado verificado com data, evidência com comando, recursos que o agente deixou abertos, contexto a revisitar; "handoff é contexto, não prova"; conferir arquivos, git e processos antes de retomar | Acrescentar esses campos ao `templates/handoff.md`. Cobre o caso "handoff velho" |
| 10 | **Regras de onda**: campo `Resources:` (portas, diretórios de build, bancos de teste) além de `Files:` e `Depends-on:`; campo ausente vira execução serial; coordenador é dono de lockfile e configuração compartilhada; revisores em paralelo só leem | Acrescentar `Resources:` ao `ondas.md` e ao `plano-guard` (B02) |
| 11 | **Revisão**: parar quando os achados relevantes estão resolvidos ou dispostos e os checks passam; mais rodadas só com evidência nova; respeitar a contagem de rodadas pedida pelo usuário | Acrescentar a regra de parada ao `reparo.md` e ao fluxo de revisão |
| 12 | **Memória**: cada fato com fonte, evidência, data da última verificação e condição de invalidação; aposentar o que foi superado; verificar a recuperação num contexto limpo | Acrescentar ao `memoria.md` (E10). Toca o DP-10 e o índice de 130 linhas, que continua válido |
| 13 | **Revisão de segurança reutilizável** (prompt 13, `docs/tools/20`): somente leitura, relatório privado e redigido, distingue achado confirmado de hipótese | Entra como procedimento do `security-reviewer` |
| 14 | **Continuidade de execução**: bloqueio parcial só para as tarefas dependentes; não repetir a mesma tentativa sem evidência nova; confirmar que um agente parou antes de assumir os arquivos dele | Entra em `AGENTS.md` e `fluxo.md` |

## 3. Informativo

- Documentação passou a ser inglês canônico, com README em português e espanhol. Os links por âncora de seção quebraram; os nossos apontam para arquivos, não para âncoras, e continuam válidos.
- Novos guias: Codex, Vercel skills, performance do Next, PostgreSQL, CI do GitHub, shadcn, Sentry. Padrões para projeto novo em Next: Drizzle + PostgreSQL, Zod, Pino. Servem de perfil "web Next" se algum projeto seu usar essa stack. Não afetam o kit atual.
- O CI do toolkit (`validate.yml`) valida o próprio repositório. Não se aplica a nós.

## 4. Decisões que isto abre

| ID | Pergunta | Recomendação |
|---|---|---|
| DP-14 | Escrever em `AGENTS.md` a política de modelo autorizada pelo dono | Sim. **Decidido e escrito em 18/10** |
| DP-15 | A sessão principal continua proibida de escrever código, ou o harness passa a permitir mudança trivial direta? | Manter a proibição. **Decidido em 18/10: manter** |
| DP-16 | Renomear `lint:types` para `lint:typed` | Renomear. **Feito em 18/10** |

## 5. O que fazer do que já está decidido

Nenhuma das decisões já tomadas foi invalidada. O DP-09 (Biome) continua certo: o texto do `06` que usei já era o da versão nova. O DP-10 (sem pipeline de LLM) continua coerente com o `09`. O DP-03 (aprovação por frase) é mais estrito que o toolkit, que manda não repetir aprovações já dadas; fica como divergência assumida.
