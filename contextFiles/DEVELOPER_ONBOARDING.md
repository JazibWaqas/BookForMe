# 🚀 JHAT Developer Onboarding Guide

**Purpose**: Complete setup and development guide for new developers  
**Last Updated**: February 20, 2026  
**Target**: Get any developer productive in <30 minutes

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Clone Repository
git clone https://github.com/JazibWaqas/JHAT.git
cd JHAT

# 2. Backend Setup
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env
uvicorn app.main:app --reload --port 8000

# 3. Mobile App Setup
cd ../App
npm install
npm start

# 4. Test Everything
# Backend: http://localhost:8000/docs
# Mobile: Expo Go app
# AI Agent: python backend/scripts/chat_terminal.py
```

---

## 📚 ESSENTIAL DOCUMENTATION (Read in Order)

### 1. **System Architecture** (15 min read)
👉 **[ARCHITECTURE_MASTER_SPEC.md](./ARCHITECTURE_MASTER_SPEC.md)**  
*Must read first. Contains all technical rules, database schema, AI system design.*

### 2. **Current Status** (5 min read)
👉 **[PROJECT_STATUS_REPORT.md](./PROJECT_STATUS_REPORT.md)**  
*What's done, what's in progress, current blockers.*

### 3. **Active Development** (10 min read)
👉 **[VENDOR_DASHBOARD_PLAN.md](./VENDOR_DASHBOARD_PLAN.md)**  
*Current development focus and technical requirements.*

---

## 🏗️ PROJECT STRUCTURE

```
JHAT/
├── 📄 ARCHITECTURE_MASTER_SPEC.md    # Single source of truth
├── 📄 PROJECT_STATUS_REPORT.md       # Current progress
├── 📄 VENDOR_DASHBOARD_PLAN.md       # Active roadmap
├── 📄 CONVERSATION_SYSTEM_COMPLETE.md # AI conversation system
├── 📄 DEVELOPER_ONBOARDING.md        # This file
├── backend/                          # FastAPI + AI agent
│   ├── agent/                        # LangGraph AI agent
│   ├── nlu/                          # Natural language understanding
│   ├── database/                     # Firestore operations
│   ├── whatsapp/                     # WhatsApp integration
│   ├── app/                          # FastAPI application
│   └── scripts/                      # Utility scripts
├── App/                             # React Native mobile app
│   ├── app/                          # Expo Router screens
│   ├── components/                   # Reusable components
│   ├── services/                     # API clients
│   └── hooks/                        # React Query hooks
├── frontend/                        # Vendor dashboard (React)
└── docs/archive/                    # Historical documentation
```

---

## 🔧 DEVELOPMENT ENVIRONMENT SETUP

### Prerequisites
- **Python 3.9+** for backend
- **Node.js 16+** for mobile app
- **Expo CLI** for mobile development
- **Git** for version control
- **VS Code** (recommended) with extensions

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json"
  ]
}
```

### Environment Variables

#### Backend (.env)
```bash
# Firebase
FIRESTORE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# AI Services
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# App Configuration
ENVIRONMENT=development
DEBUG=true
```

#### Mobile App (App/config.js)
```javascript
export const config = {
  API_BASE_URL: 'http://localhost:8000',  // Development
  // API_BASE_URL: 'https://jhat-to9p.onrender.com',  // Production
  
  FIREBASE_CONFIG: {
    apiKey: "...",
    authDomain: "...",
    projectId: "..."
  }
};
```

---

## 🚀 RUNNING THE SYSTEM

### 1. Backend Server
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**Verify**: Visit http://localhost:8000/docs for API documentation

### 2. Mobile App
```bash
cd App
npm install
npm start
```

**Verify**: Scan QR code with Expo Go app on phone

### 3. Test AI Agent
```bash
cd backend
python scripts/chat_terminal.py
```

**Test Messages**:
- "Aoa want to book a slot from 8-9 today"
- "padel available tomorrow?"
- "how much for futsal?"

### 4. Database Operations
```bash
# Initialize database (first time only)
python backend/scripts/init_firestore.py

# Seed with test data
python backend/scripts/seed_all.py

# Check database status
python backend/scripts/check_db.py
```

---

## 🧪 TESTING GUIDE

### Backend Testing
```bash
# Test API endpoints
python backend/scripts/test_api.py

# Test booking workflow
python backend/scripts/test_workflow.py

# Test NLU system
python backend/scripts/test_nlu.py

# Test database integrity
python backend/scripts/master_forensic_verification
```

### Mobile App Testing
```bash
cd App
# Run tests (if implemented)
npm test

# Check TypeScript types
npx tsc --noEmit

# Lint code
npm run lint
```

### Manual Testing Checklist
- [ ] Backend API loads at http://localhost:8000/docs
- [ ] Mobile app loads in Expo Go
- [ ] AI agent responds in chat terminal
- [ ] Database has test data
- [ ] WhatsApp webhook receives messages (test with ngrok)

---

## 🔗 KEY SYSTEM INTERACTIONS

### 1. Complete Booking Flow
```
User Message → WhatsApp → NLU → LangGraph Agent → Firestore → Response → WhatsApp
```

### 2. Mobile App Booking
```
Mobile App → API Endpoint → Firestore → Slot Lock → Payment Upload → Confirmation
```

### 3. Vendor Dashboard
```
Dashboard → API → Firestore → Booking List → Payment Verification → Approval
```

---

## 📱 MOBILE APP DEVELOPMENT

### Key Screens
- **Home** (`app/(tabs)/home.tsx`) - Vendor browsing
- **Vendor Detail** (`app/vendor/[id].tsx`) - Booking flow
- **Bookings** (`app/bookings/index.tsx`) - User bookings
- **Profile** (`app/(tabs)/profile.tsx`) - User profile
- **Chatbot** (`app/(tabs)/chatbot.tsx`) - AI assistant

### Common Patterns
```typescript
// API call with React Query
const { data: vendors, isLoading } = useVendors();

// Navigation
const router = useRouter();
router.push('/vendor/[id]', { id: vendorId });

// State management
const [selectedDate, setSelectedDate] = useState(new Date());
```

### Styling Guidelines
- Use existing colors from `constants/colors.ts`
- Follow component patterns in `components/ui/`
- Maintain dark theme consistency
- Test on multiple screen sizes

---

## 🤖 AI AGENT DEVELOPMENT

### Key Files
- **Agent Graph**: `backend/agent/graph.py`
- **Agent Nodes**: `backend/agent/nodes.py`
- **NLU System**: `backend/nlu/agent.py`
- **WhatsApp Handler**: `backend/whatsapp/agent.py`

### Adding New Intents
1. Update intent classification prompt in `nlu/agent.py`
2. Add handling logic in `agent/nodes.py`
3. Test with `scripts/test_nlu.py`
4. Update conversation documentation

### Testing AI Changes
```bash
# Quick test
python backend/scripts/chat_terminal.py

# Comprehensive test
python backend/scripts/test_workflow.py
```

---

## 🗄️ DATABASE OPERATIONS

### Key Collections
- **users** - Customer and vendor accounts
- **vendors** - Sports venue information
- **slots** - Time slot inventory
- **bookings** - Booking records
- **payments** - Payment information

### Common Operations
```python
# Check availability
available_slots = availability_service.check_availability(
    vendor_id="capital-padel",
    date="2026-02-13",
    service_type="padel"
)

# Lock a slot
result = slot_service.lock_slot(
    slot_id="20260213_1900_capital-padel_court-1",
    user_id="user_123"
)

# Create booking
booking = booking_service.create_booking(
    slot_id="slot_123",
    user_id="user_123",
    payment_details=payment_info
)
```

### Database Rules
- **Always use transactions** for slot writes
- **Store timestamps in UTC**
- **Never create orphan references**
- **Validate all inputs**

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Backend Issues
**Problem**: `401 Unauthorized` from Groq API  
**Solution**: Check `GROQ_API_KEY` in `.env` file

**Problem**: Firestore connection failed  
**Solution**: Verify `FIRESTORE_PROJECT_ID` and credentials

**Problem**: WhatsApp webhook not working  
**Solution**: Use ngrok for local testing: `ngrok http 8000`

### Mobile App Issues
**Problem**: "Network request failed"  
**Solution**: Check API_BASE_URL in config, ensure backend is running

**Problem**: Expo build fails  
**Solution**: Clear cache: `expo start -c`

**Problem**: TypeScript errors  
**Solution**: Run `npx tsc --noEmit` to check types

### AI Agent Issues
**Problem**: Wrong intent classification  
**Solution**: Check prompts in `nlu/agent.py`, test with `test_nlu.py`

**Problem**: Agent not responding  
**Solution**: Check conversation state in Firestore, verify phone number format

---

## 📊 PERFORMANCE MONITORING

### Backend Performance
- **API Response Time**: Should be <200ms
- **AI Response Time**: Should be <2s
- **Database Queries**: Should be <50ms

### Mobile App Performance
- **App Load**: Should be <2 seconds
- **Screen Transitions**: Should be <500ms
- **API Calls**: Should show loading states

### Monitoring Tools
- **Backend Logs**: Console output and error tracking
- **Mobile Logs**: Expo development server
- **Database**: Google Cloud Console

---

## 🔒 SECURITY BEST PRACTICES

### API Security
- **Never commit API keys** to repository
- **Use environment variables** for all secrets
- **Validate all inputs** on server side
- **Use HTTPS** in production

### Mobile App Security
- **Store tokens securely** with AsyncStorage
- **Validate API responses** before using
- **Don't log sensitive information**
- **Use certificate pinning** in production

### Database Security
- **Use Firestore security rules**
- **Validate user permissions**
- **Never expose PII** in document IDs
- **Use transactions** for critical operations

---

## 🚀 DEPLOYMENT

### Backend Deployment
```bash
# Deploy to Render
git push origin main  # Auto-deploys to Render

# Manual deployment (if needed)
render deploy
```

### Mobile App Deployment
```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to stores
eas submit --platform android
```

### Environment Checklist
- [ ] Production API keys configured
- [ ] Firestore security rules deployed
- [ ] Domain names configured
- [ ] SSL certificates installed
- [ ] Monitoring and alerting setup

---

## 📞 GETTING HELP

### Documentation First
1. **ARCHITECTURE_MASTER_SPEC.md** - Technical questions
2. **PROJECT_STATUS_REPORT.md** - Current progress
3. **CONVERSATION_SYSTEM_COMPLETE.md** - AI system questions

### Team Communication
- **Technical Issues**: Create GitHub issue
- **Questions**: Use GitHub Discussions
- **Urgent**: Contact team lead directly

### External Resources
- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **Expo Documentation**: https://docs.expo.dev
- **Firestore Documentation**: https://firebase.google.com/docs/firestore
- **LangGraph Documentation**: https://langchain-ai.github.io/langgraph/

---

## 🎯 FIRST WEEK TASKS

### Day 1: Setup & Orientation
- [ ] Set up development environment
- [ ] Read core documentation
- [ ] Run all systems locally
- [ ] Make first test booking

### Day 2-3: Code Exploration
- [ ] Explore backend code structure
- [ ] Understand mobile app architecture
- [ ] Test AI agent with various messages
- [ ] Review database schema

### Day 4-5: First Contribution
- [ ] Pick a small bug or enhancement
- [ ] Implement and test your change
- [ ] Submit pull request
- [ ] Get code review and merge

---

## 🏆 SUCCESS METRICS

### Developer Onboarding Success
- **Setup Time**: <30 minutes
- **First Contribution**: Within 1 week
- **System Understanding**: Can explain architecture
- **Independent Work**: Can complete tasks without guidance

### Code Quality Standards
- **Test Coverage**: >80% for new code
- **Documentation**: All public functions documented
- **Type Safety**: No TypeScript errors
- **Performance**: Meets response time targets

---

**Welcome to the JHAT team! We're excited to have you contribute to transforming how Pakistan books sports facilities.**

---

*Last Updated: February 20, 2026*  
*Questions? Check ARCHITECTURE_MASTER_SPEC.md first, then ask the team.*
