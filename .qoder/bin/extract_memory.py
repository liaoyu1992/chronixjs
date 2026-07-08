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
import sys
import hashlib
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# _gateway lives alongside this script in bin/. When run as
# `python3 .claude/bin/extract_memory.py`, sys.path[0] is bin/, so this resolves.
from _gateway import (
    FALLBACK_MODEL,
    call_messages_api,
    log_ai_failure,
    parse_json_array,
    resolve_analysis_model,
)

# ---------- Configuration ----------

MAX_OBS_FOR_EXTRACT = 200  # Limit observations sent to AI for cost control

# On a retry, append a firmer JSON-only nudge — the gateway-mapped model
# sometimes wraps output in prose/fences that parse to nothing.
JSON_ONLY_SUFFIX = (
    "\n\nIMPORTANT: respond with ONLY a raw JSON array (no markdown code fences, "
    "no explanation). If you identified any knowledge worth remembering, the "
    "array MUST be non-empty."
)

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

Focus on extracting these types of knowledge:
1. **Bug solutions**: errors encountered and how they were fixed
2. **Technical decisions**: architecture choices, library selections, design patterns applied
3. **Project context**: directory structure, config files, tech stack details
4. **Workflow knowledge**: useful commands, build steps, test procedures discovered
5. **Pitfalls / Anti-patterns**: approaches that FAILED and why — look for "tried X → failed → did Y" sequences

For each memory found, output a JSON object with:
- "name": short-kebab-case slug (unique identifier)
- "description": one-line summary of this knowledge
- "type": one of ["project", "reference", "pitfall"] (NOT "user" or "feedback" — those are manually curated)
- "body": the knowledge content in Markdown, 2-5 sentences

For "pitfall" type memories, structure the body as:
- **触发条件**: what scenario triggers this pitfall
- **错误现象**: what goes wrong (error message, symptom)
- **为什么**: root cause explanation
- **正确做法**: what to do instead

If the session has no extractable knowledge, return [].

IMPORTANT:
- Only extract genuinely new/valuable knowledge, not trivial operations
- Do NOT duplicate information that would already be in CLAUDE.md or project docs
- Each memory should be atomic and self-contained
- For pitfalls: focus on patterns that would bite someone again (not one-off typos)

Observation Log:
{obs_text}

Output ONLY the JSON array, no other text."""


def run_extraction(session_obs: list[dict]) -> list[dict]:
    """Run AI extraction via the shared gateway (no nested claude CLI).

    The old implementation shelled out to `claude --print`, which deadlocks
    inside a Stop hook — a live session holds Claude Code's shared state
    (~/.claude.json, session files) and the nested CLI never returns. POSTing
    /v1/messages directly via _gateway sidesteps that. Mirrors the retry +
    model-fallback behaviour of auto-analyze-instincts.py.
    """
    if not session_obs:
        return []

    obs_text = summarize_session(session_obs)
    if not obs_text.strip():
        return []

    base_prompt = build_extraction_prompt(obs_text)
    model = resolve_analysis_model()
    last_error = None

    for attempt in range(2):
        prompt = base_prompt if attempt == 0 else base_prompt + JSON_ONLY_SUFFIX
        try:
            output = call_messages_api(prompt, model)
            memories = [
                m for m in parse_json_array(output)
                if isinstance(m, dict) and m.get("name")
            ]
            if memories:
                return memories
            # Parsed empty -> retry (attempt 1 uses the firmer prompt).
        except urllib.error.HTTPError as e:
            last_error = e
            # Hard rejection of the model id -> retry against the reliable fallback.
            if e.code in (400, 404) and model != FALLBACK_MODEL:
                model = FALLBACK_MODEL
            # 5xx / overload / other transient -> retry the same model.
        except Exception as e:
            last_error = e

    if last_error is not None:
        log_ai_failure(last_error)
    return []


# ---------- Statistical Knowledge Extraction ----------


def extract_project_context(observations: list[dict]) -> list[dict]:
    """Emit a single project-context memory for the current working directory.

    Previously this emitted one memory per frequently-accessed directory, keyed
    by an md5 hash of the path. Nested paths (.claude/memory vs .claude/memory/raw
    vs the home root) spawned near-duplicate, semantically empty files that
    crowded out real memories during injection. Now we emit exactly one entry for
    the cwd under a stable name, so each session overwrites it instead of
    accumulating a pile of path-counting stubs.
    """
    cwd = os.environ.get("PWD") or os.getcwd()
    cwd_name = Path(cwd).name or cwd

    file_accesses = sum(
        1 for obs in observations
        if isinstance(obs.get("input"), dict) and obs["input"].get("file_path")
    )
    if file_accesses < 5:
        return []

    return [{
        "name": "project-context-current",
        "description": f"当前工作目录: {cwd_name}",
        "type": "project",
        "body": (
            f"当前主要工作在 `{cwd}` 目录（项目 `{cwd_name}`）。"
            f"这是本会话的核心工作目录，操作集中在文件编辑、搜索与阅读。"
        ),
    }]


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
