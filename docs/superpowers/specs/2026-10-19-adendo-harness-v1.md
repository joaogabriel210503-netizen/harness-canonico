# Adendo da SPEC: harness canônico v1

- **Data:** 19 de outubro de 2026
- **Situação:** **aguarda aprovação do Gabriel.** Nada no kit muda por causa deste documento antes da aprovação dele e do plano de cada onda.
- **Complementa:** `2026-10-14-esteira-e0-e13-design.md` (desenho aprovado). Onde os dois divergem, vale este adendo.
- **Fontes:** registro de decisões `docs/inventario/2026-10-14-decisoes-brainstorm.md` (DP-01 a DP-31), registro de correções N01–N37, auditoria de 14/10, prova no Claude Code real de 18/10, impacto do toolkit atualizado (18/10) e reavaliação do repositório (19/10).

## 1. Objetivo

Fechar o harness canônico versão 1: um kit copiado para cada projeto, sob git, separado do código de produto, que faz Claude Code, Codex, Antigravity e OpenCode trabalharem do mesmo jeito dentro do Maestri, sem que um agente consiga sozinho pular etapa, aprovar o próprio trabalho, desligar trava, estourar o teto de 350 linhas, commitar na `main` ou vazar segredo.

**Na versão 1:** perfil web (TypeScript); os quatro agentes; vault local por projeto e vault universal para o ecossistema Central; o que está nas ondas W1 a W9 (seção 12).

**Fora da versão 1:** perfis mobile (DP-30); sandbox do Bash (DP-12); assinatura criptográfica da aprovação (DP-03); Playwright E2E (DP-06); pipeline de memória por LLM (DP-10); a migração da Central em si (documento próprio, depois da v1); remoto, backup e pendências da Central (DP-20).

## 2. O que este adendo muda no desenho de 14/10

| Desenho de 14/10 | Agora | Decisão |
|---|---|---|
| Codex conduz a E0 e escreve o pedido | Igual: Codex conduz a definição. Mas **não** escreve a SPEC | DP-04, DP-21 |
| Sem revisão da SPEC por outra família | Codex revisa a SPEC antes da frase de aprovação (etapa E3b) | DP-04, DP-22 |
| Demanda pequena: só os documentos encolhem | Caminho curto C1 com critério objetivo e sem Codex na SPEC | DP-04b, DP-25 |
| `vault/` por projeto e vault próprio do harness | Vault local por projeto (padrão) **ou** vault universal da Central; decisões do harness em `docs/` | DP-02, DP-23, DP-24 |
| Antigravity só pesquisa | Pesquisa e apoio geral, por ordem aprovada | DP-27 |
| Maestri v2 (Codex orquestrador, terminais com role) | Maestri v3, quatro terminais puros | DP-26 |
| Biome como formatador (texto antigo do kit) | Biome como gate curado, regra do toolkit | DP-09 |
| `lint:types` | `lint:typed` | DP-16 |
| Modelo herdado ou escolhido sem regra | Política Leve/Médio/Forte autorizada em `AGENTS.md` | DP-14, DP-18 |

## 3. A frota

Quatro terminais **puros** no Maestri, apontando para a raiz do projeto, sem responsabilidade (role) atribuída (DP-26). A persona vem do primeiro prompt.

| Terminal | Agente | Papel | Etapas | Escreve em | Não pode |
|---|---|---|---|---|---|
| Orquestrador | Claude Code | Escreve SPEC e plano, despacha subagentes, roda gates, commita, fecha memória | E1–E9, E11 | SPEC, plano, `docs/fluxo/`, memória, commits na branch | Escrever código (DP-15), push, merge, `--no-verify`, `git add .` |
| Revisor | Codex (persona `tech-lead` na E0) | Conduz a definição, revisa a SPEC, faz a revisão final, é consultor do Gabriel | E0, E3b, E10 | `docs/definicao/`, `docs/fluxo/<demanda>/` | Editar código, usar git, instalar pacote, aprovar pelo Gabriel |
| Pesquisa | Antigravity | Pesquisa externa e apoio geral | Por ordem | `relatorios/pesquisa-NN.md`, `assets-candidatos/` | Editar código ou configuração, usar git, decidir arquitetura |
| Infra | OpenCode | Infra, DevOps, servidores, prepara o deploy | E13 e por ordem | `relatorios/infra-NN.md`, `deploy-NN.md` | Alterar servidor, firewall ou DNS, editar código, usar git |

**Ordens:** escritas pelo orquestrador em `docs/fluxo/<demanda>/ordens/ordem-NN.md`; o Gabriel aprova no terminal de quem executa ("Aprovo a ordem NN."); a mensagem entre terminais leva só o caminho do arquivo.

## 4. O fluxo E0–E13

| Etapa | Quem | O que acontece | Libera a próxima |
|---|---|---|---|
| E0 Definição | Codex (`tech-lead`) com o Gabriel | Uma pergunta por vez; PRD, regras de negócio, contexto, MVP | `handoff/pedido.md` existe |
| E1 Preparação | Orquestrador | Confere o git, cria `demanda/<slug>`, confere o que agente externo deixou (`git status --short`) | Branch criada |
| E2 Consulta prévia | Orquestrador | Vault (MCP), grafo, documentos, estrutura, Context7 | "Consultas feitas" preenchida |
| E3 SPEC | Orquestrador | Superpowers `brainstorming`; critérios de aceite; declara se é C1 | SPEC escrita, com hash |
| E3b Revisão da SPEC | Codex | Parecer por escrito: contradição com a definição, lacuna, risco. **Pulada no C1** | `revisao-spec.md` entregue |
| Aprovação da SPEC | Gabriel | Lê SPEC e parecer; frase sozinha numa mensagem: "Aprovo a SPEC." | Frase, data e hash em `estado.md` |
| E4 Plano | Orquestrador | `writing-plans`: tarefas com ID, `Files:`, `Resources:`, `Depends-on:`, dono, verificação; tarefa de contrato quando implementadores dependem um do outro | Plano escrito, com hash |
| Aprovação do plano | Gabriel | "Aprovo o plano." | Frase, data e hash em `estado.md` |
| E5 Wave N | Subagentes implementadores | Em paralelo, um arquivo de passagem por tarefa; teste primeiro só para lógica (DP-05); ninguém commita | Todos reportaram com gates passando |
| E6 Revisão interna | `code-reviewer` e `security-reviewer` | Independentes, só leitura, um não vê o outro; revisor confere o hash da SPEC e do plano | Sem crítico ou alto aberto |
| E7 Navegador | `validador-visual` | agent-browser, Chrome DevTools e Impeccable; wave sem tela pula | Nenhum defeito aberto |
| E8 Gates | Orquestrador | `lint`, `typecheck`, `lint:typed`, `test`, sem compressão | Os quatro passam |
| E9 Commit | Orquestrador | Um commit por tarefa; outra wave volta ao E5 | Última wave commitada |
| E10 Revisão final | Codex | O orquestrador roda antes `gitleaks` e `npm audit` e anexa a saída (DP-29); o Codex despacha dois subagentes próprios (código e segurança) sobre o diff da branch, sempre nível Forte | Sem crítico ou alto aberto |
| E11 Memória | Orquestrador | Índice, nota de entrega no vault (lida de volta), `graphify update`, relatório | Nota lida de volta, grafo atualizado |
| E12 Merge | Gabriel | Leva a branch para a `main` | Merge feito |
| E13 Deploy | OpenCode prepara, Gabriel executa | `deploy-NN.md`: backup do banco, passos, plano de volta, teste rápido no ar | Teste rápido passando |

### 4.1 Caminho curto C1 (DP-04b, DP-25)

É C1 só se valer tudo: até 3 arquivos; uma wave; sem banco ou migration; sem dependência nova; sem autenticação ou segurança; sem arquivo protegido. Na dúvida, não é C1. O orquestrador lista no pedido de aprovação cada item conferido. No C1: sem E0 longa (o pedido pode ser o próprio texto do Gabriel), sem E3b; as duas aprovações continuam; a E10 continua. O revisor da E6 reprova C1 que não cumpre o critério.

### 4.2 Aprovação com hash (DP-03, DP-03b)

1. O orquestrador apresenta: caminho do arquivo, resumo de até 5 linhas e os 12 primeiros caracteres do sha256 do arquivo.
2. O Gabriel responde só com a frase ("Aprovo a SPEC." ou "Aprovo o plano.").
3. O orquestrador registra em `estado.md`: arquivo, frase como digitada, data e hash.
4. O revisor da E6 e o Codex na E10 recalculam o hash; se não bate, reprovam: o documento mudou depois da aprovação.

Limite aceito: o agente ainda pode escrever uma frase que o Gabriel não digitou (N02). O hash torna a alteração posterior detectável, não impossível.

### 4.3 Caminhos de volta

Iguais aos do desenho de 14/10 (reparo com três tentativas; achado da E10 vira tarefa nova; desempate é do Gabriel), mais a regra do toolkit: a revisão para quando os achados relevantes estão resolvidos ou registrados e os gates passam; outra rodada só com evidência nova.

## 5. Subagentes do Claude Code

Os nove do desenho de 14/10 mais o `devops-engineer` (D5). Todos com `model: inherit` e `disallowedTools`; o despacho informa o modelo (DP-14). `skills:` por agente: a lista vem do Gabriel depois (DP-17); até lá o campo fica vazio.

## 6. Travas: o que é mecânico e o que é texto

| Mecânico (provado) | Só texto ou conferência |
|---|---|
| `plano-guard`, `escopo-guard`, `commit-guard`, `rules-guard`, `despacho-guard`, `segredo-guard`, `vault-guard`, `deny` de `.env`, `onFailure:"block"` | A frase do Gabriel ser dele (N02) |
| pre-commit (lint, `gates.lock`, segredo) e pre-push (selftest dos gates, typecheck, test, `lint:typed`) | Arquivos fora de `Files:` (revisor, até a W2 fechar) |
| `doctor` e `session-start` | Agentes externos (Codex, Antigravity, OpenCode) até a W8 |
| Teto de 350 linhas e 160 colunas no ESLint | Sessão aberta fora da raiz: **nenhuma trava** (DP-28, risco aceito) |

Requisito: Claude Code ≥ 2.1.295.

## 7. Gates

ESLint (cobertura pesada e o gate do harness) e Biome (`recommended:false`, regras escolhidas uma a uma e justificadas no `biome.jsonc`; formatador ligado em projeto novo) sem sobreposição (DP-09); `tsc`; testes; `lint:typed` na E8 e no pre-push (DP-16). `max-lines` 350 nativo, sem isenção alguma; `max-len` 160; `noInlineConfig`. `gates.lock.json` cobre também `biome.json*`. Só o humano roda `travar-gates`.

## 8. Memória e vault

- **Índice** `.agents/memory/MEMORY.md` (até 130 linhas), escrito só pelo orquestrador na E11, com os campos de frescor do toolkit: fonte, evidência, data da última verificação e condição de invalidação.
- **Vault, dois modos** (DP-23):
  - **Local (padrão):** `vault/` no repositório do projeto; um servidor `harness-vault`. Vale para clientes SouzaTech, projetos pessoais e qualquer projeto fora da Central.
  - **Universal (ecossistema Central):** vault no repositório da Central, uma pasta por módulo mais `_comum/` (DP-02, 02a, 02b). Um servidor por módulo com raiz na pasta do módulo e um `harness-vault-comum` com escrita negada por `permissions.deny`; sem `[[link]]` entre pastas; caminho por variável de ambiente, conferido pelo `doctor` (DP-02c). Exige que a Central tenha remoto e backup (tratado pelo Gabriel fora do harness).
- **Decisões sobre o próprio harness:** `docs/` deste repositório (DP-24).
- **Grafo:** `graphify-out/` fora do git (DP-08); o `doctor` avisa grafo ausente ou velho.

## 9. Modelo

Política Leve/Médio/Forte em `AGENTS.md` (DP-14). O mapa nível→modelo de cada CLI fica em `.agents/adaptadores.md`, preenchido pelo assistente e corrigido pelo Gabriel (DP-18). A revisão final do Codex é sempre Forte.

## 10. Em relação ao vibe-coding-toolkit (`de66fe3`)

**Divergências assumidas:** hooks de git bloqueantes; delegação obrigatória (DP-15); política de modelo explícita; hooks que falham fechados; duas aprovações com hash; teto de 350 sem isenção.

**Adotado do toolkit:** `lint:typed`; Biome curado; campos do handoff (estado verificado com data, evidência, recursos abertos, contexto a revisitar); `Resources:` nos planos; regra de parada da revisão; frescor de memória; procedimento de revisão de segurança somente leitura; continuidade de execução (bloqueio parcial só nas tarefas dependentes); os sete casos de avaliação de harness na W9; o prompt de projeto existente como base do documento de migração.

## 11. Riscos aceitos

Aprovação citável pelo agente (N02); Bash só com heurística, sem sandbox (DP-12); validação visual sem teste repetível (DP-06); sessão fora da raiz sem travas (DP-28); vault universal dependente do repositório da Central (DP-02b); agentes externos sem trava mecânica até a W8; recibo de gates no `Stop` é texto do agente, a trava real é o pre-push (DP-11).

## 12. Ondas (ordem do DP-19)

Cada onda tem plano próprio (`writing-plans`) e aprovação própria com a frase no chat.

| Onda | Entrega |
|---|---|
| W3 Gates | Biome no template (`biome.jsonc`, script `lint`, `gates.lock`, `rules-guard`, casos no selftest) |
| W1 Base das travas | Despachante único por evento; `alvosDeEscrita()` único; `vault-guard` no parser compartilhado (N33) |
| W2 Aprovação e escopo | Hash na aprovação (4.2) no fluxo, nos templates e nas personas revisoras; `Files:` e `Resources:` no `plano-guard` (B02); guarda de `maestri ask` |
| W4 Agentes e saídas | Formatos F1–F10; `validar-saida`; hook de `Stop` com recibo (DP-11); campos do handoff; mapa nível→modelo; `skills:` (quando o Gabriel passar) |
| W5 Fluxo e documentos | Aplicar este adendo: `fluxo.md`, `AGENTS.md`, `adaptadores.md`, `ondas.md`, `memoria.md`, `reparo.md`, personas (`tech-lead`, `orquestrador`, `frontend-specialist`), `devops-engineer` novo, templates (`revisao-spec.md`, `revisao-final.md`, `deploy.md`, modelo de SPEC, `estado.md` E0–E13, `ordem.md`), `maestri/` v3, `modo-facil/04`, `README.md` |
| W6 Memória e vault | Os dois modos do vault; instalador perguntando o modo; `vault-guard` por pasta; frescor de memória; `memoria-check` |
| W7 Distribuição | `harness.json` com versão e sha256; `verificar` e `atualizar`; `doctor` com grafo, `gitleaks`, plugins e `autoMemoryEnabled` |
| W8 Multi-fornecedor | `.codex/agents/` (código e segurança na E10), regras e guardas possíveis para Codex, Antigravity e OpenCode; `_comum` só leitura fora do Claude Code; versões das CLIs fixadas |
| W9 Aceitação | Seção 13 |

Depois da W9: documento de migração de projeto que já tem harness (esboço de 14/10 + prompt 12 do toolkit).

## 13. Critérios de aceitação da versão 1 (DP-31)

O harness v1 está pronto quando tudo abaixo for verdade, com evidência gravada:

1. `node .claude/hooks/selftest.mjs`, o `selftest-git` e `npm run gates:selftest` saem com zero no Mac do Gabriel.
2. `node .claude/hooks/doctor.mjs` sem item grave no Mac do Gabriel.
3. Cada trava nova das ondas W1–W8 provada no Claude Code real, como em 18/10, com o caso positivo (o que deve passar, passa).
4. Os sete casos de avaliação de harness do toolkit rodados; observação ausente conta como "não rodado", nunca como "passou".
5. Cada agente responde, na primeira mensagem da sessão, às perguntas da W9 com a resposta esperada: qual é o seu papel, em que etapa está a demanda, se pode editar código, quem aprova, onde grava a saída, o que faz quando o pedido pula etapa.
6. Busca no kit sem resto do fluxo antigo: nenhuma ocorrência de "E0–E10", "Orquestrador (Codex)", Antigravity como revisor ou memória em "E10".
7. Uma demanda pequena real na **Central SLON** roda de E0 a E13 sem ninguém sair do fluxo, com `estado.md` completo, hashes conferidos e relatório final.

## 14. Ações do Gabriel

Rodar o inventário de máquina (`modo-facil/00-inventario.md`, inclui `gitleaks`); subir o harness no GitHub; passar a lista de skills por agente; trazer o retorno da IA avaliadora (entra como emenda deste adendo); remoto e backup da Central antes da W6 no modo universal.

## Consultas feitas

- **Vault:** não consultado; o harness não tem vault próprio (DP-24) e as decisões estão em `docs/`.
- **Grafo:** não se aplica; o `.graphifyignore` exclui o próprio harness e nenhum código de produto muda.
- **Documentos:** todos os arquivos do repositório (reavaliação de 19/10), o registro de decisões DP-01 a DP-31, o registro N01–N37, a auditoria de 14/10, a prova de 18/10 e o impacto do toolkit de 18/10.
- **Estrutura:** `kit-claude-code/`, `.githooks/`, `.agents/`, `maestri/`, `modo-facil/`.
- **Context7:** não se aplica; nenhuma decisão depende de API de biblioteca. O comportamento do `obsidian-mcp` foi conferido no README do commit fixado.
