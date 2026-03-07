from capability_graph import analyze_prompt

print("\n--- CONVERGENCE Interactive Threat Detection ---\n")
print("Type a prompt and press Enter.")
print("Type 'exit' to stop.\n")

while True:

    prompt = input("PROMPT > ")

    if prompt.lower() == "exit":
        print("\nSession ended.")
        break

    result = analyze_prompt(prompt)

    print("\nDETECTED CAPABILITIES:", result["detected_capabilities"])
    print("RISK SCORE:", result["risk_score"])
    print("----------------------------------\n")