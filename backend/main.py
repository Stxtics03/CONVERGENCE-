

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from models import PromptRequest, RiskResponse
from scoring import process_prompt
from capability_graph import precompute_node_embeddings
from scoring import get_risk_cluster_embeddings
from session_memory import get_db
import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[CONVERGENCE] Starting up...")
    precompute_node_embeddings()
    get_risk_cluster_embeddings()
    print("[CONVERGENCE] System ready.")
    yield
    print("[CONVERGENCE] Shutting down.")

app = FastAPI(
    title="CONVERGENCE",
    description="Time Stateful Capability Detection for LLM APIs",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "system": "CONVERGENCE",
        "version": "2.0.0",
        "status": "active",
        "description": "Time Stateful Capability Detection for LLM APIs",
    }

@app.post("/analyze", response_model=RiskResponse)
async def analyze_prompt(request: PromptRequest):
    try:
        result = await process_prompt(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/session/{session_id}")
async def get_session_info(session_id: str):
    from session_memory import get_session
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    turns = session.get("turns", [])
    risk_trajectory = [
        {"turn": i+1, "risk_score": t["risk_score"], "tier": t["tier"]}
        for i, t in enumerate(turns)
    ]
    return {
        "session_id": session_id,
        "api_key_id": session.get("api_key_id"),
        "total_turns": len(turns),
        "risk_trajectory": risk_trajectory,
        "max_risk": max((t["risk_score"] for t in turns), default=0),
        "final_tier": turns[-1]["tier"] if turns else 1,
    }

@app.get("/profile/{api_key_id}")
async def get_api_key_profile(api_key_id: str):
    from session_memory import get_cross_session_threat
    profile = get_cross_session_threat(api_key_id)
    return {"api_key_id": api_key_id, **profile}

@app.get("/audit")
async def get_audit_log(limit: int = 50):
    db = get_db()
    entries = list(
        db.audit_log.find({}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )
    return {"entries": entries, "count": len(entries)}

@app.get("/ledger")
async def get_threat_ledger():
    from threat_ledger import get_ledger_stats
    return get_ledger_stats()

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    db = get_db()
    db.sessions.delete_one({"session_id": session_id})
    return {"status": "cleared", "session_id": session_id}

@app.post("/compare")
async def compare_analysis(request: PromptRequest):
    """
    Side-by-side comparison: LLM-Guard Layer 1 vs CONVERGENCE Layer 2.
    The killer demo endpoint — shows exactly what each layer catches.
    """
    from llm_guard_integration import layer1_scan
    import time

    # Layer 1 — LLM-Guard (fast, single prompt)
    layer1_result = layer1_scan(request.prompt)

    # Layer 2 — full CONVERGENCE pipeline
    embedding = get_embedding(request.prompt)
    cap_result = analyze_capabilities(embedding, request.prompt)
    
    session = get_session(request.session_id) or {"turns": []}
    turns = session.get("turns", [])
    all_embeddings = [t["embedding"] for t in turns] + [embedding]
    all_capabilities = [t.get("triggered_capabilities", []) for t in turns]
    
    c_score = compute_c_score(all_embeddings)
    e_score = cap_result["e_score"]
    v_score = compute_v_score(request.session_id, c_score)
    
    cross = get_cross_session_threat(request.api_key_id)
    modifier = cross.get("modifier", 1.0)
    final_score = min(1.0, (0.5 * c_score + 0.3 * e_score + 0.2 * v_score) * modifier)
    
    tier = 1
    if final_score >= 0.9:
        tier = 3
    elif final_score >= 0.7:
        tier = 2
    elif final_score >= 0.5:
        tier = 2

    tier_labels = {1: "Clean", 2: "Suspicious", 3: "THREAT"}

    # Build conclusion
    l1_blocked = layer1_result["blocked"]
    l2_blocked = tier >= 2

    if not l1_blocked and l2_blocked:
        conclusion = "LLM-Guard missed this — CONVERGENCE caught it via multi-turn analysis"
    elif l1_blocked and l2_blocked:
        conclusion = "Both layers agree — clear threat detected"
    elif l1_blocked and not l2_blocked:
        conclusion = "LLM-Guard flagged this but CONVERGENCE sees low multi-turn risk"
    else:
        conclusion = "Clean prompt — both layers passed"

    return {
        "prompt": request.prompt,
        "session_id": request.session_id,
        "layer1_llm_guard": {
            "blocked": l1_blocked,
            "reason": layer1_result["reason"],
            "message": layer1_result["message"],
            "verdict": "BLOCKED 🚨" if l1_blocked else "PASSED ✅"
        },
        "layer2_convergence": {
            "c_score": round(c_score, 3),
            "e_score": round(e_score, 3),
            "v_score": round(v_score, 3),
            "final_risk_score": round(final_score, 3),
            "tier": tier,
            "tier_label": tier_labels[tier],
            "triggered_capabilities": cap_result["triggered_capabilities"],
            "cross_session_modifier": modifier,
            "verdict": "BLOCKED 🚨" if l2_blocked else "PASSED ✅"
        },
        "conclusion": conclusion
    }
