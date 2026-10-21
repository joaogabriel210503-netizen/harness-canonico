# gates-web: gates de lint do perfil web

Copie esta pasta para a raiz do projeto TypeScript e adapte. Tudo aqui foi executado e provado; nada é simulado.

## O que tem

| Arquivo | Função |
|---|---|
| `eslint.config.mjs` | Tier rápido (`npm run lint`). Teto de 350 linhas e de 160 colunas em todo arquivo de código, `noInlineConfig`, complexidade, profundidade, console proibido. |
| `eslint.typed.config.mjs` | Tier pesado (`npm run lint:typed`). 14 regras que precisam de tipos. |
| `eslint-rules/` | Plugin `quality/*` do vibe-coding-toolkit, copiado sem alteração, mais `verify.mjs`. |
| `selftest.mjs` | Prova que o gate reprova o que deve e que nenhuma forma conhecida de escapar do teto funciona. |
| `package-scripts.json` | Scripts e devDependencies para mesclar no `package.json`. |

## Instalação (projeto novo)

1. Copie `eslint.config.mjs`, `eslint.typed.config.mjs`, `eslint-rules/` e `selftest.mjs` para a raiz.
2. Mescle `package-scripts.json` no `package.json` e rode `npm install`.
3. Ajuste em `eslint.config.mjs`: **`SOURCE_DIRS`** (as pastas de código; só elas são checadas), o caminho do adaptador de log (bloco "Adaptador de log"), os `globals` do ambiente e a mensagem do `no-direct-console`.
4. Rode `npm run gates:verify` e `npm run gates:selftest`. Os dois precisam sair com zero.
5. Rode `npm run lint`, `npm run typecheck` e `npm run lint:typed`.
6. Um humano roda `node .githooks/travar-gates.mjs` e commita `.githooks/gates.lock.json`: é a impressão digital do que define os gates. O pre-commit (`npm run lint`, `gates.lock`, segredo) e o pre-push (`gates:selftest`, `typecheck`, `test`, `lint:typed`) vêm com o kit (`sh .githooks/instalar.sh`).

## Projeto que já existe

Rode `npx eslint . -f json`, conte as violações por regra e deixe em `warn` só as que têm violação, com a contagem no `estado.md`. Tire o `--max-warnings 0` do script `lint` até a primeira promoção. Cada regra sobe para `error` quando sua contagem chega a zero. As regras que o selftest cobre (teto de linhas e console) nunca ficam em `warn` em código novo: se há dívida antiga, ela vai para a lista `DIVIDA_APROVADA` do `eslint.config.mjs` (arquivo por arquivo, com motivo e data; nesses arquivos o teto e o console caem para `warn`), nunca para a severidade geral. A lista só diminui, e mudá-la pede `travar-gates`.

## Biome (regra do vibe-coding-toolkit, `docs/tools/06-eslint-biome-quality-gates.md`)

Decisão DP-09: vale o que o toolkit do Matheus Gomes diz. São dois linters com papéis diferentes e sem sobreposição:

- **ESLint** carrega a cobertura pesada: regras com informação de tipo (`typescript-eslint`), regras do framework e as nossas (teto de 350 linhas, console, complexidade). É o gate do harness.
- **Biome** roda um conjunto pequeno e escolhido de regras, com `"preset": "none"` (o campo `recommended` está descontinuado no Biome 2.5). Cada regra entra uma a uma, com o motivo num comentário ao lado dela no `biome.jsonc`. Não repetir no Biome o que o ESLint já cobre.
- **Formatador do Biome:** ligado desde o primeiro commit em projeto novo. Só se desliga, com o motivo escrito no próprio `biome.jsonc`, ao importar um código legado grande que nunca teve formatador (a Central é esse caso).
- **Versão fixa:** `npm install --save-dev --save-exact @biomejs/biome`.
- O `lint` rápido não carrega regra com informação de tipo; isso fica no `lint:typed`.

O teto de linhas não depende do Biome: é a regra nativa `max-lines` do ESLint.

**Implementado (W3, 19/10/2026).** O template traz `biome.jsonc.modelo` (11 regras, sem sobreposição com o ESLint; vira `biome.jsonc` na raiz do projeto — o sufixo `.modelo` existe só para o Biome não tratar a cópia dentro de `.agents/` como segunda config raiz), `sem-supressao.mjs` e o script `lint` = `biome check . && node sem-supressao.mjs && eslint . --max-warnings 0`. O `selftest.mjs` tem 11 casos do Biome (ok, `==`, `eval`, `.only`, `.skip`, `dangerouslySetInnerHTML`, `img` sem `alt`, `button` sem `type`, âncora inválida, formato e supressão).

**Brecha que o Biome abre, e como fecha.** O Biome não tem opção para proibir comentário de supressão, e `biome lint --suppress` escreve esse comentário sozinho. Por isso: (1) `sem-supressao.mjs` reprova a diretiva em qualquer arquivo de código e roda dentro do `lint` (pre-commit, qualquer CLI); (2) `biome.jsonc` e `sem-supressao.mjs` entram no `gates.lock` e na lista do `rules-guard`; (3) o `rules-guard` bloqueia `biome ... --suppress` e `--unsafe` por Bash (`biome check --write` segue liberado). Provado no Claude Code real em `docs/inventario/2026-10-18-prova-claude-code-real.md`.

**Projeto que já tem o harness:** copie `biome.jsonc.modelo` para a raiz do pacote **como `biome.jsonc`** e `sem-supressao.mjs` como está, mescle o script `lint` e o `devDependency` `@biomejs/biome` (versão exata) de `package-scripts.json`, rode `npm install`, e então o humano roda `node .githooks/travar-gates.mjs` e commita o `gates.lock.json`. Projeto legado sem formatador: desligue o formatador no `biome.jsonc` com o motivo escrito ao lado.

## Opcional: acesso a dados na camada de apresentação

O plugin traz `quality/no-direct-data-access`: proíbe importar o cliente de banco (módulos e bindings configurados) em arquivos de apresentação. Fica desligado por padrão porque depende da arquitetura. Para ligar, acrescente um bloco com `"quality/no-direct-data-access": ["error", { modules: ["@/lib/db"], bindings: ["db"], layers: ["src/components/", "src/app/"], extensions: [".tsx"] }]`, ajustando para o projeto. Arquivos de teste são ignorados pela regra.

## Limites conhecidos

- O teto de linhas e de colunas vale em todo o repositório. As demais regras só enxergam as pastas de `SOURCE_DIRS` (padrão `src`).
- `max-len` é regra de formatação que o ESLint marca como descontinuada, mas ela funciona na 9.x. Se uma versão futura a remover, troque por Biome ou por `@stylistic/eslint-plugin`, mantendo o selftest `ruim_linha_longa.ts` como prova.
- Arquivos `.vue`, `.svelte` e `.astro` não são lidos sem um parser próprio: o teto não os vê até alguém configurar o parser.
- `generated/` e as demais pastas de `globalIgnores` não são conferidas pelo lint; o rules-guard bloqueia edição manual de `generated/`.
- Os testes de tipos exigem `tsconfig.json` que inclua as mesmas pastas de `SOURCE_DIRS`.
- `gates:selftest` cria e apaga `<pasta>/__gates_selftest__/` em cada pasta de `SOURCE_DIRS` e `__gates_selftest_fora__/` na raiz; não rode com outro processo escrevendo no projeto.
