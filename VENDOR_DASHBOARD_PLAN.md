# Vendor Dashboard Product Plan: "The Venue OS"

## 1. Product Vision
To build a "Mission Control" for sports venue owners that is so useful they can't imagine running their business without it. It moves them from "messy distinct tools" (WhatsApp + Notebooks) to a **single, unified operating system**.

**The app is the Single Source of Truth.** Every booking—whether from the mobile app, the WhatsApp AI Agent, or a manual walk-in—lives in our Firestore database. There is no external sync to worry about, ensuring 100% reliability and zero double-bookings.

**Core Value Props:**
1.  **Peace of Mind**: "I know exactly what's happening at my venue right now, even if I'm not there."
2.  **Revenue Maximization**: "The system helps me fill empty slots."
3.  **AI Superpowers**: "I have a 24/7 receptionist who works for free."

---

## 2. Information Architecture (Sitemap)

The Vendor Dashboard will consist of 5 Core Pillars:

### A. 🏠 Dashboard (The "Heads-Up Display")
*Goal: Quick status check and immediate actions.*
*   **Live Status**: "3 Courts Occupied", "2 Bookings Starting in 15 mins".
*   **KPI Cards**: Today's Revenue, Occupancy Rate %, Pending Payment Verifications.
*   **Action Stream**:
    *   "⚠️ User x uploaded a payment screenshot. Verify?"
    *   "ℹ️ AI Agent handled 12 queries today."
    *   "📅 Court 2 has a gap at 6 PM. Want to broadcast a deal?"

### B. 📅 Schedule & Bookings (The "Operations Center")
*Goal: Managing the daily flow and manual entries.*
*   **Unified Calendar View**:
    *   Color-coded events: 🟢 App Booking, 🔵 AI/WhatsApp Booking, 🟡 Manual Walk-in, 🔴 Blocked/Maintenance.
    *   Day / Week / Month views.
*   **Quick Actions**:
    *   **"Add Walk-in"**: One-tap button to book a slot for a customer standing at the desk (updates Firestore instantly).
    *   **"Block Time"**: "Close Court 1 for repair" (removes from availability instantly).
*   **Booking List**:
    *   Filterable list (Pending, Confirmed, Completed).
    *   Search by customer name or phone number.

### C. 🤖 AI Receptionist (The "Digital Staff")
*Goal: Oversight and control over the automated agent.*
*   **Live Conversation Feed**: Read-only view of active chats the AI is handling.
*   **Intervention Mode**: a "Take Over" button to pause the AI for a specific chat and reply manually as the vendor.
*   **Knowledge Base**: Simple toggle switches for the AI's brain:
    *   "Generator Available?" [Yes/No]
    *   "Parking Free?" [Yes/No]
    *   "Equipment Rental?" [Yes/No]

### D. 💰 Financials & Analytics (The "Growth Engine")
*Goal: Understanding business health and verifying income.*
*   **Payment Verification Queue**:
    *   Side-by-side view: Uploaded Screenshot vs. Booking Details.
    *   One-click "Confirm" or "Reject".
*   **Insights**:
    *   **Peak Hours Heatmap**: "You are 100% booked M-F 8-11 PM."
    *   **Dead Zones**: "Tuesday afternoons are empty. Create a discount?"
    *   **Source Split**: "60% WhatsApp, 30% App, 10% Walk-in."

### E. ⚙️ Venue Profile (The "Identity")
*Goal: Self-service management of how the venue looks to users.*
*   **Service Menu**: Add/Remove sports, update prices.
*   **Gallery**: Upload photos of courts/amenities.
*   **Staff Management**: Add sub-accounts for receptionists (limited access).

---

## 3. High-Priority "Killer Features" (MVP)

These features address the specific pain points of Karachi sports vendors:

1.  **"Magic Verification"**: Uses the Gemini Vision AI to read the payment screenshot amount and highlights it in Green if it matches the slot price, Red if it doesn't.
2.  **"Broadcast Blast"**: A tool to send a WhatsApp template message to all customers who played in the last 30 days: "50% off slots this Tuesday!"
3.  **Real-time Notifications**: Desktop and mobile push alerts the moment a booking is locked or paid.

---

## 4. Technical Requirements for Vendor Dashboard

### Frontend (React/Next.js or React Native Tablet)
*   **Responsive Design**: Must work perfectly on mobile (owner on the go) and Tablet/Desktop (receptionist at desk).
*   **Real-time Sockets**: The Dashboard *cannot* require a refresh. New bookings must 'pop' in instantly (Firestore `onSnapshot`).

### Backend Support Needed
*   **`GET /api/vendor/analytics`**: New endpoint to aggregate Firestore data into stats.
*   **`POST /api/vendor/intervention`**: Endpoint to pause the LangGraph agent for a specific `thread_id`.
*   **`POST /api/vendor/broadcast`**: Endpoint to trigger WhatsApp template messages.

---

## 5. Implementation Phases

1.  **Phase 1: The Basics (Now)**
    *   Build the **Booking List & Calendar View** (Read/Write to Firestore).
    *   Implement **"Add Walk-in"** (Manual booking creation using Firestore Transactions).
    *   Build **Payment Verification** Screen.

2.  **Phase 2: AI Control (Next)**
    *   Build the **Live Chat Feed**.
    *   Implement **Knowledge Base** settings and intervention toggle.

3.  **Phase 4: Intelligence (Later)**
    *   Analytics & Insights Dashboard (Revenue aggregation).
    *   CRM / Customer List based on booking history.
