from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PromptRequest(BaseModel):
    session_id: str
    api_key_id: str          # for cross-session memory (hashed identifier)
    prompt: str
    timestamp: Optional[float] = None  # unix timestamp, auto-filled if not provided

class CapabilityNode(BaseModel):
    name: str
    score: float
    triggered: bool

class RiskResponse(BaseModel):
    session_id: str
    api_key_id: str
    prompt: str
    c_score: float           # convergence score
    e_score: float           # capability/escalation score
    v_score: float           # velocity score
    final_risk_score: float
    tier: int                # 1=Clean, 2=Adaptive, 3=Mitigate
    tier_label: str
    defense_action: str
    triggered_capabilities: List[str]
    velocity_flags: List[str]
    cross_session_threat: bool
    cross_session_note: str
    allow_response: bool
    
class SessionPrompt(BaseModel):
    prompt: str
    embedding: List[float]
    risk_score: float
    timestamp: float
    tier: int