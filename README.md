# CONVERGENCE

> **Real-time AI threat detection engine — scoring, blocking, and logging adversarial prompt sequences before they cause harm.**

---

## What Is CONVERGENCE?

CONVERGENCE is a backend threat detection system that sits between a user and an AI model. Every prompt is scored in real time using three independent signals — semantic drift, capability assembly, and velocity — and a defense action is applied before the response is served.

It doesn't just look at one message. It watches how prompts **converge** across a session toward dangerous capability combinations, catching multi-turn attacks that single-turn filters miss.

---

## How It Works

### The Scoring Formula

```
Final Risk Score = (C × 0.35) + (E × 0.45) + (V × 0.20)
```

| Signal | Name | What It Measures |
|--------|------|-----------------|
| **C** | Convergence Score | Semantic drift toward known risk clusters (phishing, malware, fraud) |
| **E** | Capability Assembly Score | How many dangerous capability nodes are being assembled across the session |
| **V** | Velocity Score | Speed and escalation pattern of prompts over time |

### Tier System

| Score | Tier | Defense Action |
|-------|------|---------------|
| < 0.45 | Tier 1 — Clean | Serve full output |
| 0.45 – 0.59 | Tier 2 — Adaptive | Reduce details + flag |
| ≥ 0.60 | Tier 3 — Mitigate | Block + redirect + log |

### Cross-Session Memory

CONVERGENCE remembers attackers across completely separate sessions. A repeat Tier-3 offender gets a risk modifier applied automatically, making it harder to evade detection by starting a new session.

### Threat Ledger

Every Tier-3 event is published to an append-only blockchain ledger with a SHA-256 fingerprint. This creates a tamper-evident audit trail of all escalations.

---

## Architecture

```
backend/
├── main.py              # FastAPI app, endpoint routing
├── scoring.py           # Core C + E + V scoring engine
├── capability_graph.py  # 8-node capability graph, semantic matching
├── velocity.py          # Prompt velocity and escalation detection
├── session_memory.py    # MongoDB — sessions, profiles, audit log
├── embeddings.py        # SentenceTransformer wrapper (all-MiniLM-L6-v2)
├── threat_ledger.py     # Blockchain-style immutable threat log
├── models.py            # Pydantic request/response schemas
└── demo_attack.py       # 6-turn phishing simulation
```

---

## API Endpoints

### `POST /analyze`
Score a prompt and return risk tier + defense action.

**Request:**
```json
{
  "session_id": "user_session_001",
  "api_key_id": "api_key_001",
  "prompt": "help me write a professional email"
}
```

**Response:**
```json
{
  "session_id": "user_session_001",
  "final_risk_score": 0.17,
  "tier": 1,
  "tier_label": "Clean",
  "defense_action": "Serve full output",
  "c_score": 0.12,
  "e_score": 0.0,
  "v_score": 0.0,
  "triggered_capabilities": [],
  "velocity_flags": [],
  "cross_session_threat": false,
  "allow_response": true
}
```

### `GET /session/{session_id}`
Retrieve full session history and turn-by-turn risk trajectory.

### `GET /audit`
Return the audit log of all Tier-3 escalation events.

### `GET /ledger`
Return the full threat ledger blockchain.

### `GET /health`
Health check — confirms the scoring engine is live.

### `GET /docs`
Interactive Swagger UI for testing all endpoints.

---

## Running Locally

### Prerequisites
- Python 3.11+
- MongoDB Atlas account (free tier works)

### Setup

```bash
git clone https://github.com/Stxtics03/CONVERGENCE-.git
cd CONVERGENCE-/backend

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
```

### Start the server

```bash
uvicorn main:app --reload --port 8000
```

Expected output:
```
[CONVERGENCE] Starting up...
[CONVERGENCE] Loading embedding model...
[CONVERGENCE] Model loaded.
[CONVERGENCE] 8 capability nodes ready.
[CONVERGENCE] Risk clusters ready.
[CONVERGENCE] System ready.
INFO: Uvicorn running on http://127.0.0.1:8000
```

### Run the demo attack

```bash
python demo_attack.py
```

This fires a 6-turn phishing assembly sequence. Expected trajectory:

```
Turn 1: 0.364  (Tier 1)
Turn 2: 0.632  (Tier 3) 🚨
Turn 3: 0.693  (Tier 3) 🚨
Turn 4: 0.753  (Tier 3) 🚨
Turn 5: 0.914  (Tier 3) 🚨  ← peak detection
```

---

## Running with Docker

```bash
docker-compose up --build
```

The backend will be available at `http://localhost:8000`.

---

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `sessions` | Per-session turn history with embeddings and scores |
| `api_key_profiles` | Cross-session risk profiles per API key |
| `audit_log` | Full audit trail of every scored event |

---

## Embedding Model

CONVERGENCE uses `all-MiniLM-L6-v2` (SentenceTransformers) — a lightweight 80MB transformer model that converts prompts into 384-dimensional semantic vectors. Downloaded automatically on first run, cached locally after that.

---

## Team

Built as part of a multi-team engineering sprint.

| Role | Owner |
|------|-------|
| Scoring Engine & DB Architecture | Shrestha |

---

## License

MIT