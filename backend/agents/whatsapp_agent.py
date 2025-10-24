"""
WhatsApp Agent - Conversation state machine for WhatsApp booking flow
Member 1: WhatsApp Channel Lead

This agent handles the complete WhatsApp conversation flow:
1. Greeting → Service Selection → Date → Time → Confirmation → Booking
2. Uses Firestore for state management (no Redis needed)
3. Integrates with NLU agent and availability service
"""

import logging
from typing import Dict, Any, Optional
from app.config import settings

# TODO: Import when implemented
# from agents.nlu_agent import NLUAgent
# from services.availability_service import AvailabilityService
# from utils.state_manager import StateManager
# from utils.helpers import format_booking_confirmation, format_availability_message

logger = logging.getLogger(__name__)


class WhatsAppAgent:
    """WhatsApp conversation agent with state machine"""
    
    # Conversation states
    STATES = {
        'GREETING': 'greeting',
        'SELECT_SERVICE': 'select_service',
        'SELECT_DATE': 'select_date', 
        'SELECT_TIME': 'select_time',
        'CONFIRM_BOOKING': 'confirm_booking',
        'BOOKING_COMPLETE': 'booking_complete'
    }
    
    def __init__(self):
        """Initialize WhatsApp agent"""
        # TODO: Initialize services when implemented
        # self.nlu_agent = NLUAgent()
        # self.availability_service = AvailabilityService()
        # self.state_manager = StateManager()
        
        logger.info("WhatsApp Agent initialized")
    
    async def process_message(self, phone_number: str, message: str) -> str:
        """
        Process incoming WhatsApp message and return response
        
        Args:
            phone_number: Customer's phone number
            message: Incoming message text
            
        Returns:
            Response message to send back
        """
        try:
            logger.info(f"Processing message from {phone_number}: {message}")
            
            # TODO: Get conversation state from Firestore
            # session = await self.state_manager.get_session(phone_number)
            # current_state = session.get('state', 'greeting')
            
            # TODO: Extract intent and entities using NLU
            # nlu_result = await self.nlu_agent.extract_intent(message, session.get('history', []))
            
            # TODO: Process based on current state
            # response = await self._handle_state(current_state, phone_number, message, nlu_result)
            
            # TODO: Update conversation state
            # await self.state_manager.add_message_to_history(phone_number, 'user', message)
            # await self.state_manager.add_message_to_history(phone_number, 'assistant', response)
            
            # Temporary response for testing
            response = await self._handle_greeting_state(phone_number, message)
            
            logger.info(f"Generated response: {response}")
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return "Sorry, I encountered an error. Please try again later."
    
    async def _handle_greeting_state(self, phone_number: str, message: str) -> str:
        """Handle greeting state"""
        message_lower = message.lower()
        
        # Check if it's a greeting
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'salam', 'assalam']):
            return """🎉 *Welcome to BookForMe!*

I can help you book:
• ⚽ Futsal courts
• 💇 Salon appointments  
• 🏃‍♂️ Gym sessions

What would you like to book today?"""
        
        # Check if they want to book something
        if any(word in message_lower for word in ['book', 'booking', 'slot', 'time', 'futsal', 'salon']):
            return """Great! What service would you like to book?

1. ⚽ Futsal Court
2. 💇 Salon Service
3. 🏃‍♂️ Gym Session

Please select a number or tell me the service name."""
        
        # Default response
        return """Hello! I'm your BookForMe assistant. 

I can help you book:
• ⚽ Futsal courts
• 💇 Salon appointments
• 🏃‍♂️ Gym sessions

What would you like to book today?"""
    
    async def _handle_service_selection(self, phone_number: str, message: str) -> str:
        """Handle service selection state"""
        # TODO: Implement service selection logic
        return "Service selection logic not yet implemented"
    
    async def _handle_date_selection(self, phone_number: str, message: str) -> str:
        """Handle date selection state"""
        # TODO: Implement date selection logic
        return "Date selection logic not yet implemented"
    
    async def _handle_time_selection(self, phone_number: str, message: str) -> str:
        """Handle time selection state"""
        # TODO: Implement time selection logic
        return "Time selection logic not yet implemented"
    
    async def _handle_booking_confirmation(self, phone_number: str, message: str) -> str:
        """Handle booking confirmation state"""
        # TODO: Implement booking confirmation logic
        return "Booking confirmation logic not yet implemented"
    
    async def _handle_booking_complete(self, phone_number: str, message: str) -> str:
        """Handle booking complete state"""
        # TODO: Implement booking complete logic
        return "Booking complete logic not yet implemented"
    
    async def _get_available_services(self) -> list:
        """Get list of available services"""
        # TODO: Query services from Firestore
        return [
            {"id": "futsal", "name": "Futsal Court", "icon": "⚽"},
            {"id": "salon", "name": "Salon Service", "icon": "💇"},
            {"id": "gym", "name": "Gym Session", "icon": "🏃‍♂️"}
        ]
    
    async def _get_available_vendors(self, service_type: str) -> list:
        """Get vendors for a service type"""
        # TODO: Query vendors from Firestore
        return [
            {
                "id": "vendor1",
                "name": "Karachi Futsal Arena",
                "address": "DHA Phase 5",
                "price_range": "Rs. 2000-3000"
            }
        ]
    
    async def _format_service_options(self, services: list) -> str:
        """Format service options for display"""
        message = "📋 *Available Services:*\n\n"
        for i, service in enumerate(services, 1):
            message += f"{i}. {service['icon']} {service['name']}\n"
        message += "\nPlease select a number or tell me the service name."
        return message
    
    async def _format_vendor_options(self, vendors: list) -> str:
        """Format vendor options for display"""
        message = "🏢 *Available Vendors:*\n\n"
        for i, vendor in enumerate(vendors, 1):
            message += f"{i}. {vendor['name']}\n   📍 {vendor['address']}\n   💰 {vendor['price_range']}\n\n"
        message += "Please select a vendor by number or name."
        return message