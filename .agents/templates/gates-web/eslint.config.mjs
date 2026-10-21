// Gates de lint do perfil web (TypeScript, código em src/).
// Tier rápido: nada aqui usa informação de tipos. Os testes de tipos estão em
// eslint.typed.config.mjs, no script `lint:typed`.
//
// Projeto NOVO: tudo nasce em "error" e o script roda com --max-warnings 0.
// Projeto que já existe: rode primeiro, conte as violações por regra e deixe em
// "warn" só as que têm violação, anotando a contagem. Ver README.md desta pasta.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

import quality from "./eslint-rules/index.cjs";

// O teto vale para TODO arquivo de código do repositório, de qualquer extensão
// JS/TS e de qualquer pasta (inclusive config, teste, story, mock, migration,
// locales). Não existe isenção por nome nem por pasta. Não aumente para passar.
const MAX_LINES = 350;
// Sem teto de coluna, o teto de linhas se contorna esticando a linha. Strings,
// URLs, template literals e regex ficam de fora (dado, não lógica).
const MAX_COLS = 160;

// Pastas onde mora o código do PRODUTO. As regras de console, complexidade,
// profundidade, tamanho de função e as do plugin `quality` só enxergam estas
// pastas (scripts de projeto, como scripts/*.mjs, podem usar console). O teto
// de linhas e de colunas NÃO depende desta lista: vale em todo lugar. Ajuste ao
// criar o projeto (Next.js com app/ e lib/ na raiz, por exemplo: ["src", "app",
// "lib", "components"]) e mantenha o mesmo valor em .agents/stack.md e no
// "include" do tsconfig.json. O selftest.mjs lê esta lista.
export const SOURCE_DIRS = ["src"];

// Dívida antiga aprovada pelo humano, SÓ em projeto que já existia antes do harness:
// arquivo acima do teto de linhas ou de colunas, ou com console direto, que ainda não
// foi refatorado. Nesses arquivos as três regras caem para "warn": continuam aparecendo
// no lint, sem barrar o commit. Regras de uso:
// - código novo nunca entra aqui, e a lista só diminui (cada refatoração tira a entrada);
// - mudar a lista é mudança de regra: este arquivo é protegido (rules-guard) e está no
//   gates.lock, então só vale depois que o humano roda travar-gates;
// - cada entrada diz o porquê e desde quando.
// Formato: { arquivo: "src/legado/relatorio.ts", motivo: "5 telas num arquivo; refatorar na demanda X", desde: "AAAA-MM-DD" }
export const DIVIDA_APROVADA = [];
const EXT = "{js,jsx,ts,tsx,mjs,cjs,mts,cts}";
const inDirs = (suffix) => SOURCE_DIRS.map((d) => `${d}/**/${suffix}`);

export default defineConfig([
  {
    // Comentário no arquivo NÃO liga, desliga nem muda regra. `/* eslint-disable */`,
    // `// eslint-disable-next-line` e `/* eslint max-lines: "off" */` são
    // ignorados (e a diretiva que não faz nada vira erro). Mudar regra só pelo
    // arquivo de config, que é protegido (rules-guard + gates.lock).
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
      // js.configs.recommended liga no-undef, que não conhece o ambiente.
      // Declare o que o código usa; passando de poucos, use o pacote `globals`.
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    // Teto de linhas e de colunas: todo arquivo de código, sem exceção por nome
    // (index, types, constants...), por tipo (*.config.*, *.stories.*) ou por
    // pasta (migrations, locales, mocks, fixtures, __tests__). O `max-lines`
    // nativo já ignora a linha vazia final, então 350 linhas reais passam e 351
    // falham, com ou sem newline no fim do arquivo.
    files: [`**/*.${EXT}`],
    rules: {
      "max-lines": ["error", { max: MAX_LINES }],
      "max-len": [
        "error",
        {
          code: MAX_COLS,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
    },
  },
  {
    files: inDirs(`*.${EXT}`),
    plugins: { quality },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-var": "error",
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      complexity: ["error", 12],
      "max-depth": ["error", 4],
      "max-statements": ["error", 20],
      "max-params": ["error", 4],
      "max-lines-per-function": [
        "error",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
      "max-nested-callbacks": ["error", 3],
      "quality/no-direct-console": [
        "error",
        { logger: "o logger do projeto" },
      ],
    },
  },
  {
    // Em teste, describe/it aninhados e longas seções de preparo disparam
    // estas três sem apontar problema real. O teto de linhas continua valendo.
    files: ["**/*.test.{ts,tsx,mts,cts}", "**/*.spec.{ts,tsx,mts,cts}"],
    rules: {
      "max-statements": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
    },
  },
  {
    // Adaptador de log: único lugar onde console é permitido. Este bloco
    // precisa vir DEPOIS do que liga a regra, senão o "error" posterior vence.
    // Ajuste o caminho para o adaptador real do projeto.
    files: SOURCE_DIRS.flatMap((d) => [`${d}/server/logger.ts`, `${d}/lib/logger.ts`, `${d}/logger.ts`]),
    rules: { "quality/no-direct-console": "off" },
  },
  // Dívida aprovada (DIVIDA_APROVADA, no alto do arquivo): só a severidade muda, as opções
  // (350 linhas, 160 colunas) continuam as mesmas. Vem depois dos blocos que ligam as regras.
  ...(DIVIDA_APROVADA.length
    ? [
        {
          files: DIVIDA_APROVADA.map((d) => d.arquivo),
          plugins: { quality },
          rules: { "max-lines": "warn", "max-len": "warn", "quality/no-direct-console": "warn" },
        },
      ]
    : []),
  {
    files: ["eslint-rules/**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // O que o lint não vê. Cada linha é uma porta: código posto aqui não é
  // conferido. `.claude/**` e `.agents/**` são protegidos pelo rules-guard,
  // `vault/**` só se acessa por MCP e `src/generated/**` é gerado por ferramenta
  // (o rules-guard bloqueia edição manual de `generated/`). Não acrescente
  // pasta aqui para passar.
  globalIgnores([
    ".claude/**",
    ".agents/**",
    ".maestri/**",
    "vault/**",
    "graphify-out/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "**/*.tsbuildinfo",
    "package-lock.json",
    "src/generated/**",
  ]),
]);
