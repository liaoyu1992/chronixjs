#!/usr/bin/env bash
# stop.sh - Session-end analysis pipeline (Stop Hook entry point)
#
# Runs the five self-learning scripts in sequence. Each is independently
# fault-tolerant (|| true): a failure in one does not abort the rest.

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

# 1. Analyze observations -> instinct files (statistical detectors + AI semantic)
"$PYTHON3" "$QODER_DIR/bin/auto-analyze-instincts.py" "$QODER_DIR" 2>/dev/null || true
# 2. Aggregate high-confidence instincts -> rules/auto-evolved.md
"$PYTHON3" "$QODER_DIR/bin/auto-evolve.py" "$QODER_DIR" 2>/dev/null || true
# 3. Extract knowledge memories -> memory/raw/
"$PYTHON3" "$QODER_DIR/bin/extract_memory.py" "$QODER_DIR" 2>/dev/null || true
# 4. Consolidate instincts -> GC deprecated backlog, merge near-dups, prune noise
"$PYTHON3" "$QODER_DIR/bin/consolidate_instincts.py" "$QODER_DIR" 2>/dev/null || true
# 5. Promote high-confidence instincts -> team review candidates (gitignored)
"$PYTHON3" "$QODER_DIR/bin/promote-to-team.py" "$QODER_DIR" 2>/dev/null || true

exit 0
