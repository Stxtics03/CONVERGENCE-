"""
LLM-Guard Layer 1 Pre-Filter
-----------------------------
Fast single-prompt scanner that runs BEFORE CONVERGENCE.
Catches obvious threats instantly.
If blocked here → skip CONVERGENCE entirely.
If passed → run full C+E+V analysis.

Defense stack:
Layer 1: LLM-Guard  (fast, single-prompt, no memory)
Layer 2: CONVERGENCE (deep, multi-turn, stateful)
"""

from typing import Dict, Any

_scanners_loaded = False
_injection_scanner = None
_toxicity_scanner = None

def _load_scanners():
    global _scanners_loaded, _injection_scanner, _toxicity_scanner
    if not _scanners_loaded:
        print("[LLM-GUARD] Loading scanners...")
        from llm_guard.input_scanners import PromptInjection, Toxicity
        from llm_guard.input_scanners.prompt_injection import MatchType
        _injection_scanner = PromptInjection(threshold=0.75, match_type=MatchType.FULL)
        _toxicity_scanner = Toxicity(threshold=0.75)
        _scanners_loaded = True
        print("[LLM-GUARD] Scanners ready.")

def layer1_scan(prompt: str) -> Dict[str, Any]:
    """
    Run LLM-Guard Layer 1 scan.
    Returns blocked=True if obvious threat detected.
    Returns blocked=False if clean — proceed to CONVERGENCE.
    """
    try:
        _load_scanners()

        # Check prompt injection
        sanitized, is_valid, risk_score = _injection_scanner.scan(prompt, prompt)
        if not is_valid:
            return {
                "blocked": True,
                "reason": "prompt_injection_detected",
                "risk_score": float(risk_score),
                "layer": 1,
                "message": "Blocked by Layer 1 — direct prompt injection detected"
            }

        # Check toxicity
        sanitized, is_valid, risk_score = _toxicity_scanner.scan(prompt, prompt)
        if not is_valid:
            return {
                "blocked": True,
                "reason": "toxic_content_detected",
                "risk_score": float(risk_score),
                "layer": 1,
                "message": "Blocked by Layer 1 — toxic content detected"
            }

        return {
            "blocked": False,
            "reason": "passed_layer1",
            "risk_score": 0.0,
            "layer": 1,
            "message": "Passed Layer 1 — proceeding to CONVERGENCE analysis"
        }

    except Exception as e:
        # If LLM-Guard fails for any reason, don't block — fall through to CONVERGENCE
        print(f"[LLM-GUARD] Scanner error: {e} — falling through to CONVERGENCE")
        return {
            "blocked": False,
            "reason": "scanner_error",
            "risk_score": 0.0,
            "layer": 1,
            "message": f"Layer 1 unavailable: {str(e)}"
        }