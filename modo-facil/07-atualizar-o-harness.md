# Atualizar o harness

| Situação | Parte |
|---|---|
| Mudei o kit (aqui no `harness-canonico`) e quero publicar | A |
| Quero levar a versão nova do kit para um projeto | B |
| Vou subir este repositório para o GitHub pela primeira vez | C |

## A. Publicar uma mudança no kit

Toda mudança no kit é feita em `~/development/harness-canonico`, de preferência pelo Claude Code. Antes de commitar, cole:

```text
Mudei o kit. Rode, nesta ordem, e me mostre as saídas: (1) node kit-claude-code/dot-claude/hooks/harness-manifesto.mjs gerar . (2) node kit-claude-code/dot-claude/hooks/selftest.mjs (3) git status --short. Se o selftest falhar, pare e me diga o que falhou. Não commite.
```

Com tudo verde:

1. Se a mudança altera o comportamento nos projetos (hooks, regras, gates, agentes, skills), suba a versão em `VERSAO` (por exemplo `1.0.0-rc.1` para `1.0.0-rc.2`) e rode o passo (1) de novo.
2. Commit, varredura de segredo e push (no Terminal, dentro de `~/development/harness-canonico`, ou peça ao Claude Code aberto lá):

```sh
git add -A
node .githooks/secret-scan.mjs --staged
git commit -m "kit: <o que mudou>"
git push
```

Este repositório é o kit, não um projeto com o harness: ele **não** usa os git hooks do harness (o lock dele é o modelo "só documentação" que vai para projetos novos, e o kit tem código `.mjs`, que esse lock barraria). Por isso a varredura de segredo antes do commit é manual, como acima. Com o gitleaks instalado, rode também `gitleaks detect --source . -v`.

## B. Levar a versão nova para um projeto

Um projeto por vez, com o trabalho do projeto já commitado. No terminal do Orquestrador do projeto, cole:

```text
Atualize o harness deste projeto. (1) git -C ~/development/harness-canonico pull --ff-only. (2) Confira que o git status do projeto está limpo; se não estiver, pare. (3) Crie a branch chore/harness-atualiza. (4) node .claude/hooks/harness-manifesto.mjs verificar . ~/development/harness-canonico e me mostre o que mudou. (5) node .claude/hooks/harness-manifesto.mjs atualizar ~/development/harness-canonico . e me mostre o plano, sem aplicar. Espere o meu ok.
```

Arquivos de regra (`AGENTS.md`, `.agents/`, `.claude/`) são protegidos. Antes do seu ok, libere a escrita neles: `! touch .claude/liberar-regras`.

Depois do seu ok ele aplica (o mesmo comando com `--aplicar`). O que o projeto não mexeu é atualizado. O que o projeto mexeu fica como está, e a versão nova do kit vai ao lado como `<arquivo>.kit-novo`. O caso típico é o `.claude/settings.json`, onde o Graphify acrescenta um hook. Cole:

```text
Para cada arquivo .kit-novo: mostre a diferença para o arquivo atual, proponha a mesclagem (mantendo o que o projeto acrescentou de propósito, como o hook do Graphify) e espere o meu ok antes de gravar. Depois remova o .kit-novo.
```

Por fim, nesta ordem (depois de cada linha com `!`, responda "pronto, continue"):

1. `node .claude/hooks/selftest.mjs`, sem falha.
2. Se mudou algo que define os gates (`eslint.config.mjs`, `biome.jsonc`, `sem-supressao.mjs`, `selftest.mjs`, `eslint-rules/` ou os scripts do `package.json`), **você** roda `! node .githooks/travar-gates.mjs`. Sem isso o `doctor` e o pre-commit reprovam, com razão.
3. `node .claude/hooks/doctor.mjs`, sem item grave.
4. Commit só da atualização: `chore(harness): atualiza para <versão>`.
5. Religue as travas: `! rm .claude/liberar-regras`. O merge é seu.

**Mesmo projeto numa máquina nova** (você clonou um projeto que já tem o harness): rode `sh .githooks/instalar.sh` no Terminal, dentro da pasta do projeto (o pre-commit não vem com o clone), abra o Claude Code na raiz, aprove os servidores do `.mcp.json` e desligue o Playwright pelo `/mcp`. O resto vem no git.

## C. Subir para o GitHub pela primeira vez

Uma vez só. No Claude Code aberto em `~/development/harness-canonico`, cole:

```text
Prepare a primeira subida deste repositório para o meu GitHub, como privado. (1) git init -b main; se existir a pasta maestri/_to_delete, acrescente a linha maestri/_to_delete/ em .git/info/exclude. (2) git add -A e mostre o git status --short; confira que não entra nada de maestri/_to_delete, node_modules, .DS_Store nem .env. (3) node .githooks/secret-scan.mjs --staged e, se o gitleaks existir, gitleaks detect --source . -v; se achar algo, pare e me mostre. (4) git commit -m "harness canônico 1.0.0-rc.1". (5) Mostre o comando gh repo create e espere o meu ok antes de rodar.
```

O comando final é:

```sh
gh repo create harness-canonico --private --source . --push
```

Use exatamente o nome `harness-canonico`: os guias e o `BOOTSTRAP.md` clonam com `gh repo clone harness-canonico`, que procura esse nome na conta em que o `gh` está logado.
