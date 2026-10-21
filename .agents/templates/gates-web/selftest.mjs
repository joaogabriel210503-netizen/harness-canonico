// Prova que os gates de tamanho, de linha longa e de console realmente reprovam,
// e que nenhuma das formas conhecidas de escapar do teto funciona.
// Rode na raiz do projeto: node selftest.mjs   (ou npm run gates:selftest)
// Cria arquivos descartáveis em <pasta-de-código>/__gates_selftest__/ (uma vez por
// pasta de SOURCE_DIRS) e em __gates_selftest_fora__/ (fora de qualquer pasta de
// código), e apaga ao final. Sai com código 1 se algum caso não se comportar
// como esperado.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ESLint } from "eslint";

import { SOURCE_DIRS } from "./eslint.config.mjs";
import { achados } from "./sem-supressao.mjs";

const MAX = 350;
const FORA = "__gates_selftest_fora__";

const lines = (n, nl = true) =>
  Array.from({ length: n }, (_, i) => `export const v${i} = ${i};`).join("\n") + (nl ? "\n" : "");
// Linha longa SEM string (string é isenta de propósito): 100 linhas de ~400 colunas.
const longas = () =>
  Array.from({ length: 100 }, (_, i) => `export const v${i} = [${Array(100).fill(1).join(", ")}];`).join("\n") + "\n";
const RAZAO = "max-lines";

// [arquivo, conteúdo, regra que deve disparar (ou null = deve passar limpo)]
// Valem dentro de cada pasta de SOURCE_DIRS.
const casosDentro = [
  // --- o teto em si
  ["ok_350.ts", lines(MAX), null],
  ["ok_350_sem_newline.ts", lines(MAX, false), null],
  ["ruim_351.ts", lines(MAX + 1), RAZAO],
  ["ruim_351_sem_newline.ts", lines(MAX + 1, false), RAZAO],
  ["ruim_500.ts", lines(500), RAZAO],
  ["barrel.ts", "export * from './ok_350';\n", null],
  // --- isenção por nome: nenhuma extensão escapa
  ["index.ts", lines(MAX), null],
  ["pasta_a/index.ts", lines(MAX + 1), RAZAO],
  ["types.ts", lines(400), RAZAO],
  ["constants.ts", lines(400), RAZAO],
  ["dtos.ts", lines(400), RAZAO],
  ["constants.js", lines(400), RAZAO],
  ["enums.mjs", lines(400), RAZAO],
  ["types.tsx", lines(400), RAZAO],
  // --- isenção por tipo de arquivo ou por pasta
  ["app.config.ts", lines(400), RAZAO],
  ["x.stories.tsx", lines(400), RAZAO],
  ["migration/a.ts", lines(400), RAZAO],
  ["migrations/b.ts", lines(400), RAZAO],
  ["locales/pt.ts", lines(400), RAZAO],
  ["generated/g.ts", lines(400), RAZAO],
  ["__tests__/grande.test.ts", lines(400), RAZAO],
  ["mocks/m.ts", lines(400), RAZAO],
  ["fixtures/f.ts", lines(400), RAZAO],
  // --- comentário não liga nem desliga regra
  ["ruim_inline_off.ts", `/* eslint max-lines: "off" */\n${lines(400)}`, RAZAO],
  ["ruim_inline_disable_arquivo.ts", `/* eslint-disable */\n${lines(400)}`, RAZAO],
  ["ruim_inline_config_quality.ts", `/* eslint quality/max-lines: "off", max-lines: "off" */\n${lines(400)}`, RAZAO],
  [
    "ruim_disable_console.ts",
    "// eslint-disable-next-line quality/no-direct-console\nexport const f = () => console.log('x');\n",
    "quality/no-direct-console",
  ],
  // --- linha longa: o teto de linhas não pode ser escapado esticando a linha
  ["ruim_linha_longa.ts", longas(), "max-len"],
  // --- console
  ["console.ts", "export const f = () => console.log('x');\n", "quality/no-direct-console"],
];

// Fora de SOURCE_DIRS o teto vale; o console é permitido (scripts de projeto).
const casosFora = [
  ["ok_350.ts", lines(MAX), null],
  ["ruim_400.ts", lines(400), RAZAO],
  ["ruim_400.js", lines(400), RAZAO],
  ["ruim_400.mjs", lines(400), RAZAO],
  ["constants.js", lines(400), RAZAO],
  ["script_console.mjs", "export const f = () => console.log('x');\n", null],
];

const grupos = [
  ...SOURCE_DIRS.map((d) => ({ nome: d, dir: `${d}/__gates_selftest__`, casos: casosDentro })),
  { nome: "fora", dir: FORA, casos: casosFora },
];

let falhas = 0;
for (const { nome, dir, casos } of grupos) {
  rmSync(dir, { recursive: true, force: true });
  for (const [f, c] of casos) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), c);
  }
  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles([`${dir}/**/*.{ts,tsx,js,mjs}`]);
    for (const [f, , esperado] of casos) {
      const r = results.find((x) => x.filePath.endsWith(join(dir, f)));
      const regras = (r?.messages ?? []).map((m) => m.ruleId);
      const ok = esperado ? regras.includes(esperado) : regras.length === 0;
      if (!ok) falhas++;
      console.log(
        `${ok ? "OK    " : "FALHOU"} ${nome.padEnd(6)} ${f.padEnd(34)} esperado=${esperado ?? "limpo"} obtido=[${[...new Set(regras)].join(", ")}]`,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
// --- Biome: conjunto curado, formatador e a proibição de supressão.
// O Biome só olha as pastas de `files.includes` do biome.jsonc (src por padrão),
// então os casos vão para a primeira pasta de SOURCE_DIRS.
const BIOME_DIR = `${SOURCE_DIRS[0]}/__gates_selftest_biome__`;
const SUPRIME = ["biome", "ignore"].join("-"); // montado em pedaços: o script não reprova a si mesmo
const OK_TS = "export const soma = (a: number, b: number): number => a + b;\n";
// [arquivo, conteúdo, categoria esperada (null = limpo)]
const casosBiome = [
  ["ok.ts", OK_TS, null],
  ["ruim_igual.ts", "export const f = (a: number) => a == 1;\n", "lint/suspicious/noDoubleEquals"],
  ["ruim_eval.ts", "export const f = (s: string) => eval(s);\n", "lint/security/noGlobalEval"],
  ["ruim_only.test.ts", 'it.only("a", () => {});\n', "lint/suspicious/noFocusedTests"],
  ["ruim_skip.test.ts", 'it.skip("a", () => {});\n', "lint/suspicious/noSkippedTests"],
  ["ruim_html.tsx", "export const C = ({ h }: { h: string }) => <div dangerouslySetInnerHTML={{ __html: h }} />;\n", "lint/security/noDangerouslySetInnerHtml"],
  ["ruim_alt.tsx", 'export const C = () => <img src="a.png" />;\n', "lint/a11y/useAltText"],
  ["ruim_botao.tsx", "export const C = () => <button>ok</button>;\n", "lint/a11y/useButtonType"],
  ["ruim_ancora.tsx", 'export const C = () => <a href="#">x</a>;\n', "lint/a11y/useValidAnchor"],
  ["ruim_formato.ts", "export const x   =   1\n", "format"],
  // A supressão cala o Biome (passa limpo nele), mas o sem-supressao reprova.
  ["ruim_supressao.ts", `// ${SUPRIME} lint/suspicious/noDoubleEquals: x\nexport const a = 1 == 1;\n`, null],
];
rmSync(BIOME_DIR, { recursive: true, force: true });
mkdirSync(BIOME_DIR, { recursive: true });
for (const [f, c] of casosBiome) writeFileSync(join(BIOME_DIR, f), c);
let saidaBiome = "";
try {
  execFileSync("npx", ["biome", "check", "--max-diagnostics=200", "--colors=off", BIOME_DIR], { encoding: "utf8", stdio: "pipe" });
} catch (e) {
  saidaBiome = `${e.stdout ?? ""}${e.stderr ?? ""}`;
}
const supressoes = achados(BIOME_DIR);
for (const [f, , esperado] of casosBiome) {
  const linhas = saidaBiome.split("\n").filter((l) => l.includes(`${BIOME_DIR}/${f}`));
  const cats = linhas.map((l) => (l.includes(" format ") ? "format" : (/lint\/\S+/.exec(l)?.[0] ?? null))).filter(Boolean);
  const temSup = supressoes.some((x) => x.includes(f));
  const ok = f === "ruim_supressao.ts" ? cats.length === 0 && temSup : esperado ? cats.includes(esperado) : cats.length === 0 && !temSup;
  if (!ok) falhas++;
  console.log(
    `${ok ? "OK    " : "FALHOU"} biome  ${f.padEnd(34)} esperado=${f === "ruim_supressao.ts" ? "sem-supressao" : (esperado ?? "limpo")} obtido=[${[...new Set(cats)].join(", ")}]${temSup ? " sem-supressao" : ""}`,
  );
}
rmSync(BIOME_DIR, { recursive: true, force: true });

console.log(falhas ? `\n${falhas} caso(s) falharam: os gates NÃO estão protegendo.` : "\nTodos os casos se comportaram como esperado.");
process.exit(falhas ? 1 : 0);
