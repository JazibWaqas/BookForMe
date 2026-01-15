# BookForMe Backend - FastAPI + LangGraph AI Agent

**Last Updated**: December 29, 2025
**Status**: Production Ready (Core Features Complete)
**Deployment**: Render (`https://jhat-to9p.onrender.com`)

---

## 🎯 Core Vision

The backend serves as the **single source of truth** for both the mobile app and WhatsApp AI agent. It ensures:
- **No double-bookings** via Firestore transactions (Optimistic Concurrency Control)
- **Real-time availability** synchronized across all clients
- **AI-powered booking** via LangGraph state machine
- **Payment validation** via Gemini Vision OCR (planned)

---

## 🏗️ Architecture

```
WhatsApp Webhook → LangGraph Agent → Firestore Database
Mobile App API  → REST Endpoints  → Firestore Database
```

**Key Components**:
1. **LangGraph Agent** (`agent/`) - Stateful conversation workflow
2. **Database Layer** (`database/`) - Firestore operations with OCC
3. **NLU Module** (`nlu/`) - Gemini API integration for intent/entity extraction
4. **WhatsApp Handler** (`whatsapp/`) - Meta Business API webhook

---

## ✅ What's Done (As of January 15, 2025)

### Infrastructure ✅
- FastAPI backend with async support
- Railway deployment configured
- Firestore connection operational
- Meta WhatsApp Business API integrated
- Environment configuration complete

### LangGraph Agent ✅
- **State Machine**: `agent/graph.py` - LangGraph workflow implemented
- **Nodes**: `agent/nodes.py` - Intent classification, query, response generation
- **Tools**: `agent/tools.py` - Availability checking, pricing queries
- **State**: `agent/state.py` - TypedDict state structure

### Booking System ✅
- **Slot Locking**: `database/slot_service.py` - 10-minute hold mechanism
- **Transactions**: All writes use `@firestore.transactional` decorator
- **Payment Upload**: `/api/payments/upload` endpoint functional
- **Booking Confirmation**: Vendor approval flow implemented
- **Double-Booking Prevention**: Tested and working

### Database Operations ✅
- **Slot Management**: Create, lock, release, confirm, cancel
- **Vendor Queries**: Filter by sport, area, category
- **User Bookings**: Query by user_id with status filters
- **Batch Queries**: Eliminated N+1 problems

### API Endpoints ✅
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/{id}` - Vendor details
- `GET /api/vendors/{id}/availability` - Available slots
- `POST /api/slots/{id}/lock` - Lock slot (10 min)
- `POST /api/payments/upload` - Upload payment screenshot
- `GET /api/bookings` - User bookings
- `POST /webhook/whatsapp` - WhatsApp message handler

---

## 🚧 What Needs to Be Done

### Critical (High Priority)
1. **Payment OCR Integration** - Connect Gemini Vision API to payment upload
   - **Status**: Not started
   - **Files**: `database/payment_upload.py` needs OCR call
   - **Target**: January 20, 2025

2. **Automated Hold Expiry** - Cloud Function to release expired locks
   - **Status**: Function exists (`slot_service.cleanup_expired_locks()`), not scheduled
   - **Target**: January 18, 2025

3. **Timezone Fix** - Store `start_time` in UTC (currently naive datetime)
   - **Status**: Bug identified in `database/seed/slot_generator.py`
   - **Target**: January 17, 2025

4. **Composite Indexes** - Verify Firestore indexes for vendor queries
   - **Status**: Indexes documented but not verified
   - **Target**: January 16, 2025

### Important (Medium Priority)
1. **Bilingual NLU Enhancement** - Improve Roman Urdu/English handling
   - **Status**: Basic support exists, needs refinement
   - **Files**: `nlu/agent.py` - Intent classification prompts

2. **Matchmaking System** - Elo-based ranked match queue
   - **Status**: Schema exists, no queries implemented
   - **Target**: February 1, 2025

3. **Error Handling** - Graceful handling of unclear messages
   - **Status**: Basic error handling exists, needs improvement

### Nice to Have (Low Priority)
1. **Analytics Endpoints** - User behavior tracking
2. **Caching Layer** - Redis for frequently accessed data
3. **Rate Limiting** - Prevent API abuse

---

## 📁 Project Structure

```
backend/
├── agent/                  # LangGraph AI Agent
│   ├── graph.py           # Main workflow definition
│   ├── nodes.py           # Agent node functions
│   ├── state.py           # State structure
│   └── tools.py           # Database query tools
│
├── database/               # Firestore Operations
│   ├── slot_service.py    # Slot locking/booking (OCC)
│   ├── rest_api.py        # REST API endpoints
│   ├── firestore_v2.py    # Firestore client wrapper
│   ├── auth_service.py    # Authentication
│   └── DATABASE_DOCUMENTATION.md  # Complete schema reference
│
├── nlu/                    # Natural Language Understanding
│   ├── agent.py           # Gemini NLU integration
│   └── state_manager.py   # Conversation state
│
├── whatsapp/               # WhatsApp Integration
│   ├── webhook.py         # Webhook handler
│   ├── service.py         # Meta API client
│   └── agent.py           # Legacy agent (being migrated)
│
├── app/                    # FastAPI Application
│   ├── main.py            # App entry point
│   ├── config.py          # Settings
│   └── firestore.py       # Database connection
│
└── scripts/                # Utility Scripts
    ├── init_firestore.py  # Initialize database
    ├── seed_all.py        # Populate sample data
    ├── chat_terminal.py    # Test agent locally
    └── README.md          # Script documentation
```

---

## 🔑 Key Technical Details

### Optimistic Concurrency Control

All slot writes use Firestore transactions:

```python
@firestore.transactional
def lock_slot(self, slot_id: str, user_id: str):
    slot_ref = self.db.collection('slots').document(slot_id)
    slot_doc = slot_ref.get(transaction=transaction)
    
    if slot_doc.get('status') != 'available':
        return {'success': False, 'error': 'Slot not available'}
    
    transaction.update(slot_ref, {
        'status': 'locked',
        'user_id': user_id,
        'hold_expires_at': datetime.now(timezone.utc) + timedelta(minutes=10)
    })
```

**Why**: Prevents mobile app user and WhatsApp user from booking the same slot simultaneously.

### LangGraph Workflow

```
START → classify_intent → query → generate_response → END
```

**State Structure** (`agent/state.py`):
- `messages`: List of conversation messages
- `current_intent`: Classified intent (greeting, booking_request, etc.)
- `entities`: Extracted entities (date, time, service_type)
- `query_result`: Results from database queries
- `response`: Generated response text

### Slot State Machine

```
available → locked (10 min) → pending (payment) → confirmed (vendor) → completed
                ↓
            cancelled
```

**Transitions**:
- `available → locked`: User selects slot (10-minute hold)
- `locked → pending`: Payment screenshot uploaded
- `pending → confirmed`: Vendor approves payment
- `pending → cancelled`: Vendor rejects or user cancels
- `confirmed → completed`: Session finished

---

## 🚀 Development Workflow

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GEMINI_API_KEY=your_key
export FIRESTORE_PROJECT_ID=your_project
export WHATSAPP_ACCESS_TOKEN=your_token

# Start server
uvicorn backend.app.main:app --reload
```

### Testing Agent Locally
```bash
# Test LangGraph agent
python backend/scripts/chat_terminal.py

# Test NLU only
python backend/scripts/chat.py
```

### Database Operations
```bash
# Initialize Firestore
python backend/scripts/init_firestore.py

# Seed sample data
python backend/scripts/seed_all.py

# Check database status
python backend/scripts/check_db.py
```

---

## 📊 API Documentation

### REST Endpoints

**Vendors**:
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/{id}` - Get vendor details
- `GET /api/vendors/{id}/availability?date=YYYY-MM-DD` - Get available slots

**Slots**:
- `POST /api/slots/{id}/lock` - Lock slot (requires auth)
- `GET /api/slots/{id}` - Get slot details

**Bookings**:
- `GET /api/bookings` - Get user bookings (requires auth)
- `POST /api/bookings` - Create booking (requires auth)

**Payments**:
- `POST /api/payments/upload` - Upload payment screenshot (multipart/form-data)

**WhatsApp**:
- `GET /webhook/whatsapp` - Webhook verification
- `POST /webhook/whatsapp` - Receive messages

**Health**:
- `GET /health` - Health check

### Authentication

Most endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer {jwt_token}
```

---

## 🐛 Known Issues

1. **Timezone Storage**: `start_time` stored as naive datetime (should be UTC)
   - **Impact**: May cause incorrect slot times in different timezones
   - **Fix**: Update `database/seed/slot_generator.py` to use UTC

2. **Hold Expiry**: Background cleanup job not automated
   - **Impact**: Expired locks persist until manual check
   - **Fix**: Create Cloud Function to run `cleanup_expired_locks()` every 5 minutes

3. **Composite Indexes**: Not verified in Firestore
   - **Impact**: Vendor queries may be slow at scale
   - **Fix**: Verify/create indexes in Firestore Console

---

## 📚 Additional Documentation

- **Database Schema**: `database/DATABASE_DOCUMENTATION.md` - Complete reference
- **AI Agent Architecture**: `AI_AGENT_ARCHITECTURE.md` - Component locations
- **Scripts Guide**: `scripts/README.md` - Utility script documentation

---

## 🧪 Testing

### Unit Tests
```bash
# Test database operations
python backend/scripts/test_booking_db.py

# Test NLU agent
python backend/scripts/test_nlu.py

# Test complete workflow
python backend/scripts/test_workflow.py
```

### Integration Tests
```bash
# Test API endpoints
python backend/scripts/test_api.py

# Test WhatsApp webhook
curl -X POST http://localhost:8000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"entry": [{"changes": [{"value": {"messages": [{"text": {"body": "test"}}]}}]}]}'
```

---

## 🔒 Security Considerations

1. **JWT Tokens**: All authenticated endpoints validate JWT
2. **Firestore Rules**: Server-side validation (no client-side rules)
3. **Transaction Safety**: All writes use transactions to prevent race conditions
4. **API Keys**: Stored in environment variables, never committed

---

## 📈 Performance Optimizations

1. **Batch Queries**: Eliminated N+1 problems in vendor queries
2. **React Query**: Frontend caching reduces backend load
3. **Async Operations**: Non-blocking AI calls
4. **Connection Pooling**: Firestore client reuse

---

**Last Updated**: January 15, 2025  
**Maintained By**: Backend Team  
**Questions?** Check `database/DATABASE_DOCUMENTATION.md` for schema details.
