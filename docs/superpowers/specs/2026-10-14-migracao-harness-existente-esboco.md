# Migração de um projeto que já tem harness: esboço

- **Data:** 14 de outubro de 2026
- **Situação:** **esboço, não aprovado.** Guarda a ideia para depois. Vira SPEC própria (brainstorming do Superpowers) e plano próprio (writing-plans) só quando o harness novo estiver provado no piloto, de E0 a E13.
- **Atualização de 20/10/2026:** o guia operacional já existe em `modo-facil/05-migrar-projeto-que-ja-tem-harness.md`. Esta página continua sendo o esboço de SPEC da migração da Central, a escrever depois do piloto.
- **Primeiro alvo previsto:** o ecossistema Central ISO (hub `Central ISO`, módulos `Mod. Frete`, `Mod. Agend`, `Mod. CTP-ATP`, cofre `Central ISO Knowledge` e o produto `Central ISO Harness`).

## Objetivo

Levar um projeto que já tem regras, hooks, agentes e memória próprios para o harness novo, **sem perder** o que ele tem de bom, **sem misturar** com mudança de produto e **sem deixar** regra antiga viva em paralelo com a nova.

## Quem conduz

- **Claude Code** com o modelo mais forte disponível e esforço máximo, porque a migração exige ler o repositório inteiro e decidir item por item.
- Processo do Superpowers: **brainstorming** para fechar as dúvidas com o Gabriel, **SPEC aprovada**, **writing-plans** com waves, **execução** pelo fluxo E0–E13.
- **Codex** revisa a migração no fim (E10), como qualquer demanda.
- O Gabriel aprova a SPEC, o plano e o merge.

## Princípios

1. **Inventário antes de tudo**, só leitura: o que o projeto tem de harness, onde está, o que está ligado e o que está morto.
2. **Mapa de equivalência:** cada hook, regra, agente, script e nota de memória antigo recebe uma decisão (mantém como está, substitui pelo equivalente novo, absorve no canônico porque é melhor, ou remove), com o motivo.
3. **Ensaio antes de aplicar:** a ferramenta de sincronização do harness novo mostra a diferença (dry-run) e só aplica com aprovação.
4. **Commits separados:** harness em commit próprio (`chore(harness): …`), nunca junto com produto nem com limpeza antiga.
5. **Branch dedicada** e backup do banco quando houver, antes de qualquer mudança.
6. **Uma regra viva de cada vez:** ao fim, nenhum hook ou regra antigo continua ativo em paralelo com o novo.
7. **Prova por teste:** o teste de aceitação do harness novo roda em cada repositório migrado, e cada agente responde o que se espera dele.

## Fases previstas

1. Inventário do harness existente (por repositório e pelo ecossistema).
2. Mapa de equivalência antigo → novo, aprovado pelo Gabriel.
3. SPEC da migração.
4. Plano em waves, por repositório e na ordem de dependência (o cofre e o canônico antes dos consumidores).
5. Aplicação repositório a repositório, com sincronização em ensaio, revisão e aplicação.
6. Teste de aceitação em cada repositório.
7. Limpeza do que ficou obsoleto, em onda própria.

## O que a auditoria de 14 de outubro já mostrou e a migração vai ter que tratar

Detalhes em `docs/inventario/2026-10-14-comparacao-central-iso.md` e nos relatórios da auditoria profunda.

- Hooks escritos e não registrados no `settings.json` (25 só no hub).
- Aprovação antiga (28 de setembro) ainda liberando edição no hub.
- `Central ISO Harness` fora do git e `Central ISO Knowledge` sem remoto.
- `.claude/scripts` com `node_modules` dentro (341 MB por repositório) e `.claude/worktrees` com 1,4 GB no hub.
- Constituição em `.central-iso/instructions/`, sem `AGENTS.md` na raiz do repositório (Codex, Antigravity e OpenCode provavelmente não carregam as regras).
- Plugins ligados no projeto que conflitam com o fluxo (`aia-harness`, `pr-review-toolkit`, `code-review`).
- Cofre compartilhado por link simbólico fora do git, dependente do caminho `~/Desktop/Projetos`.

## Perguntas que a SPEC da migração vai ter que responder

- O cofre do ecossistema continua único (compartilhado entre os repositórios) ou cada repositório ganha o seu?
- O grafo global do ecossistema continua? Quem o atualiza?
- A raiz controladora (`~/Desktop/Projetos`) continua existindo no modelo novo?
- O que da engenharia do `Central ISO Harness` (sincronização, diagnóstico, aprovação por hash) já terá sido absorvido pelo harness novo, e o que é aposentado?
