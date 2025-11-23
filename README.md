# BookForMe - AI-Powered Service Booking Platform

## 🎯 Core Concept & Business Logic

**BookForMe** is a two-sided marketplace for service bookings (padel courts, salons, cricket pitches, etc.) in Karachi, Pakistan. It solves the problem of "informal WhatsApp bookings" by providing a centralized platform for users and an automated AI receptionist for vendors.

### The Problem
Vendors in Karachi currently manage bookings manually via WhatsApp, leading to:
- Double bookings
- Missed messages
- No centralized availability tracking
- Time-consuming manual coordination

### The Solution
A dual-app architecture that provides:
- **User App**: Centralized marketplace for browsing and booking services
- **Vendor AI Receptionist**: Automated WhatsApp agent that handles booking requests 24/7

---

## 🏗️ Dual-App Architecture

The system consists of **two distinct client applications** that share a single backend and database (Firestore). They work independently but are synchronized via the shared data layer.

### 1. User App (React Native + Expo)

**Role**: A centralized marketplace (like Booking.com or Foodpanda)

**Features**:
- Browse vendors by category and location
- Check real-time availability
- Book slots with instant confirmation
- Upload payment proof screenshots
- Intelligent Chatbot for natural language search (e.g., "Find me a cheap court in DHA")

**User Flow**:
```
Open App → Browse/Search → Select Slot → Book → Upload Payment Proof → Confirmed
```

**Technology**: React Native (Expo) + TypeScript

---

### 2. Vendor AI Receptionist (WhatsApp Interface)

**Role**: An automated agent that lives on the Vendor's WhatsApp Business account. It intercepts messages to handle the manual booking workload.

**Philosophy**: **"No Dashboard Required."** Vendors can manage everything via chat, though a Vendor Dashboard App exists for power users.

**Features**:
- Understands intent (Greeting vs. Booking)
- Negotiates times and availability
- Checks live database availability
- Validates payment screenshots via OCR
- Handles bilingual conversations (Roman Urdu/English)

**Technology**: WhatsApp Business API (Meta) + LangGraph + Gemini AI

---

## 🛠️ Technical Stack (MVP Phase)

### Frontend
- **User App**: React Native (Expo) with TypeScript
- **Web Dashboard**: React + TypeScript (Vite) - Separate project in `frontend/`

### Backend
- **API Server**: Python FastAPI (Async)
- **Database**: Google Cloud Firestore (NoSQL)
- **AI Orchestration**: LangGraph (Python) for stateful agent workflows
- **AI Model (MVP)**: Gemini 1.5 Flash (via API)
  - *Note: Will migrate to Qwen 2.5-7B-Instruct later for better Roman Urdu performance*

### Messaging & Integration
- **WhatsApp**: Meta Business API (Production) or Twilio (Sandbox testing)
- **OCR**: Gemini Flash Vision (Multimodal prompt for payment validation)

### Deployment
- **Backend**: Docker + Google Cloud Run / Railway
- **Frontend**: Vercel / Netlify
- **Mobile**: Expo Go (Development) → App Store / Play Store (Production)

---

## 🤖 Critical AI Agent Workflow (The "Receptionist")

The AI Agent follows a strict **ReAct (Reason + Act) loop** implemented in LangGraph.

### Workflow Steps

#### 1. Ingest
- Webhook receives a WhatsApp message
- Extract phone number and message text

#### 2. Reason (Intent Classification)
Using Gemini NLU to classify intent:
- **Is it a Greeting?** → Reply politely, offer services
- **Is it a Booking Query?** → Extract slots (Date, Time, Duration)
- **Is it a Payment Proof?** → Trigger OCR tool

#### 3. Tool Calling (The "Doing" Part)

**If Intent = Booking:**
```python
# Call availability check tool
slot_status = check_availability(vendor_id, timestamp)

if slot_status == AVAILABLE:
    lock_slot(vendor_id, timestamp)  # Hold slot
    request_payment(amount, booking_id)
elif slot_status == BOOKED:
    suggest_alternatives(vendor_id, date)
```

**If Intent = Payment Proof:**
```python
# Extract payment details via OCR
payment_data = ocr_extract(image)
if payment_data.amount == booking.amount:
    confirm_booking(booking_id)
else:
    request_correction()
```

#### 4. Payment Validation (Human-in-the-Loop)

1. User sends screenshot
2. Agent uses Gemini Vision OCR to verify amount matches booking price
3. Agent sends screenshot to Vendor for final confirmation (optional for MVP, mandatory for final)
4. Vendor confirms → Booking finalized

#### 5. Finalize

- Write Booking document to Firestore (using transaction)
- Send confirmation message to User
- Update availability slots

---

## 🔒 Key Architectural Constraints

### 1. Optimistic Concurrency Control

**CRITICAL**: We MUST use Firestore Transactions for all booking writes.

**Logic**:
```python
@firestore.transactional
def book_slot(transaction, slot_id):
    slot = firestore.get(slot_id)
    if slot.status == AVAILABLE:
        slot.status = BOOKED
        transaction.update(slot)
        return True
    else:
        return False  # Slot was booked between read and write
```

**Why**: Prevents the App User and WhatsApp User from booking the same slot at the same second.

### 2. Shared Database

The User App and AI Agent **MUST** read from the exact same availability collection in Firestore. There is no separate database for the agent.

**Collections**:
- `vendors/` - Vendor information
- `availability_slots/` - Time slots (shared between app and agent)
- `bookings/` - Customer bookings
- `conversation_states/` - WhatsApp conversation state

### 3. Bilingual NLU

The agent must handle **Roman Urdu** (e.g., "Bhai 7 baje ka slot hai?") and **English** code-switching robustly.

**Examples**:
- "Kal sham ka slot chahiye" (Roman Urdu)
- "I need a slot tomorrow evening" (English)
- "Bhai 5 baje ka time hai?" (Mixed)

---

## 📁 Project Structure

```
JHAT/
├── App/                          # React Native Mobile App (User App)
│   ├── App.tsx                  # Main app component
│   ├── package.json             # React Native dependencies
│   └── src/                     # App source code
│
├── backend/                      # FastAPI Backend
│   ├── app/                     # Main application
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── config.py           # Environment settings
│   │   └── firestore.py        # Database connection
│   │
│   ├── whatsapp/               # WhatsApp Agent Module
│   │   ├── agent.py            # LangGraph state machine
│   │   ├── service.py          # WhatsApp API integration
│   │   └── webhook.py          # Webhook handler
│   │
│   ├── nlu/                    # Natural Language Understanding
│   │   ├── agent.py            # Gemini NLU integration
│   │   └── state_manager.py    # Conversation state
│   │
│   ├── database/               # Database Operations
│   │   ├── availability_service.py  # Booking logic
│   │   └── rest_api.py        # REST API endpoints
│   │
│   └── scripts/                # Testing & setup scripts
│
├── frontend/                    # React Web Dashboard (Separate)
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Main pages
│   │   └── services/          # API client
│
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker configuration
├── app.py                      # Railway deployment entry point
└── PROJECT_STATUS.md          # Development progress tracking
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Google Cloud account (for Firestore)
- Meta Developer account (for WhatsApp Business API)
- Gemini API key

### Backend Setup

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Initialize Firestore
python backend/scripts/init_firestore.py

# 4. Start backend server
uvicorn backend.app.main:app --reload
```

### Mobile App Setup

```bash
# 1. Navigate to App directory
cd App

# 2. Install dependencies (already done)
npm install

# 3. Start Expo development server
npm start

# 4. Scan QR code with Expo Go app (iOS/Android)
```

### Web Dashboard Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

---

## 🔑 Environment Variables

Create `.env` file in root directory:

```bash
# FastAPI Configuration
APP_NAME=BookForMe Backend
DEBUG=True
PORT=8000

# AI/NLU (Gemini API)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# WhatsApp (Meta Business API)
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Firestore (Google Cloud)
FIRESTORE_PROJECT_ID=your-firestore-project-id
FIRESTORE_CREDENTIALS_FILE=./backend/credentials/firestore-service-account.json
GOOGLE_APPLICATION_CREDENTIALS=./backend/credentials/firestore-service-account.json

# Logging
LOG_LEVEL=INFO
```

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Test WhatsApp webhook
curl -X POST http://localhost:8000/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'
```

### Test Mobile App

```bash
cd App
npm start
# Scan QR code with Expo Go app
```

### Test WhatsApp Agent

1. Set up ngrok: `ngrok http 8000`
2. Configure webhook URL in Meta Developer Console
3. Send WhatsApp message to your business number
4. Check server logs for processing

---

## 📊 API Endpoints

### WhatsApp Webhook
- `GET /webhook/whatsapp` - Webhook verification
- `POST /webhook/whatsapp` - Receive WhatsApp messages

### REST API (for User App & Web Dashboard)
- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/{id}` - Get vendor details
- `GET /api/vendors/{id}/availability` - Get available slots
- `POST /api/bookings` - Create booking
- `GET /api/bookings/{id}` - Get booking details
- `POST /api/bookings/{id}/payment` - Upload payment proof

### Health & Info
- `GET /health` - Health check
- `GET /` - API information

---

## 👨‍💻 Developer Guidelines

### TypeScript Standards

**Strict TypeScript**: All frontend data models must be typed interfaces.

```typescript
// Example: types/index.ts
interface Booking {
  id: string;
  vendorId: string;
  userId: string;
  slotId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  amount: number;
  paymentProof?: string;
}
```

### Clean Architecture

Keep separation of concerns:

```
backend/
├── routes/          # API route handlers
├── services/        # Business logic
└── dao/            # Database access (Data Access Object)
```

### Agent State Management

**Use LangGraph's StateGraph** to manage conversation history. Do not rely on stateless LLM calls for multi-turn booking flows.

```python
from langgraph.graph import StateGraph, START, END

# Define state
class AgentState(TypedDict):
    messages: List[str]
    user_phone: str
    intent: str
    entities: Dict[str, Any]
    conversation_history: List[Dict]

# Build graph
workflow = StateGraph(AgentState)
workflow.add_node("classify_intent", classify_intent_node)
workflow.add_node("check_availability", check_availability_node)
workflow.add_node("process_booking", process_booking_node)
```

---

## 🎯 MVP Roadmap

### Phase 1: Core Infrastructure ✅
- [x] FastAPI backend setup
- [x] Firestore database connection
- [x] WhatsApp webhook integration
- [x] Gemini NLU integration
- [x] LangGraph installation

### Phase 2: AI Agent (In Progress)
- [ ] Implement LangGraph state machine
- [ ] Intent classification with Gemini
- [ ] Entity extraction (date, time, service)
- [ ] Availability checking tool
- [ ] Payment OCR with Gemini Vision

### Phase 3: User App
- [ ] Vendor browsing interface
- [ ] Availability display
- [ ] Booking flow
- [ ] Payment proof upload
- [ ] Chatbot integration

### Phase 4: Integration & Testing
- [ ] End-to-end booking flow
- [ ] Double-booking prevention testing
- [ ] Bilingual NLU testing
- [ ] Performance optimization

---

## 📞 Support & Resources

- **Repository**: [GitHub](https://github.com/JazibWaqas/JHAT)
- **Backend API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Firestore Console**: [Google Cloud Console](https://console.cloud.google.com/firestore)
- **Meta Developer**: [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

---

## 📝 License

This project is part of a Final Year Project (FYP) at [Your University].

---

**Last Updated**: January 2025  
**Status**: MVP Development Phase  
**Next Milestone**: LangGraph Agent Implementation

