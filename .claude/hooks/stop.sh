#!/usr/bin/env bash
# stop.sh - Session-end analysis pipeline (Stop Hook entry point)
#
# Runs the four self-learning scripts in sequence. Each is independently
# fault-tolerant (`|| true`): a failure in one — e.g. AI analysis hitting HTTP
# 529, or a transient network error — no longer aborts the rest. Previously the
# `&&` chain in settings.local.json let a single error skip auto-evolve,
# extract_memory, and promote-to-team, wiping out an entire session's learning.
#
# Usage: bash stop.sh
# (settings.local.json Stop hook: "command": "bash .claude/hooks/stop.sh")

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"

# 1. Analyze observations -> instinct files (statistical detectors + AI semantic)
python3 "$CLAUDE_DIR/bin/auto-analyze-instincts.py" "$CLAUDE_DIR" 2>/dev/null || true
# 2. Aggregate high-confidence instincts -> rules/auto-evolved.md
python3 "$CLAUDE_DIR/bin/auto-evolve.py" "$CLAUDE_DIR" 2>/dev/null || true
# 3. Extract knowledge memories -> memory/raw/
python3 "$CLAUDE_DIR/bin/extract_memory.py" "$CLAUDE_DIR" 2>/dev/null || true
# 4. Promote high-confidence instincts -> team review candidates (gitignored)
python3 "$CLAUDE_DIR/bin/promote-to-team.py" "$CLAUDE_DIR" 2>/dev/null || true

exit 0
