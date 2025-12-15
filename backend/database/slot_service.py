"""
Slot Service - State Management with Optimistic Concurrency Control
Handles slot locking, payment, and confirmation using Firestore transactions
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from google.cloud import firestore

from database.schema import (
    Collections, SlotStatus, PaymentStatus, PriceTier,
    HOLD_EXPIRY_MINUTES
)

logger = logging.getLogger(__name__)


class SlotService:
    def __init__(self, db_client: firestore.Client):
        self.db = db_client
        logger.info("SlotService initialized")
    
    def lock_slot(self, slot_id: str, user_id: str, booking_source: str = "app") -> Dict[str, Any]:
        """
        Lock a slot for a user using Firestore transaction (OCC)
        Prevents double-booking by ensuring atomicity
        
        Args:
            slot_id: The slot to lock
            user_id: The user locking the slot
            booking_source: "app" or "whatsapp"
        
        State transition: available -> locked
        """
        try:
            @firestore.transactional
            def lock_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('status') != SlotStatus.AVAILABLE.value:
                    current_status = slot_data.get('status')
                    return {'success': False, 'error': f'Slot is not available (current: {current_status})'}
                
                hold_expires = datetime.now(timezone.utc) + timedelta(minutes=HOLD_EXPIRY_MINUTES)
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.LOCKED.value,
                    'user_id': user_id,
                    'booking_source': booking_source,
                    'hold_expires_at': hold_expires,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                return {
                    'success': True,
                    'slot_id': slot_id,
                    'user_id': user_id,
                    'booking_source': booking_source,
                    'hold_expires_at': hold_expires,
                    'expires_in_minutes': HOLD_EXPIRY_MINUTES
                }
            
            transaction = self.db.transaction()
            result = lock_transaction(transaction)
            
            if result['success']:
                logger.info(f"Slot {slot_id} locked for user {user_id}")
            else:
                logger.warning(f"Failed to lock slot {slot_id}: {result['error']}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error locking slot {slot_id}: {e}")
            return {'success': False, 'error': f'Lock failed: {str(e)}'}
    
    def release_lock(self, slot_id: str, user_id: str) -> Dict[str, Any]:
        """
        Release a lock on a slot (user cancelled or timeout)
        
        State transition: locked -> available
        """
        try:
            @firestore.transactional
            def release_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('status') != SlotStatus.LOCKED.value:
                    return {'success': False, 'error': 'Slot is not locked'}
                
                if slot_data.get('user_id') != user_id:
                    return {'success': False, 'error': 'Slot is locked by another user'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.AVAILABLE.value,
                    'user_id': None,
                    'hold_expires_at': None,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                return {'success': True, 'slot_id': slot_id}
            
            transaction = self.db.transaction()
            result = release_transaction(transaction)
            
            if result['success']:
                logger.info(f"Lock released on slot {slot_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error releasing lock on slot {slot_id}: {e}")
            return {'success': False, 'error': f'Release failed: {str(e)}'}
    
    def submit_payment(self, slot_id: str, user_id: str, payment_id: str) -> Dict[str, Any]:
        """
        Submit payment proof for a locked slot
        
        State transition: locked -> pending
        """
        try:
            @firestore.transactional
            def payment_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('status') != SlotStatus.LOCKED.value:
                    return {'success': False, 'error': 'Slot is not in locked state'}
                
                if slot_data.get('user_id') != user_id:
                    return {'success': False, 'error': 'Slot is locked by another user'}
                
                hold_expires = slot_data.get('hold_expires_at')
                if hold_expires and datetime.now(timezone.utc) > hold_expires:
                    transaction.update(slot_ref, {
                        'status': SlotStatus.AVAILABLE.value,
                        'user_id': None,
                        'hold_expires_at': None,
                        'updated_at': firestore.SERVER_TIMESTAMP
                    })
                    return {'success': False, 'error': 'Hold has expired, slot released'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.PENDING.value,
                    'payment_id': payment_id,
                    'hold_expires_at': None,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                return {
                    'success': True,
                    'slot_id': slot_id,
                    'payment_id': payment_id,
                    'status': SlotStatus.PENDING.value
                }
            
            transaction = self.db.transaction()
            result = payment_transaction(transaction)
            
            if result['success']:
                logger.info(f"Payment submitted for slot {slot_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error submitting payment for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Payment submission failed: {str(e)}'}
    
    def confirm_booking(self, slot_id: str, vendor_id: str) -> Dict[str, Any]:
        """
        Vendor confirms the booking after payment verification
        
        State transition: pending -> confirmed
        """
        try:
            @firestore.transactional
            def confirm_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('vendor_id') != vendor_id:
                    return {'success': False, 'error': 'Unauthorized: slot belongs to different vendor'}
                
                if slot_data.get('status') != SlotStatus.PENDING.value:
                    return {'success': False, 'error': 'Slot is not in pending state'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.CONFIRMED.value,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                return {
                    'success': True,
                    'slot_id': slot_id,
                    'user_id': slot_data.get('user_id'),
                    'status': SlotStatus.CONFIRMED.value
                }
            
            transaction = self.db.transaction()
            result = confirm_transaction(transaction)
            
            if result['success']:
                logger.info(f"Booking confirmed for slot {slot_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error confirming booking for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Confirmation failed: {str(e)}'}
    
    def reject_booking(self, slot_id: str, vendor_id: str, reason: str = '') -> Dict[str, Any]:
        """
        Vendor rejects the booking (payment issue)
        Creates a new available slot and marks this one as cancelled
        
        State transition: pending -> cancelled
        """
        try:
            @firestore.transactional
            def reject_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('vendor_id') != vendor_id:
                    return {'success': False, 'error': 'Unauthorized: slot belongs to different vendor'}
                
                if slot_data.get('status') != SlotStatus.PENDING.value:
                    return {'success': False, 'error': 'Slot is not in pending state'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.CANCELLED.value,
                    'cancellation_reason': reason,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                new_slot_id = f"{slot_id}_replacement"
                new_slot_ref = self.db.collection(Collections.SLOTS).document(new_slot_id)
                
                new_slot_data = {
                    'vendor_id': slot_data.get('vendor_id'),
                    'service_id': slot_data.get('service_id'),
                    'resource_id': slot_data.get('resource_id'),
                    'start_time': slot_data.get('start_time'),
                    'end_time': slot_data.get('end_time'),
                    'date': slot_data.get('date'),
                    'price': slot_data.get('price'),
                    'price_tier_used': slot_data.get('price_tier_used', PriceTier.BASE.value),
                    'status': SlotStatus.AVAILABLE.value,
                    'user_id': None,
                    'payment_id': None,
                    'hold_expires_at': None,
                    'created_at': firestore.SERVER_TIMESTAMP,
                    'updated_at': firestore.SERVER_TIMESTAMP
                }
                
                transaction.set(new_slot_ref, new_slot_data)
                
                return {
                    'success': True,
                    'cancelled_slot_id': slot_id,
                    'new_slot_id': new_slot_id,
                    'user_id': slot_data.get('user_id')
                }
            
            transaction = self.db.transaction()
            result = reject_transaction(transaction)
            
            if result['success']:
                logger.info(f"Booking rejected for slot {slot_id}, new slot created: {result['new_slot_id']}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error rejecting booking for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Rejection failed: {str(e)}'}
    
    def cancel_booking(self, slot_id: str, user_id: str = None, vendor_id: str = None) -> Dict[str, Any]:
        """
        Cancel a confirmed booking (by user or vendor)
        Creates a new available slot
        
        State transition: confirmed -> cancelled
        """
        try:
            @firestore.transactional
            def cancel_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if user_id and slot_data.get('user_id') != user_id:
                    return {'success': False, 'error': 'Unauthorized: booking belongs to different user'}
                
                if vendor_id and slot_data.get('vendor_id') != vendor_id:
                    return {'success': False, 'error': 'Unauthorized: slot belongs to different vendor'}
                
                if slot_data.get('status') not in [SlotStatus.CONFIRMED.value, SlotStatus.PENDING.value, SlotStatus.LOCKED.value]:
                    return {'success': False, 'error': 'Slot cannot be cancelled in current state'}
                
                cancelled_by = 'user' if user_id else 'vendor'
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.CANCELLED.value,
                    'cancelled_by': cancelled_by,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                new_slot_id = f"{slot_id}_replacement"
                new_slot_ref = self.db.collection(Collections.SLOTS).document(new_slot_id)
                
                new_slot_data = {
                    'vendor_id': slot_data.get('vendor_id'),
                    'service_id': slot_data.get('service_id'),
                    'resource_id': slot_data.get('resource_id'),
                    'start_time': slot_data.get('start_time'),
                    'end_time': slot_data.get('end_time'),
                    'date': slot_data.get('date'),
                    'price': slot_data.get('price'),
                    'price_tier_used': slot_data.get('price_tier_used', PriceTier.BASE.value),
                    'status': SlotStatus.AVAILABLE.value,
                    'user_id': None,
                    'payment_id': None,
                    'hold_expires_at': None,
                    'created_at': firestore.SERVER_TIMESTAMP,
                    'updated_at': firestore.SERVER_TIMESTAMP
                }
                
                transaction.set(new_slot_ref, new_slot_data)
                
                return {
                    'success': True,
                    'cancelled_slot_id': slot_id,
                    'new_slot_id': new_slot_id,
                    'cancelled_by': cancelled_by
                }
            
            transaction = self.db.transaction()
            result = cancel_transaction(transaction)
            
            if result['success']:
                logger.info(f"Booking cancelled for slot {slot_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error cancelling booking for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Cancellation failed: {str(e)}'}
    
    def cleanup_expired_locks(self) -> Dict[str, Any]:
        """
        Release all expired slot locks (background job)
        Should be run periodically via Cloud Function or cron
        """
        try:
            now = datetime.now(timezone.utc)
            expired_count = 0
            
            docs = self.db.collection(Collections.SLOTS)\
                .where('status', '==', SlotStatus.LOCKED.value)\
                .stream()
            
            batch = self.db.batch()
            
            for doc in docs:
                slot_data = doc.to_dict()
                hold_expires = slot_data.get('hold_expires_at')
                
                if hold_expires and now > hold_expires:
                    batch.update(doc.reference, {
                        'status': SlotStatus.AVAILABLE.value,
                        'user_id': None,
                        'hold_expires_at': None,
                        'updated_at': firestore.SERVER_TIMESTAMP
                    })
                    expired_count += 1
            
            if expired_count > 0:
                batch.commit()
                logger.info(f"Released {expired_count} expired slot locks")
            
            return {
                'success': True,
                'released_count': expired_count
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up expired locks: {e}")
            return {'success': False, 'error': str(e)}
    
    def check_slot_availability(self, slot_id: str) -> Dict[str, Any]:
        """
        Check if a slot is available for booking
        Also handles expired lock cleanup for this specific slot
        """
        try:
            slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
            slot_doc = slot_ref.get()
            
            if not slot_doc.exists:
                return {'available': False, 'error': 'Slot not found'}
            
            slot_data = slot_doc.to_dict()
            status = slot_data.get('status')
            
            if status == SlotStatus.AVAILABLE.value:
                return {'available': True, 'slot': slot_data}
            
            if status == SlotStatus.LOCKED.value:
                hold_expires = slot_data.get('hold_expires_at')
                if hold_expires and datetime.now(timezone.utc) > hold_expires:
                    slot_ref.update({
                        'status': SlotStatus.AVAILABLE.value,
                        'user_id': None,
                        'hold_expires_at': None,
                        'updated_at': firestore.SERVER_TIMESTAMP
                    })
                    slot_data['status'] = SlotStatus.AVAILABLE.value
                    return {'available': True, 'slot': slot_data, 'was_expired': True}
            
            return {
                'available': False,
                'status': status,
                'slot': slot_data
            }
            
        except Exception as e:
            logger.error(f"Error checking slot availability: {e}")
            return {'available': False, 'error': str(e)}
    
    def block_slot(self, slot_id: str, vendor_id: str, reason: str = "Manual block") -> Dict[str, Any]:
        """
        Vendor blocks a slot (maintenance, private event, etc.)
        
        State transition: available -> blocked
        """
        try:
            @firestore.transactional
            def block_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('vendor_id') != vendor_id:
                    return {'success': False, 'error': 'Unauthorized: slot belongs to different vendor'}
                
                if slot_data.get('status') != SlotStatus.AVAILABLE.value:
                    return {'success': False, 'error': 'Slot is not available to block'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.BLOCKED.value,
                    'block_reason': reason,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                return {'success': True, 'slot_id': slot_id}
            
            transaction = self.db.transaction()
            result = block_transaction(transaction)
            
            if result['success']:
                logger.info(f"Slot {slot_id} blocked: {reason}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error blocking slot {slot_id}: {e}")
            return {'success': False, 'error': f'Block failed: {str(e)}'}
    
    def unblock_slot(self, slot_id: str, vendor_id: str) -> Dict[str, Any]:
        """
        Vendor unblocks a previously blocked slot
        
        State transition: blocked -> available
        """
        try:
            @firestore.transactional
            def unblock_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('vendor_id') != vendor_id:
                    return {'success': False, 'error': 'Unauthorized: slot belongs to different vendor'}
                
                if slot_data.get('status') != SlotStatus.BLOCKED.value:
                    return {'success': False, 'error': 'Slot is not blocked'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.AVAILABLE.value,
                    'block_reason': None,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                return {'success': True, 'slot_id': slot_id}
            
            transaction = self.db.transaction()
            result = unblock_transaction(transaction)
            
            if result['success']:
                logger.info(f"Slot {slot_id} unblocked")
            
            return result
            
        except Exception as e:
            logger.error(f"Error unblocking slot {slot_id}: {e}")
            return {'success': False, 'error': f'Unblock failed: {str(e)}'}
    
    def manual_booking(self, slot_id: str, vendor_id: str, customer_name: str, customer_phone: str) -> Dict[str, Any]:
        """
        Vendor creates a manual booking (walk-in, phone call, etc.)
        
        State transition: available -> confirmed (bypasses lock/pending)
        """
        from database.schema import BookingSource
        
        try:
            @firestore.transactional
            def manual_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('vendor_id') != vendor_id:
                    return {'success': False, 'error': 'Unauthorized: slot belongs to different vendor'}
                
                if slot_data.get('status') != SlotStatus.AVAILABLE.value:
                    return {'success': False, 'error': 'Slot is not available'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.CONFIRMED.value,
                    'booking_source': BookingSource.MANUAL.value,
                    'customer_name': customer_name,
                    'customer_phone': customer_phone,
                    'user_id': None,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                return {
                    'success': True,
                    'slot_id': slot_id,
                    'booking_source': BookingSource.MANUAL.value
                }
            
            transaction = self.db.transaction()
            result = manual_transaction(transaction)
            
            if result['success']:
                logger.info(f"Manual booking created for slot {slot_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error creating manual booking for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Manual booking failed: {str(e)}'}
    
    def complete_booking(self, slot_id: str, vendor_id: str) -> Dict[str, Any]:
        """
        Mark a confirmed booking as completed (after the session is done)
        
        State transition: confirmed -> completed
        """
        try:
            @firestore.transactional
            def complete_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                
                if slot_data.get('vendor_id') != vendor_id:
                    return {'success': False, 'error': 'Unauthorized: slot belongs to different vendor'}
                
                if slot_data.get('status') != SlotStatus.CONFIRMED.value:
                    return {'success': False, 'error': 'Slot is not in confirmed state'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.COMPLETED.value,
                    'completed_at': firestore.SERVER_TIMESTAMP,
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                return {'success': True, 'slot_id': slot_id}
            
            transaction = self.db.transaction()
            result = complete_transaction(transaction)
            
            if result['success']:
                logger.info(f"Booking completed for slot {slot_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error completing booking for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Complete failed: {str(e)}'}
