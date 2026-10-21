# Plano W8: Multi-fornecedor

- **Data:** 20 de outubro de 2026. **SPEC:** adendo v1 (sha256 `3d8a3f0fbe93`), seções 3, 6 e 12 (W8). **Aprovação:** autorização contínua do Gabriel de 20/10/2026 00:08.
- **Desenho:** uma guarda única (`guarda-externa.mjs`) traduz o evento do Codex e do OpenCode para o formato do Claude Code e reaproveita vault, regras e segredo, mais o escopo do papel e a proibição de mexer no git. O Antigravity não tem hook confirmado: vale a regra escrita (`.agents/rules/agentes-externos.md`) e a conferência do orquestrador.

### T01 Guarda das CLIs externas
- **Files:** `kit-claude-code/dot-claude/hooks/guarda-externa.mjs`
- **Resources:** `rules-guard.mjs`, `vault-guard.mjs`, `segredo-guard.mjs`, `guard-lib.mjs`
- **Verificação:** Codex/tech-lead escreve só em `docs/definicao/` e `docs/fluxo/`; OpenCode/devops-engineer só `docs/fluxo/` e configuração de entrega; git que muda a árvore, vault direto, frase de aprovação, segredo e escrita no `_comum` bloqueados; entrada ilegível bloqueia.

### T02 Adaptadores do Codex
- **Files:** `kit-codex/dot-codex/config.toml`, `kit-codex/dot-codex/hooks.json`, `kit-codex/dot-codex/agents/code-reviewer.toml`, `kit-codex/dot-codex/agents/security-reviewer.toml`, `kit-codex/dot-codex/rules/harness.rules`
- **Resources:** T01; Codex 0.163.0 (instalado no ambiente de prova)
- **Verificação:** `codex execpolicy check` aplica as regras; `codex doctor` carrega a configuração e os dois servidores MCP; subagentes de revisão em somente leitura, nível Forte.

### T03 Adaptadores do OpenCode e versões
- **Files:** `kit-opencode/dot-opencode/plugin/harness-guard.ts`, `kit-opencode/opencode.json`, `.agents/versoes.json`
- **Resources:** T01; OpenCode 1.19.3
- **Verificação:** `opencode debug config` mostra a permissão e o plugin carregados; o plugin chamado com eventos simulados bloqueia e libera como esperado.

### T04 Regra escrita, vault do Codex, instalador, doctor
- **Files:** `.agents/rules/agentes-externos.md`, `kit-claude-code/dot-claude/hooks/vault-config.mjs`, `instalar-no-projeto.sh`, `kit-claude-code/dot-claude/hooks/harness-manifesto.mjs`, `kit-claude-code/dot-claude/hooks/doctor.mjs`, `.agents/templates/revisao-final.md`
- **Resources:** T01 a T03
- **Verificação:** o `_comum` no Codex só com `search_notes_tool` e `read_note_tool` (`enabled_tools`); o instalador copia `.codex/` e `.opencode/`; o doctor compara a versão instalada com a testada.

### T05 Selftest, prova e documentos
- **Files:** `kit-claude-code/dot-claude/hooks/selftest-casos-8.mjs`, `kit-claude-code/dot-claude/hooks/selftest.mjs`, `kit-claude-code/dot-claude/hooks/selftest-casos-3.mjs`, `.agents/adaptadores.md`, `kit-claude-code/dot-claude/README.md`, `README.md`, `docs/inventario/2026-10-18-prova-claude-code-real.md`, `docs/fluxo/harness-v1/estado.md`
- **Resources:** T01 a T04
- **Verificação:** selftest com zero falhas; o que foi provado com a CLI real e o que não foi, escrito sem arredondar.
