# BookForMe Backend - Team Assignments

## 🎯 **Team Structure & Responsibilities**

### **Jazib: WhatsApp Channel Lead** 🟢
**Focus:** WhatsApp integration and conversation flow

**Your Files:**
- `agents/whatsapp_agent.py` - Conversation state machine
- `services/whatsapp_service.py` - **CREATE THIS** (Twilio integration)
- Webhook endpoint in `app/main.py` (lines 89-120)

**Your Tasks:**
1. Create `services/whatsapp_service.py` with Twilio integration
2. Test WhatsApp webhook with ngrok
3. Implement message sending via Twilio
4. Test complete conversation flow
5. Handle 6-state conversation machine

**Testing:**
```bash
python scripts/test_components.py  # Test WhatsApp agent
```

---

### **Ahmad: NLU & Conversation Lead** 🔵
**Focus:** Natural Language Understanding with Gemini

**Your Files:**
- `agents/nlu_agent.py` - Gemini API integration
- `utils/state_manager.py` - Firestore state management
- `utils/helpers.py` - Utility functions

**Your Tasks:**
1. Test Gemini API connection
2. Implement intent extraction (greeting, booking, confirmation)
3. Implement entity extraction (date, time, service, customer name)
4. Test Roman Urdu/English mixed language support
5. Test conversation state management

**Testing:**
```bash
python scripts/test_components.py  # Test NLU agent
```

---

### **Taha: Database & Frontend Integration Lead** 🟡
**Focus:** Firestore database and frontend connection

**Your Files:**
- `app/firestore.py` - Firestore database operations
- `services/availability_service.py` - Availability checking
- REST API endpoints in `app/main.py` (lines 125-150)

**Your Tasks:**
1. Test Firestore connection and setup
2. Test database operations (CRUD)
3. Test Firestore transactions (prevent double-booking)
4. Test REST API endpoints for frontend
5. Connect backend to frontend dashboard
6. Handle booking creation and confirmation

**Testing:**
```bash
python scripts/test_components.py  # Test Firestore and availability
```

---

### **Taqi: AI Logic & NLU Lead** 🟣
**Focus:** AI logic enhancement and conversation optimization

**Your Files:**
- `agents/nlu_agent.py` - Gemini API integration
- `agents/whatsapp_agent.py` - Conversation state machine
- `utils/helpers.py` - AI utility functions

**Your Tasks:**
1. Enhance AI conversation logic
2. Improve NLU processing with Gemini
3. Optimize conversation state management
4. Handle complex AI workflows and error cases
5. Improve Roman Urdu/English understanding
6. Optimize conversation flow and user experience

**Testing:**
```bash
python scripts/test_components.py  # Test AI logic
```

## 🚀 **Development Workflow**

### **Phase 1: Individual Testing**
Each team member should:
1. Run `python scripts/setup.py` to setup environment
2. Configure `.env` with API keys
3. Run `python scripts/test_components.py` to test their components
4. Fix any issues found during testing

### **Phase 2: Integration Testing**
Once individual components work:
1. Test WhatsApp webhook end-to-end
2. Test NLU processing with real messages
3. Test booking creation workflow
4. Test frontend API integration

### **Phase 3: End-to-End Testing**
1. Complete WhatsApp conversation flow
2. Test booking creation and confirmation
3. Test double-booking prevention
4. Test frontend integration

## 🔧 **API Keys Needed**

### **Jazib (WhatsApp):**
- Twilio Account SID
- Twilio Auth Token
- Twilio Phone Number

### **Ahmad (NLU):**
- Gemini API Key

### **Taha (Database):**
- Firestore Project ID
- Firestore Service Account JSON

### **Taqi (AI Logic):**
- Gemini API Key (shared with Ahmad)

## 📱 **Testing WhatsApp Flow**

### **Setup:**
1. Start server: `uvicorn app.main:app --reload`
2. Expose webhook: `ngrok http 8000`
3. Update Twilio webhook URL with ngrok URL

### **Test Flow:**
1. Send WhatsApp message to Twilio sandbox number
2. Check server logs for message processing
3. Verify response is sent back
4. Test complete conversation flow

## 🎯 **Success Criteria**

### **Individual Components:**
- ✅ WhatsApp webhook receives messages
- ✅ NLU agent understands messages
- ✅ Firestore stores and retrieves data
- ✅ Availability service checks slots
- ✅ Booking service creates bookings

### **Integration:**
- ✅ Complete WhatsApp conversation flow
- ✅ Booking creation and confirmation
- ✅ Frontend API integration
- ✅ No double-bookings
- ✅ Real-time updates

## 🚨 **Common Issues & Solutions**

### **Firestore Connection Issues:**
- Check `FIRESTORE_PROJECT_ID` in `.env`
- Verify credentials file path
- Ensure Firestore API is enabled

### **Gemini API Issues:**
- Check `GEMINI_API_KEY` in `.env`
- Verify API key is valid
- Check API quota limits

### **Twilio Webhook Issues:**
- Verify ngrok is running
- Check webhook URL in Twilio console
- Ensure server is running on correct port

## 📞 **Getting Help**

If you encounter issues:
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test individual components using the test scripts
4. Check Firestore console for data
5. Review the README for setup instructions

**Ready to build your AI WhatsApp booking bot!** 🚀
