# Plano W7: Distribuição

- **Data:** 20 de outubro de 2026. **SPEC:** adendo v1 (sha256 `3d8a3f0fbe93`), seção 12 (W7). **Aprovação:** autorização contínua do Gabriel de 20/10/2026 00:08.
- **Desenho:** o kit tem `VERSAO` e `harness.json` (sha256 de cada arquivo que o instalador copia). O projeto instalado guarda o seu `harness.json` com a versão e a "base" (o hash que o kit tinha quando o arquivo entrou). Arquivo que o projeto personaliza (`AGENTS.md`, `stack.md`, memória, `.mcp.json`, `docs/`) nunca é atualizado. Arquivo do kit que o projeto mudou nunca é sobrescrito: vira `<arquivo>.kit-novo` e conflito.

### T01 Manifesto, verificar e atualizar
- **Files:** `kit-claude-code/dot-claude/hooks/harness-manifesto.mjs`, `VERSAO`, `harness.json`
- **Resources:** `instalar-no-projeto.sh` (o mapeamento de pastas é o mesmo)
- **Verificação:** `gerar` é determinístico; `registrar` grava versão e base; `verificar` aponta ausente e modificado (hook modificado é grave); `atualizar` mostra o plano sem `--aplicar`, atualiza só o que o projeto não mexeu e lista conflitos (saída 2).

### T02 Instalador registra
- **Files:** `instalar-no-projeto.sh`
- **Resources:** T01
- **Verificação:** depois de instalar, `harness.json` existe no projeto; repetir a instalação é seguro e atualiza o registro.

### T03 Doctor ampliado
- **Files:** `kit-claude-code/dot-claude/hooks/doctor.mjs`
- **Resources:** T01
- **Verificação:** avisa grafo ausente ou velho, `gitleaks` ausente, plugins de que o fluxo depende (Superpowers) desligados e `autoMemoryEnabled` ligado; reprova hook do harness modificado em relação ao registro.

### T04 Selftest, prova e documentos
- **Files:** `kit-claude-code/dot-claude/hooks/selftest-casos-7.mjs`, `kit-claude-code/dot-claude/hooks/selftest.mjs`, `kit-claude-code/dot-claude/hooks/selftest-casos-3.mjs`, `kit-claude-code/dot-claude/README.md`, `README.md`, `docs/inventario/2026-10-18-prova-claude-code-real.md`, `docs/fluxo/harness-v1/estado.md`
- **Resources:** T01 a T03
- **Verificação:** selftest com zero falhas; instalação, verificar e atualizar rodados de verdade em projeto descartável.
