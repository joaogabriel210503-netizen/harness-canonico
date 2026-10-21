---
trigger: always_on
description: Quem pode commitar, merge e push, e o formato do commit
---

# Commit

## Quem pode o quê

| Ação | Quem |
|---|---|
| Editar código | Persona implementadora |
| `git commit` na branch de trabalho | Só o orquestrador |
| Merge na `main`, `git push` | Só o humano |

Implementador que commita quebra a wave. Não há exceção "só desta vez".

## Branch

Cada demanda roda em `demanda/<slug>`, criada em E1 a partir da `main`. No Maestri, o Andar da demanda cumpre o mesmo papel.

## Quando commitar

Só em E9, depois que a wave passou por revisão, validação e os quatro gates.

## Como commitar

Uma tarefa por vez, na ordem da wave:

1. Capture o `HEAD` atual agora. Nunca reutilize um `HEAD` capturado antes.
2. Adicione **só** os arquivos de `Files:` daquela tarefa. Nunca `git add .` ou `git add -A`.
3. Commit no padrão convencional, com o ID da tarefa:

```
feat(relatorios): endpoint de exportação em CSV [T01]
test(relatorios): formatação do CSV e validação de período [T02]
```

Tipos: `feat`, `fix`, `test`, `refactor`, `perf`, `docs`, `chore`.

4. Confira com `git status` que não sobrou arquivo da tarefa fora do commit.
5. Anote o hash no `estado.md`.

Arquivo alterado que não está em `Files:` de nenhuma tarefa: pare. Ou a marcação do plano estava errada, ou o implementador saiu do escopo. Reporte ao humano antes de commitar.

## Pre-commit

O git roda `npm run lint` antes de cada commit. Se barrar, a wave não estava pronta: volte para E8. Nunca use `--no-verify`.

## Depois da última wave

O orquestrador avisa o humano que a branch está pronta, com a lista de commits. O merge é dele.
