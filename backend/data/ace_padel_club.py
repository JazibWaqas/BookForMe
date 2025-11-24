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

def generate_slots_for_date(date: str) -> List[Dict[str, Any]]:
    """
    Generate time slots for a specific date
    Date format: YYYY-MM-DD
    
    Returns list of slots with status: available, booked, paid
    """
    slots = []
    
    # Generate hourly slots from 9 AM to 11 PM
    for hour in range(9, 23):
        slot_time = f"{hour:02d}:00"
        end_time = f"{hour+1:02d}:00"
        
        # Determine status based on hour (simulate some booked slots)
        # Example: 7 PM slot is booked, 8 PM is paid, rest available
        if hour == 19:  # 7 PM
            status = "booked"
        elif hour == 20:  # 8 PM
            status = "paid"
        else:
            status = "available"
        
        # Calculate price based on time block
        if 9 <= hour < 11:
            price = PRICING["time_blocks"]["morning"]["price_per_hour"]
        elif 11 <= hour < 19:
            price = PRICING["time_blocks"]["afternoon"]["price_per_hour"]
        else:
            price = PRICING["time_blocks"]["evening"]["price_per_hour"]
        
        slots.append({
            "slot_id": f"{date}_{slot_time}",
            "slot_date": date,
            "slot_time": slot_time,
            "end_time": end_time,
            "duration_hours": 1,
            "price": price,
            "discounted_price": int(price * 0.8),  # 20% discount
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

