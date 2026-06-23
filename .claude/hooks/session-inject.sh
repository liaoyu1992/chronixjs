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
  CLAUDE_DIR="$(cygpath -w "$PROJECT_ROOT/.claude")"
else
  CLAUDE_DIR="$PROJECT_ROOT/.claude"
fi

# Find python3 - on Windows, python3 from PATH may redirect to Windows Store.
if command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  PYTHON3="python3"
elif command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  PYTHON3="python"
else
  PYTHON3="/c/Users/liaoyu/AppData/Local/Python/bin/python3.exe"
fi

"$PYTHON3" "$CLAUDE_DIR/memory/inject_memory_context.py" "$CLAUDE_DIR" 2>/dev/null || true

exit 0
