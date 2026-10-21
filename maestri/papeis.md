# Terminais do Maestri (versão 3)

Quatro terminais **puros**: nenhum com "responsabilidade" (role) do Maestri. O role abre a CLI numa subpasta `.maestri/roles/<uuid>/`, e aí os hooks e o `AGENTS.md` do projeto não são carregados (provado em 18/10/2026). A persona é dada pelo primeiro prompt da sessão, com o texto de `maestri/notas/`. Nome, ícone e cor do terminal podem ser usados à vontade.

Regra de abertura (DP-28): cada terminal abre **na raiz do projeto**. Sessão aberta fora da raiz não tem nenhuma trava. Antes da primeira demanda, rode `node .claude/hooks/doctor.mjs`.

| Terminal (nome) | CLI | Papel | Comando de abertura (na raiz) | Lê primeiro | Formato de saída |
|---|---|---|---|---|---|
| Orquestrador | Claude Code | Orquestra E1 a E13, implementa por subagentes, commita | `claude` | `AGENTS.md`, `.agents/personas/orquestrador.md`, `estado.md` | F1 em toda resposta; F10 ao fechar etapa |
| Revisor | Codex | Tech lead (E0: recebe ou conduz a definição), revisão da SPEC (E3b), revisão final (E10) | `codex` | `AGENTS.md`, `.agents/personas/tech-lead.md`, `estado.md` | F1; F9 (achados em F4) |
| Pesquisa | Antigravity | Pesquisa e apoio geral. **Não é revisor** | abrir o projeto na raiz no Antigravity | `AGENTS.md`, a ordem | F1; F9 com fontes |
| Infra | OpenCode | Infraestrutura e roteiro de deploy (E13) | `opencode` | `AGENTS.md`, `.agents/personas/devops-engineer.md`, a ordem | F1; F9 |

Para dar o papel: cole no primeiro prompt o texto de `maestri/notas/<papel>.md` (ou crie uma nota bloqueada no canvas e ligue ao terminal).

## Como os terminais conversam

- `maestri ask "<terminal>" "ordem: <caminho>"` só entrega entre terminais conectados e leva **apenas o caminho** de um arquivo. Confira os nomes com `maestri list`.
- **A frase de aprovação não trafega.** "Aprovo a SPEC." e "Aprovo o plano." são digitadas pelo humano no terminal do Orquestrador. O `rules-guard` bloqueia `maestri ask` e `SendMessage` com essas frases.
- O agente externo age quando o humano, no terminal dele, manda executar a ordem. O resultado volta por arquivo e resposta F9; o Orquestrador confere com `git status --short` e `git diff --stat`.
- Nota bloqueada com as regras: `maestri/notas/regras.md`, ligada aos quatro terminais.
