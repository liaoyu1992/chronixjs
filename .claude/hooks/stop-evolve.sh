#!/usr/bin/env bash
# stop-evolve.sh - Session-end analysis pipeline (Stop Hook entry point)
#
# Runs the four self-learning scripts in sequence. Each is independently
# fault-tolerant (`|| true`): a failure in one — e.g. AI analysis hitting HTTP
# 529, or a transient network error — no longer aborts the rest. Previously the
# `&&` chain in settings.local.json let a single error skip auto-evolve,
# extract_memory, and promote-to-team, wiping out an entire session's learning.
#
# Usage: bash stop-evolve.sh
# (settings.local.json Stop hook: "command": "bash .claude/hooks/stop-evolve.sh")
#
# CHRONIX-LOCAL NOTE: This file includes cygpath handling for Windows MSYS,
# which is NOT present in upstream claude-smart's stop.sh.
set -o pipefail

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
