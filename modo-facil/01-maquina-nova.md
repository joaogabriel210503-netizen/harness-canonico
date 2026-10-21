# Máquina nova: do computador zerado ao ambiente completo

Para quando você trocar de computador (macOS). No fim você tem o ambiente de desenvolvimento desta máquina: Claude Code com os plugins e as skills dos agentes, Codex, OpenCode, Antigravity, as ferramentas do harness (Graphify, agent-browser, RTK, gitleaks, uv) e o kit clonado, pronto para instalar em projetos.

| Parte | Onde | Quem faz | Quando |
|---|---|---|---|
| A. Exportar a sua configuração | máquina **atual** | Claude Code, por prompt | uma vez antes de trocar, e sempre que mudar plugins ou o `CLAUDE.md` global |
| B. O mínimo à mão | máquina **nova** | você, colando 4 blocos | ~15 minutos |
| C. Instalar o resto | máquina nova | Claude Code, por prompt | ~30 minutos, com os seus "pode" |
| D. Provar | máquina nova | Claude Code, por prompt | ~30 minutos |

**Faça a Parte A enquanto a máquina atual existir.** Três plugins seus (`ponytail`, `caveman` e `ui-ux-pro-max`) vêm de marketplaces de terceiros, e só a exportação guarda de que repositório cada um vem. Sem ela, a Parte C instala o resto e esses três ficam para você achar à mão.

---

## Parte A: exportar a configuração da máquina atual

O resultado vai para a pasta `maquina/` deste repositório, **sem segredo nenhum**: lista exata de plugins e de onde vêm, servidores MCP (sem valores de variável), o seu `CLAUDE.md` global e a configuração do RTK.

Abra o Claude Code em `~/development/harness-canonico` e cole:

```text
Leia modo-facil/01-maquina-nova.md e execute a seção "Instruções do agente: exportar" nesta máquina. Não commite: no fim me mostre o git status e eu reviso.
```

Revise o que ele gravou (peça "me mostre maquina/README.md e maquina/plugins.json") e, estando certo, publique: `modo-facil/07-atualizar-o-harness.md`, parte A.

---

## Parte B: o mínimo à mão, na máquina nova

São quatro blocos para **colar** no Terminal (Spotlight → "Terminal"). Cole um por vez e espere terminar.

**B1. Homebrew** (o instalador de programas do Mac). Pede a senha do Mac.

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

No fim ele imprime "Next steps" com duas ou três linhas começando por `echo` e `eval`. **Cole essas linhas também**: elas põem o `brew` no caminho. Confira com `brew --version`.

**B2. GitHub CLI e login no GitHub.** O repositório é privado: sem este login nada consegue baixá-lo.

```sh
brew install gh git
gh auth login
```

Responda: **GitHub.com** → **HTTPS** → **Yes** (autenticar o git) → **Login with a web browser**. Copie o código que aparece, aperte Enter e cole no navegador.

**B3. Claude Code.**

```sh
curl -fsSL https://claude.ai/install.sh | bash
```

Ponha a pasta dos programas instalados assim no caminho (serve também para o Graphify, mais tarde):

```sh
grep -q '.local/bin' ~/.zshrc 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

**Feche o Terminal e abra de novo** (⌘Q e abrir). Confira com `claude --version`.

**B4. Pasta de trabalho e login no Claude Code.**

```sh
mkdir -p ~/development && cd ~/development && claude
```

Ele abre o navegador para login: entre com a sua conta (Pro ou Max). Se perguntar se confia na pasta, responda que sim.

Opcional: o app do Claude para desktop (`brew install --cask claude`), se você liga as sessões da nuvem a este computador.

---

## Parte C: o Claude Code instala o resto

No mesmo terminal do Claude Code, aberto em `~/development`, cole:

```text
Clone o meu repositório privado harness-canonico com `gh repo clone harness-canonico ~/development/harness-canonico`. Depois leia ~/development/harness-canonico/modo-facil/01-maquina-nova.md e execute a seção "Instruções do agente: instalar", bloco por bloco. Antes de cada bloco que instala ou muda configuração, me mostre os comandos e espere o meu "pode". Logins são meus: quando um aparecer, pare e me avise.
```

Logins e instalações que só você faz (ele vai parar e avisar em cada um):

- **Codex:** `codex login`, com a conta do ChatGPT.
- **OpenCode:** abrir `opencode` e rodar `/connect` com o seu provedor.
- **Context7:** você roda `npx ctx7 setup --claude` no Terminal (ele faz perguntas e abre o navegador; escolha o modo MCP).
- **Antigravity IDE:** abrir o app uma vez e entrar.
- **Maestri:** vem do Setapp (https://setapp.com/apps/maestri); instale à mão.
- **Claude in Chrome:** a extensão vem da Chrome Web Store; instale e faça login nela.

Quando ele parar num desses passos, faça e responda "pronto, continue": ele não percebe sozinho que você terminou.

No fim ele entrega uma tabela com PASSOU, FALHOU ou FALTA O GABRIEL por bloco.

---

## Parte D: provar que ficou igual

Feche a sessão da Parte C (digite `/exit`) e, no mesmo Terminal, abra uma no kit:

```sh
cd ~/development/harness-canonico && claude
```

E cole:

```text
Execute o roteiro modo-facil/06-teste-no-mac.md, seção "Roteiro do executor", do começo ao fim. Ao final, escreva o relatório em docs/inventario/ e me mostre o resumo.
```

É o mesmo teste que validou o harness na máquina anterior: instala num projeto descartável, roda os selftests, prova cada trava no Claude Code real e confere o preload das skills dos agentes (item F2).

---

## Instruções do agente: exportar

Para o Claude Code na máquina **atual**, aberto em `~/development/harness-canonico`.

Regras: só leitura fora de `maquina/`. Nunca grave segredo: token, chave, senha, valor de variável de ambiente de servidor MCP, cabeçalho `Authorization`, `apiKeyHelper`. Onde houver um, grave `<oculto>`. Não commite.

**E1.** `mkdir -p maquina/claude-global`.

**E2. Plugins.** `claude plugin list --json`. Grave `maquina/plugins.json` só com `id`, `scope` e `enabled` de cada item (sem `installPath`, `mcpServers` e `errors`: o primeiro tem caminho da máquina, o segundo pode ter segredo). Os de `scope: "synced"` voltam sozinhos com o login da conta; mantenha-os na lista mesmo assim.

**E3. Marketplaces.** `claude plugin marketplace list --json`. Grave `maquina/marketplaces.json` só com `name`, `source`, `repo`, `url` e `ref`.

**E4. Servidores MCP de usuário.** `claude mcp list` e a chave `mcpServers` do escopo de usuário em `~/.claude.json`. Grave `maquina/mcp-usuario.md`: uma linha por servidor com nome, tipo, comando e argumentos, e o **nome** de cada variável de ambiente com o valor `<oculto>`. Servidor por URL com token na própria URL: troque o token por `<oculto>`. Não copie a seção `projects` do `~/.claude.json`.

**E5. Claude Code global.** Copie `~/.claude/CLAUDE.md` e, se existir, `~/.claude/RTK.md` para `maquina/claude-global/`. Leia os dois antes e confirme que não há segredo dentro.

**E6. Settings global.** De `~/.claude/settings.json`, grave `maquina/claude-global/settings.json` **sem** as chaves `env`, `hooks`, `apiKeyHelper`, `awsAuthRefresh`, `awsCredentialExport` e qualquer chave cujo nome contenha `token`, `secret`, `key` ou `auth`. Os hooks globais não são copiados: quem os cria são as ferramentas (RTK e outras), que a Parte C reinstala. Anote em `maquina/README.md` o comando de cada hook global que existia, só como referência.

**E7. RTK.** Copie só a seção `[hooks]` do `config.toml` do RTK (`rtk config` mostra o caminho) para `maquina/rtk-config.toml`.

**E8. Ferramentas.** Grave `maquina/ferramentas.md`: uma tabela com nome, versão e como foi instalada (brew, npm -g, uv tool, curl, app, Setapp) de node, npm, git, gh, uv, rtk, graphify, agent-browser, gitleaks, claude, codex, opencode, Antigravity IDE, Maestri, Obsidian e Google Chrome. O que faltar: "ausente".

**E9. Varredura de segredo.**

```sh
for f in $(find maquina -type f); do node .githooks/secret-scan.mjs --stdin < "$f" || echo "ACHADO em $f"; done
gitleaks detect --no-git --source maquina -v   # se o gitleaks existir
```

Achou algo: troque o valor por `<oculto>` e rode de novo até sair limpo.

**E10.** Reescreva `maquina/README.md` com a data da exportação, a versão do Claude Code, a lista de hooks globais (E6) e o que cada arquivo da pasta contém.

**Relatório:** os arquivos gravados, o resultado da varredura e a saída de `git status --short maquina/`.

---

## Instruções do agente: instalar

Para o Claude Code na máquina **nova**. O kit está em `~/development/harness-canonico`. **Todo caminho relativo desta seção (`maquina/...`, `.agents/...`) é relativo ao kit:** use o caminho completo (`~/development/harness-canonico/maquina/...`), porque a sessão está aberta em `~/development`.

Regras:

- Nada é simulado. Cada prova mostra o comando, a saída literal e o código de saída (`; echo "saída=$?"`).
- Antes de cada bloco, mostre os comandos e espere o "pode" do Gabriel. Apareceu um login: pare e avise.
- Nunca imprima nem grave segredo.
- Bloco que falha: mostre o erro inteiro, marque FALHOU e pergunte se segue para o próximo. Não improvise outra forma de instalar.
- Se o modo automático barrar uma escrita em configuração do Claude Code (`[Self-Modification]`), não contorne: entregue ao Gabriel a linha pronta, começando com `!`, e espere o "pronto".
- Programa recém-instalado que não é achado (`command not found`): a sessão não relê o `~/.zshrc`. Use o caminho completo que o instalador imprimiu para a prova, e siga.
- No fim de cada bloco, uma linha: `BLOCO N: PASSOU`, `BLOCO N: FALHOU (motivo)` ou `BLOCO N: FALTA O GABRIEL (o quê)`.

**Bloco 1. Base.**

```sh
brew install node@22 uv gitleaks
brew link --overwrite --force node@22
node -v; npm -v; uv --version; gitleaks version
```

O Node precisa ser 22.x: é a versão em que o harness foi provado.

**Bloco 2. RTK** (compacta a saída de comandos para economizar contexto, mas nunca a dos gates).

```sh
brew install rtk
rtk --version && rtk gain
rtk init -g --auto-patch
```

Se `rtk gain` falhar, foi instalado o pacote errado (existe outro "rtk"): pare. Depois, no `config.toml` do RTK (`rtk config` mostra o caminho), na seção `[hooks]`, garanta `exclude_commands` com pelo menos `["npm", "npx", "tsc", "eslint", "vitest", "jest", "node"]`; se `maquina/rtk-config.toml` existir, use a lista de lá (mantendo esses itens). Prova: `rtk rewrite "npm run lint"; echo "saída=$?"` não imprime nada e sai com 1. Se reescrever, FALHOU: o gate passaria comprimido.

**Bloco 3. Ferramentas do harness.**

```sh
uv tool install graphifyy                 # dois "y" no pacote; o comando é graphify
npm install -g agent-browser && agent-browser install
graphify --version; agent-browser --version
```

**Bloco 4. Os outros agentes e apps.**

```sh
brew install --cask codex
curl -fsSL https://opencode.ai/v2/install | bash
brew install --cask antigravity-ide obsidian
codex --version; opencode --version   # se o opencode não for achado, use o caminho que o instalador imprimiu (normalmente ~/.opencode/bin/opencode)
```

Se o Chrome não existir: `brew install --cask google-chrome`. Pare e peça ao Gabriel: `codex login`; abrir `opencode` e rodar `/connect`; abrir o Antigravity IDE uma vez e entrar; instalar o Maestri pelo Setapp; instalar a extensão Claude in Chrome. Compare as versões com `.agents/versoes.json` e anote as diferenças (versão diferente não é falha; abaixo da mínima é).

**Bloco 5. Claude Code: configuração global.**

1. Se existir `maquina/claude-global/CLAUDE.md` (e `RTK.md`), copie para `~/.claude/` com `cp -n`. Se o arquivo já existir lá, mostre a diferença e pergunte.
2. `~/.claude/settings.json`: mescle, sem substituir, as chaves de `maquina/claude-global/settings.json` (se existir). Em qualquer caso, garanta `"autoMemoryEnabled": false`: a memória é a do harness. O hook que o RTK gravou no Bloco 2 fica.
3. **Plugins.** Com `maquina/marketplaces.json`: para cada marketplace de origem `github`, `claude plugin marketplace add <repo>`; de origem `git` ou `url`, use a `url`. Depois, com `maquina/plugins.json`: para cada `id` de escopo `user`, `claude plugin install <id> --scope user`; os que estavam com `enabled: false`, `claude plugin disable <id> --scope user`. Os de escopo `synced` voltam com o login: só confira que aparecem.
   Sem `maquina/`:
   - `superpowers` e `context7` estão no marketplace oficial, que o Claude Code configura sozinho na primeira sessão: `claude plugin install superpowers@claude-plugins-official --scope user` (idem `context7`). Se o marketplace faltar: `claude plugin marketplace add anthropics/claude-plugins-official`.
   - `backend-design`, `finecomb` e `qamap` vieram do diretório do claude.ai e voltam com o login, por sincronização da conta: só confira que aparecem (escopo `synced`).
   - `ponytail`, `caveman` e `ui-ux-pro-max` vêm de marketplaces de terceiros: sem a exportação não dá para saber o repositório. Marque FALTA O GABRIEL e diga que é preciso a Parte A (na máquina antiga) ou o repositório de cada um.
4. Prova: `claude plugin list --json`. Precisam estar instalados e ligados: `superpowers`, `ponytail`, `ui-ux-pro-max`, `backend-design`, `finecomb` e `qamap` (são as skills que os agentes pré-carregam e o fluxo da SPEC). Faltou algum: FALHOU, com o nome.

**Bloco 6. Impeccable e Context7.**

```sh
npx impeccable install --providers=claude --scope=global --no-hooks
```

O Impeccable vai **sem hook** de propósito: o `doctor` do harness reprova hook em `.claude/settings.local.json`. O Context7 é interativo (pergunta e abre o navegador): **não** rode aqui. Peça ao Gabriel para rodar `npx ctx7 setup --claude` no Terminal, escolhendo o modo MCP, e espere o "pronto". Prova: `claude mcp list` mostra o Context7, e a skill `impeccable` aparece na lista de skills de uma sessão nova.

**Bloco 7. Conferência final.**

- `claude doctor` sem erro.
- Tabela de versões (node, gh, uv, rtk, graphify, agent-browser, gitleaks, claude, codex, opencode) contra `.agents/versoes.json`: igual, mais nova, ou abaixo da mínima.
- O kit íntegro: `node ~/development/harness-canonico/kit-claude-code/dot-claude/hooks/harness-manifesto.mjs gerar ~/development/harness-canonico --conferir` sai com 0.
- Servidores MCP de usuário (os de `maquina/mcp-usuario.md`, como o Playwright) não são reinstalados por este roteiro: liste-os para o Gabriel decidir quais quer de volta.

**Relatório:** tabela com um bloco por linha (PASSOU, FALHOU ou FALTA O GABRIEL) e a evidência; a lista do que foi alterado fora de `~/development/harness-canonico` (arquivos globais); e o próximo passo para o Gabriel: "rode a Parte D".
