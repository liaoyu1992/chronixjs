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

# --- Injection budget (top-K selection) ---
# user/feedback are always kept (few, high-value); project/reference are ranked
# by relevance and capped, so injected-memory.md stays focused instead of
# dumping every memory in the store.
INJECT_BUDGET = 10
PROJECT_REFERENCE_SLOTS = 6
INSTINCT_SLOTS = 3  # team/global behavior rules surfaced alongside memories

# --- Memory TTL by type (days) ---
# Article Image 8 spec: user/feedback 永久, project 60天, reference 90天
# Pitfalls are permanent because they represent hard-earned knowledge.
MEMORY_TTL = {
    "user": None,       # 永久
    "feedback": None,   # 永久
    "pitfall": None,    # 永久 (pitfalls are long-term knowledge)
    "instinct": None,   # 永久 (team/global instincts are curated, never expire)
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


def load_team_instincts(team_dir: Path) -> list[dict]:
    """Load shared team/global instincts as injectable items (type "instinct").

    These are the article's "全局 Instinct" — curated, cross-project behavior
    rules that Memory injection surfaces alongside project memories. Unlike
    memory files they have trigger/confidence/domain frontmatter and no TTL.
    We synthesize the `name` the vector store keys on as "instinct::<id>" (it
    must be stable across sessions). Files without an `id` (e.g. TEAM.md docs)
    and deprecated entries are skipped.
    """
    if not team_dir.exists():
        return []

    instincts = []
    for md_file in team_dir.glob("*.md"):
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

            cid = meta.get("id", "")
            if not cid:  # skip docs like TEAM.md that have no id
                continue
            if str(meta.get("deprecated", "")).lower() == "true":
                continue

            meta["name"] = f"instinct::{cid}"
            meta["description"] = meta.get("trigger", "")  # trigger is the discriminative text
            meta["body"] = body
            meta["file_path"] = str(md_file)
            meta["_type"] = "instinct"
            instincts.append(meta)
        except Exception:
            continue

    return instincts


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

    top = scored[:top_k]
    # Normalize BM25 absolute scores to [0,1] so format_injected_memory's
    # "{score:.0%}" renders sensibly. The vector path (recall_memories) already
    # returns cosine similarity in [0,1]; without this, the BM25 fallback
    # produced meaningless values like "535% match".
    max_score = top[0][0] if top and top[0][0] > 0 else 1.0

    result = []
    for score, mem in top:
        mem_copy = dict(mem)
        mem_copy["score"] = (score / max_score) if max_score > 0 else 0.0
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


def select_top_k(memories: list[dict]) -> list[dict]:
    """Select memories for injection by type priority + relevance score.

    user/feedback/pitfall are always kept (rare and high-value); project/reference are
    ranked by score and capped. Returns at most INJECT_BUDGET entries, ordered
    by type priority then score, so format_injected_memory renders the most
    relevant memories first.
    """
    type_order = ["user", "feedback", "pitfall", "instinct", "project", "reference"]
    buckets: dict[str, list[dict]] = {t: [] for t in type_order}
    for mem in memories:
        mem_type = mem.get("_type") or mem.get("type", "project")
        buckets.setdefault(mem_type, []).append(mem)

    for t in type_order:
        buckets[t].sort(key=lambda m: m.get("score", 0.0), reverse=True)

    kept: list[dict] = []
    kept.extend(buckets["user"])
    kept.extend(buckets["feedback"])
    kept.extend(buckets["pitfall"][:3])  # Keep up to 3 pitfalls (high-value, limited)
    kept.extend(buckets["instinct"][:INSTINCT_SLOTS])  # global behavior rules
    kept.extend(buckets["project"][:PROJECT_REFERENCE_SLOTS])
    kept.extend(buckets["reference"][:PROJECT_REFERENCE_SLOTS])

    priority = {t: i for i, t in enumerate(type_order)}
    kept.sort(key=lambda m: (
        priority.get(m.get("_type") or m.get("type", "project"), 9),
        -m.get("score", 0.0),
    ))
    return kept[:INJECT_BUDGET]


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
    type_order = ["user", "feedback", "pitfall", "instinct", "project", "reference"]
    type_labels = {
        "user": "👤 用户偏好",
        "feedback": "💡 行为反馈",
        "pitfall": "⚠️ 业务防坑",
        "instinct": "🧭 全局 Instinct",
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

    # Remove sections starting from lowest priority (instinct outlasts
    # project/reference, yields before pitfall/feedback/user)
    priority_order = ["reference", "project", "instinct", "pitfall", "feedback", "user"]

    for remove_type in priority_order:
        if len(lines) <= max_lines:
            break
        header = f"## "
        type_labels = {"reference": "参考资源", "project": "项目知识", "instinct": "全局 Instinct", "pitfall": "业务防坑", "feedback": "行为反馈", "user": "用户偏好"}
        target_header = f"## 🔗 {type_labels[remove_type]}" if remove_type == "reference" else \
                        f"## 📂 {type_labels[remove_type]}" if remove_type == "project" else \
                        f"## 🧭 {type_labels[remove_type]}" if remove_type == "instinct" else \
                        f"## ⚠️ {type_labels[remove_type]}" if remove_type == "pitfall" else \
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


def _maybe_recover_analysis(base: Path):
    """Crash recovery: if the last session never got a clean Stop (so its
    observations were never analyzed), re-run analysis now. Best-effort and
    never blocks injection. Detected via the .last_analyzed_session marker that
    auto-analyze writes on success."""
    try:
        obs_file = base / "data" / "observations" / "observations.jsonl"
        marker = base / "data" / "observations" / ".last_analyzed_session"
        if not obs_file.exists():
            return

        latest = ""
        session_counts = {}
        with open(obs_file, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    sid = json.loads(line).get("session_id", "")
                except json.JSONDecodeError:
                    continue
                if sid:
                    latest = sid
                    session_counts[sid] = session_counts.get(sid, 0) + 1

        analyzed = marker.read_text(encoding="utf-8").strip() if marker.exists() else ""

        # Latest session differs from the last analyzed one AND has enough
        # observations -> the previous session likely ended without a clean Stop.
        if latest and latest != analyzed and session_counts.get(latest, 0) >= 10:
            subprocess.run(
                ["python3", str(base / "bin" / "auto-analyze-instincts.py"), str(base)],
                timeout=120,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
    except Exception:
        pass


def main():
    if len(sys.argv) < 2:
        print("Usage: inject_memory_context.py <claude_dir>", file=sys.stderr)
        sys.exit(1)

    claude_dir = sys.argv[1]
    base = Path(claude_dir)

    # Crash recovery: re-analyze the previous session if it never got a clean
    # Stop. Runs before injection; best-effort, never blocks.
    _maybe_recover_analysis(base)

    memory_dir = base / "memory"
    raw_dir = base / "memory" / "raw"  # extract_memory.py output (article Image 4)
    rules_file = base / "rules" / "injected-memory.md"

    # Step 1: Load all memory files from both memory/ and memory/raw/
    all_memories = load_memory_files(memory_dir)
    all_memories.extend(load_memory_files(raw_dir))

    # Load team/global instincts (article: Memory 含全局 Instinct). Added before
    # the empty-check so a project with only team rules still injects; their
    # MEMORY_TTL["instinct"]=None keeps ttl_cleanup from ever deleting them.
    team_dir = base / "homunculus" / "instincts" / "team"
    all_memories.extend(load_team_instincts(team_dir))

    if not all_memories:
        if rules_file.exists():
            rules_file.unlink()
        return

    # Step 2: TTL cleanup (remove expired memories) — instinct type is permanent
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

    # Step 5: Select top-K by type priority + relevance.
    # Build a name->memory map (recalled results seed/override relevance scores),
    # then keep all high-value user/feedback memories and cap project/reference by
    # score. This replaces the old "dump all_memories" merge, which made the
    # top-K recall meaningless — it only changed ordering, never selection.
    by_name: dict[str, dict] = {}
    for mem in all_memories:
        name = mem.get("name", "")
        if name:
            by_name[name] = mem
    for r in recalled:
        name = r.get("name", "")
        if name in by_name:
            by_name[name]["score"] = r.get("score", 0)
        elif name:
            by_name[name] = r

    candidates = list(by_name.values())
    for mem in candidates:
        if not isinstance(mem.get("score"), (int, float)):
            mem["score"] = 0.0
        if not mem.get("_type"):
            mem["_type"] = mem.get("type", "project")

    final_memories = select_top_k(candidates)

    # Step 6: Format and write (with 160-line pruning)
    content = format_injected_memory(final_memories)
    write_injected_rules(rules_file, content)


if __name__ == "__main__":
    main()
