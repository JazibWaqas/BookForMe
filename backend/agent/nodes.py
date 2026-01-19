"""
LangGraph Agent Nodes - Industry Standard Workflow
Refactored with single-responsibility nodes and conditional routing
"""

import logging
import re
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from agent.state import AgentState
from agent.tools import check_availability, get_pricing, get_vendor_info
from agent.duration import parse_duration
from nlu.agent import NLUAgent

logger = logging.getLogger(__name__)

nlu_agent = NLUAgent()


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def normalize_date(date_text: str) -> str:
    """
    Normalize date text to YYYY-MM-DD format
    Handles: "tomorrow", "today", "kal", "Friday", "2025-12-17", etc.
    """
    today = datetime.now()
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
    
    date_formats = ['%B %d, %Y', '%d %B %Y', '%B %d %Y', '%m/%d/%Y', '%d/%m/%Y']
    for fmt in date_formats:
        try:
            parsed = datetime.strptime(date_text, fmt)
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
    Normalize time text to time range dict
    Handles: "evening", "shaam", "6-9", "after 6", "7pm", "5 bajay", etc.
    """
    time_lower = time_text.lower().strip()
    
    if "evening" in time_lower or "shaam" in time_lower:
        return {"start": "18:00", "end": "23:00"}
    elif "morning" in time_lower or "subah" in time_lower:
        return {"start": "09:00", "end": "12:00"}
    elif "afternoon" in time_lower:
        return {"start": "12:00", "end": "18:00"}
    elif "night" in time_lower or "raat" in time_lower:
        return {"start": "21:00", "end": "23:00"}
    
    if "after" in time_lower:
        match = re.search(r"after\s+(\d+)", time_lower)
        if match:
            hour = int(match.group(1))
            return {"start": f"{hour:02d}:00"}
    
    if "-" in time_lower:
        match = re.search(r"(\d+)[:\s]?(\d+)?\s*-\s*(\d+)[:\s]?(\d+)?", time_lower)
        if match:
            start_hour = int(match.group(1))
            end_hour = int(match.group(3))
            return {"start": f"{start_hour:02d}:00", "end": f"{end_hour:02d}:00"}
    
    pm_match = re.search(r"(\d+)\s*pm", time_lower)
    am_match = re.search(r"(\d+)\s*am", time_lower)
    if pm_match:
        hour = int(pm_match.group(1))
        if hour < 12:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1):02d}:00"}
    elif am_match:
        hour = int(am_match.group(1))
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1):02d}:00"}
    
    bajay_match = re.search(r"(\d+)\s*baj(?:ay|e|ey)(?:\s+kei?\s+around)?", time_lower)
    if bajay_match:
        hour = int(bajay_match.group(1))
        if hour <= 11 and "subah" not in time_lower and "morning" not in time_lower:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1):02d}:00"}
    
    around_match = re.search(r"around\s+(\d+)", time_lower)
    if around_match:
        hour = int(around_match.group(1))
        if hour <= 11:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1):02d}:00"}
    
    return None


def is_greeting(message: str) -> bool:
    """Check if message is a greeting"""
    greetings = ["hi", "hello", "hey", "aoa", "salam", "salaam", "assalam", "assalamu", "assalamu alaikum"]
    msg_lower = message.lower().strip()
    return msg_lower in greetings or any(msg_lower.startswith(g + " ") for g in greetings)


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
    """Extract slot directly from message text"""
    msg_lower = message.lower()
    
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
        
        state["current_intent"] = nlu_result.get("intent", "unknown")
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
    """Extract slot selection from entities or message"""
    try:
        logger.info("🔵 Node: extract_slot")
        
        entities = state.get("entities", {})
        messages = state.get("messages", [])
        last_message = messages[-1].get("content", "") if messages else ""
        
        slot_match = None
        
        time_data = entities.get("time_range") or entities.get("time")
        if time_data:
            slot_match = extract_slot_from_time_data(time_data)
        
        if not slot_match:
            slot_match = extract_slot_from_message(last_message)
        
        if slot_match:
            state["selected_slot"] = slot_match
            state["booking_in_progress"] = True
            logger.info(f"Extracted slot: {slot_match}")
        
        vendor_id = entities.get("vendor_id")
        vendor_name = entities.get("vendor_name") or entities.get("vendor")
        
        if vendor_name and not vendor_id:
            state["vendor_name"] = vendor_name
        
        state["vendor_id"] = vendor_id or state.get("vendor_id") or "ace_padel_club"
        
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
        
        required_fields = {
            "booking_request": ["date"],
            "availability_inquiry": ["date"],
            "confirmation": [],
            "price_inquiry": [],
            "greeting": [],
            "information": []
        }
        
        required = required_fields.get(intent, [])
        missing = [f for f in required if not entities.get(f)]
        
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

async def query_availability_node(state: AgentState) -> AgentState:
    """Query slot availability from database"""
    try:
        logger.info("🔵 Node: query_availability")
        
        entities = state.get("entities", {})
        
        # Standardize field name: NLU extracts service_type, DB uses sport_type
        service_type = entities.get("service_type") or entities.get("sport_type") or "padel"
        area = entities.get("area") or "DHA"
        date = entities.get("date") or datetime.now().strftime("%Y-%m-%d")
        time_range = entities.get("time_range")
        
        logger.info(f"Checking availability: {service_type} in {area} on {date}")
        
        query_result = await check_availability(service_type, area, date, time_range)
        state["query_result"] = query_result if query_result else {"success": False, "error": "Query returned None"}
        
        # Check if we have slots and user selected one - prepare for confirmation
        has_slots = query_result and query_result.get("success") and query_result.get("vendors")
        has_selection = state.get("selected_slot")
        
        if has_slots and has_selection:
            state["awaiting_confirmation"] = True
            state["confirmation_type"] = "booking"
            state["pending_booking"] = {
                "slot": state["selected_slot"],
                "date": date,
                "vendor_id": state.get("vendor_id"),
                "service_type": service_type,
                "area": area
            }
            logger.info(f"Booking ready for confirmation: awaiting_confirmation=True, slot={state['selected_slot']}")
        elif has_slots:
            logger.info(f"Slots available but no selection yet. Total vendors: {len(query_result.get('vendors', []))}")
        
        return state
        
    except Exception as e:
        logger.error(f"Availability query failed: {e}")
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
        
        if intent == "price_inquiry":
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
    """Check user's confirmation response"""
    try:
        logger.info("🔵 Node: check_confirmation")
        
        intent = state.get("current_intent", "")
        messages = state.get("messages", [])
        last_message = messages[-1].get("content", "").lower() if messages else ""
        
        positive = ["yes", "ok", "confirm", "book it", "book", "han", "haan", "ji", "theek hai", "done", "okay", "sure", "proceed"]
        negative = ["no", "nahi", "cancel", "nope", "mat karo", "ruko", "stop", "nope"]
        modify = ["change", "modify", "actually", "instead", "different", "wait"]
        
        if any(word in last_message for word in positive) or intent == "confirmation":
            state["user_confirmed"] = True
            state["confirmation_action"] = "proceed"
            logger.info("User confirmed booking")
        elif any(word in last_message for word in negative) or intent == "cancellation":
            state["user_confirmed"] = False
            state["confirmation_action"] = "cancel"
            state["awaiting_confirmation"] = False
            state["pending_booking"] = None
            logger.info("User cancelled booking")
        elif any(word in last_message for word in modify) or intent == "modification":
            state["user_confirmed"] = False
            state["confirmation_action"] = "modify"
            logger.info("User wants to modify")
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
# NODE 8: EXECUTE BOOKING
# =============================================================================

async def execute_booking_node(state: AgentState) -> AgentState:
    """Execute the actual booking after confirmation"""
    try:
        logger.info("🔵 Node: execute_booking")
        
        pending = state.get("pending_booking", {})
        
        if not pending:
            logger.error("No pending booking found")
            state["booking_result"] = {"success": False, "error": "No booking details found"}
            return state
        
        slot = pending.get("slot", {})
        
        booking_details = {
            "vendor_id": pending.get("vendor_id") or state.get("vendor_id"),
            "date": pending.get("date") or state.get("selected_date"),
            "time": slot.get("slot_time"),
            "end_time": slot.get("end_time"),
            "duration_hours": state.get("selected_duration") or 1.0,
            "service_type": pending.get("service_type") or "padel",
            "customer_info": {
                "phone": state.get("user_phone", ""),
                "name": state.get("entities", {}).get("customer_name") or f"Customer {state.get('user_phone')}",
                "booking_source": "whatsapp_ai"
            }
        }
        
        logger.info(f"Creating booking: vendor={booking_details['vendor_id']}, date={booking_details['date']}, time={booking_details['time']}")
        
        from database.availability_service import AvailabilityService
        availability_service = AvailabilityService()
        
        result = await availability_service.check_and_book_slot(
            vendor_id=booking_details["vendor_id"],
            date=booking_details["date"],
            time=booking_details["time"],
            customer_info=booking_details["customer_info"]
        )
        
        state["booking_result"] = result
        state["awaiting_confirmation"] = False
        state["pending_booking"] = None
        state["booking_in_progress"] = False
        
        if result and result.get("success"):
            logger.info(f"✅ Booking created successfully: {result.get('booking_id')}")
        else:
            logger.error(f"❌ Booking failed: {result.get('error') if result else 'No result'}")
        
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
        
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        query_result = state.get("query_result") or {}
        booking_result = state.get("booking_result")
        awaiting = state.get("awaiting_confirmation", False)
        confirmation_action = state.get("confirmation_action")
        messages = state.get("messages", [])
        
        context = {
            "query_result": query_result,
            "booking_result": booking_result,
            "awaiting_confirmation": awaiting,
            "confirmation_action": confirmation_action,
            "pending_booking": state.get("pending_booking"),
            "conversation_history": messages[:-1] if messages else [],
            "current_message": messages[-1].get("content", "") if messages else "",
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

def route_by_intent(state: AgentState) -> str:
    """Route to appropriate node based on intent"""
    intent = state.get("current_intent", "")
    awaiting = state.get("awaiting_confirmation", False)
    
    if awaiting and intent in ["confirmation", "cancellation", "modification", "booking_request", "unknown"]:
        return "check_confirmation"
    
    if intent in ["availability_inquiry", "booking_request"]:
        return "query_availability"
    elif intent in ["price_inquiry", "information", "greeting"]:
        return "query_info"
    elif intent == "confirmation":
        return "check_confirmation"
    else:
        return "generate_response"


def route_after_confirmation(state: AgentState) -> str:
    """Route based on confirmation result"""
    action = state.get("confirmation_action", "")
    
    if action == "proceed":
        return "execute_booking"
    else:
        return "generate_response"
