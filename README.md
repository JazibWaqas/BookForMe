# BookForMe - AI-Powered Service Booking Platform

**Last Updated**: December 29, 2025  
**Status**: MVP Development Phase  
**Version**: 1.0.0-beta

---

## 🎯 Core Vision

**BookForMe** is a two-sided marketplace solving the "informal WhatsApp booking problem" in Karachi, Pakistan. We provide:

1. **User App** (React Native) - Centralized marketplace for browsing and booking sports courts, salons, and services
2. **Vendor AI Receptionist** (WhatsApp) - Automated booking agent that handles 24/7 booking requests via WhatsApp Business API
3. **Shared Backend** (FastAPI + Firestore) - Single source of truth ensuring no double-bookings

### The Problem We Solve

Vendors in Karachi currently manage bookings manually via WhatsApp, leading to:
- Double bookings
- Missed messages  
- No centralized availability tracking
- Time-consuming manual coordination

### Our Solution

A dual-app architecture where both the mobile app and WhatsApp agent read/write to the same Firestore database, with **Optimistic Concurrency Control (OCC)** preventing double-bookings using Firestore transactions.

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Mobile App     │────▶│   FastAPI        │◀────│  WhatsApp       │
│  (React Native) │     │   Backend        │     │  AI Agent       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │    ▲
                               │    │
                        ┌──────▼────┴──────┐
                        │   Firestore DB    │
                        │ (Single Source of │
                        │      Truth)       │
                        └───────────────────┘
```

**Key Principle**: Both apps use the same `/slots` collection. When a user locks a slot, it's locked for everyone (app and WhatsApp) via Firestore transactions.

---

## 🛠️ Technology Stack

### Frontend
- **Mobile App**: React Native (Expo) + TypeScript
- **State Management**: TanStack React Query v5 (caching, background refetch)
- **Performance**: In-memory token cache, optimistic updates, smart polling

### Backend
- **API Server**: Python FastAPI (Async)
- **Database**: Google Cloud Firestore (NoSQL)
- **AI Orchestration**: LangGraph (stateful agent workflows)
- **AI Model**: Gemini 1.5 Flash (NLU + Vision OCR)

### Messaging
- **WhatsApp**: Meta Business API (Production)
- **OCR**: Gemini Vision API (payment screenshot validation)

### Deployment
- **Backend**: Railway (`https://jhat-production.up.railway.app`)
- **Mobile**: Expo Go (Dev) → App Store/Play Store (Production)

---

## ✅ What's Done (As of January 15, 2025)

### Backend Infrastructure ✅
- FastAPI backend with modular structure
- Railway deployment (live and operational)
- Firestore database connected and operational
- Meta WhatsApp Business API integrated
- LangGraph agent workflow implemented (`backend/agent/graph.py`)
- Firestore transactions for OCC (`backend/database/slot_service.py`)

### Booking System ✅
- Slot locking mechanism (10-minute hold)
- Payment upload endpoint (`/api/payments/upload`)
- Booking confirmation flow
- Double-booking prevention via transactions
- Real-time slot availability queries

### Mobile App ✅
- Vendor browsing with React Query caching
- Category-based filtering (Padel, Futsal, Cricket, Pickleball)
- Search functionality (name, area, address)
- Vendor detail pages with slot selection
- Booking flow with payment upload
- Profile page with booking history
- Performance optimizations (token caching, background refetch)

### AI Agent ✅
- LangGraph state machine (`backend/agent/graph.py`)
- Intent classification via Gemini NLU
- Entity extraction (date, time, service type)
- Tool calling for availability checks
- WhatsApp webhook integration

---

## 🚧 What Needs to Be Done

### High Priority
1. **Payment OCR Integration** - Connect Gemini Vision API to payment upload flow
2. **Automated Hold Expiry** - Cloud Function to release expired locks

### Medium Priority
1. **Bilingual NLU Enhancement** - Improve Roman Urdu/English code-switching
2. **Matchmaking System** - Elo-based ranked match queue
3. **Social Features** - Forum, matches, leaderboard (UI exists, needs backend)
4. **Vendor Dashboard** - Complete booking management UI

### Low Priority
1. **Analytics Tracking** - User behavior and conversion funnels
2. **Push Notifications** - Expo Notifications integration
3. **Image Upload** - Vendor photos and payment screenshots

---

## 📁 Repository Navigation - Quick Context Guide

**Need to find something? Use this map:**

### 🎯 Core Documentation (Start Here)
- **`README.md`** (this file) - Project overview, architecture, quick start
- **`PROJECT_STATUS.md`** - What's done, what needs doing, with dates
- **`DATABASE_CONTEXT.md`** - Critical database issues (timezone, indexes, OCC)

### 📱 Mobile App (`App/`)
- **`App/README.md`** - Mobile app structure, features, development guide
- **Key Code**:
  - `App/app/(tabs)/home.tsx` - Home screen with vendor browsing
  - `App/app/vendor/[id].tsx` - Vendor detail with slot selection
  - `App/app/vendor/booking.tsx` - Booking flow
  - `App/hooks/useQueries.ts` - React Query hooks (caching logic)
  - `App/config/api.ts` - API client with token caching

### 🔧 Backend (`backend/`)
- **`backend/README.md`** - Backend architecture, API endpoints, status
- **`backend/agent/README.md`** - LangGraph workflow, nodes, state, tools
- **`backend/database/README.md`** - Firestore operations, OCC, critical issues
- **`backend/nlu/README.md`** - Intent classification, entity extraction, prompts
- **`backend/whatsapp/README.md`** - Webhook handler, Meta API integration
- **`backend/app/README.md`** - FastAPI app structure
- **`backend/scripts/README.md`** - Utility scripts documentation

**Key Code**:
- `backend/agent/graph.py` - LangGraph workflow definition
- `backend/agent/nodes.py` - Agent node functions (intent, query, response)
- `backend/database/slot_service.py` - Slot locking/booking with OCC ⭐
- `backend/database/rest_api.py` - REST API endpoints
- `backend/nlu/agent.py` - Gemini NLU integration
- `backend/whatsapp/webhook.py` - WhatsApp webhook handler

### 🗄️ Database (`backend/database/`)
- **`backend/database/DATABASE_DOCUMENTATION.md`** - Complete schema reference (1100+ lines)
- **`backend/database/README.md`** - Implementation context, critical issues
- **Critical Issues** (see `DATABASE_CONTEXT.md`):
  - Timezone bug: `seed/slot_generator.py:76` - naive datetime
  - Missing indexes: Composite indexes not verified
  - Hold expiry: Not automated (needs Cloud Function)

### 📚 Reference Materials
- **`wireframes/README.md`** - UI wireframe reference
- **`backend/conversations/README.md`** - Conversation analysis and prompts
- **`FYP Refrence Projects/`** - Reference projects (archive candidates)

---

## 🗺️ Quick Context Finder - Where to Look

### Before Starting Any Work

**CRITICAL - Read First**:
1. **`DATABASE_CONTEXT.md`** - Timezone bugs, missing indexes, hold expiry issues
2. **`PROJECT_STATUS.md`** - What's actually done vs. what needs doing
3. **Folder README** - Context for the area you're working on

### Implementing Features

**Booking/Slot Operations**:
→ `backend/database/README.md` - OCC patterns, transaction examples
→ `backend/database/slot_service.py` - Reference implementation
→ `DATABASE_CONTEXT.md` - Critical issues to avoid

**AI Agent Workflow**:
→ `backend/agent/README.md` - LangGraph structure, nodes, state
→ `backend/nlu/README.md` - Intent classification, prompts
→ `backend/agent/nodes.py` - Response generation (hardcoded)

**Mobile App Features**:
→ `App/README.md` - Component structure, React Query patterns
→ `App/hooks/useQueries.ts` - Data fetching hooks
→ Existing screens - Copy patterns from similar features

**Database Queries**:
→ `backend/database/DATABASE_DOCUMENTATION.md` - Complete schema
→ `backend/database/README.md` - Query patterns, indexing
→ `DATABASE_CONTEXT.md` - Timezone/indexing issues

### Fixing Bugs

**Timezone Issues**:
→ `DATABASE_CONTEXT.md` Issue #1 → `backend/database/seed/slot_generator.py:76`

**Slow Queries**:
→ `DATABASE_CONTEXT.md` Issue #2 → Check Firestore indexes

**Expired Locks**:
→ `DATABASE_CONTEXT.md` Issue #3 → `backend/database/slot_service.py:381`

**Agent Misunderstanding**:
→ `backend/nlu/README.md` → Update prompts in `backend/nlu/agent.py`

### Understanding Architecture

**System Overview**:
→ This file (`README.md`) - Architecture diagram
→ `PROJECT_STATUS.md` - Implementation status

**Backend Details**:
→ `backend/README.md` - API endpoints, structure
→ `backend/agent/README.md` - LangGraph workflow
→ `backend/database/README.md` - Database operations

**Database Schema**:
→ `backend/database/DATABASE_DOCUMENTATION.md` - Complete reference (1100+ lines)
→ `DATABASE_CONTEXT.md` - Critical implementation issues

---

## 📋 Documentation Structure

**One README per folder** - Each provides complete context for that area:

```
JHAT/
├── README.md                    # This file - navigation & overview
├── PROJECT_STATUS.md             # Progress tracking with dates
├── DATABASE_CONTEXT.md           # Critical database issues
│
├── App/
│   └── README.md                # Mobile app context
│
├── backend/
│   ├── README.md                # Backend overview
│   ├── agent/README.md          # LangGraph agent context
│   ├── database/
│   │   ├── README.md            # Database operations context
│   │   └── DATABASE_DOCUMENTATION.md  # Complete schema (reference)
│   ├── nlu/README.md            # NLU module context
│   ├── whatsapp/README.md       # WhatsApp integration context
│   ├── app/README.md            # FastAPI app context
│   └── scripts/README.md         # Utility scripts
│
├── wireframes/README.md          # Wireframe reference
└── backend/conversations/README.md  # Conversation analysis
```

**Total**: ~15 essential MD files (down from 49)

---

## 🚀 Quick Start

### Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Start server
uvicorn backend.app.main:app --reload
```

### Mobile App Setup
```bash
cd App
npm install
npm start
# Scan QR code with Expo Go app
```

### Database Setup
```bash
# Initialize Firestore with sample data
python backend/scripts/init_firestore.py

# Populate with test data
python backend/scripts/seed_all.py
```

---

## 📊 Current Progress

- **Backend**: 85% Complete (LangGraph implemented, transactions working)
- **Mobile App**: 70% Complete (Core booking flow functional)
- **AI Agent**: 60% Complete (LangGraph working, needs OCR integration)
- **Payment OCR**: 0% Complete (Not started)
- **Social Features**: 30% Complete (UI exists, backend incomplete)

**Overall MVP Progress**: ~65% Complete

---

## 🔑 Critical Technical Details

### Optimistic Concurrency Control
All booking writes use Firestore transactions to prevent double-bookings:
```python
@firestore.transactional
def lock_slot(transaction, slot_id, user_id):
    slot = firestore.get(slot_id)
    if slot.status == AVAILABLE:
        slot.status = LOCKED
        transaction.update(slot)
```

### Slot State Machine
```
available → locked (10 min) → pending (payment uploaded) → confirmed (vendor approves) → completed
```

### Shared Database
Both mobile app and WhatsApp agent read/write to `/slots` collection. Consistency guaranteed via transactions.

---

## 🎯 Quick Context for Implementation Work

**Essential context before starting any feature:**

### Critical Issues (Must Know)
- **Hold Expiry**: Not automated → See `DATABASE_CONTEXT.md` Issue #3
- **Timezone Fix**: ✅ Completed (December 29, 2025) - All datetimes now stored as UTC
- **Composite Indexes**: ✅ Completed (December 29, 2025) - Firestore indexes created and deployed

### Key Patterns (Copy These)

**Transaction Pattern** (for slot operations):
```python
# See: backend/database/slot_service.py:37
@firestore.transactional
def lock_slot(transaction, slot_id, user_id):
    slot_ref = db.collection('slots').document(slot_id)
    slot_doc = slot_ref.get(transaction=transaction)
    if slot_doc.get('status') != 'available':
        return {'success': False}
    transaction.update(slot_ref, {'status': 'locked'})
```

**React Query Pattern** (for mobile app):
```typescript
// See: App/hooks/useQueries.ts
const { data, isLoading } = useVendors();
// Auto-cached, background refetch, deduplication
```

**LangGraph Node Pattern**:
```python
# See: backend/agent/nodes.py:161
async def classify_intent_node(state: AgentState) -> AgentState:
    nlu_result = await nlu_agent.extract_intent(message, history)
    return {**state, "current_intent": nlu_result["intent"]}
```

### File Locations (Where to Edit)

**Slot Operations**: `backend/database/slot_service.py`
**REST API**: `backend/database/rest_api.py`
**LangGraph Agent**: `backend/agent/graph.py`, `backend/agent/nodes.py`
**NLU Prompts**: `backend/nlu/agent.py` (lines 109-191)
**Mobile Screens**: `App/app/(tabs)/`, `App/app/vendor/`
**React Query Hooks**: `App/hooks/useQueries.ts`

### Common Gotchas

1. **Always use UTC timestamps** - Never naive datetime
2. **Always use transactions** - For any slot status change
3. **Check hold expiry** - Before accepting payment
4. **Verify indexes exist** - Before deploying queries
5. **State mutation** - LangGraph nodes return new state, don't mutate

---

## 📚 Documentation Quick Reference

**Essential docs (read in this order):**

1. **`DATABASE_CONTEXT.md`** ⚠️ **READ FIRST** - Critical issues (timezone, indexes)
2. **`PROJECT_STATUS.md`** - What's done vs. what needs doing (with dates)
3. **Folder READMEs** - Context for specific area:
   - `backend/agent/README.md` - LangGraph workflow
   - `backend/database/README.md` - Database operations  
   - `backend/nlu/README.md` - Intent classification
   - `App/README.md` - Mobile app structure

**Complete References** (use as needed):
- `backend/database/DATABASE_DOCUMENTATION.md` - Full schema (1100+ lines)
- `wireframes/README.md` - UI wireframe reference

---

## 🧪 Testing

### Backend API
```bash
# Health check
curl http://localhost:8000/health

# Test slot locking
curl -X POST http://localhost:8000/api/slots/{slot_id}/lock \
  -H "Authorization: Bearer {token}"
```

### Mobile App
- Test on Expo Go app (iOS/Android)
- Test booking flow end-to-end
- Verify slot locking prevents double-booking

---

## 📞 Resources

- **Repository**: https://github.com/JazibWaqas/JHAT
- **Backend API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Firestore Console**: [Google Cloud Console](https://console.cloud.google.com/firestore)
- **Meta Developer**: [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

---

## 🎯 Success Criteria

MVP is complete when:
- ✅ User can browse and book via Mobile App (DONE)
- ✅ User can book via WhatsApp Agent (DONE)
- ✅ No double-bookings occur (DONE - tested)
- ⏳ Payment validation works via OCR (IN PROGRESS)
- ⏳ Bilingual conversations work robustly (PARTIAL)
- ✅ Booking confirmations sent (DONE)

---

**Last Updated**: December 29, 2025  
**Maintained By**: Development Team  
**Questions?** Check folder-specific README files for detailed documentation.
