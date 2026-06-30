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

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Convert MSYS path -> Windows path so Python pathlib resolves correctly.
# Without this on Windows, /d/work/chronix resolves to C:\d\work\... instead of D:\work\...
if command -v cygpath >/dev/null 2>&1; then
  CLAUDE_DIR="$(cygpath -w "$PROJECT_ROOT/.claude")"
else
  CLAUDE_DIR="$PROJECT_ROOT/.claude"
fi

# Find python3 - on Windows, python3 from PATH may redirect to Windows Store.
# Prefer the Python installation if available.
if command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  PYTHON3="python3"
elif command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  PYTHON3="python"
else
  # Last resort: try common Windows paths
  PYTHON3="/c/Users/liaoyu/AppData/Local/Python/bin/python3.exe"
fi

# 1. Analyze observations -> instinct files (statistical detectors + AI semantic)
"$PYTHON3" "$CLAUDE_DIR/bin/auto-analyze-instincts.py" "$CLAUDE_DIR" 2>/dev/null || true
# 2. Aggregate high-confidence instincts -> rules/auto-evolved.md
"$PYTHON3" "$CLAUDE_DIR/bin/auto-evolve.py" "$CLAUDE_DIR" 2>/dev/null || true
# 3. Extract knowledge memories -> memory/raw/
"$PYTHON3" "$CLAUDE_DIR/bin/extract_memory.py" "$CLAUDE_DIR" 2>/dev/null || true
# 4. Consolidate instincts -> GC deprecated backlog, merge near-dups, prune noise
"$PYTHON3" "$CLAUDE_DIR/bin/consolidate_instincts.py" "$CLAUDE_DIR" 2>/dev/null || true
# 5. Promote high-confidence instincts -> team review candidates (gitignored)
"$PYTHON3" "$CLAUDE_DIR/bin/promote-to-team.py" "$CLAUDE_DIR" 2>/dev/null || true

exit 0
