# Fase 2b: fechar as pendências da Fase 2

Roteiro para a sessão do Claude Code no Mac. Fecha o que o relatório da Fase 2 deixou aberto: o servidor do vault (H7), o `chrome-devtools` e o binário fixado do vault. Não é para o Gabriel digitar nada: ele cola a frase de cima na sessão aberta em `~/development/harness-canonico` e espera.

**Frase para colar:**

> Leia modo-facil/02-fase-2b-fechar-pendencias.md e execute o roteiro inteiro, do Bloco 1 ao relatório final.

## Regras (as mesmas da Fase 2)

- Nada é simulado. Cada prova mostra o comando, a saída literal e o código de saída (`; echo "saída=$?"`), sem `| tail` escondendo o código.
- Se um comando for barrado (pelo classificador, por um hook ou por permissão), copie a mensagem literal e pare esse item: marque NÃO TESTADO com o motivo. Não contorne.
- Não apague nada. Não mexa em `~/.claude.json`, em `~/.claude/settings.json` nem no servidor `obsidian` de usuário. Esse servidor aponta para o vault pessoal do Gabriel e **não deve ser tocado nem chamado com escrita**.

## O que mudou no kit (contexto)

O servidor do vault do projeto agora se chama `harness-vault` (antes `obsidian`). Motivo: o Gabriel tem um servidor `obsidian` de usuário apontando para o vault pessoal, e o de usuário vencia o do projeto. As ferramentas passam a ser `mcp__harness-vault__*`. O hook `vault-guard` agora bloqueia qualquer `mcp__obsidian__*` dentro de um projeto com o harness.

## Bloco 1: projeto novo com o kit atualizado

O instalador não sobrescreve arquivo existente, então a prova limpa é um projeto novo. Não apague o projeto da Fase 2.

```sh
set -e
P=~/development/teste-harness-fase2b
mkdir -p "$P" && cd "$P"
git init -q
sh ~/development/harness-canonico/instalar-no-projeto.sh "$PWD"; echo "instalador saída=$?"
```

Em seguida, os mesmos passos do Bloco A da Fase 2 (`npm init -y`, juntar `package-scripts.json`, `tsconfig.json`, `src/exemplo.ts`, `npm install`). Prova:

```sh
node .claude/hooks/selftest.mjs > /tmp/p2b.log 2>&1; echo "hooks saída=$?"; grep -c '^OK' /tmp/p2b.log; grep FALHOU /tmp/p2b.log
grep -n '"harness-vault"' .mcp.json
npm run lint && npm run typecheck && npm run lint:typed; echo "gates saída=$?"
```

Esperado: hooks saída=0 (o autoteste inclui os dois casos novos, "MCP do vault pessoal" e "MCP do vault do projeto"), `.mcp.json` com `harness-vault`, gates saída=0.

Aprovação dos servidores do projeto (peça o "pode" do Gabriel antes): crie `.claude/settings.local.json` com

```json
{ "enabledMcpjsonServers": ["harness-vault", "chrome-devtools"] }
```

Desligue o Playwright para este projeto como na Fase 2 (acrescentar `playwright` em `disabledMcpServers` só na entrada deste projeto, ou pelo `/mcp`). Não é para tocar em outros projetos.

## Bloco 2: o `obsidian` pessoal não é alcançado (prova sem escrita)

Prepare o ambiente do teste: mova `AGENTS.md` e `CLAUDE.md` para `AGENTS.md.off` e `CLAUDE.md.off` (senão o modelo recusa por conta própria e a prova não mostra o hook). Restaure no fim do roteiro.

Rode, de dentro de `~/development/teste-harness-fase2b`:

```sh
claude -p "Use a ferramenta mcp__obsidian__search_notes_tool para buscar a palavra 'teste'. Se der erro, copie a mensagem literal." --allowedTools "mcp__obsidian__search_notes_tool"; echo "saída=$?"
```

É uma busca, de propósito: se o hook falhar, nada é escrito no vault pessoal. Esperado: mensagem do `vault-guard` começando com "Esta é a ferramenta do servidor 'obsidian', que não é o vault do projeto". Se vier resultado de busca em vez dessa mensagem, **FALHOU**: pare e relate (não repita a chamada).

## Bloco 3: H7, o vault do projeto valida o modelo

```sh
claude -p "Use a ferramenta mcp__harness-vault__create_note_tool para criar a nota 03-conhecimento/teste.md com frontmatter (name, description, metadata.type: knowledge), as seções ## O que vale, ## Por quê, ## Quando se aplica, ## Evidência, ## Related, e em Related o link [[nota-que-nao-existe]]. Copie a resposta literal." --allowedTools "mcp__harness-vault__create_note_tool"; echo "saída=$?"
ls vault/03-conhecimento
```

Esperado: "Broken wikilink target(s)" e `vault/03-conhecimento` vazio. Isso prova também que o binário fixado (commit `6e2916e`) roda nesta máquina, porque é o Claude Code quem o inicia. Se o servidor não conectar, o próprio Gabriel roda no terminal (não o agente): `uvx --from git+https://github.com/Swapo-Finance/obsidian-mcp@6e2916ea393f27c37b911649601139bd4c4426ba obsidian-mcp --help`, e você cola a saída.

Prova de caminho feliz (cria uma nota válida, só dentro de `vault/` do projeto): peça a criação de `03-conhecimento/nota-valida.md` com o mesmo modelo e sem links; esperado: nota criada em `vault/03-conhecimento/nota-valida.md` do projeto, e **nenhuma** nota nova no vault pessoal. Confira com `ls vault/03-conhecimento`.

## Bloco 4: `chrome-devtools` de verdade

```sh
claude -p "Use mcp__chrome-devtools__new_page para abrir https://example.com e depois mcp__chrome-devtools__take_snapshot. Diga o título que aparece na página e copie qualquer erro literal." --allowedTools "mcp__chrome-devtools__new_page,mcp__chrome-devtools__take_snapshot,mcp__chrome-devtools__close_page,mcp__chrome-devtools__list_pages"; echo "saída=$?"
```

Esperado: o texto "Example Domain". Isso abre uma janela do Chrome no Mac; avise o Gabriel antes. `claude mcp list` pode continuar dizendo "Pending approval": é só o `list` não ler o `settings.local.json`; vale a prova real acima.

## Fim

Restaure `AGENTS.md` e `CLAUDE.md` (sem sobrar `.off`). Confirme que o projeto `teste-harness-fase2b` e o `teste-harness-fase2` continuam de pé.

## Relatório final

Tabela PASSOU / FALHOU / NÃO TESTADO por bloco (1, 2, 3, 3 caminho feliz, 4), com a evidência literal de cada. Depois: a lista do que foi alterado fora dos projetos descartáveis (esperado: nada além do `~/.claude.json` do Bloco 1) e o que fica para o Gabriel fazer à mão.
