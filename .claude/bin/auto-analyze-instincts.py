#!/usr/bin/env python3
"""
auto-analyze-instincts.py - Dual-Path Instinct Analysis Engine

Runs at session end (Stop Hook). Analyzes observation data through two paths:
  - Path A: Statistical pattern detection (5 hardcoded detectors)
  - Path B: AI semantic analysis (via Claude CLI with Haiku)

Generates/updates Instinct files in .claude/homunculus/instincts/personal/

Usage: python3 auto-analyze-instincts.py <claude_dir>
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
ANALYSIS_MODEL = "claude-haiku-4-5-20251001"
MAX_OBS_FOR_AI = 200  # Limit observations sent to AI for cost control


# ---------- Path Helpers ----------

def get_paths(claude_dir: str):
    base = Path(claude_dir)
    return {
        "obs_file": base / "data" / "observations" / "observations.jsonl",
        "instincts_dir": base / "homunculus" / "instincts" / "personal",
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
    # Take last N lines
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
    # Find the latest session ID
    latest_session = observations[-1].get("session_id", "")
    return [o for o in observations if o.get("session_id") == latest_session]


# ---------- Path A: Statistical Pattern Detection ----------
# Article Image 7 specifies exactly 5 detectors:
#   1. Bash 主导型 - Bash占总调用 > 40%
#   2. Edit-then-Bash - Edit后紧跟Bash验证，间隔 < 5次调用
#   3. Read-before-Edit - Read先于Edit比例 > 80%
#   4. Search-first - Grep/Glob在Read/Edit之前
#   5. Project-context - 频繁访问的特定项目路径


def detect_bash_dominant(observations: list[dict]) -> dict | None:
    """Detector 1: Bash 主导型 — Bash占总工具调用 > 40%."""
    total = len(observations)
    if total < 10:
        return None

    bash_count = sum(1 for o in observations if o.get("tool") == "Bash")
    ratio = bash_count / total

    if ratio > 0.40:
        return {
            "id": "bash-dominant-pattern",
            "trigger": "when working in a Bash-heavy development workflow",
            "action": "当前工作流中 Bash 调用占比较高。优先使用 CLI 工具完成任务，充分利用管道和脚本组合。在执行复杂操作时，优先考虑 Bash 脚本方案。",
            "evidence": f"在 {total} 次工具调用中，Bash 占 {bash_count} 次 (比率 {ratio:.0%})，超过 40% 阈值。",
            "domain": "workflow",
            "confidence_delta": 0.05,
        }
    return None


def detect_edit_then_bash(observations: list[dict]) -> dict | None:
    """Detector 2: Edit-then-Bash — Edit后紧跟Bash验证，间隔 < 5次调用."""
    edit_indices = [(i, o) for i, o in enumerate(observations) if o.get("tool") == "Edit"]
    if len(edit_indices) < 3:
        return None

    edit_then_bash = 0
    for idx, obs in edit_indices:
        # Look ahead up to 5 tool calls for a Bash verification
        for j in range(idx + 1, min(idx + 6, len(observations))):
            nxt = observations[j]
            if nxt.get("tool") == "Bash":
                edit_then_bash += 1
                break

    ratio = edit_then_bash / len(edit_indices) if edit_indices else 0
    if ratio >= 0.4:
        return {
            "id": "edit-then-bash-pattern",
            "trigger": "after editing source or config files",
            "action": "编辑文件后，立即运行相关 Bash 命令验证修改效果（如测试、构建、类型检查等），确保改动正确且未引入回归。",
            "evidence": f"在 {len(edit_indices)} 次 Edit 操作中，{edit_then_bash} 次后紧跟 Bash 验证 (间隔 < 5 次调用，比率 {ratio:.0%})。",
            "domain": "workflow",
            "confidence_delta": 0.05,
        }
    return None


def detect_read_before_edit(observations: list[dict]) -> dict | None:
    """Detector 3: Read-before-Edit — Read先于Edit比例 > 80%."""
    edits = [(i, o) for i, o in enumerate(observations) if o.get("tool") == "Edit"]
    if len(edits) < 3:
        return None

    read_then_edit = 0
    for idx, obs in edits:
        file_path = ""
        tool_input = obs.get("input", {})
        if isinstance(tool_input, dict):
            file_path = tool_input.get("file_path", "")

        if not file_path:
            continue

        found_read = False
        for j in range(max(0, idx - 5), idx):
            prev = observations[j]
            if prev.get("tool") == "Read":
                prev_input = prev.get("input", {})
                if isinstance(prev_input, dict) and prev_input.get("file_path") == file_path:
                    found_read = True
                    break
        if found_read:
            read_then_edit += 1

    ratio = read_then_edit / len(edits) if edits else 0
    if ratio > 0.80:  # Article spec: > 80%
        return {
            "id": "read-before-edit-pattern",
            "trigger": "when about to edit a file that hasn't been read in this session",
            "action": "在 Edit 文件前，先用 Read 工具读取该文件的当前内容，特别是当文件较长或最近有其他改动时。不跳过读取直接编辑，以避免基于过时内容产生错误的修改。",
            "evidence": f"在过去 {len(edits)} 次 Edit 操作中，{read_then_edit} 次之前有对应的 Read 调用 (比率 {ratio:.0%})。",
            "domain": "workflow",
            "confidence_delta": 0.05,
        }
    return None


def detect_search_first(observations: list[dict]) -> dict | None:
    """Detector 4: Search-first — Grep/Glob在Read/Edit之前."""
    read_or_edit = [(i, o) for i, o in enumerate(observations)
                    if o.get("tool") in ("Read", "Edit")]
    if len(read_or_edit) < 3:
        return None

    search_first = 0
    for idx, obs in read_or_edit:
        # Look back up to 8 tool calls for a Grep/Glob search
        for j in range(max(0, idx - 8), idx):
            prev = observations[j]
            if prev.get("tool") in ("Grep", "Glob"):
                search_first += 1
                break

    ratio = search_first / len(read_or_edit) if read_or_edit else 0
    if ratio >= 0.4:
        return {
            "id": "search-first-pattern",
            "trigger": "when about to read or edit files in a codebase",
            "action": "在阅读或编辑文件前，先用 Grep/Glob 搜索相关代码和引用，定位目标后再进行操作。这体现了先搜索后操作的工作习惯。",
            "evidence": f"在 {len(read_or_edit)} 次 Read/Edit 前，{search_first} 次有 Grep/Glob 搜索操作 (比率 {ratio:.0%})。",
            "domain": "research-habit",
            "confidence_delta": 0.05,
        }
    return None


def detect_project_context(observations: list[dict]) -> dict | None:
    """Detector 5: Project-context — 频繁访问的特定项目路径."""
    # Count file accesses by project path prefix
    path_counts = {}
    for obs in observations:
        tool_input = obs.get("input", {})
        if not isinstance(tool_input, dict):
            continue
        fp = tool_input.get("file_path", "")
        if not fp:
            continue
        # Normalize and extract directory
        parts = fp.replace("\\", "/").split("/")
        if len(parts) >= 2:
            key = "/".join(parts[:3]) if len(parts) > 3 else "/".join(parts[:-1])
            path_counts[key] = path_counts.get(key, 0) + 1

    if not path_counts:
        return None

    # Find the most frequently accessed path
    sorted_paths = sorted(path_counts.items(), key=lambda x: -x[1])
    top_path, top_count = sorted_paths[0]
    total_file_accesses = sum(path_counts.values())

    if top_count >= 10 and top_count / total_file_accesses > 0.3:
        return {
            "id": "project-context-pattern",
            "trigger": "when working in the active project context",
            "action": f"当前主要工作在 `{top_path}` 路径下。对该目录下的文件操作应优先考虑其与其他文件的依赖关系，保持项目结构的一致性。",
            "evidence": f"路径 `{top_path}` 被访问 {top_count} 次，占总文件访问的 {top_count / total_file_accesses:.0%}。",
            "domain": "project-context",
            "confidence_delta": 0.05,
        }
    return None


# All detectors — exactly 5, matching article Image 7
STATISTICAL_DETECTORS = [
    detect_bash_dominant,       # 1. Bash 主导型
    detect_edit_then_bash,      # 2. Edit-then-Bash
    detect_read_before_edit,    # 3. Read-before-Edit
    detect_search_first,        # 4. Search-first
    detect_project_context,     # 5. Project-context
]


def run_statistical_analysis(observations: list[dict]) -> list[dict]:
    """Run all statistical pattern detectors."""
    results = []
    for detector in STATISTICAL_DETECTORS:
        try:
            result = detector(observations)
            if result:
                results.append(result)
        except Exception:
            continue
    return results


# ---------- Path B: AI Semantic Analysis ----------

def build_ai_prompt(session_obs: list[dict]) -> str:
    """Build the prompt for Claude AI semantic analysis."""
    # Summarize observations for cost control
    summary_lines = []
    for obs in session_obs[:MAX_OBS_FOR_AI]:
        tool = obs.get("tool", "?")
        phase = obs.get("phase", "")
        tool_input = obs.get("input", {})
        bash_desc = obs.get("bash_desc")
        ts = obs.get("ts", "")[:19]

        line = f"[{ts}] {phase.upper()} {tool}"
        if isinstance(tool_input, dict):
            if tool == "Edit":
                fp = tool_input.get("file_path", "")
                line += f" file={fp}"
            elif tool == "Bash":
                cmd = tool_input.get("command", "")[:80]
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

    obs_text = "\n".join(summary_lines)

    return f"""You are analyzing a developer's Claude Code usage patterns. Based on the observation log below, identify behavioral patterns and habits.

For each pattern found, output a JSON object with these fields:
- "id": short-kebab-case identifier
- "trigger": when this pattern applies (in English)
- "action": what the user typically does (in Chinese)
- "evidence": statistical evidence for this pattern (in Chinese)
- "domain": one of [workflow, testing, git, code-style, project-context, research-habit]

Return a JSON array of pattern objects. If no clear patterns found, return [].

Observation Log:
{obs_text}

Output ONLY the JSON array, no other text."""


def run_ai_analysis(session_obs: list[dict]) -> list[dict]:
    """Run AI semantic analysis via Claude CLI."""
    if not session_obs:
        return []

    prompt = build_ai_prompt(session_obs)

    try:
        result = subprocess.run(
            [CLAUDE_CLI, "--print", "--model", ANALYSIS_MODEL, "-p", prompt],
            capture_output=True, text=True, timeout=60
        )
        output = result.stdout.strip()

        # Strip markdown code fences first
        cleaned = re.sub(r'```(?:json)?\s*', '', output)
        cleaned = re.sub(r'```\s*', '', cleaned).strip()

        # Try direct JSON parse first
        try:
            instincts = json.loads(cleaned)
            if isinstance(instincts, list):
                for inst in instincts:
                    inst.setdefault("confidence_delta", 0.05)
                return instincts
        except json.JSONDecodeError:
            pass

        # Fallback: find the last top-level JSON array (non-greedy from end)
        # Match from last '[' to last ']' to avoid grabbing explanatory text
        last_bracket = cleaned.rfind('[')
        if last_bracket >= 0:
            try:
                instincts = json.loads(cleaned[last_bracket:])
                if isinstance(instincts, list):
                    for inst in instincts:
                        inst.setdefault("confidence_delta", 0.05)
                    return instincts
            except json.JSONDecodeError:
                pass
    except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception):
        pass

    return []


# ---------- Instinct File Management ----------

def load_existing_instinct(instincts_dir: Path, instinct_id: str) -> dict | None:
    """Load an existing instinct file by ID."""
    instinct_file = instincts_dir / f"{instinct_id}.md"
    if not instinct_file.exists():
        return None

    content = instinct_file.read_text(encoding="utf-8")
    # Parse YAML frontmatter
    if not content.startswith("---"):
        return None

    parts = content.split("---", 2)
    if len(parts) < 3:
        return None

    frontmatter_text = parts[1].strip()
    body = parts[2].strip()

    # Simple YAML parser (avoid pyyaml dependency issues)
    meta = {}
    for line in frontmatter_text.split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key == "confidence":
                meta[key] = float(val)
            else:
                meta[key] = val
    meta["body"] = body
    return meta


def write_instinct_file(instincts_dir: Path, instinct: dict):
    """Write or update an instinct Markdown file with confidence evolution."""
    instincts_dir.mkdir(parents=True, exist_ok=True)
    instinct_id = instinct["id"]
    instinct_file = instincts_dir / f"{instinct_id}.md"

    existing = load_existing_instinct(instincts_dir, instinct_id)

    if existing:
        # Confidence evolution: repeated observation → increase
        new_confidence = min(0.9, existing.get("confidence", 0.5) + instinct.get("confidence_delta", 0.05))
        deprecated = False
        observed_count = int(existing.get("observed_count", "1") or "1") + 1
    else:
        # First discovery
        new_confidence = 0.5
        deprecated = False
        observed_count = 1

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    frontmatter = f"""---
id: {instinct_id}
trigger: "{instinct['trigger']}"
confidence: {new_confidence:.2f}
domain: {instinct.get('domain', 'workflow')}
source: session-observation
deprecated: {str(deprecated).lower()}
observed_at: "{today}"
observed_count: {observed_count}
---"""

    body = f"""
## Action

{instinct['action']}

## Evidence

{instinct.get('evidence', '在当前会话中观察到该模式。')}
"""

    instinct_file.write_text(frontmatter + body, encoding="utf-8")


def apply_confidence_decay(instincts_dir: Path):
    """Decay confidence of instincts not observed in this session."""
    if not instincts_dir.exists():
        return

    for md_file in instincts_dir.glob("*.md"):
        try:
            existing = load_existing_instinct(instincts_dir, md_file.stem)
            if not existing:
                continue
            if existing.get("deprecated", "").lower() == "true":
                continue

            # Check if this instinct was updated today
            observed_at = existing.get("observed_at", "")
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            if observed_at == today:
                continue  # Updated today, no decay

            # Decay
            confidence = existing.get("confidence", 0.5)
            new_confidence = max(0.1, confidence - 0.05)
            deprecated = new_confidence < 0.55

            # Rewrite with updated confidence
            content = md_file.read_text(encoding="utf-8")
            # Update confidence line
            content = re.sub(
                r'confidence: [\d.]+',
                f'confidence: {new_confidence:.2f}',
                content
            )
            content = re.sub(
                r'deprecated: \w+',
                f'deprecated: {str(deprecated).lower()}',
                content
            )
            md_file.write_text(content, encoding="utf-8")
        except Exception:
            continue


# ---------- Main ----------

def main():
    if len(sys.argv) < 2:
        print("Usage: auto-analyze-instincts.py <claude_dir>", file=sys.stderr)
        sys.exit(1)

    claude_dir = sys.argv[1]
    paths = get_paths(claude_dir)

    # Load observations
    all_obs = load_recent_observations(paths["obs_file"])
    if not all_obs:
        return  # No data to analyze

    session_obs = get_current_session_observations(all_obs)

    # Apply confidence decay to existing instincts
    apply_confidence_decay(paths["instincts_dir"])

    # Path A: Statistical pattern detection
    stat_instincts = run_statistical_analysis(all_obs)

    # Path B: AI semantic analysis
    ai_instincts = run_ai_analysis(session_obs)

    # Combine and write instinct files
    all_new_instincts = stat_instincts + ai_instincts

    for instinct in all_new_instincts:
        if not instinct.get("id") or not instinct.get("trigger"):
            continue
        try:
            write_instinct_file(paths["instincts_dir"], instinct)
        except Exception:
            continue

    # Log summary
    if all_new_instincts:
        log_file = paths["claude_dir"] / "data" / "observations" / "analysis.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, "a", encoding="utf-8") as f:
            ts = datetime.now(timezone.utc).isoformat()
            f.write(f"{ts} Analyzed {len(all_obs)} obs → {len(stat_instincts)} stat + {len(ai_instincts)} AI instincts\n")


if __name__ == "__main__":
    main()
