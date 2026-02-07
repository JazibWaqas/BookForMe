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
    area: Optional[str],
    date: str,
    time_range: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Check availability of slots for sport type and area on specific date and optional time range

    Args:
        sport_type: Type of sport (e.g., "padel", "tennis")
        area: Area/location to search in (e.g., "DHA", "Clifton"). If None/empty, returns ALL vendors for the sport.
        date: Date in YYYY-MM-DD format
        time_range: Optional dict with "start" and "end" times (HH:MM format)

    Returns:
        Dict with available slots from multiple vendors
    """
    try:
        logger.info(f"Checking availability for sport: {sport_type}, area: {area or 'all'}, date: {date}, time_range: {time_range}")

        fs_client = FirestoreV2(firestore_db.db)

        vendors_by_sport = await fs_client.get_vendors_by_sport(sport_type)

        if area:
            area_lower = area.lower().strip()
            matching = [v for v in vendors_by_sport if area_lower in v.get('area', '').lower()]
            matching_vendor_ids = {v['id'] for v in matching}
        else:
            matching_vendor_ids = {v['id'] for v in vendors_by_sport}

        if not matching_vendor_ids:
            logger.warning(f"No vendors found for sport '{sport_type}'" + (f" in area '{area}'" if area else ""))
            return {
                "success": True,
                "date": date,
                "sport_type": sport_type,
                "area": area or "all",
                "vendors": [],
                "message": f"No vendors found offering {sport_type}" + (f" in {area}" if area else "")
            }

        # Step 2: For each matching vendor, get their services and available slots
        vendors_data = []
        for vendor_id in list(matching_vendor_ids)[:15]:
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

                if time_range:
                    PKT = pytz.timezone('Asia/Karachi')
                    start_time = time_range.get("start")
                    end_time = time_range.get("end")

                    filtered_slots = []
                    for slot in available_slots:
                        raw_start = slot.get("start_time") or slot.get("time") or slot.get("slot_time") or ""
                        if isinstance(raw_start, datetime):
                            pkt = raw_start.astimezone(PKT) if raw_start.tzinfo else raw_start
                            slot_start = pkt.strftime("%H:%M")
                        else:
                            slot_start = str(raw_start)[:5]

                        if not slot_start:
                            continue
                        if start_time and end_time:
                            if start_time <= slot_start < end_time:
                                filtered_slots.append(slot)
                        elif start_time:
                            if slot_start >= start_time:
                                filtered_slots.append(slot)
                    available_slots = filtered_slots

                formatted_slots = []
                PKT = pytz.timezone('Asia/Karachi')
                for slot in available_slots[:8]:
                    raw_start = slot.get("start_time") or slot.get("time") or slot.get("slot_time") or ""
                    raw_end = slot.get("end_time") or ""

                    if isinstance(raw_start, datetime):
                        pkt_start = raw_start.astimezone(PKT) if raw_start.tzinfo else raw_start
                        slot_start = pkt_start.strftime("%H:%M")
                    else:
                        slot_start = str(raw_start)[:5]

                    if isinstance(raw_end, datetime):
                        pkt_end = raw_end.astimezone(PKT) if raw_end.tzinfo else raw_end
                        slot_end = pkt_end.strftime("%H:%M")
                    elif raw_end:
                        slot_end = str(raw_end)[:5]
                    elif slot_start and ":" in slot_start:
                        h = int(slot_start.split(":")[0])
                        slot_end = f"{(h + 1) % 24:02d}:00"
                    else:
                        slot_end = ""

                    if not slot_start:
                        continue

                    formatted_slots.append({
                        "slot_id": slot.get("id", ""),
                        "slot_time": slot_start,
                        "end_time": slot_end,
                        "time_display": f"{slot_start} - {slot_end}",
                        "price": int(slot.get("price", 0)),
                        "resource_id": slot.get("resource_id", ""),
                        "resource_name": slot.get("resource_name", "")
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
                        "slots": formatted_slots
                    })

            except Exception as e:
                logger.error(f"Error processing vendor {vendor_id}: {e}")
                continue

        return {
            "success": True,
            "date": date,
            "sport_type": sport_type,
            "area": area or "Karachi",
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


async def suggest_alternatives(
    vendor_id: str,
    date: str,
    requested_time: Optional[str] = None
) -> Dict[str, Any]:
    """
    Suggest alternative slots when requested slot is unavailable
    Uses Firestore to fetch real availability data
    
    Args:
        vendor_id: Vendor ID to get alternatives for
        date: Date in YYYY-MM-DD format
        requested_time: Optional requested time (HH:MM) for sorting by proximity
    
    Returns:
        Dict with alternative slot suggestions
    """
    try:
        logger.info(f"Suggesting alternatives for vendor={vendor_id}, date={date}, time={requested_time}")
        
        fs_client = FirestoreV2(firestore_db.db)
        
        available_slots = await fs_client.get_available_slots(vendor_id, date)
        
        if not available_slots:
            return {
                "success": True,
                "date": date,
                "vendor_id": vendor_id,
                "alternatives": [],
                "message": "No available slots for this date"
            }
        
        PKT = pytz.timezone('Asia/Karachi')
        
        def parse_slot_time(slot):
            start = slot.get("start_time")
            if isinstance(start, datetime):
                return start.astimezone(PKT) if start.tzinfo else PKT.localize(start)
            try:
                return datetime.strptime(f"{date} {start}", "%Y-%m-%d %H:%M")
            except:
                return None
        
        slots_with_time = [(s, parse_slot_time(s)) for s in available_slots]
        slots_with_time = [(s, t) for s, t in slots_with_time if t is not None]
        
        if requested_time:
            try:
                req_dt = datetime.strptime(f"{date} {requested_time}", "%Y-%m-%d %H:%M")
                slots_with_time.sort(key=lambda x: abs((x[1] - req_dt).total_seconds()))
            except:
                pass
        else:
            slots_with_time.sort(key=lambda x: x[1])
        
        alternatives = []
        for slot, slot_time in slots_with_time[:5]:
            start_str = slot_time.strftime("%H:%M")
            end = slot.get("end_time")
            if isinstance(end, datetime):
                end_pkt = end.astimezone(PKT) if end.tzinfo else end
                end_str = end_pkt.strftime("%H:%M")
            else:
                end_str = str(end)[:5] if end else ""
            
            alternatives.append({
                "time": f"{start_str} - {end_str}",
                "slot_time": start_str,
                "end_time": end_str,
                "price": int(slot.get("price", 0)),
                "slot_id": slot.get("id", ""),
                "resource_id": slot.get("resource_id", "")
            })
        
        return {
            "success": True,
            "date": date,
            "vendor_id": vendor_id,
            "alternatives": alternatives
        }
        
    except Exception as e:
        logger.error(f"Error suggesting alternatives: {e}")
        return {
            "success": False,
            "error": str(e),
            "alternatives": []
        }

