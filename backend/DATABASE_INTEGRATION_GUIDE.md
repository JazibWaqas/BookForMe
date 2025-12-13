# Database Integration Guide - Slot Availability Checking

## ✅ What Was Implemented

I've integrated database availability checking into `chat.py`. Now when a user provides all booking details (service type, date, and optionally time), the agent will:

1. **Detect** when all required details are present
2. **Call** the actual Firestore database to check slot availability
3. **Include** real availability data in the AI response

## 🔄 How It Works

### Flow Diagram

```
User Message: "I want padel court tomorrow evening"
    ↓
[Intent Classification] → Intent: booking_request, Entities: {service_type: "padel", date: "tomorrow", time: "evening"}
    ↓
[Check if all details present] → Yes! All details available
    ↓
[Call Database] → AvailabilityService.get_available_slots("ace_padel_club", "2025-01-XX")
    ↓
[Get Real Data] → List of available slots with times and prices
    ↓
[Generate Response] → Gemini formats the real data into natural response
    ↓
User sees: "Available slots for tomorrow evening: 6:00 PM - Rs 5000/hour, 7:00 PM - Rs 5000/hour..."
```

## 📍 Code Changes

### Modified File: `backend/nlu/agent.py`

**1. Added `_should_check_availability()` method** (line ~330)
- Checks if intent is `availability_inquiry` or `booking_request`
- Verifies service type is "padel"
- Verifies date is provided
- Returns `True` if all conditions met

**2. Added `_check_database_availability()` method** (line ~350)
- Calls `AvailabilityService.get_available_slots()` from Firestore
- Handles date normalization ("tomorrow" → "2025-01-XX")
- Filters slots by time range if provided
- Returns availability data

**3. Modified `generate_response()` method** (line 277)
- Now checks if database lookup is needed
- Calls `_check_database_availability()` when appropriate
- Passes availability data to response prompt

**4. Enhanced `_create_response_prompt()` method** (line ~420)
- Accepts `availability_data` parameter
- Includes real database results in prompt
- Instructs Gemini to present actual slot data

## 🎯 Trigger Conditions

The database check is triggered when:

✅ **Intent**: `availability_inquiry` OR `booking_request`  
✅ **Service Type**: `"padel"` (case-insensitive)  
✅ **Date**: Provided (e.g., "tomorrow", "kal", "2025-01-15")  
⏰ **Time**: Optional (if provided, filters results)

### Example Triggers

**Will trigger database check:**
- "I want padel court tomorrow"
- "padel slot kal evening"
- "book padel for Friday 6pm"
- "koi padel slot hai kal ka?"

**Won't trigger (missing details):**
- "I want to book" (no service/date)
- "padel slot" (no date)
- "tomorrow slot" (no service type)

## 🗄️ Database Integration

### Uses: `database/availability_service.py`

```python
from database.availability_service import AvailabilityService

availability_service = AvailabilityService()
available_slots = await availability_service.get_available_slots(
    vendor_id="ace_padel_club",
    target_date="2025-01-15"
)
```

### Database Structure

The service queries Firestore:
- **Collection**: `availability_slots`
- **Filters**: 
  - `vendor_id == "ace_padel_club"`
  - `slot_date == "2025-01-15"`
  - `status == "available"`
- **Returns**: List of slots with `time`, `price`, `slot_id`

## 📊 Response Format

When availability data is found, Gemini will format it like:

```
✅ Available slots for tomorrow (2025-01-15):

1. 6:00 PM - Rs 5000/hour
2. 7:00 PM - Rs 5000/hour
3. 8:00 PM - Rs 5000/hour
4. 9:00 PM - Rs 5000/hour

Which slot would you like to book?
```

## 🔧 Configuration

### Vendor ID

Currently hardcoded to `"ace_padel_club"` in `_check_database_availability()` (line ~380).

To make it dynamic:
```python
# Map service types to vendor IDs
vendor_map = {
    "padel": "ace_padel_club",
    "futsal": "futsal_vendor_id",
    "cricket": "cricket_vendor_id"
}
vendor_id = vendor_map.get(service_type.lower(), "ace_padel_club")
```

### Date Normalization

Handles:
- "tomorrow" / "kal" → Next day
- "today" / "aaj" → Today
- "2025-01-15" → Direct date
- Day names → Next occurrence

## 🧪 Testing

### Test the Integration

1. **Start chat**:
```bash
cd backend
python scripts/chat.py
```

2. **Try these messages**:
```
I want padel court tomorrow
padel slot kal evening
book padel for Friday 6pm
```

3. **Expected behavior**:
- Agent should call database
- Show actual available slots
- Display times and prices from database

### Debug Logging

Check logs for:
```
INFO: All booking details present - checking database availability
INFO: Checking database for vendor ace_padel_club on 2025-01-15
INFO: Found X available slots
```

## 🚨 Error Handling

### Database Connection Failed
- Returns: `{"success": False, "error": "..."}`
- Response: Apologizes and asks user to try again

### No Slots Available
- Returns: `{"available_slots": []}`
- Response: Apologizes and suggests alternatives

### Missing Details
- Skips database check
- Response: Asks for missing information

## 🔄 Next Steps: Booking Integration

To add booking functionality:

1. **Add booking trigger** in `generate_response()`:
```python
if self._should_book_slot(intent, entities, context):
    booking_result = await self._book_slot(entities, context)
```

2. **Create `_book_slot()` method**:
```python
async def _book_slot(self, entities: Dict, context: Dict) -> Dict:
    from database.availability_service import AvailabilityService
    
    service = AvailabilityService()
    result = await service.check_and_book_slot(
        vendor_id="ace_padel_club",
        date=entities["date"],
        time=entities["time"],
        customer_info=context.get("customer_info", {})
    )
    return result
```

3. **Update response prompt** to include booking confirmation

## 📝 Summary

✅ Database integration complete for **availability checking**  
✅ Triggers automatically when all details present  
✅ Uses real Firestore data  
✅ Formats results naturally via Gemini  
⏳ **Next**: Add booking functionality

The agent now checks the actual database when users provide complete booking requests! 🎉

