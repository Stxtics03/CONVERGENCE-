"""
Coherence Gap Score
--------------------
Measures semantic consistency between consecutive prompts.

Legitimate users stay on topic — their prompts are semantically related.
Attackers jump topics to avoid detection — each prompt looks innocent
but there's no logical flow between them.

Low coherence across a session = suspicious topic jumping = higher risk.

Examples:
  Legitimate: "write email" → "make it formal" → "add signature"
  coherence = 0.8 (high, same topic) → coherence_gap = 0.2 (low, good)

  Attacker: "write email" → "how do banks verify identity" → "automate password reset"
  coherence = 0.1 (low, jumping topics) → coherence_gap = 0.9 (high, suspicious)
"""

from embeddings import cosine_similarity
from typing import List

COHERENCE_WINDOW = 5        # look at last 5 turns
MIN_TURNS_REQUIRED = 2      # need at least 2 turns to measure coherence
JUMP_THRESHOLD = 0.25       # similarity below this = suspicious topic jump


def compute_coherence_gap(session_embeddings: List[list], current_embedding: list) -> tuple:
    """
    Compute coherence gap score for current prompt given session history.
    
    Returns:
        coherence_gap_score: 0.0 (coherent) to 1.0 (incoherent/suspicious)
        coherence_flags: list of detected issues
    """
    coherence_flags = []
    
    all_embeddings = session_embeddings + [current_embedding]
    
    # Not enough turns yet to measure coherence
    if len(all_embeddings) < MIN_TURNS_REQUIRED:
        return 0.0, coherence_flags
    
    # Look at recent window only
    window = all_embeddings[-COHERENCE_WINDOW:]
    
    # Compute similarity between each consecutive pair
    consecutive_similarities = []
    for i in range(1, len(window)):
        sim = cosine_similarity(window[i], window[i-1])
        consecutive_similarities.append(sim)
    
    if not consecutive_similarities:
        return 0.0, coherence_flags
    
    avg_coherence = sum(consecutive_similarities) / len(consecutive_similarities)
    
    # Detect sudden topic jumps
    sudden_jumps = [s for s in consecutive_similarities if s < JUMP_THRESHOLD]
    jump_count = len(sudden_jumps)
    
    if jump_count >= 2:
        coherence_flags.append(f"multiple_topic_jumps:{jump_count}")
    
    # Detect current prompt is completely off topic from session
    if len(session_embeddings) >= 2:
        session_avg = [
            sum(session_embeddings[-3:][j][i] for j in range(min(3, len(session_embeddings))))
            / min(3, len(session_embeddings))
            for i in range(len(current_embedding))
        ]
        current_vs_session = cosine_similarity(current_embedding, session_avg)
        if current_vs_session < JUMP_THRESHOLD:
            coherence_flags.append("current_prompt_off_topic")
    
    # Detect zigzag pattern (attacker alternating between innocent and suspicious)
    if len(consecutive_similarities) >= 4:
        zigzag = 0
        for i in range(1, len(consecutive_similarities)):
            if abs(consecutive_similarities[i] - consecutive_similarities[i-1]) > 0.3:
                zigzag += 1
        if zigzag >= 2:
            coherence_flags.append(f"zigzag_pattern_detected")
    
    # Coherence gap = inverse of average coherence
    # Low coherence = high gap = suspicious
    coherence_gap = max(0.0, min(1.0, 1.0 - avg_coherence))
    
    # Boost score if flags detected
    if "multiple_topic_jumps" in str(coherence_flags):
        coherence_gap = min(1.0, coherence_gap + 0.15)
    if "current_prompt_off_topic" in str(coherence_flags):
        coherence_gap = min(1.0, coherence_gap + 0.10)
    if "zigzag_pattern_detected" in str(coherence_flags):
        coherence_gap = min(1.0, coherence_gap + 0.10)
    
    return round(coherence_gap, 4), coherence_flags