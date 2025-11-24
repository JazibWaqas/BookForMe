"""
Booking Rules - General agent rules for handling bookings
These rules apply to ALL vendors, not specific to one vendor
"""

from typing import Dict, List, Any
from datetime import datetime, timedelta


def time_to_minutes(t: str) -> int:
    """
    Convert HH:MM to minutes since midnight
    General utility function for time calculations
    """
    parts = t.split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    return hour * 60 + minute


def check_slot_conflict(
    booking_start: str, 
    booking_end: str, 
    booked_slots: List[Dict[str, Any]]
) -> bool:
    """
    General rule: Check if a booking conflicts with any booked slots
    
    This is an agent rule that applies to ALL vendors.
    If a booking overlaps with any existing booking, it's rejected.
    
    Args:
        booking_start: Booking start time (HH:MM)
        booking_end: Booking end time (HH:MM)
        booked_slots: List of booked slots from vendor data
                     Each slot should have: start_time, end_time, or slot_time/end_time
    
    Returns:
        True if conflict exists (booking should be rejected)
        False if no conflict (booking is allowed)
    """
    booking_start_min = time_to_minutes(booking_start)
    booking_end_min = time_to_minutes(booking_end)
    
    # Handle midnight crossover (e.g., 23:00 -> 00:00)
    if booking_end_min < booking_start_min:
        booking_end_min += 24 * 60
    
    for booked_slot in booked_slots:
        # Handle different slot formats
        booked_start = booked_slot.get("start_time") or booked_slot.get("slot_time") or booked_slot.get("start", "")
        booked_end = booked_slot.get("end_time") or booked_slot.get("end", "")
        
        if not booked_start or not booked_end:
            continue
        
        booked_start_min = time_to_minutes(booked_start)
        booked_end_min = time_to_minutes(booked_end)
        
        # Handle midnight crossover for booked slot
        if booked_end_min < booked_start_min:
            booked_end_min += 24 * 60
        
        # Check overlap: Two ranges overlap if start1 < end2 AND start2 < end1
        # This is the general rule: ANY overlap = conflict
        if (booking_start_min < booked_end_min) and (booked_start_min < booking_end_min):
            return True  # Conflict detected
    
    return False  # No conflict


def validate_booking_duration(
    duration_hours: float,
    slot_start: str,
    slot_end: str,
    booked_slots: List[Dict[str, Any]]
) -> tuple[bool, str]:
    """
    General rule: Validate that a booking duration doesn't conflict with booked slots
    
    This ensures partial hour bookings (30 mins, 1.5 hrs) don't overlap with existing bookings.
    
    Args:
        duration_hours: Requested booking duration
        slot_start: Slot start time (HH:MM)
        slot_end: Slot end time (HH:MM) - for reference
        booked_slots: List of booked slots
    
    Returns:
        (is_valid, error_message)
    """
    # Calculate actual booking end time
    start_dt = datetime.strptime(slot_start, "%H:%M")
    end_dt = start_dt + timedelta(hours=duration_hours)
    booking_end = end_dt.strftime("%H:%M")
    
    # Check for conflicts
    if check_slot_conflict(slot_start, booking_end, booked_slots):
        return False, f"Booking would conflict with existing booking"
    
    return True, ""


def filter_conflicting_slots(
    available_slots: List[Dict[str, Any]],
    booked_slots: List[Dict[str, Any]],
    duration_hours: float = 1.0
) -> List[Dict[str, Any]]:
    """
    General rule: Filter out slots that would conflict if booked for given duration
    
    This is used when showing available slots to users - we don't show slots
    that would conflict with existing bookings for the requested duration.
    
    Args:
        available_slots: List of available slots
        booked_slots: List of booked slots
        duration_hours: Duration to check conflicts for
    
    Returns:
        Filtered list of slots that can be booked for the duration without conflict
    """
    conflict_free = []
    
    for slot in available_slots:
        slot_start = slot.get("slot_time") or slot.get("start_time", "")
        if not slot_start:
            continue
        
        # Calculate what the end time would be if booked for this duration
        start_dt = datetime.strptime(slot_start, "%H:%M")
        end_dt = start_dt + timedelta(hours=duration_hours)
        slot_end = end_dt.strftime("%H:%M")
        
        # Check if this would conflict
        if not check_slot_conflict(slot_start, slot_end, booked_slots):
            conflict_free.append(slot)
    
    return conflict_free

