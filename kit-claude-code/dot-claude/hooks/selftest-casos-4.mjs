// Casos dos hooks, parte 4 (W1): despachante, escrita por Bash no escopo-guard e vault-guard no parser compartilhado.
import { bash, caso, ferr, escreve, sub } from "./selftest-lib.mjs";

// ---- despachante: o mesmo resultado das guardas, num processo só
const DP = "despachante.mjs";
caso("despachante: Write em eslint.config.mjs (rules-guard)", DP, escreve("eslint.config.mjs", "x"), 2);
caso("despachante: Read em vault/ (vault-guard)", DP, ferr("Read", { file_path: "vault/03-conhecimento/x.md" }), 2);
caso("despachante: git push (commit-guard)", DP, bash("git push origin main"), 2);
caso("despachante: Agent general-purpose (despacho-guard)", DP, ferr("Agent", { subagent_type: "general-purpose", prompt: "x", description: "x" }), 2);
caso("despachante: Write de código da sessão principal (escopo-guard)", DP, escreve("src/a.ts", "export const a = 1;\n"), 2);
caso("despachante: Write com chave AWS (segredo-guard)", DP, escreve("docs/a.md", `k=${"AK"}${"IA"}ABCDEFGHIJKLMNOP`), 2);
caso("despachante: comando inocente passa", DP, bash("ls -la"), 0);
caso("despachante: Write em docs/ passa", DP, escreve("docs/notas.md", "ok\n"), 0);
caso("despachante: ferramenta fora da tabela passa", DP, ferr("WebFetch", { url: "https://exemplo.com" }), 0);
caso("despachante: entrada ilegível bloqueia", DP, {}, 2, {}, "{quebrado");

// ---- escopo-guard: escrita por Bash vale como escrita por ferramenta
const E = "escopo-guard.mjs";
caso("Bash: sessão principal escreve código com redirecionamento", E, bash("echo x > src/a.ts"), 2);
caso("Bash: sessão principal escreve código com tee", E, bash("echo x | tee src/a.ts"), 2);
caso("Bash: sessão principal com sed -i em código", E, bash("sed -i 's/a/b/' src/a.ts"), 2);
caso("Bash: sessão principal escreve em docs/", E, bash("echo x > docs/a.md"), 0);
caso("Bash: sessão principal escreve em /tmp", E, bash("echo x > /tmp/saida.txt"), 0);
caso("Bash: sessão principal apaga node_modules", E, bash("rm -rf node_modules"), 0);
caso("Bash: sessão principal apaga código", E, bash("rm src/a.ts"), 2);
caso("Bash: git checkout de ramo (não é arquivo)", E, bash("git checkout demanda/x"), 0);
caso("Bash: git checkout -- código", E, bash("git checkout -- src/a.ts"), 2);
caso("Bash: sem escrita nenhuma", E, bash("npm run lint"), 0);
caso("Bash: implementadora escreve código", E, bash("echo x > src/a.ts", sub("backend-specialist")), 0);
caso("Bash: code-reviewer escreve código", E, bash("echo x > src/a.ts", sub("code-reviewer")), 2);
caso("Bash: code-reviewer escreve o relato", E, bash("echo x > docs/fluxo/d1/relato.md", sub("code-reviewer")), 0);
caso("Bash: test-engineer escreve teste", E, bash("echo x > src/a.test.ts", sub("test-engineer")), 0);
caso("Bash: test-engineer escreve código", E, bash("echo x > src/a.ts", sub("test-engineer")), 2);
caso("Bash: subagente escreve em .agents/memory/", E, bash("echo x > .agents/memory/MEMORY.md", sub("backend-specialist")), 2);

// ---- vault-guard no parser compartilhado (N33): comando escondido dentro de outro
const V = "vault-guard.mjs";
caso("Bash: sh -c lendo vault/", V, bash('sh -c "cat vault/x.md"'), 2);
caso("Bash: $(...) lendo vault/", V, bash("echo $(cat vault/x.md)"), 2);
caso("Bash: eval lendo vault/", V, bash('eval "ls vault/"'), 2);
caso("Bash: comando que só cita vault/ no texto", V, bash('git commit -m "docs sobre vault/ novo"'), 0);

// ---- chmod: o modo não é arquivo, o arquivo é
const R = "rules-guard.mjs";
caso("Bash: chmod +x em arquivo de regra", R, bash("chmod +x .githooks/pre-commit"), 2);
caso("Bash: chmod -R 755 em script comum", R, bash("chmod -R 755 scripts"), 0);

// ---- W2: a frase de aprovação é do humano (maestri ask, SendMessage)
caso("Bash: maestri ask com 'Aprovo a SPEC.'", R, bash('maestri ask "Revisor" "Aprovo a SPEC."'), 2);
caso("Bash: maestri ask com 'Aprovo o plano.' em outra caixa", R, bash("maestri ask Revisor 'aprovo o plano'"), 2);
caso("Bash: maestri ask comum", R, bash('maestri ask "Revisor" "revise o diff da branch"'), 0);
caso("Bash: maestri ask que cita o plano sem a frase", R, bash('maestri ask "Revisor" "o plano foi aprovado ontem"'), 0);
caso("SendMessage com 'Aprovo a SPEC.'", R, ferr("SendMessage", { to: "x", message: "Aprovo a SPEC." }), 2);
caso("SendMessage comum", R, ferr("SendMessage", { to: "x", message: "terminei a tarefa T01" }), 0);
