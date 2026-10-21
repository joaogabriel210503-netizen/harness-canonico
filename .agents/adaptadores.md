# Adaptadores: o que cada CLI lê e o que se perde em cada uma

A fonte da verdade é `AGENTS.md` e `.agents/`. Cada CLI chega nela por um caminho. Onde a CLI não tem o mecanismo, a trava vira regra escrita mais conferência do orquestrador, e isso está dito.

Conferido na documentação de cada ferramenta em 6 de outubro de 2026 e revisto no adendo v1 de 20 de outubro de 2026. "Não confirmado" quer dizer que não encontrei na documentação; não quer dizer que não existe.

| | Claude Code | Codex | Antigravity | OpenCode |
|---|---|---|---|---|
| Lê `AGENTS.md` | Sim, por `CLAUDE.md` com `@AGENTS.md` | Sim, nativo | Sim, nativo | Sim, nativo |
| Lê `.agents/` sozinho | Não | `.agents/skills` | `.agents/rules/*.md` (só o primeiro nível) e `.agents/AGENTS.md` | Não confirmado |
| Subagentes | `.claude/agents/*.md` | `.codex/agents/*.toml` | Não confirmado | Não confirmado |
| Hooks | `.claude/settings.json`, completos | `.codex/hooks.json` (`hooks = true`); hook novo ou alterado pede revisão na primeira execução | Não confirmado | Plugin em `.opencode/plugin/` (API v2: `export default` com `id`+`setup`, registro por `ctx.tool.hook("execute.before")`) |
| Superpowers | Plugin | Plugin | Plugin | Instalação por instrução |
| Servidores MCP | `.mcp.json` | `config.toml` | Configuração própria | `opencode.json` |

## Quem faz o quê (adendo v1, seção 3)

| Papel | Agente | Etapas | Cuidado |
|---|---|---|---|
| Orquestrador e implementação | Claude Code | E1 a E13 (código só por subagentes) | Único com todas as travas mecânicas; nunca revisa o próprio código; único que commita |
| Tech lead e revisor | Codex | E0 (conduz a definição, **não escreve a SPEC**, DP-21); E3b (revisa a SPEC antes da aprovação, DP-22); E10 (revisão final, com dois subagentes próprios, código e segurança, **sempre Forte**) | Sem hooks do harness até a W8: escreve só em `docs/definicao/` e `docs/fluxo/`; o orquestrador roda `git status --short` depois |
| Pesquisa e apoio geral | Antigravity | Pesquisa, material de apoio (DP-27) | **Não é revisor.** Fonte e data em cada afirmação; o orquestrador confere antes de usar |
| Infra e deploy | OpenCode | E13: roteiro `deploy-NN.md` (persona `devops-engineer`); análises de infraestrutura | Não executa deploy: o humano executa. Sem hooks do harness |

Quem revisa não é da mesma família de modelo de quem implementou: o Claude Code implementa; o Codex revisa a SPEC e a branch. É **hipótese a medir no piloto**, não resultado de benchmark.

Regras de todo agente externo:

1. Sem hooks do harness, a trava é a instrução do prompt mais a conferência do orquestrador (`git status --short` e `git diff --stat` depois de cada sessão externa).
2. Revisão e pesquisa são **somente leitura**, exceto o arquivo de relatório que entregam.
3. Nada de `git add`, `git commit` ou instalação de pacote fora do orquestrador.
4. O resultado volta por **arquivo** e resposta no formato F9 (`.agents/rules/formatos.md`).
5. O `maestri ask` só entrega entre terminais conectados e leva só o caminho do arquivo. A frase de aprovação nunca viaja nele.
6. Codex, Antigravity e OpenCode como destinatários do `maestri ask` ainda **não foram testados**; até testar, o Gabriel cola o prompt no terminal externo.

## O que isso significa na prática

- **Claude Code** é a única CLI em que todas as travas são mecânicas. Por isso orquestra e implementa.
- **Codex** lê a constituição sem adaptação e pode ter travas próprias (W8).
- **Antigravity** e **OpenCode** obedecem às regras por instrução e entram em papéis de leitura ou de preparo, em sessões curtas.
- **O pre-commit do git** vale para todos, porque não depende de CLI.

## Cuidado com o Maestri

Testado em 6 de outubro de 2026, no Maestri real, com um hook `SessionStart` de prova:

- Terminal **sem** responsabilidade, apontando para a raiz do projeto: o hook disparou.
- Terminal **com** responsabilidade (role): o hook **não** disparou. O Maestri inicia a CLI em `.maestri/roles/<uuid>/`, e o `AGENTS.md` carregado é o gerado por ele.

**Regra: nunca atribuir responsabilidade do Maestri a um terminal que roda o harness.** Terminal sempre puro (DP-26, `maestri/papeis.md`), aberto na raiz do projeto (DP-28). A persona vem do primeiro prompt, com `.agents/personas/`.

### Mensagem entre terminais com o destinatário ocupado

Testado em 6 de outubro de 2026, Claude Code para Claude Code: só entrega entre terminais **conectados** (sem conexão falha na hora); destinatário ocupado recebe e trata em cerca de 5 segundos, sem perda. Uma rodada, dois terminais do mesmo fornecedor. Mensagem importante deve pedir confirmação por escrito em arquivo, e quem orquestra confere.

## Arquivos de adaptação

**Claude Code (feito):** `kit-claude-code/` (`dot-claude/`, `dot-mcp.json`), instalados como `.claude/settings.json`, `.claude/hooks/`, `.claude/agents/` (onze personas, apontando para `.agents/personas/`), `.mcp.json` e `.githooks/`. Ver `.claude/README.md`.

**Codex (W8, `kit-codex/dot-codex/` → `.codex/`):** `config.toml` (hooks ligados, subagentes com profundidade 1 e os servidores do vault), `hooks.json` (PreToolUse com matcher `.*` — vê toda ferramenta, inclusive o `exec` do modo código — chamando `.claude/hooks/guarda-externa.mjs codex tech-lead`), `agents/code-reviewer.toml` e `agents/security-reviewer.toml` (E10: somente leitura, nível Forte, devolvem o relato na resposta e o tech-lead salva) e `rules/harness.rules` (git push, commit, add e afins proibidos pela execpolicy).

**OpenCode (W8, `kit-opencode/` → `.opencode/` e `opencode.json`):** plugin `harness-guard.ts` (API v2 do OpenCode 2.x) que chama a mesma guarda com o papel `devops-engineer`, e `permission` do `opencode.json` negando git que muda a árvore.

**Antigravity:** sem hook confirmado. Vale `.agents/rules/agentes-externos.md` (carregada como regra do workspace) e a conferência do orquestrador.

**O `_comum` do vault fora do Claude Code (DP-02b):** no Codex, o servidor `harness-vault-comum` só expõe `search_notes_tool` e `read_note_tool` (`enabled_tools`); no OpenCode, a guarda bloqueia qualquer ferramenta `harness-vault-comum_*` que escreva; no Antigravity, só a regra escrita.

### O que foi provado e o que não foi (20/10/2026)

| | Provado com a CLI real | Não provado |
|---|---|---|
| Codex 0.163.0 | `execpolicy check` aplica as regras (push, commit, checkout proibidos; `rm -rf` pede confirmação). `codex doctor`: configuração carregada, dois servidores MCP lidos, e avisa a variável do vault ausente | Hook disparando numa sessão com modelo (sem credencial no ambiente de prova); formato exato de `tool_input` do `apply_patch`; subagentes `.toml` sendo despachados |
| OpenCode 1.19.3 | `opencode debug config` carrega `opencode.json` e o plugin | Plugin disparando dentro de uma sessão com modelo; se `tool.execute.before` cobre ferramentas de subagente |
| Antigravity | nada | tudo |
| Guarda externa | Selftest com eventos simulados no formato documentado; plugin do OpenCode chamado com eventos simulados | Os mesmos eventos vindos da CLI real |

Quando o Gabriel abrir cada CLI de verdade, o primeiro teste é: pedir uma escrita em `src/` e um `git commit` e ver o bloqueio. Se não bloquear, a CLI mudou o formato do evento: ajuste `normalizar()` em `guarda-externa.mjs` e rode o selftest.

**Modo código do Codex (teste-mac 20/10).** O Codex 0.163.0 não chama `apply_patch` direto: no modo código a ferramenta `exec` recebe JavaScript que chama `tools.apply_patch("*** Begin Patch...")` e `tools.exec_command({cmd})`. Por isso o matcher do `hooks.json` é `.*` (vê o `exec`) e o `normalizar()` extrai do JS os caminhos do patch (viram eventos Write, conferidos pelo escopo) e os comandos do `exec_command` (viram Bash, conferidos pela trava do git). **Ainda falta provar com o Codex confiado:** o hook só roda depois de confiar no projeto e no hook em `~/.codex/config.toml`, e a confiança do hook não foi gravada no teste. O `doctor` confere essa confiança.

**Plugin do OpenCode na v2 (teste-mac 20/10).** O OpenCode 2.0.22 mudou a API: o plugin v1 (export nomeado devolvendo `{ "tool.execute.before": ... }`) **não carrega** e o OpenCode segue **sem a guarda** (falha aberta, só um aviso no log). O `harness-guard.ts` foi reescrito para a v2 (`export default` com `id`+`setup`, `ctx.tool.hook("execute.before")`). O escopo também passou a relativizar o caminho (o OpenCode manda o `path` absoluto). **Não provado com um modelo rodando.**

### Versões

`.agents/versoes.json` guarda a versão testada de cada CLI. O `doctor` avisa quando a instalada difere. Atualizar uma CLI é refazer a prova acima.

## Mapa de níveis para modelos (DP-14, DP-18)

Preenchido pelo assistente em 20/10/2026 e corrigido pelo Gabriel quando discordar. Nomes de modelo mudam: confira no seletor da própria CLI antes de fixar. A revisão final do Codex (E10) é sempre **Forte**.

| Nível | Claude Code (parâmetro `model` do despacho) | Codex (`model` no `config.toml` ou `--model`) | OpenCode (`provider/model-id`) | Antigravity |
|---|---|---|---|---|
| Leve | `haiku` | `gpt-5.4-mini` | modelo pequeno do provedor que o Gabriel usar | opção rápida (Flash) do seletor |
| Médio | `sonnet` | `gpt-5.4` com `model_reasoning_effort = "medium"` | modelo médio do provedor | opção padrão do seletor |
| Forte | `opus` | `gpt-5.5` (só com login ChatGPT) ou `gpt-5.4` com `model_reasoning_effort = "high"` | modelo forte do provedor, variante de raciocínio `high` | opção Pro do seletor |

Notas:
- **Claude Code:** `fable` e o nível acima do `opus` existem, mas só o Gabriel autoriza (custo). O `despacho-guard` exige o parâmetro `model` em todo despacho.
- **Codex:** nomes conferidos numa fonte de 03/05/2026 (Daniel Vaughan, "Codex CLI Model Landscape"); podem ter mudado. `gpt-5.5` não funciona com chave de API, só com login ChatGPT: para execução sem login, use `gpt-5.4` com esforço alto. Subagentes do Codex aceitam `model` na tabela `[agents]`. O esforço de raciocínio é `low | medium | high | xhigh`.
- **OpenCode:** o modelo é `provider/model-id`; esforço de raciocínio por `reasoningEffort` em `provider.<p>.models.<m>.options`, ou variantes nomeadas (fonte: opencode.ai/docs/models). O Gabriel diz qual provedor usa; até lá não há nome fixo.
- **Antigravity:** o seletor mostra os modelos disponíveis na conta e eles mudam; a regra é a mesma (Leve só para o mecânico, Forte para segurança e arquitetura). O Gabriel confirma os nomes quando abrir a ferramenta.
