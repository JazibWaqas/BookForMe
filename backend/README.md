# BookForMe Backend - AI WhatsApp Booking Bot

## 🎯 Project Overview

**BookForMe** is an AI-powered WhatsApp booking bot for informal services in Karachi (futsal courts, salons). This backend acts as an autonomous "Auto-Receptionist" that:

- ✅ Handles WhatsApp bookings via natural language (Roman Urdu/English)
- ✅ Uses Firestore for simple, scalable database operations
- ✅ Provides REST APIs for the frontend dashboard
- ✅ Prevents double-bookings with Firestore transactions
- ✅ Maintains conversation state for multi-turn WhatsApp interactions

## 🏗️ Architecture

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

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Twilio account (free trial for WhatsApp sandbox)
- Google Gemini API key (free tier)
- Google Cloud Firestore project (free tier)

### Setup

1. **Clone and navigate to backend:**
```bash
cd backend
```

2. **Run setup script:**
```bash
python scripts/setup.py
```

3. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Initialize Firestore database:**
```bash
python scripts/init_firestore.py
```

5. **Start the server:**
```bash
uvicorn app.main:app --reload
```

6. **Test WhatsApp webhook:**
```bash
# In another terminal
ngrok http 8000
# Copy ngrok URL to Twilio webhook settings
```

## 📁 Project Structure

```
backend/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
│
├── app/                        # Main application
│   ├── __init__.py
│   ├── main.py                 # FastAPI app with webhook + REST API
│   ├── config.py               # Settings (Firestore, Gemini, Twilio)
│   └── firestore.py            # Firestore database operations
│
├── agents/                     # AI conversation logic
│   ├── __init__.py
│   ├── whatsapp_agent.py       # WhatsApp conversation state machine
│   └── nlu_agent.py           # Gemini NLU integration
│
├── services/                   # Business logic
│   ├── __init__.py
│   └── availability_service.py # Firestore-based availability checking
│
├── utils/                      # Shared utilities
│   ├── __init__.py
│   ├── state_manager.py        # Firestore conversation state
│   └── helpers.py              # Utility functions
│
└── scripts/                    # Setup and testing
    ├── setup.py                # One-command setup
    ├── init_firestore.py       # Initialize database with sample data
    └── test_workflow.py         # Test the complete workflow
```

## 🎯 Team Development Structure

### **Jazib: WhatsApp Channel Lead** 🟢
**Your Files:**
- `agents/whatsapp_agent.py` - Complete conversation state machine
- `services/whatsapp_service.py` - Twilio integration (to be created)
- Webhook endpoint in `app/main.py` (lines 89-120)

**Your Responsibilities:**
- Implement WhatsApp webhook handler
- Build 6-state conversation machine
- Integrate with Twilio for message sending
- Handle conversation flow: greeting → service → date → time → confirm → complete

### **Ahmad: NLU & Conversation Lead** 🔵  
**Your Files:**
- `agents/nlu_agent.py` - Complete Gemini API integration
- `utils/state_manager.py` - Firestore state management
- `utils/helpers.py` - Utility functions for parsing

**Your Responsibilities:**
- Implement Gemini API integration
- Build intent extraction (greeting, booking, confirmation, etc.)
- Build entity extraction (date, time, service type, customer name)
- Handle Roman Urdu/English mixed language support

### **Taha: Database & Frontend Integration Lead** 🟡
**Your Files:**
- `app/firestore.py` - Firestore database operations
- `services/availability_service.py` - Firestore-based availability checking
- REST API endpoints in `app/main.py` (lines 125-150)

**Your Responsibilities:**
- Implement Firestore database operations
- Build availability checking with Firestore transactions
- Create REST API endpoints for frontend
- Handle booking creation and confirmation
- Connect backend to frontend dashboard

### **Taqi: AI Logic & NLU Lead** 🟣
**Your Files:**
- `agents/nlu_agent.py` - Gemini API integration
- `agents/whatsapp_agent.py` - Conversation state machine
- `utils/helpers.py` - AI utility functions

**Your Responsibilities:**
- Enhance AI logic and conversation flow
- Improve NLU processing with Gemini
- Optimize conversation state management
- Handle complex AI workflows and error cases

## 🔧 API Endpoints

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

## 🧪 Testing

### **Test Complete Workflow:**
```bash
python scripts/test_workflow.py
```

### **Test Individual Components:**
```bash
# Test NLU processing
python -c "from agents.nlu_agent import NLUAgent; print('NLU Agent ready')"

# Test Firestore connection
python -c "from app.firestore import firestore_db; print('Firestore ready')"

# Test availability service
python -c "from services.availability_service import AvailabilityService; print('Availability Service ready')"
```

## 🔑 Environment Variables

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

## 🚀 Development Workflow

### **1. Setup (One-time)**
```bash
python scripts/setup.py              # Setup environment
python scripts/init_firestore.py    # Initialize database
```

### **2. Development**
```bash
uvicorn app.main:app --reload        # Start server
ngrok http 8000                      # Expose for WhatsApp testing
```

### **3. Testing**
```bash
python scripts/test_workflow.py      # Test complete workflow
```

## 📱 WhatsApp Integration

### **Twilio Setup:**
1. Create Twilio account
2. Enable WhatsApp sandbox
3. Get sandbox number and credentials
4. Set webhook URL to your ngrok URL + `/webhook/whatsapp`

### **Test WhatsApp Flow:**
1. Send message to Twilio sandbox number
2. Check server logs for message processing
3. Verify response is sent back

## 🔥 Firestore Setup

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

## 🎯 Core Features

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

## 🚨 Troubleshooting

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

## 📞 Support

For issues or questions:
1. Check server logs for error messages
2. Verify all environment variables are set
3. Test individual components using test scripts
4. Check Firestore console for data

## 🎉 Success Criteria

Your backend is working when:
- ✅ Server starts without errors
- ✅ WhatsApp webhook receives messages
- ✅ NLU agent understands Roman Urdu/English
- ✅ Firestore stores and retrieves data
- ✅ Bookings are created successfully
- ✅ Frontend can query availability
- ✅ No double-bookings occur

**Ready to build your AI WhatsApp booking bot!** 🚀