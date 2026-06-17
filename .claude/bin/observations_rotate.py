#!/usr/bin/env python3
"""
observations_rotate.py - Data Rotation for Observation Files

Archives observation data when files exceed size/line limits.
  - Triggers when file > 5MB or > 8000 lines
  - Archives by month: observations-2026-05.jsonl
  - Main file retains only last 30 days of data

Usage: python3 observations_rotate.py <claude_dir>
"""

import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
MAX_LINES = 8000
RETENTION_DAYS = 30


def get_paths(claude_dir: str):
    obs_dir = Path(claude_dir) / "data" / "observations"
    obs_file = obs_dir / "observations.jsonl"
    return obs_dir, obs_file


def needs_rotation(obs_file: Path) -> bool:
    if not obs_file.exists():
        return False
    if obs_file.stat().st_size > MAX_SIZE_BYTES:
        return True
    line_count = 0
    with open(obs_file, "r", encoding="utf-8", errors="replace") as f:
        for _ in f:
            line_count += 1
            if line_count > MAX_LINES:
                return True
    return False


def archive_old_data(obs_dir: Path, obs_file: Path):
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=RETENTION_DAYS)

    recent_lines = []
    monthly_buckets = {}

    with open(obs_file, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obs = json.loads(line)
                ts_str = obs.get("ts", "")
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")) if ts_str else now
            except (json.JSONDecodeError, ValueError):
                recent_lines.append(line)
                continue

            month_key = ts.strftime("%Y-%m")
            if ts < cutoff:
                monthly_buckets.setdefault(month_key, []).append(line)
            else:
                recent_lines.append(line)

    # Write monthly archives
    for month_key, lines in monthly_buckets.items():
        archive_file = obs_dir / f"observations-{month_key}.jsonl"
        existing = []
        if archive_file.exists():
            with open(archive_file, "r", encoding="utf-8", errors="replace") as f:
                existing = f.readlines()

        with open(archive_file, "w", encoding="utf-8") as f:
            for el in existing:
                f.write(el if el.endswith("\n") else el + "\n")
            for l in lines:
                f.write(l + "\n")

    # Rewrite main file with only recent data
    with open(obs_file, "w", encoding="utf-8") as f:
        for line in recent_lines:
            f.write(line + "\n")

    # Clean up empty archives
    for af in obs_dir.glob("observations-*.jsonl"):
        if af.stat().st_size == 0:
            af.unlink()


def main():
    if len(sys.argv) < 2:
        print("Usage: observations_rotate.py <claude_dir>", file=sys.stderr)
        sys.exit(1)

    claude_dir = sys.argv[1]
    obs_dir, obs_file = get_paths(claude_dir)

    try:
        obs_dir.mkdir(parents=True, exist_ok=True)
        if needs_rotation(obs_file):
            archive_old_data(obs_dir, obs_file)
    except Exception as e:
        err_log = obs_dir / "rotate_errors.log"
        try:
            with open(err_log, "a", encoding="utf-8") as f:
                f.write(f"{datetime.now().isoformat()} ERROR: {e}\n")
        except Exception:
            pass


if __name__ == "__main__":
    main()
