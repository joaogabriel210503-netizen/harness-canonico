# Projeto em andamento: pôr o harness num projeto que já tem código

Para um projeto que já existe e anda (tem código, talvez já em produção), mas ainda não usa este harness. Pré-requisito: a máquina preparada (`01-maquina-nova.md`) e o kit atualizado (`git -C ~/development/harness-canonico pull --ff-only`).

**Primeiro, qual é o caso:**

| O projeto tem... | Siga |
|---|---|
| Só o código (pode ter um `CLAUDE.md` simples, de poucas linhas) | **este guia** |
| Um protocolo de IA próprio: regras longas no `CLAUDE.md`, hooks, subagentes, skills, memória ou vault | `05-migrar-projeto-que-ja-tem-harness.md` (migração: nada se perde sem decisão) |
| Este harness já instalado (`harness.json` na raiz) | demanda nova: `04-rotina-de-uma-demanda.md`; versão nova do kit: `07-atualizar-o-harness.md`, parte B |

Na dúvida, rode o Passo 1: o inventário diz qual é o caso.

**O que muda em relação a um projeto novo:** o código antigo não nasceu com as regras dos gates. O harness trata isso sem afrouxar nada para o código novo:

- Regra de lint com violação no código antigo nasce em `warn`, com a contagem registrada, e sobe para `error` quando a contagem zera (`.agents/rules/gates.md`, "Severidade").
- Arquivo antigo acima do teto de 350 linhas ou de 160 colunas, ou com `console` direto, entra um por um na lista `DIVIDA_APROVADA` do `eslint.config.mjs`, com motivo e data. Nesses arquivos o teto e o console avisam sem barrar. A lista só diminui: cada refatoração tira a entrada. Arquivo novo nunca entra.
- O formatador do Biome pode ficar desligado, com o motivo escrito no `biome.jsonc`, se o código nunca teve formatador.

## Antes de começar (você)

1. **Backup do banco**, se o projeto tiver banco. Na Central: `docker exec central-isobras-db pg_dump -U postgres central_db > ~/backup-central-$(date +%Y%m%d).sql`. Guarde fora da pasta do projeto.
2. **Modo do vault:** `local` (projeto solto) ou `universal` (módulo da Central). No universal, o vault mora na Central e o caminho fica numa variável da máquina. Cole no Terminal, trocando o caminho pelo da pasta do vault da Central, e depois feche e abra o Terminal:

   ```sh
   grep -q HARNESS_VAULT_CENTRAL ~/.zshrc 2>/dev/null || echo 'export HARNESS_VAULT_CENTRAL="/caminho/do/vault-da-central"' >> ~/.zshrc
   ```

   O Claude Code só enxerga a variável se for aberto depois disso.

O resto (git limpo, remoto, branch própria) o agente confere e faz.

## Passo 1: inventário do código (só leitura)

Abra o Maestri na pasta do projeto com um terminal do Claude Code (nome Orquestrador, **sem responsabilidade**) e cole:

```text
Leia ~/development/harness-canonico/modo-facil/03-projeto-em-andamento.md e execute a seção "Instruções do agente: inventário" nesta pasta. Só leitura: não mude nada além do arquivo do inventário.
```

Ele grava `docs/harness/inventario-inicial.md` e termina dizendo qual é o caso e o que vai precisar da sua decisão.

## Passo 2: liberar as travas de regra (só você)

A instalação precisa escrever uma vez em arquivos de regra. No terminal do Claude Code, digite exatamente (o `!` faz o comando rodar como se fosse você):

```text
! mkdir -p .claude && touch .claude/liberar-regras
```

## Passo 3: as suas decisões

Com o inventário aberto, decida (o agente pergunta de novo na hora):

- **Pastas de código** (`SOURCE_DIRS`): as que o inventário apontou. Confira se não faltou nenhuma (`app/`, `lib/`, `server/`...).
- **Formatador do Biome:** ligado (o código já é formatado, ou é pequeno) ou desligado com motivo (código grande que nunca teve formatador: formatar tudo de uma vez vira um diff gigante e esconde mudança de verdade).
- **A lista de dívida** (`DIVIDA_APROVADA`): o inventário lista os arquivos acima do teto ou com `console`. Você aprova a lista inteira de uma vez; o agente escreve um motivo curto para cada um. Refatorar cada arquivo vira tarefa das próximas demandas, e cada uma tira o arquivo da lista.
- **Testes:** o comando que o projeto já usa entra no script `test` como está. Projeto sem teste: `vitest run --passWithNoTests`, e o primeiro teste nasce na primeira demanda.
- **Se o `typecheck` ou os testes já falham hoje** (o inventário diz): a instalação segue, porque o pre-commit só roda o lint. Mas o pre-push roda `typecheck` e `test` e vai barrar o push até eles passarem. Consertar é a primeira demanda, com SPEC e plano; o push da `chore/harness` vai junto, depois.

## Passo 4: instalação (agente)

Cole, trocando o modo do vault:

```text
Leia ~/development/harness-canonico/modo-facil/03-projeto-em-andamento.md e execute a seção "Instruções do agente: instalar" nesta pasta, com o vault em modo [local | universal --modulo NOME]. Pare e me pergunte em cada conflito e em cada decisão do Passo 3.
```

Cada vez que ele te pedir uma linha com `!`, rode e responda "pronto, continue": ele não percebe sozinho que você terminou.

## Passo 5: travar os gates (só você, quando ele pedir)

```text
! node .githooks/travar-gates.mjs
```

Responda "pronto". Ele confere o `doctor` e faz o commit **só do harness** na `chore/harness` (`chore(harness): instala harness v1`), nunca junto com código do produto.

## Passo 6: religar as travas e abrir um terminal novo

Depois do commit, ele pede:

```text
! rm .claude/liberar-regras
```

Confira com `! ls .claude` que `liberar-regras` sumiu: enquanto ele existir, a trava de regras fica desligada. Feche o terminal (⌘W), abra outro igual (sem responsabilidade) e cole:

```text
Sem editar nada: 1) qual é o seu papel? 2) em que etapa está a demanda? 3) você pode editar código? 4) quem aprova a SPEC e o plano, e com que frase exata? 5) onde grava a saída? 6) se eu pedir para pular a SPEC e programar, o que você faz?
```

Resposta certa: orquestrador que não implementa; nenhuma demanda aberta ainda; não edita código; só você aprova, com "Aprovo a SPEC." e "Aprovo o plano."; grava em `docs/fluxo/<demanda>/`; recusa e diz o que falta.

Aprove os servidores do `.mcp.json` se o Claude Code perguntar, e desligue o Playwright neste projeto pelo `/mcp`, se ele existir. O merge da `chore/harness` na `main` é seu.

## Passo 7: a primeira demanda

Siga `04-rotina-de-uma-demanda.md`. Se o `typecheck` ou os testes já falhavam, essa é a primeira demanda; senão, comece pela refatoração de um arquivo da lista de dívida, ou pelo que você precisar.

---

## Instruções do agente: inventário

Só leitura, exceto `docs/harness/inventario-inicial.md`. Nunca leia nem copie valor de `.env` ou de segredo: liste só nomes de variável.

Levante e grave cada item com o comando usado e a saída que o comprova:

1. **Stack:** linguagem, framework, gerenciador de pacotes, monorepo (vários `package.json`?), versão do Node pedida (`engines`, `.nvmrc`).
2. **Pastas de código** (candidatas a `SOURCE_DIRS`) e pastas de teste.
3. **Lint e formatação que já existem:** ESLint (`eslint.config.*`, `.eslintrc*`), Prettier, Biome, EditorConfig. Os scripts atuais do `package.json` (`lint`, `test`, `typecheck`, `build`, `dev`, `start`) e se o projeto é ESM (`"type": "module"`).
4. **TypeScript:** existe `tsconfig.json`? `npx tsc --noEmit` passa hoje? Só rode se `node_modules` já existir; senão, anote "não rodado".
5. **Testes:** runner, quantos arquivos de teste, e se `npm test` passa hoje (mesma condição).
6. **Candidatos à lista de dívida:** arquivos de código acima de 350 linhas, arquivos com linha acima de 160 colunas, e arquivos com `console.` direto (fora de um adaptador de log). Use `find`, `awk` e `grep`, ignorando `node_modules`, `dist`, `build` e arquivos gerados. Liste todos, com a contagem de linhas.
7. **Protocolo de IA que já existe:** `CLAUDE.md` (quantas linhas e se tem regras), `AGENTS.md`, `.claude/` (hooks, agentes, skills, settings), `.cursor/`, `.codex/`, `.mcp.json`, vault ou pasta de memória. Para cada um: o que faz e se está ligado.
8. **Banco e entrega:** migrations, ORM, `Dockerfile`, `docker-compose`, workflows de CI.
9. **Git:** branch atual, remoto configurado (`git remote -v`), se o último commit está no remoto, e o `git status --short`.

Termine com:

- **Caso:** "este guia" (só código, `CLAUDE.md` simples) ou "migração, guia 05" (o item 7 achou um protocolo próprio). Se for migração, pare aqui e diga isso ao Gabriel.
- **Bloqueios antes de instalar:** sem remoto, ou `git status` com mudança que não seja este inventário: diga ao Gabriel e pare. Projeto sem remoto não recebe o harness.
- **Recomendação:** `SOURCE_DIRS`; formatador ligado ou desligado, e por quê; a lista proposta para a `DIVIDA_APROVADA`, com um motivo curto por arquivo; o comando de teste a usar; e se `typecheck` ou testes já falham hoje.

## Instruções do agente: instalar

Regras:

- Nada é simulado. Cada prova traz o comando, a saída literal e o código de saída (`; echo "saída=$?"`).
- Comando barrado: copie a mensagem literal, pare o item e marque NÃO TESTADO com o motivo. Não contorne.
- Não apague nada do projeto. Não mexa em `~/.claude/settings.json`. Se um passo falhar, não siga para o próximo.
- **O que é decisão do Gabriel, pergunte. Não decida por ele.** Quando pedir uma linha com `!`, espere o "pronto".
- As travas passam a valer **nesta sessão** assim que o `.claude/settings.json` aparece (I2). Daí em diante, sem plano aprovado, a ferramenta Write/Edit só escreve em `docs/`, `.agents/`, `.claude/`, `vault/`, nos `.md` da raiz e no `.gitignore`. `package.json`, `eslint.config.mjs`, `eslint.typed.config.mjs`, `biome.jsonc` e `tsconfig.json` se editam pelo shell (`node -e` ou `python3`), e os de regra dependem do `.claude/liberar-regras`.

**I1. Conferir.** `docs/harness/inventario-inicial.md` existe e diz "este guia" (senão, pare). O `git status --short` só pode mostrar o próprio inventário, `.claude/liberar-regras` e, se houver, `.claude/settings.local.json`; qualquer outra mudança: pare e mostre ao Gabriel. `.claude/liberar-regras` existe (senão, peça o Passo 2). Crie a branch: `git switch -c chore/harness`.

**I2. Instalar.**

```sh
sh ~/development/harness-canonico/instalar-no-projeto.sh --modo <local|universal> [--modulo <nome>] "$PWD"; echo "instalador saída=$?"
```

Saída 2 é "instalação incompleta": arquivos que já existiam e são diferentes do kit. O instalador nunca sobrescreve. Para cada item da lista, mostre a diferença e pergunte ao Gabriel. Casos comuns:

- `CLAUDE.md` do projeto: o instalador o mantém e só exige que importe a constituição. Se ele avisar que falta a linha `@AGENTS.md`, acrescente essa linha no topo, mantendo o resto.
- `eslint.config.mjs` ou `biome.jsonc` do projeto: a versão do kit vence, porque os gates dependem dela (copie a do kit por cima: com a liberação, pode). Liste as regras próprias que o projeto tinha e pergunte quais o Gabriel quer levar para o kit; não copie regra solta para o projeto.

Rode o instalador de novo até sair com 0.

**I3. Gates.**

1. Mescle no `package.json`, pelo shell, os `scripts` e as `devDependencies` de `.agents/templates/gates-web/package-scripts.json`, sem apagar os scripts que o projeto já usa (`dev`, `build`, `start`). O `test` recebe o comando de teste do projeto (Passo 3), não o texto de exemplo. Não acrescente `"type": "module"` sem perguntar.
2. `SOURCE_DIRS` no `eslint.config.mjs`, `files.includes` no `biome.jsonc` e `include` no `tsconfig.json`: as pastas de código decididas no Passo 3.
3. Formatador: se o Gabriel decidiu desligar, `"formatter": { "enabled": false }` no `biome.jsonc`, com o motivo num comentário ao lado.
4. `npm install`.
5. **Lista de dívida:** escreva no `eslint.config.mjs` a `DIVIDA_APROVADA` que o Gabriel aprovou, uma entrada por arquivo (`{ arquivo, motivo, desde }`). Não desligue nem rebaixe `max-lines`, `max-len` ou `quality/no-direct-console` de outro jeito.
6. **Linha de base do resto:** `npx eslint . -f json > /tmp/eslint-base.json` e conte as violações por regra (as da lista de dívida já aparecem como aviso). Regra com violação vai para `warn` no `eslint.config.mjs`. Repita com o tier pesado (`npx eslint . -c eslint.typed.config.mjs -f json`): regra com violação vai para `warn` no `eslint.typed.config.mjs`. Tire o `--max-warnings 0` dos scripts `lint` e `lint:typed` até a primeira promoção. No Biome (`npx biome check . --reporter=json`), regra com violação vai para `"warn"` no `biome.jsonc`. Grave `docs/harness/divida-do-lint.md` com a data, a contagem por regra (ESLint rápido, ESLint pesado, Biome), a lista de dívida e a regra de promoção ("sobe para `error` quando a contagem zera"). Na primeira demanda, o orquestrador cita esse arquivo no `estado.md`.

**I4. Constituição.** `AGENTS.md`: troque `[NOME DO PROJETO]` pelo nome do projeto. `.agents/stack.md`: preencha tudo com o que o inventário levantou (stack, pastas, comandos de dev, build e teste, endereço local, convenções). Aqui a stack já existe: não deixe nenhum `[PREENCHER`.

**I5. Ferramentas por projeto.** As mesmas do projeto novo (`02-projeto-novo.md`, passo M5): Graphify (`graphify install --project`, `graphify hook install`, `graphify update .`; num projeto grande o `update` demora), a aprovação dos servidores MCP em `.claude/settings.local.json` (no modo universal, com `harness-vault-comum` também) e a conferência dos plugins.

**I6. Provas.**

```sh
node .claude/hooks/selftest.mjs > /tmp/hooks.log 2>&1; echo "hooks saída=$?"; grep FALHOU /tmp/hooks.log
npm run gates:verify; echo "verify saída=$?"
npm run gates:selftest; echo "selftest saída=$?"
npm run lint; echo "lint saída=$?"
npm run lint:typed; echo "lint:typed saída=$?"
npm run typecheck; echo "typecheck saída=$?"
npm test; echo "test saída=$?"
```

Os quatro primeiros e os dois lints precisam sair com 0. O `grep FALHOU` sai com 1 quando não há falha: esse código não conta. Se `typecheck` ou `test` já falhavam antes do harness (o inventário diz), anote e siga: **não** conserte código do produto aqui (ver Passo 3). Se passavam e agora falham, pare e mostre ao Gabriel.

**I7. Travar os gates.** Peça ao Gabriel o Passo 5 (`! node .githooks/travar-gates.mjs`) e espere o "pronto". Você não roda o `travar-gates`. Depois rode `node .claude/hooks/doctor.mjs; echo "doctor saída=$?"`: precisa sair sem item grave. No modo universal, um item grave sobre `HARNESS_VAULT_CENTRAL` quer dizer que a variável não chegou a esta sessão: peça ao Gabriel para conferir o "Antes de começar" e reabrir o Claude Code.

**I8. Commit do harness.** Só os arquivos do harness, pelo nome (nunca `git add .` nem `-A`):

```sh
git add -- AGENTS.md CLAUDE.md harness.json .agents .claude .codex .opencode opencode.json .githooks .mcp.json .gitignore .graphifyignore biome.jsonc sem-supressao.mjs eslint.config.mjs eslint.typed.config.mjs eslint-rules selftest.mjs package.json package-lock.json tsconfig.json docs/harness vault
git status --short
git commit -m "chore(harness): instala harness v1"
```

Tire da lista o que não existir (por exemplo `vault` no modo universal) e acrescente pelo nome o que o `git status` mostrar e for do harness (o `.gitattributes` do Graphify). O pre-commit roda o lint: se barrar, corrija e repita (a liberação ainda está ativa). Nunca use `--no-verify`. Com o commit feito, peça ao Gabriel o Passo 6 (`! rm .claude/liberar-regras`).

**Relatório:** tabela PASSOU, FALHOU ou NÃO TESTADO por passo (I1 a I8) com a evidência literal; as decisões que o Gabriel tomou; a lista de dívida e a linha de base registradas; se `typecheck` ou testes já falhavam; e o que fica para ele: religar as travas, o merge da `chore/harness`, o terminal novo e as seis perguntas (Passo 6).
