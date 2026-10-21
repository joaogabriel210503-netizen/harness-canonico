> **SUPERADO EM PARTE pelo adendo v1 de 19/10/2026** (`docs/superpowers/specs/2026-10-19-adendo-harness-v1.md`, aprovado). Vale o adendo onde houver diferença. Em especial:
> - **D3 (Codex na E0):** o Codex, persona `tech-lead`, conduz a conversa de definição com o Gabriel, mas **não escreve a SPEC**; a SPEC é só do orquestrador (DP-04, DP-21). O Codex revisa a SPEC por escrito na E3b, antes da frase de aprovação, exceto no caminho curto C1 (DP-22, DP-25).
> - **Vault próprio do harness (R4):** o harness não tem vault; as decisões sobre o próprio harness ficam em `docs/` deste repositório (DP-24). O vault é do projeto (modo local) ou do ecossistema Central (modo universal).
> - Aprovação com hash, C1, Maestri v3 e política de modelo também vêm do adendo.

# Esteira multi-agente E0–E13: desenho aprovado

- **Data:** 14 de outubro de 2026
- **Situação:** desenho aprovado pelo Gabriel, em duas partes, numa sessão de brainstorming (processo do Superpowers). **Ainda não aplicado ao kit.** Os arquivos `.agents/fluxo.md`, `AGENTS.md`, personas e `maestri/papeis.md` continuam descrevendo o fluxo E0–E10 e os papéis da versão 2.
- **Visualização:** página "Esteira Multi-Agente" (artefato no claude.ai), com o quadro E0–E13 em raias, o mapa da frota e um cartão por subagente.
- **Quem escreveu:** Claude (sessão de chat), a partir das respostas do Gabriel.

## Resumo

O harness passa a ter quatro agentes com papéis fixos e catorze etapas. O **Claude Code** desenvolve, com um time de subagentes, e é o único que edita código e faz commit. O **Codex** revisa o código e a segurança da demanda inteira antes do merge, conduz a definição da demanda e ajuda o Gabriel. O **Antigravity** faz pesquisa externa quando alguém pede. O **OpenCode** cuida de infraestrutura e prepara o deploy, que o Gabriel executa. Entram quatro etapas novas: revisão final pelo Codex (E10), memória (E11, que antes era E10), merge pelo Gabriel (E12) e deploy (E13). Entra também um subagente novo, o `devops-engineer`.

## Por que este desenho existe

Até aqui havia três descrições do fluxo que não batiam entre si:

1. **O kit** (`harness-canonico`): fluxo E0–E10, provado no piloto até a execução das waves, com dez personas.
2. **Os papéis do Maestri, versão 2** (`maestri/papeis.md`, 8 de outubro): Codex como "Orquestrador" (coordenava e revisava segurança), Claude Code como "Dev Sênior", OpenCode como analista de infra só leitura, Antigravity como pesquisa e criativo.
3. **A primeira versão da esteira desenhada no chat** (14 de outubro, manhã): Antigravity cuidando de prompt e deploy, uma "IA externa" genérica revisando segurança, os gates antes da revisão e um hook bloqueando o commit pelo relatório externo.

O Gabriel pediu uma esteira atualizada e uma visão completa de agentes e subagentes, partindo do "Prompt Master" dele. Este documento registra o que foi decidido, para que qualquer agente, de qualquer fornecedor, consiga ler e seguir.

## Termos usados neste documento

| Termo | O que quer dizer aqui |
|---|---|
| Harness | O conjunto de regras, arquivos, travas e ferramentas que faz qualquer IA trabalhar do mesmo jeito neste projeto |
| Demanda | Um pedido do Gabriel, do começo ao fim (uma funcionalidade, uma correção, um módulo) |
| SPEC | O documento que diz o que vai ser construído e como saber que ficou certo (critérios de aceite) |
| Plano | A lista de tarefas que realiza a SPEC, cada uma com os arquivos que pode tocar, as dependências e quem executa |
| Wave | Um grupo de tarefas que não dependem umas das outras e não tocam os mesmos arquivos, por isso rodam ao mesmo tempo |
| Subagente | Um agente especialista que o Claude Code chama para uma tarefa só, com contexto limpo |
| Persona | O papel que uma sessão assume (por exemplo "orquestrador"), descrito num arquivo em `.agents/personas/` |
| Gate | Um comando que precisa passar para a demanda andar: `lint`, `typecheck`, `lint:typed` e `test` |
| Hook | Uma trava automática do Claude Code que bloqueia uma ação errada, mesmo que o agente queira fazê-la |
| Vault | A memória longa do projeto, em notas do Obsidian, lida e escrita só pelo servidor MCP `harness-vault` |
| Grafo | O mapa do código feito pelo Graphify, usado para saber o que uma mudança afeta |
| Maestri | O aplicativo onde os quatro agentes rodam lado a lado, cada um num terminal |
| `maestri ask` | O comando que um agente usa para mandar mensagem a outro terminal conectado |
| Reparo | O caminho de volta quando algo reprova: o erro volta para quem pode corrigir, com teto de tentativas |

## As decisões

Cada decisão foi uma pergunta de múltipla escolha. A resposta do Gabriel está registrada como ele deu.

### D1. Papéis da frota

- **Pergunta:** qual mapa de papéis vale (versão 2 do kit, o que foi dito de manhã, ou um híbrido)?
- **Resposta do Gabriel:** nenhuma das três como estava. Ele definiu um mapa novo:
  - Codex (ChatGPT): revisor de código, revisor de segurança e ajudante do Gabriel.
  - Claude Code: desenvolvedor.
  - Antigravity: pesquisas externas.
  - OpenCode: analista de infra, DevOps, deploy e servidores.
- **Consequência:** o Codex deixa de coordenar. A palavra "orquestrador" volta a significar só o Claude Code, que é o que os arquivos do kit já dizem. O conflito de nome registrado em `maestri/papeis.md` deixa de existir. Os nomes dos terminais no Maestri precisam mudar.

### D2. Onde entra a revisão do Codex

- **Opções:** (a) revisores internos a cada wave e o Codex no fim da demanda; (b) o Codex no lugar dos internos em toda wave; (c) internos e Codex em toda wave.
- **Escolha:** (a), que era a recomendação.
- **Motivo:** a revisão interna por wave é rápida e barata e corrige cedo. O Codex, de outra família de modelo, revisa uma vez o diff da branch inteira e pega o que o mesmo modelo não enxerga, sem multiplicar custo e tempo por wave.

### D3. Quem conduz a definição (E0)

- **Opções:** (a) o Codex, como ajudante; (b) uma conversa separada no app Claude, como no Prompt Master; (c) o próprio Claude Code.
- **Escolha:** (a), que era a recomendação.
- **Motivo:** o Codex roda no Maestri, lê o `AGENTS.md` sem adaptação, tem o plugin Superpowers e é de outra família de modelo, então quem define não é quem implementa.

### D4. Até onde vai o OpenCode no deploy

- **Opções:** (a) executa o deploy com ordem aprovada, backup e plano de volta; (b) só prepara e o Gabriel executa; (c) pipeline automático de CI/CD.
- **Escolha:** (b).
- **Consequência:** o OpenCode escreve o roteiro `deploy-NN.md` (backup do banco, passos, plano de volta e teste rápido no ar) e o Gabriel executa linha a linha. O OpenCode não altera servidor, firewall nem DNS. A recomendação era (a); a escolha (b) é mais segura e põe o trabalho manual no Gabriel.

### D5. Subagentes além das dez personas do kit

- **Opções (várias permitidas):** `devops-engineer`, `mobile-specialist`, `explorer-agent`, `documentation-writer`.
- **Escolha:** só `devops-engineer`.
- **Consequência:** mobile, exploração de projeto existente e redação da nota do vault continuam sem subagente próprio. A nota do vault continua com o orquestrador.

### D6. Formato da visualização

- **Escolha:** uma página só, com a esteira em cima e o mapa da frota e dos subagentes embaixo, no mesmo link da primeira versão.

### D7. Confirmação: o Codex revisa só no fim

- **Contexto:** o desenho do Gabriel no Excalidraw (14 de outubro, noite) mostrava o laço Orquestrador ↔ Codex ao lado da revisão da wave, o que dava a entender revisão a cada wave.
- **Resposta do Gabriel:** "Codex no fim". Vale a D2: revisores internos a cada wave, Codex uma vez no E10.

### D8. Os implementadores não conversam entre si

- **Contexto:** no mesmo desenho, setas ligavam Backend ↔ Frontend ↔ DBA. Conversa direta entre trabalhadores só existe no recurso experimental "agent teams" do Claude Code. Subagentes não conseguem conversar entre si; só respondem ao orquestrador.
- **Decisão:** continuam **subagentes**. Motivos: (1) os hooks reconhecem subagente pelo campo `agent_type` do evento, e é isso que impede o implementador de commitar (`commit-guard`) e o revisor de editar (`escopo-guard`). Um teammate de agent teams é uma sessão inteira e provavelmente seria tratado como sessão principal, mas isso não foi testado; (2) subagente nasce com contexto limpo a cada tarefa; (3) agent teams é experimental e custa bem mais.
- **Como fica o alinhamento entre eles: contrato primeiro.** Quando backend, frontend e banco dependem um do outro, o plano traz antes, numa wave anterior, uma tarefa de contrato: tipos, formato da API e schema. Os implementadores leem o contrato em vez de conversar. Quem descobrir que o contrato está errado para e reporta ao orquestrador, que corrige o contrato ou volta ao plano.

### D9. Quatro terminais fixos; especialista é subagente

- **Pergunta:** dividir mais a frota com um terminal fixo por especialista no Maestri (Backend, Frontend, DBA…), ou deixar os especialistas rodando como subagentes dentro do terminal do Claude Code?
- **Resposta do Gabriel:** "sem terminais fixos, deixa assim".
- **Regra que vale daqui em diante:** um terminal por **fornecedor ou papel de longa duração** (Claude Code, Codex, Antigravity, OpenCode). Especialista de tarefa curta é **subagente dentro do terminal do dono**.
- **Por que terminal fixo por especialista foi descartado:** cada terminal seria uma sessão principal, então os hooks deixariam de impedir commit e edição fora do papel; o contexto acumularia entre tarefas; o orquestrador teria de chamar cada terminal pelo `maestri ask` em vez de despachar a wave inteira de uma vez; e o Gabriel teria mais aprovações para digitar.
- **Aplicado ao Codex:** no E10, o Codex principal despacha **dois subagentes Codex**, um de revisão de código e um de revisão de segurança, cada um com contexto limpo (`.codex/agents/*.toml`, listado em `adaptadores.md`). Isso substitui as "threads separadas" e reduz o viés de um modelo fazendo as duas lentes.

### D10. Escopo global limpo

- **Pergunta:** o harness vale só no projeto, só no global, ou um meio-termo?
- **Resposta do Gabriel:** só no projeto, com o global limpo. RTK, Context7 e Caveman ele chama quando quiser; o incômodo é hook e regra global rodando em toda sessão, inclusive fora dos projetos do harness.
- **Regra:** no escopo global ficam só os programas instalados. Regras, hooks, plugins ligados e servidores MCP ficam no escopo do projeto. O inventário de 14 de outubro (`docs/inventario/`) lista o que hoje está no global e precisa ser removido ou movido.

### D11. Um padrão só; a Central obedece ao harness novo

- **Resposta do Gabriel:** o harness novo é a confluência do que ele já faz na Central com o que estudou (vibe-coding-toolkit e o resto). A base vem muito da Central, mas a Central passa a obedecer ao harness novo.
- **Consequência:** o harness novo é o canônico genérico (Central, clientes da SouzaTech, qualquer projeto). Ele absorve o que a Central faz melhor e corrige o que ela faz mal. A Central e os módulos viram consumidores numa etapa posterior, guiada pelo documento `2026-10-14-migracao-harness-existente-esboco.md`. Nada na Central muda antes de o harness novo estar provado no piloto.

## A frota

Os quatro rodam como terminais **puros** no Maestri, apontando para a raiz do projeto. Nenhum recebe a "responsabilidade" (role) do Maestri, porque ela faz o Claude Code iniciar numa subpasta e desliga os hooks (testado em 6 de outubro, registrado em `.agents/adaptadores.md`). A persona vem do primeiro prompt da sessão.

| Agente | Papel | Etapas | Escreve em | Não pode |
|---|---|---|---|---|
| Claude Code | Desenvolvedor e orquestrador do time de subagentes | E1 a E9 e E11 | Código, SPEC, plano, documentos de fluxo, commits na branch | Push, merge, `--no-verify`, `git add .` |
| Codex | Revisor de código e de segurança, ajudante do Gabriel, tech lead no E0 | E0 e E10 | `docs/definicao/` e `docs/fluxo/<demanda>/relatorios/` | Editar código, usar git, instalar pacote, aprovar pelo Gabriel |
| Antigravity | Pesquisa externa | Sob demanda, no E0 ou no E2 | `relatorios/pesquisa-NN.md`, com fonte e data em cada afirmação | Editar código, usar git, decidir arquitetura |
| OpenCode | Infra, DevOps, servidores, prepara o deploy | E13 e análises por ordem | `relatorios/infra-NN.md` e `deploy-NN.md` | Alterar servidor, firewall ou DNS, editar código, usar git |

Comunicação entre eles: o `maestri ask` leva só o caminho de um arquivo. O conteúdo fica em arquivos dentro de `docs/fluxo/<demanda>/` (`ordens/`, `relatorios/`, `handoff/`, `reparo/`). Aprovação é sempre uma frase do Gabriel, digitada no terminal de quem vai agir. Um agente consegue forjar um arquivo, mas não consegue forjar o que o Gabriel digita.

## O fluxo E0–E13

| Etapa | Quem | O que acontece | O que libera a próxima |
|---|---|---|---|
| E0 Definição | Codex (persona `tech-lead`) com o Gabriel | Brainstorming, uma pergunta por vez. Grava PRD, regras de negócio, contexto e MVP em `docs/definicao/` e avisa o Claude Code com o caminho do pedido | `handoff/pedido.md` existe |
| E1 Preparação | Claude Code | Confere o git e cria a branch `demanda/<slug>` | Branch criada |
| E2 Consulta prévia | Claude Code | Vault (pelo MCP), Graphify, documentos, estrutura e Context7 | Seção "Consultas feitas" preenchida |
| E3 SPEC | Claude Code | Brainstorming do Superpowers transforma a definição em SPEC | SPEC apresentada |
| Aprovação da SPEC | Gabriel | Frase exata: "Aprovo a SPEC." | Frase registrada em `estado.md` |
| E4 Plano | Claude Code | writing-plans do Superpowers: tarefas com `Files:`, `Depends-on:`, dono e verificação, em waves. Se backend, frontend e banco dependem um do outro, a primeira wave traz uma tarefa de contrato (D8) | Plano apresentado |
| Aprovação do plano | Gabriel | Frase exata: "Aprovo o plano." | Frase registrada em `estado.md` |
| E5 Wave N | Subagentes implementadores | Em paralelo, um arquivo de passagem por tarefa, teste antes, só os arquivos da tarefa, ninguém commita. Não conversam entre si: leem o contrato e reportam ao orquestrador | Todos reportaram com os gates passando |
| E6 Revisão interna | `code-reviewer` e `security-reviewer` | Independentes e só leitura. Crítico ou alto bloqueia | Sem crítico ou alto aberto |
| E7 Navegador | `validador-visual` | agent-browser, Chrome DevTools e Impeccable contra os critérios da SPEC. Wave sem tela pula | Nenhum defeito aberto |
| E8 Gates | Claude Code | `lint`, `typecheck`, `lint:typed` e `test`, sem compressão, saída lida | Os quatro passam |
| E9 Commit | Claude Code | Um commit por tarefa. Se há outra wave, volta ao E5 | Última wave commitada |
| E10 Revisão final (nova) | Codex | Primeiro `gitleaks` e `npm audit`. Depois o Codex despacha dois subagentes próprios, um de código e um de segurança, cada um com contexto limpo, sobre o diff da branch inteira (D9) | Sem crítico ou alto aberto |
| E11 Memória (era E10) | Claude Code | Índice `MEMORY.md`, nota de entrega no vault, `graphify update`, relatório final | Nota lida de volta, grafo atualizado |
| E12 Merge (nova) | Gabriel | Leva a branch para a main | Merge feito |
| E13 Deploy (nova) | OpenCode prepara, Gabriel executa | Roteiro `deploy-NN.md` com backup do banco, passos, plano de volta e teste rápido no ar | Deploy feito e teste rápido passando |

### Caminhos de volta

- **Reprovou no E6, E7 ou E8:** abre reparo (`.agents/rules/reparo.md`). O erro volta ao implementador com a saída crua, e ele escreve por que errou antes de corrigir. São três tentativas: mesma sessão, sessão nova e outro modelo. Depois da terceira, decide o Gabriel.
- **Reprovou no E10:** cada achado crítico ou alto vira uma **tarefa nova**, que passa sozinha por E5 a E9. Depois, o Codex revisa só o que mudou. O teto é de três rodadas, e depois decide o Gabriel.
- **Desempate:** o Gabriel decide quando a terceira rodada não fecha, ou quando o Claude Code contesta um achado do Codex. Agente não desempata com agente.
- **Pesquisa externa:** entra quando a definição (E0) ou a consulta (E2) precisa de fonte de fora, por ordem que o Gabriel aprova. O resultado volta em arquivo.

## Os subagentes do Claude Code

São onze: nove subagentes despachados e duas personas de sessão.

| Grupo | Nome | Quando entra | Edita | Obrigatoriedade |
|---|---|---|---|---|
| Implementador (E5) | `backend-specialist` | API, regra no servidor, integração, persistência | Só os `Files:` da tarefa | Conforme a tarefa |
| Implementador (E5) | `frontend-specialist` | Tela, componente, estado de interface | Só os `Files:` da tarefa | Conforme a tarefa |
| Implementador (E5) | `database-architect` | Schema, migration, índice | Só os `Files:` da tarefa | Conforme a tarefa |
| Implementador (E5) | `devops-engineer` (novo) | Dockerfile, compose, CI, `.env.example`, scripts de build | Só os `Files:`; não toca servidor | Conforme a tarefa |
| Implementador (E5) | `test-engineer` | Cobertura das regras de negócio, casos de borda | Só testes | Conforme a tarefa |
| Diagnóstico | `debugger` | Bug sem causa conhecida, dentro do reparo | Só o teste que reproduz | Só quando falha |
| Revisão (E6) | `code-reviewer` | Corretude, erro não tratado, teste faltando, aderência à SPEC | Nada | Toda wave |
| Revisão (E6) | `security-reviewer` | OWASP, segredo, autenticação, entrada, dependência | Nada | Toda wave |
| Validação (E7) | `validador-visual` | Fluxo no navegador real contra a SPEC | Nada | Toda wave com tela |
| Persona de sessão | `orquestrador` | Sessão principal do Claude Code | Documentos de fluxo, SPEC, plano, commit | Sempre |
| Persona de sessão | `tech-lead` | Sessão do Codex no E0 | `docs/definicao/` | Toda demanda nova |

### O `devops-engineer`, em detalhe

- **Quando usar:** tarefa que cria ou muda Dockerfile, docker-compose, configuração de CI, `.env.example` ou script de build dentro do repositório.
- **Contrato:** o mesmo dos outros implementadores. Lê o arquivo de passagem e a SPEC, escreve o teste antes quando couber, toca só nos arquivos de `Files:`, consulta o Context7 antes de usar API de ferramenta, roda lint, typecheck e test, e não commita.
- **Limite:** não acessa servidor, não executa deploy e não guarda segredo em arquivo. Servidor é do OpenCode, que só analisa e prepara.
- **Checklist:** nenhum segredo no repositório; healthcheck nos serviços; `.env.example` atualizado; imagem enxuta.

## O que o Claude acrescentou sem o Gabriel pedir

O Gabriel aprovou estes três pontos junto com a parte 1.

1. **`gitleaks` e `npm audit` no começo do E10.** É uma varredura mecânica antes da revisão por IA. Custa quase nada e pega segredo esquecido e dependência vulnerável, que modelo costuma deixar passar.
2. **A memória foi para depois da revisão do Codex.** Assim a nota do vault registra o estado final, já com as correções do E10.
3. **Impeccable como ferramenta do `validador-visual` no E7**, e não como subagente separado. Os quatro subagentes `impeccable-*` continuam fora do fluxo, como já estava registrado.

## O que muda no kit quando o desenho for aplicado

Isto vira um plano (writing-plans), que precisa da aprovação do Gabriel antes de qualquer arquivo mudar.

1. `.agents/fluxo.md`: tabela E0–E13, caminhos de volta do E10, etapas de merge e deploy.
2. `AGENTS.md`: tabela de personas com o `devops-engineer` e a menção a E10–E13.
3. `.agents/personas/devops-engineer.md` e `kit-claude-code/dot-claude/agents/devops-engineer.md`: persona nova.
4. `.agents/templates/`: `revisao-final.md` (relatório do Codex) e `deploy.md` (roteiro do OpenCode); `estado.md` com as etapas novas.
5. `.agents/rules/memoria.md`: memória passa a ser E11, e uma regra nova diz onde ficam as decisões sobre o próprio harness.
6. `.agents/adaptadores.md`: tabela "quem faz o quê" com os papéis novos.
7. `maestri/papeis.md` e `maestri/notas/`: versão 3 dos papéis, nomes novos de terminal e a regra da D9 (quatro terminais fixos, sem terminal por especialista).
7b. `.codex/agents/`: subagentes `code-review` e `security-review` para o E10, com instrução de só leitura e relatório em arquivo.
7c. `.agents/rules/ondas.md`: regra da tarefa de contrato quando implementadores dependem um do outro (D8).
8. `harness-canonico`: virar repositório git e ganhar um `vault/` próprio, a memória do harness, para registrar decisões como esta pelo MCP.

Os hooks não dependem do número da etapa (o `plano-guard` lê só a tabela de aprovações do `estado.md`), então a renumeração não quebra nenhuma trava.

## Riscos e limites

- **E10 a E13 nunca rodaram.** O piloto (Central SLON) chegou até a execução das waves. As etapas novas são desenho.
- **`maestri ask` com o Codex como destinatário não foi testado.** O teste de 6 de outubro foi entre dois Claude Code. Até testar, a mensagem importante pede confirmação de recebimento por arquivo.
- **Um modelo só para duas lentes.** As duas revisões do E10 são do Codex. Os dois subagentes com contexto limpo (D9) reduzem o viés, mas continua sendo a mesma família de modelo.
- **Codex, Antigravity e OpenCode rodam sem hooks.** A trava deles é a instrução do prompt mais a conferência do Claude Code (`git status --short` e `git diff --stat` depois de cada sessão externa) e o pre-commit do git.
- **Deploy manual.** Na opção escolhida, o Gabriel executa linha a linha. O roteiro precisa ser claro o bastante para isso, e o backup do banco vem antes de qualquer passo.
- **Renumeração.** Documentos de demandas antigas citam E10 como memória. Quem ler um `estado.md` antigo precisa saber que a numeração mudou em 14 de outubro de 2026.

## O que não foi verificado

- Se o Antigravity e o OpenCode leem `.agents/rules/` sozinhos (está como "não confirmado" em `adaptadores.md`).
- Se `gitleaks` está instalado no Mac do Gabriel.
- Se o Codex consegue rodar `npm audit` no projeto sem instalar nada (ele não pode instalar pacote).
- Se os subagentes do Codex (`.codex/agents/*.toml`) funcionam como a documentação descreve. Está em `adaptadores.md`, mas não foi provado no Mac.
- Numa sessão do Claude Code mostrada pelo Gabriel em 14 de outubro, os subagentes apareciam como `general-purpose`. O `AGENTS.md` proíbe agente genérico; se essa sessão era do harness, vale descobrir por que o despacho não usou as personas.

## Consultas feitas

- **Vault:** não consultado. O servidor MCP `harness-vault` roda no Claude Code do Mac e não estava disponível na sessão de chat que escreveu este documento.
- **Grafo:** não se aplica. O `.graphifyignore` tira o próprio harness do grafo, e nenhum código de produto mudou.
- **Documentos lidos:** `AGENTS.md`, `.agents/fluxo.md`, as dez personas em `.agents/personas/`, `.agents/rules/reparo.md`, `consulta.md`, `memoria.md` e `gates.md`, `.agents/adaptadores.md`, `maestri/papeis.md`, `maestri/notas/regras.md`, os cabeçalhos dos hooks em `kit-claude-code/dot-claude/hooks/`. Do vibe-coding-toolkit: `docs/tools/02-subagent-orchestration.md`, `docs/prompts/05-parallel-wave-dispatch.md`, `docs/prompts/03-multi-agent-code-review.md` e `docs/02-playbook-onboarding.md`. O `SKILL.md` de brainstorming do Superpowers. O "Prompt Master" do Gabriel.
- **Maestri:** documentação oficial (Introdução, Conexões, Modo Maestro, Partituras e Wire).
- **Context7:** não se aplica, nenhuma decisão depende de API de biblioteca.

## Próximos passos

1. O Gabriel revisa este documento e aprova ou pede mudança.
2. Plano de aplicação no kit (writing-plans), com aprovação separada.
3. Execução do plano e uma demanda pequena no piloto, rodando de E0 a E13, para provar as etapas novas.
