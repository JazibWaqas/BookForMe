# BookForMe Backend - AI WhatsApp Booking Bot

## 🎯 **Project Overview**

**BookForMe** is an AI-powered WhatsApp booking bot for informal services in Karachi (futsal courts, salons). This backend acts as an autonomous "Auto-Receptionist" that:

- ✅ Handles WhatsApp bookings via natural language (Roman Urdu/English)
- ✅ Uses Firestore for simple, scalable database operations
- ✅ Provides REST APIs for the frontend dashboard
- ✅ Prevents double-bookings with Firestore transactions
- ✅ Maintains conversation state for multi-turn WhatsApp interactions

## 🏗️ **System Architecture**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  WhatsApp User  │────▶│   FastAPI Agent  │◀────│  Frontend App  │
└─────────────────┘     │    (Backend)     │     └─────────────────┘
                        └──────────────────┘
                               │    ▲
                               │    │
                        ┌──────▼────┴──────┐
                        │   Firestore DB   │
                        │ (Source of Truth)│
                        └──────────────────┘
```

**Two Input Channels:**
1. **WhatsApp Channel**: Twilio webhook → NLU (Gemini) → Firestore
2. **Web App Channel**: REST API → Firestore

## 📁 **Project Structure**

```
backend/
├── README.md                    # This comprehensive guide
├── requirements.txt             # Python dependencies
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
│
├── app/                        # Main application
│   ├── __init__.py
│   ├── main.py                 # FastAPI app (imports from modules)
│   ├── config.py               # Settings (Firestore, Gemini, Twilio)
│   └── firestore.py            # Firestore database operations
│
├── whatsapp/                   # WhatsApp Channel Module
│   ├── __init__.py
│   ├── agent.py                # WhatsApp conversation state machine
│   ├── service.py              # Twilio integration
│   └── webhook.py              # Webhook handler
│
├── nlu/                        # NLU Module
│   ├── __init__.py
│   ├── agent.py                # Gemini NLU integration
│   └── state_manager.py        # Conversation state management
│
├── database/                   # Database Module
│   ├── __init__.py
│   ├── availability_service.py # Firestore availability checking
│   └── rest_api.py             # REST API endpoints
│
├── ai_logic/                   # AI Logic Module
│   ├── __init__.py
│   ├── conversation_optimizer.py # Conversation optimization
│   └── error_handler.py        # AI error handling
│
└── scripts/                    # Setup and testing
    ├── setup.py                # One-command setup
    ├── init_firestore.py       # Initialize database with sample data
    ├── test_workflow.py         # Test complete workflow
    └── test_components.py       # Test individual components
```

## 👥 **Team Assignments & Responsibilities**

### **Jazib: WhatsApp Channel Lead** 📱
**Your Module:** `whatsapp/` folder
**Your Files:**
- `whatsapp/agent.py` - WhatsApp conversation state machine
- `whatsapp/service.py` - Twilio integration
- `whatsapp/webhook.py` - Webhook handler

**Your Responsibilities:**
- Implement WhatsApp webhook handler
- Build 6-state conversation machine
- Integrate with Twilio for message sending
- Handle conversation flow: greeting → service → date → time → confirm → complete

**Your Tasks:**
1. Create Twilio integration in `whatsapp/service.py`
2. Test WhatsApp webhook with ngrok
3. Implement message sending via Twilio
4. Test complete conversation flow
5. Handle 6-state conversation machine

**Testing Your Module:**
```bash
python -c "from whatsapp.agent import WhatsAppAgent; print('WhatsApp Agent ready')"
python scripts/test_components.py  # Test WhatsApp module
```

---

### **Ahmad: NLU & Conversation Lead** 🧠
**Your Module:** `nlu/` folder
**Your Files:**
- `nlu/agent.py` - Gemini API integration
- `nlu/state_manager.py` - Conversation state management

**Your Responsibilities:**
- Implement Gemini API integration
- Build intent extraction (greeting, booking, confirmation, etc.)
- Build entity extraction (date, time, service type, customer name)
- Handle Roman Urdu/English mixed language support

**Your Tasks:**
1. Test Gemini API connection
2. Implement intent extraction (greeting, booking, confirmation)
3. Implement entity extraction (date, time, service, customer name)
4. Test Roman Urdu/English mixed language support
5. Test conversation state management

**Testing Your Module:**
```bash
python -c "from nlu.agent import NLUAgent; print('NLU Agent ready')"
python scripts/test_components.py  # Test NLU module
```

---

### **Taha: Database & Frontend Integration Lead** 🗄️
**Your Module:** `database/` folder
**Your Files:**
- `database/availability_service.py` - Firestore availability checking
- `database/rest_api.py` - REST API endpoints

**Your Responsibilities:**
- Implement Firestore database operations
- Build availability checking with Firestore transactions
- Create REST API endpoints for frontend
- Handle booking creation and confirmation
- Connect backend to frontend dashboard

**Your Tasks:**
1. Test Firestore connection and setup
2. Test database operations (CRUD)
3. Test Firestore transactions (prevent double-booking)
4. Test REST API endpoints for frontend
5. Connect backend to frontend dashboard
6. Handle booking creation and confirmation

**Testing Your Module:**
```bash
python -c "from database.availability_service import AvailabilityService; print('Database ready')"
python scripts/test_components.py  # Test Database module
```

---

### **Taqi: AI Logic & NLU Lead** 🤖
**Your Module:** `ai_logic/` folder
**Your Files:**
- `ai_logic/conversation_optimizer.py` - Conversation optimization
- `ai_logic/error_handler.py` - AI error handling

**Your Responsibilities:**
- Enhance AI conversation logic
- Improve NLU processing with Gemini
- Optimize conversation state management
- Handle complex AI workflows and error cases

**Your Tasks:**
1. Enhance AI conversation logic
2. Improve NLU processing with Gemini
3. Optimize conversation state management
4. Handle complex AI workflows and error cases
5. Improve Roman Urdu/English understanding
6. Optimize conversation flow and user experience

**Testing Your Module:**
```bash
python -c "from ai_logic.conversation_optimizer import ConversationOptimizer; print('AI Logic ready')"
python scripts/test_components.py  # Test AI Logic module
```

## 🚀 **Development Workflow**

### **Phase 1: Setup & Testing (Everyone)**
```bash
# 1. Setup environment
python scripts/setup.py

# 2. Configure API keys
cp .env.example .env
# Edit .env with your API keys

# 3. Initialize database
python scripts/init_firestore.py

# 4. Test individual components
python scripts/test_components.py
```

### **Phase 2: Individual Development**
Each team member works on their assigned module:
- **Jazib**: WhatsApp integration and conversation flow
- **Ahmad**: NLU processing and conversation state
- **Taha**: Database operations and REST API
- **Taqi**: AI logic enhancement and optimization

### **Phase 3: Integration Testing**
```bash
# Test complete workflow
python scripts/test_workflow.py

# Start server
uvicorn app.main:app --reload

# Test WhatsApp webhook
ngrok http 8000
```

### **Phase 4: End-to-End Testing**
1. Complete WhatsApp conversation flow
2. Test booking creation and confirmation
3. Test double-booking prevention
4. Test frontend integration

## 🔧 **API Endpoints**

### **WhatsApp Webhook**
```
POST /webhook/whatsapp
```
Receives WhatsApp messages via Twilio webhook

### **REST API (for Frontend)**
```
GET  /api/vendors                    # Get all vendors
GET  /api/vendors/{id}/availability  # Get available slots
POST /api/bookings                   # Create booking
GET  /api/vendors/{id}/bookings      # Get vendor bookings
```

### **Health Check**
```
GET  /health                         # Health check
GET  /                              # API information
```

## 🔑 **Environment Variables**

Create `.env` file with:

```bash
# FastAPI Configuration
APP_NAME=BookForMe Backend
DEBUG=True
PORT=8000

# AI/NLU (Gemini API)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro-latest

# WhatsApp via Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Firestore (Google Cloud)
FIRESTORE_PROJECT_ID=your-firestore-project-id
FIRESTORE_CREDENTIALS_FILE=./credentials/firestore-service-account.json

# Logging
LOG_LEVEL=INFO
```

## 🧪 **Testing Strategy**

### **Individual Component Testing**
```bash
# Test each module independently
python -c "from whatsapp.agent import WhatsAppAgent; print('WhatsApp ready')"
python -c "from nlu.agent import NLUAgent; print('NLU ready')"
python -c "from database.availability_service import AvailabilityService; print('Database ready')"
python -c "from ai_logic.conversation_optimizer import ConversationOptimizer; print('AI Logic ready')"
```

### **Complete System Testing**
```bash
# Test all components together
python scripts/test_components.py

# Test complete workflow
python scripts/test_workflow.py
```

### **WhatsApp Integration Testing**
```bash
# Start server
uvicorn app.main:app --reload

# Expose webhook
ngrok http 8000

# Test with WhatsApp messages
```

## 📱 **WhatsApp Integration**

### **Twilio Setup:**
1. Create Twilio account
2. Enable WhatsApp sandbox
3. Get sandbox number and credentials
4. Set webhook URL to your ngrok URL + `/webhook/whatsapp`

### **Test WhatsApp Flow:**
1. Send message to Twilio sandbox number
2. Check server logs for message processing
3. Verify response is sent back

## 🔥 **Firestore Setup**

### **Google Cloud Setup:**
1. Create Google Cloud project
2. Enable Firestore API
3. Create service account
4. Download credentials JSON
5. Place in `./credentials/firestore-service-account.json`

### **Database Collections:**
```
vendors/                    # Vendor information
availability_slots/         # Time slots for booking
bookings/                   # Customer bookings
conversation_states/        # WhatsApp conversation state
```

## 🎯 **Core Features**

### **WhatsApp Conversation Flow:**
1. **Greeting** - Welcome message and service selection
2. **Service Selection** - Choose futsal, salon, etc.
3. **Date Selection** - Pick booking date
4. **Time Selection** - Choose available time slot
5. **Confirmation** - Confirm booking details
6. **Complete** - Booking created and confirmed

### **AI Capabilities:**
- **Natural Language Understanding** - Roman Urdu/English mixed language
- **Intent Recognition** - booking, greeting, confirmation, etc.
- **Entity Extraction** - date, time, service, customer name
- **Conversation State Management** - Multi-turn conversations
- **Error Handling** - Graceful handling of unclear messages

### **Database Operations:**
- **Atomic Transactions** - Prevent double-bookings
- **Real-time Updates** - Frontend updates automatically
- **Simple Queries** - Easy availability checking
- **Scalable Storage** - Handles growth automatically

## 🚨 **Troubleshooting**

### **Common Issues:**

**1. Firestore Connection Failed:**
- Check `FIRESTORE_PROJECT_ID` in `.env`
- Verify credentials file path
- Ensure Firestore API is enabled

**2. Gemini API Error:**
- Check `GEMINI_API_KEY` in `.env`
- Verify API key is valid
- Check API quota limits

**3. Twilio Webhook Not Working:**
- Verify ngrok is running
- Check webhook URL in Twilio console
- Ensure server is running on correct port

**4. WhatsApp Messages Not Received:**
- Check Twilio sandbox setup
- Verify phone number format
- Check server logs for errors

## 📊 **Development Progress Tracking**

### **Jazib: WhatsApp Channel**
- [ ] Create Twilio integration in `whatsapp/service.py`
- [ ] Test WhatsApp webhook with ngrok
- [ ] Implement message sending via Twilio
- [ ] Test complete conversation flow

### **Ahmad: NLU & Conversation**
- [ ] Test Gemini API connection
- [ ] Implement intent extraction
- [ ] Test Roman Urdu/English processing
- [ ] Test conversation state management

### **Taha: Database & Frontend Integration**
- [ ] Test Firestore connection
- [ ] Test database operations
- [ ] Test transaction functionality
- [ ] Test REST API endpoints
- [ ] Connect backend to frontend

### **Taqi: AI Logic & NLU**
- [ ] Enhance AI conversation logic
- [ ] Improve NLU processing
- [ ] Optimize conversation state management
- [ ] Handle complex AI workflows

## 🎉 **Success Criteria**

Your backend is working when:
- ✅ Server starts without errors
- ✅ WhatsApp webhook receives messages
- ✅ NLU agent understands Roman Urdu/English
- ✅ Firestore stores and retrieves data
- ✅ Bookings are created successfully
- ✅ Frontend can query availability
- ✅ No double-bookings occur

## 📞 **Getting Help**

If you encounter issues:
1. Check server logs for error messages
2. Verify all environment variables are set
3. Test individual components using test scripts
4. Check Firestore console for data
5. Review this README for setup instructions

## 🚀 **Ready to Build!**

Each team member can now:
1. **Work independently** on their assigned module
2. **No merge conflicts** - Each person owns their files
3. **Easy integration** - Modules connect through main app
4. **Simple testing** - Test individual modules or complete system

**Let's build your AI WhatsApp booking bot!** 🎉