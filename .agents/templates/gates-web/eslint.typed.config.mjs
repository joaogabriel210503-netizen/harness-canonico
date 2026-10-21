// Tier pesado: regras que precisam do verificador de tipos. Sobe o programa
// TypeScript inteiro, por isso fica fora do pre-commit e roda na revisão da
// wave (npm run lint:typed). Duas configs e dois scripts de propósito: uma
// config que muda por variável de ambiente faria local e CI divergirem.
//
// Projeto NOVO: tudo em "error". Projeto que já existe: comece em "warn" e
// promova regra por regra quando a contagem dela chegar a zero.
import defaultConfig, { SOURCE_DIRS } from "./eslint.config.mjs";

export default [
  ...defaultConfig,
  {
    files: SOURCE_DIRS.map((d) => `${d}/**/*.{ts,tsx,mts,cts}`),
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/only-throw-error": "error",
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/restrict-template-expressions": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "@typescript-eslint/require-await": "error",
    },
  },
];
