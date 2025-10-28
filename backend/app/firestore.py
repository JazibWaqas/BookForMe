"""
Firestore Database Connection
Simplified database layer using Firestore instead of PostgreSQL
"""

import logging
from typing import Dict, List, Any, Optional
from google.cloud import firestore
from app.config import settings
import json
import os

logger = logging.getLogger(__name__)


class FirestoreDB:
    """Firestore database connection and operations"""
    
    def __init__(self):
        """Initialize Firestore client"""
        try:
            # Set credentials file path if not already set
            if 'GOOGLE_APPLICATION_CREDENTIALS' not in os.environ:
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.FIRESTORE_CREDENTIALS_FILE
            
            # Initialize Firestore client
            self.db = firestore.Client(project=settings.FIRESTORE_PROJECT_ID)
            logger.info("Firestore client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Firestore: {e}")
            # Don't raise - allow app to start without Firestore
            self.db = None
    
    # ============================================================================
    # VENDOR OPERATIONS
    # ============================================================================
    
    async def get_vendor(self, vendor_id: str) -> Optional[Dict[str, Any]]:
        """Get vendor by ID"""
        try:
            doc = self.db.collection('vendors').document(vendor_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting vendor {vendor_id}: {e}")
            return None
    
    async def get_vendors_by_service(self, service_type: str) -> List[Dict[str, Any]]:
        """Get vendors by service type"""
        try:
            vendors = []
            docs = self.db.collection('vendors').where('service_type', '==', service_type).stream()
            for doc in docs:
                vendor_data = doc.to_dict()
                vendor_data['id'] = doc.id
                vendors.append(vendor_data)
            return vendors
        except Exception as e:
            logger.error(f"Error getting vendors by service: {e}")
            return []
    
    # ============================================================================
    # AVAILABILITY OPERATIONS
    # ============================================================================
    
    async def get_available_slots(self, vendor_id: str, date: str) -> List[Dict[str, Any]]:
        """Get available slots for vendor on specific date"""
        try:
            slots = []
            docs = self.db.collection('availability_slots').where('vendor_id', '==', vendor_id).where('slot_date', '==', date).where('status', '==', 'available').stream()
            for doc in docs:
                slot_data = doc.to_dict()
                slot_data['id'] = doc.id
                slots.append(slot_data)
            return sorted(slots, key=lambda x: x.get('slot_time', ''))
        except Exception as e:
            logger.error(f"Error getting available slots: {e}")
            return []
    
    async def book_slot(self, vendor_id: str, date: str, time: str, customer_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Book a slot with Firestore transaction (prevents double-booking)
        
        Args:
            vendor_id: Vendor ID
            date: Booking date (YYYY-MM-DD)
            time: Booking time (HH:MM)
            customer_info: Customer details
            
        Returns:
            Booking result
        """
        try:
            # Use Firestore transaction for atomicity
            @firestore.transactional
            def book_slot_transaction(transaction):
                # Find the slot
                slot_query = self.db.collection('availability_slots').where('vendor_id', '==', vendor_id).where('slot_date', '==', date).where('slot_time', '==', time).where('status', '==', 'available').limit(1)
                slots = list(slot_query.stream())
                
                if not slots:
                    return {'success': False, 'error': 'Slot not available'}
                
                slot_doc = slots[0]
                slot_ref = slot_doc.reference
                
                # Update slot status
                transaction.update(slot_ref, {'status': 'booked'})
                
                # Create booking
                booking_data = {
                    'vendor_id': vendor_id,
                    'slot_id': slot_doc.id,
                    'customer_name': customer_info.get('name', 'Unknown'),
                    'customer_phone': customer_info.get('phone', ''),
                    'booking_source': 'whatsapp',
                    'status': 'confirmed',
                    'date': date,
                    'time': time,
                    'created_at': firestore.SERVER_TIMESTAMP
                }
                
                booking_ref = self.db.collection('bookings').document()
                transaction.set(booking_ref, booking_data)
                
                return {'success': True, 'booking_id': booking_ref.id, 'slot_id': slot_doc.id}
            
            # Run transaction
            transaction = self.db.transaction()
            result = book_slot_transaction(transaction)
            
            logger.info(f"Slot booked successfully: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error booking slot: {e}")
            return {'success': False, 'error': f'Booking failed: {str(e)}'}
    
    # ============================================================================
    # BOOKING OPERATIONS
    # ============================================================================
    
    async def get_booking(self, booking_id: str) -> Optional[Dict[str, Any]]:
        """Get booking by ID"""
        try:
            doc = self.db.collection('bookings').document(booking_id).get()
            if doc.exists:
                booking_data = doc.to_dict()
                booking_data['id'] = doc.id
                return booking_data
            return None
        except Exception as e:
            logger.error(f"Error getting booking {booking_id}: {e}")
            return None
    
    async def get_vendor_bookings(self, vendor_id: str, date: str = None) -> List[Dict[str, Any]]:
        """Get bookings for vendor"""
        try:
            bookings = []
            query = self.db.collection('bookings').where('vendor_id', '==', vendor_id)
            
            if date:
                query = query.where('date', '==', date)
            
            docs = query.stream()
            for doc in docs:
                booking_data = doc.to_dict()
                booking_data['id'] = doc.id
                bookings.append(booking_data)
            
            return sorted(bookings, key=lambda x: x.get('created_at', ''), reverse=True)
        except Exception as e:
            logger.error(f"Error getting vendor bookings: {e}")
            return []
    
    # ============================================================================
    # CONVERSATION STATE OPERATIONS
    # ============================================================================
    
    async def get_conversation_state(self, phone_number: str) -> Dict[str, Any]:
        """Get conversation state for phone number"""
        try:
            doc = self.db.collection('conversation_states').document(phone_number).get()
            if doc.exists:
                return doc.to_dict()
            return {
                'phone_number': phone_number,
                'state': 'greeting',
                'context': {},
                'history': [],
                'created_at': firestore.SERVER_TIMESTAMP
            }
        except Exception as e:
            logger.error(f"Error getting conversation state: {e}")
            return {'state': 'greeting', 'context': {}, 'history': []}
    
    async def update_conversation_state(self, phone_number: str, state_data: Dict[str, Any]) -> bool:
        """Update conversation state"""
        try:
            doc_ref = self.db.collection('conversation_states').document(phone_number)
            doc_ref.set(state_data, merge=True)
            return True
        except Exception as e:
            logger.error(f"Error updating conversation state: {e}")
            return False
    
    # ============================================================================
    # SLOT MANAGEMENT (for vendors)
    # ============================================================================
    
    async def create_availability_slots(self, vendor_id: str, date: str, slots: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create availability slots for vendor"""
        try:
            created_count = 0
            for slot_data in slots:
                slot_doc = {
                    'vendor_id': vendor_id,
                    'slot_date': date,
                    'slot_time': slot_data['time'],
                    'price': slot_data.get('price', 0.0),
                    'status': 'available',
                    'created_at': firestore.SERVER_TIMESTAMP
                }
                self.db.collection('availability_slots').add(slot_doc)
                created_count += 1
            
            logger.info(f"Created {created_count} slots for vendor {vendor_id}")
            return {'success': True, 'created_count': created_count}
        except Exception as e:
            logger.error(f"Error creating slots: {e}")
            return {'success': False, 'error': str(e)}


# Global Firestore instance
firestore_db = FirestoreDB()
