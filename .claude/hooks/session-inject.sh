#!/usr/bin/env bash
# session-inject.sh - Recall + inject memory at session start (SessionStart hook)
# Runs inject_memory_context.py which:
#   - loads memory/*.md + memory/raw/*.md
#   - TTL-cleans expired memories
#   - syncs embeddings (Ollama nomic-embed-text) with Qdrant/NumPy fallback
#   - recalls Top-5 (vector, or BM25 fallback) and writes rules/injected-memory.md
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if command -v cygpath >/dev/null 2>&1; then
  CLAUDE_DIR="$(cygpath -w "$PROJECT_ROOT/.claude")"
else
  CLAUDE_DIR="$PROJECT_ROOT/.claude"
fi

python3 "$CLAUDE_DIR/memory/inject_memory_context.py" "$CLAUDE_DIR" 2>/dev/null || true

exit 0
