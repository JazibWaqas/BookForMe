"""
WhatsApp Service - Meta Business API integration
Handles message sending and media download via Meta WhatsApp Business API
"""

import logging
import requests
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class WhatsAppService:
    """WhatsApp service for Meta Business API"""
    
    def __init__(self):
        """Initialize WhatsApp service with Meta API"""
        try:
            self.access_token = settings.WHATSAPP_ACCESS_TOKEN
            self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
            self.api_url = f"https://graph.facebook.com/v22.0/{self.phone_number_id}/messages"
            self.media_url = "https://graph.facebook.com/v22.0"
            logger.info("WhatsApp Service initialized with Meta Business API")
        except Exception as e:
            logger.error(f"Failed to initialize Meta WhatsApp client: {e}")
            raise
    
    async def download_image(self, image_id: str) -> Optional[bytes]:
        """
        Download image from Meta's CDN using image_id
        
        Meta API flow:
        1. GET /media/{image_id} -> returns download URL
        2. GET {download_url} -> returns actual image bytes
        
        Args:
            image_id: The media ID from webhook payload
            
        Returns:
            Image bytes or None if download failed
        """
        try:
            logger.info(f"📥 Downloading image: {image_id}")
            
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            media_info_url = f"{self.media_url}/{image_id}"
            response = requests.get(media_info_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Failed to get media info: {response.status_code} - {response.text}")
                return None
            
            media_data = response.json()
            download_url = media_data.get('url')
            
            if not download_url:
                logger.error(f"No download URL in media response: {media_data}")
                return None
            
            logger.info(f"📥 Downloading from: {download_url[:50]}...")
            
            image_response = requests.get(download_url, headers=headers)
            
            if image_response.status_code != 200:
                logger.error(f"Failed to download image: {image_response.status_code}")
                return None
            
            image_bytes = image_response.content
            logger.info(f"✅ Image downloaded: {len(image_bytes)} bytes")
            
            return image_bytes
            
        except Exception as e:
            logger.error(f"Error downloading image: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    async def send_message(self, to_phone: str, message: str) -> Dict[str, Any]:
        """
        Send WhatsApp message via Meta Business API
        
        Args:
            to_phone: Recipient phone number
            message: Message text to send
            
        Returns:
            Dict with send result
        """
        try:
            logger.info(f"Sending WhatsApp message to {to_phone}")
            
            # Prepare message data for Meta API
            message_data = {
                "messaging_product": "whatsapp",
                "to": to_phone,
                "type": "text",
                "text": {
                    "body": message
                }
            }
            
            # Send message via Meta API
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                self.api_url,
                json=message_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result_data = response.json()
                result = {
                    'success': True,
                    'message_id': result_data.get('messages', [{}])[0].get('id'),
                    'status': 'sent',
                    'to': to_phone
                }
                logger.info(f"Message sent successfully: {result['message_id']}")
                return result
            else:
                logger.error(f"Meta API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"API error: {response.status_code}",
                    'to': to_phone
                }
            
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
            booking_id = booking_data.get('booking_id', 'N/A')
            slot_parts = str(booking_id).split('_') if '_' in str(booking_id) else []
            if len(slot_parts) >= 3:
                vendor_parts = slot_parts[2:5] if len(slot_parts) >= 5 else slot_parts[2:]
                vendor_code = "".join([p[0].upper() for p in vendor_parts if p])[:3]
                time_part = slot_parts[1] if len(slot_parts) > 1 else "00"
                short_id = f"{vendor_code}-{time_part}"
            else:
                short_id = str(booking_id)[:8]
            
            message = f"""Booking Confirmed

Booking ID: {short_id}
Service: {booking_data.get('service', 'N/A')}
Date: {booking_data.get('date', 'N/A')}
Time: {booking_data.get('time', 'N/A')}

Thank you for using our service."""
            
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
