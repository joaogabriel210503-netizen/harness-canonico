#!/usr/bin/env node
// SessionStart. Diz à sessão onde cada demanda está, para ela não começar às
// cegas, e avisa quando algo desliga as travas (doctor.mjs, versão rápida).
// É hook de contexto: se falhar, a sessão abre sem o aviso (modo "contexto").
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { verificar } from "./doctor.mjs";
import { projectDir, run, saida } from "./hook-io.mjs";

run(
  (event) => {
    const raiz = projectDir(event);
    const base = join(raiz, "docs", "fluxo");
    const linhas = [];
    if (existsSync(base)) {
      for (const nome of readdirSync(base)) {
        const arq = join(base, nome, "estado.md");
        if (!existsSync(arq) || !statSync(arq).isFile()) continue;
        const txt = readFileSync(arq, "utf8");
        const etapa = /\*\*Etapa atual:\*\*\s*(.+)/.exec(txt)?.[1]?.trim() ?? "?";
        const branch = /\*\*Branch:\*\*\s*(.+)/.exec(txt)?.[1]?.trim() ?? "?";
        linhas.push(`- ${nome}: etapa ${etapa}, branch ${branch}`);
      }
    }
    let corpo = linhas.length
      ? `Demandas em andamento (docs/fluxo/<demanda>/estado.md é a fonte):\n${linhas.join("\n")}\nLeia o estado.md da demanda antes de agir.`
      : "Nenhuma demanda em andamento. Se o humano trouxer um pedido, o tech-lead conduz E0 (.agents/fluxo.md).";

    const falhas = verificar(raiz, { rapido: true }).filter((i) => !i.passou && i.grave);
    const saidaJson = { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: corpo } };
    if (falhas.length > 0) {
      const alertas = falhas.map((f) => `- ${f.nome}${f.detalhe ? `: ${f.detalhe}` : ""}`).join("\n");
      corpo += `\n\nALERTAS DO HARNESS (as travas podem estar desligadas; diga ao humano antes de trabalhar):\n${alertas}`;
      saidaJson.hookSpecificOutput.additionalContext = corpo;
      saidaJson.systemMessage = `Harness: ${falhas.length} alerta(s). Rode: node .claude/hooks/doctor.mjs`;
    }
    saida(JSON.stringify(saidaJson));
  },
  { modo: "contexto" },
);
