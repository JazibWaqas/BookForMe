# BookForMe – AI-Powered Service Booking Platform

**Current Status**: 🟢 **Production Foundation Locked** (v1.0)
**Last Updated**: February 13, 2026

---

## 🎯 The Vision

**BookForMe** is a unified two-sided marketplace solving the "informal booking chaos" in Karachi.
We seamlessly connect:
1.  **Mobile App Users** (React Native)
2.  **WhatsApp Users** (AI Receptionist)
3.  **Sports Vendors** (Web Dashboard)

All three interface with a **single, structurally rigorous Firestore database**.

---

## 🏗️ System Architecture

### 1️⃣ The Database (The Brain)
We have performed a forensic reset to establish a **Canonical Schema**.
There are no "ghost users". There are no "partial profiles".
Every user, whether from WhatsApp or App, shares the exact same DNA.

👉 **[READ THIS FIRST: Database Architecture v1.0](DATABASE_ARCHITECTURE_v1.0.md)**
*   *Canonical User Schema definition*
*   *Identity Model (UUID vs Phone)*
*   *Slot State Machine Invariants*
*   *Referential Integrity Guarantees*

### 2️⃣ The AI Agent (The Voice)
The WhatsApp agent is not just a chatbot; it's a stateful booking engine.
It understands Roman Urdu, manages booking flows, and syncs perfectly with the app.

👉 **[AI Agent Architecture](backend/AI_AGENT_ARCHITECTURE.md)**
*   *LangGraph Workflow*
*   *NLU & Intent Classification*
*   *State Management*

### 3️⃣ The Stack
*   **Backend**: Python FastAPI (Async)
*   **Database**: Google Cloud Firestore
*   **AI**: LangGraph + Groq (Llama 3) + Gemini (OCR)
*   **Frontend**: React Native (Expo)

---

## 🚀 Quick Start (Fresh Session)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### 2. Database Seeding (Reset & Repopulate)
If you need to reset the world (Only do this if you know what you are doing):
```bash
# 1. Wipe (Careful!)
python -m database.seed.wipe_firestore

# 2. Seed System & Core
python -m database.seed.seed_system_config
python -m database.seed.seed_all --days 14

# 3. Seed Social Graph
python -m database.seed.seed_social

# 4. Verify Integrity
python -m database.seed.master_forensic_verification
```

### 3. Testing
```bash
# Run API Endpoint Tests
python -m database.seed.test_api
```

---

## � Repository Map

*   `DATABASE_ARCHITECTURE_v1.0.md` → **The Single Source of Truth for Data.**
*   `backend/` → FastAPI application & AI Agent.
*   `App/` → React Native mobile application.
*   `wireframes/` → UI Reference.

---

## 📝 Critical Invariants
*   **Timezones**: Always stored as UTC. Displayed as PKT.
*   **User ID**: Always Firestore UUID. Phone is just an indexed field.
*   **Slots**: Created `available`. Must have `hold_expires_at` if `locked`.

**Maintained by**: Core Engineering Team
