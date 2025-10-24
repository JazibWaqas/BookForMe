"""
State Manager - Firestore-based conversation state management
Handles conversation state for WhatsApp interactions
"""

import logging
from typing import Dict, List, Any, Optional
from app.firestore import firestore_db

logger = logging.getLogger(__name__)


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
