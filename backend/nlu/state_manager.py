"""
State Manager - Firestore-based conversation state management
Handles conversation state for WhatsApp interactions
"""

import logging
import asyncio
import time
from typing import Dict, List, Any, Optional
from app.firestore import firestore_db

logger = logging.getLogger(__name__)

_CHAT_SESSION_CACHE: Dict[str, tuple] = {}
_CHAT_SESSION_CACHE_TTL = 300
_CHAT_SESSION_READ_TIMEOUT = 0.25


class StateManager:
    """Conversation state manager using Firestore"""
    
    def __init__(self):
        """Initialize state manager"""
        self.db = firestore_db
        logger.info("State Manager initialized with Firestore")
    
    async def get_session(self, phone_number: str) -> Dict[str, Any]:
        """
        Get conversation session for phone number
        
        Args:
            phone_number: Customer's phone number
            
        Returns:
            Session data with state, context, and history
        """
        try:
            logger.info(f"Getting session for {phone_number}")
            
            session = await self.db.get_conversation_state(phone_number)
            
            # Ensure required fields exist
            if 'state' not in session:
                session['state'] = 'greeting'
            if 'context' not in session:
                session['context'] = {}
            if 'history' not in session:
                session['history'] = []
            
            logger.info(f"Session state: {session.get('state', 'unknown')}")
            return session
            
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return {
                'phone_number': phone_number,
                'state': 'greeting',
                'context': {},
                'history': []
            }

    async def get_session_fast(self, phone_number: str) -> Dict[str, Any]:
        """
        Fast path for text chat turns.

        Conversation history improves wording, but it is not required for the
        booking transaction state. Avoid letting a slow Firestore history read
        delay the user's WhatsApp response.
        """
        now = time.time()
        cached = _CHAT_SESSION_CACHE.get(phone_number)
        if cached and now - cached[1] < _CHAT_SESSION_CACHE_TTL:
            return cached[0]

        try:
            doc_ref = self.db.db.collection('conversation_states').document(phone_number)
            doc = await asyncio.wait_for(
                asyncio.to_thread(doc_ref.get),
                timeout=_CHAT_SESSION_READ_TIMEOUT,
            )
            if doc.exists:
                session = doc.to_dict()
            else:
                session = {
                    'phone_number': phone_number,
                    'state': 'greeting',
                    'context': {},
                    'history': []
                }
        except Exception as e:
            logger.warning(f"Fast session read skipped for {phone_number}: {e}")
            session = {
                'phone_number': phone_number,
                'state': 'greeting',
                'context': {},
                'history': []
            }

        if 'state' not in session:
            session['state'] = 'greeting'
        if 'context' not in session:
            session['context'] = {}
        if 'history' not in session:
            session['history'] = []

        _CHAT_SESSION_CACHE[phone_number] = (session, now)
        return session
    
    async def update_session(self, phone_number: str, data: Dict[str, Any]) -> bool:
        """
        Update conversation session
        
        Args:
            phone_number: Customer's phone number
            data: Data to update (state, context, history, etc.)
            
        Returns:
            Success status
        """
        try:
            logger.info(f"Updating session for {phone_number}")
            
            # Get current session
            current_session = await self.get_session(phone_number)
            
            # Merge new data with current session
            updated_session = {**current_session, **data}
            updated_session['phone_number'] = phone_number
            
            # Update in Firestore
            success = await self.db.update_conversation_state(phone_number, updated_session)
            
            if success:
                logger.info(f"Session updated successfully: {data}")
            else:
                logger.error("Failed to update session")
            
            return success
            
        except Exception as e:
            logger.error(f"Error updating session: {e}")
            return False
    
    async def add_message_to_history(self, phone_number: str, role: str, content: str) -> bool:
        """
        Add message to conversation history
        
        Args:
            phone_number: Customer's phone number
            role: 'user' or 'assistant'
            content: Message content
            
        Returns:
            Success status
        """
        try:
            # Get current session
            session = await self.get_session(phone_number)
            history = session.get('history', [])
            
            # Add new message
            history.append({
                'role': role,
                'content': content,
                'timestamp': self._get_timestamp()
            })
            
            # Keep only last 10 messages to avoid large documents
            if len(history) > 10:
                history = history[-10:]
            
            # Update session
            return await self.update_session(phone_number, {'history': history})
            
        except Exception as e:
            logger.error(f"Error adding message to history: {e}")
            return False

    async def save_history_direct(self, phone_number: str, history: List[Dict[str, Any]]) -> bool:
        """Persist a prepared history list in one Firestore write."""
        try:
            trimmed = history[-10:] if len(history) > 10 else history
            payload = {
                'phone_number': phone_number,
                'history': trimmed,
            }
            doc_ref = self.db.db.collection('conversation_states').document(phone_number)
            await asyncio.to_thread(doc_ref.set, payload, merge=True)
            cached = _CHAT_SESSION_CACHE.get(phone_number)
            session = dict(cached[0]) if cached else {
                'phone_number': phone_number,
                'state': 'greeting',
                'context': {},
            }
            session['history'] = trimmed
            _CHAT_SESSION_CACHE[phone_number] = (session, time.time())
            logger.info(f"Saved conversation history for {phone_number} in one write")
            return True
        except Exception as e:
            logger.error(f"Error saving direct history: {e}")
            return False

    async def merge_booking_context_direct(
        self,
        phone_number: str,
        booking_data: Dict[str, Any],
        existing_context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Merge booking context without extra Firestore reads."""
        try:
            context = dict(existing_context or {})
            context.update(booking_data)
            payload = {
                'phone_number': phone_number,
                'context': context,
            }
            doc_ref = self.db.db.collection('conversation_states').document(phone_number)
            await asyncio.to_thread(doc_ref.set, payload, merge=True)
            cached = _CHAT_SESSION_CACHE.get(phone_number)
            session = dict(cached[0]) if cached else {
                'phone_number': phone_number,
                'state': 'greeting',
                'history': [],
            }
            session['context'] = context
            _CHAT_SESSION_CACHE[phone_number] = (session, time.time())
            logger.info(f"Saved booking context for {phone_number} in one write")
            return True
        except Exception as e:
            logger.error(f"Error saving direct booking context: {e}")
            return False
    
    async def clear_session(self, phone_number: str) -> bool:
        """
        Clear conversation session (start fresh)
        
        Args:
            phone_number: Customer's phone number
            
        Returns:
            Success status
        """
        try:
            logger.info(f"Clearing session for {phone_number}")
            _CHAT_SESSION_CACHE.pop(phone_number, None)
            
            return await self.update_session(phone_number, {
                'state': 'greeting',
                'context': {},
                'history': []
            })
            
        except Exception as e:
            logger.error(f"Error clearing session: {e}")
            return False
    
    async def set_booking_context(self, phone_number: str, booking_data: Dict[str, Any]) -> bool:
        """
        Set booking context in session
        
        Args:
            phone_number: Customer's phone number
            booking_data: Booking information (service, date, time, etc.)
            
        Returns:
            Success status
        """
        try:
            session = await self.get_session(phone_number)
            context = session.get('context', {})
            
            # Update context with booking data
            context.update(booking_data)
            
            return await self.update_session(phone_number, {'context': context})
            
        except Exception as e:
            logger.error(f"Error setting booking context: {e}")
            return False
    
    async def get_booking_context(self, phone_number: str) -> Dict[str, Any]:
        """
        Get booking context from session
        
        Args:
            phone_number: Customer's phone number
            
        Returns:
            Booking context data
        """
        try:
            session = await self.get_session(phone_number)
            return session.get('context', {})
            
        except Exception as e:
            logger.error(f"Error getting booking context: {e}")
            return {}
    
    def _get_timestamp(self) -> str:
        """Get current timestamp as string"""
        from datetime import datetime
        return datetime.now().isoformat()
