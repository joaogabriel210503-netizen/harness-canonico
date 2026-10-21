#!/bin/sh
# Instala o pre-commit e o pre-push do harness no repositório (e em todos os
# worktrees dele: eles compartilham a pasta de hooks).
# Rode de novo depois de clonar: hook de git não viaja com o clone. O doctor
# (node .claude/hooks/doctor.mjs) confere se estão instalados e idênticos.
# Não usa core.hooksPath: o `graphify hook install` grava o post-commit em
# .git/hooks, e core.hooksPath faria o git ignorar essa pasta.
set -e
aqui=$(cd "$(dirname "$0")" && pwd)
destino=$(git -C "$aqui" rev-parse --path-format=absolute --git-path hooks)
mkdir -p "$destino"
for hook in pre-commit pre-push; do
  cp "$aqui/$hook" "$destino/$hook"
  chmod +x "$destino/$hook"
done
echo "pre-commit e pre-push instalados em $destino"
