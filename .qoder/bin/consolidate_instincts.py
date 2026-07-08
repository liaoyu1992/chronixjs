#!/usr/bin/env python3
"""
consolidate_instincts.py - One-shot instinct cleanup (dedupe + prune).

Historic AI-instinct id drift left ~100 instinct files where almost none ever
reached confidence 0.7: each session emitted a differently-worded id, so
semantically identical patterns spawned separate 0.5-confidence files that
never reinforced each other. This script trims that backlog in three safe ways:

  1. Merge near-duplicate clusters (Jaccard >= --sim on trigger+action): sum
     observed_count, recompute confidence, keep the highest-confidence member.
  2. Delete files flagged deprecated:true (confidence decayed below threshold).
  3. Prune single-observation noise: count<=1 AND confidence<=0.5 — one-off,
     randomly-worded instincts with no accumulation signal. Statistical
     detectors and any reinforced/merged instinct have count>1, so they are
     never touched.

Note: Jaccard on these short trigger+action strings is noisy (shared generic
tokens inflate similarity), so merging is intentionally conservative (sim 0.5);
the real bulk reduction comes from steps 2-3.

Run manually (dry-run first):
  python3 consolidate_instincts.py <claude_dir> [--sim 0.5] [--dry-run]
"""

import argparse
import importlib.util
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def _load_auto_evolve():
    """Load auto-evolve.py for load_all_instincts / tokenize / jaccard /
    _extract_action / UnionFind (same primitives the evolve pipeline uses)."""
    ae_path = Path(__file__).resolve().parent / "auto-evolve.py"
    spec = importlib.util.spec_from_file_location("auto_evolve", ae_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def cluster_instincts(ae, instincts, sim_threshold):
    """Group instincts by Jaccard similarity via Union-Find -> list of clusters."""
    tokens = [
        ae.tokenize(i.get("trigger", "") + " " + ae._extract_action(i.get("body", "")))
        for i in instincts
    ]
    n = len(instincts)
    uf = ae.UnionFind(n)
    for i in range(n):
        for j in range(i + 1, n):
            if ae.jaccard(tokens[i], tokens[j]) >= sim_threshold:
                uf.union(i, j)
    groups = {}
    for i in range(n):
        groups.setdefault(uf.find(i), []).append(i)
    return [[instincts[i] for i in members] for members in groups.values()]


def plan_merge(cluster):
    """Pick representative (highest confidence) + merged count/confidence."""
    rep = max(cluster, key=lambda x: x.get("confidence", 0))
    total_count = sum(int(c.get("observed_count", 1) or 1) for c in cluster)
    rep_confidence = float(rep.get("confidence", 0.5))
    # Re-derive confidence from total observations, never lowering what the
    # representative already earned.
    derived = min(0.9, 0.5 + (total_count - 1) * 0.05)
    return rep, total_count, max(rep_confidence, derived)


def rewrite_representative(instincts_dir, rep, total_count, new_confidence):
    """Update the representative file's confidence + observed_count in place."""
    f = instincts_dir / rep["file"]
    content = f.read_text(encoding="utf-8")
    content = re.sub(r"confidence: [\d.]+", f"confidence: {new_confidence:.2f}", content)
    content = re.sub(r"observed_count: \d+", f"observed_count: {total_count}", content)
    content = re.sub(r"deprecated: \w+", "deprecated: false", content)
    f.write_text(content, encoding="utf-8")


def _is_deprecated(md: Path) -> bool:
    try:
        content = md.read_text(encoding="utf-8")
    except Exception:
        return False
    parts = content.split("---", 2)
    return len(parts) >= 3 and bool(
        re.search(r"^deprecated:\s*true", parts[1], re.MULTILINE)
    )


def delete_deprecated(instincts_dir) -> int:
    removed = 0
    for md in instincts_dir.glob("*.md"):
        if _is_deprecated(md):
            md.unlink()
            removed += 1
    return removed


def prune_single_observation(instincts_dir, instincts, dry_run=False) -> int:
    """Remove single-observation instincts (count<=1 AND confidence<=0.5).

    A one-session grace period protects instincts created *today*: stop.sh
    runs consolidate in the same pass that auto-analyze just wrote a fresh
    0.5/count=1 instinct, so pruning it immediately would delete the signal
    before it can ever be re-observed next session. We skip anything observed
    today (mirrors apply_confidence_decay's own guard)."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    removed = 0
    for inst in instincts:
        conf = float(inst.get("confidence", 0.5))
        count = int(inst.get("observed_count", 1) or 1)
        if conf <= 0.5 and count <= 1:
            if inst.get("observed_at", "") == today:
                continue  # fresh this session; give it a chance to recur
            if dry_run:
                removed += 1
                continue
            f = instincts_dir / inst["file"]
            if f.exists():
                f.unlink(missing_ok=True)
                removed += 1
    return removed


def main():
    parser = argparse.ArgumentParser(description="Consolidate duplicate instinct files.")
    parser.add_argument("claude_dir")
    parser.add_argument("--sim", type=float, default=0.5,
                        help="Jaccard threshold for clustering (default 0.5)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview only; change nothing on disk")
    args = parser.parse_args()

    instincts_dir = Path(args.claude_dir) / "homunculus" / "instincts" / "personal"
    if not instincts_dir.exists():
        print(f"[consolidate] {instincts_dir} does not exist", file=sys.stderr)
        sys.exit(1)

    ae = _load_auto_evolve()
    instincts = ae.load_all_instincts(instincts_dir)  # active (non-deprecated)
    before = len(list(instincts_dir.glob("*.md")))

    # Step 1: merge near-duplicate clusters.
    clusters = cluster_instincts(ae, instincts, args.sim)
    multi = [c for c in clusters if len(c) > 1]
    merged_files = 0
    for cluster in multi:
        rep, total_count, new_confidence = plan_merge(cluster)
        if args.dry_run:
            names = [c["file"] for c in cluster]
            print(f"  cluster ({len(cluster)}): keep {rep['file']} "
                  f"count={total_count} conf={new_confidence:.2f} :: {names}")
            continue
        rewrite_representative(instincts_dir, rep, total_count, new_confidence)
        for c in cluster:
            if c["file"] != rep["file"]:
                (instincts_dir / c["file"]).unlink(missing_ok=True)
                merged_files += 1

    # Step 2: remove deprecated files.
    if args.dry_run:
        dep_count = sum(1 for md in instincts_dir.glob("*.md") if _is_deprecated(md))
    else:
        dep_count = delete_deprecated(instincts_dir)

    # Step 3: re-load (post-merge) and prune single-observation noise.
    instincts_now = ae.load_all_instincts(instincts_dir)
    pruned = prune_single_observation(instincts_dir, instincts_now, args.dry_run)

    if args.dry_run:
        # Nothing was actually deleted; project the post-cleanup count so the
        # dry-run message is honest instead of always echoing `before`.
        after = before - dep_count - merged_files - pruned
    else:
        after = len(list(instincts_dir.glob("*.md")))
    mode = "[DRY RUN]" if args.dry_run else ""
    print(f"[consolidate] {before} -> {after} files "
          f"({len(multi)} clusters, {merged_files} merged; "
          f"{dep_count} deprecated, {pruned} single-obs pruned) {mode}")


if __name__ == "__main__":
    main()
