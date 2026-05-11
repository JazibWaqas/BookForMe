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

BOOKABLE_VENDOR_STATUSES = {"active", "approved"}


def _vendor_is_bookable(vendor_data: Optional[Dict[str, Any]]) -> bool:
    if not vendor_data:
        return False
    status = str(vendor_data.get("status", "active") or "active").lower()
    return status in BOOKABLE_VENDOR_STATUSES


def _write_notification(db, user_id: str, notif_type: str, title: str, message: str, data: dict = None):
    """Write a notification doc to Firestore. Fire-and-forget — never raises."""
    if not user_id:
        return
    try:
        db.collection('notifications').add({
            'user_id': user_id,
            'type': notif_type,
            'title': title,
            'message': message,
            'data': data or {},
            'read': False,
            'created_at': firestore.SERVER_TIMESTAMP,
        })
    except Exception as e:
        logger.warning(f"Failed to write notification for {user_id}: {e}")


def _vendor_owner_user_ids(db, vendor_id: str) -> list:
    """Find app user IDs that own a vendor account."""
    if not vendor_id:
        return []
    ids = set()
    try:
        vendor_doc = db.collection('vendors').document(vendor_id).get()
        if vendor_doc.exists:
            vendor = vendor_doc.to_dict() or {}
            for key in ('owner_id', 'user_id', 'created_by'):
                if vendor.get(key):
                    ids.add(str(vendor[key]))
    except Exception as e:
        logger.warning(f"Failed to inspect vendor owner fields for {vendor_id}: {e}")

    try:
        docs = db.collection('users').where('vendor_id', '==', vendor_id).limit(10).stream()
        for doc in docs:
            ids.add(doc.id)
    except Exception as e:
        logger.warning(f"Failed to query vendor owner users for {vendor_id}: {e}")
    return list(ids)


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

                vendor_id = slot_data.get('vendor_id')
                if not vendor_id:
                    return {'success': False, 'error': 'Slot has no vendor_id'}
                vendor_ref = self.db.collection(Collections.VENDORS).document(vendor_id)
                vendor_doc = vendor_ref.get(transaction=transaction)
                if not vendor_doc.exists or not _vendor_is_bookable(vendor_doc.to_dict() or {}):
                    return {'success': False, 'error': 'Vendor is not available for booking'}
                
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

                vendor_id = slot_data.get('vendor_id')
                if not vendor_id:
                    return {'success': False, 'error': 'Slot has no vendor_id'}
                vendor_ref = self.db.collection(Collections.VENDORS).document(vendor_id)
                vendor_doc = vendor_ref.get(transaction=transaction)
                if not vendor_doc.exists or not _vendor_is_bookable(vendor_doc.to_dict() or {}):
                    return {'success': False, 'error': 'Vendor is not available for booking'}
                
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
                    'vendor_id': slot_data.get('vendor_id'),
                    'status': SlotStatus.PENDING.value
                }
            
            transaction = self.db.transaction()
            result = payment_transaction(transaction)
            
            if result['success']:
                logger.info(f"Payment submitted for slot {slot_id}")
                _write_notification(
                    self.db, user_id,
                    'payment_received', 'Payment Received',
                    f'Payment screenshot received for slot {slot_id[:8]}. Awaiting vendor confirmation.',
                    {'slot_id': slot_id, 'payment_id': payment_id},
                )
                for owner_uid in _vendor_owner_user_ids(self.db, result.get('vendor_id')):
                    _write_notification(
                        self.db, owner_uid,
                        'vendor_payment_pending', 'Payment Needs Review',
                        f'Payment proof received for slot {slot_id[:8]}. Review it in the vendor dashboard.',
                        {'slot_id': slot_id, 'payment_id': payment_id, 'vendor_id': result.get('vendor_id')},
                    )
            
            return result
            
        except Exception as e:
            logger.error(f"Error submitting payment for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Payment submission failed: {str(e)}'}
    
    def confirm_booking(self, slot_id: str, vendor_id: str = None) -> Dict[str, Any]:
        """
        Confirm booking after payment verification (state transition: pending -> confirmed).
        vendor_id is used for authorization when provided.
        When vendor_id is None (e.g. post-OCR auto-confirm), the slot's own vendor_id is used.
        """
        try:
            @firestore.transactional
            def confirm_transaction(transaction):
                slot_ref = self.db.collection(Collections.SLOTS).document(slot_id)
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                slot_vendor_id = slot_data.get('vendor_id')

                # Authorization check: only enforce if a vendor_id was explicitly provided.
                # When vendor_id is None (post-OCR auto-confirm), we trust the slot document.
                if vendor_id is not None and slot_vendor_id != vendor_id:
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
                    'vendor_id': slot_vendor_id,
                    'user_id': slot_data.get('user_id'),
                    'status': SlotStatus.CONFIRMED.value
                }
            
            transaction = self.db.transaction()
            result = confirm_transaction(transaction)
            
            if result['success']:
                logger.info(f"Booking confirmed for slot {slot_id}")
                _write_notification(
                    self.db, result.get('user_id'),
                    'booking_confirmed', 'Booking Confirmed',
                    f'Your booking has been confirmed. Slot ID: {slot_id[:8]}',
                    {'slot_id': slot_id, 'vendor_id': result.get('vendor_id')},
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Error confirming booking for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Confirmation failed: {str(e)}'}
    
    def reject_booking(self, slot_id: str, vendor_id: str, reason: str = '') -> Dict[str, Any]:
        """
        Vendor rejects or cancels the booking; same slot document becomes available again
        so calendar and walk-in keep using the canonical slot id.
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
                
                if slot_data.get('status') not in [SlotStatus.PENDING.value, SlotStatus.CONFIRMED.value, SlotStatus.COMPLETED.value]:
                    return {'success': False, 'error': 'Slot is not in a cancellable state'}
                
                transaction.update(slot_ref, {
                    'status': SlotStatus.AVAILABLE.value,
                    'user_id': None,
                    'payment_id': None,
                    'hold_expires_at': None,
                    'customer_name': None,
                    'customer_phone': None,
                    'booking_source': None,
                    'cancellation_reason': reason or None,
                    'updated_at': firestore.SERVER_TIMESTAMP,
                })
                
                return {
                    'success': True,
                    'slot_id': slot_id,
                    'user_id': slot_data.get('user_id'),
                }
            
            transaction = self.db.transaction()
            result = reject_transaction(transaction)
            
            if result['success']:
                logger.info(f"Booking rejected for slot {slot_id}; slot set back to available")
                _write_notification(
                    self.db, result.get('user_id'),
                    'booking_cancelled', 'Booking Rejected',
                    f'Your booking was rejected by the vendor. Slot: {slot_id[:8]}',
                    {'slot_id': slot_id},
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Error rejecting booking for slot {slot_id}: {e}")
            return {'success': False, 'error': f'Rejection failed: {str(e)}'}
    
    def cancel_booking(self, slot_id: str, user_id: str = None, vendor_id: str = None) -> Dict[str, Any]:
        """
        Cancel a booking (user or vendor); same slot document becomes available again.
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
                    'status': SlotStatus.AVAILABLE.value,
                    'user_id': None,
                    'payment_id': None,
                    'hold_expires_at': None,
                    'customer_name': None,
                    'customer_phone': None,
                    'booking_source': None,
                    'updated_at': firestore.SERVER_TIMESTAMP,
                })
                
                return {
                    'success': True,
                    'slot_id': slot_id,
                    'cancelled_by': cancelled_by,
                }
            
            transaction = self.db.transaction()
            result = cancel_transaction(transaction)
            
            if result['success']:
                logger.info(f"Booking cancelled for slot {slot_id}")
                cancelled_by = result.get('cancelled_by', 'vendor')
                notif_uid = result.get('user_id') if cancelled_by == 'vendor' else None
                if notif_uid:
                    _write_notification(
                        self.db, notif_uid,
                        'booking_cancelled', 'Booking Cancelled',
                        f'Your booking (slot {slot_id[:8]}) has been cancelled.',
                        {'slot_id': slot_id},
                    )
            
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
