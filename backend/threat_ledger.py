"""
CONVERGENCE — Decentralized Threat Intelligence Layer (Mock)
-------------------------------------------------------------
Simulates a blockchain-based shared threat ledger.

In production (Phase 2), this would publish to an actual chain
(Ethereum/Polygon via Web3.py). For now, MongoDB mimics the
append-only, tamper-evident behavior of a blockchain:
  - Entries are never updated or deleted (append-only)
  - Each entry is chained to the previous via hash linkage
  - Threat fingerprints are anonymized before publishing
  - Any CONVERGENCE node can query and contribute

WHY THIS MATTERS:
  An attacker flagged on Platform A can't escape by switching to Platform B.
  Their behavioral fingerprint travels with them across the network.
"""

import hashlib
import json
import time
from typing import Optional, Dict, Any, List
from session_memory import get_db

LEDGER_COLLECTION = "threat_ledger"
FINGERPRINT_SALT = "convergence_v2_salt"  # rotate this in production

# --- Fingerprinting ---

def build_threat_fingerprint(
    triggered_capabilities: List[str],
    velocity_flags: List[str],
    c_score: float,
    e_score: float,
) -> str:
    """
    Build an anonymized behavioral fingerprint from threat signals.
    
    Critically — this does NOT include the raw prompt, API key, or any PII.
    It captures the SHAPE of the attack, not the identity of the attacker.
    This is what gets published to the shared ledger.
    """
    # Normalize and sort so fingerprint is consistent regardless of order
    caps_normalized = sorted([c.lower().strip() for c in triggered_capabilities])
    vel_normalized = sorted([v.split("(")[0].strip() for v in velocity_flags])  # strip dynamic values

    # Bucket scores to reduce fingerprint sensitivity to minor variations
    c_bucket = round(c_score * 10) / 10   # 0.1 resolution
    e_bucket = round(e_score * 10) / 10

    fingerprint_data = {
        "capabilities": caps_normalized,
        "velocity_pattern": vel_normalized,
        "c_bucket": c_bucket,
        "e_bucket": e_bucket,
        "salt": FINGERPRINT_SALT,
    }

    raw = json.dumps(fingerprint_data, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()

# --- Ledger Operations ---

def _get_last_block_hash() -> str:
    """Get the hash of the most recent ledger entry (for chaining)."""
    db = get_db()
    last = db[LEDGER_COLLECTION].find_one(
        {}, {"block_hash": 1}, sort=[("block_number", -1)]
    )
    return last["block_hash"] if last else "0" * 64  # genesis block

def _compute_block_hash(block_number: int, prev_hash: str, threat_hash: str, timestamp: float) -> str:
    """Compute a deterministic hash for this block — chains it to previous."""
    raw = f"{block_number}{prev_hash}{threat_hash}{timestamp}"
    return hashlib.sha256(raw.encode()).hexdigest()

def _get_next_block_number() -> int:
    db = get_db()
    count = db[LEDGER_COLLECTION].count_documents({})
    return count + 1

def publish_threat(
    threat_fingerprint: str,
    tier: int,
    capability_groups: List[str],
    source_platform: str = "convergence_node_local",
) -> Dict[str, Any]:
    """
    Publish a Tier-3 threat fingerprint to the shared ledger.
    Append-only — this entry can never be modified or deleted.
    
    In Phase 2: replace db insert with Web3 smart contract call.
    """
    db = get_db()
    timestamp = time.time()
    block_number = _get_next_block_number()
    prev_hash = _get_last_block_hash()
    block_hash = _compute_block_hash(block_number, prev_hash, threat_fingerprint, timestamp)

    block = {
        "block_number": block_number,
        "block_hash": block_hash,
        "prev_hash": prev_hash,
        "threat_fingerprint": threat_fingerprint,
        "tier": tier,
        "capability_groups": capability_groups,
        "source_platform": source_platform,
        "timestamp": timestamp,
        "confirmed": True,   # in real chain: wait for block confirmation
    }

    db[LEDGER_COLLECTION].insert_one(block)
    print(f"[LEDGER] Block #{block_number} published | fingerprint: {threat_fingerprint[:16]}...")
    return {k: v for k, v in block.items() if k != "_id"}

def query_threat_fingerprint(threat_fingerprint: str) -> Optional[Dict[str, Any]]:
    """
    Query the ledger for a known threat fingerprint.
    Returns the original block if found, else None.
    """
    db = get_db()
    result = db[LEDGER_COLLECTION].find_one(
        {"threat_fingerprint": threat_fingerprint},
        {"_id": 0}
    )
    return result

def get_ledger_stats() -> Dict[str, Any]:
    """Overview of the threat ledger — useful for the dashboard."""
    db = get_db()
    total = db[LEDGER_COLLECTION].count_documents({})
    recent = list(
        db[LEDGER_COLLECTION]
        .find({}, {"_id": 0, "block_number": 1, "threat_fingerprint": 1,
                   "capability_groups": 1, "timestamp": 1, "block_hash": 1})
        .sort("block_number", -1)
        .limit(10)
    )
    return {
        "total_threats_logged": total,
        "recent_blocks": recent,
        "ledger_status": "active",
        "consensus": "mock_local",   # Phase 2: "ethereum_polygon"
    }

# --- Integration with Scoring Engine ---

def check_and_publish(
    triggered_capabilities: List[str],
    velocity_flags: List[str],
    capability_groups: List[str],
    c_score: float,
    e_score: float,
    tier: int,
) -> Dict[str, Any]:
    """
    Called by scoring engine after every analysis.
    - If Tier 3: build fingerprint and publish to ledger
    - Always: check if current fingerprint matches a known threat
    
    Returns threat intel result to be included in risk response.
    """
    fingerprint = build_threat_fingerprint(
        triggered_capabilities, velocity_flags, c_score, e_score
    )

    # Check if this fingerprint already exists on the ledger
    existing = query_threat_fingerprint(fingerprint)
    known_threat = existing is not None

    published_block = None
    if tier == 3:
        # Publish to ledger — attacker's pattern is now globally flagged
        published_block = publish_threat(
            threat_fingerprint=fingerprint,
            tier=tier,
            capability_groups=capability_groups,
        )

    return {
        "fingerprint": fingerprint[:16] + "...",  # truncated for display
        "known_threat": known_threat,
        "published_to_ledger": published_block is not None,
        "block_number": published_block["block_number"] if published_block else None,
        "intel_note": (
            "⚠️ Known threat pattern — matched existing ledger entry"
            if known_threat else
            "✅ New pattern — not previously seen"
        ) if not published_block else (
            f"🚨 Published to threat ledger (Block #{published_block['block_number']})"
        ),
    }