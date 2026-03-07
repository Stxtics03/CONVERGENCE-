"""
Velocity Fingerprinting
"""

from typing import List, Tuple

FAST_PROMPT_THRESHOLD_SECONDS = 8
RAPID_ESCALATION_THRESHOLD = 0.2
HIGH_TURN_COUNT_THRESHOLD = 10
BURST_WINDOW_SECONDS = 60
BURST_COUNT_THRESHOLD = 5

def compute_velocity_score(
    timestamps: List[float],
    risk_scores: List[float],
) -> Tuple[float, List[str]]:
    flags = []
    scores = []

    if len(timestamps) < 2:
        return 0.0, []

    # 1. Inter-prompt delay
    delays = [timestamps[i] - timestamps[i-1] for i in range(1, len(timestamps))]
    avg_delay = sum(delays) / len(delays)
    fast_prompts = sum(1 for d in delays if d < FAST_PROMPT_THRESHOLD_SECONDS)

    if avg_delay < FAST_PROMPT_THRESHOLD_SECONDS:
        flags.append(f"rapid_prompting (avg {avg_delay:.1f}s between prompts)")
        scores.append(0.6)
    elif fast_prompts > len(delays) * 0.5:
        flags.append(f"burst_prompting ({fast_prompts} fast prompts)")
        scores.append(0.4)

    # 2. Risk escalation rate
    if len(risk_scores) >= 2:
        escalations = [
            risk_scores[i] - risk_scores[i-1]
            for i in range(1, len(risk_scores))
        ]
        max_jump = max(escalations) if escalations else 0
        avg_escalation = sum(e for e in escalations if e > 0) / max(1, len(escalations))

        if max_jump >= RAPID_ESCALATION_THRESHOLD:
            flags.append(f"sharp_risk_jump (+{max_jump:.2f} in one turn)")
            scores.append(0.7)
        elif avg_escalation >= 0.1:
            flags.append(f"steady_escalation (avg +{avg_escalation:.2f}/turn)")
            scores.append(0.4)

    # 3. Burst detection
    if len(timestamps) >= BURST_COUNT_THRESHOLD:
        window_start = timestamps[-1] - BURST_WINDOW_SECONDS
        burst_count = sum(1 for t in timestamps if t >= window_start)
        if burst_count >= BURST_COUNT_THRESHOLD:
            flags.append(f"prompt_burst ({burst_count} prompts in last 60s)")
            scores.append(0.8)

    # 4. High turn count
    if len(timestamps) >= HIGH_TURN_COUNT_THRESHOLD:
        flags.append(f"high_turn_session ({len(timestamps)} turns)")
        scores.append(0.3)

    if not scores:
        return 0.0, []

    v_score = min(1.0, max(scores) * 0.7 + (0.1 * len(flags)))
    return round(v_score, 4), flags