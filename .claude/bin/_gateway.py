#!/usr/bin/env python3
"""
_gateway.py - Shared Anthropic-compatible gateway client for Stop-hook scripts.

Stop hooks run while a live `claude` session still holds Claude Code's shared
state (~/.claude.json, session files). A nested `claude -p` subprocess deadlocks
in that situation (verified: it never returns regardless of flags/MCP/model/cwd).
POSTing /v1/messages directly over HTTPS sidesteps the nested CLI and is the only
reliable path from inside a hook.

auto-analyze-instincts.py and extract_memory.py both import this module so the
gateway logic (model resolution, HTTP call, tolerant JSON parse, failure logging)
lives in one place instead of drifting between copies.
"""

import json
import os
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


# Last-resort model id. The configured gateway reliably accepts Anthropic-format
# ids (it maps them onto its own backend), so this always works. Used when no
# session-model signal is present and as the retry fallback in callers.
FALLBACK_MODEL = "claude-haiku-4-5-20251001"


def resolve_analysis_model() -> str:
    """Pick the model id for AI analysis, preferring the session's model.

    Resolution order:
      1. CLAUDE_SMART_ANALYSIS_MODEL env — explicit override, always wins.
      2. The session's opus-tier model from ANTHROPIC_DEFAULT_OPUS_MODEL, with
         Claude Code variant markers ([1m], etc.) stripped — e.g.
         "glm-5.2[1m]" -> "glm-5.2". Makes the analyzer follow whatever capable
         model the main session runs on, instead of a fixed cheap tier.
      3. FALLBACK_MODEL when neither is set.
    """
    explicit = os.environ.get("CLAUDE_SMART_ANALYSIS_MODEL", "").strip()
    if explicit:
        return explicit
    opus = os.environ.get("ANTHROPIC_DEFAULT_OPUS_MODEL", "").strip()
    if opus:
        return re.sub(r"\[[^\]]*\]", "", opus)
    return FALLBACK_MODEL


def call_messages_api(prompt: str, model: str, max_tokens: int = 4096, timeout: int = 60) -> str:
    """Call the configured Anthropic-compatible gateway directly over HTTPS.

    Returns the concatenated text content. Raises on any failure so callers can
    retry / fall back / log as they see fit.
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
            "AI analysis unavailable"
        )

    payload = json.dumps({
        "model": model,
        "max_tokens": max_tokens,
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
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.loads(resp.read().decode("utf-8", errors="replace"))

    # Anthropic Messages shape: content is a list of blocks; concatenate text.
    texts = [
        block.get("text", "")
        for block in body.get("content", [])
        if block.get("type") == "text"
    ]
    return "\n".join(t for t in texts if t)


def parse_json_array(output: str) -> list:
    """Tolerantly parse a JSON array (or single object) from model output.

    Strips markdown code fences and leading/trailing prose, and tries several
    candidate slices (whole output, first-'['..last-']', first-'{'..last-'}').
    The gateway-mapped model's instruction-following on "output ONLY JSON" is
    imperfect, so we try several slices before giving up. Returns the first
    successfully parsed list (single objects are wrapped into a one-element
    list), or [].
    """
    cleaned = re.sub(r'```(?:json)?\s*', '', output)
    cleaned = re.sub(r'```\s*', '', cleaned).strip()

    candidates = [cleaned]
    first_bracket = cleaned.find('[')
    last_bracket = cleaned.rfind(']')
    if first_bracket >= 0 and last_bracket > first_bracket:
        candidates.append(cleaned[first_bracket:last_bracket + 1])
    first_brace = cleaned.find('{')
    last_brace = cleaned.rfind('}')
    if first_brace >= 0 and last_brace > first_brace:
        candidates.append(cleaned[first_brace:last_brace + 1])

    for text in candidates:
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            data = [data]
        if isinstance(data, list):
            return data
    return []


def log_ai_failure(err: Exception) -> None:
    """Append an AI-analysis failure to ai-analysis-errors.log (best-effort).

    Surfaces failures instead of silently returning []. Path resolves relative to
    this module (bin/ -> parents[1] = .claude), matching the original per-script
    behaviour.
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
