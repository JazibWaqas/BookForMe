"""
LangGraph Tools - Query Firestore database
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from data.ace_padel_club import PRICING, PAYMENT_DETAILS, get_vendor_data
import sys
import os
import pytz
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.firestore_v2 import FirestoreV2
from app.firestore import firestore_db

logger = logging.getLogger(__name__)


# Import general booking rules (agent rules, not vendor-specific)
from agent.booking_rules import check_slot_conflict, filter_conflicting_slots, validate_booking_duration


async def check_availability(
    sport_type: str,
    area: str,
    date: str,
    time_range: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Check availability of slots for sport type and area on specific date and optional time range

    Args:
        sport_type: Type of sport (e.g., "padel", "tennis")
        area: Area/location to search in (e.g., "DHA", "Gulberg")
        date: Date in YYYY-MM-DD format
        time_range: Optional dict with "start" and "end" times (HH:MM format)

    Returns:
        Dict with available slots from multiple vendors
    """
    try:
        logger.info(f"Checking availability for sport: {sport_type}, area: {area}, date: {date}, time_range: {time_range}")

        # Initialize Firestore client
        fs_client = FirestoreV2(firestore_db.db)

        # Step 1: Get vendors by sport type and area
        vendors_by_sport = await fs_client.get_vendors_by_sport(sport_type)
        vendors_by_area = await fs_client.get_vendors_by_area(area)

        # Find intersection of vendors that match both sport and area
        vendor_ids_by_sport = {v['id'] for v in vendors_by_sport}
        vendor_ids_by_area = {v['id'] for v in vendors_by_area}
        matching_vendor_ids = vendor_ids_by_sport.intersection(vendor_ids_by_area)

        if not matching_vendor_ids:
            logger.warning(f"No vendors found for sport '{sport_type}' in area '{area}'")
            return {
                "success": True,
                "date": date,
                "sport_type": sport_type,
                "area": area,
                "vendors": [],
                "message": f"No vendors found offering {sport_type} in {area}"
            }

        # Step 2: For each matching vendor, get their services and available slots
        vendors_data = []
        for vendor_id in list(matching_vendor_ids)[:3]:  # Limit to 3 vendors as requested
            try:
                # Get vendor details
                vendor = await fs_client.get_vendor(vendor_id)
                if not vendor:
                    continue

                # Get vendor's services for this sport
                services = await fs_client.get_vendor_services(vendor_id)
                service = next((s for s in services if s.get('sport_type') == sport_type), None)
                if not service:
                    continue

                # Get available slots for this vendor on the date
                available_slots = await fs_client.get_available_slots(vendor_id, date)

                # Filter slots by time range if provided
                if time_range:
                    PKT = pytz.timezone('Asia/Karachi')
                    start_time = time_range.get("start")
                    end_time = time_range.get("end")

                    filtered_slots = []
                    for slot in available_slots:
                        slot_start_str = slot.get("start_time", "")
                        if isinstance(slot_start_str, datetime):
                            # Convert UTC to PKT before filtering
                            slot_start_pkt = slot_start_str.astimezone(PKT) if slot_start_str.tzinfo else slot_start_str
                            slot_start = slot_start_pkt.strftime("%H:%M")
                        else:
                            slot_start = str(slot_start_str)[:5]  # Take HH:MM part

                        if start_time and end_time:
                            # Include slot if it starts within the range
                            if start_time <= slot_start < end_time:
                                filtered_slots.append(slot)
                        elif start_time:
                            # Only start time provided (e.g., "after 6pm")
                            if slot_start >= start_time:
                                filtered_slots.append(slot)
                    available_slots = filtered_slots

                # Format slots for response
                formatted_slots = []
                PKT = pytz.timezone('Asia/Karachi')
                for slot in available_slots[:5]:  # Show up to 5 slots per vendor
                    slot_start_str = slot.get("start_time", "")
                    slot_end_str = slot.get("end_time", "")

                    if isinstance(slot_start_str, datetime):
                        # Convert UTC to PKT before formatting for WhatsApp users
                        slot_start_pkt = slot_start_str.astimezone(PKT) if slot_start_str.tzinfo else slot_start_str
                        slot_start = slot_start_pkt.strftime("%H:%M")
                        
                        if isinstance(slot_end_str, datetime):
                            slot_end_pkt = slot_end_str.astimezone(PKT) if slot_end_str.tzinfo else slot_end_str
                            slot_end = slot_end_pkt.strftime("%H:%M")
                        else:
                            slot_end = slot_end_str
                    else:
                        slot_start = str(slot_start_str)[:5]
                        slot_end = str(slot_end_str)[:5] if slot_end_str else ""

                    formatted_slots.append({
                        "time_slot": f"{slot_start} - {slot_end}",
                        "price": int(slot.get("price", 0)),
                        "resource_id": slot.get("resource_id", ""),
                        "slot_id": slot.get("id", "")
                    })

                # Add vendor data if they have available slots
                if formatted_slots:
                    vendors_data.append({
                        "vendor_id": vendor_id,
                        "vendor_name": vendor.get("name", "Unknown Vendor"),
                        "vendor_address": vendor.get("address", "Address not available"),
                        "area": vendor.get("area", ""),
                        "pricing": {
                            "base_price": int(service.get("pricing", {}).get("base", 0)),
                            "currency": "PKR"
                        },
                        "available_slots": formatted_slots
                    })

            except Exception as e:
                logger.error(f"Error processing vendor {vendor_id}: {e}")
                continue

        return {
            "success": True,
            "date": date,
            "sport_type": sport_type,
            "area": area,
            "vendors": vendors_data,
            "total_vendors": len(vendors_data)
        }

    except Exception as e:
        logger.error(f"Error checking availability: {e}")
        return {
            "success": False,
            "error": str(e),
            "vendors": []
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

