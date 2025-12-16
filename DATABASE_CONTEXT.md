# Database Context - Complete Implementation Reference

**Last Updated**: January 15, 2025  
**Purpose**: Comprehensive database context for implementation work  
**Audit Date**: January 15, 2025

---

## 🎯 Purpose

This document provides **complete context** about the database implementation, including temporal data handling, timezone issues, indexing, scalability concerns, and critical implementation details. Use this when implementing features that interact with the database.

---

## ⚠️ CRITICAL ISSUES (Must Know Before Implementing)

### 1. Timezone Storage - Naive Datetime Bug 🐛

**Location**: `backend/database/seed/slot_generator.py:76`

**Current Implementation**:
```python
start_time = datetime(date.year, date.month, date.day, current_hour, current_min)
# ❌ Naive datetime - no timezone information
```

**Problem**:
- Slot generation uses local system time (may be PKT or UTC)
- Firestore stores naive datetime as UTC by default
- Creates ambiguity: "2025-01-15 09:00" could be PKT or UTC

**Impact**:
- Slots created at "2025-01-15 09:00 PKT" stored as "2025-01-15 09:00 UTC" (wrong!)
- Should be "2025-01-15 04:00 UTC" (PKT is UTC+5)
- Date filtering works (uses string), but time comparisons may be wrong

**Current Workaround**:
Backend adds +5 hours when displaying times (`backend/database/rest_api.py:667`):
```python
pakistan_time = start_time + timedelta(hours=5)
```

**Proper Fix**:
```python
from datetime import timezone
start_time = datetime(date.year, date.month, date.day, current_hour, current_min, tzinfo=timezone.utc)
```

**When Implementing**: Always use UTC timestamps. Convert to PKT only for display.

---

### 2. Composite Indexes - Not Verified ⚠️

**Required Indexes** (from `DATABASE_DOCUMENTATION.md`):
- `vendor_id` + `date` + `status` (composite)
- `service_id` + `date` + `status` (composite)
- `user_id` + `status` (composite)
- `status` + `hold_expires_at` (for cleanup)

**Current Status**: **NOT VERIFIED** - Indexes may not exist

**Impact**:
- Vendor dashboard queries may be slow (full collection scan)
- Without index: O(n) - scans all documents
- With index: O(log n) - fast lookup

**Query Pattern** (`backend/database/firestore_v2.py:273-276`):
```python
query = db.collection('slots').where('vendor_id', '==', vendor_id)
if date:
    query = query.where('date', '==', date)
query = query.where('status', 'in', ['locked', 'pending', 'confirmed'])
```

**When Implementing**: 
- Verify indexes exist before deploying
- Test query performance with large datasets
- Create `firestore.indexes.json` if missing

---

### 3. Hold Expiry - Not Automated ⏳

**Location**: `backend/database/slot_service.py:381-420`

**Function Exists**: `cleanup_expired_locks()` works correctly

**Problem**: Not scheduled - no Cloud Function or cron

**Current Behavior**: Expired locks released only when:
1. User tries to submit payment (transaction checks expiry)
2. System checks slot availability (on-demand)
3. Manual trigger

**Impact**: Expired locks persist, showing false "unavailable" status

**When Implementing**: 
- Consider hold expiry when checking slot availability
- May need to manually trigger cleanup during development
- Cloud Function needed for production

---

### 4. Date vs start_time Mismatch ⚠️

**How It Works**:
- `date` field: String "YYYY-MM-DD" (represents PKT date) ✅
- `start_time` field: Timestamp (may be UTC or naive) ❌

**Date Filtering**: Uses string comparison (works correctly)
```python
query = query.where('date', '==', '2025-01-15')  # String comparison
```

**Time Comparison**: Uses timestamp (may be wrong due to timezone)

**Example Problem**:
- Slot for "2025-01-15 01:00 PKT" (late night)
- Stored: `date: "2025-01-15"`, `start_time: 2025-01-15T01:00:00Z`
- But "2025-01-15 01:00 PKT" = "2025-01-14 20:00 UTC"
- Query finds slot (date match), but time is wrong

**When Implementing**: 
- Use `date` field for date filtering (works correctly)
- Fix `start_time` timezone before using for time comparisons
- Convert to PKT only for display

---

## 📊 Temporal Data Handling

### How Timestamps Are Stored

**Slot Generation** (`seed/slot_generator.py`):
- `start_time`: Naive datetime ❌ (should be UTC)
- `end_time`: Naive datetime ❌ (should be UTC)
- `date`: String "YYYY-MM-DD" ✅ (works correctly)

**Slot Locking** (`slot_service.py:51`):
- `hold_expires_at`: Explicitly UTC ✅
```python
hold_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
```

**All Comparisons** (`slot_service.py:152, 387, 442`):
- Use UTC for comparisons ✅
```python
if datetime.now(timezone.utc) > hold_expires:
```

**Display Logic** (`rest_api.py:667`):
- Adds +5 hours for PKT display ⚠️ (band-aid fix)

### Date Filtering Strategy

**Why It Works**:
- Uses string field `date` ("YYYY-MM-DD")
- Simple string comparison avoids timezone issues
- Query: `.where('date', '==', '2025-01-15')`

**Limitation**:
- Can't filter by time range using `start_time` (timezone issues)
- Must filter by date string, then filter times in application code

---

## 🔍 Scalability & Performance

### Query Performance

**Vendor Dashboard Query** (`firestore_v2.py:271-297`):
```python
query = db.collection('slots').where('vendor_id', '==', vendor_id)
if date:
    query = query.where('date', '==', date)
query = query.where('status', 'in', ['locked', 'pending', 'confirmed'])
```

**Performance**:
- **With composite index**: O(log n) - fast
- **Without composite index**: O(n) - full collection scan

**Risk**: Slow queries at scale (10,000+ slots)

### Transaction Overhead

**Current Implementation**: Minimal overhead ✅
- Only essential fields updated in transactions
- `SERVER_TIMESTAMP` is server-side (no contention)
- Each transaction updates one document

**Optimization**: Not needed - current implementation is optimal

### Batch Operations

**Current**: Uses batch queries to eliminate N+1 problems ✅
- Vendor queries fetch resources/services in batches
- Reduces database reads significantly

---

## 🗄️ Database Schema Quick Reference

### `/slots` Collection (Core)

**Key Fields**:
- `vendor_id`: string (indexed)
- `date`: string "YYYY-MM-DD" (indexed)
- `start_time`: Timestamp (timezone issue)
- `end_time`: Timestamp (timezone issue)
- `status`: string (indexed) - available/locked/pending/confirmed/completed/cancelled
- `user_id`: string (set when locked)
- `hold_expires_at`: Timestamp UTC (10 min expiry)
- `payment_id`: string (set when payment uploaded)

**State Transitions**: All use `@firestore.transactional`

### `/vendors` Collection

**Key Fields**:
- `id`: string
- `name`: string
- `area`: string
- `category`: string
- `operating_hours`: dict

### `/users` Collection

**Key Fields**:
- `id`: string
- `phone`: string (unique)
- `name`: string
- `role`: "customer" | "vendor"
- `skill_profile`: dict (Elo ratings) - not used for queries yet

---

## 🔑 Implementation Patterns

### Transaction Pattern (OCC)

```python
@firestore.transactional
def update_slot(transaction, slot_id, new_status):
    slot_ref = db.collection('slots').document(slot_id)
    slot_doc = slot_ref.get(transaction=transaction)
    
    # Check current state
    if slot_doc.get('status') != expected_status:
        return {'success': False, 'error': 'State mismatch'}
    
    # Update atomically
    transaction.update(slot_ref, {'status': new_status})
    return {'success': True}
```

**Why**: Prevents race conditions when mobile app and WhatsApp agent book simultaneously.

### Hold Expiry Check

```python
hold_expires = slot_data.get('hold_expires_at')
if hold_expires and datetime.now(timezone.utc) > hold_expires:
    # Release lock
    slot_ref.update({
        'status': 'available',
        'user_id': None,
        'hold_expires_at': None
    })
```

**When to Check**: 
- Before accepting payment (`slot_service.py:152`)
- When checking availability (`slot_service.py:442`)
- Background cleanup (`slot_service.py:387`)

### Date Filtering

```python
# ✅ Correct - uses string field
query = db.collection('slots').where('date', '==', '2025-01-15')

# ❌ Avoid - timezone issues with timestamp
query = db.collection('slots').where('start_time', '>=', start_timestamp)
```

---

## 🚧 What Needs to Be Done

### Critical Fixes
1. **Fix Timezone Storage** - Store UTC timestamps (January 17, 2025)
2. **Verify/Create Indexes** - Composite indexes for queries (January 16, 2025)
3. **Automate Hold Expiry** - Cloud Function for cleanup (January 18, 2025)

### Future Enhancements
1. **Matchmaking Queries** - Elo-based user queries (not implemented)
2. **Bulk Slot Operations** - Block time ranges (no API exists)
3. **Analytics Queries** - User behavior tracking

---

## 📚 Related Files

- **Complete Schema**: `backend/database/DATABASE_DOCUMENTATION.md` (1100+ lines)
- **Slot Service**: `backend/database/slot_service.py` - OCC implementation
- **API Endpoints**: `backend/database/rest_api.py` - REST API
- **Slot Generation**: `backend/database/seed/slot_generator.py` - Has timezone bug

---

**Last Updated**: January 15, 2025  
**Audit Completed**: January 15, 2025  
**Purpose**: Implementation context for database work

