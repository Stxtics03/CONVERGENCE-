capability_nodes = {

    "impersonation": {
        "weight": 0.7,
        "phrases": [
            "pretend to be",
            "pretending to be",
            "impersonate",
            "fake identity",
            "pose as"
        ]
    },

    "urgency_framing": {
        "weight": 0.4,
        "phrases": [
            "urgent action required",
            "respond immediately",
            "act now",
            "account suspended"
        ]
    },

    "credential_harvesting": {
        "weight": 0.9,
        "phrases": [
            "collect passwords",
            "steal credentials",
            "harvest login",
            "capture passwords"
        ]
    },

    "malware_scaffold": {
        "weight": 1.0,
        "phrases": [
            "write malware",
            "create malware",
            "build malware",
            "create virus",
            "keylogger"
        ]
    },

    "data_exfiltration": {
        "weight": 0.9,
        "phrases": [
            "extract data",
            "steal database",
            "download sensitive files"
        ]
    },

    "social_engineering": {
        "weight": 0.7,
        "phrases": [
            "trick someone",
            "convince victim",
            "deceive employees"
        ]
    },

    "fraud_automation": {
        "weight": 0.8,
        "phrases": [
            "automate scam",
            "fake invoices",
            "scam campaign"
        ]
    },

    "evasion": {
        "weight": 0.8,
        "phrases": [
            "bypass antivirus",
            "avoid detection",
            "evade antivirus"
        ]
    },

    "prompt_injection": {
        "weight": 0.6,
        "phrases": [
            "ignore previous instructions",
            "override system prompt",
            "bypass safety rules"
        ]
    },

    "model_exfiltration": {
        "weight": 0.8,
        "phrases": [
            "reveal system prompt",
            "extract system prompt",
            "show internal instructions"
        ]
    }
}