"""
WhatsApp Agent - LangGraph-based conversation agent for WhatsApp booking flow
Uses LangGraph for stateful agent workflow with tool calling
"""

import logging
from typing import Dict, Any, Optional
from app.config import settings

# Import LangGraph agent
from agent.graph import BookingAgent
from nlu.state_manager import StateManager

logger = logging.getLogger(__name__)


class WhatsAppAgent:
    """WhatsApp conversation agent using LangGraph"""
    
    def __init__(self):
        """Initialize WhatsApp agent with LangGraph"""
        # Initialize LangGraph agent
        self.booking_agent = BookingAgent()
        self.state_manager = StateManager()
        
        logger.info("WhatsApp Agent initialized with LangGraph")
    
    async def process_message(self, phone_number: str, message: str) -> str:
        """
        Process incoming WhatsApp message using LangGraph agent
        
        Args:
            phone_number: Customer's phone number
            message: Incoming message text
            
        Returns:
            Response message to send back
        """
        try:
            logger.info(f"Processing message from {phone_number}: {message}")
            
            # Get conversation history from Firestore
            session = await self.state_manager.get_session(phone_number)
            history = session.get('history', [])
            
            # Convert history to format expected by LangGraph
            conversation_history = []
            for msg in history:
                conversation_history.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })
            
            # Process message through LangGraph agent
            response = await self.booking_agent.process(
                user_phone=phone_number,
                message=message,
                conversation_history=conversation_history
            )
            
            # Update conversation state in Firestore
            await self.state_manager.add_message_to_history(phone_number, 'user', message)
            await self.state_manager.add_message_to_history(phone_number, 'assistant', response)
            
            logger.info(f"Generated response: {response[:100]}...")
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "Sorry, I encountered an error. Please try again later."
