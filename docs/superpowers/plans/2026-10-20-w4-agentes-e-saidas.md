# Plano W4: Agentes e saídas

- **Data:** 20 de outubro de 2026. **SPEC:** adendo v1 (sha256 `3d8a3f0fbe93`), seções 5, 9 e 12. **Aprovação:** autorização contínua do Gabriel de 20/10/2026 00:08.

### T01 Biblioteca e conferidor
- **Files:** `kit-claude-code/dot-claude/hooks/formatos-lib.mjs`, `kit-claude-code/dot-claude/hooks/validar-saida.mjs`
- **Resources:** nenhum
- **Verificação:** F1, F2, F3, F4, F5, F6, F8, F9, F10 com casos que passam e casos que reprovam no selftest.

### T02 SubagentStop (`relato-guard`)
- **Files:** `kit-claude-code/dot-claude/hooks/relato-guard.mjs`, `kit-claude-code/dot-claude/settings.json`
- **Resources:** Claude Code real em projeto descartável
- **Verificação:** subagente com relato ruim é barrado, recebe a lista e refaz; segunda tentativa libera; falha aberta.

### T03 Stop com recibo (`recibo-guard`, `recibo-gates`)
- **Files:** `kit-claude-code/dot-claude/hooks/recibo-guard.mjs`, `kit-claude-code/dot-claude/hooks/recibo-gates.mjs`
- **Resources:** nenhum
- **Verificação:** sem recibo na E8 barra; com recibo válido libera; código mudado depois barra; gate falho barra.

### T04 Regras, personas, templates, mapa de modelos
- **Files:** `.agents/rules/formatos.md`, `.agents/personas/*.md`, `.agents/templates/handoff.md`, `.agents/templates/revisao-wave.md`, `.agents/adaptadores.md`
- **Resources:** nenhum
- **Verificação:** cada persona implementadora aponta F3, cada revisora F4; handoff com os campos do F7; mapa Leve/Médio/Forte para as quatro CLIs.

### T05 Prova
- **Files:** `kit-claude-code/dot-claude/hooks/selftest-casos-5.mjs`, `docs/inventario/2026-10-18-prova-claude-code-real.md`
- **Resources:** nenhum
- **Verificação:** selftest com zero falhas; três casos reais.

### Fora desta onda
`skills:` por agente (aguarda a lista do Gabriel, DP-17); `UserPromptSubmit` e `PostToolUse` (não adotados, DP-03b).
