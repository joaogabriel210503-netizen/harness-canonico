#!/usr/bin/env node
// Prova que cada hook bloqueia o que deve e libera o que deve. Alimenta os
// hooks com eventos no mesmo formato que o Claude Code envia, num projeto
// descartável. Rode: node .claude/hooks/selftest.mjs   Sai com 1 se algo falhar.
// A base está em selftest-lib.mjs e os casos em selftest-casos-*.mjs (cada arquivo até 350 linhas).
// Depois roda selftest-git.mjs (gates.lock, pre-commit, varredura de segredo).
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { AQUI, T, raiz } from "./selftest-lib.mjs";
import "./selftest-casos-1.mjs";
import "./selftest-casos-2.mjs";
import "./selftest-casos-3.mjs";
import "./selftest-casos-4.mjs";
import "./selftest-casos-5.mjs";
import "./selftest-casos-6.mjs";
import "./selftest-casos-7.mjs";
import "./selftest-casos-8.mjs";

rmSync(raiz, { recursive: true, force: true });
rmSync(`${raiz}-link`, { force: true });
const git = spawnSync("node", [join(AQUI, "selftest-git.mjs")], { stdio: "inherit" });
if (git.status !== 0) T.falhas += git.status > 0 ? git.status : 1;
console.log(T.falhas ? `\n${T.falhas} caso(s) falharam: os hooks NÃO estão protegendo.` : "\nTodos os casos se comportaram como esperado.");
process.exit(T.falhas ? 1 : 0);
