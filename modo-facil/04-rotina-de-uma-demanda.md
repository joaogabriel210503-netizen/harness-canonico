# Rotina padrão de uma demanda (modo fácil)

Use este roteiro toda vez que começar algo novo num projeto que já tem o harness (instalado pelo `02` ou pelo `03`). Você só opera quatro terminais no Maestri e cola prompts. Quem pensa, escreve e confere são os agentes. **Você decide e aprova.** O fluxo completo vai da E0 à E13 (`.agents/fluxo.md`).

## Os quatro terminais (um por papel, nunca misture)

1. **Orquestrador** (Claude Code): conduz quase tudo e é o **único que commita**.
2. **Revisor** (Codex): recebe a definição que você fez (ou a conduz com você, E0, como `tech-lead`), revisa a SPEC (E3b) e faz a revisão final (E10). Depois do pedido ele é também o seu **consultor**: cole nele qualquer mensagem que você não entendeu. Não escreve código nem a SPEC.
3. **Pesquisa** (Antigravity): só entra quando um prompt daqui mandar, para pesquisa externa e apoio geral.
4. **Infra** (OpenCode): prepara o roteiro de deploy (E13). Nunca executa o deploy.

**Nos prompts, troque tudo o que estiver entre `[colchetes]` ou `<sinais>` pelo seu texto.** O `<nome-da-demanda>` é o nome curto que você der à demanda (sem espaço nem acento, ex.: `cadastro-de-clientes`); o tech-lead cria a pasta `docs/fluxo/<nome-da-demanda>/` com ele, e o `<slug>` da branch é o mesmo nome. Depois de rodar uma linha com `!` que um agente pediu, responda "pronto, continue": ele não percebe sozinho.

Regra de ouro: **todo prompt começa dizendo o papel** ("Você é o tech-lead", "Você é o orquestrador"). Se colar no terminal errado, o agente avisa na primeira linha.

## É um pedido pequeno? (caminho curto C1)

É C1 só se **tudo** isto valer: até 3 arquivos; uma onda só; sem banco de dados ou migration; sem dependência nova; sem autenticação ou segurança; sem arquivo protegido (regras, hooks, configuração de lint, `AGENTS.md`, `.agents/`). **Na dúvida, não é C1.**

No C1 você pula o Passo 1 (o pedido é o seu próprio texto) e o Passo 3 (o Codex não revisa a SPEC). As duas frases de aprovação, os gates e a revisão final do Codex continuam. O orquestrador lista, no pedido de aprovação, cada item do critério que ele conferiu; se algum item for "não", ele avisa que não é C1.

## Passo 0: definir a demanda numa conversa separada (recomendado, antes ou fora do harness)

A definição é o que alimenta todo o fluxo: PRD, regras de negócio, contexto do projeto (de onde vem, se já houve outro projeto e como foi) e MVP. Pode ser **um documento só** ou quatro. Ela pode ser feita antes de o projeto ter o harness, numa conversa à parte.

Abra o Claude Code em qualquer pasta (pode ser uma pasta de rascunho, como `~/development/definicoes`), sem o harness, com o plugin Superpowers ligado. Cole, trocando o trecho entre colchetes:

```text
Use a skill brainstorming do Superpowers. Você vai conduzir a DEFINIÇÃO de uma demanda comigo: não programe e não decida tecnologia, biblioteca nem arquitetura.
Leia ~/development/harness-canonico/.agents/templates/definicao.md e siga essa estrutura: PRD, regras de negócio, contexto do projeto e MVP.
Uma pergunta por mensagem, até não restar ambiguidade. Pergunte também: de onde vem a demanda, se já houve outro projeto parecido e como foi, quem usa, e o que NÃO precisa ter. Havendo mais de uma interpretação razoável, mostre todas com vantagem e custo; não escolha calado.
As regras de negócio têm de ser testáveis: cada uma com um exemplo que cumpre e um que viola. O MVP tem de dizer o que fica de fora.
No fim, grave tudo em ./definicao.md (um documento só) e me diga o caminho. Não crie código nem outro arquivo.
Demanda: [conte o que é, quem usa, o que faz e o que NÃO precisa ter].
```

Responda uma pergunta por vez. Se for técnica e você não souber: "decida o mais simples que funcione".

Quando o `definicao.md` estiver pronto, copie-o para o projeto como `docs/definicao/definicao.md` (crie a pasta se não existir). Se o projeto ainda não existe, guarde o arquivo e copie depois do `02-projeto-novo.md`. Pronto, vá ao Passo 1.

## Passo 1: o tech-lead recebe a definição (terminal Revisor, Codex)

**Se você fez o Passo 0**, o Codex só recebe e confere. Troque o `<nome-da-demanda>`:

```text
Leia AGENTS.md e .agents/personas/tech-lead.md. Você é o tech-lead e vai RECEBER uma definição que já existe em docs/definicao/.
Regras desta sessão, porque você roda sem as travas do harness: escreva somente em docs/definicao/ e em docs/fluxo/<nome-da-demanda>/; o pedido vai EXATAMENTE em docs/fluxo/<nome-da-demanda>/handoff/pedido.md (não crie pasta handoff/ na raiz do projeto); não crie nem edite código, configuração ou qualquer outro arquivo; não escreva a SPEC; não use git add, git commit nem git checkout; não instale pacote.
Confira a definição contra o checklist do tech-lead: PRD, regras de negócio testáveis, contexto do projeto, MVP com o que fica fora, nenhuma decisão de stack. Pergunte só o que faltar, uma pergunta por mensagem; não refaça o que está bom. Se existir a pasta design-system/ na raiz, cite-a no contexto como requisito fixo e somente leitura.
Depois crie docs/fluxo/<nome-da-demanda>/estado.md e o pedido (caminho da definição, resumo de até 5 linhas, perguntas em aberto). Me diga o caminho exato do pedido e pare.
```

**Se você não tem definição**, o Codex a conduz do zero. Troque o trecho entre colchetes e os `<nome-da-demanda>`:

```text
Leia AGENTS.md e .agents/personas/tech-lead.md. Você é o tech-lead.
Regras desta sessão, porque você roda sem as travas do harness: escreva somente em docs/definicao/ e em docs/fluxo/<nome-da-demanda>/; o pedido vai EXATAMENTE em docs/fluxo/<nome-da-demanda>/handoff/pedido.md (não crie pasta handoff/ na raiz do projeto); não crie nem edite código, configuração ou qualquer outro arquivo; não escreva a SPEC (ela é só do orquestrador); não use git add, git commit nem git checkout; não instale pacote. Se precisar de algo fora disso, pare e me pergunte.
Se existir a pasta design-system/ na raiz, ela é requisito fixo e somente leitura: cite-a na definição e não execute o INSTALL.md nem o START.md dela.
Se você não tiver a skill brainstorming, conduza do mesmo jeito: uma pergunta por mensagem, até não restar ambiguidade.
Demanda: [conte o que é, quem usa, o que faz e o que NÃO precisa ter].
Ao terminar, me diga o caminho exato do pedido e pare.
```

Responda uma pergunta por vez. Se for técnica e você não souber: "decida o mais simples que funcione". Anote o caminho do `pedido.md`. **Pedido pequeno (C1):** não precisa disto; escreva o texto do pedido em `docs/fluxo/<nome-da-demanda>/handoff/pedido.md` ou cole-o direto no prompt do Passo 2.

## Passo 2: preparação, consultas e SPEC (terminal Orquestrador)

```text
Leia AGENTS.md e .agents/personas/orquestrador.md. Você é o orquestrador.
O pedido está em docs/fluxo/<nome-da-demanda>/handoff/pedido.md.
Antes da E1: rode git branch --show-current e git status --short; se aparecer algo fora de docs/, graphify-out/, design-system/, .DS_Store e vault/.obsidian/, pare e me mostre. Carregue com ToolSearch as ferramentas do harness-vault e do context7 (não use mcp__obsidian__); se faltar alguma, pare e me diga qual.
Siga o fluxo: E1 (branch demanda/<slug>), E2 (consultas) e E3 (SPEC pelo modelo .agents/templates/modelo-spec.md, com a seção "Consultas feitas" e a declaração C1 ou completo, item a item). Não crie plano nem código.
Quando a SPEC estiver pronta: se for C1, apresente já para aprovação; se não for, pare e diga que falta o parecer do Codex (E3b).
```

## Passo 3: revisão da SPEC pelo Codex (E3b, terminal Revisor) e aprovação

Não vale para C1. No terminal Revisor:

```text
Leia AGENTS.md e .agents/personas/tech-lead.md. Você é o tech-lead e vai revisar a SPEC, só por escrito, sem editar código nem a SPEC.
SPEC: [caminho que o orquestrador informou]. Definição: docs/fluxo/<nome-da-demanda>/handoff/pedido.md.
Siga o modelo .agents/templates/revisao-spec.md e grave o parecer em docs/fluxo/<nome-da-demanda>/revisao-spec.md. Procure contradição com a definição, lacuna e risco; cada achado com o cenário que quebra. Não aprove nem reprove: quem aprova sou eu.
```

Volte ao Orquestrador e peça: `Leia o parecer docs/fluxo/<nome-da-demanda>/revisao-spec.md, ajuste a SPEC se concordar com algum achado, e me apresente a SPEC para aprovação.`

**Como ler o pedido de aprovação.** Ele traz três coisas: o caminho do arquivo, um resumo de até 5 linhas e uma sequência de **12 letras e números** (o "hash", a impressão digital do arquivo). Você não precisa conferir o hash: o harness guarda esse código e, se alguém mudar o arquivo depois da sua aprovação, ele para tudo. Só confira se o caminho é o do documento que você leu.

Aprove só com a frase exata, **sozinha numa mensagem**:

`Aprovo a SPEC.`

"Pode seguir", "ok" e "continua" não valem.

## Passo 4: plano (terminal Orquestrador)

Ele escreve o plano (tarefas com arquivos, recursos e verificação) e para. Leia o resumo, traga aqui se tiver dúvida, e responda só com a frase, sozinha:

`Aprovo o plano.`

Mesma regra do hash: o pedido traz caminho, resumo e 12 caracteres.

## Passo 5: execução por ondas

O orquestrador despacha os especialistas, cada um escreve o relato no formato fixo, dois revisores conferem (sem ler um ao outro), a validação visual roda (se houver tela) e os gates (`lint`, `typecheck`, `test`) passam com o **recibo dos gates** antes de cada commit. Seu trabalho aqui:

- **Arquivo protegido (AGENTS.md, config do ESLint, hooks):** o agente para e pede liberação. Você roda `! touch .claude/liberar-regras`, ele faz a edição, e você roda `! rm .claude/liberar-regras && ls .claude` logo depois. O arquivo **não pode** ficar entre ondas.
- **Pedido de travar os gates de novo:** se uma onda mexer no que define os gates (`tsconfig*.json`, configuração do Vitest, scripts do `package.json`, `eslint.config.mjs`, `biome.jsonc`), o pre-commit barra até você rodar `! node .githooks/travar-gates.mjs`. Confira a mudança antes de travar: travar é aprovar.
- **Achado grave dos revisores:** ele para e pergunta. Escolha entre corrigir ou aceitar o risco. Na dúvida, traga a pergunta aqui.
- **Commit:** só o orquestrador, um por tarefa. Se alguém propuser `--no-verify`, `git add .` ou `git push`, recuse.
- Mudar o plano no meio (arquivo novo fora da lista, por exemplo) exige nova frase `Aprovo o plano.` com o hash novo.

## Passo 6: revisão final pelo Codex (E10)

Depois do último commit. O orquestrador roda antes o `gitleaks` e o `npm audit` e anexa a saída. No terminal Orquestrador:

```text
Você é o orquestrador. Última onda commitada. Rode gitleaks e npm audit, grave a saída crua e o recibo dos gates em docs/fluxo/<nome-da-demanda>/, e monte o pedido de revisão final pelo modelo .agents/templates/revisao-final.md. Me diga o caminho e pare.
```

No terminal Revisor:

```text
Leia AGENTS.md e .agents/personas/tech-lead.md. Você é o revisor final, nível Forte, só leitura.
Faça a revisão final da branch demanda/<slug> pelo modelo .agents/templates/revisao-final.md: confira o hash da SPEC e do plano contra o estado.md, despache um subagente de código e um de segurança sobre o diff da branch, e grave em docs/fluxo/<nome-da-demanda>/revisao-final.md. Não edite código.
```

Achado crítico ou alto vira tarefa nova: volta ao Passo 5 (com novo plano aprovado).

## Passo 7: memória (E11)

No Orquestrador: `Você é o orquestrador. Faça a E11: atualize o índice de memória, grave a nota de entrega no vault e leia de volta, rode graphify update e escreva o relatório final. Me diga o caminho do relatório.`

## Passo 8: merge (E12, você)

A branch vai para a `main` por você, no seu terminal ou no GitHub. Nenhum agente faz merge nem push.

## Passo 9: deploy (E13, OpenCode prepara, você executa)

Antes de qualquer atualização, faça o backup do banco. No terminal Infra:

```text
Leia AGENTS.md. Você é o responsável por infraestrutura e vai só PREPARAR o roteiro de deploy, sem executar nada (nem docker, nem ssh, nem git push, nem migration).
Use o modelo .agents/templates/deploy.md e grave em docs/fluxo/<nome-da-demanda>/deploy-01.md: backup do banco com o comando do projeto, pré-condições, passos numerados, plano de volta e teste rápido no ar. Diga no arquivo o que você NÃO executou.
```

Leia o roteiro, execute você mesmo e rode o teste rápido. Passou: entregue.

## O que significa "erro" no meio disso

Quando o harness para, quase sempre é ele funcionando. Há três tipos:

1. **Trava do harness agindo** (pediu liberação, barrou edição, barrou relato fora do formato): esperado, você só libera ou nega.
2. **Revisor achou defeito:** é o objetivo do fluxo. Corrige, aceita o risco ou anota como pendência.
3. **Erro de operação** (prompt colado no terminal errado, agente externo gravando no caminho errado): o `git status` do passo 2 pega. Por isso ele existe.

Se não entender uma mensagem do agente, cole no terminal Revisor com este prompt:

```text
Você é o tech-lead no modo consultor (leia a seção "Depois do pedido" de .agents/personas/tech-lead.md). Somente leitura, sem git, sem editar nada. Explique em português simples o que está acontecendo no texto abaixo, o que eu preciso decidir, o que você recomenda e o risco. Se a resposta for para outro terminal, me dê o prompt pronto.
Texto: [cole aqui]
```

O chat do Claude fora do projeto fica só para evoluir o kit do harness.
