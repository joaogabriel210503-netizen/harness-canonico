---
trigger: always_on
description: Quality gates, teto de 350 linhas e o que nunca fazer com o lint
---

# Quality gates

Os comandos estão em `.agents/stack.md`. No perfil web são estes.

## Quando rodar o quê

| Momento | Comandos | Quem |
|---|---|---|
| Antes de reportar uma tarefa como concluída | `npm run lint`, `npm run typecheck`, `npm test` | O implementador |
| Na revisão completa da wave (E8) | Os três acima e `npm run lint:typed` | O orquestrador |
| No commit | `npm run lint` em cada pasta com `package.json`, conferência do `gates.lock` e varredura de segredo, pelo pre-commit do git | Automático (instalado por `sh .githooks/instalar.sh`; rode de novo depois de clonar) |
| No push | `gates:selftest`, `typecheck`, `test` e `lint:typed`, pelo pre-push do git | Automático (o push é do humano, então o custo cai na hora certa) |

Uma tarefa só está concluída quando os três passam. A wave só commita quando os quatro passam.

`lint:typed` é o tier pesado: sobe o programa TypeScript inteiro. Fica fora do pre-commit de propósito e roda na revisão (E8) e no pre-push.

**`gates.lock`.** O arquivo `.githooks/gates.lock.json` guarda a impressão digital (sha256) do que define os gates: configs do lint (ESLint e `biome.jsonc`), `sem-supressao.mjs`, configs do TypeScript, `selftest.mjs`, `eslint-rules/` e os scripts `lint`, `typecheck`, `lint:typed`, `test`, `gates:verify` e `gates:selftest` de cada `package.json`. Se qualquer um mudar, o pre-commit reprova. Mudança aprovada: o humano roda `node .githooks/travar-gates.mjs` e commita o lock. Sem isso, trocar `"lint"` por `"echo ok"` esvaziava o gate sem tocar em arquivo protegido.

## Como rodar

1. **Sem compressão.** Os gates não passam pelo RTK. O agente precisa ler o erro inteiro.
2. **Leia o código de saída**, não só o texto. Saída diferente de zero é falha, mesmo que o texto pareça limpo.
3. **No mesmo turno.** Não vale "rodei antes". Rode, leia e só então declare.
4. **Cole a saída real** no relato da tarefa ou no `estado.md`. Resumo não serve como prova.

## Script ausente

Se `lint`, `typecheck`, `lint:typed` ou `test` não existir no projeto:

1. Não finja que rodou e não pule.
2. Diga qual falta.
3. Proponha a configuração mínima para criá-lo.
4. Aguarde a aprovação antes de criar.

## O que nunca fazer para passar

- Aumentar o teto de 350 linhas.
- Desligar uma regra, ou rebaixar de `error` para `warn`.
- Ligar ou desligar regra por comentário (`eslint-disable`, `/* eslint regra: off */`). O lint ignora o comentário e reprova a diretiva, e o rules-guard bloqueia a escrita. Para o Biome, o `sem-supressao.mjs` (dentro do `lint`) reprova a diretiva dele e o rules-guard bloqueia `biome --suppress` e `--unsafe`.
- Esvaziar um script do `package.json` (`"lint": "echo ok"`, `"test": "true"`). O `gates.lock` reprova o commit.
- Pôr código em pasta que o lint não vê (`.claude/`, `.agents/`, `vault/`, `generated/`, `dist/`).
- Esticar a linha para caber no teto (o `max-len` reprova).
- Acrescentar o arquivo à lista de ignorados sem aprovação do humano.
- Mover lógica para `index`, `types`, `constants`, `dtos`, `enums` ou `interfaces` para escapar do teto.
- Marcar teste como ignorado ou apagar o teste que falha.
- Usar `any`, `@ts-ignore` ou equivalente para calar o verificador de tipos.

Qualquer um desses é mudança de regra, não de código. Só o humano decide.

## Teto de 350 linhas

Vale para **todo arquivo de código do repositório**, de qualquer extensão JS ou TS e de qualquer pasta. Não existe isenção por nome (`index`, `types`, `constants`, `dtos`, `enums`...), por tipo (`*.config.*`, `*.stories.*`, testes) nem por pasta (`migrations/`, `locales/`, `mocks/`, `fixtures/`, `__tests__/`). É a regra nativa `max-lines` em 350. A regra `quality/max-lines` do toolkit continua no plugin, mas **não está ligada**: era ela que isentava por nome e contava uma linha a mais.

O que a config fecha, e o `node selftest.mjs` prova caso a caso:

1. **Isenção por nome, tipo ou pasta.** Nenhuma. `constants.js` de 400 linhas, `app.config.ts`, `x.stories.tsx`, `migration/a.ts` e `locales/pt.ts` reprovam.
2. **Comentário que desliga a regra.** ESLint: `linterOptions.noInlineConfig: true`, o comentário é ignorado (e a diretiva vira erro). Biome: não há opção equivalente, então o `sem-supressao.mjs` reprova a diretiva. Só se muda regra pelo arquivo de config, que é protegido.
3. **Linha esticada.** `max-len` em 160 colunas. Strings, URLs, template literals e regex ficam de fora, porque são dado e não lógica.
4. **351 linhas sem newline final.** A regra nativa conta as linhas reais, com ou sem newline: reprova. O formatador deixa de ser exigência para isso.
5. **Pasta fora de `SOURCE_DIRS`.** O teto de linhas e de colunas não depende dessa lista: vale em todo o repositório.

As únicas portas que sobram são as pastas que o lint ignora por inteiro (`globalIgnores` em `eslint.config.mjs`). Cada uma está coberta por outra trava: `.claude/` e `.agents/` são protegidas pelo rules-guard, `vault/` só se acessa por MCP, `generated/` não aceita edição manual (rules-guard) e `node_modules`, `dist`, `build` e `coverage` não são código do projeto.

## Onde os gates enxergam

O teto de linhas e de colunas: em todo o repositório. As demais regras (console, complexidade, profundidade, tamanho de função, plugin `quality`): só nas pastas de `SOURCE_DIRS` (`eslint.config.mjs`), as mesmas de `.agents/stack.md` e do `include` do `tsconfig.json`, porque scripts de projeto (`scripts/*.mjs`) podem usar `console`. Ao criar o projeto, confira essa lista; se o framework põe código em `app/` ou `lib/` na raiz, acrescente. O `gates:selftest` testa cada pasta da lista e uma pasta fora dela.

## Severidade

Em projeto novo, todas as regras nascem em `error` e o script roda com `--max-warnings 0`. Em projeto que já existe, regra com violação nasce em `warn` com a contagem registrada e sobe para `error` quando zerar. O teto de linhas e de colunas e o `console` não caem para `warn` em geral: arquivo antigo que os viola entra, um por um, na lista `DIVIDA_APROVADA` do `eslint.config.mjs` (com motivo e data), e sai quando for refatorado. A lista só diminui. Rebaixar uma regra depois disso é mudança de regra (ver acima).

## Prova de que o gate funciona

Depois de instalar ou mexer na config, rode `npm run gates:selftest`. Ele cria arquivos que tentam cada forma conhecida de escapar do teto (nome isento em TS e em JS, `*.config.*`, stories, `migrations/`, `locales/`, mocks, fixtures, comentário que desliga a regra, linha esticada, 351 linhas sem newline, arquivo fora de `src/`) e um `console.log`, e exige que cada um se comporte como esperado. Saída diferente de zero significa que o gate não está protegendo. O selftest dos hooks (`node .claude/hooks/selftest.mjs`) prova o mesmo para as travas do Claude Code, do git e do `gates.lock`.
