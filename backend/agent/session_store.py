"""
Session Store - Persists conversation state across messages
Uses in-memory store with session expiry
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

SESSION_EXPIRY_MINUTES = 30


class SessionStore:
    """In-memory session store for conversation state persistence"""
    
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}
        logger.info("Session store initialized")
    
    def get_session(self, user_phone: str) -> Optional[Dict[str, Any]]:
        """Get session state for a user"""
        session = self._sessions.get(user_phone)
        
        if session:
            last_active = session.get("_last_active")
            if last_active:
                expiry = last_active + timedelta(minutes=SESSION_EXPIRY_MINUTES)
                if datetime.now() > expiry:
                    logger.info(f"Session expired for {user_phone}")
                    del self._sessions[user_phone]
                    return None
            
            logger.info(f"Loaded session for {user_phone}: awaiting_confirmation={session.get('awaiting_confirmation')}")
            return session
        
        return None
    
    def save_session(self, user_phone: str, state: Dict[str, Any]) -> None:
        """Save session state for a user (only persists booking-related fields)"""
        persisted_keys = [
            "awaiting_confirmation",
            "confirmation_type", 
            "pending_booking",
            "selected_slot",
            "selected_date",
            "selected_duration",
            "booking_in_progress",
            "vendor_id",
            "vendor_name",
            "locked_slot_id",
            "awaiting_payment",
            "payment_amount"
        ]
        
        session_data = {}
        for k in persisted_keys:
            val = state.get(k)
            if val is not None:
                session_data[k] = val
        
        session_data["_last_active"] = datetime.now()
        
        self._sessions[user_phone] = session_data
        logger.info(f"Saved session for {user_phone}: awaiting_confirmation={session_data.get('awaiting_confirmation')}")
    
    def clear_session(self, user_phone: str) -> None:
        """Clear session for a user (after booking completed or cancelled)"""
        if user_phone in self._sessions:
            del self._sessions[user_phone]
            logger.info(f"Cleared session for {user_phone}")


session_store = SessionStore()

