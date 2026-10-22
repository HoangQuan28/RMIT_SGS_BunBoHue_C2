#!/usr/bin/env bash
# UniSign Forum Production Runner
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="production"

echo "=========================================================="
echo " Starting UniSign Forum (Production Mode) on port ${PORT}..."
echo "=========================================================="

if [ -f ".next/standalone/server.js" ]; then
    # Standalone Next.js engine
    exec node .next/standalone/server.js
else
    # Standard Next.js server
    exec npx next start -p "${PORT}"
fi
