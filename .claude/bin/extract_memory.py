#!/usr/bin/env python3
"""
extract_memory.py - Knowledge Memory Extraction Script

Runs at session end (Stop Hook), right branch of the self-learning loop.
Extracts knowledge memories from observation data and writes to memory/raw/.

Complements the Instinct system (which handles behavioral patterns) by
extracting factual knowledge: Bug solutions, technical decisions, project context.

Data flow (from article Image 4):
  Stop Hook → extract_memory.py → memory/raw/ → (next session) inject_memory_context.py

Usage: python3 extract_memory.py <claude_dir>
"""

import json
import os
import re
import subprocess
import sys
import hashlib
from datetime import datetime, timezone
from pathlib import Path

# ---------- Configuration ----------

CLAUDE_CLI = "claude"
EXTRACT_MODEL = "claude-haiku-4-5-20251001"
MAX_OBS_FOR_EXTRACT = 200  # Limit observations sent to AI for cost control

# ---------- Path Helpers ----------


def get_paths(claude_dir: str):
    base = Path(claude_dir)
    return {
        "obs_file": base / "data" / "observations" / "observations.jsonl",
        "raw_dir": base / "memory" / "raw",
        "claude_dir": base,
    }


# ---------- Observation Loading ----------


def load_recent_observations(obs_file: Path, limit: int = 500) -> list[dict]:
    """Load most recent observations from JSONL file."""
    if not obs_file.exists():
        return []
    lines = []
    with open(obs_file, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            lines.append(line.strip())
    recent = lines[-limit:]
    result = []
    for line in recent:
        if not line:
            continue
        try:
            result.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return result


def get_current_session_observations(observations: list[dict]) -> list[dict]:
    """Get observations from the current (most recent) session."""
    if not observations:
        return []
    latest_session = observations[-1].get("session_id", "")
    return [o for o in observations if o.get("session_id") == latest_session]


# ---------- Observation Summarization ----------


def summarize_session(session_obs: list[dict]) -> str:
    """Create a concise text summary of session observations for AI extraction."""
    summary_lines = []
    for obs in session_obs[:MAX_OBS_FOR_EXTRACT]:
        tool = obs.get("tool", "?")
        phase = obs.get("phase", "")
        tool_input = obs.get("input", {})
        bash_desc = obs.get("bash_desc")
        ts = obs.get("ts", "")[:19]

        line = f"[{ts}] {phase.upper()} {tool}"
        if isinstance(tool_input, dict):
            if tool == "Edit":
                fp = tool_input.get("file_path", "")
                # old_string / new_string preview
                old = tool_input.get("old_string", "")[:50]
                new = tool_input.get("new_string", "")[:50]
                line += f" file={fp}"
                if old:
                    line += f" old='{old}...'"
                if new:
                    line += f" new='{new}...'"
            elif tool == "Bash":
                cmd = tool_input.get("command", "")[:120]
                line += f" cmd={cmd}"
            elif tool == "Read":
                fp = tool_input.get("file_path", "")
                line += f" file={fp}"
            elif tool in ("Grep", "Glob"):
                pat = tool_input.get("pattern", "")
                line += f" pattern={pat}"
        if bash_desc:
            line += f" desc={bash_desc}"
        summary_lines.append(line)

    return "\n".join(summary_lines)


# ---------- AI Extraction ----------


def build_extraction_prompt(obs_text: str) -> str:
    """Build the prompt for Claude to extract knowledge memories."""
    return f"""You are analyzing a developer's Claude Code session to extract **knowledge memories** — factual information worth remembering for future sessions.

Focus on extracting:
1. **Bug solutions**: errors encountered and how they were fixed
2. **Technical decisions**: architecture choices, library selections, design patterns applied
3. **Project context**: directory structure, config files, tech stack details
4. **Workflow knowledge**: useful commands, build steps, test procedures discovered

For each memory found, output a JSON object with:
- "name": short-kebab-case slug (unique identifier)
- "description": one-line summary of this knowledge
- "type": one of ["project", "reference"] (NOT "user" or "feedback" — those are manually curated)
- "body": the knowledge content in Markdown, 2-5 sentences

If the session has no extractable knowledge, return [].

IMPORTANT:
- Only extract genuinely new/valuable knowledge, not trivial operations
- Do NOT duplicate information that would already be in CLAUDE.md or project docs
- Each memory should be atomic and self-contained

Observation Log:
{obs_text}

Output ONLY the JSON array, no other text."""


def run_extraction(session_obs: list[dict]) -> list[dict]:
    """Run AI extraction via Claude CLI to get knowledge memories."""
    if not session_obs:
        return []

    obs_text = summarize_session(session_obs)
    if not obs_text.strip():
        return []

    prompt = build_extraction_prompt(obs_text)

    try:
        result = subprocess.run(
            [CLAUDE_CLI, "--print", "--model", EXTRACT_MODEL, "-p", prompt],
            capture_output=True, text=True, timeout=60
        )
        output = result.stdout.strip()

        # Strip markdown code fences
        cleaned = re.sub(r'```(?:json)?\s*', '', output)
        cleaned = re.sub(r'```\s*', '', cleaned).strip()

        # Try direct JSON parse
        try:
            memories = json.loads(cleaned)
            if isinstance(memories, list):
                return [m for m in memories if isinstance(m, dict) and m.get("name")]
        except json.JSONDecodeError:
            pass

        # Fallback: find the last top-level JSON array
        last_bracket = cleaned.rfind('[')
        if last_bracket >= 0:
            try:
                memories = json.loads(cleaned[last_bracket:])
                if isinstance(memories, list):
                    return [m for m in memories if isinstance(m, dict) and m.get("name")]
            except json.JSONDecodeError:
                pass
    except (subprocess.TimeoutExpired, Exception):
        pass

    return []


# ---------- Statistical Knowledge Extraction ----------


def extract_project_context(observations: list[dict]) -> list[dict]:
    """Extract project context knowledge from frequent file access patterns."""
    # Count file accesses by directory
    dir_counts = {}
    for obs in observations:
        tool_input = obs.get("input", {})
        if not isinstance(tool_input, dict):
            continue
        fp = tool_input.get("file_path", "")
        if not fp:
            continue
        # Extract directory component
        parts = fp.replace("\\", "/").split("/")
        if len(parts) >= 2:
            # Get first 2-3 levels of path as context
            key = "/".join(parts[:3]) if len(parts) > 3 else "/".join(parts[:-1])
            dir_counts[key] = dir_counts.get(key, 0) + 1

    memories = []
    # Only extract if there's a clearly dominant project context
    sorted_dirs = sorted(dir_counts.items(), key=lambda x: -x[1])
    for dir_path, count in sorted_dirs[:3]:
        if count >= 5:
            memories.append({
                "name": f"project-context-{hashlib.md5(dir_path.encode()).hexdigest()[:8]}",
                "description": f"频繁访问的项目路径: {dir_path}",
                "type": "project",
                "body": f"项目路径 `{dir_path}` 在当前会话中被访问了 {count} 次，这是核心工作目录。主要操作包括文件编辑、搜索和阅读。",
            })

    return memories


# ---------- Memory File Management ----------


def write_memory_file(raw_dir: Path, memory: dict):
    """Write a knowledge memory as a Markdown file with YAML frontmatter."""
    raw_dir.mkdir(parents=True, exist_ok=True)

    name = memory.get("name", "")
    if not name:
        return

    memory_file = raw_dir / f"{name}.md"

    # Check if already exists — update if so
    existing_body = ""
    if memory_file.exists():
        try:
            content = memory_file.read_text(encoding="utf-8")
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    existing_body = parts[2].strip()
        except Exception:
            pass

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    mem_type = memory.get("type", "project")
    desc = memory.get("description", "")
    body = memory.get("body", existing_body)

    frontmatter = f"""---
name: {name}
description: {desc}
metadata:
  type: {mem_type}
created: "{today}"
updated: "{today}"
---

{body}
"""

    memory_file.write_text(frontmatter, encoding="utf-8")


# ---------- Main ----------


def main():
    if len(sys.argv) < 2:
        print("Usage: extract_memory.py <claude_dir>", file=sys.stderr)
        sys.exit(1)

    claude_dir = sys.argv[1]
    paths = get_paths(claude_dir)

    # Load observations
    all_obs = load_recent_observations(paths["obs_file"])
    if not all_obs:
        return

    session_obs = get_current_session_observations(all_obs)

    # Path A: Statistical extraction (project context from file access patterns)
    stat_memories = extract_project_context(all_obs)

    # Path B: AI semantic extraction (bug solutions, tech decisions, etc.)
    ai_memories = run_extraction(session_obs)

    # Combine
    all_memories = stat_memories + ai_memories

    # Write memory files
    for memory in all_memories:
        try:
            write_memory_file(paths["raw_dir"], memory)
        except Exception:
            continue

    # Log summary
    if all_memories:
        log_file = paths["claude_dir"] / "data" / "observations" / "analysis.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, "a", encoding="utf-8") as f:
            ts = datetime.now(timezone.utc).isoformat()
            f.write(f"{ts} Extracted {len(all_memories)} memories ({len(stat_memories)} stat + {len(ai_memories)} AI)\n")


if __name__ == "__main__":
    main()
