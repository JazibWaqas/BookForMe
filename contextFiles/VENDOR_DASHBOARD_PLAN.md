# Vendor Dashboard PRD: "The Venue OS"

## 🎯 1. The High-Level Vision
To build a **"Mission Control"** for sports venue owners in Karachi. Currently, these owners are drowning in phone calls, unorganized WhatsApp chats, and paper notebooks. 

**"The Venue OS"** isn't just an admin panel; it's a silent partner that:
*   **Decentralizes Operations**: The owner can see the venue's health from home, while the receptionist manages the desk at the venue.
*   **Automates the Mundane**: From 2AM booking inquiries to Verifying Bank Al-Falah screenshots.
*   **Maximizes Revenue**: Identifying "dead zones" in the schedule and filling them via AI.

---

## 🏛️ 2. The Five Pillars of the Dashboard
*Sonnet should focus on these as functional zones. You are encouraged to propose the best UI patterns (Modals vs. Sidebars, Grid vs. List) for these.*

### A. 🏠 Control Center (HUD)
*The heartbeat.* Immediate awareness. 
- "Who is on which court right now?"
- "How much cash did we make today?"
- **Actionable HUD**: Alerts that require human eyes (payment verifications, high-priority manual requests).

### B. 📅 Operations (The Unified Schedule)
*Single Source of Truth.*
- **The App is the Master**: No more external sheets. Every slot—WhatsApp, App, or Walk-in—lives in Firestore.
- **Speed is King**: A receptionist needs to book a "Walk-in" customer in < 5 seconds.
- **Visibility**: Clear visual distinction between sources (e.g., WhatsApp vs. App vs. Staff-entered).

### C. 🤖 AI Staff (Receptionist Oversight)
*The "Digital Employee" supervisor.*
- **Monitoring**: Live-reading the AI agent’s conversations.
- **Intervention**: The "Wait, let me talk" moment. If a human intervenes, the AI takes a backseat.
- **Wisdom Management**: Updating the AI's knowledge (e.g., "The Futsal lights are fixed now, tell anyone who asks").

### D. 💰 The Vault (Financials & Analytics)
*Trust and Growth.*
- **The Screenshot Problem**: Manually checking EasyPaisa screenshots is a nightmare. This pillar automates that verification.
- **Growth Heatmaps**: Showing owners *when* they are losing money (empty courts) so they can run promotions.

---

## 🚀 3. "Killer Features" (The WOW Factor)
*These are the features that make a vendor switch to JHAT.*

1.  **"Magic Vision"**: Using Gemini Vision to "read" payment screenshots. If a user tries to pay 1000 for a 2000 slot, the system flags it in bright red.
2.  **"Broadcast Blast"**: One-click "Send 30% discount to everyone who played Padel last week."
3.  **"Handover Mode"**: Seamlessly swapping between the AI agent and the human vendor in a single WhatsApp thread.

---

## 🏗️ 4. Technical Context (The "Anchor" for Sonnet)
*Use these existing patterns. Don't reinvent the wheel.*

### 📂 Firestore Collections
- `vendors`: Store business metadata and aggregate revenue stats.
- `slots`: Keyed by `v_{vendor}_{date}_{time}_{res}`. This is the master ledger.
- `payments`: Links slots to user-uploaded screenshots.
- `conversations`: Stores thread history for the AI Agent.

### � Existing Backend Logic
- `SlotService (backend/database/slot_service.py)`: Contains the "Sacred Logic" for transactions. 
    - **Use `manual_booking`** for walk-ins.
    - **Use `confirm_booking`** for payment approval.
    - **Use `block_slot`** for maintenance.
- `AvailabilityService`: Use this for all generation/conflict logic.

### � Auth & Identity
- Vendor identity is tied to their `user` document with `role: "vendor"`.
- Requests expect a JWT Bearer token.

---

## � 5. Implementation Strategy (Our Path Forward)
*Sonnet: Use your judgment here. Start with utility, end with intelligence.*

1.  **Phase 1: Operations Foundation**: Build the Calendar and the Manual Booking flow. Make it feel "snappy."
2.  **Phase 2: AI Control & Screenshots**: Build the review systems for Payment Screenshots and Live Chats.
3.  **Phase 3: Insights & Analytics**: Aggregating the data into beautiful, actionable graphs.

> **Note to Developer**: You are the architect. If you see a way to make the UX simpler for a venue receptionist who is busy/stressed, do it. The technical context is your boundary, but the UI is your canvas.
# Historical Archive Notice

This dashboard plan is historical planning context. It should not override the
current sports booking agent/backend documentation.

---
