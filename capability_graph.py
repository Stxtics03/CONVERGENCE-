from capability_nodes import capability_nodes
from embeddings import embed_text, cosine_similarity

SIMILARITY_THRESHOLD = 0.60

# Precompute phrase embeddings once at startup
phrase_embeddings = {}

for node, phrases in capability_nodes.items():
    phrase_embeddings[node] = [(phrase, embed_text(phrase)) for phrase in phrases]


def analyze_prompt(prompt: str):

    detected = []
    prompt_lower = prompt.lower()
    prompt_vec = embed_text(prompt)

    for node, phrase_vec_pairs in phrase_embeddings.items():

        keyword_match = False
        best_similarity = 0

        for phrase, phrase_vec in phrase_vec_pairs:

            if phrase in prompt_lower:
                keyword_match = True

            score = cosine_similarity(prompt_vec, phrase_vec)

            if score > best_similarity:
                best_similarity = score

        if keyword_match or best_similarity >= SIMILARITY_THRESHOLD:
            detected.append(node)

    risk_score = min(len(detected) * 0.15, 1.0)

    return {
        "detected_capabilities": detected,
        "risk_score": risk_score
    }