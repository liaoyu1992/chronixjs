#!/usr/bin/env python3
"""
auto-analyze-instincts.py - Dual-Path Instinct Analysis Engine

Runs at session end (Stop Hook). Analyzes observation data through two paths:
  - Path A: Statistical pattern detection (5 hardcoded detectors)
  - Path B: AI semantic analysis (direct gateway call via Anthropic Messages API)

Generates/updates Instinct files in .claude/homunculus/instincts/personal/

Usage: python3 auto-analyze-instincts.py <claude_dir>
"""

import json
import os
import re
import sys
import hashlib
import importlib.util
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# ---------- Configuration ----------

MAX_OBS_FOR_AI = 200  # Limit observations sent to AI for cost control

# Semantic-merge threshold: a new instinct whose trigger+action tokens overlap
# an existing instinct by >= this Jaccard score is treated as the same instinct
# (reinforces it instead of spawning a new 0.5-confidence file). Cures AI-instinct
# id drift — the root cause of the 90+ file pile-up where none ever reached 0.7.
MERGE_SIM_THRESHOLD = 0.5

# Last-resort model id. The configured gateway reliably accepts Anthropic-format
# ids (it maps them onto its own backend), so this always works. Used when no
# session-model signal is present and as the retry fallback in run_ai_analysis.
FALLBACK_MODEL = "claude-haiku-4-5-20251001"


def resolve_analysis_model() -> str:
    """Pick the model id for AI semantic analysis, preferring the session's model.

    Resolution order:
      1. CLAUDE_SMART_ANALYSIS_MODEL env — explicit override, always wins.
      2. The session's opus-tier model from ANTHROPIC_DEFAULT_OPUS_MODEL, with
         Claude Code variant markers ([1m], etc.) stripped — e.g.
         "glm-5.2[1m]" -> "glm-5.2". This makes the analyzer follow whatever
         capable model the main session runs on, instead of a fixed cheap tier.
      3. FALLBACK_MODEL when neither is set.

    Native backend names can be intermittently overloaded (HTTP 529) or rejected
    if a marker slips through; run_ai_analysis retries and falls back to
    FALLBACK_MODEL on a hard 4xx, so an imperfect resolution degrades, not breaks.
    """
    explicit = os.environ.get("CLAUDE_SMART_ANALYSIS_MODEL", "").strip()
    if explicit:
        return explicit
    opus = os.environ.get("ANTHROPIC_DEFAULT_OPUS_MODEL", "").strip()
    if opus:
        return re.sub(r"\[[^\]]*\]", "", opus)
    return FALLBACK_MODEL


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


def _call_messages_api(prompt: str, model: str) -> str:
    """Call the configured Anthropic-compatible gateway directly over HTTPS.

    We deliberately avoid shelling out to the `claude` CLI here. The Stop hook
    runs while a live `claude` session is still holding Claude Code's shared
    state (~/.claude.json, session files), and a nested `claude -p` subprocess
    deadlocks in that situation — verified: it never returns regardless of
    flags, MCP config, model, or working directory, even though the gateway
    itself answers in <1s. POSTing /v1/messages directly sidesteps the nested
    CLI entirely and is the only reliable path from inside a hook.
    """
    base_url = os.environ.get(
        "ANTHROPIC_BASE_URL", "https://api.anthropic.com"
    ).rstrip("/")
    token = (
        os.environ.get("ANTHROPIC_AUTH_TOKEN")
        or os.environ.get("ANTHROPIC_API_KEY", "")
    )
    if not token:
        raise RuntimeError(
            "no ANTHROPIC_AUTH_TOKEN/ANTHROPIC_API_KEY in env; "
            "AI semantic analysis unavailable"
        )

    payload = json.dumps({
        "model": model,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{base_url}/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "Authorization": f"Bearer {token}",
            # Some gateways key on x-api-key instead of the Bearer header;
            # send both so we work against either convention.
            "x-api-key": token,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.loads(resp.read().decode("utf-8", errors="replace"))

    # Anthropic Messages shape: content is a list of blocks; concatenate text.
    texts = [
        block.get("text", "")
        for block in body.get("content", [])
        if block.get("type") == "text"
    ]
    return "\n".join(t for t in texts if t)


def _parse_ai_instincts(output: str) -> list[dict]:
    """Parse the model's JSON-array output into instinct dicts.

    Tolerates markdown code fences, leading/trailing explanatory prose, and a
    single object (wrapped into a one-element list). The gateway maps us onto a
    small model whose instruction-following on "output ONLY JSON" is imperfect,
    so we try several candidate slices before giving up.
    """
    cleaned = re.sub(r'```(?:json)?\s*', '', output)
    cleaned = re.sub(r'```\s*', '', cleaned).strip()

    candidates = [cleaned]
    # Whole-array slices: first '[' ... last ']'
    first_bracket = cleaned.find('[')
    last_bracket = cleaned.rfind(']')
    if first_bracket >= 0 and last_bracket > first_bracket:
        candidates.append(cleaned[first_bracket:last_bracket + 1])
    # Single-object fallback: first '{' ... last '}'
    first_brace = cleaned.find('{')
    last_brace = cleaned.rfind('}')
    if first_brace >= 0 and last_brace > first_brace:
        candidates.append(cleaned[first_brace:last_brace + 1])

    seen = set()
    for text in candidates:
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            data = [data]
        if isinstance(data, list):
            instincts = [
                inst for inst in data
                if isinstance(inst, dict) and inst.get("id") and inst.get("trigger")
            ]
            for inst in instincts:
                inst.setdefault("confidence_delta", 0.05)
                seen.add(inst["id"])
            if instincts:
                return instincts
    return []


# On a retry, append a firmer JSON-only nudge — the gateway-mapped model
# sometimes wraps output in prose/fences that parse to nothing.
FIRMER_SUFFIX = (
    "\n\nIMPORTANT: respond with ONLY a raw JSON array (no markdown code fences, "
    "no explanation). If you identified any patterns above, the array MUST be "
    "non-empty."
)


def _log_ai_failure(err: Exception) -> None:
    """Append an AI-analysis failure to ai-analysis-errors.log (best-effort).

    Surfaces failures instead of silently returning [] — the original
    implementation swallowed every error, which hid the nested-CLI deadlock as
    a permanent "0 AI instincts".
    """
    try:
        err_log = (
            Path(__file__).resolve().parents[1]
            / "data" / "observations" / "ai-analysis-errors.log"
        )
        err_log.parent.mkdir(parents=True, exist_ok=True)
        with open(err_log, "a", encoding="utf-8") as f:
            ts = datetime.now(timezone.utc).isoformat()
            f.write(f"{ts} AI analysis failed: {type(err).__name__}: {err}\n")
    except Exception:
        pass


def run_ai_analysis(session_obs: list[dict]) -> list[dict]:
    """Run AI semantic analysis via direct gateway calls (no nested CLI).

    Resolves the model to match the session's, then makes up to two attempts:
    a transient failure (529 overloaded, timeout) or an empty parse retries
    once; a hard 4xx "model not found" switches to the reliable fallback model
    before the retry. Logs only when both attempts are exhausted.
    """
    if not session_obs:
        return []

    base_prompt = build_ai_prompt(session_obs)
    model = resolve_analysis_model()
    last_error: Exception | None = None

    for attempt in range(2):
        prompt = base_prompt if attempt == 0 else base_prompt + FIRMER_SUFFIX
        try:
            output = _call_messages_api(prompt, model)
            instincts = _parse_ai_instincts(output)
            if instincts:
                return instincts
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
        _log_ai_failure(last_error)
    return []


def _parse_id_mapping(output: str, valid_ids: set) -> dict | None:
    """Parse the id-resolution JSON array into {index: id}.

    Only keeps ids that are 'NEW' or present in valid_ids, so a hallucinated id
    never overwrites a real one. Returns None if no usable mapping parsed (the
    caller then treats the whole resolution as a no-op)."""
    cleaned = re.sub(r'```(?:json)?\s*', '', output)
    cleaned = re.sub(r'```\s*', '', cleaned).strip()
    candidates = [cleaned]
    lb, rb = cleaned.find('['), cleaned.rfind(']')
    if lb >= 0 and rb > lb:
        candidates.append(cleaned[lb:rb + 1])
    for text in candidates:
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue
        if not isinstance(data, list):
            continue
        mapping = {}
        for item in data:
            if not isinstance(item, dict):
                continue
            idx = item.get("index")
            rid = str(item.get("id", "")).strip()
            if isinstance(idx, int) and rid and (rid == "NEW" or rid in valid_ids):
                mapping[idx] = rid
        if mapping:
            return mapping
    return None


def resolve_instinct_ids_via_ai(ae, existing_instincts: list[dict],
                                new_instincts: list[dict]) -> list[dict]:
    """Semantically map each new instinct onto an existing id when they describe
    the same behavior — curing AI-instinct id drift.

    Token Jaccard cannot do this (see find_merge_target_id's EMPIRICAL NOTE):
    instinct actions are Chinese and triggers short generic English, so
    rephrasings share too few tokens while unrelated patterns collide on common
    ones. One batched gateway call lets the model match across language and
    phrasing. On any failure (no key, network, unparseable output) the new
    instincts are returned unchanged — no regression; the Jaccard fallback and
    write loop in main() proceed as before.
    """
    if not existing_instincts or not new_instincts:
        return new_instincts

    # Bound the registry so the prompt stays manageable as the corpus grows;
    # prefer the highest-confidence, most-reinforced instincts.
    registry = sorted(
        existing_instincts,
        key=lambda x: (x.get("confidence", 0), int(x.get("observed_count", 1) or 1)),
        reverse=True,
    )[:60]

    def short(s, n=120):
        return (s or "").replace("\n", " ").strip()[:n]

    existing_lines = "\n".join(
        f"{i + 1}. {inst.get('id', '')} | {short(inst.get('trigger', ''))} | "
        f"{short(ae._extract_action(inst.get('body', '')))}"
        for i, inst in enumerate(registry)
    )
    new_lines = "\n".join(
        f"{i}. {short(inst.get('trigger', ''))} | {short(inst.get('action', ''))}"
        for i, inst in enumerate(new_instincts)
    )

    prompt = (
        "You are matching newly observed coding-behavior patterns against a "
        "registry of existing \"instincts\".\n\n"
        f"EXISTING INSTINCTS (number | id | trigger | action):\n{existing_lines}\n\n"
        f"NEW PATTERNS (index | trigger | action):\n{new_lines}\n\n"
        "For EACH new pattern (by index), decide whether it describes the SAME "
        "underlying behavior as one of the existing instincts — even if worded "
        "differently or in a different language.\n"
        "- If it matches an existing instinct, output that instinct's id exactly.\n"
        "- If it is a genuinely new behavior, output NEW.\n\n"
        "Return ONLY a raw JSON array (no prose, no code fences), one object per "
        "new pattern, in index order:\n"
        '[{"index": 0, "id": "<existing-id-or-NEW>"}, ...]'
    )

    valid_ids = {inst.get("id") for inst in registry}
    model = resolve_analysis_model()
    last_error: Exception | None = None

    for attempt in range(2):
        p = prompt if attempt == 0 else prompt + FIRMER_SUFFIX
        try:
            output = _call_messages_api(p, model)
        except urllib.error.HTTPError as e:
            last_error = e
            if e.code in (400, 404) and model != FALLBACK_MODEL:
                model = FALLBACK_MODEL
            continue
        except Exception as e:
            last_error = e
            continue
        mapping = _parse_id_mapping(output, valid_ids)
        if mapping is not None:
            resolved = 0
            for idx, inst in enumerate(new_instincts):
                target = mapping.get(idx)
                if target and target != "NEW" and target != inst.get("id"):
                    inst["id"] = target
                    resolved += 1
            if resolved:
                try:
                    log_file = (
                        Path(__file__).resolve().parents[1]
                        / "data" / "observations" / "analysis.log"
                    )
                    log_file.parent.mkdir(parents=True, exist_ok=True)
                    with open(log_file, "a", encoding="utf-8") as f:
                        ts = datetime.now(timezone.utc).isoformat()
                        f.write(f"{ts} AI id-resolution: {resolved}/{len(new_instincts)} "
                                f"new instincts mapped to existing ids\n")
                except Exception:
                    pass
            return new_instincts

    # Both attempts failed — leave ids as-is (Jaccard fallback in main() still runs).
    if last_error is not None:
        _log_ai_failure(last_error)
    return new_instincts


# ---------- Instinct File Management ----------


def _load_auto_evolve():
    """Load auto-evolve.py (hyphenated name, not importable directly) for its
    tokenize / jaccard / _extract_action / load_all_instincts primitives, which
    we reuse for semantic merging instead of reimplementing them."""
    ae_path = Path(__file__).resolve().parent / "auto-evolve.py"
    spec = importlib.util.spec_from_file_location("auto_evolve", ae_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def find_merge_target_id(ae, existing_instincts: list[dict], instinct: dict):
    """Find the id of the closest existing instinct by Jaccard similarity.

    Compares trigger + action text (the new instinct's `action` field vs the
    existing instinct's `## Action` body section), matching auto-evolve's
    deduplicate logic. Returns the existing id to reuse, or None to create new.

    EMPIRICAL NOTE: on the real instinct corpus this Jaccard match is
    effectively a no-op. Max pairwise similarity is ~0.28 (with CJK bigrams) /
    <0.5 (English-only): instinct `action` text is Chinese and triggers are
    short generic English, so rephrasings of the SAME behavior share too few
    tokens to cross any safe threshold, while unrelated behaviors can collide
    on shared tokens like "claude code". This is the root cause of AI-instinct
    id drift — every session spawns a fresh 0.5-confidence file that decays.
    Curing drift requires a SEMANTIC matcher (AI id-resolution or embeddings),
    not token Jaccard; this fallback is retained only as a cheap best-effort.
    """
    new_tokens = ae.tokenize(
        instinct.get("trigger", "") + " " + instinct.get("action", "")
    )
    best_id = None
    best_sim = MERGE_SIM_THRESHOLD
    for ex in existing_instincts:
        ex_tokens = ae.tokenize(
            ex.get("trigger", "") + " " + ae._extract_action(ex.get("body", ""))
        )
        sim = ae.jaccard(new_tokens, ex_tokens)
        if sim >= best_sim:
            best_sim = sim
            best_id = ex.get("id") or Path(ex.get("file", "x.md")).stem
    return best_id


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
            # Compare on the rounded value: 0.6-0.05 is 0.5499999999999999 in
            # IEEE754, so a raw `< 0.55` false-positives at exactly the 0.55
            # boundary and wrongly deprecates an instinct that should survive.
            deprecated = round(new_confidence, 2) < 0.55

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

    # Load existing instincts once for semantic merge. Reusing auto-evolve's
    # tokenize/jaccard lets a repeated-but-differently-worded instinct reinforce
    # its existing file instead of spawning a new 0.5-confidence one.
    ae = _load_auto_evolve()
    existing_instincts = ae.load_all_instincts(paths["instincts_dir"])

    # P0-A: semantically resolve AI instinct ids against the existing registry,
    # so a rephrased-but-same pattern reinforces its existing file instead of
    # drifting to a new 0.5-confidence one. Token Jaccard cannot do this (see
    # find_merge_target_id's EMPIRICAL NOTE); one batched gateway call can.
    # resolve_instinct_ids_via_ai is a no-op on any failure (no key / network /
    # unparseable output), so the Jaccard fallback below still covers that case.
    if ai_instincts and existing_instincts:
        ai_instincts = resolve_instinct_ids_via_ai(ae, existing_instincts, ai_instincts)

    # Combine and write instinct files
    all_new_instincts = stat_instincts + ai_instincts

    merged = 0
    for instinct in all_new_instincts:
        if not instinct.get("id") or not instinct.get("trigger"):
            continue
        # Exact id already exists -> reinforce directly. Otherwise look for a
        # near-duplicate to merge into (cures AI-instinct id drift).
        if not load_existing_instinct(paths["instincts_dir"], instinct["id"]):
            merge_id = find_merge_target_id(ae, existing_instincts, instinct)
            if merge_id and merge_id != instinct["id"]:
                instinct["id"] = merge_id
                merged += 1
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

    # Mark the latest session as analyzed (crash-recovery signal for SessionStart).
    try:
        marker = paths["claude_dir"] / "data" / "observations" / ".last_analyzed_session"
        latest_session = all_obs[-1].get("session_id", "") if all_obs else ""
        marker.write_text(latest_session, encoding="utf-8")
    except Exception:
        pass


if __name__ == "__main__":
    main()
