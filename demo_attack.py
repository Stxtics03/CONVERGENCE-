from session_analyzer import SessionAnalyzer
from decision_engine import decide_action

analyzer = SessionAnalyzer()

print("\n--- CONVERGENCE Interactive Session ---\n")
print("Type prompts. Type 'exit' to stop.\n")

while True:

    prompt = input("PROMPT > ")

    if prompt.lower() == "exit":
        break

    result = analyzer.process_prompt(prompt)

    decision = decide_action(result["final_risk"])

    print("\nCapabilities:", result["capabilities"])
    print("Base Risk:", result["base_risk"])
    print("Assembly Score:", result["assembly_score"])
    print("Final Risk:", result["final_risk"])

    print("\nTIER:", decision["tier"])
    print("ACTION:", decision["action"])
    print("DETAIL:", decision["description"])

    print("----------------------------------\n")