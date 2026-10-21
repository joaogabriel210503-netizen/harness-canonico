# Plano W5: Fluxo e documentos

- **Data:** 20 de outubro de 2026. **SPEC:** adendo v1 (sha256 `3d8a3f0fbe93`), seções 4 e 12. **Aprovação:** autorização contínua do Gabriel de 20/10/2026 00:08.
- **Execução:** três frentes em paralelo (A, B, C), sem arquivo em comum, mais uma conferência final minha.

### T01 Fluxo, constituição e regras (frente A)
- **Files:** `.agents/fluxo.md`, `AGENTS.md`, `README.md`, `.agents/rules/ondas.md`, `.agents/rules/reparo.md`, `.agents/rules/memoria.md`, `.agents/memory/INSTRUCTIONS.md`, `.agents/templates/estado.md`
- **Resources:** nenhum
- **Verificação:** nenhuma ocorrência de "E0–E10"; mesmos nomes de etapa e de frase em todos.

### T02 Personas, adaptadores, Maestri v3 (frente B)
- **Files:** `.agents/personas/devops-engineer.md`, `.agents/personas/tech-lead.md`, `.agents/personas/orquestrador.md`, `.agents/personas/frontend-specialist.md`, `.agents/adaptadores.md`, `.agents/templates/ordem.md`, `maestri/papeis.md`, `maestri/notas/*`, `kit-claude-code/dot-claude/agents/devops-engineer.md`
- **Resources:** selftest dos hooks (confere os adaptadores)
- **Verificação:** selftest com zero falhas; nenhuma ocorrência de "Orquestrador (Codex)", "revisor 2", "Grok".

### T03 Templates novos e rotina (frente C)
- **Files:** `.agents/templates/modelo-spec.md`, `.agents/templates/revisao-spec.md`, `.agents/templates/revisao-final.md`, `.agents/templates/deploy.md`, `.agents/templates/definicao.md`, `modo-facil/04-rotina-de-uma-demanda.md`, `docs/superpowers/specs/2026-10-14-esteira-e0-e13-design.md`
- **Resources:** nenhum
- **Verificação:** os templates usam os campos de `.agents/rules/formatos.md`.

### T04 Conferência final (eu)
- **Files:** os de T01 a T03, sem criar novos
- **Resources:** nenhum
- **Verificação:** critério 6 do adendo: busca no kit sem resto do fluxo antigo ("E0–E10", "Orquestrador (Codex)", Antigravity como revisor, memória em "E10").
