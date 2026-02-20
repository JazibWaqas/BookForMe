"""
WhatsApp Agent - LangGraph-based conversation agent for WhatsApp booking flow
Uses LangGraph for stateful agent workflow with tool calling
Supports text messages and payment screenshot images
"""

import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional
from app.config import settings

from agent.graph import BookingAgent
from agent.session_store import session_store
from nlu.state_manager import StateManager
from nlu.ocr import PaymentOCR

logger = logging.getLogger(__name__)


class WhatsAppAgent:
    """WhatsApp conversation agent using LangGraph"""
    
    def __init__(self):
        """Initialize WhatsApp agent with LangGraph"""
        self.booking_agent = BookingAgent()
        self.state_manager = StateManager()
        self.payment_ocr = PaymentOCR()
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
            
            in_memory_session = session_store.get_session(phone_number)
            if in_memory_session and in_memory_session.get('locked_slot_id'):
                await self.state_manager.set_booking_context(phone_number, {
                    'locked_slot_id': in_memory_session.get('locked_slot_id'),
                    'payment_amount': in_memory_session.get('payment_amount'),
                    'vendor_id': in_memory_session.get('vendor_id'),
                    'awaiting_payment': True
                })
                logger.info(f"Persisted booking context to Firestore for {phone_number}")
            
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
        1. Check if user has a locked slot awaiting payment (in-memory or Firestore)
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
            
            if not user_session or not user_session.get('locked_slot_id'):
                logger.info(f"No in-memory session, checking Firestore for {phone_number}")
                firestore_context = await self.state_manager.get_booking_context(phone_number)
                if firestore_context and firestore_context.get('locked_slot_id'):
                    user_session = firestore_context
                    logger.info(f"Found booking context in Firestore: {firestore_context}")
            
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

            payment_ref = f"wa_{phone_number}_{locked_slot_id}"
            ext = "jpg"
            if caption and "." in caption:
                ext = caption.rsplit(".", 1)[-1].lower()
                if ext not in ("jpg", "jpeg", "png", "gif", "webp"):
                    ext = "jpg"
            upload_dir = Path(settings.UPLOADS_DIR) / "payments"
            upload_dir.mkdir(parents=True, exist_ok=True)
            safe_ref = "".join(c if c.isalnum() or c in "_-" else "_" for c in payment_ref)
            filename = f"{safe_ref}.{ext}"
            filepath = upload_dir / filename
            filepath.write_bytes(image_bytes)
            logger.info(f"Payment screenshot saved: {filepath}")

            from app.firestore import firestore_db
            from database.slot_service import SlotService

            slot_service = SlotService(firestore_db.db)
            payment_result = slot_service.submit_payment(locked_slot_id, phone_number, payment_ref)
            
            if not payment_result.get('success'):
                logger.error(f"Failed to submit payment: {payment_result.get('error')}")
                return f"Sorry, there was an error processing your payment. Please try again or contact support."
            
            logger.info(f"Payment submitted for slot {locked_slot_id}")
            
            ocr_result = await self.payment_ocr.verify_payment(image_bytes, expected_amount)

            if not ocr_result["verified"]:
                extracted = ocr_result.get("extracted_amount")
                if extracted is not None:
                    return (
                        f"Payment screenshot received, but the amount doesn't match.\n"
                        f"Expected: Rs {expected_amount} — Found: Rs {int(extracted)}\n"
                        "Please send the correct payment screenshot. Your slot is still held for a few more minutes."
                    )
                logger.warning(f"OCR failed for {phone_number}, falling back to auto-confirm. Error: {ocr_result.get('error')}")
            
            confirm_result = slot_service.confirm_booking(locked_slot_id, vendor_id)
            
            if confirm_result.get('success'):
                session_store.clear_session(phone_number)
                
                await self.state_manager.set_booking_context(phone_number, {
                    'locked_slot_id': None,
                    'payment_amount': None,
                    'vendor_id': None,
                    'awaiting_payment': False,
                    'last_booking_id': locked_slot_id
                })
                
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
