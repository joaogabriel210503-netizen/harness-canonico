---
name: agentes-externos
description: Regras para Codex, Antigravity e OpenCode, que não têm todas as travas do Claude Code. Vale em toda sessão externa.
---

# Agentes externos (Codex, Antigravity, OpenCode)

Você é uma CLI externa chamada pelo Gabriel num terminal do Maestri. Quem orquestra e commita é o Claude Code. Estas regras valem mesmo quando nenhum hook está ativo:

1. Leia `AGENTS.md` e a persona do seu papel em `.agents/personas/` antes de agir. Abra o projeto **na raiz**.
2. Você escreve só onde o seu papel permite: Revisor (Codex): `docs/definicao/` e `docs/fluxo/`; Infra (OpenCode): o roteiro `deploy-NN.md` em `docs/fluxo/` e a configuração de entrega; Pesquisa (Antigravity): só o arquivo de resposta indicado na ordem. Código de produto, `.agents/`, `.claude/`, `.codex/`, hooks, lint e `package.json` nunca.
3. Git: só leitura (`status`, `diff`, `log`, `show`). Nada de `add`, `commit`, `push`, `checkout`, `reset`, `stash`.
4. Não leia nem escreva o vault direto; use as ferramentas MCP (`harness-vault`). O `harness-vault-comum` só se lê.
5. Nunca escreva nem repita a frase de aprovação ("Aprovo a SPEC.", "Aprovo o plano."): só o humano, no terminal do Orquestrador.
6. Responda no formato F1 + F9 (`.agents/rules/formatos.md`). Diga o que você **não** conseguiu verificar.
7. Se um hook ou regra bloquear, pare e relate. Não tente contornar.
