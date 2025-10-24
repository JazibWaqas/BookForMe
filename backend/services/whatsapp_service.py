"""
WhatsApp Service - Twilio integration for WhatsApp messaging
Member 1: WhatsApp Channel Lead

This service handles sending and receiving WhatsApp messages via Twilio.
It provides the interface for the WhatsApp agent to send responses
and handles Twilio webhook formatting.

Reference: FlightChatbot Twilio integration pattern
"""

import logging
from typing import Dict, Any, Optional
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from app.config import settings

logger = logging.getLogger(__name__)


class WhatsAppService:
    """WhatsApp messaging service using Twilio"""
    
    def __init__(self):
        """Initialize Twilio client"""
        try:
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
            self.phone_number = settings.TWILIO_PHONE_NUMBER
            logger.info("WhatsApp Service initialized with Twilio")
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {e}")
            raise
    
    async def send_message(self, to_phone: str, message: str) -> Dict[str, Any]:
        """
        Send WhatsApp message to customer
        
        Args:
            to_phone: Customer's phone number (with country code)
            message: Message text to send
            
        Returns:
            Dict with send status and message SID
        """
        try:
            logger.info(f"Sending WhatsApp message to {to_phone}")
            
            # Format phone number for WhatsApp
            formatted_phone = self._format_phone_number(to_phone)
            
            # Send message via Twilio
            message_obj = self.client.messages.create(
                body=message,
                from_=self.phone_number,
                to=f"whatsapp:{formatted_phone}"
            )
            
            logger.info(f"Message sent successfully: {message_obj.sid}")
            return {
                'success': True,
                'message_sid': message_obj.sid,
                'status': message_obj.status
            }
            
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_twilio_response(self, message: str) -> str:
        """
        Create TwiML response for Twilio webhook
        
        Args:
            message: Response message to send back
            
        Returns:
            TwiML XML string
        """
        try:
            response = MessagingResponse()
            response.message(message)
            return str(response)
        except Exception as e:
            logger.error(f"Failed to create TwiML response: {e}")
            # Return basic TwiML on error
            return f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{message}</Message></Response>'
    
    def _format_phone_number(self, phone: str) -> str:
        """
        Format phone number for WhatsApp
        
        Args:
            phone: Raw phone number
            
        Returns:
            Formatted phone number
        """
        # Remove any non-digit characters
        digits = ''.join(filter(str.isdigit, phone))
        
        # Add country code if missing (assume Pakistan +92)
        if not digits.startswith('92') and len(digits) == 10:
            digits = '92' + digits
        elif not digits.startswith('92') and len(digits) == 11 and digits.startswith('0'):
            digits = '92' + digits[1:]
        
        return f"+{digits}"
    
    async def send_booking_confirmation(self, customer_phone: str, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send booking confirmation message
        
        Args:
            customer_phone: Customer's phone number
            booking_details: Booking information
            
        Returns:
            Send status
        """
        try:
            message = self._format_booking_confirmation_message(booking_details)
            return await self.send_message(customer_phone, message)
        except Exception as e:
            logger.error(f"Failed to send booking confirmation: {e}")
            return {'success': False, 'error': str(e)}
    
    def _format_booking_confirmation_message(self, booking_details: Dict[str, Any]) -> str:
        """Format booking confirmation message"""
        return f"""
🎉 *Booking Confirmed!*

Booking ID: {booking_details.get('booking_id', 'N/A')}
Service: {booking_details.get('service', 'N/A')}
Date: {booking_details.get('date', 'N/A')}
Time: {booking_details.get('time', 'N/A')}

Thank you for using BookForMe! 

For any queries, contact us at +92-XXX-XXXXXXX
        """.strip()
    
    async def send_availability_message(self, customer_phone: str, available_slots: list) -> Dict[str, Any]:
        """
        Send available time slots to customer
        
        Args:
            customer_phone: Customer's phone number
            available_slots: List of available slots
            
        Returns:
            Send status
        """
        try:
            message = self._format_availability_message(available_slots)
            return await self.send_message(customer_phone, message)
        except Exception as e:
            logger.error(f"Failed to send availability message: {e}")
            return {'success': False, 'error': str(e)}
    
    def _format_availability_message(self, available_slots: list) -> str:
        """Format availability message"""
        if not available_slots:
            return "Sorry, no slots are available for the selected date. Please try another date."
        
        message = "📅 *Available Time Slots:*\n\n"
        for i, slot in enumerate(available_slots[:5], 1):  # Show max 5 slots
            message += f"{i}. {slot.get('time', 'N/A')} - Rs. {slot.get('price', 'N/A')}\n"
        
        message += "\nPlease select a time by typing the number or time."
        return message
