"""
WhatsApp Webhook Handler
Handles incoming WhatsApp messages via Meta Business API webhook
Supports text messages and image messages (payment screenshots)
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
        Supports both text and image messages
        
        Args:
            request: FastAPI request object
            
        Returns:
            Response dict
        """
        try:
            data = await request.json()
            logger.info(f"📥 Received webhook data: {data}")
            
            phone_number = None
            response_text = None
            message_type = None
            
            if 'entry' in data and len(data['entry']) > 0:
                entry = data['entry'][0]
                if 'changes' in entry and len(entry['changes']) > 0:
                    change = entry['changes'][0]
                    if 'value' in change and 'messages' in change['value']:
                        messages = change['value']['messages']
                        if len(messages) > 0:
                            message = messages[0]
                            phone_number = message.get('from', '')
                            message_type = message.get('type', 'text')
                            
                            if message_type == 'text':
                                incoming_msg = message.get('text', {}).get('body', '').strip()
                                logger.info(f"📱 Text message from {phone_number}: {incoming_msg}")
                                
                                if incoming_msg:
                                    response_text = await self.whatsapp_agent.process_message(phone_number, incoming_msg)
                            
                            elif message_type == 'image':
                                image_data = message.get('image', {})
                                image_id = image_data.get('id')
                                caption = image_data.get('caption', '')
                                
                                logger.info(f"🖼️ Image message from {phone_number}, id={image_id}, caption={caption}")
                                
                                if image_id:
                                    image_bytes = await self.whatsapp_service.download_image(image_id)
                                    
                                    if image_bytes:
                                        response_text = await self.whatsapp_agent.process_payment_image(
                                            phone_number, image_bytes, caption
                                        )
                                    else:
                                        response_text = "Sorry, I couldn't download the image. Please try again."
                            
                            else:
                                logger.info(f"Unsupported message type: {message_type}")
                                response_text = "Sorry, I can only process text messages and payment screenshots right now."
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
            
            if not phone_number or not response_text:
                logger.info("No valid message data to process")
                return {"status": "success", "message": "No valid message data"}
            
            send_result = await self.whatsapp_service.send_message(phone_number, response_text)
            
            if send_result['success']:
                logger.info(f"✅ Response sent successfully to {phone_number}")
            else:
                logger.error(f"❌ Failed to send response: {send_result['error']}")
            
            return {
                "status": "success",
                "message": "Webhook processed",
                "phone_number": phone_number,
                "message_type": message_type,
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
