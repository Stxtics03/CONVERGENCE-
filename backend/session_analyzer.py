from capability_graph import analyze_prompt


class SessionAnalyzer:

    def __init__(self):
        self.history = []
        self.capability_counts = {}

    def process_prompt(self, prompt):

        result = analyze_prompt(prompt)

        capabilities = result["detected_capabilities"]
        risk = result["risk_score"]

        self.history.append(prompt)

        for cap in capabilities:
            self.capability_counts[cap] = self.capability_counts.get(cap, 0) + 1

        assembly_score = sum(self.capability_counts.values()) * 0.05

        final_risk = min(risk + assembly_score, 1.0)

        return {
            "prompt": prompt,
            "capabilities": capabilities,
            "base_risk": risk,
            "assembly_score": round(assembly_score, 3),
            "final_risk": round(final_risk, 3)
        }