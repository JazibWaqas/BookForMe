"""
Agent State Definition for LangGraph
"""

from typing import TypedDict, List, Dict, Any, Optional


class AgentState(TypedDict):
    """State maintained throughout the agent conversation"""
    
    # Conversation history
    messages: List[Dict[str, str]]  # [{role: "user"/"assistant", content: "..."}]
    
    # User information
    user_phone: str
    
    # Current conversation state
    current_intent: str  # greeting, availability_inquiry, price_inquiry, booking_request, etc.
    entities: Dict[str, Any]  # {date, time, service_type, etc.}
    
    # Booking context (tracks what user is booking)
    selected_slot: Optional[Dict[str, Any]]  # Selected slot info
    selected_duration: Optional[float]  # Selected duration in hours
    selected_date: Optional[str]  # Selected date
    booking_in_progress: bool  # Whether user is in booking flow
    
    # Vendor context (always Ace Padel Club for testing)
    vendor_id: str  # Always "ace_padel_club"
    vendor_data: Optional[Dict[str, Any]]  # Vendor info, pricing, etc.
    
    # Query results
    query_result: Optional[Dict[str, Any]]  # Results from tool execution
    
    # Response
    response: str  # Final response to send to user

