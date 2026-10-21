# Plano W1: Base das travas

- **Data:** 20 de outubro de 2026
- **SPEC:** `docs/superpowers/specs/2026-10-19-adendo-harness-v1.md` (aprovada, sha256 `3d8a3f0fbe93`), seção 12 (W1).
- **Aprovação:** o Gabriel liberou a execução contínua das ondas restantes em 20/10/2026 00:08 ("Agora faça sem precisar parar... Plano aprovado."). Esta onda foi executada sob essa autorização; ele só é chamado para decisão humana.

## Objetivo

Uma base única para as travas, sem mudar o que cada uma proíbe, e fechar a brecha de escrita por Bash no escopo.

## Tarefas

- **T01 `principal()` e `checar()`:** cada guarda exporta `checar(event)` e continua rodando sozinha. Files: `hook-io.mjs`, as sete `*-guard.mjs`.
- **T02 Despachante:** `despachante.mjs` (um processo, tabela `GUARDAS`, primeira que bloquear encerra); `settings.json` com um registro de `PreToolUse`. Files: `despachante.mjs`, `settings.json`.
- **T03 `alvosDeEscrita()` único:** na `guard-lib.mjs`; o `rules-guard` e o `escopo-guard` (agora também Bash) consomem a mesma lista. `chmod` lê o modo, `sed -i` lê o programa. Files: `guard-lib.mjs`, `escopo-guard.mjs`.
- **T04 `vault-guard` no parser compartilhado (N33):** lê `sh -c`, `eval`, `$(...)`. Files: `vault-guard.mjs`.
- **T05 Dividir o selftest (350 linhas):** `selftest.mjs` + `selftest-lib.mjs` + `selftest-casos-1..4.mjs`; `PROTEGIDOS` cobre `selftest-*.mjs`; o registro em `settings.json` é conferido contra a tabela do despachante. Files: `selftest*.mjs`, `guard-lib.mjs`.
- **T06 Prova real e documentação:** Claude Code real (4 casos), README dos hooks, registro da prova.

## Verificação

Selftest dos hooks e do git com zero falhas (348+ casos OK); todos os arquivos ≤ 350 linhas; 4 casos reais no Claude Code.
