#!/usr/bin/env node
// Distribuição do harness: manifesto com versão e sha256, verificar e atualizar.
//   node harness-manifesto.mjs gerar <kit> [--conferir]      grava (ou confere) <kit>/harness.json
//   node harness-manifesto.mjs registrar <kit> <projeto>      grava <projeto>/harness.json (o instalador chama)
//   node harness-manifesto.mjs verificar <projeto> [<kit>]    ausente, modificado, atualização disponível
//   node harness-manifesto.mjs atualizar <kit> <projeto> [--aplicar]   plano; com --aplicar, executa
// Regras: arquivo que o projeto personaliza (POLITICA_PROJETO) nunca é atualizado; arquivo do kit que o
// projeto mudou nunca é sobrescrito (vira <arquivo>.kit-novo e conflito); nada é apagado.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const POLITICA_PROJETO = [/^AGENTS\.md$/, /^CLAUDE\.md$/, /^\.agents\/stack\.md$/, /^\.agents\/memory\//, /^\.mcp\.json$/, /^\.claude\/vault\.json$/, /^\.codex\/config\.toml$/, /^vault\//, /^\.githooks\/gates\.lock\.json$/, /^docs\//];
const IGNORAR = /(^|\/)(\.DS_Store|graphify-out|node_modules|_to_delete)(\/|$)/;
const GATES = ["sem-supressao.mjs", "eslint.config.mjs", "eslint.typed.config.mjs", "eslint-rules", "selftest.mjs"];

const hashDe = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const lerJson = (f) => {
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return undefined;
  }
};
const politica = (dest) => (POLITICA_PROJETO.some((r) => r.test(dest)) ? "projeto" : "kit");

function arquivosDe(base) {
  if (!existsSync(base)) return [];
  if (statSync(base).isFile()) return [base];
  return readdirSync(base, { withFileTypes: true }).flatMap((e) => arquivosDe(join(base, e.name)));
}

// O mesmo mapeamento do instalar-no-projeto.sh: [caminho no kit, caminho no projeto].
export function mapa(kit) {
  const pares = [];
  const add = (src, dest) => {
    for (const f of arquivosDe(join(kit, src))) {
      const rel = relative(join(kit, src), f);
      const d = rel === "" ? dest : join(dest, rel);
      if (!IGNORAR.test(d)) pares.push([f, d.split("\\").join("/")]);
    }
  };
  add("AGENTS.md", "AGENTS.md");
  add("CLAUDE.md", "CLAUDE.md");
  add(".agents", ".agents");
  add(".githooks", ".githooks");
  add("kit-claude-code/dot-claude", ".claude");
  add("kit-claude-code/dot-mcp.json", ".mcp.json");
  add("kit-codex/dot-codex", ".codex");
  add("kit-opencode/dot-opencode", ".opencode");
  add("kit-opencode/opencode.json", "opencode.json");
  add(".agents/templates/vault-skeleton", "vault");
  // O modelo do Biome tem sufixo .modelo no kit (o Biome 2.x trataria a cópia em .agents/ como segunda raiz).
  add(".agents/templates/gates-web/biome.jsonc.modelo", "biome.jsonc");
  for (const g of GATES) add(`.agents/templates/gates-web/${g}`, g);
  return pares;
}

const versaoDo = (kit) => (existsSync(join(kit, "VERSAO")) ? readFileSync(join(kit, "VERSAO"), "utf8").trim() : "0.0.0");

export function gerar(kit) {
  const arquivos = {};
  for (const [src, dest] of mapa(kit).sort((a, b) => a[1].localeCompare(b[1]))) arquivos[dest] = hashDe(src);
  return { versao: versaoDo(kit), arquivos };
}

export function registrar(kit, proj) {
  const antigo = lerJson(join(proj, "harness.json"))?.arquivos ?? {};
  const arquivos = {};
  for (const [src, dest] of mapa(kit)) {
    const alvo = join(proj, dest);
    if (!existsSync(alvo)) continue;
    const kitHash = hashDe(src);
    // base = o que o kit tinha quando o arquivo entrou. Arquivo que já nasceu diferente fica sem base (nunca é sobrescrito).
    arquivos[dest] = { base: hashDe(alvo) === kitHash ? kitHash : (antigo[dest]?.base ?? null), politica: politica(dest) };
  }
  const reg = { versao: versaoDo(kit), arquivos };
  writeFileSync(join(proj, "harness.json"), `${JSON.stringify(reg, null, 2)}\n`);
  return reg;
}

export function verificar(proj, kit) {
  const reg = lerJson(join(proj, "harness.json"));
  if (!reg) return { itens: [{ nivel: "grave", msg: "harness.json ausente ou ilegível: o projeto não foi instalado pelo instalar-no-projeto.sh (ou o registro foi apagado)" }], versao: undefined };
  const itens = [];
  for (const [dest, info] of Object.entries(reg.arquivos)) {
    const f = join(proj, dest);
    const critico = /^(\.claude\/hooks\/[^/]+\.mjs|\.codex\/hooks\.json|\.opencode\/plugin\/.+)$/.test(dest);
    if (!existsSync(f)) itens.push({ nivel: info.politica === "kit" ? "grave" : "aviso", msg: `ausente: ${dest}` });
    else if (info.politica === "kit" && info.base && hashDe(f) !== info.base) itens.push({ nivel: critico ? "grave" : "aviso", msg: `modificado no projeto: ${dest}${critico ? " (trava do harness alterada)" : ""}` });
  }
  if (kit) {
    const novo = gerar(kit);
    const pend = Object.entries(novo.arquivos).filter(([d, h]) => politica(d) === "kit" && reg.arquivos[d]?.base !== h).length;
    if (novo.versao !== reg.versao || pend) itens.push({ nivel: "aviso", msg: `atualização disponível: kit ${novo.versao}, projeto ${reg.versao}, ${pend} arquivo(s) diferem. Rode atualizar.` });
  }
  return { itens, versao: reg.versao };
}

export function atualizar(kit, proj, aplicar) {
  const reg = lerJson(join(proj, "harness.json"));
  const plano = { novos: [], atualizar: [], conflitos: [], iguais: 0, removidos: [] };
  const pares = mapa(kit);
  for (const [src, dest] of pares) {
    if (politica(dest) !== "kit") continue;
    const alvo = join(proj, dest);
    const kitHash = hashDe(src);
    if (!existsSync(alvo)) plano.novos.push([src, dest]);
    else if (hashDe(alvo) === kitHash) plano.iguais++;
    else if (reg?.arquivos?.[dest]?.base && hashDe(alvo) === reg.arquivos[dest].base) plano.atualizar.push([src, dest]);
    else plano.conflitos.push([src, dest]);
  }
  const noKit = new Set(pares.map((p) => p[1]));
  plano.removidos = Object.keys(reg?.arquivos ?? {}).filter((d) => !noKit.has(d) && reg.arquivos[d].politica === "kit");
  if (aplicar) {
    for (const [src, dest] of [...plano.novos, ...plano.atualizar]) {
      mkdirSync(dirname(join(proj, dest)), { recursive: true });
      copyFileSync(src, join(proj, dest));
    }
    for (const [src, dest] of plano.conflitos) copyFileSync(src, join(proj, `${dest}.kit-novo`));
    registrar(kit, proj);
  }
  return plano;
}

function cli(args) {
  const [cmd, a, b, c] = args;
  if (cmd === "gerar") {
    const novo = `${JSON.stringify(gerar(a), null, 2)}\n`;
    const arq = join(a, "harness.json");
    if (b === "--conferir") {
      const ok = existsSync(arq) && readFileSync(arq, "utf8") === novo;
      console.log(ok ? "harness.json do kit em dia." : "harness.json do kit DESATUALIZADO: rode gerar sem --conferir.");
      return ok ? 0 : 1;
    }
    writeFileSync(arq, novo);
    console.log(`harness.json gerado (${Object.keys(JSON.parse(novo).arquivos).length} arquivos).`);
    return 0;
  }
  if (cmd === "registrar") return registrar(a, b), 0;
  if (cmd === "verificar") {
    const { itens, versao } = verificar(a, b);
    for (const i of itens) console.log(`${i.nivel === "grave" ? "FALHOU" : "AVISO "} ${i.msg}`);
    console.log(itens.some((i) => i.nivel === "grave") ? "\nHá item grave." : `\nHarness ${versao ?? "?"} sem item grave.`);
    return itens.some((i) => i.nivel === "grave") ? 1 : 0;
  }
  if (cmd === "atualizar") {
    const aplicar = c === "--aplicar";
    const p = atualizar(a, b, aplicar);
    const lista = (t, l) => l.length && console.log(`${t}:\n${l.map((x) => `  ${Array.isArray(x) ? x[1] : x}`).join("\n")}`);
    lista("Novos", p.novos);
    lista("A atualizar (o projeto não mexeu)", p.atualizar);
    lista(aplicar ? "CONFLITOS (versão do kit em <arquivo>.kit-novo; mescle à mão)" : "CONFLITOS (o projeto mudou e o kit também; nada será sobrescrito)", p.conflitos);
    lista("Saíram do kit (nada é apagado; apague você, se quiser)", p.removidos);
    console.log(`\n${p.iguais} arquivo(s) já iguais. ${aplicar ? "Aplicado." : "Plano apenas: rode de novo com --aplicar."} Faça commit antes e rode selftest e doctor depois.`);
    return p.conflitos.length ? 2 : 0;
  }
  console.error("uso: gerar | registrar | verificar | atualizar");
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(cli(process.argv.slice(2)));
