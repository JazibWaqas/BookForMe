# Database Layer - Firestore Operations & OCC

**Last Updated**: December 29, 2025  
**Status**: Core Features Complete, Critical Issues Resolved  
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

### 1. Timezone Storage Bug ✅ **FIXED** (December 29, 2025)
**Location**: `seed/slot_generator.py`

**Status**: ✅ **COMPLETED** - All datetimes now stored as timezone-aware UTC

**What Was Fixed**:
- Slot generation now uses `pytz` to localize to PKT first, then converts to UTC
- All `start_time`, `end_time`, and `hold_expires_at` fields are timezone-aware UTC
- Removed all manual `+5 hours` workarounds from `rest_api.py` and `firestore.py`
- WhatsApp agent (`backend/agent/tools.py`) converts UTC to PKT for display

**Implementation**:
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

**Migration**: Existing slots wiped and reseeded with correct UTC timestamps

### 2. Composite Indexes ✅ **CREATED** (December 29, 2025)
**Location**: Firestore Console

**Status**: ✅ **COMPLETED** - Composite index created and deployed

**Index Created**:
- `vendor_id` (Ascending) + `date` (Ascending) + `status` (Ascending)
- Location: `firestore.indexes.json` (root directory)
- Deployed via Google Cloud Console

**Query Pattern** (`firestore_v2.py:273-276`):
```python
query = db.collection('slots').where('vendor_id', '==', vendor_id)
if date:
    query = query.where('date', '==', date)
query = query.where('status', 'in', ['locked', 'pending', 'confirmed'])
```

**Performance Impact**: 
- Query performance improved from ~9 seconds to ~3-4 seconds
- Vendor dashboard queries now use index (O(log n) instead of O(n))
- Index automatically used by Firestore for matching queries

**Additional Indexes** (can be added if needed):
- `service_id` (Ascending) + `date` (Ascending) + `status` (Ascending)
- `user_id` (Ascending) + `status` (Ascending)
- `status` (Ascending) + `hold_expires_at` (Ascending) - for cleanup

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

### 4. Date Field vs start_time ✅ **RESOLVED** (December 29, 2025)
**Location**: Slot documents

**Status**: ✅ **FIXED** - Both fields now consistent

**How It Works**:
- `date` field: String "YYYY-MM-DD" (represents PKT date) ✅
- `start_time` field: Timezone-aware UTC timestamp ✅

**Implementation**:
- Date filtering uses string comparison (avoids timezone issues)
- Query: `.where('date', '==', '2025-01-15')` works correctly
- `start_time` now stored correctly in UTC (see Issue #1 fix)
- API returns UTC ISO 8601 strings, frontend handles conversion
- WhatsApp agent converts UTC to PKT for display

**Example**:
- Slot created for "2025-01-15 09:00 PKT"
- Stored as: `date: "2025-01-15"`, `start_time: 2025-01-15T04:00:00Z` (correct UTC)
- Query for `date == "2025-01-15"` finds slot, `start_time` is correct

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
1. ✅ **Fix Timezone Storage** - COMPLETED (December 29, 2025)
2. ✅ **Verify/Create Indexes** - COMPLETED (December 29, 2025)
3. **Automate Hold Expiry** - Cloud Function for cleanup (pending)

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
**Status**: ✅ **FIXED** (December 29, 2025)
**Solution**: All datetimes now stored as timezone-aware UTC
**Note**: Frontend and WhatsApp agent handle UTC to PKT conversion automatically

### Date Filtering Works But Times Wrong
**Status**: ✅ **RESOLVED** (December 29, 2025)
**Note**: Both date field and start_time are now consistent and correct

---

## 📚 Related Documentation

- **Complete Schema**: `DATABASE_DOCUMENTATION.md` - Full collection reference (1100+ lines)
- **Slot Generation**: `seed/slot_generator.py` - How slots are created (has timezone bug)
- **API Endpoints**: `rest_api.py` - REST API documentation
- **Temporal Data Audit**: See `gemini_response.md` (root) for deep dive on timezone/indexing issues

## 🔍 Deep Context: Temporal Data & Scalability

### Timezone Handling Summary

**Current State**:
- `start_time`/`end_time`: Timezone-aware UTC ✅
- `hold_expires_at`: Explicitly UTC (`datetime.now(timezone.utc)`) ✅
- `date`: String field (no timezone, represents PKT date) ✅
- Display logic: Returns clean UTC ISO strings, frontend/agent handle conversion ✅

**Impact**: 
- All slots stored with correct UTC timestamps
- Date filtering works (uses string), time comparisons are correct
- Frontend receives correct UTC `start_time` values, converts to local timezone automatically
- WhatsApp agent converts UTC to PKT for display

**Status**: ✅ **FIXED** (December 29, 2025)

### Index Status

**Created Indexes**:
- `vendor_id`, `date`, `status` (composite) - ✅ **CREATED** (December 29, 2025)
- Location: `firestore.indexes.json` (root directory)
- Deployed via Google Cloud Console
- Performance: Query time improved from ~9s to ~3-4s

**Additional Indexes** (can be added if needed):
- `service_id`, `date`, `status` (composite) - Not yet created
- `user_id`, `status` (composite) - Not yet created
- `status`, `hold_expires_at` - Not yet created

**Status**: Primary vendor dashboard index is active and working.

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

**Last Updated**: December 29, 2025  
**Maintained By**: Database Team  
**Critical Files**: `slot_service.py`, `rest_api.py`, `firestore_v2.py`, `seed/slot_generator.py`

