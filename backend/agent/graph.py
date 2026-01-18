"""
LangGraph StateGraph Definition - Industry Standard Workflow
Refactored with conditional routing, confirmation flow, and session persistence
"""

import logging
import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from langgraph.graph import StateGraph, START, END
from agent.state import AgentState
from agent.session_store import session_store
from agent.nodes import (
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
    route_after_confirmation
)

logger = logging.getLogger(__name__)


class BookingAgent:
    """LangGraph-based booking agent with industry-standard workflow"""
    
    def __init__(self):
        """Initialize the booking agent with conditional routing workflow"""
        logger.info("Initializing LangGraph Booking Agent (v2)...")
        
        self.workflow = StateGraph(AgentState)
        
        self.workflow.add_node("classify_intent", classify_intent_node)
        self.workflow.add_node("normalize_entities", normalize_entities_node)
        self.workflow.add_node("extract_slot", extract_slot_node)
        self.workflow.add_node("validate_state", validate_state_node)
        self.workflow.add_node("query_availability", query_availability_node)
        self.workflow.add_node("query_info", query_info_node)
        self.workflow.add_node("check_confirmation", check_confirmation_node)
        self.workflow.add_node("execute_booking", execute_booking_node)
        self.workflow.add_node("generate_response", generate_response_node)
        
        self.workflow.add_edge(START, "classify_intent")
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
        
        self.workflow.add_edge("query_availability", "generate_response")
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
                "vendor_id": persisted.get("vendor_id") or "ace_padel_club",
                "vendor_name": persisted.get("vendor_name"),
                "vendor_data": None,
                "query_result": None,
                "awaiting_confirmation": persisted.get("awaiting_confirmation", False),
                "confirmation_type": persisted.get("confirmation_type"),
                "pending_booking": persisted.get("pending_booking"),
                "booking_result": None,
                "user_confirmed": None,
                "confirmation_action": None,
                "missing_fields": None,
                "requires_clarification": False,
                "error": None,
                "response": ""
            }
            
            final_state = await self.app.ainvoke(initial_state)
            
            # Save session state for next message
            session_store.save_session(user_phone, final_state)
            
            # Clear session if booking completed or cancelled
            booking_result = final_state.get("booking_result") or {}
            if booking_result.get("success"):
                session_store.clear_session(user_phone)
                logger.info("Booking successful - session cleared")
            elif final_state.get("confirmation_action") == "cancel":
                session_store.clear_session(user_phone)
                logger.info("Booking cancelled - session cleared")
            
            response = final_state.get("response", "Sorry, I couldn't process that.")
            logger.info(f"Agent response: {response[:100]}...")
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "Sorry, I encountered an error. Please try again."
