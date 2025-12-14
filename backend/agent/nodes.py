"""
LangGraph Agent Nodes
"""

import logging
import json
from typing import Dict, Any
from datetime import datetime, timedelta
from agent.state import AgentState
from agent.tools import check_availability, get_pricing, get_vendor_info, suggest_alternatives
from agent.duration import parse_duration, calculate_price_for_duration, format_duration
from nlu.agent import NLUAgent

logger = logging.getLogger(__name__)

# Debug logging configuration
DEBUG_LOG_PATH = r"c:\Users\LENOVO\Desktop\Fyp\.cursor\debug.log"

def debug_log(hypothesis_id: str, location: str, message: str, data: dict = None):
    """Write debug log entry"""
    try:
        import time
        log_entry = {
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data or {},
            "timestamp": int(time.time() * 1000)
        }
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass  # Silently fail if logging fails

# Initialize NLU agent
nlu_agent = NLUAgent()


def normalize_date(date_text: str) -> str:
    """
    Normalize date text to YYYY-MM-DD format
    Handles: "tomorrow", "today", "kal", "Friday", etc.
    """
    today = datetime.now()
    date_lower = date_text.lower().strip()
    
    if date_lower in ["today", "aaj"]:
        return today.strftime("%Y-%m-%d")
    elif date_lower in ["tomorrow", "kal"]:
        tomorrow = today + timedelta(days=1)
        return tomorrow.strftime("%Y-%m-%d")
    elif "day after tomorrow" in date_lower or "parson" in date_lower:
        day_after = today + timedelta(days=2)
        return day_after.strftime("%Y-%m-%d")
    else:
        # Try to parse as day name (find next occurrence)
        day_names = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }
        for day_name, day_num in day_names.items():
            if day_name in date_lower:
                days_ahead = day_num - today.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                target_date = today + timedelta(days=days_ahead)
                return target_date.strftime("%Y-%m-%d")
    
    # Default to today if can't parse
    return today.strftime("%Y-%m-%d")


def normalize_time(time_text: str) -> Dict[str, str]:
    """
    Normalize time text to time range dict
    Handles: "evening", "shaam", "6-9", "after 6", etc.
    """
    time_lower = time_text.lower().strip()
    
    # Handle relative times
    if "evening" in time_lower or "shaam" in time_lower:
        return {"start": "18:00", "end": "23:00"}  # Evening is 6 PM to 11 PM
    elif "morning" in time_lower or "subah" in time_lower:
        return {"start": "09:00", "end": "12:00"}
    elif "afternoon" in time_lower:
        return {"start": "12:00", "end": "18:00"}
    elif "night" in time_lower or "raat" in time_lower:
        return {"start": "21:00", "end": "23:00"}
    
    # Handle "after X" pattern
    if "after" in time_lower:
        import re
        match = re.search(r"after\s+(\d+)", time_lower)
        if match:
            hour = int(match.group(1))
            return {"start": f"{hour:02d}:00"}
    
    # Handle time range "6-9" or "6:00-9:00"
    if "-" in time_lower:
        import re
        match = re.search(r"(\d+)[:\s]?(\d+)?\s*-\s*(\d+)[:\s]?(\d+)?", time_lower)
        if match:
            start_hour = int(match.group(1))
            end_hour = int(match.group(3))
            return {"start": f"{start_hour:02d}:00", "end": f"{end_hour:02d}:00"}
    
    # Handle single time "7pm" or "19:00"
    import re
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
    
    # Handle Roman Urdu time patterns: "5 bajay", "5 baje", "5 bajay kei around"
    bajay_match = re.search(r"(\d+)\s*baj(?:ay|e|ey)(?:\s+kei?\s+around)?", time_lower)
    if bajay_match:
        hour = int(bajay_match.group(1))
        # Assume PM if hour is 1-11, AM if 12 or mentioned
        if hour <= 11 and "subah" not in time_lower and "morning" not in time_lower:
            hour += 12  # Assume PM
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1):02d}:00"}
    
    # Handle "around X" pattern
    around_match = re.search(r"around\s+(\d+)", time_lower)
    if around_match:
        hour = int(around_match.group(1))
        if hour <= 11:
            hour += 12  # Assume PM
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1):02d}:00"}
    
    return None


async def classify_intent_node(state: AgentState) -> AgentState:
    """Classify user intent using NLU"""
    # #region agent log
    debug_log("A", "nodes.py:120", "classify_intent_node ENTRY", {"state_keys": list(state.keys()), "messages_count": len(state.get("messages", []))})
    # #endregion
    try:
        logger.info("Classifying intent...")
        
        # Get last user message
        messages = state.get("messages", [])
        # #region agent log
        debug_log("A", "nodes.py:127", "Messages extracted", {"messages_count": len(messages), "has_messages": bool(messages)})
        # #endregion
        if not messages:
            state["current_intent"] = "greeting"
            state["entities"] = {}
            # #region agent log
            debug_log("A", "nodes.py:130", "No messages - returning greeting", {"intent": state["current_intent"]})
            # #endregion
            return state
        
        last_message = messages[-1]["content"]
        logger.info(f"Processing message: '{last_message}'")
        # #region agent log
        debug_log("A", "nodes.py:133", "Last message extracted", {"last_message": last_message, "message_type": type(last_message).__name__})
        # #endregion
        
        # FALLBACK: Check for common greetings BEFORE calling NLU (avoids quota issues)
        last_message_lower = last_message.lower().strip()
        common_greetings = ["hi", "hello", "hey", "aoa", "salam", "salaam", "assalam", "assalamu", "assalamu alaikum"]
        
        # Check if message is exactly a greeting or starts with a greeting word
        is_greeting = (last_message_lower in common_greetings or 
                      any(last_message_lower.startswith(greeting + " ") or last_message_lower == greeting 
                          for greeting in common_greetings))
        
        if is_greeting:
            # #region agent log
            debug_log("A", "nodes.py:142", "GREETING FALLBACK TRIGGERED", {"last_message": last_message, "detected_via": "fallback"})
            # #endregion
            logger.info(f"✅ Detected greeting via fallback: '{last_message}'")
            state["current_intent"] = "greeting"
            state["entities"] = {}
            state["vendor_id"] = "ace_padel_club"
            return state
        
        # Extract intent and entities using NLU
        conversation_history = [
            {"role": msg.get("role"), "content": msg.get("content")}
            for msg in messages[:-1]  # All except last message
        ]
        
        # Use NLU agent - node is async so we can await
        # #region agent log
        debug_log("A", "nodes.py:155", "BEFORE NLU call", {"last_message": last_message, "history_len": len(conversation_history)})
        # #endregion
        nlu_result = await nlu_agent.extract_intent(last_message, conversation_history)
        # #region agent log
        debug_log("A", "nodes.py:144", "AFTER NLU call", {"nlu_result": nlu_result, "nlu_result_type": type(nlu_result).__name__})
        # #endregion
        
        # Extract intent and entities from NLU result
        intent = nlu_result.get("intent", "unknown")
        entities = nlu_result.get("entities", {})
        # #region agent log
        debug_log("A", "nodes.py:148", "Intent extracted from NLU", {"intent": intent, "intent_type": type(intent).__name__, "intent_repr": repr(intent), "entities": entities})
        # #endregion
        
        # Debug logging
        logger.info(f"🔍 NLU Result - Intent: '{intent}', Raw Entities: {entities}")
        
        # Clean None values from entities (Gemini returns None for missing entities)
        entities = {k: v for k, v in entities.items() if v is not None}
        logger.info(f"✅ Cleaned Entities: {entities}")
        
        # Normalize date if present (can be string or dict from NLU)
        date_value = entities.get("date")
        if date_value:
            try:
                if isinstance(date_value, dict):
                    date_text = date_value.get("text") or date_value.get("value") or ""
                else:
                    date_text = str(date_value)
                
                if date_text:
                    entities["date"] = normalize_date(date_text)
                    logger.info(f"✅ Normalized date: {entities['date']}")
            except Exception as e:
                logger.warning(f"Date normalization failed: {e}, keeping original: {date_value}")
                # Keep original value if normalization fails
        
        # Normalize time if present (can be string or dict from NLU)
        time_value = entities.get("time")
        if time_value:
            try:
                if isinstance(time_value, dict):
                    time_text = time_value.get("text") or time_value.get("value") or ""
                else:
                    time_text = str(time_value)
                
                if time_text:
                    time_range = normalize_time(time_text)
                    if time_range:
                        entities["time_range"] = time_range
                        logger.info(f"✅ Normalized time: {time_range}")
            except Exception as e:
                logger.warning(f"Time normalization failed: {e}, keeping original: {time_value}")
                # Keep original value if normalization fails
        
        # Parse duration if present (e.g., "30 mins", "1.5 hours", "1 ghanta")
        duration_text = entities.get("duration")
        if not duration_text:
            # Check message for duration patterns (Roman Urdu: "1 ghanta")
            last_message_lower = last_message.lower()
            if "ghanta" in last_message_lower or "hour" in last_message_lower or "minute" in last_message_lower or "min" in last_message_lower:
                duration_text = last_message
        
        if duration_text:
            try:
                duration_info = parse_duration(str(duration_text))
                if duration_info:
                    entities["duration_hours"] = duration_info["hours"]
                    state["selected_duration"] = duration_info["hours"]
                    logger.info(f"✅ Parsed duration: {duration_info['hours']} hours")
            except Exception as e:
                logger.warning(f"Duration parsing failed: {e}")
        
        # Extract slot selection from message (e.g., "11-12", "11:00-12:00")
        slot_match = None
        last_message_lower = last_message.lower()
        if "11-12" in last_message or "11:00-12:00" in last_message:
            slot_match = {"slot_time": "11:00", "end_time": "12:00"}
        else:
            import re
            # Pattern for "X-Y" or "X:00-Y:00" time ranges
            slot_pattern = r"(\d{1,2})[:\s-]+(\d{1,2})"
            slot_m = re.search(slot_pattern, last_message)
            if slot_m:
                try:
                    start_hour = int(slot_m.group(1))
                    end_hour = int(slot_m.group(2))
                    # Assume 24-hour format if both are reasonable hours
                    if start_hour < 24 and end_hour < 24:
                        slot_match = {
                            "slot_time": f"{start_hour:02d}:00",
                            "end_time": f"{end_hour:02d}:00"
                        }
                except (ValueError, IndexError) as e:
                    logger.warning(f"Slot pattern parsing failed: {e}")
        
        if slot_match:
            state["selected_slot"] = slot_match
            state["booking_in_progress"] = True
            logger.info(f"✅ Extracted slot: {slot_match}")
        
        # Track selected date
        if entities.get("date"):
            state["selected_date"] = entities["date"]
        
        # Set final state
        state["current_intent"] = intent
        state["entities"] = entities
        state["vendor_id"] = "ace_padel_club"  # Always Ace Padel for testing
        # #region agent log
        debug_log("A", "nodes.py:238", "BEFORE RETURN from classify_intent_node", {"state_intent": state.get("current_intent"), "state_intent_type": type(state.get("current_intent")).__name__, "state_intent_repr": repr(state.get("current_intent")), "state_keys": list(state.keys())})
        # #endregion
        
        logger.info(f"✅ Intent classified: '{intent}', Final Entities: {entities}")
        
        return state
        
    except Exception as e:
        logger.error(f"❌ Error classifying intent: {e}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        # #region agent log
        debug_log("A", "nodes.py:245", "EXCEPTION in classify_intent_node", {"error": str(e), "error_type": type(e).__name__, "traceback": traceback.format_exc()})
        # #endregion
        state["current_intent"] = "unknown"
        state["entities"] = {}
        # #region agent log
        debug_log("A", "nodes.py:249", "Exception handler setting intent to unknown", {"state_intent": state.get("current_intent")})
        # #endregion
        return state


async def query_node(state: AgentState) -> AgentState:
    """Execute query based on intent"""
    # #region agent log
    debug_log("B", "nodes.py:254", "query_node ENTRY", {"state_intent": state.get("current_intent"), "state_intent_type": type(state.get("current_intent")).__name__, "state_intent_repr": repr(state.get("current_intent")), "state_keys": list(state.keys())})
    # #endregion
    try:
        logger.info("Executing query...")
        
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        # #region agent log
        debug_log("B", "nodes.py:260", "Intent extracted in query_node", {"intent": intent, "intent_type": type(intent).__name__, "intent_repr": repr(intent)})
        # #endregion
        
        query_result = {"success": False}  # FIX: Initialize as dict, not None
        
        if intent == "availability_inquiry" or intent == "booking_request":
            # Check availability - now requires sport_type and area
            sport_type = entities.get("sport_type", "padel")  # Default to padel if not specified
            area = entities.get("area", "DHA")  # Default to DHA if not specified
            date = entities.get("date")
            if not date:
                # Default to today if no date
                date = datetime.now().strftime("%Y-%m-%d")

            time_range = entities.get("time_range")

            query_result = await check_availability(sport_type, area, date, time_range)
            
        elif intent == "price_inquiry":
            # Get pricing
            query_result = get_pricing()
            
        elif intent == "information":
            # Get vendor info
            query_result = get_vendor_info()
            
        elif intent == "greeting":
            # Get vendor info for greeting response
            query_result = get_vendor_info()
        
        # FIX: Ensure query_result is always a dict (never None)
        if query_result is None:
            query_result = {"success": False, "error": "Query returned None"}
        elif not isinstance(query_result, dict):
            query_result = {"success": False, "error": f"Query returned invalid type: {type(query_result)}"}
        
        state["query_result"] = query_result
        # #region agent log
        debug_log("B", "nodes.py:295", "BEFORE RETURN from query_node", {"state_intent": state.get("current_intent"), "state_intent_repr": repr(state.get("current_intent"))})
        # #endregion
        return state
        
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        # #region agent log
        debug_log("B", "nodes.py:300", "EXCEPTION in query_node", {"error": str(e), "state_intent": state.get("current_intent")})
        # #endregion
        state["query_result"] = {"success": False, "error": str(e)}
        return state


async def generate_response_node(state: AgentState) -> AgentState:
    """Generate natural language response"""
    # #region agent log
    debug_log("C", "nodes.py:305", "generate_response_node ENTRY", {"state_intent": state.get("current_intent"), "state_intent_type": type(state.get("current_intent")).__name__, "state_intent_repr": repr(state.get("current_intent")), "state_keys": list(state.keys())})
    # #endregion
    try:
        logger.info("Generating response...")
        
        # Get state values
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        # FIX: Ensure query_result is always a dict, even if None in state
        query_result_raw = state.get("query_result")
        query_result = query_result_raw if isinstance(query_result_raw, dict) else {}
        messages = state.get("messages", [])
        # #region agent log
        debug_log("C", "nodes.py:378", "Intent extracted in generate_response_node", {"intent": intent, "intent_type": type(intent).__name__, "intent_repr": repr(intent), "intent_len": len(intent) if intent else 0, "intent_eq_greeting": intent == "greeting", "query_result_type": type(query_result_raw).__name__, "query_result_is_dict": isinstance(query_result_raw, dict)})
        # #endregion
        
        # Debug logging
        logger.info(f"🔍 Generating response for intent: '{intent}'")
        logger.info(f"🔍 Entities: {entities}")
        logger.info(f"🔍 Query result success: {query_result.get('success', False)}")
        
        # Get last user message to detect language style
        last_user_msg = ""
        if messages:
            last_user_msg = messages[-1].get("content", "")
        
        is_roman_urdu = any(word in last_user_msg.lower() for word in 
                           ["aoa", "salam", "koi", "hei", "hai", "kal", "aaj", "shaam"])
        
        response = ""
        
        # Handle greeting intent
        # #region agent log
        debug_log("C", "nodes.py:327", "BEFORE greeting check", {"intent": intent, "intent_repr": repr(intent), "check_result": intent == "greeting", "response_empty": not response})
        # #endregion
        if intent == "greeting":
            # #region agent log
            debug_log("C", "nodes.py:328", "GREETING BRANCH TAKEN", {"is_roman_urdu": is_roman_urdu})
            # #endregion
            if is_roman_urdu:
                response = """AoA! Welcome to Ace Padel Club. 

                    I can help you with:
                    • Slot availability
                    • Pricing information
                    • Booking

                    Kaunsa service chahiye?"""
            else:
                response = """Hello! Welcome to Ace Padel Club.

                I can help you with:
                • Slot availability
                • Pricing information
                • Booking

                How can I help you today?"""
            logger.info("✅ Generated greeting response")
        
        # Check if user is confirming a booking or asking for price
        elif selected_slot := state.get("selected_slot"):
            selected_duration = state.get("selected_duration")
            selected_date = state.get("selected_date")
            
            # Check if asking for price or confirming
            price_keywords = ["kitnay", "price", "cost", "huei", "1 hour", "1 ghanta"]
            is_price_inquiry = any(keyword in last_user_msg.lower() for keyword in price_keywords)
            
            if selected_duration or is_price_inquiry:
                # User has selected a slot and is asking for price or confirming
                slot_time = selected_slot.get("slot_time", "")
                end_time = selected_slot.get("end_time", "")
                
                # Get the actual slot data to calculate price
                date = selected_date or entities.get("date") or datetime.now().strftime("%Y-%m-%d")
                
                try:
                    # For slot-specific queries, we need sport_type and area from previous context
                    sport_type = state.get("entities", {}).get("sport_type", "padel")
                    area = state.get("entities", {}).get("area", "DHA")
                    slot_query = await check_availability(sport_type, area, date, {"start": slot_time, "end": end_time})
                    actual_slot = None
                    selected_vendor = None

                    # Find the slot across all vendors
                    if slot_query.get("success") and slot_query.get("vendors"):
                        for vendor in slot_query["vendors"]:
                            for s in vendor.get("available_slots", []):
                                if s["time_slot"].startswith(slot_time):
                                    actual_slot = s
                                    selected_vendor = vendor
                                    break
                            if actual_slot:
                                break
                    
                    if actual_slot and selected_vendor:
                        duration_hours = selected_duration or 1.0  # Default to 1 hour
                        price_per_hour = selected_vendor.get("pricing", {}).get("base_price", actual_slot.get("price", 0))

                        from agent.duration import calculate_price_for_duration
                        price_info = calculate_price_for_duration(price_per_hour, duration_hours)
                        
                        if is_roman_urdu:
                            response = f"""✅ Booking Summary:

                            📅 Date: {date}
                            ⏰ Time: {slot_time} - {end_time}
                            ⏱️ Duration: {format_duration(duration_hours)}
                            💰 Price: Rs {int(price_info['discounted_price'])} (after 20% discount)

                            Confirm karna hai?"""
                        else:
                            response = f"""✅ Booking Summary:

                                📅 Date: {date}
                                ⏰ Time: {slot_time} - {end_time}
                                ⏱️ Duration: {format_duration(duration_hours)}
                                💰 Price: Rs {int(price_info['discounted_price'])} (after 20% discount)

                                Would you like to confirm this booking?"""
                    else:
                        if is_roman_urdu:
                            response = "Sorry, yeh slot available nahi hai. Koi aur time try karein?"
                        else:
                            response = "Sorry, this slot is not available. Please try another time."
                except Exception as e:
                    logger.error(f"Error checking slot availability: {e}")
                    if is_roman_urdu:
                        response = "Sorry, slot check karne mein error aaya. Dobara try karein?"
                    else:
                        response = "Sorry, I encountered an error checking slot availability. Please try again."
        
        # Handle availability inquiry or booking request
        elif intent == "availability_inquiry" or intent == "booking_request":
            if query_result.get("success"):
                vendors = query_result.get("vendors", [])

                if not vendors:
                    # No vendors found with available slots
                    sport_type = query_result.get("sport_type", "requested sport")
                    area = query_result.get("area", "requested area")
                    message = query_result.get("message", f"No available slots found for {sport_type} in {area}")

                    if is_roman_urdu:
                        response = f"Sorry, {message}. Koi aur time ya area try karein?"
                    else:
                        response = f"Sorry, {message}. Please try a different time or area."
                else:
                    # Display available vendors and their slots
                    if is_roman_urdu:
                        response = f"Great! Yeh {query_result.get('sport_type', 'sports')} ke liye {query_result.get('area', 'area')} mein available vendors hain:\n\n"
                    else:
                        response = f"Great! Here are available vendors for {query_result.get('sport_type', 'sports')} in {query_result.get('area', 'area')}:\n\n"

                    for i, vendor in enumerate(vendors, 1):
                        response += f"{i}. **{vendor['vendor_name']}**\n"
                        response += f"   📍 Address: {vendor['vendor_address']}\n"
                        response += f"   💰 Base Price: Rs {vendor['pricing']['base_price']}/hour\n"
                        response += f"   🆔 Vendor ID: {vendor['vendor_id']}\n\n"

                        # Show available time slots
                        response += "   Available slots:\n"
                        for slot in vendor['available_slots'][:3]:  # Show up to 3 slots per vendor
                            response += f"   • {slot['time_slot']} - Rs {slot['price']}\n"

                        if len(vendor['available_slots']) > 3:
                            response += f"   ... and {len(vendor['available_slots']) - 3} more slots\n"

                        response += "\n"

                    if is_roman_urdu:
                        response += "Kaunsa vendor aur slot select karna hai?"
                    else:
                        response += "Which vendor and time slot would you like to book?"
            else:
                error_msg = query_result.get("error", "Unknown error")
                logger.error(f"Query failed: {error_msg}")
                if is_roman_urdu:
                    response = "Sorry, availability check karne mein error aaya. Dobara try karein?"
                else:
                    response = "Sorry, I couldn't check availability. Please try again."
        
        # Handle price inquiry
        elif intent == "price_inquiry":
            if query_result.get("success"):
                pricing = query_result.get("pricing", {})
                base_price = pricing.get("base_price_per_hour", 0)
                discount = pricing.get("discount_percent", 0)
                discounted = pricing.get("discounted_price_per_hour", 0)
                
                if is_roman_urdu:
                    response = f"""Pricing:

• Base Price: Rs {base_price}/hour
• Discount: {discount}%
• After Discount: Rs {discounted}/hour
• Card Discount: Not available

Kitna slot chahiye?"""
                else:
                    response = f"""Pricing:

• Base Price: Rs {base_price}/hour
• Discount: {discount}%
• After Discount: Rs {discounted}/hour
• Card Discount: Not available

How long would you like to book?"""
            else:
                logger.error(f"Price query failed: {query_result.get('error', 'Unknown error')}")
                if is_roman_urdu:
                    response = "Sorry, pricing information mil nahi saki."
                else:
                    response = "Sorry, I couldn't get pricing information."
        
        # Handle information request
        elif intent == "information":
            if query_result.get("success"):
                vendor_info = query_result.get("vendor_info", {})
                vendor_name = vendor_info.get("name", "Ace Padel Club")
                services = vendor_info.get("services", [])
                
                if is_roman_urdu:
                    response = f"{vendor_name} mein yeh services available hain:\n\n"
                else:
                    response = f"{vendor_name} offers the following services:\n\n"
                
                for service in services[:5]:
                    response += f"• {service}\n"
            else:
                if is_roman_urdu:
                    response = "Sorry, information mil nahi saki."
                else:
                    response = "Sorry, I couldn't retrieve the information."
        
        # Handle confirmation
        elif intent == "confirmation":
            if is_roman_urdu:
                response = "Booking confirm ho gayi hai! Aapko confirmation message milega."
            else:
                response = "Booking confirmed! You will receive a confirmation message."
        
        # Handle cancellation
        elif intent == "cancellation":
            if is_roman_urdu:
                response = "Booking cancel kar di gayi hai."
            else:
                response = "Booking has been cancelled."
        
        # Fallback for unknown or unhandled intents
        else:
            # #region agent log
            debug_log("C", "nodes.py:497", "FALLBACK ELSE BRANCH", {"intent": intent, "intent_repr": repr(intent), "intent_type": type(intent).__name__, "response_empty": not response})
            # #endregion
            logger.warning(f"⚠️ Unhandled intent: '{intent}'")
            if is_roman_urdu:
                response = "Mujhe samajh nahi aaya. Kya aap dobara batayein?"
            else:
                response = "I didn't understand. Could you please rephrase?"
        
        # Ensure response is not empty
        if not response or not response.strip():
            logger.warning("⚠️ Empty response generated, using fallback")
            if is_roman_urdu:
                response = "Sorry, response generate nahi ho saka. Dobara try karein?"
            else:
                response = "Sorry, I couldn't generate a response. Please try again."
        
        state["response"] = response
        # #region agent log
        debug_log("C", "nodes.py:503", "BEFORE RETURN from generate_response_node", {"response": response[:100], "response_len": len(response), "state_intent": state.get("current_intent")})
        # #endregion
        logger.info(f"✅ Response generated (length: {len(response)} chars): {response[:100]}...")
        
        return state
        
    except Exception as e:
        logger.error(f"❌ Error generating response: {e}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        # #region agent log
        debug_log("C", "nodes.py:508", "EXCEPTION in generate_response_node", {"error": str(e), "state_intent": state.get("current_intent")})
        # #endregion
        
        # Try to generate a basic error response based on language
        last_user_msg = ""
        if state.get("messages"):
            last_user_msg = state.get("messages", [])[-1].get("content", "")
        
        is_roman_urdu = any(word in last_user_msg.lower() for word in 
                           ["aoa", "salam", "koi", "hei", "hai", "kal", "aaj", "shaam"])
        
        if is_roman_urdu:
            state["response"] = "Sorry, error aaya. Dobara try karein?"
        else:
            state["response"] = "Sorry, I encountered an error. Please try again."
        
        return state