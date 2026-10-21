# Sessão no repositório do kit (harness-canonico)

Você está no repositório do **kit**, não num projeto. O `CLAUDE.md` da raiz importa o `AGENTS.md`, que é o **modelo** da constituição instalada nos projetos: ele não se aplica às tarefas feitas aqui (preparar a máquina, testar o kit, exportar a configuração, publicar uma versão). O fluxo E0 a E13 e as aprovações valem dentro dos projetos, não neste repositório.

Para saber o que fazer, siga o guia de `modo-facil/` que o Gabriel indicou, ou o `BOOTSTRAP.md`.

Continuam valendo aqui: nada de segredo em arquivo ou na saída; login é do Gabriel; instalação ou mudança de configuração global pede o "pode" dele; e toda mudança no kit termina com `node kit-claude-code/dot-claude/hooks/harness-manifesto.mjs gerar .` e `node kit-claude-code/dot-claude/hooks/selftest.mjs` passando.
