# 🎾 BookForMe – AI-Powered Sports Booking Platform

**Current Status**: 🟢 **Production Live & Actively Developing** (v2.0)  
**Last Updated**: February 20, 2026  
**Deployment**: [https://bookforme-ie34.onrender.com](https://bookforme-ie34.onrender.com)

---

## 🎯 The Vision

BookForMe is a **unified two-sided marketplace** solving the "informal booking chaos" in Karachi's sports scene. We seamlessly connect:

1. **Mobile App Users** (React Native) - Browse, search, and book
2. **Web Chat Users** (AI Receptionist) - Natural language booking via [deployed chat](https://bookforme-ie34.onrender.com/chat/index.html)
3. **Sports Vendors** (Web Dashboard) - Manage venues and revenue

All three interface with a **single, structurally rigorous Firestore database** with **zero double-bookings**.

---

## 🏗️ System Architecture at a Glance

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │    │  WhatsApp AI     │    │ Vendor Dashboard │
│  (React Native) │    │   (LangGraph)    │    │      (Web)      │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Firestore Database      │
                    │   (Single Source of Truth)│
                    └───────────────────────────┘
```

---

## 🚀 Quick Start (Fresh Session)

### For Developers
```bash
# 1. Backend Setup
cd backend

python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

#for testing chat locally 
python backend/scripts/chat_web.py

# 2. Mobile App Setup  
cd App
npm install
npm start

# 3. Database Setup
# Do not run seed scripts casually against the live project.
# Read backend/database/seed/README.md first.
# Routine slot maintenance uses the additive smart reseed path:
python backend/database/seed/smart_reseed.py
```

### For Users
- **Customers**: Use the [AI Chat](https://bookforme-ie34.onrender.com/chat/index.html) to book via natural language
- **Vendors**: Manage bookings via the [web dashboard](https://bookforme-ie34.onrender.com)
- **Browse Available Courts**: Visit [Live Demo](https://bookforme-ie34.onrender.com/docs)

---

## 📚 Current Documentation

Start with these files. They describe the current system.

- [backend/README.md](./backend/README.md) - active backend overview.
- [backend/agent/README.md](./backend/agent/README.md) - current LangGraph booking agent.
- [backend/database/README.md](./backend/database/README.md) - current Firestore shape.
- [backend/database/seed/README.md](./backend/database/seed/README.md) - safe slot maintenance.
- [backend/scripts/README.md](./backend/scripts/README.md) - local testing scripts.

`contextFiles/` and `backend/conversations/` contain historical planning and
prompt research. They may mention older providers or prototype ideas and should
not override the current docs above.

### 📄 **Kaavish / FYP LaTeX report**
👉 **[Final Report/README.md](./Final Report/README.md)**  
*LaTeX sources: open `Final Report/report/`, compile `report.tex`*

---

## 🎪 What Makes BookForMe Different

### 🤖 **AI-Powered Natural Language Booking**
- **Roman Urdu + English**: Handle code-switching naturally
- **Context-Aware**: Remembers conversation across messages
- **Smart Entity Extraction**: Dates, times, services from messy input
- **Example**: "Aoa kal sham paddle chahiye" → Perfect booking

### 🔒 **Zero Double-Bookings Guarantee**
- **Optimistic Concurrency Control**: Firestore transactions
- **10-Minute Slot Locks**: Prevent race conditions
- **Real-Time Sync**: App, AI Chat, and Dashboard see same data
- **Tested Under Load**: 100+ concurrent booking attempts

### 📱 **Dual Interface Strategy**
- **AI Chat**: Frictionless natural language booking via the web
- **Mobile App**: Rich UI for browsing and discovery
- **Vendor Dashboard**: Professional venue management
- **Shared Inventory**: Single source prevents overbooking

### 📸 **Screenshot-Based Payments**
- **OCR Verification**: Groq vision validates payment screenshot amounts
- **Multiple Methods**: JazzCash, EasyPaisa, Bank Transfer
- **Auto-Approval**: High-confidence matches processed instantly
- **Manual Review**: Edge cases handled by vendors

---

## 🏆 Core Technologies

| Component | Technology | Purpose |
|------------|-------------|---------|
| **Backend** | Python FastAPI | High-performance async API |
| **Database** | Google Cloud Firestore | Real-time, scalable NoSQL |
| **AI Engine** | LangGraph + DeepSeek text model | Stateful conversations |
| **OCR** | Groq vision model | Payment verification |
| **Mobile** | React Native (Expo) | Cross-platform mobile app |
| **Frontend** | React + TypeScript | Vendor dashboard |
| **Authentication** | Firebase Auth + JWT | Secure user management |

---

## � Current Capabilities

### ✅ **Fully Functional**
- **Complete Booking Flow**: Browse → Select → Lock → Pay → Confirm
- **AI Chat Agent**: Natural language booking with Roman Urdu support
- **Mobile App**: Vendor browsing, search, booking, profile
- **Payment System**: Screenshot upload and OCR verification
- **Vendor Dashboard**: Basic booking management and analytics
- **Real-Time Sync**: All interfaces share same inventory

### 🚧 **In Development**
- **Advanced Vendor Analytics**: Revenue trends and customer insights
- **Payment OCR Robustness**: More screenshot formats and clearer failure handling
- **Push Notifications**: Booking reminders and updates

---

## 🎯 Key User Flows

### Customer Booking via App
```
Home → Search/Browse → Vendor Detail → Select Date/Time 
→ Lock Slot (10 min) → Upload Payment → Booking Confirmed
```

### Customer Booking via AI Chat
```
Send Message → AI Understands → Check Availability 
→ Confirm Details → Share Payment Info → Receive Screenshot 
→ Verify & Confirm
```

### Vendor Management
```
Dashboard → View Bookings → Verify Payments → Manage Calendar 
→ View Analytics → Respond to Customers
```

### Mobile vendor home (Expo)
The RN vendor dashboard home calls `GET /api/vendors/{vendor_id}/analytics/today` for KPIs, upcoming today, and the needs-attention list (`pending_items`). The `available_today` metric counts unbooked slots (`available` or `cancelled`) for the Karachi calendar day whose start time is at or after the current Karachi clock time. Notifications use `GET /api/social/notifications?user_id=...` and `PATCH /api/social/notifications/{notification_id}/read` (JWT). Missing slot generation uses `POST /api/vendors/{vendor_id}/smart-reseed` (vendor owner JWT).

---

## 🔧 Development Workflow

### Adding New Features
1. **Update ARCHITECTURE_MASTER_SPEC.md** first (design decisions)
2. **Implement backend changes** (API, database, AI)
3. **Update mobile app** (UI, API integration)
4. **Test end-to-end** (all three interfaces)
5. **Update PROJECT_STATUS_REPORT.md** (track progress)

### Code Organization
```
JHAT/
├── 📄 ARCHITECTURE_MASTER_SPEC.md    # Single source of truth
├── 📄 PROJECT_STATUS_REPORT.md       # Current progress
├── 📄 VENDOR_DASHBOARD_PLAN.md       # Active roadmap
├── backend/                          # FastAPI + AI agent
├── App/                             # React Native mobile app
├── frontend/                         # Vendor dashboard (React)
└── docs/archive/                     # Historical documentation
```

---

## 📈 Performance & Scale

### Current Performance
- **API Response Time**: <200ms (p95)
- **AI Response Time**: 1-2s (including LLM)
- **Database Queries**: <50ms (with indexes)
- **Mobile App Load**: <2 seconds (cold start)

### Scalability Features
- **Horizontal Scaling**: Render auto-scaling
- **Database Sharding**: Firestore natural scaling
- **CDN Integration**: Global content delivery
- **Caching Strategy**: React Query + in-memory token cache

---

## 🔒 Security & Reliability

### Data Protection
- **PII Protection**: Phone numbers not used as document IDs
- **Encrypted Storage**: Payment screenshots encrypted at rest
- **Input Validation**: All endpoints validate inputs
- **SQL Injection Prevention**: NoSQL injection protection

### Reliability Features
- **Transaction Safety**: All booking writes use transactions
- **Error Recovery**: Graceful degradation on AI failures
- **Monitoring**: Real-time error tracking and alerting
- **Backup Strategy**: Automated daily backups

### Slot Cleanup (Cron)
Expired slot locks are released by hitting the cleanup endpoint. **Use an external cron service** (e.g. [cron-job.org](https://cron-job.org)) to call it **every 10 minutes**.

1. **URL**: `https://jhat-to9p.onrender.com/internal/cleanup-expired-locks`
2. **Method**: GET
3. **Schedule**: Every 10 minutes (cron: `*/10 * * * *`)
4. **Optional auth**: Set `CLEANUP_CRON_SECRET` in Render env vars, then add header `X-Cron-Secret: <your-secret>` in the cron job.

---

## 🤝 Contributing to BookForMe

### Development Setup
```bash
# Clone and setup
git clone https://github.com/JazibWaqas/JHAT.git
cd JHAT

# Install dependencies
pip install -r backend/requirements.txt
cd App && npm install

# Configure environment
cp backend/.env.example backend/.env
# Add your API keys to .env
```

### Testing
```bash
# Test AI agent locally
python backend/scripts/chat_terminal.py

# Test API endpoints
python backend/scripts/test_api.py

# Verify database integrity
python backend/scripts/master_forensic_verification
```

### Code Standards
- **TypeScript**: Full type safety in frontend and mobile app
- **Python**: Type hints and async/await patterns
- **Documentation**: Update ARCHITECTURE_MASTER_SPEC.md for changes
- **Testing**: Unit tests for all business logic

---

## 📞 Support & Community

### Getting Help
- **Documentation**: Start with ARCHITECTURE_MASTER_SPEC.md
- **Issues**: [GitHub Issues](https://github.com/JazibWaqas/JHAT/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JazibWaqas/JHAT/discussions)
- **Status**: Check PROJECT_STATUS_REPORT.md for latest progress



## � What's Next?

### Immediate Priorities (Next 30 Days)
1. **Complete Vendor Dashboard** - Advanced analytics and bulk operations
2. **Payment OCR Enhancement** - 90%+ accuracy, auto-approval
3. **Mobile App Polish** - Push notifications, offline support

### Medium Term (Next 90 Days)
1. **Social Features Launch** - Matchmaking, leaderboards, chat
2. **Advanced AI** - Proactive suggestions, multi-venue booking
3. **Analytics Platform** - Business intelligence for vendors

### Long Term Vision
1. **City-Wide Expansion** - All major Karachi areas
2. **Multi-Sport Support** - All major sports in Pakistan
3. **Enterprise Features** - Tournament management, advanced analytics

---

**BookForMe is transforming how Pakistan books sports facilities - one conversation at a time.**

---


How to run the database population
The CLI now defaults to dry-run. Running this does not write:
python backend/database/seed/smart_reseed.py
To actually create missing slots, you must explicitly run:
python backend/database/seed/smart_reseed.py --write
If you need more future days:
python backend/database/seed/smart_reseed.py --days-ahead 45 --write
I also verified the generated slot shape in memory, without touching Firestore:

Required fields present: yes
Bad resource references: 0
Bad statuses: 0
Bad IDs: 0
Slot ID format sample: 20260508_07_ace_padel_dha_ace_court_1
Firestore batch supports create: yes
So yes: if you need to generate more slots, smart_reseed.py --write is the script to use. It generates the fields your system actually reads: vendor_id, service_id, resource_id, date, start_time, end_time, price, status=available, user_id=None, payment_id=None, hold_expires_at=None.

The big rule: do not use seed_all.py, safe_slot_seed.py, or clear_slots.py for adding future slots. Those are now guarded, but conceptually they’re rebuild/reset tools. For your real need, use only smart_reseed.py, dry-run first, then --write.

*Last Updated: February 20, 2026*  
*Next Status Review: March 20, 2026*  
*For technical details: See [ARCHITECTURE_MASTER_SPEC.md](./ARCHITECTURE_MASTER_SPEC.md)*
