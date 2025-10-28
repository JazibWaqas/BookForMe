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
            # Parse JSON data from Meta API
            data = await request.json()
            
            # Debug: Log the received data
            logger.info(f"📥 Received webhook data: {data}")
            
            # Initialize variables
            phone_number = None
            incoming_msg = None
            
            # Extract message data from Meta webhook format
            if 'entry' in data and len(data['entry']) > 0:
                entry = data['entry'][0]
                if 'changes' in entry and len(entry['changes']) > 0:
                    change = entry['changes'][0]
                    if 'value' in change and 'messages' in change['value']:
                        messages = change['value']['messages']
                        if len(messages) > 0:
                            message = messages[0]
                            incoming_msg = message.get('text', {}).get('body', '').strip()
                            phone_number = message.get('from', '')
                            
                            logger.info(f"📱 Received WhatsApp message from {phone_number}: {incoming_msg}")
                        else:
                            logger.info("No messages in webhook data")
                            return {"status": "success", "message": "No messages to process"}
                    else:
                        logger.info("No message data in webhook")
                        return {"status": "success", "message": "No message data"}
                else:
                    logger.info("No changes in webhook data")
                    return {"status": "success", "message": "No changes"}
            else:
                logger.info("No entry in webhook data")
                return {"status": "success", "message": "No entry"}
            
            # Only process if we have valid message data
            if not phone_number or not incoming_msg:
                logger.info("No valid message data to process")
                return {"status": "success", "message": "No valid message data"}
            
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
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return {
                "status": "error",
                "message": str(e),
                "phone_number": phone_number if 'phone_number' in locals() else "unknown"
            }
