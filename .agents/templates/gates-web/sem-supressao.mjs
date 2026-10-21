// Reprova a diretiva de supressão do Biome (também as variantes -all, -start e
// -end) em código. O Biome não tem opção para proibir supressão, e
// `biome lint --suppress` as escreve sozinho. Roda dentro do script `lint`
// (pre-commit, qualquer CLI). Protegido por gates.lock e rules-guard.
// Procura texto: a palavra dentro de string também reprova, de propósito.
// O termo é montado em pedaços para este arquivo não reprovar a si mesmo.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const EXT = /\.(js|jsx|ts|tsx|mjs|cjs|mts|cts)$/;
// Mesmas pastas de globalIgnores do eslint.config.mjs.
const IGNORA = new Set([".claude", ".agents", ".maestri", "vault", "graphify-out", "node_modules", "dist", "build", "coverage", ".git"]);
const PADRAO = new RegExp(["biome", "ignore"].join("-"));

function anda(dir, saida) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) {
      if (!IGNORA.has(nome)) anda(p, saida);
    } else if (EXT.test(nome)) {
      readFileSync(p, "utf8")
        .split("\n")
        .forEach((linha, i) => {
          if (PADRAO.test(linha)) saida.push(`${relative(process.cwd(), p)}:${i + 1}`);
        });
    }
  }
}

export function achados(raiz = ".") {
  const saida = [];
  anda(raiz, saida);
  return saida;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = achados(process.argv[2] ?? ".");
  if (a.length) {
    console.error(`Supressão do Biome é proibida (calar o linter é mudança de regra, não de código):\n${a.map((x) => `  ${x}`).join("\n")}`);
    process.exit(1);
  }
  console.log("sem-supressao: nenhuma supressão do Biome.");
}
