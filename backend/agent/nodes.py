"""
LangGraph Agent Nodes
"""

import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from agent.state import AgentState
from agent.tools import check_availability, get_pricing, get_vendor_info, suggest_alternatives
from nlu.agent import NLUAgent

logger = logging.getLogger(__name__)

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
        return {"start": "18:00", "end": "21:00"}
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
    
    return None


async def classify_intent_node(state: AgentState) -> AgentState:
    """Classify user intent using NLU"""
    try:
        logger.info("Classifying intent...")
        
        # Get last user message
        messages = state.get("messages", [])
        if not messages:
            state["current_intent"] = "greeting"
            state["entities"] = {}
            return state
        
        last_message = messages[-1]["content"]
        
        # Extract intent and entities using NLU
        # For now, use conversation history from state
        conversation_history = [
            {"role": msg.get("role"), "content": msg.get("content")}
            for msg in messages[:-1]  # All except last message
        ]
        
        # Use NLU agent - node is async so we can await
        nlu_result = await nlu_agent.extract_intent(last_message, conversation_history)
        
        intent = nlu_result.get("intent", "unknown")
        entities = nlu_result.get("entities", {})
        
        # Normalize date if present (can be string or dict from NLU)
        date_value = entities.get("date")
        if date_value:
            if isinstance(date_value, dict):
                date_text = date_value.get("text") or date_value.get("value") or ""
            else:
                date_text = str(date_value)
            if date_text:
                try:
                    entities["date"] = normalize_date(date_text)
                except:
                    pass  # Keep original if normalization fails
        
        # Normalize time if present (can be string or dict from NLU)
        time_value = entities.get("time")
        if time_value:
            if isinstance(time_value, dict):
                time_text = time_value.get("text") or time_value.get("value") or ""
            else:
                time_text = str(time_value)
            if time_text:
                time_range = normalize_time(time_text)
                if time_range:
                    entities["time_range"] = time_range
        
        state["current_intent"] = intent
        state["entities"] = entities
        state["vendor_id"] = "ace_padel_club"  # Always Ace Padel for testing
        
        logger.info(f"Intent classified: {intent}, Entities: {entities}")
        
        return state
        
    except Exception as e:
        logger.error(f"Error classifying intent: {e}")
        state["current_intent"] = "unknown"
        state["entities"] = {}
        return state


async def query_node(state: AgentState) -> AgentState:
    """Execute query based on intent"""
    try:
        logger.info("Executing query...")
        
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        
        query_result = None
        
        if intent == "availability_inquiry" or intent == "booking_request":
            # Check availability
            date = entities.get("date")
            if not date:
                # Default to today if no date
                date = datetime.now().strftime("%Y-%m-%d")
            
            time_range = entities.get("time_range")
            
            query_result = check_availability(date, time_range)
            
        elif intent == "price_inquiry":
            # Get pricing
            query_result = get_pricing()
            
        elif intent == "information":
            # Get vendor info
            query_result = get_vendor_info()
            
        elif intent == "greeting":
            # Get vendor info for greeting response
            query_result = get_vendor_info()
        
        state["query_result"] = query_result
        
        return state
        
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        state["query_result"] = {"success": False, "error": str(e)}
        return state


async def generate_response_node(state: AgentState) -> AgentState:
    """Generate natural language response"""
    try:
        logger.info("Generating response...")
        
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        query_result = state.get("query_result", {})
        messages = state.get("messages", [])
        
        # Get last user message to detect language style
        last_user_msg = ""
        if messages:
            last_user_msg = messages[-1].get("content", "")
        
        is_roman_urdu = any(word in last_user_msg.lower() for word in 
                           ["aoa", "salam", "koi", "hei", "hai", "kal", "aaj", "shaam"])
        
        response = ""
        
        if intent == "greeting":
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
        
        elif intent == "availability_inquiry" or intent == "booking_request":
            if query_result.get("success"):
                available_slots = query_result.get("available_slots", [])
                
                if not available_slots:
                    # No slots available, suggest alternatives
                    date = entities.get("date", datetime.now().strftime("%Y-%m-%d"))
                    alternatives = suggest_alternatives(date)
                    
                    if is_roman_urdu:
                        response = "Sorry, requested time slot not available. Alternatives:\n"
                    else:
                        response = "Sorry, the requested time slot is not available. Here are alternatives:\n"
                    
                    for alt in alternatives.get("alternatives", [])[:3]:
                        response += f"• {alt['time']} - Rs {alt['discounted_price']}/hour\n"
                else:
                    # Slots available
                    if is_roman_urdu:
                        response = "Han g! Slots available hain:\n\n"
                    else:
                        response = "Yes! Slots are available:\n\n"
                    
                    for slot in available_slots[:5]:  # Show max 5 slots
                        response += f"• {slot['slot_time']} - {slot['end_time']}\n"
                        response += f"  Price: Rs {slot['discounted_price']}/hour\n\n"
                    
                    if is_roman_urdu:
                        response += "Kaunsa slot book karna hai?"
                    else:
                        response += "Which slot would you like to book?"
            else:
                response = "Sorry, I couldn't check availability. Please try again."
        
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
                response = "Sorry, I couldn't get pricing information."
        
        else:
            if is_roman_urdu:
                response = "Mujhe samajh nahi aaya. Kya aap dobara batayein?"
            else:
                response = "I didn't understand. Could you please rephrase?"
        
        state["response"] = response
        logger.info(f"Response generated: {response[:100]}...")
        
        return state
        
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        state["response"] = "Sorry, I encountered an error. Please try again."
        return state

