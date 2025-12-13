# Database Flow Explanation

## ✅ Yes, It's Hitting Firestore Database!

The availability checks **DO hit the Firestore database**. Here's the exact flow:

## 🔄 Complete Flow

```
User Message: "I want padel court tomorrow"
    ↓
[Intent Classification] → Entities: {service_type: "padel", date: "tomorrow"}
    ↓
[Check if should query database] → Yes, all details present
    ↓
[_check_database_availability()] → backend/nlu/agent.py
    ↓
[Get vendor_id from service_type] → Query Firestore vendors collection
    ↓
[AvailabilityService.get_available_slots()] → backend/database/availability_service.py
    ↓
[firestore_db.get_available_slots()] → backend/app/firestore.py
    ↓
[Firestore Query] → Queries actual Firestore database:
    collection('availability_slots')
    .where('vendor_id', '==', vendor_id)
    .where('slot_date', '==', date)
    .where('status', '==', 'available')
    ↓
[Returns Real Data] → List of available slots from Firestore
    ↓
[Gemini Formats Response] → Natural language response with real data
```

## 📍 Database Queries

### 1. Vendor Lookup (if vendor_id not provided)
**Collection**: `vendors`  
**Query**: 
```python
.where('service_type', '==', service_type)
```
**Purpose**: Find vendor_id from service_type (e.g., "padel" → finds vendor with service_type="padel")

### 2. Availability Check
**Collection**: `availability_slots`  
**Query**:
```python
.where('vendor_id', '==', vendor_id)
.where('slot_date', '==', date)  # e.g., "2025-01-15"
.where('status', '==', 'available')
```
**Purpose**: Get all available slots for that vendor on that date

## 🗄️ Firestore Collections Used

1. **`vendors`** - Vendor information
   - Fields: `id`, `service_type`, `business_name`, etc.
   - Used to: Map service_type → vendor_id

2. **`availability_slots`** - Slot availability data
   - Fields: `vendor_id`, `slot_date`, `slot_time`, `status`, `price`
   - Used to: Get actual available slots

## 🔧 Changes Made

### Removed Hardcoded "ace_padel_club"

**Before**:
```python
vendor_id = "ace_padel_club"  # Hardcoded
```

**After**:
```python
# Get vendor_id from entities or query by service_type
vendor_id = entities.get("vendor_id")

if not vendor_id:
    # Query Firestore to find vendor by service_type
    vendors = await firestore_db.get_vendors_by_service(service_type)
    if vendors:
        vendor_id = vendors[0].get("id")
```

### Removed "padel-only" Restriction

**Before**:
```python
if "padel" not in service_type:
    return False  # Only check for padel
```

**After**:
```python
if not service_type:
    return False  # Need service type to find vendor
# Now works for any service type (padel, futsal, cricket, etc.)
```

## 🎯 How It Works Now

1. **User provides**: service_type (e.g., "padel", "futsal") + date
2. **System queries**: Firestore `vendors` collection to find vendor with that service_type
3. **Gets vendor_id**: From the vendor document
4. **Queries**: Firestore `availability_slots` collection for that vendor_id and date
5. **Returns**: Real available slots from database

## 📊 Example Flow

```
User: "I want futsal court tomorrow"
    ↓
Entities: {service_type: "futsal", date: "tomorrow"}
    ↓
Query Firestore: vendors.where('service_type', '==', 'futsal')
    ↓
Found: vendor_id = "futsal_venue_123"
    ↓
Query Firestore: availability_slots
    .where('vendor_id', '==', 'futsal_venue_123')
    .where('slot_date', '==', '2025-01-15')
    .where('status', '==', 'available')
    ↓
Returns: [{"time": "10:00", "price": 3000}, {"time": "11:00", "price": 3000}]
    ↓
Gemini formats: "Available slots: 10:00 AM - Rs 3000/hour, 11:00 AM - Rs 3000/hour"
```

## ✅ Summary

- **YES**, it hits Firestore database
- **NO** hardcoded vendor IDs anymore
- **Dynamic** vendor lookup by service_type
- **Works** for any service type (not just padel)
- **Real data** from Firestore `availability_slots` collection

The system now dynamically finds vendors and queries the actual Firestore database! 🎉

