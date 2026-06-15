#!/usr/bin/env python3
"""
promote-to-team.py - Team Promotion Candidate Generator

Surfaces high-confidence, well-validated personal instincts as candidates for
promotion to team/ (Git-tracked). Bridges the one manual gap in the closed
loop — deciding WHICH personal rules are worth sharing.

Pipeline (reuses auto-evolve.py primitives, no reinvention):
  1. Load personal/ instincts
  2. Filter: confidence >= 0.7 AND observed_count >= 3 AND not deprecated
  3. Deduplicate candidates (Jaccard + Union-Find, same as auto-evolve)
  4. Compare each candidate against existing team/ rules;
     overlaps (max Jaccard >= 0.5) flagged as "likely duplicate"
  5. Write a human-readable candidate list to
     .claude/homunculus/instincts/promote-candidates.md (gitignored)

Read-only on Git-tracked content; writes only a gitignored file — safe to run
from the Stop hook. Human reviews the list, then runs
`adopt-instinct.py <id>` to promote chosen ones into team/.

Usage:
  python3 promote-to-team.py <claude_dir>
  python3 promote-to-team.py <claude_dir> --confidence 0.5 --min-observed 1
"""

import argparse
import importlib.util
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure UTF-8 stdout on Windows consoles (avoids mojibake for CJK output)
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")


# ---------- Tunable thresholds (defaults follow auto-evolve) ----------

CONFIDENCE_THRESHOLD = 0.7   # minimum confidence to be a candidate
MIN_OBSERVED = 3             # minimum observed_count (validation signal)
SIM_THRESHOLD = 0.5          # Jaccard threshold for "likely duplicate"
TEAM_CONFIDENCE = 0.80       # suggested confidence for promoted team rules


# ---------- Reuse auto-evolve.py (hyphenated name → importlib) ----------

def _load_auto_evolve():
    """Import auto-evolve.py via importlib so we reuse its primitives."""
    spec = importlib.util.spec_from_file_location(
        "auto_evolve", Path(__file__).resolve().parent / "auto-evolve.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


ae = _load_auto_evolve()


# ---------- Paths ----------

def get_paths(claude_dir: str):
    base = Path(claude_dir)
    return {
        "personal_dir": base / "homunculus" / "instincts" / "personal",
        "team_dir": base / "homunculus" / "instincts" / "team",
        "candidates_file": base / "homunculus" / "instincts" / "promote-candidates.md",
    }


# ---------- Small helpers ----------

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def _title_from(trigger: str, action: str) -> str:
    """Derive a short human title from trigger/action."""
    text = (trigger or action or "团队规则").strip().strip('"').strip("'")
    if len(text) > 40:
        text = text[:40].rstrip() + "…"
    return text


# ---------- Candidate selection ----------

def filter_candidates(instincts, min_conf, min_obs):
    """High-confidence, well-validated, active instincts only."""
    return [
        i for i in instincts
        if i.get("confidence", 0) >= min_conf
        and i.get("observed_count", 1) >= min_obs
        and not i.get("deprecated", False)
    ]


def best_team_match(candidate, team_instincts):
    """Return (max_similarity, matched_team_file_or_None).

    Candidate is tokenized from trigger + Action (matching dedup spec).
    Team rules are tokenized from trigger + full body (list-style files like
    common-pitfalls.md carry multiple rules in one body).
    """
    if not team_instincts:
        return 0.0, None

    cand_tokens = ae.tokenize(
        candidate.get("trigger", "") + " " + ae._extract_action(candidate.get("body", ""))
    )
    best_sim, best_file = 0.0, None
    for t in team_instincts:
        t_tokens = ae.tokenize(t.get("trigger", "") + " " + t.get("body", ""))
        sim = ae.jaccard(cand_tokens, t_tokens)
        if sim > best_sim:
            best_sim, best_file = sim, t.get("file")
    return best_sim, best_file


# ---------- Candidate list rendering ----------

def render_candidate_block(inst) -> str:
    """Render a single candidate with a copy-paste-ready team rule draft."""
    src_file = inst.get("file", "?")
    confidence = inst.get("confidence", 0)
    observed = inst.get("observed_count", 0)
    trigger = inst.get("trigger", "")
    domain = inst.get("domain", "uncategorized")
    cid = inst.get("id", src_file.replace(".md", ""))
    action = ae._extract_action(inst.get("body", ""))
    title = _title_from(trigger, action)

    lines = [
        f"#### `{cid}`",
        f"- **源文件:** `personal/{src_file}`",
        f"- **当前置信度:** {confidence:.2f}  |  **观测次数:** {observed}",
        "",
        f"**采纳命令:** `python3 .claude/bin/adopt-instinct.py .claude {cid}`",
        "",
        "**可直接采纳的 team 草稿**（采纳命令会自动生成；下面仅供参考/手动编辑）:",
        "",
        "```markdown",
        "---",
        f"id: {cid}",
        f'trigger: "{trigger}"',
        f"confidence: {TEAM_CONFIDENCE:.2f}",
        f"domain: {domain}",
        "source: team-consensus",
        f'created_at: "{_today()}"',
        "---",
        "",
        f"## {title}",
        "",
        "### 怎么做（Action）",
        action if action else "<!-- 建议补充具体做法 -->",
        "",
        "### 为什么（Why）",
        "<!-- 建议补充：踩过什么坑、为什么要这样做 -->",
        "",
        "### 示例（Example）",
        "<!-- 建议补充：具体场景与正确做法 -->",
        "```",
        "",
    ]
    return "\n".join(lines)


def write_candidates_file(candidates_file, new_candidates, dup_candidates,
                          conf_thr, obs_thr) -> bool:
    """Write (or clear) the candidate list. Returns True if a file was written."""
    candidates_file.parent.mkdir(parents=True, exist_ok=True)

    if not new_candidates and not dup_candidates:
        if candidates_file.exists():
            candidates_file.unlink()
        return False

    lines = [
        "# 📋 Team Promotion Candidates",
        "",
        f"> 自动生成于 {_now()}（gitignored，仅本地）",
        f"> 筛选条件: confidence ≥ {conf_thr} 且 observed_count ≥ {obs_thr}",
        f"> 新候选: **{len(new_candidates)}**  |  可能重复: **{len(dup_candidates)}**",
        "",
        "> **工作流:** 审阅下方草稿 → `adopt-instinct.py <id>` 采纳 → `git add team/` 提交 PR。",
        "> 本文件每次运行覆盖重写，不进 Git。",
        "",
        "---",
        "",
    ]

    if new_candidates:
        lines += [
            f"## 🆕 新候选（{len(new_candidates)}）",
            "",
            "这些规则在团队库中未发现相似项，建议采纳。",
            "",
        ]
        for inst, _ in new_candidates:
            lines.append(render_candidate_block(inst))
            lines += ["---", ""]
    else:
        lines += [
            "## 🆕 新候选",
            "",
            "_暂无新候选。继续使用、积累观测后，达到阈值的规则会自动出现在这里。_",
            "",
            "---",
            "",
        ]

    if dup_candidates:
        lines += [
            f"## ⚠️ 可能重复（{len(dup_candidates)}）",
            "",
            "这些规则与团队库中已有规则相似，建议先检查能否合并，避免重复入库。",
            "",
        ]
        for inst, (sim, tfile) in dup_candidates:
            cid = inst.get("id", "?")
            lines += [
                f"#### `{cid}`",
                f"- **源:** `personal/{inst.get('file', '?')}`",
                f"- **相似于:** `team/{tfile}`（Jaccard {sim:.2f}）",
                f"- **建议:** 打开 `team/{tfile}` 检查，确认是合并还是忽略。",
                "",
                "---",
                "",
            ]

    candidates_file.write_text("\n".join(lines), encoding="utf-8")
    return True


# ---------- Main ----------

def main():
    parser = argparse.ArgumentParser(description="Generate team-promotion candidate list.")
    parser.add_argument("claude_dir", help="path to .claude directory")
    parser.add_argument("--confidence", type=float, default=CONFIDENCE_THRESHOLD,
                        help=f"min confidence (default {CONFIDENCE_THRESHOLD})")
    parser.add_argument("--min-observed", type=int, default=MIN_OBSERVED,
                        help=f"min observed_count (default {MIN_OBSERVED})")
    args = parser.parse_args()

    paths = get_paths(args.claude_dir)

    # 1. load
    personal = ae.load_all_instincts(paths["personal_dir"])
    team = ae.load_all_instincts(paths["team_dir"])

    # 2. filter
    candidates = filter_candidates(personal, args.confidence, args.min_observed)
    if not candidates:
        if paths["candidates_file"].exists():
            paths["candidates_file"].unlink()
        print(f"[promote] no candidates "
              f"(need confidence>={args.confidence} & observed>={args.min_observed}; "
              f"scanned {len(personal)} personal instincts)")
        return

    # 3. dedupe among candidates
    deduped = ae.deduplicate_instincts(candidates, SIM_THRESHOLD)

    # 4. split new vs likely-duplicate (vs existing team)
    new_candidates, dup_candidates = [], []
    for inst in deduped:
        sim, tfile = best_team_match(inst, team)
        if tfile and sim >= SIM_THRESHOLD:
            dup_candidates.append((inst, (sim, tfile)))
        else:
            new_candidates.append((inst, (sim, tfile)))

    # 5. write
    wrote = write_candidates_file(
        paths["candidates_file"], new_candidates, dup_candidates,
        args.confidence, args.min_observed,
    )

    # 6. summary
    print(f"[promote] new={len(new_candidates)} dup={len(dup_candidates)} "
          f"(from {len(candidates)} after filter, {len(personal)} personal total)")
    if wrote:
        print(f"[promote] candidates → {paths['candidates_file']}")


if __name__ == "__main__":
    main()
