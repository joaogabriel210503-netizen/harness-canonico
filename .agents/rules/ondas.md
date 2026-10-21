---
trigger: always_on
description: Execução em ondas paralelas de subagentes
---

# Execução em ondas paralelas

Adaptada de `templates/rules/parallel-subagent-driven-development.md` do vibe-coding-toolkit. A diferença está na ordem: aqui a revisão, a validação e os gates acontecem **antes** do commit. Ver `.agents/origem.md`.

## Onde cada agente roda

- **Personas implementadoras e revisoras:** subagentes nativos do Claude Code, despachados pela orquestradora **dentro da mesma sessão**. Mesmo processo, mesmo diretório, mesmos hooks e `settings.json`. É o caminho padrão de toda wave.
- **Terminal externo (Maestri):** só para o que precisa de uma cabeça de outro fornecedor — Codex na definição (E0), na revisão da SPEC (E3b) e na revisão final (E10), OpenCode no roteiro de deploy (E13) — ou pesquisa (Antigravity) que não deve poluir o contexto da orquestradora. Sempre apontado para a raiz do projeto (ou o Andar da demanda) e **sem responsabilidade (role) atribuída**; o motivo está em `.agents/adaptadores.md`.

## Por que é seguro rodar em paralelo

Os dois riscos do paralelismo saem por estrutura, não por disciplina:

- **Colisão de arquivo:** uma wave só reúne tarefas cujos conjuntos de arquivos são totalmente disjuntos.
- **Corrida de commit:** implementador nunca commita. Só o orquestrador, uma tarefa por vez, depois que a wave passou por tudo.

## Marcação de cada tarefa

No plano, toda tarefa (título `### T01 ...`) tem seis campos. O `plano-guard` confere `Files:` e `Resources:`: sem eles o plano aprovado não libera código, e só os arquivos listados em algum `Files:` podem ser editados:

- **ID:** curto e estável (`T01`, `T02`).
- **Files:** os caminhos que a tarefa cria ou altera, **entre crases**, separados por vírgula. Aceita pasta (`src/lib/`) e glob (`src/lib/**`, `src/*.ts`). Na dúvida, liste mais.
- **Resources:** o que a tarefa usa de compartilhado e que duas tarefas em paralelo não podem disputar (banco, porta, arquivo gerado, serviço externo). `nenhum` se não há.
- **Depends-on:** IDs das tarefas de que ela precisa, ou `none`.
- **Owner:** a persona responsável, com o nome exato da tabela do `AGENTS.md`.
- **Verificação:** o comando, teste ou comportamento observável que prova que ficou pronto. "Deve funcionar" não é verificação.

Campo ausente ou incerto: a tarefa passa a depender de tudo que veio antes. Ela degrada para execução serial em vez de arriscar um falso paralelo.

## Formação das waves

Duas tarefas ficam na mesma wave só se as duas condições valerem:

1. Nenhuma depende da outra, nem por meio de uma terceira.
2. Os conjuntos `Files:` não têm nenhum arquivo em comum. A regra é por arquivo, não por trecho.

Falhou uma, a tarefa vai para uma wave posterior. Wave de uma tarefa só é resultado correto, não falha. Duas tarefas que tocam o mesmo arquivo por coincidência: prefira fundi-las em uma.

## Ciclo de cada wave

1. O orquestrador escreve um arquivo de passagem por tarefa (`templates/handoff.md`).
2. Despacha todos os implementadores da wave **numa única mensagem**. É o único ponto de paralelismo real.
3. Cada implementador faz a tarefa, roda os três gates, e reporta: arquivos tocados, saída dos gates, o que ficou de fora. Não commita.
4. **Revisão** (E6): os dois revisores, juntos e independentes. Cada um olha os arquivos listados em `Files:` de cada tarefa, no estado atual da árvore de trabalho.
5. **Validação visual** (E7), se a wave toca tela: é do `validador-visual`, com agent-browser e Chrome DevTools.
6. **Gates** (E8) da wave inteira.
7. **Commit** (E9): o orquestrador commita uma tarefa por vez, na ordem da wave.
8. Um único registro no `estado.md` para a wave inteira, feito pelo orquestrador. Nunca um registro por tarefa escrito por agentes diferentes.

Reprovou em 4, 5 ou 6: abre reparo (`rules/reparo.md`). A wave só commita quando tudo passou.

## Tarefa de contrato

Quando dois implementadores dependem um do outro (uma API que um escreve e o outro consome, um tipo compartilhado), o plano abre antes uma tarefa de contrato: só a interface (tipos, assinatura, formato de resposta), pequena, em wave própria e commitada. As tarefas dependentes entram na wave seguinte e leem o contrato, não o código um do outro.

## Continuidade de execução

Um bloqueio (`BLOQUEADA`, `PRECISA_CONTEXTO`) para só a tarefa bloqueada e as que dependem dela, direta ou indiretamente. As tarefas independentes da mesma wave seguem e completam E5 a E9. O orquestrador registra o bloqueio no `estado.md` e chama o humano só com o que está parado, sem parar o resto.

## Válvula de escape

Duas tarefas que precisam do mesmo arquivo e não podem ser fundidas: isole cada implementador numa worktree ou num Andar do Maestri. É caro em disco e em preparo. Último recurso.

## O que esta regra não muda

O contrato de cada implementador continua o da skill `subagent-driven-development` do Superpowers: perguntar antes se a tarefa for ambígua, teste antes da implementação, autorrevisão antes de reportar, status final explícito.
