// Plugin do OpenCode (API v2). O loader v2 exige export default com `id` e `setup`
// (OpenCode 2.x). A API v1 (export nomeado devolvendo { "tool.execute.before": ... })
// falhava ABERTO no 2.x: o plugin não carregava e o OpenCode seguia sem a guarda
// (teste-mac defeito 7). Sem import de pacote de plugin para não depender do nome
// exato (@opencode/plugin no 2.x, @opencode-ai/plugin no 1.x): o loader valida pela
// forma (id + setup). Papel fixo: a Infra (OpenCode) é a persona devops-engineer.
// Bloquear = lançar erro dentro do callback. NÃO validado com um modelo rodando:
// o primeiro teste real do Gabriel é pedir uma escrita em src/ e um git commit e
// ver o bloqueio (.agents/adaptadores.md).
import { spawnSync } from "node:child_process";
import { join } from "node:path";

type Ctx = {
  directory?: string;
  worktree?: string;
  project?: { directory?: string };
  tool?: { hook?: (evento: string, cb: (e: { tool?: string; input?: Record<string, unknown> }) => void) => Promise<void> | void };
};

export default {
  id: "harness-guard",
  async setup(ctx: Ctx) {
    const dir = ctx?.directory ?? ctx?.worktree ?? ctx?.project?.directory ?? process.cwd();
    const guarda = join(dir, ".claude", "hooks", "guarda-externa.mjs");
    const antes = (event: { tool?: string; input?: Record<string, unknown> }) => {
      const r = spawnSync("node", [guarda, "opencode", "devops-engineer"], {
        input: JSON.stringify({ cwd: dir, tool_name: event?.tool, tool_input: event?.input ?? {} }),
        encoding: "utf8",
        env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
      });
      // Guarda ausente, quebrada ou que bloqueou: a ação não acontece (falha fechada).
      if (r.status !== 0) throw new Error((r.stderr || "trava do harness falhou (guarda-externa.mjs)").trim());
    };
    if (ctx?.tool?.hook) {
      await ctx.tool.hook("execute.before", antes);
    } else {
      // Sem o ponto de registro esperado: falhar visível, não em silêncio.
      process.stderr.write("harness-guard: ctx.tool.hook ausente; a guarda NÃO foi registrada (confira a versão do OpenCode).\n");
    }
  },
};
