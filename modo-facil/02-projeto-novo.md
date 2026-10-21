# Projeto novo

Você cria uma pasta vazia, abre o Maestri nela e conta a sua ideia. O harness leva do nada ao produto: definição, SPEC, plano, código, revisão, conferência no navegador, commit e memória. Pré-requisito: a máquina preparada (`01-maquina-nova.md`) e o kit em `~/development/harness-canonico` (atualize com `git -C ~/development/harness-canonico pull --ff-only`).

O que você faz, em ordem:

1. Criar a pasta.
2. Abrir o Maestri nela, com um terminal do Claude Code.
3. Colar uma frase que instala o harness.
4. Abrir um terminal novo (para começar limpo) e contar a ideia a um segundo terminal, com Codex como tech-lead.
5. Aprovar a SPEC e o plano, olhar o resultado e me mandar o resumo.

Você não precisa saber comando: os poucos que só você pode rodar vêm prontos, começando com `!`. **Depois de rodar um, responda "pronto, continue"**: o agente não percebe sozinho que você terminou.

---

## Passo 1: criar a pasta

No Finder, entre em `~/development` e crie uma pasta nova e **vazia**. Use um nome sem espaço e sem acento, por exemplo `teste-do-zero`. Não coloque nada dentro dela.

## Passo 2: abrir o Maestri na pasta

1. Abra o **Maestri**.
2. Na barra lateral, clique em **+**.
3. Em **Working directory**, escolha a pasta que você criou. Escolha qualquer ícone e confirme. O espaço abre sozinho.
4. Na barra de ferramentas do topo, escolha a ferramenta **Terminal**, clique e arraste na tela para desenhar o terminal.
5. Na janela que aparece, escolha **Claude Code**. Dê o nome **Orquestrador**.

**Não escolha nenhuma responsabilidade (role)** e não mexa em Settings → Agents. Terminal com responsabilidade abre numa pasta escondida do Maestri e não enxerga as travas do harness.

Se o Claude Code perguntar se você confia na pasta, responda que sim.

## Passo 3: instalar o harness

**3a. Libere as travas de regra (só você pode).** O harness protege o `AGENTS.md` e os arquivos de configuração contra edição pelo agente, e a montagem da base precisa escrever neles uma vez. No terminal do Claude Code, digite exatamente (com o `!` no começo, que faz o comando rodar como se fosse você) e dê Enter:

```text
! mkdir -p .claude && touch .claude/liberar-regras
```

**3b. Cole no terminal:**

```text
Leia ~/development/harness-canonico/modo-facil/02-projeto-novo.md e execute a seção "Instruções do agente: montar a base" inteira, nesta pasta. Use o nome da pasta como nome do projeto. Pare no relatório da base.
```

Ele vai pedir o seu "pode" para ler arquivos fora da pasta. Ele também vai te entregar algumas linhas com `!` para você rodar, porque o modo automático não deixa o agente escrever em configuração do Claude Code. Leva alguns minutos. Cada vez que ele te pedir uma linha com `!`, rode e responda "pronto, continue".

No fim ele entrega um relatório com PASSOU ou FALHOU por item. Se algum item falhou, cole o relatório aqui antes de seguir.

Se o relatório disser que um item foi barrado pelo "classificador do modo automático" (`[Self-Modification]`), é normal: o agente não pode escrever em configuração do Claude Code. Ele te entrega a linha pronta, começando com `!`. Rode cada uma no mesmo terminal e confira com `! cat .claude/settings.local.json` que a linha `enabledMcpjsonServers` ficou com `harness-vault` e `chrome-devtools`.

**3c. Religue as travas (obrigatório).** Antes de fechar o terminal, digite:

```text
! rm .claude/liberar-regras
```

Depois digite `! ls .claude` e confira que `liberar-regras` **não** aparece na lista. Enquanto esse arquivo existir, a trava de regras fica desligada. Rode a 3c só depois dos itens que o agente te entregou, porque eles podem precisar da liberação.

## Passo 4: abrir um terminal novo

Este terminal passou a montagem inteira e carrega estado dela. Abra um novo para começar limpo, com as travas, o vault e o Chrome DevTools carregados desde o início:

1. Selecione o terminal e feche com **⌘W**.
2. Crie outro igual ao do Passo 2 (ferramenta **Terminal**, arrastar, **Claude Code**, nome **Orquestrador**, **sem responsabilidade**). Responda que confia na pasta, se perguntar.
3. Cole para conferir que ele está no lugar certo:

```text
Antes de qualquer coisa: rode pwd e me diga o caminho; liste as pastas .claude/hooks e .agents/personas; e diga se existe AGENTS.md na raiz. Não faça mais nada.
```

Esperado: o caminho termina no nome da sua pasta e **não** contém `.maestri`; as duas pastas aparecem; `AGENTS.md` existe. Se aparecer `.maestri`, feche e crie de novo sem responsabilidade.

**Desligar o Playwright só neste projeto.** O Playwright MCP é um servidor seu, de todos os projetos, e o harness usa o agent-browser e o Chrome DevTools no lugar dele. No terminal novo, digite `/mcp`, escolha `playwright` na lista e desabilite. Isso vale só para este projeto. Se o `/mcp` não oferecer a opção, me avise: há um jeito manual (editar o `~/.claude.json` com todos os Claude Code fechados e um backup antes), mas prefiro que você não precise.

## Passo 5: contar a ideia ao tech-lead, no Codex (etapa E0)

**Por que no Codex e não no Claude Code:** o Claude Code é quem orquestra, implementa e commita. A definição do que construir sai melhor de um agente de outra família de modelo, que não vai depois defender o código que o Claude escreveu. O Codex lê o `AGENTS.md` sozinho.

**5a. Crie o terminal do Codex** no mesmo workspace: ferramenta **Terminal**, arrastar, escolha **Codex**, nome **Tech lead**, **sem responsabilidade (role)**. Se ele pedir login, é o da sua assinatura do ChatGPT (só você faz). Se perguntar se confia na pasta, responda que sim.

**5b. Cole no Codex**, trocando o trecho entre colchetes pela sua ideia, em português solto:

```text
Leia AGENTS.md e .agents/personas/tech-lead.md. Você é o tech-lead.
Regras desta sessão, porque você roda sem as travas do harness: escreva somente em docs/definicao/ e em docs/fluxo/; não crie nem edite código, configuração ou qualquer outro arquivo; não use git add nem git commit; não instale pacote. Se precisar de algo fora disso, pare e me pergunte.
Se você não tiver a skill brainstorming do Superpowers, conduza do mesmo jeito: uma pergunta por mensagem, até não restar ambiguidade.
Tenho uma demanda nova: [conte a ideia: o que é, quem usa, o que faz e, se quiser, o que não precisa ter].
Conduza a definição comigo, uma pergunta por vez.
```

Se é só para testar o fluxo, escolha algo pequeno, de 2 ou 3 telas, sem login e sem servidor (lista de compras, controle de gastos do mês, contador de hábitos, cronômetro de estudo, quadro de tarefas). Se não souber o que pedir, use: "quero um app de lista de compras: adiciono itens com nome, quantidade e preço, vejo o total, marco o que já comprei e a lista continua lá quando eu reabro".

O tech-lead pergunta uma coisa por vez. Responda em português simples. Se perguntar algo técnico que você não sabe, diga "decida o mais simples que funcione": a tecnologia é decidida na SPEC, não aqui.

Ao terminar, ele grava `docs/definicao/` (PRD, regras de negócio, contexto e MVP) e o pedido em `docs/fluxo/<demanda>/handoff/pedido.md`, e diz os caminhos. **Anote o caminho do pedido.** Depois volte ao terminal do Claude Code (Orquestrador) para o Passo 6.

**Agentes externos nas outras etapas:** pesquisa, segunda revisão e análise de segurança também podem sair do Claude Code. Isso é montado depois que o fluxo básico funcionar; ver `.agents/adaptadores.md`.

## Passo 6: o orquestrador prepara e escreve a SPEC (E1 a E3)

Volte ao terminal do **Claude Code** (Orquestrador) e cole:

```text
Leia AGENTS.md e .agents/personas/orquestrador.md. Você é o orquestrador.
O pedido está em docs/fluxo/, na única pasta de demanda que existe, em handoff/pedido.md.
Antes da E1, rode git status --short e me diga se aparece alguma alteração fora de docs/: o tech-lead rodou no Codex, sem as travas do harness. Se aparecer, pare e me mostre. Se estiver limpo, comece pela etapa E1.
```

Ele cria a branch de trabalho, consulta o vault, o grafo e a documentação, e escreve a SPEC. Depois **para** e apresenta a SPEC.

## Passo 7: primeira aprovação, a SPEC

1. Peça: `Me diga o caminho exato da SPEC.` Abra o arquivo pelo painel de arquivos do Maestri ou pelo Finder.
2. Leia como gestor: as regras que você deu estão lá? Cada tela tem critérios do tipo "quando eu faço X, acontece Y"? O que fica fora está escrito? A tecnologia escolhida está explicada em linguagem simples, com o motivo?
3. Algo errado: diga o que mudar e espere a nova versão. Pode perguntar "por que essa tecnologia?".
4. Tudo certo: escreva **exatamente** `Aprovo a SPEC.`

"Pode seguir", "ok" e "continua" **não valem**. A aprovação escrita é gravada no `estado.md`; sem ela o agente não consegue escrever código.

## Passo 8: segunda aprovação, o plano

Depois da SPEC ele registra a stack e os comandos em `.agents/stack.md` e escreve o plano em ondas (tarefas pequenas, com os arquivos de cada uma), e para de novo. Leia a tabela de ondas: a ordem faz sentido? Aprove com **exatamente** `Aprovo o plano.`

## Passo 9: execução, você só observa

Para cada onda: os especialistas codam; dois revisores independentes olham; o validador abre o navegador (uma janela do Chrome pode abrir sozinha) e confere as telas; rodam os gates; só então vêm os commits, um por tarefa.

Normal de ver:

- **Mensagem de bloqueio de um hook:** é o harness funcionando; o agente lê, ajusta e segue.
- **Reparo:** se revisão ou gate reprova, abre-se um reparo (tentativa 1, 2, 3). Na terceira falha ele **para** e pergunta a você.
- **Perguntas para você:** responda em português simples.
- **Pedido de liberação para a stack:** logo depois da SPEC, ele preenche `.agents/stack.md`, que é arquivo de regra. Ele vai pedir `! touch .claude/liberar-regras` e, depois de preencher, `! rm .claude/liberar-regras`. É esperado.
- **Pedido de travar os gates de novo:** se uma onda mexer no que define os gates (`tsconfig*.json`, configuração do Vitest, scripts do `package.json`), o pre-commit passa a barrar até você rodar `! node .githooks/travar-gates.mjs`. O orquestrador avisa; confira a mudança antes de travar.

**Não** peça "pula a revisão", "commita logo" nem "faz o push". Ele vai recusar e explicar; isso é o comportamento certo.

## Passo 10: conferir o produto

Quando o orquestrador avisar que a branch está pronta, com a lista de commits:

1. Peça: `Suba o app e me diga o endereço.` Abra o endereço no navegador.
2. Use como usuário: faça o caminho principal, tente dados inválidos (vazio, negativo, texto onde deveria ser número), recarregue a página.
3. O merge na `main` e o push são seus e **não são necessários para o piloto**. Deixe a branch como está.

## Passo 11 (opcional): avaliar o harness

Cole no terminal:

```text
Faça um resumo honesto da demanda para eu avaliar o harness: liste (1) cada vez que um hook bloqueou algo e por quê, (2) cada reparo aberto e em que tentativa fechou, (3) cada decisão que esperou por mim, (4) o que atrasou ou não funcionou, (5) o caminho do relatório final.
```

Me mande esse resumo e o que você achou do app (o que funcionou e o que estava errado). Mais do que o produto, me interessa: onde o fluxo travou, onde foi pesado demais e o que faltou.

## Se algo der errado

- **Caminho com `.maestri` no Passo 4:** feche com ⌘W e crie outro terminal, sem responsabilidade.
- **O agente escreveu código antes da aprovação:** não deveria conseguir. Se conseguiu, me avise com a mensagem exata; é falha do harness.
- **O agente diz que rodou algo e você não viu a saída:** peça `Mostre a saída literal do comando e o código de saída.`
- **Qualquer erro de ferramenta (Chrome, vault, Graphify):** cole a mensagem completa aqui.

---

## Instruções do agente: montar a base

Esta seção é para o Claude Code que recebeu a frase do Passo 3. A sessão começa numa pasta vazia, sem as travas do harness. Elas passam a valer **já nesta sessão**, assim que o instalador cria o `.claude/settings.json` (M2); o terminal seguinte começa limpo, com elas carregadas desde o início.

Regras: nada é simulado. Cada prova traz o comando, a saída literal e o código de saída (`; echo "saída=$?"`). Se um comando for barrado, copie a mensagem literal, pare esse item e marque NÃO TESTADO com o motivo. Não apague nada. Não mexa em `~/.claude/settings.json`. Se um passo anterior falhar, não siga para o próximo.

**M1. Conferir a pasta.** O Gabriel já criou `.claude/liberar-regras` (passo 3a); fora isso a pasta precisa estar vazia: `ls -A` mostra no máximo `.claude` e `.git`, e `ls -A .claude` no máximo `liberar-regras` e `settings.local.json` (este nasce se o Gabriel escolheu "não perguntar de novo" numa permissão). Se tiver mais, pare e avise. Se `.claude/liberar-regras` não existir, peça a ele o passo 3a antes de seguir: sem ele o `rules-guard` barra os passos M3 a M5. Você **não** cria nem apaga esse arquivo; quem apaga é o Gabriel (passo 3c).

**M2. Instalar o harness.** A partir daqui as travas do harness **já valem nesta sessão**: o Claude Code relê o `.claude/settings.json` assim que ele aparece. O `plano-guard` barra a ferramenta Write/Edit em arquivos fora de `docs/`, `.agents/`, `.claude/` e `vault/` (como `package.json`, `tsconfig.json` e `src/`), e o `rules-guard` barra arquivos de regra. Por isso os passos seguintes criam esses arquivos pelo shell (`cat > ... <<'EOF'`), e o que precisa de edição de regra usa a liberação do passo 3a.

```sh
git init -b main
sh ~/development/harness-canonico/instalar-no-projeto.sh "$PWD"; echo "instalador saída=$?"
```

Precisa sair com 0, sem conflito.

**M3. Base TypeScript.** Os gates exigem um projeto npm com TypeScript. A framework (React, Vue, etc.) **não** entra aqui: a SPEC decide e o plano aprovado instala.

```sh
npm init -y
node -e '
const fs=require("fs");
const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const k=JSON.parse(fs.readFileSync(".agents/templates/gates-web/package-scripts.json","utf8"));
for (const c of ["main","keywords","author","license","description"]) delete p[c];
p.name=require("path").basename(process.cwd()); p.private=true; p.type="module";
p.scripts=Object.assign({},k.scripts,{test:"vitest run --passWithNoTests"});
p.devDependencies=Object.assign({},k.devDependencies,{vitest:"^3.0.0"});
fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n");
'
mkdir -p src
printf 'export const base = "harness";\n' > src/base.ts
```

Crie `tsconfig.json` pelo shell (`cat > tsconfig.json <<'EOF'`; a ferramenta Write é barrada pelo `plano-guard`) com este conteúdo:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

Depois `npm install`.

**M4. Constituição.**

- `AGENTS.md`: troque `[NOME DO PROJETO]` pelo nome da pasta, em linguagem normal (ex.: `teste-do-zero` vira `Teste do zero`). Depende da liberação do passo 3a.
- `.agents/stack.md`: preencha só **Pastas de código** com `src`. Deixe `[PREENCHER` nos demais campos (Stack, comando de desenvolvimento, build, endereço local, convenções): a SPEC decide e o orquestrador preenche depois da aprovação dela.

**M5. Ferramentas por projeto.**

- **Graphify** (o grafo do código, que a E2 consulta):

  ```sh
  graphify install --project
  graphify hook install
  graphify update .
  ```

  O `graphify install --project` acrescenta uma seção ao `CLAUDE.md` e um hook ao `.claude/settings.json`. Mostre o `git diff` dos dois e confira que o `@AGENTS.md` continua no `CLAUDE.md`. É esperado que o `.claude/settings.json` fique diferente do kit por causa desse hook: numa atualização futura, o `atualizar` grava a versão nova ao lado como `.kit-novo` e a mesclagem é feita com cuidado (`07-atualizar-o-harness.md`).
- **Servidores MCP do projeto** (o vault e o Chrome DevTools): acrescente ao `.claude/settings.local.json`, por mesclagem e sem apagar o que existir, a chave `"enabledMcpjsonServers": ["harness-vault", "chrome-devtools"]` (no modo universal do vault, acrescente `"harness-vault-comum"`). Se o classificador do modo automático barrar (`[Self-Modification]`), marque FALHOU (barrado), não contorne e entregue ao Gabriel esta linha pronta: `! python3 -c "import json,os;p='.claude/settings.local.json';d=json.load(open(p)) if os.path.exists(p) else {};d['enabledMcpjsonServers']=['harness-vault','chrome-devtools'];json.dump(d,open(p,'w'),indent=2)"`. O Context7 já está instalado na máquina.
- **Plugins que conflitam com o fluxo:** já vêm desligados pelo `.claude/settings.json` do kit (chave `enabledPlugins`). Só confira com `claude plugin list --json`, rodado nesta pasta: `aia-harness`, `feature-dev`, `code-review`, `pr-review-toolkit`, `code-simplifier`, `ui-theme-designer`, `frontend-design`, `gsap-skills` e `github` aparecem desligados (os que estiverem instalados), e `superpowers`, `ponytail`, `ui-ux-pro-max`, `backend-design`, `finecomb` e `qamap` aparecem ligados (as skills pré-carregadas dos agentes dependem deles). O Playwright MCP é de usuário e o Gabriel o desliga pelo `/mcp` (Passo 4): marque NÃO TESTADO aqui.
- **Impeccable:** já está instalado na máquina, sem hook (`01-maquina-nova.md`, bloco 6). Não instale de novo por projeto. Projeto com tela: depois da base, o Gabriel roda `/impeccable init` no Claude Code (cria o `PRODUCT.md`).

**M6. Provas.**

```sh
node .claude/hooks/selftest.mjs > /tmp/base-hooks.log 2>&1; echo "hooks saída=$?"; grep -c '^OK' /tmp/base-hooks.log; grep FALHOU /tmp/base-hooks.log
npm run gates:verify; echo "verify saída=$?"
npm run gates:selftest; echo "selftest saída=$?"
npm run lint; echo "lint saída=$?"
npm run typecheck; echo "typecheck saída=$?"
npm run lint:typed; echo "lint:typed saída=$?"
npm test; echo "test saída=$?"
```

Os sete precisam sair com 0 (rode o autoteste dos hooks depois do Graphify, que altera o `.claude/`). O `grep FALHOU` do fim sai com 1 quando não há falha: esse código não conta. O `doctor` fica para depois da trava (M6b): antes dela o lock ainda diz "só documentação" e ele reprova, com razão.

**M6b. Travar os gates.** Só o humano grava a impressão digital dos gates. Pare e peça ao Gabriel: "Rode `! node .githooks/travar-gates.mjs` e depois `! git add .githooks/gates.lock.json`, e responda pronto". O agente não roda o `travar-gates` (o `rules-guard` barra). Com o "pronto", rode `node .claude/hooks/doctor.mjs; echo "doctor saída=$?"`: precisa sair sem item grave (avisos como gitleaks, grafo e aprovação do MCP são esperados aqui).

**M7. Commit-base.** Nunca `git add .` nem `-A` (as travas proíbem). Liste os caminhos:

```sh
git add -- AGENTS.md CLAUDE.md harness.json .agents .claude .githooks .mcp.json .gitignore .graphifyignore biome.jsonc sem-supressao.mjs eslint.config.mjs eslint.typed.config.mjs eslint-rules selftest.mjs package.json package-lock.json tsconfig.json src vault
git status --short
```

Se o `git status` mostrar mais alguma coisa que não seja `node_modules`, `.claude/settings.local.json` ou `dist`, adicione-a pelo nome (por exemplo `.gitattributes`, se existir; `graphify-out/` é ignorado de propósito, não adicione) e diga no relatório o que adicionou. Depois:

```sh
# commit na main é barrado para o agente: peça ao Gabriel para rodar, no terminal dele,
# e responder pronto:
# ! HARNESS_COMMIT_MAIN=1 git commit -m "chore: base do projeto com o harness canônico"
```

Com o "pronto", confira com `git log --oneline` que o commit existe.

O pre-commit roda o lint; se barrar, corrija e repita, nunca use `--no-verify`.

**Relatório da base.** Tabela PASSOU / FALHOU / NÃO TESTADO por passo (M1 a M7) com a evidência literal, a lista do que foi alterado fora desta pasta (esperado: nada) e a instrução final para o Gabriel, nesta ordem: "Rode `! rm .claude/liberar-regras` e confira com `! ls .claude` que o arquivo sumiu (passo 3c); depois feche este terminal com ⌘W, crie outro e siga o Passo 4."
