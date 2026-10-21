# Plano W3: Biome nos gates

- **Data:** 19 de outubro de 2026
- **SPEC:** `docs/superpowers/specs/2026-10-19-adendo-harness-v1.md` (aprovada em 19/10, sha256 `3d8a3f0fbe93`), seções 7 e 12; decisão DP-09.
- **Situação:** aguarda aprovação do Gabriel.
- **Quem executa:** a sessão do Claude que mantém o kit (o kit não roda o próprio harness; as provas são os selftests e o Claude Code real em projeto descartável).

## Objetivo

Fazer o Biome valer como gate curado, como manda o toolkit, sem abrir brecha nova. Hoje o template não tem `biome.jsonc` nem roda o Biome. O `gates.lock`, o `rules-guard` e o bloqueio do texto `biome-ignore` já cobrem `biome.json*` (feito antes).

## O que foi verificado antes de planejar (19/10)

- Biome 2.5.15 é a versão estável atual (npm, publicada em 30/09/2026).
- Testado em projeto descartável: **um comentário `// biome-ignore …` cala a regra** e o Biome não tem opção para proibir supressão. Pior: `biome lint --write --suppress` escreve esses comentários sozinho. Hoje só o `rules-guard` barra o texto, e só no Claude Code. **Sem trava nova, o Biome seria brecha.**
- O ESLint do template já liga `js.configs.recommended`, `tseslint.configs.strict` (inclui `no-explicit-any`, `ban-ts-comment`, `no-unused-vars`) e o tier tipado. O Biome não pode repetir nada disso.

## Decisões de execução (dentro do que a SPEC já decidiu)

1. **Regras do Biome candidatas** (cada uma com o motivo no `biome.jsonc`; a lista final sai da conferência da T01 sem sobreposição):
   - `suspicious/noFocusedTests` e `suspicious/noSkippedTests`: `.only` e `.skip` hoje só são barrados pelo `rules-guard` no Claude Code; aqui viram gate para qualquer CLI.
   - `suspicious/noDoubleEquals`: o ESLint não liga `eqeqeq`.
   - `security/noGlobalEval` e `security/noDangerouslySetInnerHtml`: o ESLint não liga `no-eval` nem regra de HTML cru.
   - `a11y/useAltText`, `a11y/useButtonType`, `a11y/useValidAnchor`: acessibilidade básica de tela, que o ESLint do template não cobre.
2. **Formatador ligado** em projeto novo (`biome check` confere formatação); desligado só em legado grande, com motivo escrito no arquivo (README do template explica).
3. **Trava de supressão:** um script `sem-supressao.mjs` no template reprova qualquer `biome-ignore` (inclusive `-all`, `-start`, `-end`) em arquivo de código, roda dentro do script `lint` (portanto no pre-commit, para qualquer CLI) e fica protegido pelo `gates.lock` e pelo `rules-guard`.
4. **Bash:** o `rules-guard` passa a bloquear `biome … --suppress` e `biome … --write --unsafe` vindos do agente.
5. **Versão fixa:** `@biomejs/biome` `2.5.15`, sem `^`.

## Tarefas

### T01 Configuração curada do Biome
- **Files:** `.agents/templates/gates-web/biome.jsonc`
- **Resources:** projeto descartável em `/tmp/claude-0/w3proj`
- **Depends-on:** none
- **Verificação:** `npx biome check` passa em código limpo; cada regra listada dispara no seu caso ruim; `eslint --print-config` mostra que nenhuma regra do Biome tem equivalente ligado no ESLint.

### T02 Script de proibição de supressão
- **Files:** `.agents/templates/gates-web/sem-supressao.mjs`
- **Resources:** o mesmo projeto descartável
- **Depends-on:** none
- **Verificação:** sai 1 com `biome-ignore`, `biome-ignore-all` e `biome-ignore-start` em `.ts/.tsx/.js/.mjs/.cjs`; sai 0 em código limpo e quando a palavra aparece só em `.md`; ignora as mesmas pastas do `globalIgnores` do ESLint; até 350 linhas.

### T03 Scripts e dependência
- **Files:** `.agents/templates/gates-web/package-scripts.json`
- **Depends-on:** T01, T02
- **Verificação:** `lint` = `biome check . && node sem-supressao.mjs && eslint . --max-warnings 0`; `@biomejs/biome` em `2.5.15` exato; `npm run lint` passa no projeto descartável limpo.

### T04 Proteção: `gates.lock` e `rules-guard`
- **Files:** `.githooks/gates-lib.mjs`, `kit-claude-code/dot-claude/hooks/guard-lib.mjs`, `kit-claude-code/dot-claude/hooks/rules-guard.mjs`
- **Depends-on:** T02
- **Verificação:** `sem-supressao.mjs` entra no `CONFIG` do lock e em `PROTEGIDOS`; Bash com `biome … --suppress` ou `--unsafe` bloqueado; selftest dos hooks continua todo OK.

### T05 Provas automáticas
- **Files:** `.agents/templates/gates-web/selftest.mjs`, `kit-claude-code/dot-claude/hooks/selftest.mjs`, `kit-claude-code/dot-claude/hooks/selftest-git.mjs`
- **Depends-on:** T01, T02, T03, T04
- **Verificação:** novos casos: regra do Biome reprova; formatação errada reprova; `biome-ignore` reprova pelo `sem-supressao`; `biome.jsonc` alterado reprova pelo `gates.lock`; Write em `biome.jsonc` e em `sem-supressao.mjs` bloqueado; Bash com `--suppress` bloqueado. `gates:selftest`, `selftest.mjs` e `selftest-git.mjs` saem com zero. Todos os arquivos dentro de 350 linhas.

### T06 Documentação
- **Files:** `.agents/templates/gates-web/README.md`, `.agents/rules/gates.md`, `.agents/stack.md`, `.agents/origem.md`, `kit-claude-code/dot-claude/README.md`, `docs/inventario/2026-10-14-registro-correcoes-canonico.md`
- **Depends-on:** T05
- **Verificação:** o README do template tira "pendente de implementação" e explica legado (formatador desligado com motivo); `gates.md` cita o Biome e a proibição de supressão; `origem.md` com sha256 dos arquivos novos; N32 passa a **Corrigido**.

### T07 Prova no Claude Code real
- **Files:** `docs/inventario/2026-10-18-prova-claude-code-real.md` (seção nova)
- **Resources:** Claude Code real no ambiente em nuvem, projeto descartável com o kit
- **Depends-on:** T05
- **Verificação:** Write com `biome-ignore` bloqueado; `npx biome lint --write --suppress` bloqueado; commit com `biome-ignore` (feito fora do Claude Code) reprovado pelo pre-commit; controle positivo: commit limpo passa.

## Waves

| Wave | Tarefas | Por que juntas |
|---|---|---|
| 1 | T01, T02 | Sem dependência e sem arquivo em comum |
| 2 | T03, T04 | Dependem da wave 1; arquivos disjuntos |
| 3 | T05 | Prova tudo o que veio antes |
| 4 | T06, T07 | Dependem da T05; arquivos disjuntos |

## Depois da W3, do lado do Gabriel

Projetos que já têm o harness instalado: copiar `biome.jsonc` e `sem-supressao.mjs`, atualizar o script `lint`, rodar `npm install` e depois **você** roda `node .githooks/travar-gates.mjs` e commita o `gates.lock.json`. Projeto legado grande: formatador desligado com o motivo escrito no `biome.jsonc`.

## Riscos

- A versão 2.5.15 pode ter mudado o nome de alguma regra listada; a T01 confere no projeto descartável e troca pela equivalente, anotando.
- Formatador ligado reprova arquivo mal formatado no pre-commit; em projeto novo é o esperado; em legado vale a exceção documentada.
- `sem-supressao.mjs` procura texto: um `biome-ignore` dentro de uma string também reprova. Aceitável; o selftest registra o comportamento.

## Consultas feitas

- **Documentos:** toolkit `docs/tools/06-eslint-biome-quality-gates.md` (commit `de66fe3`), `gates-web/README.md`, `eslint.config.mjs`, `eslint.typed.config.mjs`, `selftest.mjs`, `.githooks/gates-lib.mjs`, `guard-lib.mjs`, `rules-guard.mjs`.
- **Teste prático:** Biome 2.5.15 instalado em projeto descartável; supressão por comentário confirmada.
- **Context7:** não usado; a fonte foi o próprio pacote instalado e a documentação do toolkit. A T01 confere os nomes das regras no `configuration_schema.json` da versão instalada.
- **Vault e grafo:** não se aplicam (DP-24; o harness está fora do grafo).
