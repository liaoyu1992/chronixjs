#!/usr/bin/env python3
"""
inject_memory_context.py - Memory Injection at Session Start

Triggered by SessionStart Hook. Performs the full recall pipeline:
  1. Sync: embed any un-embedded memory files into vector store
  2. Build query from $PWD + recent git commits
  3. Vector search Top-5 relevant memories
  4. Write structured Markdown to .claude/rules/injected-memory.md

Claude Code auto-loads all .md files in .claude/rules/ at session start.

Usage: python3 inject_memory_context.py <claude_dir>
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add parent dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from embed import embed_text, check_ollama_available
from vector_store import MemoryVectorStore, COLLECTION_NAME

# --- Anti-bloat ---
MAX_INJECTED_LINES = 160  # Prune injected-memory.md beyond this

# --- Memory TTL by type (days) ---
# Article Image 8 spec: user/feedback 永久, project 60天, reference 90天
MEMORY_TTL = {
    "user": None,       # 永久 (permanent)
    "feedback": None,   # 永久 (permanent)
    "project": 60,
    "reference": 90,
}
DEFAULT_TTL = 90


def get_memory_type(meta: dict) -> str:
    """Extract memory type from frontmatter, handling both flat and nested formats."""
    # Flat: type: feedback
    if "type" in meta:
        return meta["type"]
    # Nested: metadata:\n  type: feedback
    metadata = meta.get("metadata", {})
    if isinstance(metadata, dict):
        return metadata.get("type", "")
    if isinstance(metadata, str):
        # Parse "type: feedback" from metadata string
        for line in str(metadata).split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                if k.strip() == "type":
                    return v.strip().strip('"').strip("'")
    return ""


def get_project_name() -> str:
    """Extract project name from current working directory."""
    cwd = os.environ.get("PWD", os.getcwd())
    return Path(cwd).name


def get_recent_commits(cwd: str = None, count: int = 3) -> str:
    """Get recent git commit messages for semantic context."""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{count}"],
            capture_output=True, text=True, timeout=5,
            cwd=cwd or os.getcwd(),
        )
        return result.stdout.strip()
    except Exception:
        return ""


def build_query(cwd: str = None) -> str:
    """Build the recall query from project name + recent commits."""
    project_name = get_project_name()
    commits = get_recent_commits(cwd)
    parts = [project_name]
    if commits:
        parts.append(commits)
    return " ".join(parts)


def load_memory_files(memory_dir: Path) -> list[dict]:
    """Load all memory Markdown files from the memory directory."""
    if not memory_dir.exists():
        return []

    memories = []
    for md_file in memory_dir.glob("*.md"):
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
                    meta[key] = val

            meta["body"] = body
            meta["file_path"] = str(md_file)
            meta["_type"] = get_memory_type(meta)
            memories.append(meta)
        except Exception:
            continue

    return memories


def bm25_recall(memories: list[dict], query: str, top_k: int = 5) -> list[dict]:
    """BM25 keyword-based recall — fallback when Ollama is unavailable.

    Article Image 9 spec: "BM25 关键词检索 — Ollama 未运行时自动降级，保证可用性"
    Simple BM25-style scoring using term frequency / inverse document frequency.
    """
    if not memories or not query:
        return []

    # Tokenize query
    query_terms = set(re.findall(r'[a-zA-Z0-9_-]{2,}', query.lower()))
    # Also tokenize Chinese characters individually
    query_terms.update(re.findall(r'[一-鿿]', query))

    if not query_terms:
        return memories[:top_k]

    # Average document length for BM25 normalization
    doc_lengths = []
    all_docs = []
    for mem in memories:
        text = f"{mem.get('name', '')} {mem.get('description', '')} {mem.get('body', '')}"
        tokens = re.findall(r'[a-zA-Z0-9_-]{2,}', text.lower())
        tokens.extend(re.findall(r'[一-鿿]', text))
        doc_lengths.append(len(tokens))
        all_docs.append(tokens)

    avg_dl = sum(doc_lengths) / len(doc_lengths) if doc_lengths else 1

    # BM25 parameters
    k1 = 1.5
    b = 0.75

    # IDF for each query term
    n_docs = len(memories)
    idf = {}
    for term in query_terms:
        df = sum(1 for doc in all_docs if term in doc)
        idf[term] = ((n_docs - df + 0.5) / (df + 0.5) + 1) if df > 0 else 0

    # Score each memory
    scored = []
    for i, (mem, doc) in enumerate(zip(memories, all_docs)):
        score = 0.0
        dl = doc_lengths[i]
        for term in query_terms:
            tf = doc.count(term)
            numerator = tf * (k1 + 1)
            denominator = tf + k1 * (1 - b + b * dl / avg_dl)
            score += idf.get(term, 0) * numerator / denominator
        scored.append((score, mem))

    scored.sort(key=lambda x: -x[0])

    result = []
    for score, mem in scored[:top_k]:
        mem_copy = dict(mem)
        mem_copy["score"] = score
        result.append(mem_copy)
    return result


def ttl_cleanup(memory_dir: Path, memories: list[dict]) -> list[dict]:
    """Remove expired memory files based on per-type TTL.

    Article spec: Memory raw TTL management (60-90 days by type).
    """
    now = datetime.now(timezone.utc)
    surviving = []

    for mem in memories:
        mem_type = mem.get("_type", "")
        ttl_days = MEMORY_TTL.get(mem_type, DEFAULT_TTL)

        # Permanent types (user, feedback) never expire
        if ttl_days is None:
            surviving.append(mem)
            continue

        # Check created date
        created_str = mem.get("created", mem.get("metadata", ""))
        created = None

        # Try to parse created date
        if isinstance(created_str, str) and created_str:
            for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M"):
                try:
                    created = datetime.strptime(created_str[:16], fmt).replace(tzinfo=timezone.utc)
                    break
                except ValueError:
                    continue

        if created is None:
            # No creation date → keep (safety)
            surviving.append(mem)
            continue

        age_days = (now - created).days
        if age_days > ttl_days:
            # TTL expired → delete the memory file
            fp = mem.get("file_path", "")
            if fp and Path(fp).exists():
                Path(fp).unlink()
        else:
            surviving.append(mem)

    return surviving


def sync_embeddings(memory_dir: Path, memories: list[dict], store: MemoryVectorStore):
    """Embed any memory files that don't yet have vectors in the store.

    Uses hash-based lookup instead of embedding each name for existence check.
    """
    for mem in memories:
        name = mem.get("name", "")
        if not name:
            continue

        try:
            # Check existence via hash ID (O(1) vs O(N) vector search)
            from vector_store import _memory_hash
            point_id = _memory_hash(name)
            already_stored = False

            if store.mode == "qdrant":
                try:
                    from qdrant_client.models import PointIdsList
                    points = store.client.retrieve(COLLECTION_NAME, ids=[point_id])
                    already_stored = len(points) > 0
                except Exception:
                    pass
            else:
                # Numpy fallback: check JSON index directly
                index = store._load_index()
                already_stored = str(point_id) in index

            if not already_stored:
                # Construct embedding text = name + description + body[:200]
                desc = mem.get("description", "")
                body_preview = mem.get("body", "")[:200]
                embed_input = f"{name} {desc} {body_preview}"

                vector = embed_text(embed_input)
                if vector:
                    store.upsert_memory(
                        name=name,
                        vector=vector,
                        memory_type=mem.get("_type", "project"),
                        file_path=mem.get("file_path", ""),
                        description=desc,
                    )
        except Exception:
            continue


def format_injected_memory(memories: list[dict]) -> str:
    """Format recalled memories into structured Markdown for Claude's context."""
    if not memories:
        return ""

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines = [
        "# 🧠 项目记忆（自动注入，请优先参考）",
        f"> Auto-injected at session start ({now}) | {len(memories)} memories recalled",
        "> These memories are from past sessions. Apply them proactively.",
        "",
    ]

    # Group by type (priority order)
    type_order = ["user", "feedback", "project", "reference"]
    type_labels = {
        "user": "👤 用户偏好",
        "feedback": "💡 行为反馈",
        "project": "📂 项目知识",
        "reference": "🔗 参考资源",
    }

    for mem_type in type_order:
        matched = [m for m in memories if m.get("_type", "") == mem_type]
        if not matched:
            continue

        label = type_labels.get(mem_type, mem_type.title())
        lines.append(f"## {label}")
        lines.append("")

        for mem in matched:
            desc = mem.get("description", "")
            body = mem.get("body", "")
            score = mem.get("score", None)

            score_str = f" ({score:.0%} match)" if score and isinstance(score, float) else ""
            lines.append(f"**[{mem_type}]** {desc}{score_str}")

            if body:
                body_lines = [l.strip() for l in body.split("\n") if l.strip() and not l.startswith("#")]
                for bl in body_lines[:4]:
                    lines.append(f"> {bl}")

            lines.append("")

    return "\n".join(lines)


def prune_to_lines(content: str, max_lines: int = MAX_INJECTED_LINES) -> str:
    """Prune injected content to max_lines by removing lowest priority entries.

    Article spec: "MEMORY.md: 超 160 行按优先级裁剪"
    Priority: user > feedback > project > reference (remove reference first)
    """
    lines = content.split("\n")
    if len(lines) <= max_lines:
        return content

    # Remove sections starting from lowest priority
    priority_order = ["reference", "project", "feedback", "user"]

    for remove_type in priority_order:
        if len(lines) <= max_lines:
            break
        header = f"## "
        type_labels = {"reference": "参考资源", "project": "项目知识", "feedback": "行为反馈", "user": "用户偏好"}
        target_header = f"## 🔗 {type_labels[remove_type]}" if remove_type == "reference" else \
                        f"## 📂 {type_labels[remove_type]}" if remove_type == "project" else \
                        f"## 💡 {type_labels[remove_type]}" if remove_type == "feedback" else \
                        f"## 👤 {type_labels[remove_type]}"

        # Find and remove the section
        new_lines = []
        in_section = False
        for line in lines:
            if line.strip() == target_header:
                in_section = True
                continue
            if in_section and line.startswith("## "):
                in_section = False
            if not in_section:
                new_lines.append(line)

        lines = new_lines

    return "\n".join(lines[:max_lines])


def write_injected_rules(rules_file: Path, content: str):
    """Write the injected memory context to the rules file."""
    rules_file.parent.mkdir(parents=True, exist_ok=True)
    if content:
        content = prune_to_lines(content)
        rules_file.write_text(content, encoding="utf-8")
    elif rules_file.exists():
        rules_file.unlink()


def main():
    if len(sys.argv) < 2:
        print("Usage: inject_memory_context.py <claude_dir>", file=sys.stderr)
        sys.exit(1)

    claude_dir = sys.argv[1]
    base = Path(claude_dir)
    memory_dir = base / "memory"
    raw_dir = base / "memory" / "raw"  # extract_memory.py output (article Image 4)
    rules_file = base / "rules" / "injected-memory.md"

    # Step 1: Load all memory files from both memory/ and memory/raw/
    all_memories = load_memory_files(memory_dir)
    all_memories.extend(load_memory_files(raw_dir))

    if not all_memories:
        if rules_file.exists():
            rules_file.unlink()
        return

    # Step 2: TTL cleanup (remove expired memories)
    all_memories = ttl_cleanup(memory_dir, all_memories)

    if not all_memories:
        if rules_file.exists():
            rules_file.unlink()
        return

    # Step 3: Sync embeddings (embed new memories into vector store)
    ollama_ok = check_ollama_available()
    store = None
    if ollama_ok:
        try:
            store = MemoryVectorStore(claude_dir)
            sync_embeddings(memory_dir, all_memories, store)
        except Exception:
            store = None

    # Step 4: Build query and do vector recall (or BM25 fallback)
    query = build_query()
    recalled = []
    used_vector = False

    if store and query:
        query_vec = embed_text(query)
        if query_vec:
            try:
                recalled = store.recall_memories(query_vec, top_k=5)
                used_vector = True
            except Exception:
                recalled = []

    # BM25 fallback: when Ollama is unavailable (article Image 9 spec)
    if not used_vector and query and all_memories:
        recalled = bm25_recall(all_memories, query, top_k=5)

    # Step 5: Merge recalled with all memories (recalled ones get priority)
    if recalled:
        recalled_names = {r.get("name") for r in recalled}
        result = []

        for r in recalled:
            matching = [m for m in all_memories if m.get("name") == r.get("name")]
            if matching:
                mem = matching[0]
                mem["score"] = r.get("score", 0)
                result.append(mem)
            else:
                result.append(r)

        for mem in all_memories:
            if mem.get("name") not in recalled_names:
                result.append(mem)

        final_memories = result
    else:
        final_memories = all_memories

    # Step 6: Format and write (with 160-line pruning)
    content = format_injected_memory(final_memories)
    write_injected_rules(rules_file, content)


if __name__ == "__main__":
    main()
