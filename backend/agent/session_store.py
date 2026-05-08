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
        # Keys that always persist (active booking lifecycle)
        always_persist = [
            "awaiting_confirmation",
            "confirmation_type",
            "pending_booking",
            "selected_slot",
            "selected_duration",
            "booking_in_progress",
            "locked_slot_id",
            "awaiting_payment",
            "payment_amount",
            "slot_options",
            "awaiting_slot_selection",
            "selected_area",
            # vendor_id and vendor_name intentionally NOT persisted —
            # they caused stale Ace Padel to leak into all subsequent queries.
        ]

        session_data = {}
        for k in always_persist:
            val = state.get(k)
            if val is not None:
                session_data[k] = val

        # Always preserve booking context (date/sport/time) when present in state.
        # Conservative persistence: if we have it, keep it. Don't drop context
        # just because the latest turn was classified as 'unknown'. Stale context
        # is cleared on explicit reset paths (greeting detection, confirmation_action,
        # session expiry). This prevents cascading state loss when NLU has a bad turn.
        for k in ("selected_date", "selected_sport_type", "selected_time_range"):
            val = state.get(k)
            if val is not None:
                session_data[k] = val
        if any(state.get(k) is not None for k in ("selected_date", "selected_sport_type", "selected_time_range")):
            logger.info(
                f"Preserved booking context: date={state.get('selected_date')}, "
                f"sport={state.get('selected_sport_type')}, time={state.get('selected_time_range')}"
            )

        # Persist vendor_id, vendor_name and payment_amount ONLY during the
        # locked-slot / awaiting-payment window. These are required by
        # confirm_booking() after OCR verifies the payment screenshot.
        # They must NOT persist during general availability queries — that was
        # the original "Ace Padel bleeds into cricket" contamination bug.
        awaiting_payment = bool(state.get("awaiting_payment") or state.get("locked_slot_id"))
        if awaiting_payment:
            for k in ("vendor_id", "vendor_name", "payment_amount"):
                val = state.get(k)
                if val is not None:
                    session_data[k] = val
            logger.info(f"Persisted vendor/payment (awaiting payment): vendor_id={state.get('vendor_id')}, amount={state.get('payment_amount')}")

        session_data["_last_active"] = datetime.now()

        self._sessions[user_phone] = session_data
        logger.info(f"Saved session for {user_phone}: awaiting_confirmation={session_data.get('awaiting_confirmation')}")
    
    def clear_session(self, user_phone: str) -> None:
        """Clear session for a user (after booking completed or cancelled)"""
        if user_phone in self._sessions:
            del self._sessions[user_phone]
            logger.info(f"Cleared session for {user_phone}")


session_store = SessionStore()

