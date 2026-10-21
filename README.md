# Harness canônico

O meu ambiente de desenvolvimento com IA como motor. Aqui ficam as regras, as travas e o fluxo que eu instalo em cada projeto (uma demanda informal vira definição, SPEC, plano, código revisado e commit, sempre pelo mesmo caminho) e os guias para montar uma máquina do zero.

Funciona com quatro agentes lado a lado no Maestri: **Claude Code** orquestra e implementa, **Codex** define e revisa, **OpenCode** prepara o deploy e **Antigravity** pesquisa.

Repositório privado. Não contém segredo.

## Por onde começar

| Quero... | Guia |
|---|---|
| Preparar um computador novo | [`modo-facil/01-maquina-nova.md`](modo-facil/01-maquina-nova.md) |
| Começar um projeto do zero | [`modo-facil/02-projeto-novo.md`](modo-facil/02-projeto-novo.md) |
| Pôr o harness num projeto que já está andando | [`modo-facil/03-projeto-em-andamento.md`](modo-facil/03-projeto-em-andamento.md) |
| Tocar uma demanda num projeto que já tem o harness | [`modo-facil/04-rotina-de-uma-demanda.md`](modo-facil/04-rotina-de-uma-demanda.md) |
| Migrar um projeto que usa outro protocolo de IA | [`modo-facil/05-migrar-projeto-que-ja-tem-harness.md`](modo-facil/05-migrar-projeto-que-ja-tem-harness.md) |
| Testar a instalação nesta máquina | [`modo-facil/06-teste-no-mac.md`](modo-facil/06-teste-no-mac.md) |
| Publicar uma mudança no kit, ou levar a versão nova aos projetos | [`modo-facil/07-atualizar-o-harness.md`](modo-facil/07-atualizar-o-harness.md) |
| Diagnosticar a máquina (só leitura) | [`modo-facil/08-diagnostico-da-maquina.md`](modo-facil/08-diagnostico-da-maquina.md) |

Cada guia tem os prompts prontos para colar: você não digita comando, só cola, aprova e decide.

### Atalho: mandar um agente ler este repositório

Em qualquer pasta, abra o Claude Code e cole:

```text
Clone ou atualize o meu repositório privado harness-canonico em ~/development/harness-canonico (gh repo clone harness-canonico ~/development/harness-canonico, ou git pull se já existir) e siga o BOOTSTRAP.md dele para esta pasta.
```

O agente clona (ou atualiza) o kit em `~/development/harness-canonico`, descobre se é máquina nova, projeto novo, projeto em andamento, migração ou atualização, e segue o guia certo. Ver [`BOOTSTRAP.md`](BOOTSTRAP.md).

## O que tem aqui

| Caminho | O que é |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `.agents/` | A constituição, o fluxo, as regras, as personas e os modelos de documento que vão para cada projeto |
| `kit-claude-code/` | O que vira `.claude/` no projeto (hooks, os nove agentes com as skills pré-carregadas, o `settings.json` com os plugins conflitantes desligados) e `.mcp.json` |
| `kit-codex/`, `kit-opencode/` | As travas e as regras do Codex e do OpenCode |
| `.githooks/` | Pre-commit e pre-push que valem para qualquer CLI (gates, segredo, `gates.lock`) |
| `instalar-no-projeto.sh` | O instalador. Nunca sobrescreve: o que já existe e difere vira conflito listado |
| `harness.json`, `VERSAO` | Versão e impressão digital do kit, usadas pelo `verificar` e pelo `atualizar` |
| `maestri/` | Os quatro terminais e como abri-los |
| `maquina/` | A minha configuração exportada (plugins, MCP, `CLAUDE.md` global), para restaurar num computador novo |
| `modo-facil/` | Os guias. `historico/` guarda os roteiros da construção, já substituídos |
| `docs/` | As decisões, as provas e o registro de construção do próprio harness |

## O fluxo

E0 Entrada da demanda (você, em conversa separada com Superpowers, ou o Codex `tech-lead`; o `tech-lead` recebe) → E1 Preparação → E2 Consulta prévia → E3 SPEC → E3b Revisão da SPEC (Codex) → **aprovação da SPEC** → E4 Plano → **aprovação do plano** → E5 Wave → E6 Revisão interna → E7 Navegador → E8 Gates → E9 Commit → E10 Revisão final (Codex) → E11 Memória → E12 Merge (você) → E13 Deploy (OpenCode prepara, você executa). Mudança pequena pode seguir o caminho curto C1. Detalhe em `.agents/fluxo.md`; o que cada etapa precisa gerar está em `.agents/entregas.md`.

As duas aprovações são frases exatas, só suas: `Aprovo a SPEC.` e `Aprovo o plano.`

## Os quatro terminais do Maestri

| Terminal | CLI | Faz |
|---|---|---|
| Orquestrador | Claude Code | E1 a E9 e E11; despacha as personas |
| Revisor | Codex | E0 (recebe a definição, ou a conduz), E3b e E10 |
| Pesquisa | Antigravity | Pesquisa e apoio geral |
| Infra | OpenCode | E13: roteiro de deploy |

Os terminais ficam sem papel (role) atribuído e abertos na raiz do projeto. Ver `maestri/papeis.md`.

## Situação

Versão `1.0.0-rc.1`. As nove ondas de construção estão feitas. As travas do Claude Code foram provadas no Claude Code real e num teste de instalação limpa no Mac (`docs/inventario/2026-10-20-teste-mac.md`). As travas do Codex e do OpenCode estão escritas e cobertas pelo selftest, mas ainda não foram provadas com um modelo rodando; o Antigravity não tem hook, só a regra escrita. Falta o piloto de ponta a ponta na Central SLON. O registro está em `docs/fluxo/harness-v1/estado.md`.

## Manutenção do kit

Mudou algo no kit: rode `node kit-claude-code/dot-claude/hooks/harness-manifesto.mjs gerar .` e `node kit-claude-code/dot-claude/hooks/selftest.mjs` (precisa terminar sem falha) antes de commitar. O passo a passo, com a varredura de segredo e a subida da versão, está em [`modo-facil/07-atualizar-o-harness.md`](modo-facil/07-atualizar-o-harness.md), parte A.

Baseado no [vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit); o que é igual e o que é diferente está em `.agents/origem.md`.
