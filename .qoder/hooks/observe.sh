#!/usr/bin/env bash
# observe.sh - Qoder Observation Hook Entry Point
# Called by Qoder hooks (PreToolUse / PostToolUse)
# Usage: observe.sh <pre|post>
# Reads JSON from stdin (Qoder passes tool call data via stdin)

set -eo pipefail

PHASE="${1:-post}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if command -v cygpath >/dev/null 2>&1; then
  QODER_DIR="$(cygpath -w "$PROJECT_ROOT/.qoder")"
else
  QODER_DIR="$PROJECT_ROOT/.qoder"
fi

OBSERVE_PY="$QODER_DIR/bin/observe.py"

if command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  PYTHON3="python3"
elif command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  PYTHON3="python"
else
  exit 0
fi

INPUT=$(cat)

if [ -z "$INPUT" ]; then
    exit 0
fi

(echo "$INPUT" | "$PYTHON3" "$OBSERVE_PY" "$PHASE" "$QODER_DIR" 2>/dev/null || true) || true

("$PYTHON3" "$QODER_DIR/bin/observations_rotate.py" "$QODER_DIR" 2>/dev/null || true) || true

exit 0
