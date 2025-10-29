"""
WhatsApp Agent - Conversation state machine for WhatsApp booking flow
Handles the complete WhatsApp conversation flow:
1. Greeting → Service Selection → Date → Time → Confirmation → Booking
2. Uses Firestore for state management
3. Integrates with NLU agent and availability service
"""

import logging
from typing import Dict, Any, Optional
from app.config import settings

# Import implemented modules
from nlu.agent import NLUAgent
from database.availability_service import AvailabilityService
from nlu.state_manager import StateManager

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
        # Initialize services
        self.nlu_agent = NLUAgent()
        self.availability_service = AvailabilityService()
        self.state_manager = StateManager()
        
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
            
            # Get conversation state from Firestore
            session = await self.state_manager.get_session(phone_number)
            current_state = session.get('state', 'greeting')
            
            # Extract intent and entities using NLU
            nlu_result = await self.nlu_agent.extract_intent(message, session.get('history', []))
            intent = nlu_result.get('intent', 'unknown')
            
            # Check if user is starting a new conversation (greeting after being in other states)
            if intent == 'greeting' and current_state != 'greeting':
                logger.info(f"User {phone_number} starting new conversation, resetting to greeting state")
                # Reset to greeting state for new conversation
                await self.state_manager.update_session(phone_number, {
                    'state': 'greeting',
                    'context': {}
                })
                current_state = 'greeting'
            
            # Check for conversation timeout (reset if last message was > 1 hour ago)
            history = session.get('history', [])
            if history:
                from datetime import datetime, timedelta
                last_message_time = datetime.fromisoformat(history[-1].get('timestamp', ''))
                if datetime.now() - last_message_time > timedelta(hours=1):
                    logger.info(f"Conversation timeout for {phone_number}, resetting to greeting")
                    await self.state_manager.update_session(phone_number, {
                        'state': 'greeting',
                        'context': {}
                    })
                    current_state = 'greeting'
            
            # Process based on current state
            response = await self._handle_state(current_state, phone_number, message, nlu_result)
            
            # Update conversation state
            await self.state_manager.add_message_to_history(phone_number, 'user', message)
            await self.state_manager.add_message_to_history(phone_number, 'assistant', response)
            
            logger.info(f"Generated response: {response}")
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return "Sorry, I encountered an error. Please try again later."
    
    async def _handle_state(self, current_state: str, phone_number: str, message: str, nlu_result: Dict[str, Any]) -> str:
        """Handle message based on current conversation state"""
        try:
            intent = nlu_result.get('intent', 'unknown')
            entities = nlu_result.get('entities', {})
            
            if current_state == 'greeting':
                return await self._handle_greeting_state(phone_number, message)
            elif current_state == 'select_service':
                return await self._handle_service_selection(phone_number, message, intent, entities)
            elif current_state == 'select_date':
                return await self._handle_date_selection(phone_number, message, intent, entities)
            elif current_state == 'select_time':
                return await self._handle_time_selection(phone_number, message, intent, entities)
            elif current_state == 'confirm_booking':
                return await self._handle_booking_confirmation(phone_number, message, intent, entities)
            elif current_state == 'booking_complete':
                return await self._handle_booking_complete(phone_number, message, intent, entities)
            else:
                return await self._handle_greeting_state(phone_number, message)
                
        except Exception as e:
            logger.error(f"Error handling state {current_state}: {e}")
            return "I'm sorry, I didn't understand that. Could you please try again?"
    
    async def _handle_greeting_state(self, phone_number: str, message: str) -> str:
        """Handle greeting state"""
        # Use NLU to generate response instead of hardcoded responses
        try:
            # Get conversation history
            session = await self.state_manager.get_session(phone_number)
            history = session.get('history', [])
            
            # Extract intent and entities first
            nlu_result = await self.nlu_agent.extract_intent(message, history)
            intent = nlu_result.get('intent', 'greeting')
            entities = nlu_result.get('entities', {})
            
            # Use NLU to generate appropriate response
            response = await self.nlu_agent.generate_response(
                intent,
                entities,
                {'state': 'greeting', 'phone_number': phone_number}
            )
            
            # Check if they want to book something
            if intent == 'booking_request' or entities.get('service_type'):
                # Update state to service selection
                await self.state_manager.update_session(phone_number, {
                    'state': 'select_service',
                    'context': {'service_type': entities.get('service_type', '')}
                })
                
                if "service" in response.lower() or "book" in response.lower():
                    return response
                else:
                    service_type = entities.get('service_type', 'service')
                    return f"Great! You want to book {service_type}. What date would you like to book for?"
            else:
                # If NLU response is generic, provide specific booking options
                if "book" in response.lower() or "service" in response.lower():
                    return response
                else:
                    return f"{response}\n\nI can help you book:\n• ⚽ Futsal courts\n• 💇 Salon appointments\n• 🏃‍♂️ Gym sessions\n\nWhat would you like to book today?"
                
        except Exception as e:
            logger.error(f"Error in greeting state: {e}")
            return """Hello! I'm your BookForMe assistant. 

I can help you book:
• ⚽ Futsal courts
• 💇 Salon appointments
• 🏃‍♂️ Gym sessions

What would you like to book today?"""
    
    async def _handle_service_selection(self, phone_number: str, message: str, intent: str, entities: Dict[str, Any]) -> str:
        """Handle service selection state"""
        try:
            # Use NLU to generate response based on intent and entities
            response = await self.nlu_agent.generate_response(
                intent,
                entities,
                {'state': 'select_service', 'phone_number': phone_number}
            )
            
            # Check if service type was mentioned
            service_type = entities.get('service_type', '').lower()
            
            if service_type in ['futsal', 'salon', 'gym']:
                # Update state to date selection
                await self.state_manager.update_session(phone_number, {
                    'state': 'select_date',
                    'context': {'service_type': service_type}
                })
                
                # Use NLU response if it's good, otherwise provide specific response
                if "date" in response.lower() or "when" in response.lower():
                    return response
                else:
                    return f"Great! You want to book {service_type}. What date would you like to book for?"
            else:
                # Show available services
                services = await self._get_available_services()
                return await self._format_service_options(services)
                
        except Exception as e:
            logger.error(f"Error in service selection: {e}")
            return "I'm sorry, I didn't understand. What service would you like to book?"
    
    async def _handle_date_selection(self, phone_number: str, message: str, intent: str, entities: Dict[str, Any]) -> str:
        """Handle date selection state"""
        try:
            # Use NLU to generate response based on intent and entities
            response = await self.nlu_agent.generate_response(
                intent,
                entities,
                {'state': 'select_date', 'phone_number': phone_number}
            )
            
            # Check if date was mentioned
            date_mentioned = entities.get('date') or any(word in message.lower() for word in ['tomorrow', 'today', 'friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'])
            
            if date_mentioned:
                # Update state to time selection
                current_session = await self.state_manager.get_session(phone_number)
                await self.state_manager.update_session(phone_number, {
                    'state': 'select_time',
                    'context': {**current_session.get('context', {}), 'date': entities.get('date', message)}
                })
                
                if "time" in response.lower() or "when" in response.lower():
                    return response
                else:
                    return f"Great! You mentioned {entities.get('date', message)}. What time would you like to book?"
            else:
                return "What date would you like to book for? Please mention a specific date like 'tomorrow', 'Friday', or 'next week'."
                
        except Exception as e:
            logger.error(f"Error in date selection: {e}")
            return "What date would you like to book for?"
    
    async def _handle_time_selection(self, phone_number: str, message: str, intent: str, entities: Dict[str, Any]) -> str:
        """Handle time selection state"""
        try:
            # Use NLU to generate response based on intent and entities
            response = await self.nlu_agent.generate_response(
                intent,
                entities,
                {'state': 'select_time', 'phone_number': phone_number}
            )
            
            # Check if time was mentioned
            time_mentioned = entities.get('time') or any(word in message.lower() for word in ['morning', 'afternoon', 'evening', 'night', 'am', 'pm', 'o\'clock'])
            
            if time_mentioned:
                # Update state to booking confirmation
                current_session = await self.state_manager.get_session(phone_number)
                await self.state_manager.update_session(phone_number, {
                    'state': 'confirm_booking',
                    'context': {**current_session.get('context', {}), 'time': entities.get('time', message)}
                })
                
                # Get booking summary
                session = await self.state_manager.get_session(phone_number)
                context = session.get('context', {})
                service_type = context.get('service_type', 'service')
                date = context.get('date', 'selected date')
                time = entities.get('time', message)
                
                if "confirm" in response.lower() or "booking" in response.lower():
                    return response
                else:
                    return f"Perfect! You want to book {service_type} for {date} at {time}. Should I confirm this booking?"
            else:
                return "What time would you like to book? Please mention a specific time like '5pm', 'evening', or 'morning'."
                
        except Exception as e:
            logger.error(f"Error in time selection: {e}")
            return "What time would you like to book?"
    
    async def _handle_booking_confirmation(self, phone_number: str, message: str, intent: str, entities: Dict[str, Any]) -> str:
        """Handle booking confirmation state"""
        try:
            # Use NLU to generate response based on intent and entities
            response = await self.nlu_agent.generate_response(
                intent,
                entities,
                {'state': 'confirm_booking', 'phone_number': phone_number}
            )
            
            # Check if user confirmed
            confirmed = intent == 'confirmation' or any(word in message.lower() for word in ['yes', 'confirm', 'book', 'done', 'ok', 'sure'])
            
            if confirmed:
                # Update state to booking complete
                current_session = await self.state_manager.get_session(phone_number)
                await self.state_manager.update_session(phone_number, {
                    'state': 'booking_complete',
                    'context': {**current_session.get('context', {}), 'confirmed': True}
                })
                
                # Get booking summary
                session = await self.state_manager.get_session(phone_number)
                context = session.get('context', {})
                service_type = context.get('service_type', 'service')
                date = context.get('date', 'selected date')
                time = context.get('time', 'selected time')
                
                if "thank" in response.lower() or "confirmed" in response.lower():
                    return response
                else:
                    return f"🎉 Booking confirmed! You have {service_type} booked for {date} at {time}. Thank you for using BookForMe!"
            else:
                return "Would you like me to confirm this booking? Please say 'yes' or 'confirm' to proceed."
                
        except Exception as e:
            logger.error(f"Error in booking confirmation: {e}")
            return "Would you like me to confirm this booking?"
    
    async def _handle_booking_complete(self, phone_number: str, message: str, intent: str, entities: Dict[str, Any]) -> str:
        """Handle booking complete state"""
        try:
            # Use NLU to generate response based on intent and entities
            response = await self.nlu_agent.generate_response(
                intent,
                entities,
                {'state': 'booking_complete', 'phone_number': phone_number}
            )
            
            # Check if user wants to book something else
            if intent == 'booking_request' or any(word in message.lower() for word in ['book', 'another', 'more', 'again']):
                # Reset to greeting state for new booking
                await self.state_manager.update_session(phone_number, {
                    'state': 'greeting',
                    'context': {}
                })
                
                if "book" in response.lower() or "service" in response.lower():
                    return response
                else:
                    return "Great! I can help you with another booking. What service would you like to book?"
            else:
                if "help" in response.lower() or "assist" in response.lower():
                    return response
                else:
                    return "Is there anything else I can help you with? You can book another service anytime!"
                
        except Exception as e:
            logger.error(f"Error in booking complete: {e}")
            return "Is there anything else I can help you with?"
    
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
