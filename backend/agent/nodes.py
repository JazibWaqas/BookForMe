"""
LangGraph Agent Nodes - Industry Standard Workflow
Refactored with single-responsibility nodes and conditional routing
Uses Pydantic models for type safety
"""

import logging
import re
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from agent.state import AgentState
from app.firestore import firestore_db
from agent.tools import check_availability, get_pricing, get_vendor_info
from agent.duration import parse_duration
from agent.models import (
    AvailableSlot, SelectedSlot, PendingBooking, BookingResult,
    find_matching_slot, slot_from_query_result
)
from nlu.agent import NLUAgent
from better_profanity import profanity

logger = logging.getLogger(__name__)

nlu_agent = NLUAgent()

profanity.load_censor_words()

BOOKING_KEYWORDS = {
    "padel", "futsal", "cricket", "court", "slot", "book", "booking", "available",
    "availability", "price", "cancel", "time", "date", "tomorrow", "today", "morning",
    "evening", "afternoon", "night", "kal", "aaj", "shaam", "subah", "raat", "dopahar",
    "reserve", "confirm", "yes", "no", "ok", "done", "schedule", "payment", "pay",
    "transfer", "screenshot", "receipt", "salon", "sports", "venue", "dha", "clifton",
    "gulshan", "defense", "karachi", "pitch", "net", "smash", "ace", "golden",
    "match", "game", "play", "ground", "field", "hour", "ghanta", "minute",
    "discount", "charges", "rate", "kitna", "price", "cost", "rupee", "rs",
    "haan", "han", "ji", "theek", "bilkul", "chahiye", "karna", "hai", "hei",
    "slot", "slots", "show", "list", "change", "modify", "different", "other",
    "feb", "march", "april", "may", "june", "july", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday", "sunday", "week", "parso", "next",
    "pm", "am", "bajay", "baje", "around", "after", "before",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
    "hi", "hello", "hey", "aoa", "salam", "assalamualaikum", "walaikum",
    "okay", "sure", "proceed", "nahi", "nope", "stop", "ruko", "mat",
    "want", "need", "mujhe", "pickleball", "bahria",
    "ideally", "prefer", "preferred", "suitable",
}


def check_guardrails(message: str, in_booking_context: bool = False) -> Optional[str]:
    msg = message.strip()
    if not msg:
        return None

    if profanity.contains_profanity(msg):
        return "vulgar"

    if in_booking_context:
        return None

    msg_lower = msg.lower()
    words = set(re.findall(r"[a-z0-9]+", msg_lower))
    if words and not words.intersection(BOOKING_KEYWORDS):
        if len(msg) > 2:
            return "off_topic"

    return None


def route_after_guardrails(state: AgentState) -> str:
    if state.get("guardrail_block"):
        return "generate_response"
    return "classify_intent"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def guardrails_node(state: AgentState) -> AgentState:
    try:
        messages = state.get("messages", [])
        if not messages:
            return state

        last_message = messages[-1].get("content", "")
        in_booking_ctx = any([
            state.get("awaiting_slot_selection"),
            state.get("awaiting_confirmation"),
            state.get("awaiting_payment"),
            state.get("booking_in_progress"),
            state.get("locked_slot_id"),
        ])
        block_reason = check_guardrails(last_message, in_booking_context=in_booking_ctx)

        if block_reason:
            state["guardrail_block"] = block_reason
            if block_reason == "vulgar":
                state["response"] = "Please keep the conversation respectful. I can only help with sports court availability and booking."
            else:
                state["response"] = "I can only help with sports court availability and booking. Please ask about padel, futsal, or cricket slots."
            logger.info(f"Guardrail triggered: {block_reason} for message: '{last_message[:50]}'")
        else:
            state["guardrail_block"] = None

        return state

    except Exception as e:
        logger.error(f"Guardrails check failed: {e}")
        state["guardrail_block"] = None
        return state


def normalize_date(date_text: str) -> str:
    """
    Normalize date text to YYYY-MM-DD format
    Handles: "tomorrow", "today", "kal", "Friday", "2025-12-17", "15 jan", "4 feb", etc.
    """
    today = datetime.now()
    current_year = today.year
    date_lower = date_text.lower().strip()
    
    date_pattern = r'(\d{4}-\d{2}-\d{2})'
    match = re.search(date_pattern, date_text)
    if match:
        extracted_date = match.group(1)
        try:
            datetime.strptime(extracted_date, "%Y-%m-%d")
            return extracted_date
        except:
            pass
    
    if date_lower in ["today", "aaj"]:
        return today.strftime("%Y-%m-%d")
    elif date_lower in ["tomorrow", "kal"]:
        return (today + timedelta(days=1)).strftime("%Y-%m-%d")
    elif "day after tomorrow" in date_lower or "parson" in date_lower:
        return (today + timedelta(days=2)).strftime("%Y-%m-%d")
    
    month_names = {
        "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
        "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6,
        "jul": 7, "july": 7, "aug": 8, "august": 8, "sep": 9, "september": 9,
        "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12
    }
    
    day_month_pattern = r'(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)(?:\s+(\d{4}))?'
    day_month_match = re.search(day_month_pattern, date_lower)
    if day_month_match:
        day = int(day_month_match.group(1))
        month_name = day_month_match.group(2)
        year = int(day_month_match.group(3)) if day_month_match.group(3) else current_year
        month = month_names.get(month_name)
        if month:
            try:
                parsed = datetime(year, month, day)
                if parsed < today:
                    parsed = datetime(current_year + 1, month, day)
                return parsed.strftime("%Y-%m-%d")
            except ValueError:
                pass
    
    date_formats = ['%B %d, %Y', '%d %B %Y', '%B %d %Y', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d']
    for fmt in date_formats:
        try:
            parsed = datetime.strptime(date_text, fmt)
            if parsed < today and fmt != '%Y-%m-%d':
                parsed = parsed.replace(year=current_year)
                if parsed < today:
                    parsed = parsed.replace(year=current_year + 1)
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    day_names = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }
    for day_name, day_num in day_names.items():
        if day_name in date_lower:
            days_ahead = day_num - today.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
    
    logger.warning(f"Could not parse date '{date_text}', defaulting to today")
    return today.strftime("%Y-%m-%d")


def normalize_time(time_text: str) -> Optional[Dict[str, str]]:
    """
    Normalize time text to time range dict.
    Prioritizes explicit clock times over vague buckets so that
    "evening 4 pm" resolves to 16:00, not 18:00-23:00.
    """
    time_lower = time_text.lower().strip()

    hhmm_match = re.match(r'^(\d{1,2}):(\d{2})$', time_lower)
    if hhmm_match:
        hour = int(hhmm_match.group(1))
        minute = int(hhmm_match.group(2))
        return {"start": f"{hour:02d}:{minute:02d}", "end": f"{(hour+1) % 24:02d}:{minute:02d}"}

    pm_match = re.search(r"(\d{1,2})\s*pm", time_lower)
    am_match = re.search(r"(\d{1,2})\s*am", time_lower)
    if pm_match:
        hour = int(pm_match.group(1))
        if hour < 12:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1) % 24:02d}:00"}
    if am_match:
        hour = int(am_match.group(1))
        if hour == 12:
            hour = 0
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1):02d}:00"}

    bajay_match = re.search(r"(\d+)\s*baj(?:ay|e|ey)(?:\s+kei?\s+around)?", time_lower)
    if bajay_match:
        hour = int(bajay_match.group(1))
        if hour <= 11 and "subah" not in time_lower and "morning" not in time_lower:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1) % 24:02d}:00"}

    if "-" in time_lower:
        match = re.search(r"(\d+)[:\s]?(\d+)?\s*-\s*(\d+)[:\s]?(\d+)?", time_lower)
        if match:
            start_hour = int(match.group(1))
            end_hour = int(match.group(3))
            return {"start": f"{start_hour:02d}:00", "end": f"{end_hour:02d}:00"}

    if "after" in time_lower:
        match = re.search(r"after\s+(\d+)", time_lower)
        if match:
            hour = int(match.group(1))
            return {"start": f"{hour:02d}:00"}

    around_match = re.search(r"around\s+(\d+)", time_lower)
    if around_match:
        hour = int(around_match.group(1))
        if hour <= 11:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1) % 24:02d}:00"}

    if "evening" in time_lower or "shaam" in time_lower:
        return {"start": "18:00", "end": "23:00"}
    elif "morning" in time_lower or "subah" in time_lower:
        return {"start": "09:00", "end": "12:00"}
    elif "afternoon" in time_lower or "dopahar" in time_lower:
        return {"start": "12:00", "end": "18:00"}
    elif "night" in time_lower or "raat" in time_lower:
        return {"start": "21:00", "end": "23:00"}

    return None


BOOKING_SIGNALS = {
    "padel", "futsal", "cricket", "salon", "book", "booking", "slot", "available",
    "availability", "price", "time", "date", "tomorrow", "today", "morning",
    "evening", "afternoon", "night", "kal", "aaj", "shaam", "subah", "raat",
    "pm", "am", "bajay", "baje", "court", "pitch", "reserve", "want",
    "chahiye", "karna", "ace", "golden", "smash",
}


def is_greeting(message: str) -> bool:
    """Check if message is a PURE greeting with no booking content"""
    greetings = ["hi", "hello", "hey", "aoa", "salam", "salaam", "assalam", "assalamu", "assalamu alaikum"]
    msg_lower = message.lower().strip()
    if msg_lower in greetings:
        return True
    words = set(re.findall(r"[a-z]+", msg_lower))
    if words.intersection(BOOKING_SIGNALS):
        return False
    return any(msg_lower.startswith(g + " ") for g in greetings) and not words.intersection(BOOKING_SIGNALS)


def extract_slot_from_time_data(time_data: Any) -> Optional[Dict[str, str]]:
    """Extract slot from time data (dict or string)"""
    if isinstance(time_data, dict):
        slot_time = time_data.get("start")
        if slot_time:
            return {"slot_time": slot_time, "end_time": time_data.get("end", "")}
    elif isinstance(time_data, str):
        normalized = normalize_time(time_data)
        if normalized:
            return {"slot_time": normalized.get("start", ""), "end_time": normalized.get("end", "")}
    return None


def extract_slot_from_message(message: str) -> Optional[Dict[str, str]]:
    """Extract slot directly from message text (including explicit slot IDs)"""
    msg = message.strip()
    msg_lower = msg.lower()
    slot_id_pattern = r"\b(\d{8}_\d{2,4}_[a-z0-9_]+)\b"
    slot_id_match = re.search(slot_id_pattern, msg_lower)
    if slot_id_match:
        raw_id = slot_id_match.group(1)
        parts = raw_id.split("_")
        if len(parts) >= 3:
            time_part = parts[1]
            hour = int(time_part[:2])
            minute = int(time_part[2:]) if len(time_part) > 2 else 0
            slot_time = f"{hour:02d}:{minute:02d}"
            end_hour = (hour + 1) % 24
            end_time = f"{end_hour:02d}:{minute:02d}"
            return {"slot_id": raw_id, "slot_time": slot_time, "end_time": end_time}
    am_pm_pattern = r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)"
    am_pm_match = re.search(am_pm_pattern, msg_lower)
    if am_pm_match:
        hour = int(am_pm_match.group(1))
        minute = int(am_pm_match.group(2)) if am_pm_match.group(2) else 0
        period = am_pm_match.group(3)
        
        if period == "pm" and hour < 12:
            hour += 12
        elif period == "am" and hour == 12:
            hour = 0
        
        slot_time = f"{hour:02d}:{minute:02d}"
        end_hour = (hour + 1) % 24
        return {"slot_time": slot_time, "end_time": f"{end_hour:02d}:{minute:02d}"}
    
    slot_pattern = r"(\d{1,2})[:\s-]+(\d{1,2})"
    slot_m = re.search(slot_pattern, message)
    if slot_m:
        try:
            start_hour = int(slot_m.group(1))
            end_hour = int(slot_m.group(2))
            if start_hour < 24 and end_hour < 24:
                return {"slot_time": f"{start_hour:02d}:00", "end_time": f"{end_hour:02d}:00"}
        except (ValueError, IndexError):
            pass
    
    return None


# =============================================================================
# NODE 1: CLASSIFY INTENT (Pure NLU)
# =============================================================================

async def classify_intent_node(state: AgentState) -> AgentState:
    """Pure NLU - classify intent and extract raw entities"""
    try:
        logger.info("🔵 Node: classify_intent")
        
        messages = state.get("messages", [])
        if not messages:
            state["current_intent"] = "greeting"
            state["entities"] = {}
            return state
        
        last_message = messages[-1]["content"]
        logger.info(f"Processing: '{last_message}'")
        
        if is_greeting(last_message):
            logger.info("Detected greeting via fallback")
            state["current_intent"] = "greeting"
            state["entities"] = {}
            state["vendor_id"] = state.get("vendor_id") or "ace_padel_club"
            return state
        
        conversation_history = [
            {"role": m.get("role"), "content": m.get("content")}
            for m in messages[:-1]
        ]
        
        nlu_result = await nlu_agent.extract_intent(last_message, conversation_history)
        raw_intent = nlu_result.get("intent", "unknown")
        intent_5 = {
            "booking_request": "inquiry",
            "availability_inquiry": "inquiry",
            "service_selection": "inquiry",
            "date_selection": "inquiry",
            "time_selection": "inquiry",
            "price_inquiry": "info_request",
            "information": "info_request",
            "payment_related": "info_request",
            "confirmation": "transaction",
            "cancellation": "transaction",
            "modification": "transaction",
            "greeting": "greeting",
            "name_provided": "unknown",
            "unknown": "unknown",
        }.get(raw_intent, "unknown" if raw_intent not in ("inquiry", "info_request", "transaction", "greeting") else raw_intent)
        state["current_intent"] = intent_5
        entities = nlu_result.get("entities", {})
        state["entities"] = {k: v for k, v in entities.items() if v is not None}
        
        logger.info(f"Intent: '{state['current_intent']}', Entities: {state['entities']}")
        return state
        
    except Exception as e:
        logger.error(f"Intent classification failed: {e}")
        state["current_intent"] = "unknown"
        state["entities"] = {}
        state["error"] = {"type": "classification_error", "message": str(e)}
        return state


# =============================================================================
# NODE 2: NORMALIZE ENTITIES
# =============================================================================

async def normalize_entities_node(state: AgentState) -> AgentState:
    """Normalize extracted entities to standard formats"""
    try:
        logger.info("🔵 Node: normalize_entities")
        
        entities = state.get("entities", {})
        messages = state.get("messages", [])
        last_message = messages[-1].get("content", "") if messages else ""
        
        date_value = entities.get("date")
        if date_value:
            try:
                date_text = date_value.get("text") if isinstance(date_value, dict) else str(date_value)
                if date_text:
                    entities["date"] = normalize_date(date_text)
                    state["selected_date"] = entities["date"]
                    logger.info(f"Normalized date: {entities['date']}")
            except Exception as e:
                logger.warning(f"Date normalization failed: {e}")
        
        time_value = entities.get("time")
        if time_value:
            try:
                time_text = time_value.get("text") if isinstance(time_value, dict) else str(time_value)
                if time_text:
                    time_range = normalize_time(time_text)
                    if time_range:
                        entities["time_range"] = time_range
                        logger.info(f"Normalized time: {time_range}")
            except Exception as e:
                logger.warning(f"Time normalization failed: {e}")
        
        area_value = entities.get("area")
        if area_value:
            area_text = area_value.get("text") if isinstance(area_value, dict) else str(area_value)
            if area_text:
                entities["area"] = area_text.strip()

        duration_text = entities.get("duration")
        if not duration_text:
            msg_lower = last_message.lower()
            if any(word in msg_lower for word in ["ghanta", "hour", "minute", "min"]):
                duration_text = last_message

        if duration_text:
            try:
                duration_info = parse_duration(str(duration_text))
                if duration_info:
                    entities["duration_hours"] = duration_info["hours"]
                    state["selected_duration"] = duration_info["hours"]
                    logger.info(f"Parsed duration: {duration_info['hours']} hours")
            except Exception as e:
                logger.warning(f"Duration parsing failed: {e}")
        
        state["entities"] = entities
        return state
        
    except Exception as e:
        logger.error(f"Entity normalization failed: {e}")
        state["error"] = {"type": "normalization_error", "message": str(e)}
        return state


# =============================================================================
# NODE 3: EXTRACT SLOT
# =============================================================================

async def extract_slot_node(state: AgentState) -> AgentState:
    try:
        logger.info("🔵 Node: extract_slot")
        entities = state.get("entities", {})
        messages = state.get("messages", [])
        last_message = (messages[-1].get("content", "") if messages else "").strip()
        slot_options = state.get("slot_options") or []

        if slot_options and last_message.isdigit():
            idx = int(last_message)
            if 1 <= idx <= len(slot_options):
                opt = slot_options[idx - 1]
                slot_match = {
                    "slot_id": opt.get("slot_id", ""),
                    "slot_time": opt.get("slot_time", ""),
                    "end_time": opt.get("end_time", ""),
                }
                state["selected_slot"] = slot_match
                state["booking_in_progress"] = True
                logger.info(f"Resolved numeric '{last_message}' to slot {slot_match.get('slot_id')}")
                return state
            else:
                logger.warning(f"Numeric '{last_message}' out of range (1-{len(slot_options)})")

        slot_match = extract_slot_from_message(last_message)

        if slot_match and slot_match.get("slot_id"):
            state["selected_slot"] = slot_match
            state["booking_in_progress"] = True
            logger.info(f"Extracted slot by ID: {slot_match}")
        
        vendor_id = entities.get("vendor_id")
        vendor_name = entities.get("vendor_name") or entities.get("vendor")
        
        if vendor_name and not vendor_id:
            state["vendor_name"] = vendor_name
        
        state["vendor_id"] = vendor_id or state.get("vendor_id")
        
        return state
        
    except Exception as e:
        logger.error(f"Slot extraction failed: {e}")
        state["error"] = {"type": "slot_extraction_error", "message": str(e)}
        return state


# =============================================================================
# NODE 4: VALIDATE STATE
# =============================================================================

async def validate_state_node(state: AgentState) -> AgentState:
    """Validate state has required data for current intent"""
    try:
        logger.info("🔵 Node: validate_state")
        
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        
        has_date = bool(entities.get("date") or state.get("selected_date"))
        has_time = bool(entities.get("time") or entities.get("time_range"))

        if intent == "inquiry" and not has_date and has_time:
            entities["date"] = datetime.now().strftime("%Y-%m-%d")
            state["entities"] = entities
            state["selected_date"] = entities["date"]
            has_date = True
            logger.info(f"Inferred today's date for inquiry with time but no date")

        missing = []
        if intent == "inquiry":
            if not has_date:
                missing.append("date")
            if has_date and not has_time:
                missing.append("time")

        state["missing_fields"] = missing if missing else None
        state["requires_clarification"] = bool(missing)
        
        if missing:
            logger.info(f"Missing fields for {intent}: {missing}")
        else:
            logger.info(f"Validation passed for {intent}")
        
        return state
        
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        state["error"] = {"type": "validation_error", "message": str(e)}
        return state


# =============================================================================
# NODE 5: QUERY AVAILABILITY
# =============================================================================

def date_from_slot_id(slot_id: str) -> Optional[str]:
    """Parse YYYY-MM-DD from slot ID like 20260208_0900_ace_3."""
    if not slot_id or "_" not in slot_id:
        return None
    parts = slot_id.strip().split("_")
    if len(parts) < 2:
        return None
    date_part = parts[0]
    if len(date_part) != 8 or not date_part.isdigit():
        return None
    try:
        y, m, d = int(date_part[:4]), int(date_part[4:6]), int(date_part[6:8])
        if 1 <= m <= 12 and 1 <= d <= 31:
            return f"{y:04d}-{m:02d}-{d:02d}"
    except (ValueError, IndexError):
        pass
    return None


def infer_sport_from_slot_id(slot_id: str) -> Optional[str]:
    slot_lower = (slot_id or "").lower()
    if "cricket" in slot_lower:
        return "cricket"
    if "padel" in slot_lower:
        return "padel"
    if "futsal" in slot_lower:
        return "futsal"
    return None


def find_slot_by_id(slot_id: str, vendors: List[Dict]) -> Optional[Dict]:
    """Find exact slot by slot_id in query results."""
    if not slot_id:
        return None
    slot_id_lower = slot_id.lower().strip()
    for vendor in vendors:
        for slot in vendor.get("slots", []):
            sid = (slot.get("slot_id") or slot.get("id") or "").lower()
            if sid == slot_id_lower:
                return {**slot, "vendor_id": vendor.get("vendor_id")}
    return None


def match_slot_from_results(user_slot_time: str, vendors: List[Dict]) -> Optional[Dict]:
    """
    Find a matching slot from query results based on user's selected time.
    Returns the full slot dict with slot_id and price.
    """
    user_time = user_slot_time.strip()
    user_hour = user_time.split(":")[0] if ":" in user_time else user_time

    for vendor in vendors:
        for slot in vendor.get("slots", []):
            db_time = slot.get("slot_time", "")
            db_hour = db_time.split(":")[0] if ":" in db_time else db_time

            if db_time == user_time:
                return {**slot, "vendor_id": vendor.get("vendor_id")}

            if db_hour == user_hour:
                return {**slot, "vendor_id": vendor.get("vendor_id")}

    return None


async def query_availability_node(state: AgentState) -> AgentState:
    """Query slot availability from database and match user selection"""
    try:
        logger.info("🔵 Node: query_availability")
        
        entities = state.get("entities", {})
        messages = state.get("messages", [])
        last_message = messages[-1].get("content", "").lower() if messages else ""
        intent = state.get("current_intent", "")
        
        service_type = (
            entities.get("service_type")
            or entities.get("sport_type")
            or state.get("selected_sport_type")
        )
        area = entities.get("area") or state.get("selected_area")
        date = entities.get("date") or state.get("selected_date") or datetime.now().strftime("%Y-%m-%d")
        user_selected_for_date = state.get("selected_slot")
        if user_selected_for_date and (user_selected_for_date.get("slot_id") or user_selected_for_date.get("id")):
            parsed = date_from_slot_id(user_selected_for_date.get("slot_id") or user_selected_for_date.get("id") or "")
            if parsed:
                date = parsed
                state["selected_date"] = parsed
                logger.info(f"Using date from slot ID: {date}")
            if not service_type:
                service_type = infer_sport_from_slot_id(user_selected_for_date.get("slot_id") or user_selected_for_date.get("id") or "")
        service_type = service_type or "padel"
        time_range = entities.get("time_range")

        user_selected = state.get("selected_slot")
        explicit_slot_id = (user_selected or {}).get("slot_id") or (user_selected or {}).get("id")

        if explicit_slot_id:
            from database.firestore_v2 import FirestoreV2
            from database.schema import SlotStatus
            import pytz
            fs = FirestoreV2(firestore_db.db)
            direct_slot = await fs.get_slot(explicit_slot_id)
            if direct_slot and direct_slot.get("status") == SlotStatus.AVAILABLE.value:
                raw_start = direct_slot.get("start_time")
                if hasattr(raw_start, "astimezone"):
                    slot_start = raw_start.astimezone(pytz.timezone("Asia/Karachi")).strftime("%H:%M")
                elif raw_start:
                    slot_start = str(raw_start)[:5]
                else:
                    slot_start = (user_selected or {}).get("slot_time", "09:00")
                h = int(slot_start.split(":")[0]) if ":" in str(slot_start) else 9
                slot_end = f"{(h + 1) % 24:02d}:00"
                vendor_id = direct_slot.get("vendor_id", "")
                price = int(direct_slot.get("price", 0))
                slot_date = direct_slot.get("date", date)
                inferred_sport = infer_sport_from_slot_id(explicit_slot_id) or service_type

                full_slot = {
                    "slot_id": explicit_slot_id,
                    "slot_time": slot_start,
                    "end_time": slot_end,
                    "price": price,
                    "resource_id": direct_slot.get("resource_id", ""),
                    "vendor_id": vendor_id
                }
                vendor_name = ""
                try:
                    from database.firestore_v2 import FirestoreV2
                    v = await FirestoreV2(firestore_db.db).get_vendor(vendor_id)
                    vendor_name = v.get("name", "") if v else ""
                except Exception:
                    pass
                state["selected_slot"] = full_slot
                state["vendor_id"] = vendor_id
                state["awaiting_confirmation"] = True
                state["awaiting_slot_selection"] = False
                state["confirmation_type"] = "booking"
                state["pending_booking"] = {
                    "slot": full_slot,
                    "slot_id": explicit_slot_id,
                    "price": price,
                    "date": slot_date,
                    "vendor_id": vendor_id,
                    "vendor_name": vendor_name,
                    "service_type": inferred_sport,
                    "area": area or "Karachi"
                }
                state["query_result"] = {"success": True, "date": slot_date, "sport_type": inferred_sport, "area": area or "Karachi", "vendors": []}
                logger.info(f"Slot found directly by ID: {explicit_slot_id}, price={price}")
                return state

        ent_vendor_name = entities.get("vendor_name") or entities.get("vendor") or state.get("vendor_name")
        ent_vendor_id = entities.get("vendor_id") or state.get("vendor_id")

        logger.info(f"Checking availability: {service_type} in {area} on {date}, vendor_name={ent_vendor_name}, vendor_id={ent_vendor_id}")
        query_result = await check_availability(service_type, area, date, time_range, vendor_name=ent_vendor_name, vendor_id=ent_vendor_id)
        
        has_slots = query_result and query_result.get("success") and query_result.get("vendors") and len(query_result.get("vendors", [])) > 0
        
        user_gave_date = bool(entities.get("date"))
        should_search_alternatives = (
            not has_slots and (
                user_gave_date or
                "koi bhi date" in last_message or 
                "any date" in last_message or
                "konsey din" in last_message or
                "alternative" in last_message or
                "dosri date" in last_message
            )
        )
        
        if should_search_alternatives:
            logger.info("No vendors found, searching alternative dates...")
            base_date = datetime.strptime(date, "%Y-%m-%d")
            next_available_date = None
            
            for days_ahead in range(1, 8):
                check_date = (base_date + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
                logger.info(f"Checking alternative date: {check_date}")
                alt_result = await check_availability(service_type, area, check_date, time_range, vendor_name=ent_vendor_name, vendor_id=ent_vendor_id)
                
                if alt_result and alt_result.get("success") and alt_result.get("vendors") and len(alt_result.get("vendors", [])) > 0:
                    query_result = alt_result
                    query_result["requested_date"] = date
                    query_result["next_available_date"] = check_date
                    next_available_date = check_date
                    logger.info(f"✅ Found vendors on {check_date}")
                    break
            
            if not next_available_date:
                logger.info("No vendors found in next 7 days")
        
        state["query_result"] = query_result if query_result else {"success": False, "error": "Query returned None"}
        
        has_slots = query_result and query_result.get("success") and query_result.get("vendors") and len(query_result.get("vendors", [])) > 0
        user_selected = state.get("selected_slot")
        explicit_slot_id = (user_selected or {}).get("slot_id") or (user_selected or {}).get("id")

        if has_slots and explicit_slot_id:
            matched_slot = find_slot_by_id(explicit_slot_id, query_result["vendors"])
            if matched_slot:
                logger.info(f"Matched slot by ID: {explicit_slot_id}")
            else:
                user_slot_time = user_selected.get("slot_time", "")
                logger.info(f"No ID match, trying time: '{user_slot_time}'")
                matched_slot = match_slot_from_results(user_slot_time, query_result["vendors"])
            
            if matched_slot:
                slot_id = matched_slot.get("slot_id", "")
                price = matched_slot.get("price", 0)
                logger.info(f"Matched Slot: ID={slot_id}, Price={price}")
                vendor_id = matched_slot.get("vendor_id") or state.get("vendor_id")
                vendor_name = ""
                for v in query_result.get("vendors", []):
                    if v.get("vendor_id") == vendor_id:
                        vendor_name = v.get("vendor_name", "")
                        break
                full_selected_slot = {
                    "slot_id": slot_id,
                    "slot_time": matched_slot.get("slot_time", ""),
                    "end_time": matched_slot.get("end_time", ""),
                    "price": price,
                    "resource_id": matched_slot.get("resource_id", ""),
                    "vendor_id": vendor_id
                }
                state["selected_slot"] = full_selected_slot
                state["vendor_id"] = vendor_id
                state["awaiting_confirmation"] = True
                state["awaiting_slot_selection"] = False
                state["confirmation_type"] = "booking"
                state["pending_booking"] = {
                    "slot": full_selected_slot,
                    "slot_id": slot_id,
                    "price": price,
                    "date": query_result.get("next_available_date") or date,
                    "vendor_id": vendor_id,
                    "vendor_name": vendor_name,
                    "service_type": service_type,
                    "area": area
                }
                logger.info(f"Slot matched! slot_id={slot_id}, price={price}, vendor={vendor_id}")
            else:
                logger.warning(f"No matching slot found for: {explicit_slot_id}")
                state["selected_slot"] = None
        
        if has_slots and not state.get("awaiting_confirmation"):
            logger.info(f"Slots available, waiting for user selection. Vendors: {len(query_result.get('vendors', []))}")
            if query_result.get("next_available_date"):
                state["selected_date"] = query_result["next_available_date"]
            else:
                state["selected_date"] = date
        else:
            state["selected_date"] = date
        
        return state
        
    except Exception as e:
        logger.error(f"Availability query failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        state["query_result"] = {"success": False, "error": str(e)}
        return state


# =============================================================================
# NODE 6: QUERY INFO
# =============================================================================

async def query_info_node(state: AgentState) -> AgentState:
    """Query pricing or vendor info"""
    try:
        logger.info("🔵 Node: query_info")
        
        intent = state.get("current_intent", "")
        
        if intent == "info_request":
            state["query_result"] = get_pricing()
            logger.info("Retrieved pricing info")
        else:
            state["query_result"] = get_vendor_info()
            logger.info("Retrieved vendor info")
        
        return state
        
    except Exception as e:
        logger.error(f"Info query failed: {e}")
        state["query_result"] = {"success": False, "error": str(e)}
        return state


# =============================================================================
# NODE 7: CHECK CONFIRMATION
# =============================================================================

async def check_confirmation_node(state: AgentState) -> AgentState:
    """Check user's confirmation response using boundary-safe token matching"""
    try:
        logger.info("🔵 Node: check_confirmation")
        
        intent = state.get("current_intent", "")
        messages = state.get("messages", [])
        last_message = messages[-1].get("content", "").strip() if messages else ""

        tx = _detect_tx_input(last_message)

        if tx == "cancel" or _CANCEL_WORDS.search(last_message):
            state["user_confirmed"] = False
            state["confirmation_action"] = "cancel"
            state["awaiting_confirmation"] = False
            state["pending_booking"] = None
            state["selected_slot"] = None
            state["slot_options"] = []
            state["awaiting_slot_selection"] = False
            logger.info("User cancelled booking")
        elif tx == "modify" or _MODIFY_WORDS.search(last_message):
            state["user_confirmed"] = False
            state["confirmation_action"] = "modify"
            state["awaiting_confirmation"] = False
            state["pending_booking"] = None
            state["slot_options"] = []
            state["awaiting_slot_selection"] = False
            logger.info("User wants to modify")
        elif tx in ("confirm", "slot_select") or _CONFIRM_WORDS.search(last_message) or intent == "transaction":
            state["user_confirmed"] = True
            state["confirmation_action"] = "proceed"
            logger.info("User confirmed booking")
        else:
            state["user_confirmed"] = None
            state["confirmation_action"] = "clarify"
            logger.info("Needs clarification")
        
        return state
        
    except Exception as e:
        logger.error(f"Confirmation check failed: {e}")
        state["confirmation_action"] = "clarify"
        return state


# =============================================================================
# NODE 8: EXECUTE BOOKING (with proper slot locking)
# =============================================================================

async def execute_booking_node(state: AgentState) -> AgentState:
    """
    Execute booking with proper slot locking flow:
    1. If no slot locked yet -> Lock the slot (10 min hold)
    2. If slot already locked -> Check if payment received -> Confirm booking
    
    This prevents double-booking by using Firestore transactions.
    """
    try:
        logger.info("🔵 Node: execute_booking")
        
        pending = state.get("pending_booking", {})
        
        if not pending:
            logger.error("No pending booking found")
            state["booking_result"] = {"success": False, "error": "No booking details found"}
            return state
        
        slot = pending.get("slot", {})
        user_phone = state.get("user_phone", "")
        
        booking_details = {
            "vendor_id": pending.get("vendor_id") or state.get("vendor_id"),
            "date": pending.get("date") or state.get("selected_date"),
            "time": slot.get("slot_time"),
            "end_time": slot.get("end_time"),
            "duration_hours": state.get("selected_duration") or 1.0,
            "service_type": pending.get("service_type") or "padel",
            "customer_info": {
                "phone": user_phone,
                "name": state.get("entities", {}).get("customer_name") or f"Customer {user_phone}",
                "booking_source": "whatsapp_ai"
            }
        }
        
        logger.info(f"Processing booking: vendor={booking_details['vendor_id']}, date={booking_details['date']}, time={booking_details['time']}")
        
        from app.firestore import firestore_db
        from database.slot_service import SlotService
        
        slot_service = SlotService(firestore_db.db)
        
        slot_id = pending.get("slot_id") or slot.get("id") or slot.get("slot_id")
        locked_slot_id = state.get("locked_slot_id")
        
        if locked_slot_id:
            logger.info(f"Slot already locked: {locked_slot_id}, confirming booking...")
            confirm_result = slot_service.confirm_booking(locked_slot_id, booking_details["vendor_id"])
            
            if confirm_result.get("success"):
                state["booking_result"] = {
                    "success": True,
                    "booking_id": locked_slot_id,
                    "slot_id": locked_slot_id,
                    "message": "Booking confirmed successfully!"
                }
                state["locked_slot_id"] = None
                logger.info(f"✅ Booking confirmed: {locked_slot_id}")
            else:
                state["booking_result"] = confirm_result
                logger.error(f"❌ Confirmation failed: {confirm_result.get('error')}")
        
        elif slot_id:
            logger.info(f"Locking slot: {slot_id}")
            lock_result = slot_service.lock_slot(slot_id, user_phone, booking_source="whatsapp_ai")
            
            if lock_result.get("success"):
                slot_price = slot.get("price") or pending.get("price") or lock_result.get("price") or 0
                
                state["locked_slot_id"] = slot_id
                state["awaiting_payment"] = True
                state["payment_amount"] = slot_price
                state["booking_result"] = {
                    "success": True,
                    "booking_id": slot_id,
                    "slot_id": slot_id,
                    "status": "locked",
                    "amount": slot_price,
                    "hold_expires_in_minutes": lock_result.get("expires_in_minutes", 10),
                    "message": f"Slot locked! Please transfer Rs {slot_price} and send payment screenshot within 10 minutes."
                }
                logger.info(f"✅ Slot locked: {slot_id}, amount: {slot_price}")
            else:
                state["booking_result"] = lock_result
                logger.error(f"❌ Lock failed: {lock_result.get('error')}")
        
        else:
            logger.info("No slot_id found, using direct booking method...")
            from database.availability_service import AvailabilityService
            availability_service = AvailabilityService()
            
            result = await availability_service.check_and_book_slot(
                vendor_id=booking_details["vendor_id"],
                date=booking_details["date"],
                time=booking_details["time"],
                customer_info=booking_details["customer_info"]
            )
            
            state["booking_result"] = result
            
            if result and result.get("success"):
                logger.info(f"✅ Booking created: {result.get('booking_id')}")
            else:
                logger.error(f"❌ Booking failed: {result.get('error') if result else 'No result'}")
        
        state["awaiting_confirmation"] = False
        state["pending_booking"] = None
        state["booking_in_progress"] = False
        
        return state
        
    except Exception as e:
        logger.error(f"Booking execution failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        state["booking_result"] = {"success": False, "error": str(e)}
        return state


# =============================================================================
# NODE 9: GENERATE RESPONSE
# =============================================================================

async def generate_response_node(state: AgentState) -> AgentState:
    """Generate natural language response"""
    try:
        logger.info("🔵 Node: generate_response")
        
        if state.get("guardrail_block"):
            logger.info(f"Guardrail block active: {state['guardrail_block']}")
            return state
        
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        query_result = state.get("query_result") or {}
        booking_result = state.get("booking_result")
        awaiting = state.get("awaiting_confirmation", False)
        confirmation_action = state.get("confirmation_action")
        messages = state.get("messages", [])
        last_msg = messages[-1].get("content", "") if messages else ""
        last_lower = last_msg.lower()
        
        if confirmation_action == "cancel":
            is_urdu = any(w in last_lower for w in ["aoa", "salam", "koi", "hei", "hai", "kal", "aaj", "shaam", "nahi"])
            if is_urdu:
                state["response"] = "Theek hai, cancel kar diya. Kuch aur chahiye?"
            else:
                state["response"] = "Cancelled. Anything else you need?"
            return state

        if confirmation_action == "modify":
            is_urdu = any(w in last_lower for w in ["aoa", "salam", "koi", "hei", "hai", "kal", "aaj", "shaam"])
            if is_urdu:
                state["response"] = "Kya change karna hai? Date, time, ya koi aur venue?"
            else:
                state["response"] = "What would you like to change? Date, time, or venue?"
            return state

        if intent == "greeting":
            if any(word in last_lower for word in ["aoa", "salam", "assalam", "asalam"]):
                state["response"] = (
                    "AoA! Main aap ki booking mein help kar sakta hoon. "
                    "Padel, futsal ya cricket—kis cheez ki booking chahiye?"
                )
            else:
                state["response"] = (
                    "Hi! I can help you book padel, futsal, or cricket in Karachi. "
                    "What would you like to book?"
                )
            return state

        if booking_result and booking_result.get("success") and booking_result.get("status") == "locked" and booking_result.get("message"):
            state["response"] = booking_result["message"]
            return state

        if state.get("awaiting_confirmation") and state.get("pending_booking"):
            pending = state["pending_booking"]
            slot = pending.get("slot", {})
            time_disp = f"{slot.get('slot_time', '')}-{slot.get('end_time', '')}"
            price = pending.get("price", 0)
            vendor = pending.get("vendor_name") or pending.get("service_type", "venue")
            is_urdu = any(w in last_msg.lower() for w in ["aoa", "salam", "koi", "hei", "hai", "kal", "aaj", "shaam"])
            if is_urdu:
                state["response"] = f"Slot {time_disp}, Rs {price} at {vendor}. Reserve ke liye 'yes' likhein (10 min hold) ya 'no' cancel."
            else:
                state["response"] = f"Slot {time_disp}, Rs {price} at {vendor}. Reply 'yes' to reserve (10 min hold) or 'no' to cancel."
            state["awaiting_slot_selection"] = False
            return state

        slot_options = state.get("slot_options") or []
        if last_msg.strip().isdigit() and not slot_options:
            state["response"] = "Slot list nahi mila. Please phir se puchhein: date, time, aur sport (e.g. 'padel kal shaam')."
            return state
        if last_msg.strip().isdigit() and slot_options:
            num = int(last_msg.strip())
            if num < 1 or num > len(slot_options):
                state["response"] = f"'{num}' valid nahi hai. 1 se {len(slot_options)} ke beech number likhein."
                return state

        missing = state.get("missing_fields") or []
        if "time" in missing and intent == "inquiry":
            is_urdu = any(w in last_msg.lower() for w in ["aoa", "salam", "koi", "hei", "hai", "kal", "aaj", "shaam"])
            if is_urdu:
                state["response"] = "Kaunsa time chahiye? Morning, evening, ya night?"
            else:
                state["response"] = "What time are you looking for? Morning, afternoon, or evening?"
            return state

        if not booking_result and query_result and query_result.get("success") and query_result.get("vendors"):
            slots_text, slot_opts = _format_availability_response(query_result)
            if slots_text:
                state["response"] = slots_text
                state["slot_options"] = slot_opts
                state["awaiting_slot_selection"] = True
                state["selected_sport_type"] = query_result.get("sport_type", "padel")
                raw_area = query_result.get("area")
                state["selected_area"] = raw_area if raw_area and raw_area.lower() not in ("all", "karachi", "") else None
                return state

        if intent != "info_request" and not booking_result and query_result and query_result.get("success") and not query_result.get("vendors"):
            sport = query_result.get("sport_type", "padel")
            date = query_result.get("date", "")
            area = query_result.get("area")
            area_msg = query_result.get("message", "")
            if area and "No vendors found" in (area_msg or ""):
                state["response"] = (
                    f"Sorry, {sport} ke liye {area} me koi vendor nahi mila. "
                    "Different area try karein (e.g. DHA, Clifton) ya sport change karein."
                )
            else:
                missing = state.get("missing_fields") or []
                if "date" in missing or not entities.get("date"):
                    state["response"] = (
                        f"Aaj ({date}) {area or 'Karachi'} me **{sport}** ke koi available slot nahi hai. "
                        "Kaunsi date ke liye dekhoon? (e.g. 'tomorrow', '8 feb', 'kal')"
                    )
                else:
                    next_date = query_result.get("next_available_date")
                    if next_date:
                        state["response"] = (
                            f"{date} ko {area or 'Karachi'} me **{sport}** ke slot nahi milay, "
                            f"lekin {next_date} ko available hain. Dekhoon?"
                        )
                    else:
                        state["response"] = (
                            f"{date} ko {area or 'Karachi'} me **{sport}** ke koi slot available nahi. "
                            "Koi aur date try karein ya area change karein."
                        )
            return state

        context = {
            "query_result": query_result,
            "booking_result": booking_result,
            "awaiting_confirmation": awaiting,
            "confirmation_action": confirmation_action,
            "pending_booking": state.get("pending_booking"),
            "conversation_history": messages[:-1] if messages else [],
            "current_message": last_msg,
            "phone_number": state.get("user_phone", ""),
            "selected_slot": state.get("selected_slot"),
            "selected_date": state.get("selected_date"),
            "vendor_id": state.get("vendor_id"),
            "missing_fields": state.get("missing_fields")
        }
        
        logger.info(f"Generating response for intent: {intent}")
        response = await nlu_agent.generate_response(intent, entities, context)
        
        if not response or not response.strip():
            response = generate_fallback_response(state)
        
        state["response"] = response
        logger.info(f"Response generated ({len(response)} chars)")
        
        return state
        
    except Exception as e:
        logger.error(f"Response generation failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
        messages = state.get("messages", [])
        last_msg = messages[-1].get("content", "") if messages else ""
        is_urdu = any(w in last_msg.lower() for w in ["aoa", "salam", "koi", "hei", "hai", "kal", "aaj", "shaam"])
        
        if is_urdu:
            state["response"] = "Sorry, error aaya. Dobara try karein?"
        else:
            state["response"] = "Sorry, I encountered an error. Please try again."
        
        return state


def _format_availability_response(
    query_result: Dict[str, Any],
) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    vendors = query_result.get("vendors") or []
    if not vendors:
        return None, []
    date = query_result.get("date", "")
    sport = query_result.get("sport_type", "padel")
    area = query_result.get("area") or "Karachi"
    slot_options = []
    idx = 1
    max_total = 12
    parts = [f"{date} — {area} — **{sport}** slots:\n"]
    for v in vendors[:3]:
        name = v.get("vendor_name", "Vendor")
        address = v.get("vendor_address", "")
        parts.append(f"\n**{name}** ({address})")
        seen_times = set()
        for slot in v.get("slots", []):
            if idx > max_total:
                break
            sid = slot.get("slot_id", "")
            stime = slot.get("slot_time", "")
            if not sid or stime in seen_times:
                continue
            seen_times.add(stime)
            time_disp = slot.get("time_display") or f"{stime}-{slot.get('end_time', '')}"
            price = slot.get("price", 0)
            slot_options.append({
                "index": idx,
                "slot_id": sid,
                "slot_time": stime,
                "end_time": slot.get("end_time", ""),
                "price": price,
                "vendor_name": name,
            })
            parts.append(f"   {idx}. {time_disp} — Rs {price}")
            idx += 1
        parts.append("")
        if idx > max_total:
            break
    parts.append("Reply with the number to select, phir 'yes' se reserve karein.")
    return "\n".join(parts).strip(), slot_options


def generate_fallback_response(state: AgentState) -> str:
    """Generate fallback response based on state"""
    booking_result = state.get("booking_result")
    
    if booking_result and booking_result.get("success"):
        return f"Your booking is confirmed! Booking ID: {booking_result.get('booking_id')}"
    elif booking_result and not booking_result.get("success"):
        return f"Sorry, booking failed: {booking_result.get('error', 'Unknown error')}. Please try again."
    elif state.get("awaiting_confirmation"):
        return "Would you like to confirm this booking? Reply 'yes' to confirm or 'no' to cancel."
    else:
        return "I understand. How can I help you with your booking?"


# =============================================================================
# ROUTING FUNCTIONS
# =============================================================================

_CONFIRM_WORDS = re.compile(
    r'\b(yes|ok|okay|confirm|book|done|sure|proceed|han|haan|ji|theek|bilkul)\b', re.IGNORECASE
)
_CANCEL_WORDS = re.compile(
    r'\b(no|nahi|nope|cancel|stop|ruko|mat)\b', re.IGNORECASE
)
_MODIFY_WORDS = re.compile(
    r'\b(change|modify|actually|instead|different|wait)\b', re.IGNORECASE
)
_SLOT_NUMBER = re.compile(r'^\s*(\d{1,2})\s*$')
_SLOT_NUMBER_PLUS = re.compile(r'^\s*(\d{1,2})\s*[,.]?\s*(yes|ok|confirm|book|han|haan|ji|done|sure)?\s*$', re.IGNORECASE)


def _detect_tx_input(msg: str) -> Optional[str]:
    """Detect transactional input type from raw message text.
    Returns: 'slot_select', 'confirm', 'cancel', 'modify', or None."""
    msg = msg.strip()
    if _SLOT_NUMBER.match(msg):
        return "slot_select"
    if _SLOT_NUMBER_PLUS.match(msg):
        return "slot_select"
    if _CANCEL_WORDS.search(msg):
        return "cancel"
    if _MODIFY_WORDS.search(msg):
        return "modify"
    if _CONFIRM_WORDS.search(msg) and len(msg.split()) <= 4:
        return "confirm"
    return None


def route_by_intent(state: AgentState) -> str:
    intent = state.get("current_intent", "")
    awaiting = state.get("awaiting_confirmation", False)
    awaiting_slot_sel = state.get("awaiting_slot_selection", False)
    entities = state.get("entities", {})
    selected_slot = state.get("selected_slot") or {}
    has_slot_id = bool(selected_slot.get("slot_id"))
    has_time = bool(entities.get("time") or entities.get("time_range"))
    has_vendor = bool(entities.get("vendor_id") or entities.get("vendor_name") or state.get("vendor_id"))
    has_date = bool(entities.get("date") or state.get("selected_date"))
    messages = state.get("messages", [])
    last_msg = (messages[-1].get("content", "") if messages else "").strip()

    tx_type = _detect_tx_input(last_msg)

    if awaiting_slot_sel and tx_type == "slot_select":
        num_match = _SLOT_NUMBER_PLUS.match(last_msg.strip())
        if num_match:
            state["messages"][-1]["content"] = num_match.group(1)
        return "query_availability"

    if awaiting_slot_sel and tx_type in ("confirm", "cancel", "modify"):
        logger.info(f"Transactional input '{tx_type}' during slot selection - routing to confirmation")
        state["awaiting_slot_selection"] = False
        return "check_confirmation"

    if awaiting_slot_sel and tx_type is None:
        has_new_booking_entities = any([
            entities.get("service_type"),
            entities.get("date"),
            entities.get("time"),
            entities.get("vendor_name"),
        ])
        if has_new_booking_entities:
            state["awaiting_slot_selection"] = False
            state["slot_options"] = []
            state["selected_slot"] = None
            logger.info("New booking entities during slot selection - starting fresh query")
        else:
            state["awaiting_slot_selection"] = False
            state["slot_options"] = []
            state["selected_slot"] = None
            logger.info("Unrecognized input during slot selection - clearing slot state")

    if awaiting and tx_type in ("confirm", "cancel", "modify", "slot_select"):
        return "check_confirmation"

    if awaiting and intent in ["transaction", "unknown"]:
        return "check_confirmation"

    if awaiting and intent == "inquiry":
        has_new_booking_entities = any([
            entities.get("service_type"),
            entities.get("date"),
            entities.get("time"),
            entities.get("vendor_name"),
        ])
        if has_new_booking_entities:
            state["awaiting_confirmation"] = False
            state["pending_booking"] = None
            state["selected_slot"] = None
            logger.info("New inquiry with booking entities while awaiting confirmation - starting fresh")
        else:
            return "check_confirmation"

    if has_slot_id:
        return "query_availability"

    if intent == "inquiry" and has_date and not has_time:
        return "generate_response"

    if intent == "inquiry":
        return "query_availability"
    if intent == "transaction" and (has_time or has_vendor):
        return "query_availability"
    if intent == "transaction":
        return "check_confirmation"
    if intent == "info_request":
        return "query_info"
    if intent == "greeting":
        return "generate_response"
    return "generate_response"


def route_after_availability(state: AgentState) -> str:
    return "generate_response"


def route_after_confirmation(state: AgentState) -> str:
    """Route based on confirmation result"""
    action = state.get("confirmation_action", "")
    
    if action == "proceed":
        return "execute_booking"
    else:
        return "generate_response"
