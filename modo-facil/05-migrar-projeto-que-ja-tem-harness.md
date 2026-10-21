# Migrar um projeto que já tem outro protocolo de IA

Vale para projeto que já tem regras, hooks, agentes, skills ou memória próprios (o primeiro caso é a Central e os módulos dela). O cuidado é este: **nada do que existe se perde sem decisão sua, e nenhuma regra antiga fica viva ao lado da nova.**

Projeto que só tem código (no máximo um `CLAUDE.md` simples) não é migração: siga `03-projeto-em-andamento.md`.

A instalação em si segue as instruções do `03`. O que este guia acrescenta: o inventário do protocolo antigo, o mapa de decisões e a regra de aplicar o mapa no mesmo commit da instalação.

## Antes de começar (você)

1. **Backup do banco**, se o projeto tiver banco. Na Central: `docker exec central-isobras-db pg_dump -U postgres central_db > ~/backup-central-$(date +%Y%m%d).sql`. Guarde fora da pasta do projeto.
2. **Remoto e commit:** o que importa precisa estar commitado e no GitHub. Projeto sem remoto, ou com o cofre só numa pasta local, não migra: resolva isso antes.
3. **Modo do vault:** `local` ou `universal` (ecossistema Central). No universal, defina a variável `HARNESS_VAULT_CENTRAL` como em `03-projeto-em-andamento.md`, "Antes de começar", item 2.

## Passo 1: inventário do protocolo antigo (só leitura)

No terminal do Orquestrador (Claude Code, aberto na raiz do projeto, sem responsabilidade), cole:

```text
Faça o inventário do protocolo de IA que este projeto já tem, só leitura, sem mudar nada além do arquivo do inventário. Liste: constituição e regras (onde estão, quem as lê), hooks (escritos e registrados; os escritos e não registrados contam como mortos), agentes e subagentes, skills, servidores MCP, memória e vault, scripts, plugins ligados, e arquivos grandes dentro de .claude (node_modules, worktrees). Para cada item: onde está, se está ligado e o que faz. Inclua também os itens 1 a 9 do inventário de ~/development/harness-canonico/modo-facil/03-projeto-em-andamento.md (stack, pastas, lint, tamanho, testes, git). Grave em docs/migracao/inventario.md e termine com um resumo do que achou e do que vai precisar de decisão minha.
```

## Passo 2: mapa de equivalência (você decide)

Cole:

```text
Monte docs/migracao/mapa.md: uma linha por item do inventário com a decisão proposta (manter, substituir pelo equivalente do harness novo, absorver no harness canônico porque é melhor, ou remover), o equivalente no harness novo quando houver, e o motivo. Não aplique nada.
```

Leia, corrija e responda "ok" por item ou por bloco. Nada avança sem você ter lido o mapa.

- **Absorver** quer dizer: aquilo é melhor que o do kit e deve virar parte do harness canônico. Isso é feito no `harness-canonico` (`07-atualizar-o-harness.md`, parte A), não copiado solto para o projeto.
- **Remover** e **substituir** acontecem no mesmo commit da instalação (Passo 4): regra antiga e regra nova não convivem.

## Passo 3: ensaio num clone (recomendado)

O ensaio mostra os conflitos sem tocar no projeto. Cole:

```text
Faça um ensaio da instalação: clone este repositório num diretório temporário (git clone "$PWD" "/tmp/ensaio-harness"), rode nele sh ~/development/harness-canonico/instalar-no-projeto.sh --modo <local|universal> [--modulo <nome>] "/tmp/ensaio-harness" e me mostre a lista de conflitos. Para cada conflito, diga qual decisão do docs/migracao/mapa.md cobre o arquivo. Conflito sem decisão no mapa: aponte. Não mexa no projeto real.
```

Conflito sem decisão no mapa volta ao Passo 2.

## Passo 4: instalação de verdade, aplicando o mapa

1. Libere as travas de regra: `! mkdir -p .claude && touch .claude/liberar-regras`.
2. Cole, trocando o modo do vault:

```text
Leia ~/development/harness-canonico/modo-facil/03-projeto-em-andamento.md e execute a seção "Instruções do agente: instalar" nesta pasta, com o vault em modo [local | universal --modulo NOME], com estas diferenças: (a) a branch é chore/harness-v1; (b) no I1, o git status pode mostrar também docs/migracao/; (c) cada conflito do instalador se resolve pelo docs/migracao/mapa.md; (d) no mesmo trabalho, remova ou substitua o que o mapa mandou (hooks antigos no .claude/settings.json, regras antigas no CLAUDE.md, agentes, skills e scripts antigos), para que nada antigo continue ligado; (e) o que o mapa marcou como "absorver" não entra no projeto: liste no relatório como pedido para o kit; (f) inclua docs/migracao no commit. Pare e me pergunte em cada conflito e decisão.
```

Cada linha com `!` que ele pedir: rode e responda "pronto, continue". Na ordem, ele vai pedir o `travar-gates`, conferir o `doctor`, commitar na `chore/harness-v1` e pedir o `! rm .claude/liberar-regras`.

## Passo 5: aceitação no projeto migrado

Feche o terminal, abra outro (sem responsabilidade) e pergunte:

```text
Sem editar nada: 1) qual é o seu papel? 2) em que etapa está a demanda? 3) você pode editar código? 4) quem aprova a SPEC e o plano, e com que frase exata? 5) onde grava a saída? 6) se eu pedir para pular a SPEC e programar, o que você faz?
```

Resposta certa: orquestrador que não implementa; nenhuma demanda aberta; não edita código de produto; só você aprova, com "Aprovo a SPEC." e "Aprovo o plano."; grava em `docs/fluxo/<demanda>/`; recusa e diz o que falta. Faça as mesmas perguntas nos terminais do Codex, do OpenCode e do Antigravity: cada um tem que dizer o seu papel fixo (`AGENTS.md`, "Quem é você"), não o de orquestrador.

Se alguma resposta citar regra do protocolo antigo, algo antigo ficou ligado: volte ao Passo 4.

## Passo 6: revisão, merge e limpeza

1. **Revisão da instalação pelo Codex** (só leitura), no terminal do Codex:

   ```text
   Leia AGENTS.md e .agents/personas/tech-lead.md. Você é o revisor. Revise, só lendo, o diff da branch chore/harness-v1 contra a main, à luz de docs/migracao/mapa.md: algo do mapa ficou sem aplicar? Algo antigo continua ligado? Algo foi removido sem decisão no mapa? Grave o parecer em docs/migracao/revisao.md e não edite mais nada.
   ```

   Achado crítico ou alto volta ao Passo 4.
2. **Merge:** o merge da `chore/harness-v1` na `main` é seu.
3. **Limpeza** do que ficou obsoleto e não era regra (pastas mortas, `node_modules` dentro de `.claude`, worktrees velhas): é a **primeira demanda** do projeto migrado, agora dentro do fluxo E0 a E13 (`04-rotina-de-uma-demanda.md`), com SPEC e plano aprovados.
4. **Absorções:** os itens marcados como "absorver" viram mudança no kit (`07-atualizar-o-harness.md`, parte A) e chegam ao projeto numa atualização (parte B).

## Atualizar depois

Quando o harness canônico mudar, siga `07-atualizar-o-harness.md`, parte B.
