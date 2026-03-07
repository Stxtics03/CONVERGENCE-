def decide_action(final_risk: float):

    if final_risk < 0.7:
        return {
            "tier": 1,
            "action": "PASS",
            "description": "Prompt allowed normally"
        }

    elif final_risk < 0.9:
        return {
            "tier": 2,
            "action": "ADAPT",
            "description": "Reduce detail in LLM response"
        }

    else:
        return {
            "tier": 3,
            "action": "MITIGATE",
            "description": "Block prompt and log threat"
        }