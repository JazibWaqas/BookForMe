# BookForMe Backend - AI Auto-Receptionist

## 🎯 Project Overview

**BookForMe** is an AI-powered centralized booking platform for informal services in Karachi (futsal courts, salons). This backend acts as an autonomous "Auto-Receptionist" that:

- ✅ Handles WhatsApp bookings via natural language (Roman Urdu/English)
- ✅ Syncs with vendor Google Sheets for manual bookings
- ✅ Provides REST APIs for the web app
- ✅ Prevents double-bookings across all channels with PostgreSQL locking
- ✅ Maintains conversation state for multi-turn WhatsApp interactions

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  WhatsApp User  │────▶│   FastAPI Agent  │◀────│   Web App User  │
└─────────────────┘     │    (Backend)     │     └─────────────────┘
                        └──────────────────┘
                               │    ▲
                               │    │
                        ┌──────▼────┴──────┐
                        │   PostgreSQL DB   │
                        │  (Source of Truth)│
                        └──────────▲────────┘
                               │    │
                        ┌──────▼────┴──────┐
                        │  Vendor's Google │
                        │      Sheets      │
                        └──────────────────┘
```

**Three Input Channels:**
1. **WhatsApp Channel**: Twilio webhook → NLU (Gemini) → Database
2. **Google Sheets Channel**: Periodic sync (2 mins) → Database
3. **Web App Channel**: REST API → Database

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Docker & Docker Compose
- Twilio account (free trial for WhatsApp sandbox)
- Google Gemini API key (free tier)
- Google Cloud service account (for Sheets API)

### Setup

1. **Clone and navigate to backend:**
```bash
cd backend
```

2. **Start PostgreSQL & Redis locally:**
```bash
docker-compose up -d
```

3. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys and credentials
```

6. **Initialize database:**
```bash
python scripts/init_db.py
```

7. **Run the server:**
```bash
uvicorn app.main:app --reload --port 8000
```

Server will start at: `http://localhost:8000`

## 👥 Team Structure (4 People)

### **Member 1: WhatsApp Channel Lead** 🟢
**Your Domain:**
- `agents/whatsapp_agent.py` - Conversation handler
- `services/whatsapp_service.py` - Twilio integration

**Your Job:**
1. Setup Twilio WhatsApp sandbox
2. Build webhook endpoint to receive messages
3. Send WhatsApp responses via Twilio API
4. Handle conversation flow states

**Test Independently:**
```bash
# Mock the NLU agent responses
pytest tests/test_whatsapp_agent.py
```

**Dependencies:** Wait for Member 2's NLU interface


### **Member 2: NLU & Conversation Lead** 🔵
**Your Domain:**
- `agents/nlu_agent.py` - Gemini NLU integration
- `agents/booking_agent.py` - Booking workflow logic
- `utils/state_manager.py` - Conversation state (Redis)

**Your Job:**
1. Integrate Gemini API for intent extraction
2. Build conversation state machine
3. Handle Roman Urdu/English understanding
4. Extract entities (date, time, service type, name)

**Test Independently:**
```bash
# Test with sample messages
pytest tests/test_nlu_agent.py
```

**Dependencies:** None initially - you provide interfaces to others


### **Member 3: Database & Availability Lead** 🟡
**Your Domain:**
- `app/database.py` - PostgreSQL connection
- `app/models/` - All database models
- `services/availability_service.py` - Slot checking & booking

**Your Job:**
1. Setup PostgreSQL schema
2. Create SQLAlchemy models
3. Implement availability checking with row-level locking
4. Build booking creation/cancellation logic

**Test Independently:**
```bash
# Test with local PostgreSQL
pytest tests/test_availability_service.py
pytest tests/test_concurrency.py
```

**Dependencies:** None initially - you provide interfaces to all


### **Member 4: Google Sheets Integration Lead** 🟣
**Your Domain:**
- `services/sheets_service.py` - Google Sheets API
- Sync job in `app/main.py` - Periodic task

**Your Job:**
1. Setup Google Cloud service account
2. Read vendor sheets via gspread
3. Parse booking data from sheets
4. Implement 2-minute periodic sync job

**Test Independently:**
```bash
# Test with sample sheet
pytest tests/test_sheets_service.py
```

**Dependencies:** Need Member 3's DB models and availability service


## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI entry, webhook endpoints
│   ├── config.py                  # Settings, environment vars
│   ├── database.py                # PostgreSQL connection [Member 3]
│   └── models/
│       ├── __init__.py
│       ├── vendor.py              # Vendor model [Member 3]
│       ├── booking.py             # Booking model [Member 3]
│       └── availability.py        # Availability slots [Member 3]
│
├── agents/
│   ├── __init__.py
│   ├── whatsapp_agent.py          # WhatsApp handler [Member 1]
│   ├── nlu_agent.py               # Gemini NLU [Member 2]
│   └── booking_agent.py           # Booking logic [Member 2]
│
├── services/
│   ├── __init__.py
│   ├── whatsapp_service.py        # Twilio API [Member 1]
│   ├── sheets_service.py          # Google Sheets API [Member 4]
│   └── availability_service.py    # Availability logic [Member 3]
│
├── utils/
│   ├── __init__.py
│   ├── state_manager.py           # Redis state [Member 2]
│   └── helpers.py                 # Shared utilities
│
├── tests/
│   ├── test_whatsapp_agent.py     # [Member 1]
│   ├── test_nlu_agent.py          # [Member 2]
│   ├── test_availability_service.py # [Member 3]
│   ├── test_sheets_service.py     # [Member 4]
│   └── test_integration.py        # Full team
│
├── scripts/
│   └── init_db.py                 # Database initialization
│
├── credentials/                    # Git-ignored
│   ├── sheets-service-account.json
│   └── firestore-service-account.json
│
├── requirements.txt
├── .env.example
├── .env                            # Git-ignored
├── docker-compose.yml
├── .gitignore
└── README.md                       # This file
```

## 🔌 API Contracts (Define Before Coding!)

All team members must agree on these interfaces before starting:

```python
# NLU Agent Interface (Member 2 → Member 1)
class NLUAgent:
    async def extract_intent(self, message: str, history: list) -> dict:
        """
        Returns: {
            'intent': 'check_availability' | 'make_booking' | 'cancel_booking' | 'greeting' | 'other',
            'entities': {
                'service_type': 'futsal' | 'salon' | None,
                'date': 'YYYY-MM-DD' | None,
                'time': 'HH:MM' | None,
                'customer_name': str | None
            }
        }
        """

# Availability Service Interface (Member 3 → All)
class AvailabilityService:
    async def check_and_book_slot(
        self, vendor_id: int, date: str, time: str, customer: dict
    ) -> dict:
        """
        Returns: {
            'success': bool,
            'booking_id': int | None,
            'error': str | None
        }
        """
    
    async def get_available_slots(self, vendor_id: int, date: str) -> list:
        """
        Returns: [
            {'time': '14:00', 'price': 2000.0, 'status': 'available'},
            ...
        ]
        """

# State Manager Interface (Member 2 → Member 1)
class StateManager:
    async def get_session(self, phone_number: str) -> dict:
        """
        Returns: {
            'state': 'greeting' | 'select_service' | 'select_date' | ...,
            'context': {'vendor_id': int, 'selected_date': str, ...},
            'history': [{'role': 'user', 'content': str}, ...]
        }
        """
    
    async def update_session(self, phone_number: str, data: dict) -> None:
        pass

# Sheets Service Interface (Member 4 → Member 3)
class SheetsService:
    async def read_vendor_bookings(self, sheet_id: str) -> list:
        """
        Returns: [
            {
                'date': '2025-01-15',
                'time': '14:00',
                'customer_name': 'Ahmed',
                'customer_phone': '+923001234567',
                'service': 'futsal'
            },
            ...
        ]
        """
```

## 🔀 Git Workflow

```bash
# Main branches
main          # Production-ready code
develop       # Integration branch

# Feature branches (one per person)
feature/whatsapp-channel       # Member 1
feature/nlu-conversation       # Member 2
feature/database-availability  # Member 3
feature/sheets-integration     # Member 4
```

**Daily Workflow:**
```bash
# 1. Start of day: Update your branch
git checkout feature/your-feature
git pull origin develop
git merge develop

# 2. Work on your code
git add .
git commit -m "Your meaningful commit message"

# 3. End of day: Push your changes
git push origin feature/your-feature

# 4. When ready: Create Pull Request to develop
# Team reviews → Merge to develop → Test → Merge to main
```

## 🧪 Testing

**Unit Tests (Each Member):**
```bash
# Test your own module
pytest tests/test_your_module.py -v
```

**Integration Tests (Full Team):**
```bash
# Test all channels together
pytest tests/test_integration.py -v
```

**Concurrency Tests (Member 3 + Team):**
```bash
# Simulate simultaneous bookings
pytest tests/test_concurrency.py -v
```

## 🔑 Environment Variables

See `.env.example` for all required variables:

```bash
# Database
DATABASE_URL=postgresql://dev:devpass@localhost:5432/bookforme

# AI/NLU
GEMINI_API_KEY=your_gemini_api_key_here

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_FILE=./credentials/sheets-service-account.json

# Redis (Conversation State)
REDIS_URL=redis://localhost:6379/0
```

## 🎓 Learning Resources

**Reference Projects (in `FYP Reference Projects/`):**
- `FlightChatbot_v1-main/` → WhatsApp webhook pattern
- `google-gemini-fastapi-main/` → Gemini API integration
- `WhatsAppCabBookingBot-main/` → Conversation state machine
- `SL-IT-AI-main/` → Multi-agent architecture

**Key Patterns to Study:**
1. **Webhook Handler**: `FlightChatbot/app.py` lines 700-725
2. **NLU with Gemini**: `google-gemini-fastapi/main.py` lines 104-116
3. **State Machine**: `WhatsAppCabBookingBot/index.js` lines 754-1012
4. **Database Locking**: PostgreSQL `SELECT ... FOR UPDATE` pattern

## 🐛 Troubleshooting

**PostgreSQL not connecting?**
```bash
docker-compose down
docker-compose up -d postgres
# Wait 10 seconds
python scripts/init_db.py
```

**Twilio webhook not receiving messages?**
- Use ngrok: `ngrok http 8000`
- Update Twilio webhook URL with ngrok URL: `https://your-ngrok-url.ngrok.io/webhook/whatsapp`

**Gemini API errors?**
- Check API key in `.env`
- Verify you're using free tier limits
- Test with: `python -c "import google.generativeai as genai; genai.configure(api_key='YOUR_KEY'); print('OK')"`

**Redis connection issues?**
```bash
docker-compose restart redis
```

## 📊 Success Criteria (MVP)

- [ ] WhatsApp user sends "futsal kal 5 baje" → Gets availability
- [ ] WhatsApp user books slot → Receives confirmation
- [ ] Vendor adds booking to Google Sheet → System syncs (2-min delay)
- [ ] No double-bookings when 3 people try to book same slot
- [ ] Conversation remembers context across multiple messages

## 📝 Next Steps After MVP

1. Replace Gemini with local Ollama model
2. Replace Twilio with WhatsApp Business API
3. Add real-time sheet webhooks (no polling)
4. Build vendor dashboard frontend
5. Add voice message support
6. Analytics & reporting

## 💬 Team Communication

**Daily Standup (15 mins):**
- What did you complete yesterday?
- What are you working on today?
- Any blockers?

**Integration Sessions (2 hours each):**
- Week 2 Day 1: Member 1 + 2 (WhatsApp ↔ NLU)
- Week 2 Day 3: Member 2 + 3 (Conversation ↔ DB)
- Week 2 Day 5: Member 3 + 4 (DB ↔ Sheets)

**Weekly Demo (Friday 4pm):**
- Each member demos their progress
- Full team tests end-to-end flow
- Plan next week's work

---

**Questions?** Check the reference projects or ask in team chat. Good luck! 🚀

