#!/usr/bin/env node
// PreToolUse em Write|Edit|MultiEdit|NotebookEdit|Bash. Barra texto que contém
// segredo de formato conhecido (chave AWS, token do GitHub, chave privada, URL
// com senha...). A varredura é a mesma do pre-commit (.githooks/secret-scan.mjs).
// O valor do segredo nunca é repetido na mensagem. Falha da trava BLOQUEIA.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { block, bypassed, projectDir, principal } from "./hook-io.mjs";

export function checar(event) {
  if (bypassed()) return;
  const i = event.tool_input ?? {};
  const texto = [i.content, i.new_string, ...(i.edits ?? []).map((e) => e?.new_string), i.new_source, i.command]
    .filter((x) => typeof x === "string")
    .join("\n");
  if (texto === "") return;
  const scan = join(projectDir(event), ".githooks", "secret-scan.mjs");
  if (!existsSync(scan)) throw new Error(".githooks/secret-scan.mjs ausente");
  const r = spawnSync("node", [scan, "--stdin"], { input: texto, encoding: "utf8" });
  if (r.status === 0) return;
  if (r.status === 1) {
    block(
      `Bloqueado: o texto contém segredo (${r.stderr.trim().replace(/\n/g, "; ")}). Segredo não vai em arquivo nem em comando: use variável de ambiente e peça ao humano para defini-la.`,
    );
  }
  throw new Error(`secret-scan saiu com ${r.status}`);
}

principal(import.meta.url, checar);
