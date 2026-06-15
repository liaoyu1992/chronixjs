#!/usr/bin/env python3
"""
auto-evolve.py - Evolution Aggregator

Runs after auto-analyze-instincts.py (Stop Hook).
  1. Filters instincts with confidence >= 0.7
  2. Deduplicates via Jaccard similarity + Union-Find
  3. Groups by domain, generates Evolved Skills
  4. Writes .claude/rules/auto-evolved.md (overwritten each time)

Usage: python3 auto-evolve.py <claude_dir>
"""

import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


# ---------- Path Helpers ----------

def get_paths(claude_dir: str):
    base = Path(claude_dir)
    return {
        "instincts_dir": base / "homunculus" / "instincts" / "personal",
        "rules_file": base / "rules" / "auto-evolved.md",
        "rules_dir": base / "rules",
    }


# ---------- Instinct Loading ----------

def load_all_instincts(instincts_dir: Path) -> list[dict]:
    """Load all non-deprecated instinct files."""
    if not instincts_dir.exists():
        return []

    instincts = []
    for md_file in instincts_dir.glob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            if not content.startswith("---"):
                continue
            parts = content.split("---", 2)
            if len(parts) < 3:
                continue

            frontmatter_text = parts[1].strip()
            body = parts[2].strip()

            meta = {}
            for line in frontmatter_text.split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key == "confidence":
                        meta[key] = float(val)
                    elif key == "deprecated":
                        meta[key] = val.lower() == "true"
                    elif key == "observed_count":
                        meta[key] = int(val) if val.isdigit() else 1
                    else:
                        meta[key] = val

            if meta.get("deprecated", False):
                continue

            meta["body"] = body
            meta["file"] = md_file.name
            instincts.append(meta)
        except Exception:
            continue

    return instincts


# ---------- Tokenization & Similarity ----------

def tokenize(text: str) -> set[str]:
    """Extract English technical keywords for Jaccard similarity.
    Only English words are used so that cross-language (CN/EN) patterns
    with the same technical terms are correctly identified as duplicates."""
    # Extract words: sequences of alphanumeric chars, filter short ones
    words = re.findall(r'[a-zA-Z][a-zA-Z0-9_-]{2,}', text.lower())
    # Remove common stop words
    stop_words = {"the", "and", "for", "when", "that", "this", "with", "from",
                  "about", "after", "before", "using", "based", "should"}
    return set(w for w in words if w not in stop_words)


def jaccard(a: set[str], b: set[str]) -> float:
    """Jaccard similarity between two token sets."""
    if not a and not b:
        return 0.0
    intersection = len(a & b)
    union = len(a | b)
    return intersection / union if union else 0.0


# ---------- Union-Find Deduplication ----------

class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: int, y: int):
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1


def _extract_action(body: str) -> str:
    """Extract only the ## Action section from instinct body text.

    Article spec: tokenize(trigger + action), NOT trigger + full body.
    The full body includes ## Evidence which varies between observations
    and adds noise to Jaccard similarity calculation.
    """
    action_match = re.search(r'## Action\s*\n(.*?)(?:\n## |\Z)', body, re.DOTALL)
    if action_match:
        return action_match.group(1).strip()
    return body.split("\n")[0].strip() if body else ""


def deduplicate_instincts(instincts: list[dict], sim_threshold: float = 0.5) -> list[dict]:
    """Deduplicate instincts using Jaccard similarity + Union-Find.
    Each group's representative is the instinct with highest confidence."""
    if not instincts:
        return []

    # Article spec: tokenize(trigger + action) — only Action, not full body
    tokens = [tokenize(i.get("trigger", "") + " " + _extract_action(i.get("body", ""))) for i in instincts]
    n = len(instincts)
    uf = UnionFind(n)

    for i in range(n):
        for j in range(i + 1, n):
            if jaccard(tokens[i], tokens[j]) >= sim_threshold:
                uf.union(i, j)

    # Group by root
    groups = defaultdict(list)
    for i in range(n):
        groups[uf.find(i)].append(i)

    # Each group → highest confidence representative
    result = []
    for root, members in groups.items():
        best = max(members, key=lambda idx: instincts[idx].get("confidence", 0))
        result.append(instincts[best])

    return result


# ---------- Domain Aggregation ----------

def aggregate_by_domain(instincts: list[dict]) -> dict[str, list[dict]]:
    """Group instincts by domain."""
    groups = defaultdict(list)
    for inst in instincts:
        domain = inst.get("domain", "uncategorized")
        groups[domain].append(inst)
    return dict(groups)


def generate_evolved_skill(domain: str, instincts: list[dict]) -> str:
    """Generate an Evolved Skill section for a domain."""
    # Sort by confidence descending
    sorted_instincts = sorted(instincts, key=lambda x: x.get("confidence", 0), reverse=True)

    lines = [f"### {domain.title()}\n"]
    for inst in sorted_instincts:
        confidence = inst.get("confidence", 0)
        trigger = inst.get("trigger", "")
        body = inst.get("body", "")

        # Extract Action section from body
        action = ""
        action_match = re.search(r'## Action\s*\n(.*?)(?:\n## |\Z)', body, re.DOTALL)
        if action_match:
            action = action_match.group(1).strip()
        elif body:
            action = body.split("\n")[0].strip()

        lines.append(f"- **[{confidence:.0%}]** {trigger}")
        if action:
            lines.append(f"  → {action}")
        lines.append("")

    return "\n".join(lines)


# ---------- Rules File Generation ----------

def write_evolved_rules(rules_file: Path, domain_groups: dict[str, list[dict]]):
    """Write the auto-evolved.md rules file (overwritten each time)."""
    rules_file.parent.mkdir(parents=True, exist_ok=True)

    # Filter: only domains with >= 2 instincts (article spec)
    valid_domains = {d: insts for d, insts in domain_groups.items() if len(insts) >= 2}

    if not valid_domains:
        # Don't write empty file
        if rules_file.exists():
            rules_file.unlink()
        return

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    total = sum(len(v) for v in valid_domains.values())

    header = f"""# 🧬 Auto-Evolved Rules
> Auto-generated on {now} | {total} active instincts across {len(valid_domains)} domains
> These rules are learned from observing your coding patterns. They are automatically loaded by Claude Code.

"""

    sections = []
    for domain in sorted(valid_domains.keys()):
        sections.append(generate_evolved_skill(domain, valid_domains[domain]))

    content = header + "\n---\n\n".join(sections)

    rules_file.write_text(content, encoding="utf-8")


# ---------- Main ----------

def main():
    if len(sys.argv) < 2:
        print("Usage: auto-evolve.py <claude_dir>", file=sys.stderr)
        sys.exit(1)

    claude_dir = sys.argv[1]
    paths = get_paths(claude_dir)

    # Step 1: Load all active instincts
    all_instincts = load_all_instincts(paths["instincts_dir"])
    if not all_instincts:
        return

    # Step 2: Filter by confidence >= 0.7
    high_conf = [i for i in all_instincts if i.get("confidence", 0) >= 0.7]

    # Step 3: Deduplicate
    deduped = deduplicate_instincts(high_conf)

    # Step 4: Aggregate by domain
    domain_groups = aggregate_by_domain(deduped)

    # Step 5: Write rules file
    write_evolved_rules(paths["rules_file"], domain_groups)


if __name__ == "__main__":
    main()
