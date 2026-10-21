// Configuração do vault: modo local (padrão) ou universal (vault fora do projeto, uma pasta por módulo).
// O modo fica em .claude/vault.json; sem o arquivo vale o local. No universal, a raiz vem da
// variável de ambiente HARNESS_VAULT_CENTRAL (DP-02c): o caminho muda por máquina e não vai para o git.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

export const VARIAVEL = "HARNESS_VAULT_CENTRAL";
export const COMUM = "_comum";

export function lerConfig(raiz) {
  try {
    const c = JSON.parse(readFileSync(join(raiz, ".claude", "vault.json"), "utf8"));
    if (c?.modo === "universal" && typeof c.modulo === "string" && c.modulo) return { modo: "universal", modulo: c.modulo };
  } catch {
    // sem arquivo ou arquivo quebrado: modo local
  }
  return { modo: "local" };
}

// Raiz central resolvida, ou undefined (modo local ou variável ausente).
export function raizCentral(raiz, env = process.env) {
  if (lerConfig(raiz).modo !== "universal") return undefined;
  const v = env[VARIAVEL];
  return v ? resolve(v) : undefined;
}

export const dentroDe = (caminho, base) => caminho === base || caminho.startsWith(base + sep);

// Ferramentas do servidor comum que só leem. Qualquer outra do servidor comum é escrita.
export const LEITURA_COMUM = /^(search|read|list|get|find)_/;

// Servidores harness-vault-<x>: só "comum" é aceito (o próprio módulo é o harness-vault).
export function servidorEstranho(tool) {
  const m = /^mcp__harness-vault-(.+?)__(.+)$/.exec(String(tool));
  if (!m) return undefined;
  if (m[1] === "comum") return LEITURA_COMUM.test(m[2]) ? undefined : "escrita no comum";
  return "outro módulo";
}

export function existeCentral(raiz, env = process.env) {
  const c = lerConfig(raiz);
  const r = raizCentral(raiz, env);
  return { config: c, raiz: r, modulo: r && existsSync(join(r, c.modulo)), comum: r && existsSync(join(r, COMUM)) };
}
