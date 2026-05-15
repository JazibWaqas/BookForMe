"""
Agent State Definition for LangGraph
Industry-standard state with confirmation flow support
"""

from typing import TypedDict, List, Dict, Any, Optional


class AgentState(TypedDict):
    """State maintained throughout the agent conversation"""
    
    # Conversation history
    messages: List[Dict[str, str]]
    
    # User information
    user_phone: str
    
    # Intent & Entities (from NLU)
    current_intent: str
    entities: Dict[str, Any]
    
    # Booking Context
    selected_slot: Optional[Dict[str, Any]]
    selected_duration: Optional[float]
    selected_date: Optional[str]
    booking_in_progress: bool
    
    # Vendor Context
    vendor_id: str
    vendor_name: Optional[str]
    vendor_data: Optional[Dict[str, Any]]
    
    # Query Results
    query_result: Optional[Dict[str, Any]]
    slot_options: Optional[List[Dict[str, Any]]]
    awaiting_slot_selection: bool
    selected_sport_type: Optional[str]
    selected_area: Optional[str]
    selected_time_range: Optional[Dict[str, str]]
    slot_selection_reset: Optional[bool]
    
    # Confirmation Flow State
    awaiting_confirmation: bool
    confirmation_type: Optional[str]
    pending_booking: Optional[Dict[str, Any]]
    booking_result: Optional[Dict[str, Any]]
    user_confirmed: Optional[bool]
    confirmation_action: Optional[str]
    
    # Slot Locking (prevents double-booking)
    locked_slot_id: Optional[str]
    
    # Payment Flow
    awaiting_payment: bool
    payment_amount: Optional[float]
    
    # Validation
    missing_fields: Optional[List[str]]
    requires_clarification: bool
    policy_error: Optional[Dict[str, Any]]
    
    # Guardrails
    guardrail_block: Optional[str]
    
    # Error Handling
    error: Optional[Dict[str, Any]]
    
    # Response
    response: str
