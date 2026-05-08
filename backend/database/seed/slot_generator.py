"""
Legacy slot generation logic.

Do not use this for current slot maintenance. It generates the older compact
slot ID format, while the live booking system and admin/vendor APIs use
smart_reseed.py with IDs like YYYYMMDD_HH_vendor_id_resource_id.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta
from typing import List, Dict, Any
import uuid
import pytz

from database.schema import (
    SlotStatus, PriceTier, SLOT_DURATION_MINUTES, SLOT_GENERATION_DAYS
)
from database.seed.vendors_data import (
    VENDORS_DATA, RESOURCES_DATA, SERVICES_DATA,
    get_vendor_resources, get_vendor_service
)


PKT = pytz.timezone('Asia/Karachi')

WEEKDAY_MAP = {
    0: "mon",
    1: "tue",
    2: "wed",
    3: "thu",
    4: "fri",
    5: "sat",
    6: "sun"
}


def parse_time(time_str: str) -> tuple:
    parts = time_str.split(":")
    return int(parts[0]), int(parts[1])


def generate_slot_id(vendor_id: str, resource_id: str, date: str, time: str) -> str:
    date_clean = date.replace("-", "")
    time_clean = time.replace(":", "")
    vendor_short = vendor_id.split("_")[0][:3]
    resource_short = resource_id.split("_")[-1][:2]
    return f"{date_clean}_{time_clean}_{vendor_short}_{resource_short}"


def get_hours_for_day(operating_hours: dict, date: datetime) -> tuple:
    weekday = WEEKDAY_MAP[date.weekday()]
    day_hours = operating_hours.get(weekday, {"open": "08:00", "close": "22:00"})
    
    open_h, open_m = parse_time(day_hours["open"])
    close_h, close_m = parse_time(day_hours["close"])
    
    if close_h == 0 and close_m == 0:
        close_h = 24
    
    return (open_h, open_m), (close_h, close_m)


def generate_slots_for_resource(
    vendor_id: str,
    resource_id: str,
    service: dict,
    date: datetime,
    operating_hours: dict
) -> List[Dict[str, Any]]:
    slots = []
    date_str = date.strftime("%Y-%m-%d")
    
    (open_h, open_m), (close_h, close_m) = get_hours_for_day(operating_hours, date)
    
    current_hour = open_h
    current_min = open_m
    
    duration = service.get("duration_min", SLOT_DURATION_MINUTES)
    base_price = service.get("pricing", {}).get("base", 1500)
    
    while current_hour < close_h or (current_hour == close_h and current_min < close_m):
        start_time_pkt = PKT.localize(datetime(date.year, date.month, date.day, current_hour, current_min))
        start_time = start_time_pkt.astimezone(pytz.utc)
        end_time = start_time + timedelta(minutes=duration)
        
        end_time_pkt = end_time.astimezone(PKT)
        end_hour_pkt = end_time_pkt.hour
        end_min_pkt = end_time_pkt.minute
        
        if end_hour_pkt > close_h or (end_hour_pkt == close_h and end_min_pkt > close_m):
            if close_h < 24:
                break
        
        time_str = f"{current_hour:02d}:{current_min:02d}"
        slot_id = generate_slot_id(vendor_id, resource_id, date_str, time_str)
        
        slot = {
            "id": slot_id,
            "vendor_id": vendor_id,
            "service_id": service["id"],
            "resource_id": resource_id,
            "start_time": start_time,
            "end_time": end_time,
            "date": date_str,
            "price": base_price,
            "status": SlotStatus.AVAILABLE.value,
            "user_id": None,
            "payment_id": None,
            "hold_expires_at": None
        }
        
        slots.append(slot)
        
        current_min += duration
        while current_min >= 60:
            current_min -= 60
            current_hour += 1
    
    return slots


def generate_slots_for_vendor(
    vendor_id: str,
    start_date: datetime = None,
    days: int = SLOT_GENERATION_DAYS
) -> List[Dict[str, Any]]:
    if start_date is None:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    vendor = None
    for v in VENDORS_DATA:
        if v["id"] == vendor_id:
            vendor = v
            break
    
    if not vendor:
        return []
    
    resources = get_vendor_resources(vendor_id)
    service = get_vendor_service(vendor_id)
    
    if not resources or not service:
        return []
    
    operating_hours = vendor.get("operating_hours", {})
    all_slots = []
    
    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)
        
        for resource in resources:
            day_slots = generate_slots_for_resource(
                vendor_id=vendor_id,
                resource_id=resource["id"],
                service=service,
                date=current_date,
                operating_hours=operating_hours
            )
            all_slots.extend(day_slots)
    
    return all_slots


def generate_all_slots(
    start_date: datetime = None,
    days: int = SLOT_GENERATION_DAYS
) -> List[Dict[str, Any]]:
    if start_date is None:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    all_slots = []
    
    for vendor in VENDORS_DATA:
        vendor_slots = generate_slots_for_vendor(
            vendor_id=vendor["id"],
            start_date=start_date,
            days=days
        )
        all_slots.extend(vendor_slots)
    
    return all_slots


def apply_test_states(slots: List[Dict[str, Any]], users_data: list) -> List[Dict[str, Any]]:
    """
    DISABLED: Test states should be applied via API after seeding
    This prevents hardcoded user IDs and ensures referential integrity
    
    All slots are generated as 'available' by default.
    To create test bookings, use the booking API endpoints after seeding.
    """
    # Return slots unchanged - all will remain 'available'
    return slots


def get_slot_statistics(slots: List[Dict[str, Any]]) -> dict:
    stats = {
        "total": len(slots),
        "by_status": {},
        "by_vendor": {},
        "by_sport": {}
    }
    
    for slot in slots:
        status = slot["status"]
        vendor = slot["vendor_id"]
        
        stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
        stats["by_vendor"][vendor] = stats["by_vendor"].get(vendor, 0) + 1
    
    return stats
