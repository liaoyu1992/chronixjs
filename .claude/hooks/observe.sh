#!/usr/bin/env bash
# observe.sh - Claude Code Observation Hook Entry Point
# Called by Claude Code hooks (PreToolUse / PostToolUse)
# Usage: observe.sh <pre|post>
# Reads JSON from stdin (Claude Code passes tool call data via stdin)
#
# IMPORTANT: All paths are relative to the project root where .claude/ lives.
# Windows note: the project root is converted from MSYS form (/c/Users/...) to
# Windows form (C:\Users\...) via cygpath, because Python's pathlib mis-resolves
# /c/... to C:\c\... on Windows and would otherwise write data to the wrong place.

set -euo pipefail

PHASE="${1:-post}"

# Resolve project root from this script's location (../.. from .claude/hooks/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Convert MSYS path -> Windows path so Python pathlib resolves correctly.
if command -v cygpath >/dev/null 2>&1; then
  CLAUDE_DIR="$(cygpath -w "$PROJECT_ROOT/.claude")"
else
  CLAUDE_DIR="$PROJECT_ROOT/.claude"
fi

OBSERVE_PY="$CLAUDE_DIR/bin/observe.py"

# Find python3 - on Windows, python3 from PATH may redirect to Windows Store.
if command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  PYTHON3="python3"
elif command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  PYTHON3="python"
else
  PYTHON3="/c/Users/liaoyu/AppData/Local/Python/bin/python3.exe"
fi

# Read all stdin into a variable
INPUT=$(cat)

# Only process if we have actual input
if [ -z "$INPUT" ]; then
    exit 0
fi

# Delegate to Python script, passing phase and input
echo "$INPUT" | "$PYTHON3" "$OBSERVE_PY" "$PHASE" "$CLAUDE_DIR" 2>/dev/null || true

# Also run rotation check (silently)
"$PYTHON3" "$CLAUDE_DIR/bin/observations_rotate.py" "$CLAUDE_DIR" 2>/dev/null || true

exit 0
