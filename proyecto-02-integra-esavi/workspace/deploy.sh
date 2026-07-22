#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> git pull"
cd "$WORKSPACE_DIR"
git pull

echo "==> build api-integra-esavi"
cd "$WORKSPACE_DIR/api-integra-esavi"
pnpm install
pnpm build

echo "==> build app-integra-esavi"
cd "$WORKSPACE_DIR/app-integra-esavi"
pnpm install
pnpm build

echo "==> pm2 restart"
cd "$WORKSPACE_DIR"
pm2 restart ecosystem.json

echo "==> deploy complete"
