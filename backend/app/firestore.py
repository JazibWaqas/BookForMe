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
            # Use Railway environment variable if available, otherwise use file
            if settings.GOOGLE_APPLICATION_CREDENTIALS:
                # Railway provides JSON content directly
                import json
                import tempfile
                
                # Create temporary file with credentials
                creds_data = json.loads(settings.GOOGLE_APPLICATION_CREDENTIALS)
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    json.dump(creds_data, f)
                    temp_file = f.name
                
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file
                logger.info("Using Railway Firestore credentials from environment variable")
            else:
                # Fallback to file path - resolve relative to config file location
                creds_file = settings.FIRESTORE_CREDENTIALS_FILE
                if not os.path.isabs(creds_file):
                    # If relative path, resolve from backend directory
                    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    creds_file = os.path.join(backend_dir, 'credentials', 'firestore-service-account.json')
                
                if os.path.exists(creds_file):
                    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_file
                    logger.info(f"Using Firestore credentials from file: {creds_file}")
                else:
                    logger.warning(f"Firestore credentials file not found at: {creds_file}")
                    # Try alternative path
                    alt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'credentials', 'firestore-service-account.json')
                    if os.path.exists(alt_path):
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = alt_path
                        logger.info(f"Using Firestore credentials from alternative path: {alt_path}")
                    else:
                        raise FileNotFoundError(f"Firestore credentials file not found. Tried: {creds_file} and {alt_path}")
            
            # Initialize Firestore client
            self.db = firestore.Client(project=settings.FIRESTORE_PROJECT_ID)
            logger.info("Firestore client initialized successfully")
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
        """Get available slots for vendor on specific date with optimized batch queries"""
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            
            # Query slots
            query = self.db.collection('slots')\
                .where(filter=FieldFilter('vendor_id', '==', vendor_id))\
                .where(filter=FieldFilter('date', '==', date))\
                .where(filter=FieldFilter('status', '==', 'available'))
            
            docs = query.stream()
            slots = []
            resource_ids = set()
            service_ids = set()
            
            # First pass: collect all slot data and unique IDs
            for doc in docs:
                slot_data = doc.to_dict()
                slot_data['id'] = doc.id
                slots.append(slot_data)
                
                if 'resource_id' in slot_data and slot_data['resource_id']:
                    resource_ids.add(slot_data['resource_id'])
                if 'service_id' in slot_data and slot_data['service_id']:
                    service_ids.add(slot_data['service_id'])
            
            # Batch fetch all resources (single query per resource)
            resources_map = {}
            for resource_id in resource_ids:
                try:
                    resource_doc = self.db.collection('resources').document(resource_id).get()
                    if resource_doc.exists:
                        resource_data = resource_doc.to_dict()
                        resources_map[resource_id] = resource_data.get('resource_name', f"Court {resource_id}")
                except Exception as e:
                    logger.warning(f"Could not fetch resource {resource_id}: {e}")
                    resources_map[resource_id] = f"Court {resource_id}"
            
            # Batch fetch all services (single query per service)
            services_map = {}
            for service_id in service_ids:
                try:
                    service_doc = self.db.collection('services').document(service_id).get()
                    if service_doc.exists:
                        service_data = service_doc.to_dict()
                        services_map[service_id] = service_data.get('service_name', 'Court Rental')
                except Exception as e:
                    logger.warning(f"Could not fetch service {service_id}: {e}")
                    services_map[service_id] = 'Court Rental'
            
            # Second pass: enrich slots with resource and service names from maps
            for slot_data in slots:
                if 'resource_id' in slot_data and slot_data['resource_id']:
                    slot_data['resource_name'] = resources_map.get(slot_data['resource_id'], f"Court {slot_data['resource_id']}")
                
                if 'service_id' in slot_data and slot_data['service_id']:
                    slot_data['service_name'] = services_map.get(slot_data['service_id'], 'Court Rental')
                
                # Normalize time field
                if 'start_time' in slot_data and slot_data['start_time']:
                    try:
                        start_ts = slot_data['start_time']
                        if hasattr(start_ts, 'strftime'):
                            slot_data['slot_time'] = start_ts.strftime('%H:%M')
                        else:
                            slot_data['slot_time'] = str(start_ts)
                    except:
                        pass
            
            # Sort by start_time
            return sorted(slots, key=lambda x: x.get('slot_time', x.get('start_time', '')))
        except Exception as e:
            logger.error(f"Error getting available slots: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
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
            from google.cloud.firestore_v1.base_query import FieldFilter
            from datetime import datetime as dt
            
            logger.info(f"🔧 [book_slot] Attempting to book: vendor={vendor_id}, date={date}, time={time}")
            
            # First, find matching slot by querying the slots collection
            # Query by vendor_id, date, and status
            query = self.db.collection('slots')\
                .where(filter=FieldFilter('vendor_id', '==', vendor_id))\
                .where(filter=FieldFilter('date', '==', date))\
                .where(filter=FieldFilter('status', '==', 'available'))
            
            docs = list(query.stream())
            logger.info(f"📊 [book_slot] Found {len(docs)} available slots for vendor={vendor_id}, date={date}")
            
            # Log all available slot times for debugging
            available_times = []
            for doc in docs:
                slot_data = doc.to_dict()
                slot_start_time = slot_data.get('start_time')
                
                # Extract time from timestamp
                if slot_start_time and hasattr(slot_start_time, 'strftime'):
                    slot_time_str = slot_start_time.strftime('%H:%M')
                else:
                    slot_time_str = str(slot_start_time) if slot_start_time else ''
                
                available_times.append(slot_time_str)
                logger.info(f"   Available slot: {slot_time_str} (slot_id: {doc.id}, status: {slot_data.get('status', 'unknown')})")
            
            logger.info(f"📋 [book_slot] All available times: {available_times}")
            logger.info(f"🔍 [book_slot] Looking for time: '{time}'")
            
            # Find the slot that matches the requested time
            matching_slot = None
            for doc in docs:
                slot_data = doc.to_dict()
                slot_start_time = slot_data.get('start_time')
                
                # Extract time from timestamp
                if slot_start_time and hasattr(slot_start_time, 'strftime'):
                    slot_time_str = slot_start_time.strftime('%H:%M')
                else:
                    slot_time_str = str(slot_start_time) if slot_start_time else ''
                
                # Compare times (exact match)
                if slot_time_str == time:
                    matching_slot = doc
                    logger.info(f"   ✅ Found matching slot: {doc.id} at {slot_time_str}")
                    break
            
            if not matching_slot:
                logger.warning(f"❌ [book_slot] No slot found for time: {time}")
                logger.warning(f"   Available times were: {available_times}")
                logger.warning(f"   Requested time format: '{time}' (type: {type(time).__name__})")
                return {'success': False, 'error': f'No slot available at {time}. Available times: {", ".join(available_times) if available_times else "none"}'}
            
            # Use transaction to prevent double-booking
            @firestore.transactional
            def book_transaction(transaction):
                slot_ref = matching_slot.reference
                slot_doc = slot_ref.get(transaction=transaction)
                
                if not slot_doc.exists:
                    return {'success': False, 'error': 'Slot not found'}
                
                slot_data = slot_doc.to_dict()
                current_status = slot_data.get('status')
                
                # Only book if slot is still available
                if current_status != 'available':
                    logger.warning(f"❌ Slot {matching_slot.id} is not available (status: {current_status})")
                    return {'success': False, 'error': f'Slot is no longer available (current status: {current_status})'}
                
                # Update slot to confirmed status with customer info
                # No separate bookings collection - the slot IS the booking
                transaction.update(slot_ref, {
                    'status': 'confirmed',  # Direct to confirmed (skipping payment)
                    'user_id': customer_info.get('phone', ''),
                    'customer_name': customer_info.get('name', 'Unknown'),
                    'customer_phone': customer_info.get('phone', ''),
                    'booking_source': customer_info.get('booking_source', 'whatsapp'),
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
                
                logger.info(f"✅ [book_slot] Slot {matching_slot.id} confirmed for {customer_info.get('phone', '')}")
                return {'success': True, 'booking_id': matching_slot.id, 'slot_id': matching_slot.id}
            
            # Execute transaction
            transaction = self.db.transaction()
            result = book_transaction(transaction)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ [book_slot] Error booking slot: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {'success': False, 'error': f'Booking failed: {str(e)}'}
    
    # ============================================================================
    # BOOKING OPERATIONS
    # ============================================================================
    
    async def get_booking(self, booking_id: str) -> Optional[Dict[str, Any]]:
        """Get booking by ID - bookings are confirmed slots"""
        try:
            # Bookings are slots with status 'confirmed'
            doc = self.db.collection('slots').document(booking_id).get()
            if doc.exists:
                booking_data = doc.to_dict()
                booking_data['id'] = doc.id
                # Only return if it's a confirmed booking
                if booking_data.get('status') in ['confirmed', 'completed']:
                    return booking_data
            return None
        except Exception as e:
            logger.error(f"Error getting booking {booking_id}: {e}")
            return None
    
    async def get_vendor_bookings(self, vendor_id: str, date: str = None) -> List[Dict[str, Any]]:
        """Get bookings for vendor - bookings are confirmed slots"""
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            
            bookings = []
            # Query slots collection for confirmed bookings
            query = self.db.collection('slots')\
                .where(filter=FieldFilter('vendor_id', '==', vendor_id))\
                .where(filter=FieldFilter('status', 'in', ['confirmed', 'completed']))
            
            if date:
                query = query.where(filter=FieldFilter('date', '==', date))
            
            docs = query.stream()
            for doc in docs:
                booking_data = doc.to_dict()
                booking_data['id'] = doc.id
                bookings.append(booking_data)
            
            return sorted(bookings, key=lambda x: x.get('updated_at', ''), reverse=True)
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
