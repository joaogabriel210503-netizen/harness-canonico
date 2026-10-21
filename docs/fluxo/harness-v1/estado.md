# Estado: harness canônico v1

> Registro das aprovações do próprio harness (DP-24: decisões do harness em `docs/`).

- **Demanda:** harness-v1
- **Etapa atual:** W1 a W9 executadas e teste no Mac feito; as falhas do Claude Code foram corrigidas e provadas. Falta do Gabriel: re-teste das CLIs externas (Codex/OpenCode/Antigravity) com modelo e o piloto na Central SLON
- **Atualizado em:** 2026-10-19 23:55

## Aprovações

| O quê | Arquivo aprovado | Frase do humano | Data | sha256 (12) |
|---|---|---|---|---|
| SPEC (adendo v1) | docs/superpowers/specs/2026-10-19-adendo-harness-v1.md | Aprovo a SPEC. | 2026-10-19 23:18 | 3d8a3f0fbe93 |

## Planos por onda (ordem do DP-19)

| Onda | Plano | Frase | Data | sha256 (12) | Situação |
|---|---|---|---|---|---|
| W3 Gates (Biome) | docs/superpowers/plans/2026-10-19-w3-gates-biome.md | Aprovo o plano. | 2026-10-19 23:29 | 13667646fc4f | concluída (T01 a T07). Selftests do template, dos hooks e do git passam; prova com Claude Code real e Biome 2.5.15 registrada. Desvio: `hooks/selftest.mjs` com 411 linhas (>350), dividir na W1 |
| W1 Base das travas | docs/superpowers/plans/2026-10-20-w1-base-das-travas.md | Autorização contínua: "Agora faça sem precisar parar... Plano aprovado." | 2026-10-20 00:08 | | concluída (T01 a T06). Selftest todo OK; prova real no Claude Code; selftest dividido (maior arquivo 184 linhas) |
| W2 Aprovação e escopo | docs/superpowers/plans/2026-10-20-w2-aprovacao-e-escopo.md | Autorização contínua de 20/10/2026 00:08 | 2026-10-20 00:08 | | concluída. Selftest 366 casos OK; prova real no Claude Code (4 casos) |
| W4 Agentes e saídas | docs/superpowers/plans/2026-10-20-w4-agentes-e-saidas.md | Autorização contínua de 20/10/2026 00:08 | 2026-10-20 00:08 | | concluída (T01 a T05), `skills:` à espera do Gabriel. Selftest 417 casos OK; prova real no Claude Code |
| W5 Fluxo e documentos | docs/superpowers/plans/2026-10-20-w5-fluxo-e-documentos.md | Autorização contínua de 20/10/2026 00:08 | 2026-10-20 00:08 | | concluída (T01 a T04). Busca por E0–E10, Orquestrador (Codex), Antigravity revisor, memória em E10: zero restos. Selftest OK |
| W6 Memória e vault | docs/superpowers/plans/2026-10-20-w6-memoria-e-vault.md | Autorização contínua de 20/10/2026 00:08 | 2026-10-20 00:08 | | concluída. Vault local/universal, comum só leitura (guard + deny), `memoria-check`, instalador com `--modo`; selftest OK; prova de instalação registrada |
| W7 Distribuição | docs/superpowers/plans/2026-10-20-w7-distribuicao.md | Autorização contínua de 20/10/2026 00:08 | 2026-10-20 00:08 | | concluída (T01 a T04). Selftest OK; instalar, verificar e atualizar rodados; prova real do alerta no SessionStart |
| W8 Multi-fornecedor | docs/superpowers/plans/2026-10-20-w8-multi-fornecedor.md | Autorização contínua de 20/10/2026 00:08 | 2026-10-20 00:08 | | concluída (T01 a T05) com limite: provado com Codex 0.163.0 e OpenCode 1.19.3 reais só em configuração, execpolicy e plugin simulado; hook disparando em sessão com modelo e Antigravity ficam para o Gabriel (ver adaptadores.md) |
| W9 Aceitação | docs/superpowers/plans/2026-10-20-w9-aceitacao.md | Autorização contínua de 20/10/2026 00:08 | 2026-10-20 00:08 | | executada até onde dá sem o Mac e o piloto: critérios 1, 2, 6 atendidos no projeto descartável; 3 e 4 parciais; 5 só Claude Code; 7 é do Gabriel. Relatório em docs/inventario/2026-10-20-aceitacao-w9.md. Migração: modo-facil/05 Teste no Mac real (Claude Code 2.1.304): 21/31 passaram; as 7 falhas foram corrigidas (3 do Claude Code reprovado-depois em instalação limpa; 4 das CLIs externas, no código e no selftest, faltando prova com modelo); 3 manuais. Correções em docs/inventario/2026-10-20-teste-mac.md |

## Skills por agente (DP-17, 20/10/2026)

Atribuídas no frontmatter `skills:` de cada agente (`kit-claude-code/dot-claude/agents/`): frontend = ponytail (regente) + ui-ux-pro-max + impeccable; backend = Backend Design (6 sub-skills); security = finecomb; qualidade = qamap-pr-qa (QAMap). QA de tela fica no validador-visual (browser do agente), não em plugin de Playwright. impeccable entra só como skill, sem o hook do settings.local.json (o doctor reprova hook ali). Nomes confirmados no Mac (20/10): frontend = `ponytail:ponytail`, `ui-ux-pro-max:ui-ux-pro-max`, `impeccable` (slug nu); backend = `backend-design:*` (6); security = `finecomb:finecomb`; qualidade = `qamap:qamap-pr-qa`. Todos resolvem no ListSkills. Falta provar o PRELOAD (só dá depois de instalar num projeto e despachar): virou o item F2 do `modo-facil/06-teste-no-mac.md`.

## Repositório pronto para o GitHub (20/10/2026)

Quatro portas de entrada com guias e prompts prontos: máquina nova (`modo-facil/01`, com exportação da configuração para `maquina/` e restauração), projeto novo (`02`, ex-03), projeto em andamento sem harness (`03`, novo, com linha de base do lint para código legado) e atualização (`07`, novo: publicar o kit, levar a versão aos projetos e a primeira subida). `BOOTSTRAP.md` para o agente que recebe "leia o repositório harness-canonico". README reescrito como porta de entrada. O antigo `00-inventario` virou `08-diagnostico-da-maquina`; os roteiros da construção foram para `modo-facil/historico/`.

Mudança no kit: `enabledPlugins` no `.claude/settings.json` desliga os 9 plugins que conflitam com o fluxo (antes era um passo manual por projeto com `--scope project`, que alterava o `settings.json` do projeto e travava as atualizações dele). Selftest novo reprova plugin desligado que seja dono de skill pré-carregada. Ainda sem prova no Claude Code real: item F2 do `06`.

Lacuna registrada: o teto de 350 linhas não tem lista de exceções implementada; projeto legado com arquivo grande precisa refatorar antes ou de uma mudança de regra no kit (`03`, Passo 3).

Higiene: varredura de segredo em 170 arquivos sem achado; `maestri/_to_delete` (107 MB) apagado com a permissão do Gabriel. Selftest 525 casos OK; instalação limpa conferida.

### Revisão fria das portas de entrada (20/10/2026)

Um revisor independente leu os guias como o Gabriel e como um agente, sem ver a escrita. Achou 10 defeitos ALTO; 2 eram de cópia velha na pasta de upload (não procedem: `_w9/` e o mapeamento do Codex/OpenCode no manifesto). Corrigidos e conferidos:

- `doctor` rodava antes do `travar-gates` (02, 03, 07): agora depois da trava.
- Projeto em andamento: a I1 exigia git limpo com o inventário recém-criado; `CLAUDE.md` próprio virava conflito eterno (instalador corrigido: o do projeto é mantido e só precisa importar `@AGENTS.md`); `HARNESS_VAULT_CENTRAL` nunca era definido (passo no "Antes"); commit, travar e religar fora de ordem; `lint:typed` fora da linha de base.
- Legado acima do teto não tinha saída: implementada a lista `DIVIDA_APROVADA` no `eslint.config.mjs` (o README dos gates já previa). Nos arquivos listados, teto e console viram `warn` mantendo 350/160; arquivo novo continua `error`; a lista está no `gates.lock`. Provado com o ESLint real e o `gates:selftest`. Regra 8 do `AGENTS.md` registra a exceção.
- Migração (05) reescrita: o fluxo não roda antes de o harness existir; o mapa é aplicado no commit da instalação; a limpeza vira a primeira demanda.
- Instalador: recusa dois destinos (caminho com espaço sem aspas) e modo universal sem módulo, antes de copiar.
- Manifesto: o `biome.jsonc` tinha saído do `harness.json` com a troca para `.modelo`; voltou.
- Máquina nova: PATH do `~/.local/bin`, caminhos absolutos, Context7 como passo do Gabriel, plugins de terceiros dependem da exportação (Parte A).
- O orquestrador pede liberação para gravar `.agents/stack.md` na E4 (arquivo de regra; a trava não foi afrouxada).
- Sessão aberta dentro do kit: `.claude/CLAUDE.md` na raiz do kit avisa que o `AGENTS.md` é modelo (não vai para os projetos).
