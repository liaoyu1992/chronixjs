#!/usr/bin/env bash
# session-inject.sh - Recall + inject memory at session start (SessionStart hook)
# Runs inject_memory_context.py which:
#   - loads memory/*.md + memory/raw/*.md
#   - TTL-cleans expired memories
#   - syncs embeddings (Ollama nomic-embed-text) with Qdrant/NumPy fallback
#   - recalls Top-5 (vector, or BM25 fallback) and writes rules/injected-memory.md
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if command -v cygpath >/dev/null 2>&1; then
  QODER_DIR="$(cygpath -w "$PROJECT_ROOT/.qoder")"
else
  QODER_DIR="$PROJECT_ROOT/.qoder"
fi

# Source AI gateway env vars (ANTHROPIC_BASE_URL, token, model)
ENV_FILE="$PROJECT_ROOT/.qoder/config/ai-gateway.env"
[ -f "$ENV_FILE" ] && source "$ENV_FILE"

if command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  PYTHON3="python3"
elif command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  PYTHON3="python"
else
  exit 0
fi

"$PYTHON3" "$QODER_DIR/memory/inject_memory_context.py" "$QODER_DIR" 2>/dev/null || true

exit 0
