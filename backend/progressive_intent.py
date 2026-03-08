from typing import List

ESCALATION_SEQUENCE = [
    "impersonation",
    "urgency_framing",
    "credential_harvesting",
    "fraud_automation",
]

ESCALATION_SCORES = {
    1: 0.10,
    2: 0.25,
    3: 0.45,
    4: 0.65,
}

def compute_progressive_intent(session_nodes: List[List[str]]) -> float:
    """
    Detect sequential escalation across conversation turns.
    """

    stage = 0

    for turn in session_nodes:
        if stage < len(ESCALATION_SEQUENCE) and ESCALATION_SEQUENCE[stage] in turn:
            stage += 1

    return ESCALATION_SCORES.get(stage, 0.0)