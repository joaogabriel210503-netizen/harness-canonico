# Plano W9: Aceitação

- **Data:** 20 de outubro de 2026. **SPEC:** adendo v1 (sha256 `3d8a3f0fbe93`), seção 13 (DP-31). **Aprovação:** autorização contínua do Gabriel de 20/10/2026 00:08.

### T01 Instalar num projeto descartável e rodar os gates
- **Files:** `docs/inventario/2026-10-20-aceitacao-w9.md`
- **Resources:** instalador, `npm install`, `selftest`, `gates:selftest`, `doctor`
- **Verificação:** critérios 1 e 2 com a saída real; defeitos achados são corrigidos e registrados.

### T02 Perguntas de papel e casos de avaliação com o Claude Code real
- **Files:** `docs/inventario/2026-10-20-aceitacao-w9.md`
- **Resources:** projeto instalado com demanda em andamento
- **Verificação:** critérios 4 e 5 (Claude Code); o que não rodou fica escrito como "não rodado".

### T03 Busca de resto do fluxo antigo
- **Files:** `docs/inventario/2026-10-20-aceitacao-w9.md`
- **Resources:** nenhum
- **Verificação:** critério 6.

### T04 Documento de migração
- **Files:** `modo-facil/05-migrar-projeto-que-ja-tem-harness.md`, `docs/superpowers/specs/2026-10-14-migracao-harness-existente-esboco.md`
- **Resources:** nenhum
- **Verificação:** passos conferem com o instalador, o `verificar` e o `atualizar` que existem.
