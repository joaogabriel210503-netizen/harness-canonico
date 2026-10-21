// Casos dos hooks, parte 7: manifesto (gerar, registrar, verificar, atualizar) em kit e projeto descartáveis.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AQUI, T, w } from "./selftest-lib.mjs";

const kit = mkdtempSync(join(tmpdir(), "harness-kit-"));
const proj = mkdtempSync(join(tmpdir(), "harness-proj-"));
const M = join(AQUI, "harness-manifesto.mjs");
const rodar = (...a) => spawnSync("node", [M, ...a], { encoding: "utf8" });
const ok = (nome, cond, extra = "") => {
  if (!cond) T.falhas++;
  console.log(`${cond ? "OK    " : "FALHOU"} harness-manifesto  ${nome}${cond ? "" : ` | ${extra}`}`);
};
const cp = (rel, base = kit) => join(base, rel);
const tem = (r, txt) => (r.stdout + r.stderr).includes(txt);

w("VERSAO", "1.0.0\n", kit);
w("AGENTS.md", "# kit\n", kit);
w(".agents/rules/a.md", "regra v1\n", kit);
w(".agents/stack.md", "stack do kit\n", kit);
w("kit-claude-code/dot-claude/hooks/x-guard.mjs", "// guarda v1\n", kit);
w("kit-claude-code/dot-claude/settings.json", "{}\n", kit);

ok("gerar grava harness.json com versão e hashes", rodar("gerar", kit).status === 0 && JSON.parse(readFileSync(cp("harness.json"), "utf8")).versao === "1.0.0");
ok("gerar --conferir: em dia sai 0", rodar("gerar", kit, "--conferir").status === 0);
ok("manifesto lista a pasta do Claude Code como .claude/", "kit-claude-code/dot-claude/hooks/x-guard.mjs" && Object.keys(JSON.parse(readFileSync(cp("harness.json"), "utf8")).arquivos).includes(".claude/hooks/x-guard.mjs"));

// instala à mão (o instalador faz o mesmo cp) e registra
for (const [src, dest] of [["AGENTS.md", "AGENTS.md"], [".agents/rules/a.md", ".agents/rules/a.md"], [".agents/stack.md", ".agents/stack.md"], ["kit-claude-code/dot-claude/hooks/x-guard.mjs", ".claude/hooks/x-guard.mjs"], ["kit-claude-code/dot-claude/settings.json", ".claude/settings.json"]]) w(dest, readFileSync(cp(src), "utf8"), proj);
ok("registrar grava harness.json no projeto", rodar("registrar", kit, proj).status === 0 && existsSync(cp("harness.json", proj)));
ok("verificar: projeto igual ao kit sai 0", rodar("verificar", proj, kit).status === 0);

// o projeto personaliza AGENTS.md e stack.md (política projeto): nada reclama
w("AGENTS.md", "# meu projeto\n", proj);
w(".agents/stack.md", "minha stack\n", proj);
ok("verificar: arquivo de política projeto modificado não reclama", rodar("verificar", proj).status === 0);

// hook alterado no projeto: grave
w(".claude/hooks/x-guard.mjs", "// guarda enfraquecida\n", proj);
const v1 = rodar("verificar", proj);
ok("verificar: hook alterado no projeto é grave (saída 1)", v1.status === 1 && tem(v1, ".claude/hooks/x-guard.mjs"));
w(".claude/hooks/x-guard.mjs", "// guarda v1\n", proj);

// regra alterada no projeto: aviso, não grave
w(".agents/rules/a.md", "regra do projeto\n", proj);
const v2 = rodar("verificar", proj);
ok("verificar: regra alterada é só aviso (saída 0)", v2.status === 0 && tem(v2, "modificado no projeto"));
w(".agents/rules/a.md", "regra v1\n", proj);

// arquivo do kit sumiu
rmSync(cp(".claude/settings.json", proj));
ok("verificar: arquivo do kit ausente é grave", rodar("verificar", proj).status === 1);
w(".claude/settings.json", "{}\n", proj);

// o kit evolui
w(".agents/rules/a.md", "regra v2\n", kit);
w("kit-claude-code/dot-claude/hooks/x-guard.mjs", "// guarda v2\n", kit);
w("kit-claude-code/dot-claude/hooks/novo-guard.mjs", "// nova\n", kit);
w("AGENTS.md", "# kit v2 (não deve chegar)\n", kit);
w("VERSAO", "1.1.0\n", kit);
ok("gerar --conferir: desatualizado sai 1", rodar("gerar", kit, "--conferir").status === 1);
rodar("gerar", kit);
ok("verificar com kit: avisa atualização disponível", tem(rodar("verificar", proj, kit), "atualização disponível"));
// o projeto também mexeu em x-guard? não. Mexe na regra: conflito.
w(".agents/rules/a.md", "regra do projeto\n", proj);
const plano = rodar("atualizar", kit, proj);
ok("atualizar sem --aplicar mostra o plano e sai 2 com conflito", plano.status === 2 && tem(plano, "Novos") && tem(plano, "A atualizar") && tem(plano, "CONFLITOS"));
ok("atualizar sem --aplicar não altera nada", readFileSync(cp(".claude/hooks/x-guard.mjs", proj), "utf8") === "// guarda v1\n" && !existsSync(cp(".claude/hooks/novo-guard.mjs", proj)));
const ap = rodar("atualizar", kit, proj, "--aplicar");
ok("--aplicar atualiza o que o projeto não mexeu", readFileSync(cp(".claude/hooks/x-guard.mjs", proj), "utf8") === "// guarda v2\n");
ok("--aplicar traz arquivo novo do kit", existsSync(cp(".claude/hooks/novo-guard.mjs", proj)));
ok("--aplicar não sobrescreve arquivo mudado pelo projeto (conflito, .kit-novo)", ap.status === 2 && readFileSync(cp(".agents/rules/a.md", proj), "utf8") === "regra do projeto\n" && readFileSync(cp(".agents/rules/a.md.kit-novo", proj), "utf8") === "regra v2\n");
ok("--aplicar nunca toca AGENTS.md nem stack.md (política projeto)", readFileSync(cp("AGENTS.md", proj), "utf8") === "# meu projeto\n" && readFileSync(cp(".agents/stack.md", proj), "utf8") === "minha stack\n");
ok("registro atualizado para a versão do kit", JSON.parse(readFileSync(cp("harness.json", proj), "utf8")).versao === "1.1.0");
w("harness.json", "", proj);
ok("verificar: registro ilegível não passa em silêncio", rodar("verificar", proj).status !== 0);
rmSync(cp("harness.json", proj));
ok("verificar: sem harness.json é grave", rodar("verificar", proj).status === 1);

// o harness.json do próprio kit real está em dia (só quando o kit está por perto)
const kitReal = join(AQUI, "..", "..", "..");
if (existsSync(join(kitReal, "VERSAO")) && existsSync(join(kitReal, "kit-claude-code"))) ok("harness.json do kit real em dia", rodar("gerar", kitReal, "--conferir").status === 0, "rode: node kit-claude-code/dot-claude/hooks/harness-manifesto.mjs gerar .");
for (const d of [kit, proj]) rmSync(d, { recursive: true, force: true });
