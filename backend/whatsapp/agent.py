"""
WhatsApp Agent - LangGraph-based conversation agent for WhatsApp booking flow
Uses LangGraph for stateful agent workflow with tool calling
Supports text messages and payment screenshot images
"""

import logging
from typing import Dict, Any, Optional
from app.config import settings

from agent.graph import BookingAgent
from agent.session_store import session_store
from nlu.state_manager import StateManager

logger = logging.getLogger(__name__)


class WhatsAppAgent:
    """WhatsApp conversation agent using LangGraph"""
    
    def __init__(self):
        """Initialize WhatsApp agent with LangGraph"""
        self.booking_agent = BookingAgent()
        self.state_manager = StateManager()
        logger.info("WhatsApp Agent initialized with LangGraph")
    
    async def process_message(self, phone_number: str, message: str) -> str:
        """
        Process incoming WhatsApp text message using LangGraph agent
        
        Args:
            phone_number: Customer's phone number
            message: Incoming message text
            
        Returns:
            Response message to send back
        """
        try:
            logger.info(f"Processing message from {phone_number}: {message}")
            
            session = await self.state_manager.get_session(phone_number)
            history = session.get('history', [])
            
            conversation_history = []
            for msg in history:
                conversation_history.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })
            
            response = await self.booking_agent.process(
                user_phone=phone_number,
                message=message,
                conversation_history=conversation_history
            )
            
            await self.state_manager.add_message_to_history(phone_number, 'user', message)
            await self.state_manager.add_message_to_history(phone_number, 'assistant', response)
            
            logger.info(f"Generated response: {response[:100]}...")
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "Sorry, I encountered an error. Please try again later."
    
    async def process_payment_image(self, phone_number: str, image_bytes: bytes, caption: str = "") -> str:
        """
        Process payment screenshot image
        
        Flow:
        1. Check if user has a locked slot awaiting payment
        2. Store image for manual/OCR verification (OCR to be implemented)
        3. Mark payment as submitted
        4. Confirm booking (or wait for vendor approval)
        
        Args:
            phone_number: Customer's phone number
            image_bytes: The image data
            caption: Optional caption sent with image
            
        Returns:
            Response message
        """
        try:
            logger.info(f"🖼️ Processing payment image from {phone_number}, size={len(image_bytes)} bytes")
            
            user_session = session_store.get_session(phone_number)
            
            if not user_session:
                logger.info(f"No active session for {phone_number}")
                return "You don't have an active booking. Please start by selecting a slot first."
            
            locked_slot_id = user_session.get('locked_slot_id')
            expected_amount = user_session.get('payment_amount')
            vendor_id = user_session.get('vendor_id')
            
            if not locked_slot_id:
                logger.info(f"No locked slot for {phone_number}")
                return "You don't have a pending payment. Please book a slot first and I'll send you payment details."
            
            logger.info(f"Found locked slot: {locked_slot_id}, expected amount: {expected_amount}")
            
            from app.firestore import firestore_db
            from database.slot_service import SlotService
            
            slot_service = SlotService(firestore_db.db)
            
            payment_ref = f"wa_{phone_number}_{locked_slot_id}"
            payment_result = slot_service.submit_payment(locked_slot_id, phone_number, payment_ref)
            
            if not payment_result.get('success'):
                logger.error(f"Failed to submit payment: {payment_result.get('error')}")
                return f"Sorry, there was an error processing your payment. Please try again or contact support."
            
            logger.info(f"Payment submitted for slot {locked_slot_id}")
            
            # TODO: Implement OCR verification here
            # For now, auto-confirm the booking (or you can wait for vendor approval)
            
            confirm_result = slot_service.confirm_booking(locked_slot_id, vendor_id)
            
            if confirm_result.get('success'):
                session_store.clear_session(phone_number)
                
                amount_str = f"Rs {expected_amount}" if expected_amount else "payment"
                
                await self.state_manager.add_message_to_history(
                    phone_number, 'user', '[Payment Screenshot Received]'
                )
                await self.state_manager.add_message_to_history(
                    phone_number, 'assistant', f'Payment received and booking confirmed! ID: {locked_slot_id}'
                )
                
                return f"""✅ Payment received! Your booking is confirmed.

📋 Booking ID: {locked_slot_id}
💰 Amount: {amount_str}

Thank you for booking with us! See you soon."""
            
            else:
                return f"""📸 Payment screenshot received!

Your payment is being verified. You'll receive a confirmation shortly.

Booking ID: {locked_slot_id}
Status: Pending Verification"""
            
        except Exception as e:
            logger.error(f"Error processing payment image: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return "Sorry, there was an error processing your payment screenshot. Please try again or contact support."
