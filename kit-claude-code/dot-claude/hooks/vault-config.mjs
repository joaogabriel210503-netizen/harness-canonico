#!/usr/bin/env node
// Gera os arquivos do modo do vault. Usado pelo instalador e pelo atualizar.
//   node vault-config.mjs json local|universal [modulo]   -> .claude/vault.json
//   node vault-config.mjs mcp <base.json> [modulo]        -> .mcp.json (sem modulo = local, igual à base)
//   node vault-config.mjs toml <base.json> [modulo]       -> trecho [mcp_servers.*] do .codex/config.toml
//   node vault-config.mjs iniciar <esqueleto> <modulo>    -> cria <modulo>/ e _comum/ na raiz central, se faltarem
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMUM, VARIAVEL } from "./vault-lib.mjs";

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export function gerarJson(modo, modulo) {
  if (modo === "local") return { modo: "local" };
  if (modo !== "universal" || typeof modulo !== "string" || !SLUG.test(modulo)) throw new Error("modo universal exige --modulo em kebab-case (ex.: slon)");
  return { modo: "universal", modulo };
}

export function gerarMcp(base, modulo) {
  if (!modulo) return base;
  if (!SLUG.test(modulo)) throw new Error("módulo inválido");
  const proprio = structuredClone(base.mcpServers["harness-vault"]);
  const comum = structuredClone(proprio);
  proprio.env.OBSIDIAN_VAULT_PATH = `\${${VARIAVEL}}/${modulo}`;
  comum.env.OBSIDIAN_VAULT_PATH = `\${${VARIAVEL}}/${COMUM}`;
  return { mcpServers: { ...base.mcpServers, "harness-vault": proprio, "harness-vault-comum": comum } };
}

const toml = (v) => JSON.stringify(v);
const tabela = (nome, c, extra = "") =>
  `[mcp_servers.${nome}]\ncommand = ${toml(c.command)}\nargs = ${toml(c.args)}\n${extra}\n[mcp_servers.${nome}.env]\n${Object.entries(c.env ?? {}).map(([k, v]) => `${k} = ${toml(v)}`).join("\n")}\n`;

// Codex: o vault do módulo e o comum (só leitura: enabled_tools). A variável central passa por sh -c.
export function gerarToml(base, modulo) {
  const v = base.mcpServers["harness-vault"];
  if (!modulo) return `${tabela("harness-vault", v)}`;
  const envSem = (c) => ({ ...c, env: Object.fromEntries(Object.entries(c.env).filter(([k]) => k !== "OBSIDIAN_VAULT_PATH")) });
  const envar = (c, pasta) => ({
    command: "sh",
    args: ["-c", `OBSIDIAN_VAULT_PATH="$${VARIAVEL}/${pasta}" exec ${[c.command, ...c.args].map((a) => `'${a}'`).join(" ")}`],
    env: envSem(c).env,
  });
  const extra = `env_vars = [${toml(VARIAVEL)}]\n`;
  return `${tabela("harness-vault", envar(v, modulo), extra)}\n${tabela("harness-vault-comum", envar(v, COMUM), `${extra}enabled_tools = ["search_notes_tool", "read_note_tool"]\n`)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, a, b] = process.argv.slice(2);
  try {
    if (cmd === "json") console.log(JSON.stringify(gerarJson(a, b), null, 2));
    else if (cmd === "mcp") console.log(JSON.stringify(gerarMcp(JSON.parse(readFileSync(a, "utf8")), b), null, 2));
    else if (cmd === "toml") console.log(gerarToml(JSON.parse(readFileSync(a, "utf8")), b));
    else if (cmd === "iniciar") {
      const raiz = process.env[VARIAVEL];
      if (!raiz || !existsSync(raiz)) throw new Error(`defina ${VARIAVEL} com a pasta do vault da Central (existente)`);
      for (const pasta of [b, COMUM]) {
        if (!existsSync(join(raiz, pasta))) {
          mkdirSync(join(raiz, pasta), { recursive: true });
          cpSync(a, join(raiz, pasta), { recursive: true });
          console.log(`criada ${join(raiz, pasta)}`);
        }
      }
    } else throw new Error("uso: json | mcp | iniciar");
  } catch (e) {
    console.error(`vault-config: ${e.message}`);
    process.exit(1);
  }
}
