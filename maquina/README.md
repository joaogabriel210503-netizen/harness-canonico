# maquina/

A minha configuração de máquina, exportada sem segredo, para restaurar num computador novo.

**Ainda não exportada.** Para preencher esta pasta, rode a Parte A de `modo-facil/01-maquina-nova.md` na máquina atual.

Depois da exportação, esta pasta tem:

| Arquivo | O que é | Usado em |
|---|---|---|
| `plugins.json` | Os plugins do Claude Code (`id`, escopo, ligado ou não) | Máquina nova, bloco 5 |
| `marketplaces.json` | De onde vêm os plugins (marketplaces e a origem de cada um) | Máquina nova, bloco 5 |
| `mcp-usuario.md` | Servidores MCP de usuário: nome, comando e nome das variáveis (valores em `<oculto>`) | Referência ao reinstalar |
| `claude-global/CLAUDE.md`, `RTK.md` | As instruções globais do Claude Code | Máquina nova, bloco 5 |
| `claude-global/settings.json` | `~/.claude/settings.json` sem `env`, sem `hooks` e sem nada de autenticação | Máquina nova, bloco 5 |
| `rtk-config.toml` | A seção `[hooks]` do RTK (os comandos que ele nunca comprime) | Máquina nova, bloco 2 |
| `ferramentas.md` | Cada ferramenta, a versão e como foi instalada | Conferência |

Regra: nada aqui pode ter segredo. A exportação passa pela varredura de segredo antes de você commitar, e qualquer valor sensível vira `<oculto>`.
