from capability_nodes import capability_nodes
from embeddings import embed_text, cosine_similarity

SIMILARITY_THRESHOLD = 0.60

# Precompute embeddings for all phrases once
phrase_embeddings = {}

for node, phrases in capability_nodes.items():
    phrase_embeddings[node] = [(phrase, embed_text(phrase)) for phrase in phrases]


def analyze_prompt(prompt: str):

    detected = []
    prompt_lower = prompt.lower()
    prompt_vec = embed_text(prompt)

    total_similarity = 0
    match_count = 0

    for node, phrase_vec_pairs in phrase_embeddings.items():

        keyword_match = False
        best_similarity = 0

        for phrase, phrase_vec in phrase_vec_pairs:

            # Exact keyword check
            if phrase in prompt_lower:
                keyword_match = True

            # Semantic similarity check
            similarity_score = cosine_similarity(prompt_vec, phrase_vec)

            if similarity_score > best_similarity:
                best_similarity = similarity_score

        if keyword_match or best_similarity >= SIMILARITY_THRESHOLD:
            detected.append(node)
            total_similarity += best_similarity
            match_count += 1

    if match_count > 0:
        risk_score = min(total_similarity / match_count, 1.0)
    else:
        risk_score = 0.0

    return {
        "detected_capabilities": detected,
        "risk_score": round(risk_score, 3)
    }