#!/usr/bin/env python3
"""
vector_store.py - Qdrant Local Vector Store for Memory System

Uses qdrant-client in local/file mode (no Docker needed).
Provides upsert and similarity search for memory embeddings.

Storage path: <claude_dir>/data/qdrant/
Collection: "memories"
"""

import json
import hashlib
from pathlib import Path
from typing import Optional

# Lazy imports — these are optional dependencies
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        Distance, VectorParams, PointStruct,
        Filter, FieldCondition, MatchValue,
    )
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

COLLECTION_NAME = "memories"
VECTOR_SIZE = 768  # nomic-embed-text dimension


def _memory_hash(name: str) -> int:
    """Generate a deterministic integer ID from memory name."""
    digest = hashlib.md5(name.encode()).hexdigest()
    return int(digest[:16], 16)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors (numpy or pure-python fallback)."""
    if NUMPY_AVAILABLE:
        a_np = np.array(a)
        b_np = np.array(b)
        dot = float(np.dot(a_np, b_np))
        norm_a = float(np.linalg.norm(a_np))
        norm_b = float(np.linalg.norm(b_np))
    else:
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class MemoryVectorStore:
    """Local vector store for memories using Qdrant (file-based) or numpy fallback."""

    def __init__(self, claude_dir: str):
        self.claude_dir = Path(claude_dir)
        self.storage_path = self.claude_dir / "data" / "qdrant"
        self.storage_path.mkdir(parents=True, exist_ok=True)

        if QDRANT_AVAILABLE:
            self.client = QdrantClient(path=str(self.storage_path))
            self._ensure_collection()
            self.mode = "qdrant"
        else:
            # Fallback: numpy-based flat search
            self.index_file = self.storage_path / "vector_index.json"
            self.mode = "numpy"

    def _ensure_collection(self):
        """Create the memories collection if it doesn't exist."""
        if not QDRANT_AVAILABLE:
            return
        try:
            self.client.get_collection(COLLECTION_NAME)
        except Exception:
            self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=VECTOR_SIZE,
                    distance=Distance.COSINE,
                ),
            )

    def upsert_memory(self, name: str, vector: list[float],
                      memory_type: str, file_path: str, description: str = ""):
        """Insert or update a memory's embedding in the vector store."""
        point_id = _memory_hash(name)
        payload = {
            "name": name,
            "type": memory_type,
            "path": file_path,
            "description": description[:200],
        }

        if self.mode == "qdrant":
            self.client.upsert(
                collection_name=COLLECTION_NAME,
                points=[PointStruct(id=point_id, vector=vector, payload=payload)],
            )
        else:
            # Numpy fallback: store to JSON index
            self._numpy_upsert(point_id, vector, payload)

    def recall_memories(self, query_vector: list[float], top_k: int = 5,
                        memory_type: Optional[str] = None) -> list[dict]:
        """Search for similar memories using cosine similarity."""
        if self.mode == "qdrant":
            query_filter = None
            if memory_type:
                query_filter = Filter(
                    must=[FieldCondition(key="type", match=MatchValue(value=memory_type))]
                )
            results = self.client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=top_k,
                query_filter=query_filter,
            )
            return [{"score": r.score, **r.payload} for r in results]
        else:
            return self._numpy_recall(query_vector, top_k, memory_type)

    def delete_memory(self, name: str):
        """Remove a memory from the vector store."""
        point_id = _memory_hash(name)
        if self.mode == "qdrant":
            from qdrant_client.models import PointIdsList
            self.client.delete(
                collection_name=COLLECTION_NAME,
                points_selector=PointIdsList(points=[point_id]),
            )
        else:
            self._numpy_delete(point_id)

    # --- Numpy fallback methods ---

    def _load_index(self) -> dict:
        """Load the numpy fallback index from disk."""
        if self.index_file.exists():
            try:
                data = json.loads(self.index_file.read_text(encoding="utf-8"))
                return data
            except Exception:
                return {}
        return {}

    def _save_index(self, index: dict):
        """Save the numpy fallback index to disk."""
        self.index_file.write_text(
            json.dumps(index, ensure_ascii=False),
            encoding="utf-8",
        )

    def _numpy_upsert(self, point_id: int, vector: list[float], payload: dict):
        """Upsert into the JSON-based fallback index."""
        index = self._load_index()
        index[str(point_id)] = {
            "vector": vector,
            "payload": payload,
        }
        self._save_index(index)

    def _numpy_recall(self, query_vector: list[float], top_k: int,
                      memory_type: Optional[str] = None) -> list[dict]:
        """Flat cosine similarity search over the JSON index."""
        index = self._load_index()
        scores = []

        for point_id, entry in index.items():
            payload = entry.get("payload", {})
            if memory_type and payload.get("type") != memory_type:
                continue
            vector = entry.get("vector", [])
            if not vector:
                continue
            sim = _cosine_similarity(query_vector, vector)
            scores.append((sim, payload))

        scores.sort(key=lambda x: -x[0])
        return [{"score": s, **p} for s, p in scores[:top_k]]

    def _numpy_delete(self, point_id: int):
        """Delete from the JSON-based fallback index."""
        index = self._load_index()
        index.pop(str(point_id), None)
        self._save_index(index)
