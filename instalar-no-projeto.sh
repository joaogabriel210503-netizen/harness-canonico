#!/bin/sh
# Instala o harness num projeto.
# Uso: sh instalar-no-projeto.sh [--modo local|universal] [--modulo <nome>] /caminho/do/projeto
#   --modo local      (padrão) vault/ dentro do projeto; um servidor harness-vault.
#   --modo universal  vault da Central, fora do projeto (variável HARNESS_VAULT_CENTRAL):
#                     uma pasta por módulo e _comum/ (só leitura). Exige --modulo (ex.: slon).
#   Sem --modo e com terminal, o script pergunta; sem terminal, assume local.
#
# Copia arquivo por arquivo e nunca sobrescreve. Se um arquivo já existe e é
# idêntico, segue. Se existe e é diferente, é um CONFLITO: o arquivo do projeto
# fica como está, o conflito é listado no fim e o script sai com código 2
# ("instalação incompleta"). Resolver o conflito é feito à mão, com o arquivo
# do kit ao lado.
#
# Os arquivos do Claude Code vivem no kit como kit-claude-code/dot-claude e
# dot-mcp.json (ferramentas remotas não escrevem em pastas ocultas); aqui eles
# ganham o nome final.
set -e
aqui=$(cd "$(dirname "$0")" && pwd)
modo=""
modulo=""
destino=""
while [ $# -gt 0 ]; do
  case "$1" in
    --modo) modo=${2:?--modo exige local ou universal}; shift 2 ;;
    --modulo) modulo=${2:?--modulo exige o nome do módulo}; shift 2 ;;
    -*) echo "opção desconhecida: $1" >&2; exit 1 ;;
    *) [ -z "$destino" ] || { echo "mais de um destino: \"$destino\" e \"$1\". Caminho com espaço vai entre aspas." >&2; exit 1; }; destino=$1; shift ;;
  esac
done
[ -n "$destino" ] || { echo "uso: sh instalar-no-projeto.sh [--modo local|universal] [--modulo <nome>] /caminho/do/projeto" >&2; exit 1; }
if [ -z "$modo" ]; then
  if [ -t 0 ]; then
    printf 'Modo do vault: [1] local (padrão: projeto de cliente, pessoal ou fora da Central)  [2] universal (ecossistema Central)? '
    read -r resp
    case "$resp" in 2|universal) modo=universal ;; *) modo=local ;; esac
  else
    modo=local
  fi
fi
case "$modo" in
  local) ;;
  universal)
    if [ -z "$modulo" ] && [ -t 0 ]; then printf 'Nome do módulo (kebab-case, ex.: slon): '; read -r modulo; fi
    case "$modulo" in ''|-*|*[!a-z0-9-]*) echo "--modo universal exige --modulo <nome> em kebab-case (ex.: slon). Nada foi copiado." >&2; exit 1 ;; esac ;;
  *) echo "--modo deve ser local ou universal" >&2; exit 1 ;;
esac
vc="$aqui/kit-claude-code/dot-claude/hooks/vault-config.mjs"
mkdir -p "$destino"
destino=$(cd "$destino" && pwd)
relatorio=$(mktemp)
trap 'rm -f "$relatorio"' EXIT

copia_arquivo() { # origem destino
  # O lock dos gates é do projeto (o humano o grava com travar-gates): nunca conflita.
  if [ -e "$2" ] && [ "$(basename "$2")" = "gates.lock.json" ]; then return 0; fi
  if [ ! -e "$2" ]; then
    mkdir -p "$(dirname "$2")"
    cp "$1" "$2"
  elif ! cmp -s "$1" "$2"; then
    echo "$2   (versão do kit: $1)" >> "$relatorio"
  fi
}

copia() { # origem destino: arquivo ou pasta, sempre arquivo por arquivo
  if [ -d "$1" ]; then
    (cd "$1" && find . -type f) | while IFS= read -r rel; do
      copia_arquivo "$1/$rel" "$2/$rel"
    done
  else
    copia_arquivo "$1" "$2"
  fi
}

copia "$aqui/AGENTS.md" "$destino/AGENTS.md"
# CLAUDE.md: o do projeto é dele (o do kit é só "@AGENTS.md"). Só é criado se faltar; se já
# existe, a única exigência é importar a constituição (conferido mais abaixo).
[ -e "$destino/CLAUDE.md" ] || cp "$aqui/CLAUDE.md" "$destino/CLAUDE.md"
copia "$aqui/.agents" "$destino/.agents"
copia "$aqui/.githooks" "$destino/.githooks"
copia "$aqui/kit-claude-code/dot-claude" "$destino/.claude"
if [ "$modo" = universal ]; then
  tmp=$(mktemp -d)
  node "$vc" json universal "$modulo" > "$tmp/vault.json"
  node "$vc" mcp "$aqui/kit-claude-code/dot-mcp.json" "$modulo" > "$tmp/mcp.json"
  copia_arquivo "$tmp/vault.json" "$destino/.claude/vault.json"
  copia_arquivo "$tmp/mcp.json" "$destino/.mcp.json"
  rm -rf "$tmp"
  if [ -n "${HARNESS_VAULT_CENTRAL:-}" ] && [ -d "$HARNESS_VAULT_CENTRAL" ]; then
    node "$vc" iniciar "$aqui/.agents/templates/vault-skeleton" "$modulo"
  fi
else
  copia "$aqui/kit-claude-code/dot-mcp.json" "$destino/.mcp.json"
  copia "$aqui/.agents/templates/vault-skeleton" "$destino/vault"
fi

# Codex (.codex/) e OpenCode (.opencode/): hooks, subagentes de revisão, regras, vault. Veja .agents/adaptadores.md.
copia "$aqui/kit-codex/dot-codex/agents" "$destino/.codex/agents"
copia "$aqui/kit-codex/dot-codex/rules" "$destino/.codex/rules"
copia "$aqui/kit-codex/dot-codex/hooks.json" "$destino/.codex/hooks.json"
tmp=$(mktemp -d)
if [ "$modo" = universal ]; then
  { cat "$aqui/kit-codex/dot-codex/config.toml"; echo; node "$vc" toml "$aqui/kit-claude-code/dot-mcp.json" "$modulo"; } > "$tmp/config.toml"
else
  { cat "$aqui/kit-codex/dot-codex/config.toml"; echo; node "$vc" toml "$aqui/kit-claude-code/dot-mcp.json"; } > "$tmp/config.toml"
fi
copia_arquivo "$tmp/config.toml" "$destino/.codex/config.toml"
rm -rf "$tmp"
copia "$aqui/kit-opencode/dot-opencode" "$destino/.opencode"
copia "$aqui/kit-opencode/opencode.json" "$destino/opencode.json"

# Gates de lint (perfil web): conteúdo de gates-web/ vai para a raiz.
# biome.jsonc tem nome biome.jsonc.modelo no kit para o Biome 2.x NÃO tratar a
# cópia dentro de .agents/ como segunda configuração raiz (teste-mac defeito 3);
# na raiz do projeto ele vira biome.jsonc, com o mesmo conteúdo (não muda o lock).
copia "$aqui/.agents/templates/gates-web/biome.jsonc.modelo" "$destino/biome.jsonc"
for item in sem-supressao.mjs eslint.config.mjs eslint.typed.config.mjs eslint-rules selftest.mjs; do
  copia "$aqui/.agents/templates/gates-web/$item" "$destino/$item"
done

# CLAUDE.md que já existia precisa importar a constituição.
if [ -f "$destino/CLAUDE.md" ] && ! grep -q '@AGENTS.md' "$destino/CLAUDE.md"; then
  echo "$destino/CLAUDE.md   (falta a linha @AGENTS.md: sem ela o Claude Code não carrega a constituição)" >> "$relatorio"
fi

# .gitignore e .graphifyignore: acrescentam só as linhas que faltam.
for arq in .gitignore .graphifyignore; do
  touch "$destino/$arq"
  # arquivo sem newline final: sem isto a primeira linha nova gruda na última
  if [ -s "$destino/$arq" ] && [ "$(tail -c 1 "$destino/$arq" | wc -l | tr -d ' ')" = "0" ]; then
    echo >> "$destino/$arq"
  fi
  while IFS= read -r linha; do
    grep -qxF "$linha" "$destino/$arq" || echo "$linha" >> "$destino/$arq"
  done < "$aqui/$arq"
done

# Pre-commit do git, se já for um repositório.
if git -C "$destino" rev-parse --git-dir >/dev/null 2>&1; then
  (cd "$destino" && sh .githooks/instalar.sh)
else
  echo "Aviso: $destino ainda não é um repositório git. Rode 'git init' e depois 'sh .githooks/instalar.sh'."
fi

# Registro da instalação (versão e hash de cada arquivo do kit): base do verificar e do atualizar.
if command -v node >/dev/null 2>&1; then
  node "$aqui/kit-claude-code/dot-claude/hooks/harness-manifesto.mjs" registrar "$aqui" "$destino"
else
  echo "Aviso: node não encontrado; harness.json não foi gravado (o verificar e o atualizar dependem dele)."
fi

if [ -s "$relatorio" ]; then
  echo ""
  echo "INSTALAÇÃO INCOMPLETA. Estes arquivos já existiam e são diferentes do kit; nada foi sobrescrito:"
  sed 's/^/  /' "$relatorio"
  echo ""
  echo "Mescle à mão (hooks de settings.json, mcpServers de .mcp.json, a linha @AGENTS.md no CLAUDE.md) e rode de novo: o script é seguro de repetir."
  exit 2
fi

echo "Instalado em $destino"
cat <<MSG

Modo do vault: $modo$([ "$modo" = universal ] && echo " (módulo $modulo)")
MSG
if [ "$modo" = universal ]; then
  cat <<MSG
  Defina HARNESS_VAULT_CENTRAL com a pasta do vault da Central (fora do git, por máquina) e rode:
    HARNESS_VAULT_CENTRAL=<pasta> node "$vc" iniciar "$aqui/.agents/templates/vault-skeleton" $modulo
  O doctor confere a variável e as pastas. Pré-requisito da Central: remoto e backup.
MSG
fi
cat <<'MSG'

Faltam, nesta ordem:
  1. Mesclar .agents/templates/gates-web/package-scripts.json no package.json e rodar npm install.
  2. Preencher o nome em AGENTS.md e a stack (incluindo as pastas de código) em .agents/stack.md; conferir SOURCE_DIRS em eslint.config.mjs.
  3. node .claude/hooks/selftest.mjs   e   npm run gates:selftest   (os dois precisam sair com zero).
  Depois de clonar o projeto em outra máquina: sh .githooks/instalar.sh (o pre-commit do git não viaja com o clone).
MSG
