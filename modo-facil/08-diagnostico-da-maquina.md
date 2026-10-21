# Diagnóstico da máquina (só leitura)

Use quando algo estranho acontecer na máquina, antes de mexer em configuração global, ou para comparar duas máquinas. Cole no Claude Code aberto em `~/development/harness-canonico`:

```text
Leia modo-facil/08-diagnostico-da-maquina.md e execute o roteiro inteiro. Só leitura.
```

> Você é o Claude Code rodando no Mac do Gabriel. Este roteiro **só lê**. Você não instala, não atualiza, não faz login, não edita, não move e não apaga nada. A única escrita permitida é o arquivo do relatório no fim. Se algum passo parecer exigir mudança, anote no relatório como "precisaria mudar" e siga em frente.
>
> **Onde rodar:** abra a sessão em `~/development/harness-canonico` (esta pasta não tem hooks do harness ativos).
>
> **Para que serve:** retratar o estado real da máquina (ferramentas, versões, configuração global, plugins, servidores MCP). Tudo que estiver errado ou faltando aqui vira suposição errada em quem ler o relatório. Prefira mostrar a saída literal a resumir.

## Regras deste roteiro

1. **Segredo nunca aparece.** Não imprima nem grave valor de token, chave, senha, `auth`, `oauth`, `secret`, `credential` ou variável `env` de servidor MCP. Em arquivo JSON ou TOML que pode ter segredo, mostre só a estrutura: nomes de chaves, nomes de servidores, comandos e argumentos, e troque qualquer valor sensível por `<oculto>`. Não abra `~/.codex/auth.json`, `~/.gemini/oauth_creds.json`, nem arquivos com `token`, `cred` ou `secret` no nome: só diga se existem.
2. **Pastas grandes ou privadas:** não liste conteúdo de `projects/`, `sessions/`, `history`, `logs/`, `cache/`, `node_modules/`, `Library/Caches`. Só diga se existem e o tamanho (`du -sh`).
3. **Código de saída:** quando o resultado importa, rode `comando; echo "saída=$?"`. "Ausente" é `command not found` ou arquivo inexistente; anote assim.
4. **RTK:** se a saída de um comando vier resumida pelo RTK (texto que não é o conteúdo do arquivo), rode de novo com caminho absoluto, por exemplo `/bin/cat`, e diga no relatório que isso aconteceu.
5. **Não pare no primeiro erro.** Anote e siga para o próximo item.

## A. Máquina e ferramentas

Para cada um, a versão ou "ausente", e o caminho (`command -v`):

`sw_vers`, `uname -m`, `brew --version`, `node -v`, `npm -v`, `nvm --version` (pode exigir `source ~/.nvm/nvm.sh`), `git --version`, `gh --version`, `gh auth status` (só diga se está logado e em qual conta; sem token), `python3 --version`, `uv --version`, `claude --version`, `codex --version`, `opencode --version`, `gemini --version`, `agy --version`, `antigravity --version`, `rtk --version`, `graphify --version`, `agent-browser --version`, `gitleaks version`, `semgrep --version`, `biome --version`, `npx --no-install impeccable --version`, `maestri --version` (ou `maestri --help | head -5`).

Aplicativos: existe `/Applications/Maestri.app`? `/Applications/Obsidian.app`? `/Applications/Antigravity IDE.app`? Versão de cada um com `defaults read /Applications/<App>.app/Contents/Info CFBundleShortVersionString`.

## B. Claude Code, escopo global (`~/.claude/` e `~/.claude.json`)

1. Árvore: `find ~/.claude -maxdepth 2 -not -path '*/projects*' -not -path '*/todos*' -not -path '*/shell-snapshots*' -not -path '*/statsig*' | sort`.
2. `~/.claude/settings.json`: conteúdo inteiro, com `env` e qualquer valor sensível trocado por `<oculto>`. Destaque: `hooks` (cada evento, matcher e comando), `enabledPlugins`, `permissions`, `model`.
3. `~/.claude/CLAUDE.md` e `~/.claude/RTK.md`: conteúdo inteiro (são regras, não segredo).
4. Conteúdo de `~/.claude/rules/`, `~/.claude/agents/`, `~/.claude/skills/` (nome de cada skill e a linha `description` do `SKILL.md`), `~/.claude/commands/`, `~/.claude/hooks/`.
5. `claude plugin list --json`: para cada plugin, nome, marketplace, escopo e se está ligado. Rode **duas vezes**: em `~` e em `~/development/harness-canonico`, e mostre a diferença.
6. `claude mcp list` em `~` e dentro de `~/development/CENTRAL-SLON`: nome, escopo, comando e estado de cada servidor.
7. `~/.claude.json`: **não imprima o arquivo**. Mostre só: as chaves de primeiro nível; os nomes em `mcpServers` (escopo usuário) com o comando de cada um; a lista de caminhos em `projects` e, para cada projeto, os nomes em `mcpServers`, `enabledMcpjsonServers` e `disabledMcpServers`. Use `jq` com seleção de campos.
8. Backups da Fase 2: existem `~/.claude/settings.json.bak-fase2`, `~/.claude/CLAUDE.md.bak-fase2`, `~/.claude.json.bak-fase2`?

## C. Configuração intermediária em `~/development/`

`ls -la ~/development/` e, se existirem, o conteúdo inteiro de `~/development/.claude/settings.json`, `~/development/CLAUDE.md`, `~/development/AGENTS.md` (com segredo oculto).

## D. Codex, escopo global (`~/.codex/`)

1. Árvore: `find ~/.codex -maxdepth 2 -not -path '*/sessions*' -not -path '*/log*' | sort` (sem abrir `auth.json`).
2. `~/.codex/config.toml`: estrutura e valores não sensíveis (modelo, perfis, `mcp_servers` com nome e comando, `features`, `hooks`), com segredo oculto.
3. Conteúdo de `~/.codex/AGENTS.md`, `~/.codex/agents/`, `~/.codex/hooks.json`, `~/.codex/skills/`, `~/.codex/prompts/`.
4. Plugins do Codex instalados (comando de listagem do próprio Codex, se existir; senão, a pasta onde ficam).
5. Existe configuração de projeto do Codex em algum projeto de `~/development` (`.codex/`)? Liste.

## E. Antigravity e Gemini (`~/.gemini/`, `~/.antigravity-ide/`)

1. Árvore de `~/.gemini` (profundidade 2, sem arquivos de credencial) e de `~/.antigravity-ide` (só nomes, profundidade 1).
2. `~/.gemini/settings.json` com segredo oculto; `~/.gemini/GEMINI.md`; `~/.gemini/extensions/` (nomes).
3. Qual comando abre o Antigravity CLI no terminal (o que o Gabriel usa no Maestri)? Descubra pelo que existe no PATH.

## F. OpenCode (`~/.config/opencode/`)

Árvore, `opencode.json` com segredo oculto, `AGENTS.md`, `agents/`, `plugins/` ou equivalente.

## G. Pastas globais compartilhadas

`~/.agents/` (árvore completa, profundidade 3, e o conteúdo de cada `.md` que não for segredo), `~/.impeccable/`, `~/.agent-browser/`, `~/.playwright-mcp/`, `~/.hermes/` (só nomes, profundidade 1, e `du -sh`).

## H. Maestri

1. `~/.maestri/`: árvore de profundidade 2 (só nomes), `du -sh`.
2. `~/.maestri/partituras/`: nome de cada arquivo. Se existir alguma, mostre **um** exemplo inteiro (é JSON de layout; troque por `<oculto>` qualquer comando com token ou caminho privado).
3. Existe pasta de responsabilidades (roles) e quantas? Só nomes.
4. `maestri --help` (lista de subcomandos). Anote se `ask`, `check` e `list` existem.

## I. RTK

`rtk --version`, `rtk config` (caminho), conteúdo do `config.toml` (sem segredo), `rtk init --show` dentro de `~` e dentro de `~/development/harness-canonico`. Diga se o hook do RTK está no escopo **global** (`~/.claude/settings.json`) ou de projeto. Rode as provas: `rtk rewrite "git status"; echo saída=$?` e `rtk rewrite "npm run lint"; echo saída=$?`.

## J. Graphify

`graphify --version`, `graphify --help` (subcomandos). Em quais projetos de `~/development` existe `graphify-out/` e a data da última atualização. O Graphify registrou algo global (skill em `~/.claude/skills/graphify`, seção no `~/.claude/CLAUDE.md`)?

## K. Obsidian e memória

1. Cofres conhecidos pelo Obsidian: leia `~/Library/Application Support/obsidian/obsidian.json` e mostre **só os caminhos** dos cofres.
2. Existe um servidor MCP pessoal de Obsidian (por exemplo `obsidian`) em escopo de usuário do Claude Code ou no Codex? Nome e comando.
3. O servidor do vault do harness (`harness-vault`) está em quais `.mcp.json`? Mostre o trecho (sem segredo).
4. Memória nativa: existe `~/.claude/projects/*/memory/` em algum projeto? Só diga quais projetos têm (nomes das pastas), sem abrir.

## L. Projetos em `~/development`

Para cada pasta de primeiro nível (`CENTRAL-SLON`, `harness-canonico`, `teste-*`, `_backups` e qualquer outra), uma linha de tabela com: é repositório git? (`git -C <pasta> rev-parse --is-inside-work-tree`), remoto (`git remote -v`, só o nome do host e do repositório), branch atual, e se existem: `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/settings.json`, `.claude/agents/`, `.codex/`, `.mcp.json`, `vault/`, `graphify-out/`, `.githooks/`, `design-system/`, e o valor de `git config core.hooksPath`.

## M. Central Isobras

1. Onde está o repositório da Central Isobras neste Mac? Procure com `find ~ -maxdepth 4 -type d -iname '*central*' -not -path '*/Library/*' -not -path '*/node_modules/*' 2>/dev/null`.
2. Para cada candidato: é git? remoto? E liste **só os nomes** dos arquivos de processo de IA na raiz e em pastas ocultas: `AGENTS.md`, `CLAUDE.md`, `AI_PROTOCOL.md`, `ARCHITECTURE.md`, `GEMINI.md`, `.claude/` (árvore), `.agents/`, `.codex/`, `.mcp.json`, `docs/` (profundidade 1). Não abra código de produto nem `.env`.

## N. O que está no escopo global e muda o comportamento de qualquer sessão

Monte uma tabela, sem mudar nada, com uma linha para cada coisa global que afeta **toda** sessão de agente, mesmo fora de um projeto do harness:

| Item | Onde está | Agente afetado | O que faz em qualquer sessão |
|---|---|---|---|

Inclua: hooks globais (RTK, Graphify, Impeccable ou outros), plugins ligados em escopo de usuário (Superpowers, Ponytail, Caveman e os demais), regras globais (`~/.claude/CLAUDE.md`, `~/.claude/rules/*`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`), servidores MCP de usuário e skills globais.

## Relatório

Grave em `~/development/harness-canonico/docs/inventario/AAAA-MM-DD-diagnostico-maquina.md (com a data de hoje)`, com:

1. No topo, a data e a hora, e uma lista de "o que não foi possível ler e por quê".
2. Uma seção por letra (A a N), com os comandos rodados e a saída literal (corte só repetições óbvias e diga onde cortou).
3. No fim, um resumo de até 15 linhas: o que está instalado, o que falta, o que está em escopo global e o que parece conflitar com o harness.

Depois de gravar, leia o arquivo de volta, confira que **nenhum** valor de segredo apareceu (procure por `sk-`, `ghp_`, `token`, `Bearer`, `password`, `secret` e revise cada ocorrência) e diga ao Gabriel só: "Inventário pronto em docs/inventario/AAAA-MM-DD-diagnostico-maquina.md (com a data de hoje)", mais a lista do que não conseguiu ler.
