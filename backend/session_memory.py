"""
Cross-Session Memory (MongoDB Atlas)
CONVERGENCE Threat Persistence Layer
"""

from pymongo import MongoClient
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from collections import Counter
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "convergence")

_client: Optional[MongoClient] = None


# ------------------------------------------------
# MongoDB Connection
# ------------------------------------------------

def get_db():
    """
    Returns MongoDB database instance.
    Creates a singleton Mongo client.
    """

    global _client

    if _client is None:

        try:
            _client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=5000,
                maxPoolSize=50,
            )

            # Test connection
            _client.server_info()

            print("[CONVERGENCE] Connected to MongoDB")

        except Exception as e:

            raise RuntimeError(
                f"[CONVERGENCE] MongoDB connection failed: {e}"
            )

    return _client[DB_NAME]


# ------------------------------------------------
# Session Storage
# ------------------------------------------------

def save_session_turn(
    session_id,
    api_key_id,
    prompt,
    embedding,
    risk_score,
    tier,
    triggered_capabilities,
    timestamp,
):

    db = get_db()

    db.sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "api_key_id": api_key_id,
                "last_updated": timestamp,
            },
            "$push": {
                "turns": {
                    "prompt": prompt,
                    "embedding": embedding,
                    "risk_score": risk_score,
                    "tier": tier,
                    "triggered_capabilities": triggered_capabilities,
                    "timestamp": timestamp,
                }
            },
            "$setOnInsert": {
                "created_at": timestamp
            },
        },
        upsert=True,
    )


def get_session(session_id: str) -> Optional[Dict[str, Any]]:

    db = get_db()

    return db.sessions.find_one(
        {"session_id": session_id},
        {"_id": 0},
    )


# ------------------------------------------------
# API Key Threat Profile
# ------------------------------------------------

def update_api_key_profile(
    api_key_id,
    risk_score,
    triggered_capabilities,
    tier,
    timestamp,
):

    db = get_db()

    db.api_key_profiles.update_one(
        {"api_key_id": api_key_id},
        {
            "$setOnInsert": {
                "created_at": timestamp,
                "tier_counts": {
                    "tier_1": 0,
                    "tier_2": 0,
                    "tier_3": 0,
                },
                "total_turns": 0,
                "risk_history": [],
                "capability_history": [],
            }
        },
        upsert=True,
    )

    db.api_key_profiles.update_one(
        {"api_key_id": api_key_id},
        {
            "$set": {
                "last_seen": timestamp
            },
            "$inc": {
                "total_turns": 1,
                f"tier_counts.tier_{tier}": 1,
            },
            "$push": {
                "risk_history": {
                    "$each": [
                        {
                            "score": risk_score,
                            "timestamp": timestamp,
                        }
                    ],
                    "$slice": -100,
                },
                "capability_history": {
                    "$each": triggered_capabilities or [],
                    "$slice": -200,
                },
            },
        },
    )


# ------------------------------------------------
# Cross-Session Threat Detection
# ------------------------------------------------

def get_cross_session_threat(api_key_id: str) -> Dict[str, Any]:

    db = get_db()

    profile = db.api_key_profiles.find_one(
        {"api_key_id": api_key_id},
        {"_id": 0},
    )

    if not profile:

        return {
            "is_threat": False,
            "note": "No prior history",
            "modifier": 1.0,
        }

    risk_history = profile.get("risk_history", [])
    tier_counts = profile.get("tier_counts", {})
    capability_history = profile.get("capability_history", [])

    recent_scores = [r["score"] for r in risk_history[-20:]]

    avg_recent_risk = (
        sum(recent_scores) / len(recent_scores)
        if recent_scores
        else 0
    )

    tier3_count = tier_counts.get("tier_3", 0)

    cap_counter = Counter(capability_history[-50:])

    repeat_caps = [
        cap for cap, count in cap_counter.items()
        if count >= 3
    ]

    is_threat = False
    note = "Clean history"
    modifier = 1.0

    if tier3_count >= 3:

        is_threat = True
        note = f"Repeat Tier-3 offender ({tier3_count})"
        modifier = 1.3

    elif avg_recent_risk >= 0.7:

        is_threat = True
        note = f"High risk history (avg {avg_recent_risk:.2f})"
        modifier = 1.2

    elif repeat_caps:

        is_threat = True
        note = f"Recurring capability assembly: {', '.join(repeat_caps)}"
        modifier = 1.15

    return {
        "is_threat": is_threat,
        "note": note,
        "modifier": modifier,
        "avg_recent_risk": avg_recent_risk,
        "tier3_count": tier3_count,
        "repeat_capabilities": repeat_caps,
    }


# ------------------------------------------------
# Audit Logging
# ------------------------------------------------

def log_audit_event(
    session_id,
    api_key_id,
    prompt,
    final_risk_score,
    tier,
    defense_action,
    timestamp,
):

    db = get_db()

    db.audit_log.insert_one(
        {
            "session_id": session_id,
            "api_key_id": api_key_id,
            "prompt_preview": (
                prompt[:100] + "..."
                if len(prompt) > 100
                else prompt
            ),
            "final_risk_score": final_risk_score,
            "tier": tier,
            "defense_action": defense_action,
            "timestamp": timestamp,
        }
    )