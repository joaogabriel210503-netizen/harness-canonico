# BOOTSTRAP: para o agente que recebeu "leia o repositório harness-canonico"

O Gabriel te apontou para este repositório. Ele é o ambiente de desenvolvimento com IA dele: o **harness** (constituição, regras, travas e o fluxo E0 a E13) que é instalado **dentro** de cada projeto, mais os guias para preparar uma máquina.

**Este repositório não é o projeto em que você vai trabalhar.** O `AGENTS.md` daqui é o **modelo** da constituição que vai para os projetos: não o trate como regra da tarefa de agora. Não edite nada aqui, a não ser que o pedido seja manter o próprio kit.

Os guias de instalação são escritos para o **Claude Code**, que é o orquestrador. Se você é Codex, OpenCode ou Antigravity, diga ao Gabriel que a instalação é feita no Claude Code e, se ele pedir outra coisa, siga o seu papel fixo (`AGENTS.md`, seção "Quem é você").

## 1. Tenha o kit na máquina, sempre em `~/development/harness-canonico`

- Existe `~/development/harness-canonico`? Atualize: `git -C ~/development/harness-canonico pull --ff-only`.
- Não existe? Clone **nesse caminho** (nunca dentro da pasta atual): `gh repo clone harness-canonico ~/development/harness-canonico`.
- O repositório é **privado**. Se o `gh` não estiver instalado ou logado, pare: a máquina ainda não foi preparada. Mostre ao Gabriel a Parte B de `modo-facil/01-maquina-nova.md` (são quatro blocos que só ele cola).

## 2. Descubra o caso

Confira na ordem da tabela: **a primeira linha que casar vale.** Se não der para saber, faça **uma** pergunta com as opções da tabela.

| # | Situação | Como reconhecer | Siga |
|---|---|---|---|
| 1 | A pasta atual é o próprio kit | é `~/development/harness-canonico` (tem `kit-claude-code/` e `instalar-no-projeto.sh`) | manter o kit: `modo-facil/07-atualizar-o-harness.md`, parte A |
| 2 | Máquina não preparada | falta qualquer um destes: `node` 22, `uv`, `graphify`, `agent-browser`, `rtk` (`command -v`) | `modo-facil/01-maquina-nova.md`, Parte C |
| 3 | Projeto novo | a pasta atual está vazia (no máximo `.git` e `.claude/`) | `modo-facil/02-projeto-novo.md` |
| 4 | Projeto que já tem este harness | tem `harness.json` na raiz | demanda nova: `modo-facil/04-rotina-de-uma-demanda.md`; versão nova do kit: `modo-facil/07-atualizar-o-harness.md`, parte B |
| 5 | Projeto com outro protocolo de IA | tem `CLAUDE.md` com regras longas, `.claude/hooks`, `.claude/agents`, skills, memória ou vault próprios | `modo-facil/05-migrar-projeto-que-ja-tem-harness.md` |
| 6 | Projeto em andamento, sem harness | tem código e nada das linhas 4 e 5 | `modo-facil/03-projeto-em-andamento.md` |

Os plugins (`superpowers`, `ponytail`, `ui-ux-pro-max`, `backend-design`, `finecomb`, `qamap`) também fazem parte de uma máquina preparada. Confira com `claude plugin list --json` se puder; dentro de um projeto com o harness, a trava de CLI aninhada barra esse comando, e aí basta a conferência das ferramentas.

## 3. Siga o guia

Leia o guia inteiro antes de agir.

- Guia com uma seção **"Instruções do agente"** (`01`, `02`, `03`): execute essa seção. Ela traz as provas que cada passo precisa mostrar.
- Guia que é **do Gabriel** (`04`, `05`, `07` parte B): mostre a ele o próximo passo e o prompt que ele cola, e conduza só a parte que o guia dá ao Claude Code. Na `04`, a definição (E0) é do Codex, não sua.

## Regras para você, em qualquer caso

- **Instalar ou mudar configuração global:** mostre os comandos e espere o "pode" do Gabriel.
- **Login** (`gh`, Claude, Codex, OpenCode, Context7, apps): é do Gabriel. Pare e avise.
- Quando pedir ao Gabriel uma linha com `!`, espere ele responder "pronto": você não vê sozinho que ele terminou.
- **Nunca** imprima nem grave segredo (token, chave, senha, valor de `.env`).
- `travar-gates`, merge, push e execução de deploy são do Gabriel.
- Antes de qualquer mudança grande num projeto com banco, lembre o Gabriel do backup do banco.
- Nada é simulado: mostre a saída real e o código de saída de cada prova.
- Se um passo falhar, pare nele e mostre o erro inteiro. Não improvise outro caminho.
