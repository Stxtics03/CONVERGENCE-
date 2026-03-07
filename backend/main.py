from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from models import PromptRequest, RiskResponse
from scoring import process_prompt, get_risk_cluster_embeddings
from capability_graph import precompute_node_embeddings
from session_memory import get_db
from chatbot import generate_chat_response
from db_test import check_mongo_connection
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


# ----------------------------
# Security Analysis Endpoint
# ----------------------------

@app.post("/analyze", response_model=RiskResponse)
async def analyze_prompt(request: PromptRequest):
    try:
        result = await process_prompt(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------
# Chatbot Endpoint
# ----------------------------

@app.post("/chat")
async def chat(request: PromptRequest):
    try:
        response = await generate_chat_response(request.prompt)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------
# Session Info
# ----------------------------

@app.get("/session/{session_id}")
async def get_session_info(session_id: str):

    from session_memory import get_session

    session = get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    turns = session.get("turns", [])

    risk_trajectory = [
        {"turn": i + 1, "risk_score": t["risk_score"], "tier": t["tier"]}
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


# ----------------------------
# API Key Threat Profile
# ----------------------------

@app.get("/profile/{api_key_id}")
async def get_api_key_profile(api_key_id: str):

    from session_memory import get_cross_session_threat

    profile = get_cross_session_threat(api_key_id)

    return {"api_key_id": api_key_id, **profile}


# ----------------------------
# MongoDB Connection Test
# ----------------------------

@app.get("/db-check")
async def db_check():
    return check_mongo_connection()


# ----------------------------
# Audit Logs
# ----------------------------

@app.get("/audit")
async def get_audit_log(limit: int = 50):

    db = get_db()

    entries = list(
        db.audit_log.find({}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )

    return {"entries": entries, "count": len(entries)}


# ----------------------------
# Threat Ledger
# ----------------------------

@app.get("/ledger")
async def get_threat_ledger():

    from threat_ledger import get_ledger_stats

    return get_ledger_stats()


# ----------------------------
# Clear Session
# ----------------------------

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):

    db = get_db()

    db.sessions.delete_one({"session_id": session_id})

    return {"status": "cleared", "session_id": session_id}