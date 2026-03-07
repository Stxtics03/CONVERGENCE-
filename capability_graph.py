from capability_nodes import capability_nodes
from embeddings import embed_text, cosine_similarity

SIMILARITY_THRESHOLD = 0.60

phrase_embeddings = {}

for node, data in capability_nodes.items():

    phrases = data["phrases"]

    phrase_embeddings[node] = [
        (phrase, embed_text(phrase)) for phrase in phrases
    ]


def analyze_prompt(prompt):

    detected = []

    prompt_lower = prompt.lower()
    prompt_vec = embed_text(prompt)

    risk_score = 0

    for node, phrase_vec_pairs in phrase_embeddings.items():

        weight = capability_nodes[node]["weight"]

        keyword_match = False
        best_similarity = 0

        for phrase, phrase_vec in phrase_vec_pairs:

            if phrase in prompt_lower:
                keyword_match = True

            similarity = cosine_similarity(prompt_vec, phrase_vec)

            if similarity > best_similarity:
                best_similarity = similarity

        if keyword_match or best_similarity >= SIMILARITY_THRESHOLD:

            detected.append(node)

            risk_score += weight * best_similarity

    risk_score = min(risk_score, 1.0)

    return {
        "detected_capabilities": detected,
        "risk_score": round(risk_score, 3)
    }