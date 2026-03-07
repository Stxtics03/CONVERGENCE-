from sentence_transformers import SentenceTransformer
import numpy as np

# Load a lightweight semantic model
model = SentenceTransformer("all-MiniLM-L6-v2")


def embed_text(text: str):
    """
    Convert a sentence into a vector representation
    """
    return model.encode(text)


def cosine_similarity(vec1, vec2):
    """
    Measure similarity between two vectors
    """
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))