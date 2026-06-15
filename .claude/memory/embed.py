#!/usr/bin/env python3
"""
embed.py - Embedding Utilities via Ollama

Uses local Ollama API with nomic-embed-text model for text vectorization.
API endpoint: http://localhost:11434/api/embed
"""

import json
import requests
from typing import Optional

OLLAMA_BASE = "http://localhost:11434"
DEFAULT_MODEL = "nomic-embed-text"
TIMEOUT = 30


def embed_text(text: str, model: str = DEFAULT_MODEL) -> Optional[list[float]]:
    """Generate embedding vector for a text string via Ollama.

    Args:
        text: Input text to embed
        model: Ollama model name (default: nomic-embed-text)

    Returns:
        Embedding vector (768-dim for nomic-embed-text), or None on failure
    """
    if not text or not text.strip():
        return None

    try:
        response = requests.post(
            f"{OLLAMA_BASE}/api/embed",
            json={"model": model, "input": text},
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

        # Ollama returns embeddings in "embeddings" field
        embeddings = data.get("embeddings", [])
        if embeddings and isinstance(embeddings[0], list):
            return embeddings[0]
        # Fallback: some versions use "embedding" (singular)
        embedding = data.get("embedding", [])
        if embedding:
            return embedding
        return None
    except requests.exceptions.ConnectionError:
        # Ollama not running — return None gracefully
        return None
    except Exception:
        return None


def embed_texts(texts: list[str], model: str = DEFAULT_MODEL) -> list[Optional[list[float]]]:
    """Generate embeddings for multiple texts via Ollama (batch).

    Returns:
        List of embedding vectors (or None for failed items)
    """
    if not texts:
        return []

    try:
        response = requests.post(
            f"{OLLAMA_BASE}/api/embed",
            json={"model": model, "input": texts},
            timeout=TIMEOUT * len(texts),
        )
        response.raise_for_status()
        data = response.json()

        embeddings = data.get("embeddings", [])
        if embeddings:
            return embeddings

        # Fallback: embed one by one
        return [embed_text(t, model) for t in texts]
    except Exception:
        return [embed_text(t, model) for t in texts]


def check_ollama_available() -> bool:
    """Check if Ollama is running and the embedding model is available."""
    try:
        response = requests.get(f"{OLLAMA_BASE}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            return any(DEFAULT_MODEL in name for name in model_names)
        return False
    except Exception:
        return False
