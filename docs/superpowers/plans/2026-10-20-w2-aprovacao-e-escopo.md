# Plano W2: Aprovação e escopo

- **Data:** 20 de outubro de 2026. **SPEC:** adendo v1 (sha256 `3d8a3f0fbe93`), seções 4.2 e 12.
- **Aprovação:** autorização contínua do Gabriel de 20/10/2026 00:08.

### T01 `plano-guard` com hash
- **Files:** `kit-claude-code/dot-claude/hooks/plano-guard.mjs`
- **Resources:** nenhum
- **Verificação:** a linha de aprovação tem 5ª coluna (12 caracteres do sha256); SPEC ou plano alterados depois reprovam; sem hash reprova.

### T02 `Files:` e `Resources:` no plano
- **Files:** `kit-claude-code/dot-claude/hooks/plano-guard.mjs`, `.agents/rules/ondas.md`
- **Resources:** nenhum
- **Verificação:** plano sem tarefa, sem `Files:` (caminhos entre crases) ou sem `Resources:` não libera; edição fora de qualquer `Files:` é bloqueada; pasta e glob casam.

### T03 Guarda da frase de aprovação
- **Files:** `kit-claude-code/dot-claude/hooks/rules-guard.mjs`, `hooks/despachante.mjs`, `settings.json`
- **Resources:** nenhum
- **Verificação:** `maestri ask` e `SendMessage` com "Aprovo a SPEC." / "Aprovo o plano." bloqueados; mensagens comuns passam.

### T04 Templates, personas e constituição
- **Files:** `AGENTS.md`, `.agents/fluxo.md`, `.agents/templates/estado.md`, `.agents/personas/code-reviewer.md`, `.agents/personas/security-reviewer.md`
- **Resources:** nenhum
- **Verificação:** o hash aparece na regra 2 do AGENTS.md, no template do estado e como passo 0 dos revisores.

### T05 Prova
- **Files:** `selftest-casos-2.mjs`, `selftest-casos-4.mjs`, `docs/inventario/2026-10-18-prova-claude-code-real.md`
- **Resources:** Claude Code real em projeto descartável
- **Verificação:** selftest com zero falhas; quatro casos reais.
