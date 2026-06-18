#!/usr/bin/env python3
"""
observe.py - Observation Writer for Claude Code Self-Evolution System

Writes tool call observations to JSONL files.
Called by observe.sh hook script with:
  - argv[1]: phase (pre/post)
  - argv[2]: path to .claude directory
  - stdin: JSON data from Claude Code hook

Usage: echo '<json>' | python3 observe.py <pre|post> <claude_dir>
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def get_session_id(obs_dir: Path) -> str:
    """Get or create a session ID for the current Claude Code session."""
    session_file = obs_dir / ".current_session"
    try:
        if session_file.exists():
            mtime = session_file.stat().st_mtime
            if (datetime.now().timestamp() - mtime) < 1800:  # 30 min freshness
                return session_file.read_text().strip()
        # Create new session ID
        session_id = datetime.now().strftime("%Y%m%d-%H%M%S")
        obs_dir.mkdir(parents=True, exist_ok=True)
        session_file.write_text(session_id)
        return session_id
    except Exception:
        return datetime.now().strftime("%Y%m%d-%H%M%S")


def _to_win_path(p: str) -> str:
    """Convert Git Bash POSIX path (/c/Users/...) to Windows path (C:\\Users\\...)."""
    m = re.match(r'^/([a-zA-Z])/(.*)$', p)
    if m:
        return f"{m.group(1).upper()}:\\{m.group(2).replace('/', '\\')}"
    return p


def _is_path_like(s: str) -> bool:
    """Quick check if a string looks like a file path (not a URL/pattern/content)."""
    if len(s) < 3 or s.startswith("http") or s.startswith("git@"):
        return False
    # Windows absolute: C:\... or C:/...
    if re.match(r'^[a-zA-Z]:[/\\]', s):
        return True
    # POSIX absolute from Git Bash: /c/...
    if re.match(r'^/[a-zA-Z]/', s):
        return True
    return False


def normalize_paths(obj, project_root: str) -> any:
    """Recursively convert absolute paths to relative paths in a dict/list.

    Replaces any string value that is a path under project_root with a
    relative path. Handles Windows (C:\\Users\\...) and Git Bash POSIX
    (/c/Users/...) style paths. Output always uses forward slashes.
    """
    if isinstance(obj, dict):
        return {k: normalize_paths(v, project_root) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [normalize_paths(item, project_root) for item in obj]
    elif isinstance(obj, str):
        if not _is_path_like(obj):
            return obj
        try:
            # Normalize: convert POSIX (/c/Users/...) to Windows (C:\Users\...)
            if re.match(r'^/[a-zA-Z]/', obj):
                win_path = _to_win_path(obj)
            else:
                win_path = obj.replace("/", "\\")
            win_root = project_root.replace("/", "\\")

            rel = os.path.relpath(win_path, win_root)
            # If result goes outside project (starts with ..), keep original
            if rel.startswith(".."):
                return obj
            return rel.replace("\\", "/")  # Always use forward slashes
        except (ValueError, OSError):
            return obj
    else:
        return obj


def write_observation(phase: str, raw_input: str, claude_dir: str):
    """Write a single observation record to the JSONL file."""
    obs_dir = Path(claude_dir) / "data" / "observations"
    obs_file = obs_dir / "observations.jsonl"

    # Project root is parent of .claude/
    project_root = str(Path(claude_dir).parent.resolve())

    try:
        data = json.loads(raw_input) if raw_input.strip() else {}
    except json.JSONDecodeError:
        data = {"raw": raw_input[:500]}

    # Extract tool info from Claude Code hook data
    tool_name = "unknown"
    tool_input = {}
    bash_desc = None
    exit_code = None
    error_output = None

    if isinstance(data, dict):
        tool_name = data.get("tool_name", data.get("tool", "unknown"))
        tool_input = data.get("tool_input", data.get("input", {}))

        if isinstance(tool_input, str):
            try:
                tool_input = json.loads(tool_input)
            except json.JSONDecodeError:
                tool_input = {"raw": tool_input[:500]}

        if tool_name == "Bash" and isinstance(tool_input, dict):
            bash_desc = tool_input.get("description", None)

        # Extract execution results if available (for pitfall detection)
        exit_code = data.get("exit_code", data.get("result", {}).get("exit_code"))
        error_output = data.get("error", data.get("stderr", data.get("result", {}).get("stderr")))
        # Limit error output size to avoid bloat
        if isinstance(error_output, str) and len(error_output) > 1000:
            error_output = error_output[:1000] + "..."

    # Normalize all absolute paths to relative paths
    tool_input = normalize_paths(tool_input, project_root)
    if isinstance(bash_desc, str) and len(bash_desc) >= 3:
        bash_desc_normalized = normalize_paths({"v": bash_desc}, project_root)["v"]
        bash_desc = bash_desc_normalized
    if isinstance(error_output, str) and len(error_output) >= 3:
        error_output = normalize_paths({"v": error_output}, project_root)["v"]

    observation = {
        "session_id": get_session_id(obs_dir),
        "ts": datetime.now(timezone.utc).isoformat(),
        "phase": phase,
        "tool": tool_name,
        "input": tool_input,
        "bash_desc": bash_desc,
        "exit_code": exit_code,
        "error": error_output,
    }

    obs_dir.mkdir(parents=True, exist_ok=True)

    # NOTE: do NOT use errors="surrogatepass" — it can write lone surrogate
    # bytes (0xED ...) that are invalid UTF-8 and crash every downstream reader.
    with open(obs_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(observation, ensure_ascii=False, default=str) + "\n")


def main():
    if len(sys.argv) < 3:
        print("Usage: observe.py <pre|post> <claude_dir>", file=sys.stderr)
        sys.exit(1)

    phase = sys.argv[1]
    claude_dir = sys.argv[2]

    if phase not in ("pre", "post"):
        phase = "post"

    # Read raw stdin bytes and force UTF-8 decode. On Windows (especially zh-CN
    # systems) Python wraps stdin in the locale codec (cp936/GBK); Claude Code
    # pipes UTF-8 JSON, so sys.stdin.read() mis-decodes multibyte input into
    # surrogate codepoints, which then get written as invalid 0xED bytes.
    # errors="replace" turns any genuinely malformed bytes into U+FFFD so we
    # never persist invalid UTF-8.
    try:
        raw_input = sys.stdin.buffer.read().decode("utf-8", errors="replace")
    except (AttributeError, ValueError):
        raw_input = sys.stdin.read()
    if not raw_input.strip():
        return

    try:
        write_observation(phase, raw_input, claude_dir)
    except Exception as e:
        # Never crash — silently log error
        obs_dir = Path(claude_dir) / "data" / "observations"
        err_log = obs_dir / "observe_errors.log"
        try:
            obs_dir.mkdir(parents=True, exist_ok=True)
            with open(err_log, "a", encoding="utf-8") as f:
                f.write(f"{datetime.now().isoformat()} ERROR: {e}\n")
        except Exception:
            pass


if __name__ == "__main__":
    main()

