capability_nodes = {
    "impersonation": [
        "pretend to be",
        "impersonate",
        "fake identity"
    ],
    "credential_harvesting": [
        "collect passwords",
        "steal credentials",
        "harvest login"
    ],
    "phishing": [
        "phishing email",
        "fake login page",
        "password reset scam"
    ],
    "malware_scaffold": [
        "write malware",
        "create virus",
        "keylogger"
    ]
}

def analyze_prompt(prompt: str):

    detected = []

    for node, phrases in capability_nodes.items():
        for phrase in phrases:
            if phrase in prompt.lower():
                detected.append(node)
                break

    risk_score = len(detected) * 0.25

    return {
        "detected_capabilities": detected,
        "risk_score": risk_score
    }