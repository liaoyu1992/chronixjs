#!/usr/bin/env bash
# stop-evolve.sh - Session-end self-evolution pipeline (Stop hook)
# Chains four independent stages; each is wrapped in `|| true` so a failure
# in one never skips the rest:
#   1. auto-analyze-instincts  — observe patterns → personal instincts (stat + AI)
#   2. auto-evolve             — aggregate high-confidence instincts → auto-evolved.md
#   3. extract_memory          — pull factual knowledge → memory/raw/*.md
#   4. promote-to-team         — surface team-promotion candidates (gitignored)
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if command -v cygpath >/dev/null 2>&1; then
  CLAUDE_DIR="$(cygpath -w "$PROJECT_ROOT/.claude")"
else
  CLAUDE_DIR="$PROJECT_ROOT/.claude"
fi

BIN="$CLAUDE_DIR/bin"

python3 "$BIN/auto-analyze-instincts.py" "$CLAUDE_DIR" 2>/dev/null || true
python3 "$BIN/auto-evolve.py"          "$CLAUDE_DIR" 2>/dev/null || true
python3 "$BIN/extract_memory.py"       "$CLAUDE_DIR" 2>/dev/null || true
python3 "$BIN/promote-to-team.py"      "$CLAUDE_DIR" 2>/dev/null || true

exit 0
