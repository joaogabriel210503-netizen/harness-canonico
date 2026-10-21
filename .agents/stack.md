# Stack e comandos canônicos

O fluxo é um só para qualquer stack. O que muda de um projeto para outro é este arquivo: os comandos dos gates e a ferramenta de validação. Preencha ao criar o projeto e use exatamente o que estiver aqui.

## Perfil deste projeto

- **Perfil:** web (TypeScript)
- **Stack:** [PREENCHER: ex. TypeScript · Next.js + React · PostgreSQL]
- **Gerenciador de pacotes:** npm
- **Pastas de código:** [PREENCHER: ex. `src`. Mesmo valor de `SOURCE_DIRS` em `eslint.config.mjs` e do `include` do `tsconfig.json`. Código fora destas pastas **não é checado** pelos gates.]

## Comandos canônicos

| Para | Comando |
|---|---|
| Instalar | `npm install` |
| Rodar em desenvolvimento | [PREENCHER: ex. `npm run dev`] |
| Build | [PREENCHER: ex. `npm run build`] |
| Gate: lint rápido | `npm run lint` |
| Gate: tipos | `npm run typecheck` |
| Gate: lint consciente de tipo (só na revisão) | `npm run lint:typed` |
| Gate: testes | `npm test` |

## Validação visual

| Para | Ferramenta |
|---|---|
| Percorrer o fluxo do usuário | `agent-browser` |
| Console, rede e performance | Chrome DevTools MCP |
| Endereço local | [PREENCHER: ex. `http://localhost:3000`] |

## Convenções

[PREENCHER: estilo de import, convenção de teste, padrão de erro, formato de data e moeda.]

---

## Perfis previstos

Trocar de perfil é trocar a tabela de comandos e a de validação. As etapas, as aprovações e as regras não mudam.

| Perfil | Gates | Validação visual | Situação |
|---|---|---|---|
| Web (TypeScript) | ESLint (cobertura pesada), Biome 2.5.15 (conjunto curado de 11 regras, sem sobreposição; `sem-supressao.mjs` fecha o comentário de supressão), `tsc`, suíte de testes | agent-browser e Chrome DevTools | Padrão |
| Mobile (React Native ou Expo) | Os mesmos gates do perfil web | Simulador, pelo portal do Maestri; exige Xcode ou Android Studio | A montar no primeiro projeto |
| Mobile (Flutter) | `dart analyze`, `flutter test`, e uma regra de teto de 350 linhas a construir | Simulador, pelo portal do Maestri | A montar no primeiro projeto; as regras de ESLint não se aplicam |

Um perfil só entra em uso depois que os quatro gates existem e o teto de 350 linhas está valendo nele.
