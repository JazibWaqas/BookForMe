"""
WhatsApp Webhook Handler
Handles incoming WhatsApp messages via Twilio webhook
"""

import logging
from typing import Dict, Any
from fastapi import Request
from whatsapp.agent import WhatsAppAgent
from whatsapp.service import WhatsAppService

logger = logging.getLogger(__name__)


class WhatsAppWebhookHandler:
    """Handles WhatsApp webhook requests"""
    
    def __init__(self):
        """Initialize webhook handler"""
        self.whatsapp_agent = WhatsAppAgent()
        self.whatsapp_service = WhatsAppService()
        logger.info("WhatsApp Webhook Handler initialized")
    
    async def handle_webhook(self, request: Request) -> Dict[str, Any]:
        """
        Handle incoming WhatsApp webhook
        
        Args:
            request: FastAPI request object
            
        Returns:
            Response for Twilio
        """
        try:
            # Parse form data from Twilio
            form_data = await request.form()
            incoming_msg = form_data.get('Body', '').strip()
            phone_number = form_data.get('From', '')
            
            logger.info(f"📱 Received WhatsApp message from {phone_number}: {incoming_msg}")
            
            # Process message through WhatsApp agent
            response_text = await self.whatsapp_agent.process_message(phone_number, incoming_msg)
            
            # Send response via WhatsApp service
            send_result = await self.whatsapp_service.send_message(phone_number, response_text)
            
            if send_result['success']:
                logger.info(f"✅ Response sent successfully to {phone_number}")
            else:
                logger.error(f"❌ Failed to send response: {send_result['error']}")
            
            return {
                "status": "success",
                "message": "Webhook processed",
                "phone_number": phone_number,
                "response_sent": send_result['success']
            }
            
        except Exception as e:
            logger.error(f"❌ Webhook processing failed: {e}")
            return {
                "status": "error",
                "message": str(e),
                "phone_number": phone_number if 'phone_number' in locals() else "unknown"
            }
