"""
WhatsApp Agent - Handles WhatsApp conversation flow
Member 1: WhatsApp Channel Lead

This agent manages the conversation state machine for WhatsApp interactions.
It processes incoming messages, maintains conversation context, and coordinates
with other agents (NLU, Booking) to provide responses.

Reference: WhatsAppCabBookingBot state management (lines 754-1012)
"""

from typing import Dict, Any, Optional
import logging
from agents.nlu_agent import NLUAgent
from agents.booking_agent import BookingAgent
from utils.state_manager import StateManager

logger = logging.getLogger(__name__)


class WhatsAppAgent:
    """WhatsApp conversation handler with state machine"""
    
    # Conversation states
    STATES = {
        'GREETING': 'greeting',
        'SELECT_SERVICE': 'select_service', 
        'SELECT_DATE': 'select_date',
        'SELECT_TIME': 'select_time',
        'CONFIRM_BOOKING': 'confirm_booking',
        'BOOKING_COMPLETE': 'booking_complete',
        'CANCELLED': 'cancelled'
    }
    
    def __init__(self):
        """Initialize WhatsApp agent with dependencies"""
        self.nlu_agent = NLUAgent()
        self.booking_agent = BookingAgent()
        self.state_manager = StateManager()
        
        logger.info("WhatsApp Agent initialized")
    
    async def process_message(self, phone_number: str, message: str) -> str:
        """
        Process incoming WhatsApp message through conversation state machine
        
        Args:
            phone_number: Customer's WhatsApp number
            message: Incoming message text
            
        Returns:
            Response message to send back
        """
        try:
            logger.info(f"Processing message from {phone_number}: {message}")
            
            # Get or create conversation session
            session = await self.state_manager.get_session(phone_number)
            
            # Extract intent and entities using NLU
            intent_data = await self.nlu_agent.extract_intent(message, session.get('history', []))
            logger.info(f"NLU extracted: {intent_data}")
            
            # Route based on current state and intent
            response = await self._route_conversation(session, intent_data, message)
            
            # Update session with new context
            await self.state_manager.update_session(phone_number, {
                'last_message': message,
                'last_response': response,
                'updated_at': session.get('updated_at')
            })
            
            logger.info(f"Response generated: {response[:100]}...")
            return response
            
        except Exception as e:
            logger.error(f"Error processing WhatsApp message: {e}")
            return "Sorry, I encountered an error. Please try again or contact support."
    
    async def _route_conversation(self, session: Dict[str, Any], intent_data: Dict[str, Any], message: str) -> str:
        """Route conversation based on current state and intent"""
        current_state = session.get('state', self.STATES['GREETING'])
        intent = intent_data.get('intent', 'other')
        
        logger.info(f"Routing: state={current_state}, intent={intent}")
        
        # State-based routing
        if current_state == self.STATES['GREETING']:
            return await self._handle_greeting(session, intent_data, message)
        elif current_state == self.STATES['SELECT_SERVICE']:
            return await self._handle_service_selection(session, intent_data, message)
        elif current_state == self.STATES['SELECT_DATE']:
            return await self._handle_date_selection(session, intent_data, message)
        elif current_state == self.STATES['SELECT_TIME']:
            return await self._handle_time_selection(session, intent_data, message)
        elif current_state == self.STATES['CONFIRM_BOOKING']:
            return await self._handle_booking_confirmation(session, intent_data, message)
        else:
            return await self._handle_default(session, intent_data, message)
    
    async def _handle_greeting(self, session: Dict[str, Any], intent_data: Dict[str, Any], message: str) -> str:
        """Handle greeting state"""
        if intent_data.get('intent') == 'greeting':
            # Update state to service selection
            await self.state_manager.update_session(session['phone_number'], {
                'state': self.STATES['SELECT_SERVICE']
            })
            return ("Hello! Welcome to BookForMe! 🎉\n\n"
                   "I can help you book:\n"
                   "• Futsal courts ⚽\n"
                   "• Salon appointments 💇‍♀️\n\n"
                   "What service would you like to book?")
        else:
            return "Hello! I'm your booking assistant. What service would you like to book today?"
    
    async def _handle_service_selection(self, session: Dict[str, Any], intent_data: Dict[str, Any], message: str) -> str:
        """Handle service type selection"""
        service_type = intent_data.get('entities', {}).get('service_type')
        
        if service_type in ['futsal', 'salon']:
            # Update session with selected service
            await self.state_manager.update_session(session['phone_number'], {
                'state': self.STATES['SELECT_DATE'],
                'selected_service': service_type
            })
            return f"Great! You want to book {service_type}. What date would you like? (e.g., tomorrow, next Friday, 15th January)"
        else:
            return ("I can help you book:\n"
                   "• Futsal courts ⚽\n"
                   "• Salon appointments 💇‍♀️\n\n"
                   "Please choose one of these services.")
    
    async def _handle_date_selection(self, session: Dict[str, Any], intent_data: Dict[str, Any], message: str) -> str:
        """Handle date selection"""
        date = intent_data.get('entities', {}).get('date')
        
        if date:
            # Update session with selected date
            await self.state_manager.update_session(session['phone_number'], {
                'state': self.STATES['SELECT_TIME'],
                'selected_date': date
            })
            return f"Perfect! You selected {date}. What time would you prefer? (e.g., 5pm, 2:30pm, evening)"
        else:
            return "Please specify a date. You can say 'tomorrow', 'next Friday', or give a specific date like '15th January'."
    
    async def _handle_time_selection(self, session: Dict[str, Any], intent_data: Dict[str, Any], message: str) -> str:
        """Handle time selection"""
        time = intent_data.get('entities', {}).get('time')
        
        if time:
            # Check availability and proceed to confirmation
            service = session.get('selected_service')
            date = session.get('selected_date')
            
            # TODO: Check actual availability using availability service
            # For now, assume slot is available
            await self.state_manager.update_session(session['phone_number'], {
                'state': self.STATES['CONFIRM_BOOKING'],
                'selected_time': time
            })
            
            return (f"Excellent! Here's your booking summary:\n\n"
                   f"Service: {service}\n"
                   f"Date: {date}\n"
                   f"Time: {time}\n\n"
                   f"Please confirm by typing 'yes' or 'confirm'")
        else:
            return "Please specify a time. You can say '5pm', '2:30pm', 'evening', etc."
    
    async def _handle_booking_confirmation(self, session: Dict[str, Any], intent_data: Dict[str, Any], message: str) -> str:
        """Handle booking confirmation"""
        if intent_data.get('intent') == 'confirm_booking':
            # Create the booking
            booking_result = await self.booking_agent.create_booking({
                'customer_phone': session['phone_number'],
                'service': session.get('selected_service'),
                'date': session.get('selected_date'),
                'time': session.get('selected_time'),
                'source': 'whatsapp'
            })
            
            if booking_result['success']:
                await self.state_manager.update_session(session['phone_number'], {
                    'state': self.STATES['BOOKING_COMPLETE']
                })
                return (f"🎉 Booking confirmed!\n\n"
                       f"Booking ID: {booking_result['booking_id']}\n"
                       f"Service: {session.get('selected_service')}\n"
                       f"Date: {session.get('selected_date')}\n"
                       f"Time: {session.get('selected_time')}\n\n"
                       f"Thank you for using BookForMe!")
            else:
                return f"Sorry, I couldn't complete your booking: {booking_result['error']}"
        else:
            return "Please confirm your booking by typing 'yes' or 'confirm'"
    
    async def _handle_default(self, session: Dict[str, Any], intent_data: Dict[str, Any], message: str) -> str:
        """Handle default/unknown state"""
        return ("I'm not sure what you mean. Please try:\n"
                "• 'book futsal' or 'book salon'\n"
                "• 'check availability'\n"
                "• 'cancel booking'\n\n"
                "Or start over by saying 'hello'")
