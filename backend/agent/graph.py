"""
LangGraph StateGraph Definition - Industry Standard Workflow
Refactored with conditional routing, confirmation flow, and session persistence
"""

import asyncio
import logging
import sys
import os

AGENT_RESPONSE_DELAY_S = 0.25

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from langgraph.graph import StateGraph, START, END
from agent.state import AgentState
from agent.session_store import session_store
from agent.nodes import (
    guardrails_node,
    route_after_guardrails,
    classify_intent_node,
    normalize_entities_node,
    extract_slot_node,
    validate_state_node,
    query_availability_node,
    query_info_node,
    check_confirmation_node,
    execute_booking_node,
    generate_response_node,
    route_by_intent,
    route_after_confirmation,
    route_after_availability
)

logger = logging.getLogger(__name__)


class BookingAgent:
    """LangGraph-based booking agent with industry-standard workflow"""
    
    def __init__(self):
        """Initialize the booking agent with conditional routing workflow"""
        logger.info("Initializing LangGraph Booking Agent (v2)...")
        
        self.workflow = StateGraph(AgentState)
        
        self.workflow.add_node("guardrails", guardrails_node)
        self.workflow.add_node("classify_intent", classify_intent_node)
        self.workflow.add_node("normalize_entities", normalize_entities_node)
        self.workflow.add_node("extract_slot", extract_slot_node)
        self.workflow.add_node("validate_state", validate_state_node)
        self.workflow.add_node("query_availability", query_availability_node)
        self.workflow.add_node("query_info", query_info_node)
        self.workflow.add_node("check_confirmation", check_confirmation_node)
        self.workflow.add_node("execute_booking", execute_booking_node)
        self.workflow.add_node("generate_response", generate_response_node)
        
        self.workflow.add_edge(START, "guardrails")
        self.workflow.add_conditional_edges(
            "guardrails",
            route_after_guardrails,
            {
                "classify_intent": "classify_intent",
                "generate_response": "generate_response"
            }
        )
        self.workflow.add_edge("classify_intent", "normalize_entities")
        self.workflow.add_edge("normalize_entities", "extract_slot")
        self.workflow.add_edge("extract_slot", "validate_state")
        
        self.workflow.add_conditional_edges(
            "validate_state",
            route_by_intent,
            {
                "query_availability": "query_availability",
                "query_info": "query_info",
                "check_confirmation": "check_confirmation",
                "generate_response": "generate_response"
            }
        )
        
        self.workflow.add_conditional_edges(
            "query_availability",
            route_after_availability,
            {
                "execute_booking": "execute_booking",
                "generate_response": "generate_response"
            }
        )
        self.workflow.add_edge("query_info", "generate_response")
        
        self.workflow.add_conditional_edges(
            "check_confirmation",
            route_after_confirmation,
            {
                "execute_booking": "execute_booking",
                "generate_response": "generate_response"
            }
        )
        
        self.workflow.add_edge("execute_booking", "generate_response")
        self.workflow.add_edge("generate_response", END)
        
        self.app = self.workflow.compile()
        
        logger.info("LangGraph Booking Agent (v2) initialized successfully")
    
    async def process(self, user_phone: str, message: str, conversation_history: list = None) -> str:
        """
        Process a user message and return response
        
        Args:
            user_phone: User's phone number
            message: User's message
            conversation_history: Previous conversation messages
        
        Returns:
            Agent response string
        """
        try:
            logger.info(f"Processing message from {user_phone}: {message}")
            
            if conversation_history is None:
                conversation_history = []
            
            messages = conversation_history + [{"role": "user", "content": message}]
            
            # Load persisted session state for multi-turn conversations
            persisted = session_store.get_session(user_phone) or {}
            logger.info(f"Persisted state: awaiting_confirmation={persisted.get('awaiting_confirmation')}, pending_booking={bool(persisted.get('pending_booking'))}")
            
            initial_state: AgentState = {
                "messages": messages,
                "user_phone": user_phone,
                "current_intent": "",
                "entities": {},
                "selected_slot": persisted.get("selected_slot"),
                "selected_duration": persisted.get("selected_duration"),
                "selected_date": persisted.get("selected_date"),
                "booking_in_progress": persisted.get("booking_in_progress", False),
                "vendor_id": persisted.get("vendor_id"),
                "vendor_name": persisted.get("vendor_name"),
                "vendor_data": None,
                "query_result": None,
                "slot_options": persisted.get("slot_options"),
                "awaiting_slot_selection": persisted.get("awaiting_slot_selection", False),
                "selected_sport_type": persisted.get("selected_sport_type"),
                "selected_area": persisted.get("selected_area"),
                "selected_time_range": persisted.get("selected_time_range"),
                "awaiting_confirmation": persisted.get("awaiting_confirmation", False),
                "confirmation_type": persisted.get("confirmation_type"),
                "pending_booking": persisted.get("pending_booking"),
                "booking_result": None,
                "user_confirmed": None,
                "confirmation_action": None,
                "locked_slot_id": persisted.get("locked_slot_id"),
                "awaiting_payment": persisted.get("awaiting_payment", False),
                "payment_amount": persisted.get("payment_amount"),
                "missing_fields": None,
                "requires_clarification": False,
                "guardrail_block": None,
                "policy_error": None,
                "error": None,
                "response": ""
            }
            
            final_state = await self.app.ainvoke(initial_state)
            
            # Save session state for next message
            session_store.save_session(user_phone, final_state)
            
            # Clear session only when booking is fully confirmed (not just locked)
            booking_result = final_state.get("booking_result") or {}
            booking_status = booking_result.get("status", "")
            
            if booking_result.get("success") and booking_status not in ["locked", "pending"]:
                session_store.clear_session(user_phone)
                logger.info("Booking confirmed - session cleared")
            elif final_state.get("confirmation_action") == "cancel":
                session_store.clear_session(user_phone)
                logger.info("Booking cancelled - session cleared")
            
            response = final_state.get("response", "Sorry, I couldn't process that.")
            logger.info(f"Agent response: {response[:100]}...")
            
            await asyncio.sleep(AGENT_RESPONSE_DELAY_S)
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            await asyncio.sleep(AGENT_RESPONSE_DELAY_S)
            return "Sorry, I encountered an error. Please try again."
