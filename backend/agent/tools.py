"""
LangGraph Tools - Query hardcoded vendor data
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.ace_padel_club import (
    get_vendor_data,
    ALL_SLOTS,
    PRICING,
    PAYMENT_DETAILS
)

logger = logging.getLogger(__name__)


# Import general booking rules (agent rules, not vendor-specific)
from agent.booking_rules import check_slot_conflict, filter_conflicting_slots, validate_booking_duration


def check_availability(date: str, time_range: Optional[Dict[str, str]] = None, duration_hours: Optional[float] = None) -> Dict[str, Any]:
    """
    Check availability of slots for a specific date and optional time range
    
    Args:
        date: Date in YYYY-MM-DD format
        time_range: Optional dict with "start" and "end" times (HH:MM format)
        duration_hours: Optional duration for conflict checking
    
    Returns:
        Dict with available slots and status
    """
    try:
        logger.info(f"Checking availability for date: {date}, time_range: {time_range}, duration: {duration_hours}")
        
        # Get slots for the date
        if date not in ALL_SLOTS:
            # Generate slots if date not in pre-generated data
            from data.ace_padel_club import generate_slots_for_date
            slots = generate_slots_for_date(date)
        else:
            slots = ALL_SLOTS[date]
        
        # Filter by time range if provided
        if time_range:
            start_time = time_range.get("start")
            end_time = time_range.get("end")
            
            filtered_slots = []
            for slot in slots:
                slot_start = slot["slot_time"]
                slot_end = slot["end_time"]
                
                # Check if slot overlaps with requested time range
                if start_time and end_time:
                    # Include slot if it starts within the range
                    # Also include if slot end time is within range (for better coverage)
                    if (slot_start >= start_time and slot_start < end_time) or \
                       (slot_end > start_time and slot_end <= end_time):
                        filtered_slots.append(slot)
                elif start_time:
                    # Only start time provided (e.g., "after 6pm")
                    if slot_start >= start_time:
                        filtered_slots.append(slot)
            slots = filtered_slots
        
        # Filter only available slots
        available_slots = [s for s in slots if s["status"] == "available"]
        
        # Get booked slots for conflict checking (agent rule: no overlaps allowed)
        booked_slots = [s for s in slots if s["status"] in ["booked", "paid"]]
        
        # If duration specified, apply agent rule: filter out slots that would conflict
        # This is a general booking rule - applies to all vendors
        if duration_hours and available_slots:
            available_slots = filter_conflicting_slots(available_slots, booked_slots, duration_hours)
        
        # Add duration options to each slot (30 mins, 1 hr, 1.5 hrs, 2 hrs)
        for slot in available_slots:
            price_per_hour = slot.get("price_per_hour", slot.get("price", 0))
            slot["duration_options"] = [
                {
                    "duration_hours": 0.5,
                    "duration_minutes": 30,
                    "price": int(price_per_hour * 0.5),
                    "discounted_price": int(price_per_hour * 0.5 * 0.8)
                },
                {
                    "duration_hours": 1.0,
                    "duration_minutes": 60,
                    "price": int(price_per_hour * 1.0),
                    "discounted_price": int(price_per_hour * 1.0 * 0.8)
                },
                {
                    "duration_hours": 1.5,
                    "duration_minutes": 90,
                    "price": int(price_per_hour * 1.5),
                    "discounted_price": int(price_per_hour * 1.5 * 0.8)
                },
                {
                    "duration_hours": 2.0,
                    "duration_minutes": 120,
                    "price": int(price_per_hour * 2.0),
                    "discounted_price": int(price_per_hour * 2.0 * 0.8)
                }
            ]
        
        return {
            "success": True,
            "date": date,
            "total_slots": len(slots),
            "available_slots": available_slots,
            "booked_slots": [s for s in slots if s["status"] == "booked"],
            "paid_slots": [s for s in slots if s["status"] == "paid"]
        }
        
    except Exception as e:
        logger.error(f"Error checking availability: {e}")
        return {
            "success": False,
            "error": str(e),
            "available_slots": []
        }


def get_pricing() -> Dict[str, Any]:
    """
    Get pricing information for Ace Padel Club
    
    Returns:
        Dict with pricing details
    """
    try:
        logger.info("Getting pricing information")
        
        return {
            "success": True,
            "pricing": PRICING,
            "payment_details": PAYMENT_DETAILS
        }
        
    except Exception as e:
        logger.error(f"Error getting pricing: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def get_vendor_info() -> Dict[str, Any]:
    """
    Get vendor information for Ace Padel Club
    
    Returns:
        Dict with vendor details
    """
    try:
        logger.info("Getting vendor information")
        
        vendor_data = get_vendor_data()
        
        return {
            "success": True,
            "vendor": vendor_data["vendor"],
            "pricing": vendor_data["pricing"],
            "payment_details": vendor_data["payment_details"]
        }
        
    except Exception as e:
        logger.error(f"Error getting vendor info: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def suggest_alternatives(date: str, requested_time: Optional[str] = None) -> Dict[str, Any]:
    """
    Suggest alternative slots when requested slot is unavailable
    
    Args:
        date: Date in YYYY-MM-DD format
        requested_time: Optional requested time (HH:MM)
    
    Returns:
        Dict with alternative slot suggestions
    """
    try:
        logger.info(f"Suggesting alternatives for {date} at {requested_time}")
        
        # Get all slots for the date
        if date not in ALL_SLOTS:
            from data.ace_padel_club import generate_slots_for_date
            slots = generate_slots_for_date(date)
        else:
            slots = ALL_SLOTS[date]
        
        # Get available slots
        available = [s for s in slots if s["status"] == "available"]
        
        # If specific time requested, find closest alternatives
        if requested_time:
            # Find slots around the requested time
            alternatives = []
            for slot in available[:5]:  # Top 5 alternatives
                alternatives.append({
                    "time": f"{slot['slot_time']} - {slot['end_time']}",
                    "price": slot["price"],
                    "discounted_price": slot["discounted_price"]
                })
        else:
            # Return all available slots
            alternatives = [
                {
                    "time": f"{s['slot_time']} - {s['end_time']}",
                    "price": s["price"],
                    "discounted_price": s["discounted_price"]
                }
                for s in available[:10]  # Top 10 alternatives
            ]
        
        return {
            "success": True,
            "date": date,
            "alternatives": alternatives
        }
        
    except Exception as e:
        logger.error(f"Error suggesting alternatives: {e}")
        return {
            "success": False,
            "error": str(e),
            "alternatives": []
        }

