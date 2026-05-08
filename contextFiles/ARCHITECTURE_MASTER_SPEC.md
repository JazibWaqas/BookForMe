# 🧠 JHAT (BookForMe) - Architecture Master Specification

**Version**: 2.0 (February 2026)  
**Purpose**: Complete technical foundation and system rules  
**Scope**: Single source of truth for all architectural decisions

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Identity & Authentication Model](#2-identity--authentication-model)
3. [Database Architecture](#3-database-architecture)
4. [AI Agent System](#4-ai-agent-system)
5. [Booking State Machine](#5-booking-state-machine)
6. [Concurrency Control](#6-concurrency-control)
7. [Temporal Logic](#7-temporal-logic)
8. [API Architecture](#8-api-architecture)
9. [Mobile App Architecture](#9-mobile-app-architecture)
10. [Conversation System](#10-conversation-system)
11. [Payment System](#11-payment-system)
12. [Error Handling](#12-error-handling)
13. [Performance Rules](#13-performance-rules)
14. [Security Model](#14-security-model)
15. [Deployment Architecture](#15-deployment-architecture)

---

## 1. SYSTEM OVERVIEW

### 1.1 Core Vision
BookForMe is a **dual-interface sports booking platform** serving Karachi, Pakistan:
- **Mobile App**: React Native marketplace for browsing and booking
- **WhatsApp AI**: Conversational booking agent for same inventory
- **Vendor Dashboard**: Web interface for venue management

### 1.2 Technical Stack
- **Backend**: Python FastAPI (async)
- **Database**: Google Cloud Firestore
- **AI**: LangGraph + Groq (Qwen 3 32B) + Gemini (Vision OCR)
- **Mobile**: React Native (Expo)
- **Frontend**: React (Vendor Dashboard)
- **Authentication**: Firebase Auth + JWT

### 1.3 Core Architectural Principles
1. **Single Source of Truth**: All interfaces share the same Firestore database
2. **Optimistic Concurrency Control**: Prevent double-bookings via transactions
3. **Bilingual Support**: Roman Urdu + English code-switching
4. **Stateful Conversations**: LangGraph maintains booking context
5. **Screenshot-based Payments**: OCR verification for payment proofs

---

## 2. IDENTITY & AUTHENTICATION MODEL

### 2.1 User Document Strategy
```javascript
// users/{uid} - Firestore auto-generated UID
{
  phone: "+923001234567",        // Indexed field, NOT document ID
  email: "user@example.com",
  name: "Full Name",
  role: "customer" | "vendor" | "admin",
  vendor_id: "capital-padel",    // null for customers
  
  // Gamification (always present)
  points: 1250,
  level: 3,
  skill_rating: 4.2,
  badges: ["early_bird", "regular"],
  
  // Social (always present)
  is_online: true,
  last_active: timestamp,
  avatar_url: "https://...",
  bio: "Optional bio",
  
  // Nested maps (never null)
  stats: {
    wins: 15,
    losses: 8,
    matches_played: 23,
    win_rate: 0.65
  },
  preferences: {
    notifications: true
  },
  
  created_at: timestamp,
  password_hash: "hash_or_null"
}
```

### 2.2 Identity Rules
- **Document ID**: Always Firestore auto-generated UID
- **Phone Number**: Indexed field, allows phone changes
- **Role-Based Access**: `customer`, `vendor`, `admin`
- **Vendor Link**: `vendor_id` references vendors collection
- **Guaranteed Fields**: `stats` and `preferences` maps always exist

### 2.3 Authentication Flow
1. **Firebase Auth** for phone/email authentication
2. **JWT Token** generation for API access
3. **Role Check** for endpoint authorization
4. **Vendor Verification** for dashboard access

---

## 3. DATABASE ARCHITECTURE

### 3.1 Live Database Verification

**Status**: 100% Forensic Evidence Verified (February 20, 2026)  
**Verification Method**: Direct inspection of live Firestore database

#### **Document ID Patterns (Verified)**
- **users**: `{uid}` (Firestore auto-generated Auth UID)
- **vendors**: `{vendor_slug}` (e.g., "capital-padel")
- **slots**: `YYYYMMDD_HHMM_{vendor}_{resource_id}` (e.g., "20260213_1900_capital-padel_court-1")
- **services**: `{service_id}` (e.g., "padel")
- **resources**: `{resource_id}` (e.g., "court-1")
- **payments**: `{payment_id}` (auto-generated)
- **system_config**: `global` (single document)

### 3.2 Core Collections (Verified Structure)

#### **users** (Canonical User Schema - Verified)
```javascript
// users/{uid} - Firestore auto-generated UID
{
  // Identity (Verified)
  name: string,                    // Full Name
  phone: string,                   // Primary contact (+923001234567)
  email: string,
  role: "user" | "vendor" | "admin", // Verified roles
  vendor_id: string,               // -> vendors.id (null for customers)
  
  // Profile (Verified)
  avatar_url: string,
  bio: string,
  
  // Gamification (Always Present)
  points: int,                     // e.g., 1250
  level: int,                      // e.g., 3
  badges: array,                   // e.g., ["early_bird", "regular"]
  skill_rating: number,             // e.g., 4.2
  
  // Social State (Always Present)
  is_online: bool,
  last_active: timestamp,
  stats: {                         // Never null map
    wins: int,                     // e.g., 15
    losses: int,                   // e.g., 8
    matches_played: int,           // e.g., 23
    win_rate: number               // e.g., 0.65
  },
  preferences: {                   // Never null map
    notifications: bool
  },
  
  // Security (Verified)
  password_hash: string,           // null for social login
  
  // Timestamps
  created_at: timestamp
}
```

#### **vendors** (Business Entity - Verified)
```javascript
// vendors/{vendor_slug}
{
  // Basic Info (Verified)
  name: string,                    // "Capital Padel"
  area: string,                     // "DHA Phase 5"
  address: string,                  // "123 Khayaban-e-Ittehad"
  phone: string,                    // "+923001234567"
  whatsapp_number: string,          // "+923001234568"
  description: string,
  
  // Operating Hours (Verified)
  operating_hours: {               // Map of day objects
    mon: {open: "08:00", close: "00:00"},
    tue: {open: "08:00", close: "00:00"},
    // ... all days
  },
  
  // Analytics (Verified, Initialized to 0)
  rating_sum: int,                  // e.g., 145
  rating_count: int,                // e.g., 29
  average_rating: number,           // Calculated: rating_sum / rating_count
  
  revenue_today: number,            // e.g., 15000
  revenue_week: number,             // e.g., 85000
  revenue_month: number,            // e.g., 320000
  booking_count_today: int,         // e.g., 8
  
  // Payment (Verified)
  default_payment_id: string,       // -> vendor_payment_accounts.id
  
  // Timestamps
  created_at: timestamp
}
```

#### **slots** (Inventory Ledger - Verified)
```javascript
// slots/YYYYMMDD_HHMM_{vendor}_{resource_id}
// Example: 20260213_1900_capital-padel_court-1
{
  // Status (Verified)
  status: "available" | "locked" | "pending" | "confirmed" | "completed" | "cancelled" | "blocked",
  
  // Foreign Keys (Verified)
  vendor_id: string,                // e.g., "capital-padel"
  service_id: string,               // e.g., "padel"
  resource_id: string,              // e.g., "court-1"
  
  // Timing (Verified - UTC)
  start_time: timestamp,            // e.g., Timestamp("2026-02-13T19:00:00Z")
  end_time: timestamp,              // e.g., Timestamp("2026-02-13T20:00:00Z")
  date: string,                     // "2026-02-13" (YYYY-MM-DD)
  
  // Pricing (Verified)
  price: number,                    // e.g., 6000
  is_peak: bool,                    // Based on time blocks
  
  // Booking (Verified)
  user_id: string,                  // -> users.id (null if available)
  booking_source: "app" | "whatsapp_ai" | "manual",
  payment_id: string,               // -> payments.id (null if not paid)
  
  // State Management (Verified)
  hold_expires_at: timestamp,       // null if not locked
  
  // Timestamps
  updated_at: timestamp,
  created_at: timestamp
}
```

#### **services** (What is Sold - Verified)
```javascript
// services/{service_id}
{
  name: string,                     // "Padel"
  sport_type: string,               // "padel"
  duration_min: int,                // 60
  vendor_id: string,                // -> vendors.id
  
  pricing: {                        // Map or number
    base_price: number,             // e.g., 6000
    peak_multiplier: number,        // e.g., 1.5
    time_blocks: {                  // Optional time-based pricing
      morning: {start: "06:00", end: "11:00", price: 2000},
      evening: {start: "18:00", end: "22:00", price: 3500}
    }
  },
  
  active: bool,                     // true
  created_at: timestamp
}
```

#### **resources** (Physical Assets - Verified)
```javascript
// resources/{resource_id}
{
  name: string,                     // "Court 1"
  capacity: int,                    // 4
  vendor_id: string,                // -> vendors.id
  service_id: string,               // -> services.id
  active: bool,                     // true
  created_at: timestamp
}
```

### 3.3 Booking Collections (Verified)

#### **payments** (Financial Audit Trail - Verified)
```javascript
// payments/{payment_id}
{
  slot_id: string,                  // -> slots.id
  vendor_id: string,                // -> vendors.id
  user_id: string,                  // -> users.id
  
  screenshot_url: string,           // Google Cloud Storage URL
  amount_claimed: number,           // User claimed amount
  ocr_verified_amount: number,      // Gemini Vision result
  
  status: "uploaded" | "verified" | "rejected",
  verification_method: "ocr" | "manual",
  rejection_reason: string,          // null if verified
  
  created_at: timestamp,
  verified_at: timestamp,           // null if pending
  verified_by: string               // User ID of verifier
}
```

#### **vendor_payment_accounts** (Verified)
```javascript
// vendor_payment_accounts/{account_id}
{
  vendor_id: string,                // -> vendors.id
  type: "JazzCash" | "EasyPaisa" | "Bank",
  
  account_title: string,            // "Capital Padel"
  account_number: string,           // "00150900000721"
  iban: string,                     // "PK38ASCM0000150900000721"
  bank_name: string,                // "Askari Bank"
  
  is_default: bool,                 // true for primary account
  active: bool                      // true
}
```

#### **reviews** (Verified)
```javascript
// reviews/{review_id}
{
  vendor_id: string,                // -> vendors.id
  user_id: string,                  // -> users.id
  slot_id: string,                  // -> slots.id
  
  rating: int,                      // 1-5 stars
  title: string,
  content: string,
  status: "published" | "hidden",
  created_at: timestamp
}
```

### 3.4 Social Collections (Verified)

#### **posts** (Verified)
```javascript
// posts/{post_id}
{
  user_id: string,                  // -> users.id
  type: string,                      // "post" | "announcement"
  sport_type: string,               // "padel", "futsal", etc.
  content: string,
  image_url: string,                // Optional
  location: string,                 // Optional
  
  likes_count: int,
  comments_count: int,
  created_at: timestamp
}
```

#### **matches** (Verified)
```javascript
// matches/{match_id}
{
  host_user_id: string,             // -> users.id
  slot_id: string,                  // -> slots.id
  status: "open" | "full" | "completed",
  
  max_players: int,                 // e.g., 4
  current_players: array,           // Array of user IDs
  
  sport_type: string,               // "padel"
  match_type: "casual" | "ranked",
  date: string,                     // "2026-02-13"
  time: string,                     // "19:00"
  location: string,                 // "Capital Padel"
  venue_id: string,                 // -> vendors.id
  
  created_at: timestamp
}
```

#### **conversation_states** (AI Context - Verified)
```javascript
// conversation_states/{phone_number}
{
  phone_number: string,             // "+923001234567"
  state: string,                    // Current conversation state
  context: map,                     // Conversation context
  history: array,                   // Message history
  
  created_at: timestamp
}
```

#### **notifications** (Verified)
```javascript
// notifications/{notification_id}
{
  user_id: string,                  // -> users.id
  type: string,                     // "booking_confirmed", "payment_reminder"
  title: string,
  message: string,
  data: map,                        // Additional data
  
  read: bool,                       // false by default
  created_at: timestamp
}
```

### 3.5 System Configuration (Verified)

#### **system_config/global** (Verified)
```javascript
// system_config/global (single document)
{
  booking_lock_minutes: int,        // 10
  maintenance_mode: bool,           // false
  payment_verification_mode: "auto" | "test" | "manual", // "test"
  
  schema_version: string,           // "2.0"
  updated_at: timestamp              // Last config update
}
```

### 3.6 Core Collections (Theoretical Reference)

#### **vendors** (Business Entities)
```javascript
// vendors/{vendor_slug}
{
  name: "Capital Padel",
  area: "DHA Phase 5",
  address: "123 Khayaban-e-Ittehad",
  phone: "+923001234567",
  whatsapp_number: "+923001234568",
  description: "Premium padel facility",
  
  // Analytics (initialized to 0)
  rating_sum: 145,
  rating_count: 29,
  average_rating: 5.0,
  
  revenue_today: 15000,
  revenue_week: 85000,
  revenue_month: 320000,
  booking_count_today: 8,
  
  operating_hours: {
    mon: {open: "06:00", close: "00:00"},
    tue: {open: "06:00", close: "00:00"},
    // ... all days
  },
  
  default_payment_id: "payment_123",
  created_at: timestamp,
  active: true
}
```

#### **slots** (Inventory Ledger)
```javascript
// slots/{YYYYMMDD_HHMM_{vendor}_{resource_id}}
{
  status: "available" | "locked" | "pending" | "confirmed" | "completed" | "cancelled" | "blocked",
  
  // Foreign keys
  vendor_id: "capital-padel",
  service_id: "padel",
  resource_id: "court-1",
  
  // Timing (UTC)
  start_time: timestamp,
  end_time: timestamp,
  date: "2026-02-13",  // YYYY-MM-DD
  
  // Pricing
  price: 6000,
  is_peak: true,
  
  // Booking details
  user_id: "uid_123",           // null if available
  booking_source: "app" | "whatsapp_ai" | "manual",
  payment_id: "payment_456",    // null if not paid
  
  // State management
  hold_expires_at: timestamp,   // null if not locked
  updated_at: timestamp,
  created_at: timestamp
}
```

#### **services** (What is Sold)
```javascript
// services/{service_id}
{
  name: "Padel",
  sport_type: "padel",
  duration_min: 60,
  vendor_id: "capital-padel",
  
  pricing: {
    base_price: 6000,
    peak_multiplier: 1.5,
    time_blocks: {
      morning: {start: "06:00", end: "11:00", price: 2000},
      evening: {start: "18:00", end: "22:00", price: 3500}
    }
  },
  
  active: true,
  created_at: timestamp
}
```

#### **resources** (Physical Assets)
```javascript
// resources/{resource_id}
{
  name: "Court 1",
  capacity: 4,
  vendor_id: "capital-padel",
  service_id: "padel",
  active: true,
  created_at: timestamp
}
```

### 3.2 Booking Collections

#### **payments** (Financial Audit Trail)
```javascript
// payments/{payment_id}
{
  slot_id: "20260213_1900_capital-padel_court-1",
  vendor_id: "capital-padel",
  user_id: "uid_123",
  
  screenshot_url: "https://storage.googleapis.com/...",
  amount_claimed: 6000,
  ocr_verified_amount: 6000,     // Gemini Vision result
  
  status: "uploaded" | "verified" | "rejected",
  verification_method: "ocr" | "manual",
  rejection_reason: null,
  
  created_at: timestamp,
  verified_at: timestamp,
  verified_by: "uid_vendor"
}
```

#### **vendor_payment_accounts**
```javascript
// vendor_payment_accounts/{account_id}
{
  vendor_id: "capital-padel",
  type: "JazzCash" | "EasyPaisa" | "Bank",
  account_title: "Capital Padel",
  account_number: "00150900000721",
  iban: "PK38ASCM0000150900000721",
  bank_name: "Askari Bank",
  is_default: true,
  active: true
}
```

### 3.3 Social Collections

#### **posts**, **matches**, **conversations**, **messages**
- Standard social media structure
- All user references guaranteed to exist
- No orphan documents allowed

### 3.4 System Configuration

#### **system_config/global**
```javascript
{
  schema_version: "2.0",
  booking_lock_minutes: 10,
  maintenance_mode: false,
  payment_verification_mode: "auto" | "test" | "manual",
  ocr_confidence_threshold: 0.85,
  max_booking_duration_hours: 3,
  updated_at: timestamp
}
```

---

## 4. AI AGENT SYSTEM

### 4.1 LangGraph Workflow
```
START → classify_intent → query → generate_response → END
```

### 4.2 Agent Components

#### **Core Graph** (`backend/agent/graph.py`)
```python
class BookingAgent:
    def process(self, user_phone: str, message: str, history: list) -> dict:
        # Main entry point for WhatsApp messages
        # Returns: {response: str, state: dict, actions: list}
```

#### **Agent Nodes** (`backend/agent/nodes.py`)
- `classify_intent_node()`: Uses NLU to classify user intent
- `query_node()`: Executes database queries based on intent
- `generate_response_node()`: Creates natural language responses

#### **Agent State** (`backend/agent/state.py`)
```python
class AgentState(TypedDict):
    messages: List[Dict]
    user_phone: str
    current_intent: str
    entities: Dict[str, Any]
    booking_context: Dict[str, Any]
    query_result: Dict[str, Any]
    response: str
```

### 4.3 NLU System

#### **Intent Classification** (5 Core Intents)
1. **GREETING** - "Hi", "Aoa"
2. **INQUIRY** - Any booking-related question
3. **INFO_REQUEST** - Pricing, rules, account info
4. **TRANSACTION** - Yes/No/Change responses
5. **UNKNOWN** - Fallback

#### **Entity Extraction**
- **Date**: "tomorrow", "kal", "next Friday"
- **Time**: "6-9", "evening", "shaam"
- **Service**: "padel", "futsal", "cricket"
- **Price**: "Rs 6000", "8k", discount info
- **Name**: Customer name collection

#### **Roman Urdu Support**
```python
ROMAN_URDU_MAP = {
    "Aoa": "greeting",
    "mujhe": "i_want",
    "chahiye": "need",
    "kal": "tomorrow",
    "aaj": "today",
    "shaam": "evening",
    "batadei": "tell_me"
}
```

---

## 5. BOOKING STATE MACHINE

### 5.1 Slot State Transitions
```
available → locked (10 min) → pending (payment) → confirmed → completed
                ↓
            cancelled
```

### 5.2 State Invariants
- **available**: `user_id` must be null
- **locked**: `hold_expires_at` must exist
- **pending**: `payment_id` must exist
- **confirmed**: Both `user_id` and `payment_id` exist
- **completed**: `user_id` exists, session ended
- **cancelled**: `cancelled_by` must exist

### 5.3 Booking Flow
1. **Availability Check** → Query slots by date/time/vendor
2. **Slot Lock** → Transactional lock with 10-minute expiry
3. **Payment Upload** → User uploads screenshot
4. **OCR Verification** → Gemini Vision processes image
5. **Vendor Approval** → Manual or automatic confirmation
6. **Booking Complete** → State changes to `confirmed`

---

## 6. CONCURRENCY CONTROL

### 6.1 Optimistic Concurrency Control (OCC)
All slot writes use Firestore transactions:

```python
@firestore.transactional
def lock_slot(transaction, slot_id: str, user_id: str):
    slot_ref = db.collection('slots').document(slot_id)
    slot_doc = slot_ref.get(transaction=transaction)
    
    if slot_doc.get('status') != 'available':
        return {'success': False, 'error': 'Slot not available'}
    
    transaction.update(slot_ref, {
        'status': 'locked',
        'user_id': user_id,
        'hold_expires_at': datetime.now(timezone.utc) + timedelta(minutes=10)
    })
```

### 6.2 Race Condition Prevention
- **Mobile App + WhatsApp**: Cannot book same slot simultaneously
- **Multiple WhatsApp Users**: Transaction prevents double-lock
- **Vendor + Customer**: Shared database ensures consistency

---

## 7. TEMPORAL LOGIC

### 7.1 UTC Storage Policy
- **All timestamps stored in UTC**
- **Display conversion to PKT (UTC+5)**
- **No naive datetime usage**

### 7.2 Timezone Examples
```python
# Storage (UTC)
"2026-02-13T19:00:00Z"  # 7 PM PKT

# Display (PKT)
"7:00 PM"  # User sees local time
```

### 7.3 Slot Generation
```python
# backend/database/seed/slot_generator.py
def generate_slot_time(date: date, hour: int) -> datetime:
    return datetime.combine(date, time(hour, 0), tzinfo=timezone.utc)
```

---

## 8. API ARCHITECTURE

### 8.1 FastAPI Structure
```python
# backend/app/main.py
app = FastAPI(title="BookForMe API")

# Health check
@app.get("/health")

# Vendor endpoints
@app.get("/api/vendors")
@app.get("/api/vendors/{vendor_id}")

# Slot endpoints  
@app.get("/api/vendors/{vendor_id}/availability")
@app.post("/api/slots/{slot_id}/lock")

# Booking endpoints
@app.get("/api/bookings")
@app.post("/api/payments/upload")

# WhatsApp webhook
@app.post("/webhook/whatsapp")
```

### 8.2 Authentication
- **JWT Bearer tokens** for protected endpoints
- **Firebase Auth** integration
- **Role-based access control**

### 8.3 Error Handling
```python
class BookingException(Exception):
    def __init__(self, message: str, code: str):
        self.message = message
        self.code = code

# Standardized error responses
{
    "error": {
        "code": "SLOT_NOT_AVAILABLE",
        "message": "Requested slot is no longer available",
        "details": {...}
    }
}
```

---

## 9. MOBILE APP ARCHITECTURE

### 9.1 React Native (Expo) Structure
```
App/
├── app/
│   ├── (tabs)/          # Home, Chatbot, Social, Profile
│   ├── vendor/          # Vendor detail, booking flow
│   ├── bookings/        # My bookings
│   └── vendor-dashboard/  # Vendor management
├── components/
│   ├── ui/              # Base UI components
│   └── AvailabilityCalendar.tsx
├── services/            # API clients
├── hooks/               # React Query hooks
└── types/               # TypeScript definitions
```

### 9.2 State Management
- **TanStack React Query v5** for server state
- **In-memory token caching** (5 min TTL)
- **Optimistic updates** for UI responsiveness

### 9.3 Performance Optimizations
```typescript
// Token caching
const tokenCache = {
  token: string | null,
  expiresAt: number
};

// Smart polling for slots
useQuery({
  queryKey: ['slots', vendorId, date],
  queryFn: fetchSlots,
  refetchInterval: slot => slot.is_locked ? 30000 : 45000
});
```

---

## 10. CONVERSATION SYSTEM

### 10.1 Complete Booking Flow
```
greeting → inquiry → select_service → select_date → select_time 
→ price_inquiry → confirm_booking → collect_name → share_payment 
→ wait_for_payment → confirm_payment → booking_complete
```

### 10.2 Language Patterns
- **60% Mixed Language**: Roman Urdu + English
- **30% English**: Full English
- **10% Roman Urdu**: Mostly Roman Urdu

### 10.3 Common Roman Urdu Phrases
```python
PHRASE_MAP = {
    "Aoa": "greeting",
    "mujhe chahiye": "i want",
    "karna hai": "want to do", 
    "mil jayega": "will be available",
    "kal": "tomorrow",
    "aaj": "today",
    "shaam": "evening",
    "batadei": "tell me",
    "Han g": "yes"
}
```

### 10.4 Response Templates
```python
# Availability confirmed
"Yes, available! Slots available:
• 6:00 PM - 7:00 PM  
• 7:00 PM - 8:00 PM

Which one would you like?"

# Slot unavailable
"No I'm sorry we're completely booked but we do have a slot open from 8 to 9:30. Would that work?"

# Payment details
"Payment Details:
Account Title: Capital Padel
Account Number: 00150900000721
IBAN: PK38ASCM0000150900000721
Bank Name: Askari Bank

Please transfer Rs 6000 and share payment proof."
```

---

## 11. PAYMENT SYSTEM

### 11.1 Screenshot-based Flow
1. **Booking Confirmation** → Agent shares payment details
2. **User Upload** → Payment screenshot via WhatsApp or app
3. **OCR Processing** → Gemini Vision extracts amount and details
4. **Verification** → Amount matched against booking amount
5. **Approval** → Vendor confirms or system auto-approves

### 11.2 OCR Integration
```python
# backend/services/payment_ocr.py
async def verify_payment(screenshot_url: str, expected_amount: float) -> dict:
    # Use Gemini Vision API
    # Extract amount, date, transaction ID
    # Return verification result
```

### 11.3 Payment Methods Supported
- **JazzCash**
- **EasyPaisa** 
- **Bank Transfer**
- **Cash** (manual verification)

---

## 12. ERROR HANDLING

### 12.1 Error Categories
- **Validation Errors**: Invalid input data
- **Business Logic Errors**: Slot not available, double booking
- **System Errors**: Database failures, API timeouts
- **AI Errors**: NLU misclassification, OCR failures

### 12.2 Error Response Format
```python
{
    "success": false,
    "error": {
        "code": "SLOT_NOT_AVAILABLE",
        "message": "Requested slot is no longer available",
        "user_friendly": "Sorry, this slot was just booked by someone else.",
        "suggestions": ["Try a different time", "Check tomorrow's availability"]
    }
}
```

### 12.3 WhatsApp Error Handling
- **Graceful degradation** on AI failures
- **Human handoff** option for complex issues
- **Clear error messages** in user's language

---

## 13. PERFORMANCE RULES

### 13.1 Database Optimization
- **Composite indexes** on vendor_id + date + status
- **Batch queries** to eliminate N+1 problems
- **Connection pooling** for Firestore client

### 13.2 API Performance
- **Async operations** for all I/O
- **Request deduplication** for concurrent requests
- **Response caching** for static data

### 13.3 Mobile App Performance
- **React Query caching** with background refetch
- **Image optimization** for vendor photos
- **Lazy loading** for long lists

---

## 14. SECURITY MODEL

### 14.1 Authentication & Authorization
- **Firebase Auth** for user authentication
- **JWT tokens** with 1-hour expiry
- **Role-based access** (customer/vendor/admin)
- **API key validation** for external services

### 14.2 Data Protection
- **PII protection** in database (no sensitive data in document IDs)
- **Encrypted storage** for payment screenshots
- **Input validation** on all endpoints
- **SQL injection prevention** (NoSQL injection)

### 14.3 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Vendors can read their bookings
    match /bookings/{bookingId} {
      allow read: if request.auth != null && 
        request.auth.token.role == 'vendor' &&
        resource.data.vendor_id in request.auth.token.vendor_ids;
    }
  }
}
```

---

## 15. DEPLOYMENT ARCHITECTURE

### 15.1 Production Environment
- **Backend**: Render (https://jhat-to9p.onrender.com)
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage (for screenshots)
- **AI Services**: Groq API + Gemini Vision API
- **Mobile**: Expo Build and Distribution

### 15.2 Environment Variables
```bash
# Firebase
FIRESTORE_PROJECT_ID=jhat-production
FIREBASE_PRIVATE_KEY="..."

# AI Services  
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...

# WhatsApp
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...

# App
EXPO_PROJECT_ID=...
```

### 15.3 Monitoring & Logging
- **Application logs** via console
- **Error tracking** via Sentry (planned)
- **Performance monitoring** via Firebase Analytics
- **Database monitoring** via Google Cloud Console

---

## 🔑 CRITICAL IMPLEMENTATION RULES

### 1. Database Rules (NEVER VIOLATE)
- **All timestamps in UTC**
- **Use Firestore transactions for slot writes**
- **Never create orphan user references**
- **Always initialize nested maps (stats, preferences)**

### 2. AI Agent Rules
- **Match user's language style** (Roman Urdu ↔ English)
- **Be proactive in collecting missing information**
- **Handle incomplete queries gracefully**
- **Maintain conversation context across turns**

### 3. API Rules
- **Validate all inputs**
- **Use consistent error response format**
- **Implement rate limiting for public endpoints**
- **Log all booking attempts for audit**

### 4. Mobile App Rules
- **Use React Query for all API calls**
- **Implement optimistic updates**
- **Handle network failures gracefully**
- **Cache data appropriately**

---

## 📚 QUICK REFERENCE FOR DEVELOPERS

### Common Tasks
```bash
# Database reset and seed
python -m database.seed.wipe_firestore
python -m database.seed.seed_system_config
python -m database.seed.seed_all --days 14

# Test AI agent locally
python backend/scripts/chat_terminal.py

# Verify database integrity
python backend/scripts/master_forensic_verification
```

### File Locations
- **AI Agent**: `backend/agent/`
- **NLU Prompts**: `backend/nlu/agent.py`
- **Database Operations**: `backend/database/`
- **WhatsApp Handler**: `backend/whatsapp/`
- **API Endpoints**: `backend/app/`

### Key Functions
- **Slot Locking**: `database/slot_service.py:lock_slot()`
- **Availability Check**: `database/availability_service.py:check_availability()`
- **Intent Classification**: `nlu/agent.py:extract_intent()`
- **Payment OCR**: `services/payment_ocr.py:verify_payment()`

---

**This document is the SINGLE SOURCE OF TRUTH for all technical decisions.**  
Any architectural change must first update this document.  
Last Updated: February 20, 2026  
Next Review: March 1, 2026
# Historical Archive Notice

This document is historical and may mention outdated providers or prototype
ideas. For current implementation truth, read `README.md`,
`backend/README.md`, `backend/agent/README.md`, `backend/database/README.md`,
and `backend/database/seed/README.md`.

---
