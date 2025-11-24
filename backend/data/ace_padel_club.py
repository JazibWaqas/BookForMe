"""
Hardcoded Ace Padel Club data for testing LangGraph agent
This data structure matches what Firebase would return
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any

# Vendor Information
VENDOR_INFO = {
    "id": "ace_padel_club",
    "name": "Ace Padel Club",
    "service_type": "padel",
    "address": "DHA Phase 5, Karachi",
    "phone": "+923001234567",
    "description": "Premium padel courts in Karachi"
}

# Pricing Information
PRICING = {
    "base_price_per_hour": 7500,  # Rs per hour
    "currency": "PKR",
    "discount_percent": 20,  # 20% discount available
    "discounted_price_per_hour": 6000,  # After discount
    "time_blocks": {
        "morning": {
            "start": "09:00",
            "end": "11:00",
            "price_per_hour": 2000
        },
        "afternoon": {
            "start": "11:00",
            "end": "19:00",
            "price_per_hour": 2500
        },
        "evening": {
            "start": "19:00",
            "end": "03:00",
            "price_per_hour": 3500
        }
    },
    "card_discount_available": False
}

# Payment Details
PAYMENT_DETAILS = {
    "account_title": "Ace Padel Club",
    "account_number": "00150900000721",
    "iban": "PK38ASCM0000150900000721",
    "bank_name": "Askari Bank"
}

# Import general booking rules from agent (agent rules, not vendor-specific)
from agent.booking_rules import check_slot_conflict


def check_slot_conflicts_with_ranges(slot_start: str, slot_end: str, booked_ranges: List[Dict[str, str]]) -> bool:
    """
    Check if a slot conflicts with vendor-specific booked ranges
    Uses general agent booking rules (applies to all vendors)
    """
    # Convert booked ranges to format expected by general conflict checker
    booked_slots = [
        {"start_time": r["start"], "end_time": r["end"]}
        for r in booked_ranges
    ]
    
    # Use general agent booking rule (not vendor-specific)
    return check_slot_conflict(slot_start, slot_end, booked_slots)


def generate_slots_for_date(date: str) -> List[Dict[str, Any]]:
    """
    Generate time slots for a specific date (24 hours)
    Date format: YYYY-MM-DD
    
    Returns list of slots with status: available, booked, paid
    
    Booked slots:
    - 6-7pm (18:00-19:00)
    - 8:30-10pm (20:30-22:00)
    - 10pm-12am (22:00-00:00)
    - 2-4am (02:00-04:00)
    - 5-6am (05:00-06:00)
    - 7-9am (07:00-09:00)
    """
    slots = []
    
    # Define booked time ranges
    booked_ranges = [
        {"start": "18:00", "end": "19:00"},      # 6-7pm
        {"start": "20:30", "end": "22:00"},      # 8:30-10pm
        {"start": "22:00", "end": "00:00"},      # 10pm-12am (midnight)
        {"start": "02:00", "end": "04:00"},      # 2-4am
        {"start": "05:00", "end": "06:00"},      # 5-6am
        {"start": "07:00", "end": "09:00"},      # 7-9am
    ]
    
    # Generate hourly slots for 24 hours (00:00 to 23:00)
    for hour in range(24):
        slot_time = f"{hour:02d}:00"
        end_time = f"{(hour+1)%24:02d}:00"  # Handle midnight wrap (23:00 -> 00:00)
        
        # Check if this slot conflicts with booked ranges
        # Uses general agent booking rules (not vendor-specific)
        is_conflict = check_slot_conflicts_with_ranges(slot_time, end_time, booked_ranges)
        
        # Also check for partial hour conflicts (e.g., slot ends at 6:30 but 6-7 is booked)
        # For now, we'll mark full hour slots. Partial hour bookings will be checked separately.
        if is_conflict:
            status = "booked"
        else:
            status = "available"
        
        # Calculate price based on time block
        if 9 <= hour < 11:
            price_per_hour = PRICING["time_blocks"]["morning"]["price_per_hour"]
        elif 11 <= hour < 19:
            price_per_hour = PRICING["time_blocks"]["afternoon"]["price_per_hour"]
        elif 19 <= hour < 24 or hour < 9:  # Evening (7pm-9am) or late night
            price_per_hour = PRICING["time_blocks"]["evening"]["price_per_hour"]
        else:
            price_per_hour = PRICING["time_blocks"]["afternoon"]["price_per_hour"]
        
        price = price_per_hour  # For 1-hour slot
        
        slots.append({
            "slot_id": f"{date}_{slot_time}",
            "slot_date": date,
            "slot_time": slot_time,
            "end_time": end_time,
            "duration_hours": 1.0,  # Base slot is 1 hour
            "duration_minutes": 60,
            "price": price,
            "price_per_hour": price_per_hour,  # For calculating flexible durations
            "discounted_price": int(price * 0.8),  # 20% discount
            "discounted_price_per_hour": int(price_per_hour * 0.8),
            "status": status
        })
    
    return slots

def get_vendor_data() -> Dict[str, Any]:
    """Get complete vendor data"""
    return {
        "vendor": VENDOR_INFO,
        "pricing": PRICING,
        "payment_details": PAYMENT_DETAILS
    }

def get_slots_for_date_range(start_date: str, days: int = 7) -> Dict[str, List[Dict[str, Any]]]:
    """
    Generate slots for multiple days
    Returns dict: {date: [slots]}
    """
    start = datetime.strptime(start_date, "%Y-%m-%d")
    slots_by_date = {}
    
    for day in range(days):
        current_date = start + timedelta(days=day)
        date_str = current_date.strftime("%Y-%m-%d")
        slots_by_date[date_str] = generate_slots_for_date(date_str)
    
    return slots_by_date

# Pre-generate slots for next 14 days (starting from today)
def get_all_slots() -> Dict[str, List[Dict[str, Any]]]:
    """Get all slots for next 14 days"""
    today = datetime.now().strftime("%Y-%m-%d")
    return get_slots_for_date_range(today, days=14)

# Available slots for quick access
ALL_SLOTS = get_all_slots()

