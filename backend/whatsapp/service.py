"""
WhatsApp Service - Twilio integration for message sending
Handles WhatsApp message sending via Twilio API
"""

import logging
from typing import Dict, Any, Optional
from twilio.rest import Client
from app.config import settings

logger = logging.getLogger(__name__)


class WhatsAppService:
    """WhatsApp service for sending messages via Twilio"""
    
    def __init__(self):
        """Initialize WhatsApp service with Twilio client"""
        try:
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
            logger.info("WhatsApp Service initialized with Twilio")
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {e}")
            raise
    
    async def send_message(self, to_phone: str, message: str) -> Dict[str, Any]:
        """
        Send WhatsApp message via Twilio
        
        Args:
            to_phone: Recipient phone number
            message: Message text to send
            
        Returns:
            Dict with send result
        """
        try:
            logger.info(f"Sending WhatsApp message to {to_phone}")
            
            # Send message via Twilio
            message_obj = self.client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=f"whatsapp:{to_phone}"
            )
            
            result = {
                'success': True,
                'message_sid': message_obj.sid,
                'status': message_obj.status,
                'to': to_phone
            }
            
            logger.info(f"Message sent successfully: {message_obj.sid}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return {
                'success': False,
                'error': str(e),
                'to': to_phone
            }
    
    async def send_booking_confirmation(self, phone: str, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send booking confirmation message
        
        Args:
            phone: Customer phone number
            booking_data: Booking information
            
        Returns:
            Send result
        """
        try:
            message = f"""
🎉 *Booking Confirmed!*

Booking ID: {booking_data.get('booking_id', 'N/A')}
Service: {booking_data.get('service', 'N/A')}
Date: {booking_data.get('date', 'N/A')}
Time: {booking_data.get('time', 'N/A')}
Customer: {booking_data.get('customer_name', 'N/A')}

Thank you for using BookForMe!
            """.strip()
            
            return await self.send_message(phone, message)
            
        except Exception as e:
            logger.error(f"Failed to send booking confirmation: {e}")
            return {'success': False, 'error': str(e)}
    
    async def send_availability_message(self, phone: str, available_slots: list) -> Dict[str, Any]:
        """
        Send availability message
        
        Args:
            phone: Customer phone number
            available_slots: List of available slots
            
        Returns:
            Send result
        """
        try:
            if not available_slots:
                message = "Sorry, no slots are available for the selected date. Please try another date."
            else:
                message = "📅 *Available Time Slots:*\n\n"
                for i, slot in enumerate(available_slots[:5], 1):  # Show max 5 slots
                    message += f"{i}. {slot.get('time', 'N/A')} - Rs. {slot.get('price', 'N/A')}\n"
                message += "\nPlease select a time by typing the number or time."
            
            return await self.send_message(phone, message)
            
        except Exception as e:
            logger.error(f"Failed to send availability message: {e}")
            return {'success': False, 'error': str(e)}
    
    async def send_error_message(self, phone: str, error_type: str = "general") -> Dict[str, Any]:
        """
        Send error message to customer
        
        Args:
            phone: Customer phone number
            error_type: Type of error
            
        Returns:
            Send result
        """
        try:
            if error_type == "booking_failed":
                message = "Sorry, I couldn't process your booking. Please try again or contact support."
            elif error_type == "slot_unavailable":
                message = "Sorry, that time slot is no longer available. Please select another time."
            else:
                message = "Sorry, I encountered an error. Please try again later."
            
            return await self.send_message(phone, message)
            
        except Exception as e:
            logger.error(f"Failed to send error message: {e}")
            return {'success': False, 'error': str(e)}
