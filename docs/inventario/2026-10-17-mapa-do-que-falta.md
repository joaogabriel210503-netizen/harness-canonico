# Mapa do que falta (17/10/2026)

Base: auditoria de 14/10, registro de correções (N01–N37) e registro de decisões (DP).

## 1. Decisões ainda abertas ou a reconciliar

| Item | Situação | O que falta |
|---|---|---|
| DP-02 Topologia do cofre | **Decidido em 17/10: vault universal com pasta por módulo (DP-02a, DP-02b e DP-02c decididos; falta só implementar na W6).** Antes: nunca perguntada. Recomendação da auditoria: dois níveis (`vault/` por projeto e `ecossistema-vault` só na Central), confiança média | Decidido. Implementar na W6 (N26 junto) |
| DP-03 Aprovação | Decidido: só a frase no chat. A auditoria previa `UserPromptSubmit` com hash e HMAC; isso **não** será feito | Aceitar as duas regras de processo (resumo mais hash da SPEC colados no pedido; revisor reprova SPEC alterada depois da frase). W2 encolhe |
| DP-04 | Respondi "só o orquestrador escreve a SPEC, Codex revisa uma vez". A DP-04 original da auditoria era o "caminho curto C1" (pedido de 5 linhas sem o Codex na E0) | Confirmar que a decisão cobre o C1. Provavelmente sim |
| DP-05 | Respondi "teste primeiro só para lógica". A DP-05 original era a rubrica da Central (CC ≥ 2, com TDD quando exigido) | Confirmar se vale a regra mais simples ou a rubrica da Central |
| DP-01, 06, 07, 08, 09, 10, 11, 12, 13 | Decididas e registradas | — |

## 2. Estado das ondas da auditoria (W1–W9, ainda sem aprovação formal)

| Onda | Estado | Falta |
|---|---|---|
| W1 Base das travas | Quase pronta | Um despachante por evento (hoje há vários processos node por escrita); `alvosDeEscrita()` único; o `vault-guard` ainda tem parser próprio (N33) |
| W2 Aprovação | Reduzida pelo DP-03 | B02 (escopo por `Files:` e branch no `plano-guard`); guarda de `maestri ask`; regras de processo da SPEC |
| W3 Git e gates | Quase pronta | Biome (DP-09: `biome.jsonc`, script `lint`, `gates.lock`, selftest); conferir B08, B16, B22 e `eol-last` |
| W4 Agentes e saídas | Parcial | Vocabulário e formatos F1–F10; `validar-saida.mjs` e SubagentStop; hook de `Stop` com recibo (DP-11, N18); ponte Superpowers → persona; revisores sem ler um ao outro; `skills:` por agente |
| W5 Fluxo e documentos | Não começou | Aplicar a esteira E0–E13 em todos os arquivos (N19–N24); templates que faltam; classificação C0–C5; ajustar `frontend-specialist` (DP-05) e remover o Codex da E0 (DP-04); personas dos externos e do `devops-engineer` |
| W6 Memória e cofre | Não começou | DP-02 decidido (a, b, c); índice único, `memoria-check`, MCP por CLI (N26); `.gitignore` do cofre |
| W7 Distribuição e máquina nova | Parcial | `harness.json` com versão e sha256, `verificar` e `atualizar` (N28); `enabledPlugins` e `autoMemoryEnabled` (N36); `doctor` avisar grafo ausente ou velho (DP-08); RTK no doctor |
| W8 Multi-fornecedor | Não começou | Guardas e adaptadores para Codex, OpenCode e Antigravity (B23); skills em `.agents/skills/`; versões das CLIs fixadas; onboarding de confiança |
| W9 Aceitação | Não começou | Roteiro 11.4 em sessão real; perguntas por IA com resposta esperada |

## 3. Ações fora do kit (P0)

| Ação | Estado |
|---|---|
| Frete `deny` | Feito |
| Antigravity 19/10 | Decidido: deixar caducar |
| Backup do banco antes de qualquer mudança na Central | Lembrete permanente |
| `harness-canonico` virar git com remoto | **Gabriel sobe no GitHub dele depois (DP-20).** Até lá a única cópia está no Mac. Central (remoto, backup, 85 pendências): fora do escopo do harness |
| Rodar o inventário `modo-facil/00-inventario.md` | **Pendente, é seu** (Gabriel ainda não rodou; confirma Q21, hooks globais e plugins) |

## 4. Provas que ainda não existem

- **Provado em 18/10 no Claude Code 2.1.302 real** (ver `2026-10-18-prova-claude-code-real.md`): `onFailure`, `despacho-guard`, sessão principal sem escrever código, commit na `main`, rules/segredo/plano/escopo. Resta: plugins, modo interativo, e **sessão aberta fora da raiz fica sem travas (H4 confirmado)**.
- Roteiro 11.4 (10 testes, uns 15 minutos): itens 1, 2, 4, 6, 7, 8, 9 e 10 seguem valendo; o 3 (origem do `UserPromptSubmit`) e o 5 (sandbox) deixaram de decidir algo, pois DP-03 e DP-12 estão fechados.

## 5. Riscos aceitos (por decisão do Gabriel)

- Aprovação forjável: o agente pode citar a frase como se fosse do humano (N02, N04).
- Bash sem sandbox: guardado só por heurística (N05).
- Sem Playwright E2E: regressão em fluxo crítico só aparece se alguém olhar a tela.

## 6. Caminho até a execução

1. Responder DP-02 e reconciliar DP-04 e DP-05.
2. Adendo da SPEC com todas as decisões.
3. `writing-plans` por onda (W2 reduzida, W3 restante, W4, W5, W6, W7, W8), com a W9 como teste de aceitação.
4. Aprovação sua por onda, com a frase no chat.
5. Documento de migração de projeto que já tem harness (esboço existe em `docs/superpowers/specs/`).
