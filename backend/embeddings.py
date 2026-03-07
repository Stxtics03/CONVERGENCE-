
from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np

_model = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print("[CONVERGENCE] Loading embedding model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[CONVERGENCE] Model loaded.")
    return _model

def generate_embedding(text: str) -> List[float]:
    model = get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    a = np.array(vec_a)
    b = np.array(vec_b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))