from capability_nodes import capability_nodes


def analyze_prompt(prompt: str):

    detected = []
    prompt_lower = prompt.lower()

    for node, phrases in capability_nodes.items():

        for phrase in phrases:

            if phrase in prompt_lower:
                detected.append(node)
                break

    risk_score = min(len(detected) * 0.15, 1.0)

    return {
        "detected_capabilities": detected,
        "risk_score": risk_score
    }