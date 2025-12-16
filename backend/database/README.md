# Database Layer - Firestore Operations & OCC

**Last Updated**: January 15, 2025  
**Status**: Core Features Complete, Critical Issues Identified  
**Purpose**: All Firestore database operations with Optimistic Concurrency Control

---

## 🎯 Core Vision

The database layer ensures **no double-bookings** when requests come from both the mobile app and WhatsApp agent simultaneously. Every slot write uses Firestore transactions to guarantee atomicity.

**Critical Principle**: Two users cannot book the same slot at the same time, even if requests arrive within milliseconds of each other.

---

## 🏗️ Architecture

### Slot State Machine

```
available → locked (10 min) → pending (payment) → confirmed (vendor) → completed
                ↓
            cancelled
```

**State Transitions**:
- `available → locked`: User selects slot (10-minute hold via transaction)
- `locked → pending`: Payment screenshot uploaded (transaction)
- `pending → confirmed`: Vendor approves payment (transaction)
- `pending → cancelled`: Vendor rejects or user cancels
- `confirmed → completed`: Session finished
- `confirmed → cancelled`: User/vendor cancels

**All transitions use `@firestore.transactional` decorator** to prevent race conditions.

---

## 📁 Key Files

### `slot_service.py` - Core Booking Logic ⭐
**Purpose**: Slot locking, payment, confirmation with OCC

**Key Methods**:
- `lock_slot(slot_id, user_id)` - Lock slot for 10 minutes (transaction)
- `submit_payment(slot_id, user_id, payment_id)` - Move to pending (transaction)
- `confirm_booking(slot_id, vendor_id)` - Vendor approves (transaction)
- `release_lock(slot_id, user_id)` - Release expired lock
- `cleanup_expired_locks()` - Background job to release expired locks

**Critical**: All methods use `@firestore.transactional` decorator.

**Example**:
```python
@firestore.transactional
def lock_slot(self, slot_id: str, user_id: str):
    slot_ref = self.db.collection('slots').document(slot_id)
    slot_doc = slot_ref.get(transaction=transaction)
    
    if slot_doc.get('status') != 'available':
        return {'success': False, 'error': 'Slot not available'}
    
    hold_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    transaction.update(slot_ref, {
        'status': 'locked',
        'user_id': user_id,
        'hold_expires_at': hold_expires
    })
```

### `rest_api.py` - REST API Endpoints
**Purpose**: FastAPI endpoints for mobile app

**Key Endpoints**:
- `POST /api/slots/{id}/lock` - Lock slot (calls `slot_service.lock_slot()`)
- `POST /api/payments/upload` - Upload payment screenshot
- `GET /api/vendors` - List vendors (optimized batch queries)
- `GET /api/vendors/{id}/availability` - Get available slots
- `GET /api/bookings` - Get user bookings

**Performance**: Uses batch queries to eliminate N+1 problems.

### `firestore_v2.py` - Firestore Client Wrapper
**Purpose**: High-level Firestore operations

**Key Methods**:
- `get_vendor(vendor_id)` - Get vendor details
- `get_available_slots(vendor_id, date)` - Query available slots
- `get_vendor_bookings(vendor_id, date)` - Get vendor bookings
- `get_user_bookings(user_id)` - Get user bookings

**Query Pattern**:
```python
query = db.collection('slots')\
    .where('vendor_id', '==', vendor_id)\
    .where('date', '==', date)\
    .where('status', '==', 'available')
```

### `auth_service.py` - Authentication
**Purpose**: User authentication and JWT tokens

**Key Methods**:
- `login(phone, password)` - Authenticate user
- `register(user_data)` - Create new user
- `get_current_user_id(token)` - Extract user ID from JWT

---

## ⚠️ CRITICAL ISSUES (Must Fix)

### 1. Timezone Storage Bug 🐛 **CRITICAL**
**Location**: `seed/slot_generator.py:76`

**Problem**: `start_time` stored as **naive datetime** (no timezone)
```python
start_time = datetime(date.year, date.month, date.day, current_hour, current_min)
# ❌ No timezone - Firestore treats as UTC, but generation uses local time
```

**Root Cause**: 
- Slot generation uses local system time (may be PKT or UTC depending on server)
- Firestore stores naive datetime as UTC by default
- Creates ambiguity: "2025-01-15 09:00" could be PKT or UTC

**Impact**: 
- Slots created at "2025-01-15 09:00 PKT" stored as "2025-01-15 09:00 UTC" (wrong!)
- Should be "2025-01-15 04:00 UTC" (PKT is UTC+5)
- Date filtering works (uses string field), but time comparisons may be wrong
- Display logic adds +5 hours manually (`rest_api.py:667`) as band-aid fix

**Current Workaround**: Backend adds +5 hours when displaying times
```python
# rest_api.py:667
pakistan_time = start_time + timedelta(hours=5)
```

**Proper Fix Required**:
```python
from datetime import timezone
# Explicitly create UTC datetime
start_time = datetime(date.year, date.month, date.day, current_hour, current_min, tzinfo=timezone.utc)
# OR convert PKT to UTC
pkt = timezone(timedelta(hours=5))
start_time_pkt = datetime(date.year, date.month, date.day, current_hour, current_min, tzinfo=pkt)
start_time = start_time_pkt.astimezone(timezone.utc)
```

**Migration Required**: Existing slots in database need timezone correction

**Target**: January 17, 2025

### 2. Composite Indexes Missing ⚠️ **PERFORMANCE RISK**
**Location**: Firestore Console

**Problem**: Composite indexes not verified/created
- Query: `vendor_id` + `date` + `status`
- Without index: Full collection scan (slow at scale)

**Current Query Pattern** (`firestore_v2.py:273-276`):
```python
query = db.collection('slots').where('vendor_id', '==', vendor_id)
if date:
    query = query.where('date', '==', date)
query = query.where('status', 'in', ['locked', 'pending', 'confirmed'])
```

**Impact**: 
- Vendor dashboard queries may be slow with 10,000+ slots
- Without composite index: O(n) full collection scan
- With composite index: O(log n) fast index lookup

**Required Indexes** (from `DATABASE_DOCUMENTATION.md:245-249`):
- `vendor_id` (Ascending) + `date` (Ascending) + `status` (Ascending)
- `service_id` (Ascending) + `date` (Ascending) + `status` (Ascending)
- `user_id` (Ascending) + `status` (Ascending)
- `status` (Ascending) + `hold_expires_at` (Ascending) - for cleanup

**Fix Required**: 
1. Check Firestore Console for existing indexes
2. Create `firestore.indexes.json` if missing:
   ```json
   {
     "indexes": [{
       "collectionGroup": "slots",
       "queryScope": "COLLECTION",
       "fields": [
         {"fieldPath": "vendor_id", "order": "ASCENDING"},
         {"fieldPath": "date", "order": "ASCENDING"},
         {"fieldPath": "status", "order": "ASCENDING"}
       ]
     }]
   }
   ```
3. Deploy indexes: `gcloud firestore indexes create`

**Target**: January 16, 2025

### 3. Hold Expiry Not Automated ⏳ **OPERATIONAL ISSUE**
**Location**: `slot_service.py:381-420`

**Problem**: `cleanup_expired_locks()` exists but not scheduled
- Function works correctly (tested)
- No Cloud Function or cron to run it automatically
- Currently only runs when:
  - User tries to submit payment (checks expiry)
  - System checks slot availability (on-demand)
  - Manual trigger

**Current Implementation**:
```python
def cleanup_expired_locks(self):
    now = datetime.now(timezone.utc)
    docs = db.collection('slots').where('status', '==', 'locked').stream()
    for doc in docs:
        if now > doc.get('hold_expires_at'):
            # Release lock
```

**Impact**: 
- Expired locks persist until next user interaction
- Slots show as "locked" when they should be "available"
- False "unavailable" status for users

**Fix Required**: 
1. Create Cloud Function triggered every 5 minutes:
   ```python
   # cloud_functions/cleanup_expired_locks.py
   from database.slot_service import SlotService
   
   def cleanup_expired_locks_cloud_function(request):
       slot_service = SlotService(db_client)
       result = slot_service.cleanup_expired_locks()
       return {'released_count': result['released_count']}
   ```
2. Schedule execution: Every 5 minutes via Cloud Scheduler
3. Monitor execution: Log cleanup results

**Target**: January 18, 2025

### 4. Date Field vs start_time Mismatch ⚠️ **DATA CONSISTENCY**
**Location**: Slot documents

**Problem**: 
- `date` field: String "YYYY-MM-DD" (represents PKT date)
- `start_time` field: Timestamp (may be UTC or naive datetime)

**How It Currently Works**:
- Date filtering uses string comparison (avoids timezone issues)
- Query: `.where('date', '==', '2025-01-15')` works correctly
- But `start_time` may be incorrect (see Issue #1)

**Example Problem**:
- Slot created for "2025-01-15 01:00 PKT" (late night)
- Stored as: `date: "2025-01-15"`, `start_time: 2025-01-15T01:00:00Z` (if naive treated as UTC)
- But "2025-01-15 01:00 PKT" = "2025-01-14 20:00 UTC"
- Query for `date == "2025-01-15"` finds slot, but `start_time` is wrong

**Current Workaround**: Backend adds +5 hours when displaying times (`rest_api.py:667`)
```python
pakistan_time = start_time + timedelta(hours=5)
```

**Proper Fix**: 
1. Store `start_time` in UTC (fixes Issue #1)
2. Convert to PKT only for display
3. Keep `date` field as string for filtering (works correctly)

**Target**: January 17, 2025 (same as Issue #1)

---

## ✅ What's Working

### Optimistic Concurrency Control ✅
- All slot writes use Firestore transactions
- Double-booking prevention tested and working
- Transaction retries handle conflicts

### Slot Locking ✅
- 10-minute hold mechanism functional
- `hold_expires_at` stored in UTC correctly
- Expiry check works (`slot_service.py:152`)

### Payment Flow ✅
- Payment upload endpoint functional
- Payment document creation works
- Slot status updates to pending

### Query Optimization ✅
- Batch queries eliminate N+1 problems
- Vendor filtering optimized
- React Query caching reduces backend load

---

## 🔑 Key Implementation Patterns

### Transaction Pattern
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

### Hold Expiry Check
```python
hold_expires = slot_data.get('hold_expires_at')
if hold_expires and datetime.now(timezone.utc) > hold_expires:
    # Release lock
    slot_ref.update({'status': 'available', 'user_id': None})
```

### Date Filtering
```python
# Uses string field (avoids timezone issues)
query = db.collection('slots')\
    .where('date', '==', '2025-01-15')  # String comparison
```

---

## 📊 Database Schema Reference

See `DATABASE_DOCUMENTATION.md` for complete schema details.

**Key Collections**:
- `/slots` - Core booking documents (state machine)
- `/vendors` - Vendor information
- `/users` - User accounts
- `/payments` - Payment proof documents
- `/resources` - Physical courts/resources
- `/services` - Service definitions

---

## 🚧 What Needs to Be Done

### Critical (Week 1)
1. **Fix Timezone Storage** - Store UTC timestamps (January 17, 2025)
2. **Verify/Create Indexes** - Composite indexes for queries (January 16, 2025)
3. **Automate Hold Expiry** - Cloud Function for cleanup (January 18, 2025)

### Important (Week 2)
1. **Matchmaking Queries** - Elo-based user queries (not implemented)
2. **Bulk Slot Operations** - Block time ranges (no API exists)
3. **Analytics Queries** - User behavior tracking

---

## 🐛 Common Issues & Debugging

### Transaction Conflicts
**Symptom**: `Transaction failed: Document was modified`
**Cause**: Two users trying to book same slot simultaneously
**Solution**: Retry logic handles this automatically
**Expected**: Normal behavior - OCC working correctly

### Hold Expiry Not Working
**Symptom**: Expired locks persist, slots show as unavailable
**Cause**: `cleanup_expired_locks()` not scheduled (see Issue #3)
**Solution**: Create Cloud Function (see Issue #3 above)
**Workaround**: Manual trigger: `slot_service.cleanup_expired_locks()`

### Slow Vendor Queries
**Symptom**: Dashboard takes 5+ seconds to load
**Cause**: Missing composite index (see Issue #2)
**Solution**: Create index (see Issue #2 above)
**Check**: Firestore Console → Indexes → Verify composite index exists

### Incorrect Slot Times
**Symptom**: Slots show wrong times (off by 5 hours)
**Cause**: Timezone storage bug (see Issue #1)
**Solution**: Fix timezone storage, migrate existing slots
**Workaround**: Display logic adds +5 hours (band-aid)

### Date Filtering Works But Times Wrong
**Symptom**: Query by date finds slots, but times are incorrect
**Cause**: Date field (string) works, but start_time (timestamp) wrong
**Solution**: Fix timezone storage (see Issue #1)
**Note**: This is why date filtering works despite timezone issues

---

## 📚 Related Documentation

- **Complete Schema**: `DATABASE_DOCUMENTATION.md` - Full collection reference (1100+ lines)
- **Slot Generation**: `seed/slot_generator.py` - How slots are created (has timezone bug)
- **API Endpoints**: `rest_api.py` - REST API documentation
- **Temporal Data Audit**: See `gemini_response.md` (root) for deep dive on timezone/indexing issues

## 🔍 Deep Context: Temporal Data & Scalability

### Timezone Handling Summary

**Current State**:
- `start_time`/`end_time`: Naive datetime (ambiguous timezone) ❌
- `hold_expires_at`: Explicitly UTC (`datetime.now(timezone.utc)`) ✅
- `date`: String field (no timezone, represents PKT date) ✅
- Display logic: Adds +5 hours manually (band-aid) ⚠️

**Impact**: 
- Slots may be stored with incorrect UTC timestamps
- Date filtering works (uses string), but time comparisons may be wrong
- Frontend receives incorrect `start_time` values, requires manual +5 hour adjustment

**Root Cause**: Slot generation uses naive datetime instead of timezone-aware UTC datetime.

### Index Status

**Documented Indexes** (`DATABASE_DOCUMENTATION.md`):
- `vendor_id`, `date`, `status` (composite) - **NOT VERIFIED** ⚠️
- `service_id`, `date`, `status` (composite) - **NOT VERIFIED** ⚠️
- `user_id`, `status` (composite) - **NOT VERIFIED** ⚠️
- `status`, `hold_expires_at` - **NOT VERIFIED** ⚠️

**No Index Creation Code Found**: 
- No `firestore.indexes.json` file
- No explicit index creation in Python code
- Relies on Firestore auto-indexing (only works for single-field queries)

**Risk**: Composite queries may be slow or fail without explicit indexes.

### Hold Expiry Cleanup

**Background Job Exists**: `cleanup_expired_locks()` (`slot_service.py:381-420`)

**Missing**:
- ❌ No Cloud Function to trigger cleanup
- ❌ No cron job configuration
- ❌ No scheduled execution

**Current Behavior**: Expired locks are only released when:
1. User tries to submit payment (transaction checks expiry)
2. System checks slot availability (on-demand check)
3. Manual trigger of `cleanup_expired_locks()`

**Risk**: Expired locks may persist until next user interaction, causing false "unavailable" status.

---

## 🧪 Testing

### Test Transactions
```bash
python backend/scripts/test_booking_db.py
# Tests concurrent booking attempts
# Verifies OCC prevents double-booking
```

### Test Slot Operations
```bash
python backend/scripts/check_slot_status.py {vendor_id} {date} {time}
# Check specific slot status
```

### Verify Database
```bash
python backend/scripts/check_db.py
# Lists collections, counts documents
```

---

**Last Updated**: January 15, 2025  
**Maintained By**: Database Team  
**Critical Files**: `slot_service.py`, `rest_api.py`, `firestore_v2.py`

