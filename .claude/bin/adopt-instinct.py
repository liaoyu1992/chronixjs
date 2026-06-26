#!/usr/bin/env python3
"""
adopt-instinct.py - Promote a personal instinct into team/

Reads personal/<id>.md, rewrites it into the team rule format
(depersonalized frontmatter + Action/Why/Example structure), and writes
team/<id>.md. The one manual gate after promote-to-team.py surfaces a
candidate — this command does the mechanical rewrite so a human only
reviews and commits.

Does NOT git commit. Review the generated file, then `git add` + PR.

Adopted rules drop personal-only fields (observed_count, observed_at,
deprecated) and the per-session Evidence block; source becomes team-consensus
and confidence is normalized to the team level.

Reads personal/<id>.md from <claude_dir> but WRITES the team rule to the
canonical store (cluade-smart by default) so it fans out to all projects via
sync-team.py. Use --canonical to redirect the write target.

Usage:
  python3 adopt-instinct.py <claude_dir> <id>
  python3 adopt-instinct.py <chronixjs_claude> bash-check-before-use --author yu
  python3 adopt-instinct.py <claude_dir> <id> --confidence 0.85 --force
  python3 adopt-instinct.py <claude_dir> <id> --canonical <cluade_smart_claude>
"""

import argparse
import importlib.util
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure UTF-8 stdout on Windows consoles (avoids mojibake for CJK output)
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")


TEAM_CONFIDENCE = 0.80   # default confidence for a promoted team rule

# Canonical team store = cluade-smart (authoritative shared layer). Adopted
# rules land here regardless of which project you adopt from, so one adoption
# fans out to all projects via sync-team.py. Override: --canonical / $TEAM_CANONICAL_DIR.
DEFAULT_CANONICAL_TEAM = Path(
    "C:/Users/liaoyu/work/cluade-smart/.claude/homunculus/instincts/team"
)


def resolve_canonical_team(cli_canonical):
    """Resolve the team store to write into (default cluade-smart)."""
    if cli_canonical:
        return Path(cli_canonical)
    env = os.environ.get("TEAM_CANONICAL_DIR")
    if env:
        return Path(env)
    return DEFAULT_CANONICAL_TEAM


# ---------- Reuse auto-evolve.py primitives ----------

def _load_auto_evolve():
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
    }


# ---------- Helpers ----------

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _title_from(trigger: str, action: str) -> str:
    text = (trigger or action or "团队规则").strip().strip('"').strip("'")
    if len(text) > 40:
        text = text[:40].rstrip() + "…"
    return text


def find_instinct(personal_dir: Path, instinct_id: str):
    """Find a personal instinct by id or filename."""
    instincts = ae.load_all_instincts(personal_dir)
    target_file = instinct_id if instinct_id.endswith(".md") else instinct_id + ".md"
    for i in instincts:
        if i.get("id") == instinct_id or i.get("file") == target_file:
            return i
    return None


# ---------- Rendering ----------

def render_team_rule(inst, confidence: float, author=None) -> str:
    """Rewrite a personal instinct as a team rule (depersonalized)."""
    cid = inst.get("id", "rule")
    trigger = inst.get("trigger", "")
    domain = inst.get("domain", "uncategorized")
    action = ae._extract_action(inst.get("body", ""))
    title = _title_from(trigger, action)

    lines = [
        "---",
        f"id: {cid}",
        f'trigger: "{trigger}"',
        f"confidence: {confidence:.2f}",
        f"domain: {domain}",
        "source: team-consensus",
        f'created_at: "{_today()}"',
    ]
    if author:
        lines.append(f"author: {author}")
    lines += [
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
        "",
    ]
    return "\n".join(lines)


# ---------- Main ----------

def main():
    parser = argparse.ArgumentParser(description="Promote a personal instinct into team/.")
    parser.add_argument("claude_dir", help="path to .claude directory")
    parser.add_argument("id", help="personal instinct id (or filename without .md)")
    parser.add_argument("--confidence", type=float, default=TEAM_CONFIDENCE,
                        help=f"confidence for the team rule (default {TEAM_CONFIDENCE})")
    parser.add_argument("--author", default=None, help="optional author tag")
    parser.add_argument("--force", action="store_true",
                        help="overwrite if team/<id>.md already exists")
    parser.add_argument("--canonical", default=None,
                        help="canonical team dir to write (default: cluade-smart; $TEAM_CANONICAL_DIR)")
    args = parser.parse_args()

    paths = get_paths(args.claude_dir)
    team_dir = resolve_canonical_team(args.canonical)

    inst = find_instinct(paths["personal_dir"], args.id)
    if not inst:
        print(f"[adopt] not found: personal/{args.id}.md", file=sys.stderr)
        print("[adopt] 检查 id 拼写，或运行 promote-to-team.py 查看候选清单。", file=sys.stderr)
        sys.exit(2)

    out = team_dir / f"{inst.get('id', args.id)}.md"
    if out.exists() and not args.force:
        print(f"[adopt] target exists: {out}", file=sys.stderr)
        print("[adopt] 用 --force 覆盖，或先手动处理已存在的规则。", file=sys.stderr)
        sys.exit(3)

    content = render_team_rule(inst, args.confidence, args.author)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")

    print(f"[adopt] wrote {out} (canonical team store)")
    print(f"[adopt] 下一步: 编辑 {out.name} 补充 Why / Example，")
    print("[adopt]        然后 git add .claude/homunculus/instincts/team/ 并提交 PR。")
    print("[adopt] 提示: 采纳后重新运行 promote-to-team.py，该规则会从候选清单消失。")
    print("[adopt]        运行 sync-team.py 把新规则蔓延到其他项目（或下次 cluade-smart 会话自动同步）。")


if __name__ == "__main__":
    main()
