"""
Slot generation logic for Firestore
Generates slots based on vendor operating hours for a specified date range
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
        time_str = f"{current_hour:02d}:{current_min:02d}"
        
        end_min = current_min + duration
        end_hour = current_hour
        while end_min >= 60:
            end_min -= 60
            end_hour += 1
        
        if end_hour > close_h or (end_hour == close_h and end_min > close_m):
            if close_h < 24:
                break
        
        end_time_str = f"{end_hour:02d}:{end_min:02d}"
        slot_id = generate_slot_id(vendor_id, resource_id, date_str, time_str)
        
        slot = {
            "id": slot_id,
            "vendor_id": vendor_id,
            "service_id": service["id"],
            "resource_id": resource_id,
            "start_time": time_str,
            "end_time": end_time_str,
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
    if len(slots) < 10:
        return slots
    
    from datetime import datetime, timedelta
    
    now = datetime.now()
    tomorrow = now + timedelta(days=1)
    
    locked_slot = None
    pending_slot = None
    confirmed_slots = []
    cancelled_slot = None
    
    for slot in slots:
        slot_date = datetime.strptime(slot["date"], "%Y-%m-%d")
        slot_time = slot["start_time"]
        slot_hour = int(slot_time.split(":")[0])
        
        if slot_date.date() == now.date() and slot["status"] == SlotStatus.AVAILABLE.value:
            if not locked_slot and slot_hour >= now.hour + 1:
                locked_slot = slot
            elif not pending_slot and slot_hour >= now.hour + 2:
                pending_slot = slot
            elif len(confirmed_slots) < 3:
                confirmed_slots.append(slot)
            elif not cancelled_slot:
                cancelled_slot = slot
        
        elif slot_date.date() == tomorrow.date() and slot["status"] == SlotStatus.AVAILABLE.value:
            if len(confirmed_slots) < 5:
                confirmed_slots.append(slot)
    
    if locked_slot:
        locked_slot["status"] = SlotStatus.LOCKED.value
        locked_slot["user_id"] = users_data[0]["id"] if users_data else "user_ahmad"
        locked_slot["hold_expires_at"] = now + timedelta(minutes=5)
    
    if pending_slot:
        pending_slot["status"] = SlotStatus.PENDING.value
        pending_slot["user_id"] = users_data[1]["id"] if len(users_data) > 1 else "user_taha"
        pending_slot["payment_id"] = "payment_test_2"
    
    for i, slot in enumerate(confirmed_slots):
        user_idx = (i + 2) % len(users_data) if users_data else 0
        slot["status"] = SlotStatus.CONFIRMED.value
        slot["user_id"] = users_data[user_idx]["id"] if users_data else f"user_{i}"
        if i == 0:
            slot["payment_id"] = "payment_test_1"
    
    if cancelled_slot:
        cancelled_slot["status"] = SlotStatus.CANCELLED.value
        cancelled_slot["user_id"] = users_data[-2]["id"] if len(users_data) > 1 else "user_bilal"
    
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
