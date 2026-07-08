#!/usr/bin/env python3
"""
sync-team.py - Fan the canonical team instinct store out to enrolled projects.

cluade-smart is the authoritative team/ store (Git-tracked; adopt-instinct.py
writes there). This script copies canonical team/*.md into each enrolled
project's team/ so a rule adopted once surfaces in every project's SessionStart
injection — inject_memory_context.py reads the local team/ as a "global
instinct" bucket (article: "Memory（项目级）含全局 Instinct").

Run centrally from cluade-smart (wired into its session-inject.sh step 0), or
manually after adopting a new team rule. Copy-only by default (review + commit
in each target, mirroring adopt-instinct.py's convention); --commit stages and
commits in each target repo. Content-hash skip makes re-runs a no-op when
targets are already current.

Canonical source (first wins): --canonical <dir> | $TEAM_CANONICAL_DIR | default.
Targets (first wins): --target <dir> (repeatable) | $TEAM_SYNC_TARGETS |
                      <canonical>/.claude/team-sync.conf | default 3 projects.

Usage:
  python3 sync-team.py [--dry-run] [--commit] [--mirror] [--quiet]
                       [--canonical <dir>] [--target <dir>]...
"""

import argparse
import hashlib
import os
import subprocess
import sys
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

# Machine-local defaults (the 4 enrolled projects all live under work/).
# Override per-invocation via --canonical / TEAM_CANONICAL_DIR if the tree moves.
DEFAULT_CANONICAL_TEAM = Path(
    "C:/Users/liaoyu/work/cluade-smart/.claude/homunculus/instincts/team"
)
DEFAULT_TARGETS = [
    Path("C:/Users/liaoyu/work/chronixjs/.claude/homunculus/instincts/team"),
    Path("C:/Users/liaoyu/work/lop/master-temp/lop-flutter/.claude/homunculus/instincts/team"),
    Path("C:/Users/liaoyu/work/ndt/vefine/.claude/homunculus/instincts/team"),
]
COMMIT_MSG = "chore(team-instincts): sync from cluade-smart"


def _log(msg, quiet):
    if not quiet:
        print(msg)


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def resolve_canonical(cli_canonical):
    if cli_canonical:
        return Path(cli_canonical)
    env = os.environ.get("TEAM_CANONICAL_DIR")
    if env:
        return Path(env)
    return DEFAULT_CANONICAL_TEAM


def resolve_targets(cli_targets, canonical_team: Path):
    """First-wins target resolution: CLI > env > conf file > defaults."""
    if cli_targets:
        return [Path(t) for t in cli_targets]
    env = os.environ.get("TEAM_SYNC_TARGETS")
    if env:
        return [Path(t.strip()) for t in env.replace(";", "\n").splitlines() if t.strip()]
    # canonical_team = .../.claude/homunculus/instincts/team -> .claude is parents[2]
    if len(canonical_team.parents) >= 3:
        conf = canonical_team.parents[2] / "team-sync.conf"
        if conf.exists():
            rows = []
            for line in conf.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#"):
                    rows.append(Path(line))
            if rows:
                return rows
    return list(DEFAULT_TARGETS)


def find_repo_root(path: Path):
    for p in [path] + list(path.parents):
        if (p / ".git").exists():
            return p
    return None


def _label(target: Path) -> str:
    repo = find_repo_root(target)
    if repo:
        return repo.name
    # team <- instincts <- homunculus <- .claude <- <project>
    return target.parents[4].name if len(target.parents) > 4 else str(target)


def sync_target(source_files, target: Path, dry_run: bool, mirror: bool) -> dict:
    """Copy canonical team files into one target. Returns stats dict."""
    stats = {"copied": 0, "skipped": 0, "removed": 0, "error": None}
    try:
        target.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        stats["error"] = f"mkdir failed: {e}"
        return stats

    canonical_names = {f.name for f in source_files}
    for src in source_files:
        dst = target / src.name
        if dst.exists() and _sha256(dst) == _sha256(src):
            stats["skipped"] += 1
            continue
        if not dry_run:
            dst.write_bytes(src.read_bytes())
        stats["copied"] += 1

    if mirror and not dry_run:
        for extra in target.glob("*.md"):
            if extra.name not in canonical_names:
                extra.unlink()
                stats["removed"] += 1
    return stats


def maybe_commit(target: Path):
    """Stage (adds+deletes) and commit the team dir in target's repo. Best-effort."""
    repo = find_repo_root(target)
    if not repo:
        return "no .git repo root found"
    rel = target.relative_to(repo).as_posix()
    try:
        subprocess.run(["git", "-C", str(repo), "add", "-A", "--", rel + "/"],
                       capture_output=True, timeout=30)
        # Nothing staged -> nothing to commit.
        staged = subprocess.run(["git", "-C", str(repo), "diff", "--cached", "--quiet"])
        if staged.returncode == 0:
            return "nothing staged"
        subprocess.run(["git", "-C", str(repo), "commit", "-m", COMMIT_MSG],
                       capture_output=True, timeout=60)
        return None
    except Exception as e:
        return f"git error: {e}"


def main():
    p = argparse.ArgumentParser(description="Sync canonical team instincts to enrolled projects.")
    p.add_argument("--dry-run", action="store_true", help="preview only; write nothing")
    p.add_argument("--commit", action="store_true", help="git add+commit in each target after copy")
    p.add_argument("--mirror", action="store_true", help="delete target files absent from canonical")
    p.add_argument("--quiet", action="store_true", help="suppress stdout")
    p.add_argument("--canonical", default=None, help="canonical team dir (default: cluade-smart)")
    p.add_argument("--target", action="append", default=[], help="target team dir (repeatable)")
    args = p.parse_args()

    canonical = resolve_canonical(args.canonical)
    if not canonical.exists():
        print(f"[sync-team] canonical team dir not found: {canonical}", file=sys.stderr)
        sys.exit(1)

    source_files = sorted(canonical.glob("*.md"))
    targets = resolve_targets(args.target, canonical)

    _log(f"[sync-team] canonical: {canonical} ({len(source_files)} files)", args.quiet)
    mode = " [DRY RUN]" if args.dry_run else ""
    _log(f"[sync-team] targets: {len(targets)}{mode}", args.quiet)

    for t in targets:
        stats = sync_target(source_files, t, args.dry_run, args.mirror)
        if stats["error"]:
            print(f"[sync-team]   {_label(t)}: ERROR {stats['error']}", file=sys.stderr)
            continue
        _log(f"[sync-team]   {_label(t)}: {stats['copied']} copied, "
             f"{stats['skipped']} skipped, {stats['removed']} removed", args.quiet)
        if args.commit and not args.dry_run and stats["copied"] > 0:
            err = maybe_commit(t)
            if err and err != "nothing staged":
                print(f"[sync-team]     commit: {err}", file=sys.stderr)
            elif not err:
                _log("[sync-team]     commit: done", args.quiet)


if __name__ == "__main__":
    main()
