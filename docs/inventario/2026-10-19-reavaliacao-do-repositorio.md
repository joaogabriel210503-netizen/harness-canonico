# Reavaliação do repositório: o que falta para o harness ficar 100% definido (19/10/2026)

Lido arquivo por arquivo: `AGENTS.md`, `README.md`, `.agents/` (fluxo, adaptadores, stack, origem, 10 personas, 6 regras, templates, memória), `kit-claude-code/`, `.githooks/`, `maestri/`, `modo-facil/`, `docs/superpowers/specs/` e `docs/inventario/`. Base de comparação: desenho da esteira E0–E13 (14/10) e decisões DP-01 a DP-20.

**Resumo.** As travas estão prontas e provadas. O que impede o harness de estar 100% definido é texto: o kit ainda descreve o fluxo antigo (E0–E10, Codex fazendo a definição, Antigravity revisando) e há 11 pontos que nenhuma decisão cobre. Sem fechar esses pontos, o adendo da SPEC teria buracos.

## 1. Pontos sem decisão (bloqueiam o adendo da SPEC)

**Atualização 19/10, 23h13: todos decididos, ver DP-21 a DP-31 no registro de decisões.** R1 ficou com a opção B (Codex conduz a definição, sem escrever a SPEC), R7 com "pesquisa e apoio geral" e R8 com a opção A (aceitar, sem hook global); os demais seguiram a recomendação.

| ID | Pergunta | Por que está aberto | Recomendação |
|---|---|---|---|
| R1 | Quem conduz a E0 (definição) depois do DP-04? | O DP-04 tirou a definição do Codex. Nenhum arquivo diz quem assume, nem o que vira a persona `tech-lead` | Orquestrador (Claude Code) conduz E0 e E3 numa conversa só; `tech-lead` vira persona de consultor do humano no Codex |
| R2 | Onde entra a revisão da SPEC pelo Codex? | DP-04 diz "uma vez, depois", sem posição no fluxo nem formato de saída | Entre E3 e a aprovação: o Gabriel lê o parecer do Codex antes de dizer a frase. Pulada no C1 (DP-04b) |
| R3 | Projetos fora da Central (clientes SouzaTech, pessoais, o próprio harness) usam qual vault? | DP-02b pôs o vault universal no repositório da Central; o D11 diz que o harness é genérico, para clientes também. Nota de cliente no repositório da empresa é vazamento | Vault universal só para o ecossistema Central; projeto fora dela usa `vault/` próprio no repositório (o modelo atual do kit) |
| R4 | Onde ficam as decisões sobre o próprio harness? | A esteira previa um vault próprio do harness (item 8); hoje tudo está em `docs/inventario/` | Manter em `docs/` sob git; descartar o vault próprio do harness |
| R5 | Critério objetivo do caminho curto C1 | DP-04b pediu critério para o orquestrador não classificar por conta própria | C1 só se valer tudo: até 3 arquivos, uma wave, sem banco ou migration, sem dependência nova, sem autenticação ou segurança, sem arquivo protegido. Na dúvida, não é C1 |
| R6 | Maestri versão 3: nomes dos terminais e o mecanismo de ordens | `maestri/papeis.md` ainda é a versão 2 (Codex como orquestrador, terminais com role), contrária ao D1 e à regra de nunca usar role | Quatro terminais puros: Orquestrador (Claude Code), Revisor (Codex), Pesquisa (Antigravity), Infra (OpenCode). Ordens escritas pelo orquestrador; o Gabriel aprova no terminal de quem executa |
| R7 | Antigravity continua com "criativo" (imagens, assets)? | D1 diz só pesquisa; `papeis.md` v2 dá pesquisa e criativo | Manter os dois, com assets só em `assets-candidatos/` |
| R8 | Sessão aberta fora da raiz fica sem travas (provado em 18/10). Fechar como? | Só disciplina cobre hoje. Fechar exige hook no escopo global, o que contraria o D10 (global limpo) | Exceção ao D10: um único hook global que não faz nada fora de projeto do harness e bloqueia quando a sessão abre numa subpasta dele |
| R9 | Quem roda `gitleaks` e `npm audit` no começo da E10? | O Codex não pode instalar nada; não se sabe se o `gitleaks` está instalado | O orquestrador roda antes de chamar o Codex e anexa a saída; `gitleaks` vira item do inventário e do `doctor` |
| R10 | Perfil mobile (React Native e Flutter) entra na versão 1? | `stack.md` diz "a montar no primeiro projeto" | Fora da versão 1; entra quando houver o primeiro projeto mobile |
| R11 | Qual é a definição de "pronto" e onde roda o piloto E0–E13? | A esteira manda provar numa demanda pequena de ponta a ponta; o projeto não foi escolhido | Pronto = W9 passando + uma demanda pequena real de E0 a E13 sem intervenção fora do fluxo. Piloto na Central SLON |

## 2. Contradições no texto do kit (trabalho, não decisão)

| Arquivo | O que está errado |
|---|---|
| `README.md` | "Fase 3 em andamento, E0 a E10"; tech-lead no Codex para começar demanda |
| `.agents/fluxo.md` | Ainda E0–E10: sem E10 Codex, E11 memória, E12 merge, E13 deploy; E0 com `tech-lead`; sem revisão da SPEC pelo Codex; sem C1; sem hash da SPEC (DP-03b) |
| `AGENTS.md` | Tabela de personas sem `devops-engineer`; `tech-lead` como dono da E0 |
| `.agents/adaptadores.md` | Data de 6/10; Codex como tech lead da E0; Antigravity como revisor 2 da E6 e OpenCode/Grok em segurança; sem o mapa nível→modelo (DP-18); "fase 6" em vez de W8 |
| `.agents/rules/ondas.md` | "Antigravity na validação visual"; sem `Resources:` e tarefa de contrato (D8) |
| `.agents/rules/memoria.md`, `memory/INSTRUCTIONS.md`, `templates/estado.md` | Memória em E10 (passou a E11); sem campos de frescor de memória do toolkit |
| `.agents/rules/reparo.md` | Sem regra de parada da revisão (toolkit) e sem o caminho de volta do E10 |
| `.agents/personas/tech-lead.md` | Dono da E0 (contra DP-04) |
| `.agents/personas/frontend-specialist.md` | "Teste primeiro" para tudo (contra DP-05) |
| `.agents/personas/orquestrador.md` | Conduz E1 a E10 |
| `.agents/templates/ordem.md` | "Emitida por: Orquestrador (Codex)" |
| `maestri/papeis.md` e `maestri/notas/*` | Versão 2 inteira (R6) |
| `modo-facil/04-rotina-de-uma-demanda.md` | Passo 1 manda definir com o Codex; sem E10–E13 |
| `docs/superpowers/specs/2026-10-14-esteira-e0-e13-design.md` | D3 (Codex na E0) superado pelo DP-04; vault próprio do harness (R4) |

## 3. O que falta construir

| Item | Onda |
|---|---|
| Persona `devops-engineer` (`.agents/personas/` e adaptador do Claude Code) | W5 |
| Templates: `revisao-spec.md` (Codex), `revisao-final.md` (Codex na E10), `deploy.md` (OpenCode), modelo de SPEC com "Consultas feitas" e hash | W5 |
| `.codex/agents/` (revisão de código e de segurança na E10) e regras equivalentes para Antigravity e OpenCode | W8 |
| Biome no template de gates (`biome.jsonc`, script, `gates.lock`, `rules-guard`, selftest) | W3 |
| Hook de `Stop` com recibo dos gates (DP-11) e `validar-saida` | W4 |
| Escopo por `Files:` e `Resources:` no `plano-guard` | W2 |
| Vault universal (DP-02, R3) e `vault-guard` por pasta | W6 |
| `harness.json` com versão, `verificar` e `atualizar`; `doctor` com grafo, `gitleaks` e hook global (R8) | W7 |
| Mapa nível→modelo por CLI (DP-18); skills por agente (DP-17, do Gabriel) | W4 |
| Teste de aceitação e piloto (R11) | W9 |
| Documento de migração (a partir do esboço e do prompt 12 do toolkit) | depois da W9 |

## 4. Ações do Gabriel

Rodar o inventário de máquina (`modo-facil/00-inventario.md`), subir o harness no GitHub, preencher as skills por agente, responder R1 a R11, devolver o retorno da IA avaliadora.
