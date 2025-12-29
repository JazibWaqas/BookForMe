# Database Context - Complete Implementation Reference

**Last Updated**: December 29, 2025  
**Purpose**: Comprehensive database context for implementation work  
**Audit Date**: December 29, 2025

---

## 🎯 Purpose

This document provides **complete context** about the database implementation, including temporal data handling, timezone issues, indexing, scalability concerns, and critical implementation details. Use this when implementing features that interact with the database.

---

## ⚠️ CRITICAL ISSUES (Must Know Before Implementing)

### 1. Timezone Storage - FIXED ✅ (December 29, 2025)

**Location**: `backend/database/seed/slot_generator.py`

**Status**: ✅ **COMPLETED** - All datetimes now stored as timezone-aware UTC

**Implementation**:
- Slot generation now uses `pytz` to localize to PKT first, then converts to UTC
- All `start_time`, `end_time`, and `hold_expires_at` fields are timezone-aware UTC
- Removed all manual `+5 hours` workarounds from `rest_api.py` and `firestore.py`
- WhatsApp agent (`backend/agent/tools.py`) converts UTC to PKT for display

**What Was Fixed**:
```python
# Before (naive datetime):
start_time = datetime(date.year, date.month, date.day, current_hour, current_min)

# After (timezone-aware UTC):
PKT = pytz.timezone('Asia/Karachi')
start_time_pkt = PKT.localize(datetime(date.year, date.month, date.day, current_hour, current_min))
start_time = start_time_pkt.astimezone(pytz.utc)
```

**Impact**:
- All slots now stored correctly in UTC (e.g., 9 AM PKT → 04:00 AM UTC)
- API returns clean UTC ISO 8601 strings (frontend handles conversion automatically)
- WhatsApp agent displays times in PKT correctly
- No more manual timezone adjustments needed

**When Implementing**: Always use UTC timestamps. Convert to PKT only for display.

---

### 2. Composite Indexes - CREATED ✅ (December 29, 2025)

**Status**: ✅ **COMPLETED** - Composite index created and deployed

**Index Created**:
- `vendor_id` + `date` + `status` (composite) - For vendor dashboard queries
- Location: `firestore.indexes.json` (root directory)
- Deployed via Google Cloud Console

**Performance Impact**:
- Query performance improved from ~9 seconds to ~3-4 seconds
- Vendor dashboard queries now use index (O(log n) instead of O(n))
- Index automatically used by Firestore for matching queries

**Query Pattern** (`backend/database/firestore_v2.py:273-276`):
```python
query = db.collection('slots').where('vendor_id', '==', vendor_id)
if date:
    query = query.where('date', '==', date)
query = query.where('status', 'in', ['locked', 'pending', 'confirmed'])
```

**When Implementing**: 
- Index is active and working
- Additional indexes can be added to `firestore.indexes.json` if needed
- Test query performance with large datasets to verify optimization

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

**Display Logic** (`rest_api.py`):
- Returns clean UTC ISO 8601 strings ✅ (frontend handles conversion)
- WhatsApp agent converts UTC to PKT before formatting for display ✅

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
1. ✅ **Fix Timezone Storage** - COMPLETED (December 29, 2025)
2. ✅ **Verify/Create Indexes** - COMPLETED (December 29, 2025)
3. **Automate Hold Expiry** - Cloud Function for cleanup (pending)

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

**Last Updated**: December 29, 2025  
**Audit Completed**: December 29, 2025  
**Purpose**: Implementation context for database work

