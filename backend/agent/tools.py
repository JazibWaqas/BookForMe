"""
LangGraph Tools - Query Firestore database
"""

import asyncio
import copy
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

_AVAILABILITY_CACHE: Dict[str, Any] = {}
_AVAILABILITY_CACHE_TTL = 60


def _availability_cache_key(
    sport_type: str,
    area: Optional[str],
    date: str,
    time_range: Optional[Dict[str, str]] = None,
    vendor_name: Optional[str] = None,
    vendor_id: Optional[str] = None,
) -> str:
    tr = ""
    if time_range:
        tr = f"{time_range.get('start', '')}-{time_range.get('end', '')}"
    return "|".join([
        (sport_type or "").lower(),
        (area or "").lower(),
        date or "",
        tr,
        (vendor_name or "").lower(),
        (vendor_id or "").lower(),
    ])


def _availability_cache_get(key: str) -> Optional[Dict[str, Any]]:
    import time
    entry = _AVAILABILITY_CACHE.get(key)
    if entry and time.time() - entry[1] < _AVAILABILITY_CACHE_TTL:
        logger.info(f"TIMING: availability cache HIT for {key}")
        return copy.deepcopy(entry[0])
    return None


def _availability_cache_set(key: str, value: Dict[str, Any]) -> None:
    import time
    _AVAILABILITY_CACHE[key] = (copy.deepcopy(value), time.time())


def clear_availability_cache() -> None:
    _AVAILABILITY_CACHE.clear()


async def warm_common_availability(
    sport_type: str,
    area: Optional[str],
    date: str,
    vendor_name: Optional[str] = None,
    vendor_id: Optional[str] = None,
    buckets: Optional[List[str]] = None,
) -> None:
    """Read-only background warm-up for likely next availability queries."""
    bucket_ranges = {
        "morning": {"start": "07:00", "end": "12:00"},
        "afternoon": {"start": "12:00", "end": "17:00"},
        "evening": {"start": "17:00", "end": "19:00"},
        "night": {"start": "20:00", "end": "23:00"},
    }
    selected = buckets or ["evening", "night", "morning"]
    try:
        await asyncio.gather(*[
            check_availability(
                sport_type=sport_type,
                area=area,
                date=date,
                time_range=bucket_ranges[b],
                vendor_name=vendor_name,
                vendor_id=vendor_id,
            )
            for b in selected
            if b in bucket_ranges
        ])
    except Exception as e:
        logger.warning(f"Availability warm-up skipped: {e}")


# Import general booking rules (agent rules, not vendor-specific)
from agent.booking_rules import check_slot_conflict, filter_conflicting_slots, validate_booking_duration


def _resolve_vendor_by_name(vendor_name: str, vendors: List[Dict[str, Any]]) -> Optional[str]:
    """Fuzzy-match a user-provided vendor name against known vendors."""
    if not vendor_name:
        return None
    from difflib import SequenceMatcher
    name_lower = vendor_name.lower().strip()
    aliases = [a for a in name_lower.split() if len(a) > 2]

    best_id: Optional[str] = None
    best_score: float = 0.0

    for v in vendors:
        vid = v.get('id', '').lower()
        vname = v.get('name', '').lower()

        if name_lower == vname or name_lower == vid:
            return v['id']

        matched = sum(1 for a in aliases if a in vname or a in vid)
        if matched == 0:
            continue

        ratio = SequenceMatcher(None, name_lower, vname).ratio()
        score = matched + ratio

        if score > best_score:
            best_score = score
            best_id = v['id']

    if best_id and best_score >= 1.3:
        return best_id
    return None


async def check_availability(
    sport_type: str,
    area: Optional[str],
    date: str,
    time_range: Optional[Dict[str, str]] = None,
    vendor_name: Optional[str] = None,
    vendor_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Check availability of slots for sport type on specific date.

    Args:
        sport_type: Type of sport (e.g., "padel", "tennis")
        area: Area/location to search in. If None/empty, returns ALL vendors for the sport.
        date: Date in YYYY-MM-DD format
        time_range: Optional dict with "start" and "end" times (HH:MM format)
        vendor_name: Optional vendor name from user (e.g. "Ace Padel Club")
        vendor_id: Optional exact vendor_id if already known

    Returns:
        Dict with available slots from multiple vendors
    """
    try:
        import time
        import os
        start_time = time.time()
        logger.info(f"Checking availability: sport={sport_type}, area={area or 'all'}, date={date}, time_range={time_range}, vendor_name={vendor_name}, vendor_id={vendor_id}")
        logger.info(f"INSTANCE PID: {os.getpid()}")

        cache_key = _availability_cache_key(sport_type, area, date, time_range, vendor_name, vendor_id)
        cached = _availability_cache_get(cache_key)
        if cached is not None:
            return cached

        fs_client = FirestoreV2(firestore_db.db)

        async def _fs_call(method_name: str, *args):
            """Run Firestore's sync SDK work off the event loop."""
            def _runner():
                local_client = FirestoreV2(firestore_db.db)
                return asyncio.run(getattr(local_client, method_name)(*args))
            return await asyncio.to_thread(_runner)

        vendors_by_sport = await fs_client.get_vendors_by_sport(sport_type)
        logger.info(f"TIMING: get_vendors_by_sport took {time.time() - start_time:.4f}s - Found {len(vendors_by_sport)}")

        # Re-bind the client in case get_vendors_by_sport triggered a reconnect.
        # This ensures get_available_slots uses the same fresh connection.
        fs_client = FirestoreV2(firestore_db.db)

        resolved_vendor_id = None
        if vendor_name:
            resolved_vendor_id = _resolve_vendor_by_name(vendor_name, vendors_by_sport)
            if resolved_vendor_id:
                logger.info(f"Resolved vendor_name '{vendor_name}' to vendor_id '{resolved_vendor_id}'")
        if not resolved_vendor_id and vendor_id:
            resolved_vendor_id = vendor_id
            logger.info(f"Using provided vendor_id '{resolved_vendor_id}'")

        if resolved_vendor_id:
            matching_vendor_ids = {resolved_vendor_id}
        elif area and area.lower().strip() not in ("all", "karachi", ""):
            area_lower = area.lower().strip()
            matching = [v for v in vendors_by_sport if area_lower in v.get('area', '').lower()]
            matching_vendor_ids = {v['id'] for v in matching}
        else:
            area = None
            matching_vendor_ids = {v['id'] for v in vendors_by_sport}

        if not matching_vendor_ids:
            logger.warning(f"No vendors found for sport '{sport_type}'" + (f" in area '{area}'" if area else ""))
            return {
                "success": False,
                "error": "no_vendors",
                "date": date,
                "sport_type": sport_type,
                "area": area or "all",
                "vendors": [],
                "message": f"No vendors found offering {sport_type}" + (f" in {area}" if area else "")
            }

        # Step 2: Fetch all vendors in parallel
        async def _process_vendor(vendor_id: str):
            try:
                vendor, services, available_slots = await asyncio.gather(
                    _fs_call("get_vendor", vendor_id),
                    _fs_call("get_vendor_services", vendor_id),
                    _fs_call("get_available_slots", vendor_id, date),
                )
                if not vendor:
                    return None, False
                service = next((s for s in services if s.get('sport_type') == sport_type), None)
                if not service:
                    return None, False

                _time_exact = False
                if time_range:
                    PKT = pytz.timezone('Asia/Karachi')
                    req_start = time_range.get("start")
                    req_end = time_range.get("end")

                    def _parse_slot_start(slot, tz=PKT):
                        raw = slot.get("start_time") or slot.get("time") or slot.get("slot_time") or ""
                        if isinstance(raw, datetime):
                            raw = raw.astimezone(tz) if raw.tzinfo else raw
                            return raw.strftime("%H:%M")
                        return str(raw)[:5]

                    filtered_slots = []
                    for slot in available_slots:
                        ss = _parse_slot_start(slot)
                        if not ss:
                            continue
                        if req_start and req_end:
                            if req_start <= ss < req_end:
                                filtered_slots.append(slot)
                        elif req_start:
                            if ss >= req_start:
                                filtered_slots.append(slot)

                    if filtered_slots:
                        available_slots = filtered_slots
                    elif available_slots:
                        _time_exact = True
                        req_time = req_start or req_end
                        if req_time:
                            def _time_dist(slot, rt=req_time):
                                ss = _parse_slot_start(slot)
                                try:
                                    rh, rm = map(int, rt.split(":"))
                                    sh, sm = map(int, ss.split(":"))
                                    return abs((sh * 60 + sm) - (rh * 60 + rm))
                                except Exception:
                                    return 9999
                            available_slots = sorted(available_slots, key=_time_dist)
                        logger.info(
                            f"Exact time {req_start} unavailable for vendor {vendor_id}; "
                            f"offering {len(available_slots)} nearby slots"
                        )
                    else:
                        available_slots = []

                PKT = pytz.timezone('Asia/Karachi')
                formatted_slots = []
                for slot in available_slots:
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

                if formatted_slots:
                    return {
                        "vendor_id": vendor_id,
                        "vendor_name": vendor.get("name", "Unknown Vendor"),
                        "vendor_address": vendor.get("address", "Address not available"),
                        "area": vendor.get("area", ""),
                        "pricing": {
                            "base_price": int(service.get("pricing", {}).get("base", 0)),
                            "currency": "PKR"
                        },
                        "slots": formatted_slots
                    }, _time_exact
                return None, False
            except Exception as e:
                logger.error(f"Error processing vendor {vendor_id}: {e}")
                return None, False

        vendor_results = await asyncio.gather(*[
            _process_vendor(vid) for vid in list(matching_vendor_ids)[:7]
        ])
        vendors_data = []
        time_exact_unavailable = False
        for vendor_dict, exact in vendor_results:
            if vendor_dict is not None:
                vendors_data.append(vendor_dict)
            if exact:
                time_exact_unavailable = True

        res = {
            "success": True,
            "date": date,
            "sport_type": sport_type,
            "area": area or "Karachi",
            "vendors": vendors_data,
            "total_vendors": len(vendors_data),
            "time_exact_unavailable": time_exact_unavailable and bool(vendors_data),
            "requested_time": time_range.get("start") if time_range else None,
        }
        _availability_cache_set(cache_key, res)
        logger.info(f"TIMING: check_availability total took {time.time() - start_time:.4f}s - returning {len(vendors_data)} vendors")
        return res

    except Exception as e:
        logger.error(f"Error checking availability: {e}")
        return {
            "success": False,
            "error": "database_unavailable",
            "details": str(e),
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

