# Plano W6: Memória e vault

- **Data:** 20 de outubro de 2026. **SPEC:** adendo v1 (sha256 `3d8a3f0fbe93`), seção 8 (DP-02, 02a-c, 23). **Aprovação:** autorização contínua do Gabriel de 20/10/2026 00:08.
- **Desenho:** a configuração do modo fica em `.claude/vault.json` (ausente = modo local). No modo universal, o vault mora fora do projeto, na pasta da variável de ambiente `HARNESS_VAULT_CENTRAL` (DP-02c): uma pasta por módulo e `_comum/`.

### T01 Biblioteca e gerador de configuração do vault
- **Files:** `kit-claude-code/dot-claude/hooks/vault-lib.mjs`, `kit-claude-code/dot-claude/hooks/vault-config.mjs`
- **Resources:** `kit-claude-code/dot-mcp.json` (base dos servidores)
- **Verificação:** `vault-config.mjs mcp <modulo>` gera `harness-vault` com raiz `${HARNESS_VAULT_CENTRAL}/<modulo>` e `harness-vault-comum` com raiz `_comum`; `json local|universal` gera o `vault.json`.

### T02 vault-guard por pasta e comum só de leitura
- **Files:** `kit-claude-code/dot-claude/hooks/vault-guard.mjs`, `kit-claude-code/dot-claude/hooks/despachante.mjs`, `kit-claude-code/dot-claude/settings.json`
- **Resources:** T01
- **Verificação:** no modo universal, caminho dentro da raiz central é bloqueado em Read, Grep, Glob, escrita e Bash; ferramenta de escrita do `harness-vault-comum` e qualquer `harness-vault-<outro>` são bloqueadas; o modo local segue igual (selftest antigo intacto).

### T03 Instalador pergunta o modo
- **Files:** `instalar-no-projeto.sh`
- **Resources:** T01
- **Verificação:** `--modo universal --modulo <nome>` não copia `vault/`, grava `vault.json` e `.mcp.json` do modo universal, cria as pastas do módulo e `_comum` se a variável existir; sem flag e sem terminal, assume local; repetir é seguro.

### T04 Frescor de memória e `memoria-check`
- **Files:** `kit-claude-code/dot-claude/hooks/memoria-check.mjs`, `kit-claude-code/dot-claude/hooks/doctor.mjs`, `.agents/rules/memoria.md`
- **Resources:** `.agents/memory/INSTRUCTIONS.md`
- **Verificação:** teto de 130 linhas, link do índice existente, frontmatter e os quatro campos de frescor; data velha (mais de 90 dias) vira aviso; o `doctor` roda a conferência e confere o vault do modo.

### T05 Selftest, prova real e documentos
- **Files:** `kit-claude-code/dot-claude/hooks/selftest-casos-6.mjs`, `kit-claude-code/dot-claude/hooks/selftest.mjs`, `kit-claude-code/dot-claude/README.md`, `docs/inventario/2026-10-18-prova-claude-code-real.md`, `docs/fluxo/harness-v1/estado.md`, `README.md`
- **Resources:** T01 a T04
- **Verificação:** selftest com zero falhas; prova no Claude Code real do bloqueio por pasta; instalação em dois projetos de teste (local e universal).
