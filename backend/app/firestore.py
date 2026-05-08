"""
Firestore Database Connection
Simplified database layer using Firestore instead of PostgreSQL
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from google.cloud import firestore
from app.config import settings
import json
import os

logger = logging.getLogger(__name__)


def _slot_date_to_str(val: Any) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, str):
        return val[:10] if len(val) >= 10 else val
    if hasattr(val, 'strftime'):
        try:
            return val.strftime('%Y-%m-%d')
        except Exception:
            return None
    s = str(val)
    return s[:10] if len(s) >= 10 else s


class FirestoreDB:
    """Firestore database connection and operations"""
    
    def __init__(self):
        """Initialize Firestore client"""
        try:
            # Use Railway/Render environment variable if available
            if settings.GOOGLE_APPLICATION_CREDENTIALS and settings.GOOGLE_APPLICATION_CREDENTIALS.strip():
                # Railway/Render provides JSON content directly
                import json
                import tempfile
                
                cred_content = settings.GOOGLE_APPLICATION_CREDENTIALS.strip()
                
                # Try to parse as JSON first (Handle Render's raw JSON string)
                if cred_content.startswith('{'):
                    try:
                        creds_data = json.loads(cred_content)
                        # Create temporary file with credentials
                        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                            json.dump(creds_data, f)
                            temp_file = f.name
                        
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file
                        logger.info("✅ Using Render/Railway Firestore credentials from env var")
                    except json.JSONDecodeError as je:
                        logger.error(f"❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS JSON: {je}")
                        # Fallback: Maybe it's a path that starts with { (unlikely) or just malformed
                        if os.path.exists(cred_content):
                             os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = cred_content
                else:
                    # It's likely a file path
                    if os.path.exists(cred_content):
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = cred_content
                        logger.info(f"✅ Using Firestore credentials from path in env var: {cred_content}")
                    else:
                        logger.warning(f"⚠️ GOOGLE_APPLICATION_CREDENTIALS is set but file not found: {cred_content}")

            else:
                # Fallback to file path - resolve relative to config file location
                creds_file = settings.FIRESTORE_CREDENTIALS_FILE
                if not os.path.isabs(creds_file):
                    # If relative path, resolve from backend directory
                    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    creds_file = os.path.join(backend_dir, 'credentials', 'firestore-service-account.json')
                
                print(f"DEBUG: Resolved usage credentials file path: {creds_file}")
                if os.path.exists(creds_file):
                    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_file
                    print(f"DEBUG: Using Firestore credentials from file: {creds_file}")
                else:
                    # Don't raise error, just log warning. App should start even if DB fails.
                    logger.warning(f"⚠️ Firestore credentials file not found at: {creds_file}")
                    # Try alternative path
                    alt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'credentials', 'firestore-service-account.json')
                    if os.path.exists(alt_path):
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = alt_path
                        logger.info(f"Using Firestore credentials from alternative path: {alt_path}")
            
            # Initialize Firestore client
            # Check if creds are actually set before initializing
            if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
                print(f"DEBUG: Initializing Firestore Client with project {settings.FIRESTORE_PROJECT_ID}...")
                self.db = firestore.Client(project=settings.FIRESTORE_PROJECT_ID)
                print("DEBUG: Firestore client initialized successfully")
            else:
                logger.error("❌ GOOGLE_APPLICATION_CREDENTIALS not set. Firestore will be disabled.")
                self.db = None
                
        except Exception as e:
            print(f"DEBUG: Failed to initialize Firestore: {e}")
            logger.error(f"❌ Failed to initialize Firestore: {e}")
            # Don't raise - allow app to start without Firestore
            self.db = None
    
    def reconnect(self):
        """Force a recreation of the gRPC client to fix stale connections"""
        try:
            logger.warning("Reconnecting Firestore Client to clear stale gRPC channels...")
            if self.db:
                try:
                    self.db.close()
                except Exception:
                    pass
            self.db = firestore.Client(project=settings.FIRESTORE_PROJECT_ID)
            logger.info("Firestore client reconnected successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to reconnect Firestore: {e}")
            return False
    
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
        """Get bookings for vendor — returns clean, display-ready data."""
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            import pytz
            from datetime import datetime, timedelta

            KARACHI_TZ = pytz.timezone('Asia/Karachi')
            booking_statuses = (
                'locked', 'pending', 'confirmed', 'completed', 'cancelled', 'blocked',
            )
            history_cutoff = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

            def fetch_all_booking_slot_docs():
                acc = []
                for st in booking_statuses:
                    q = self.db.collection('slots')\
                        .where(filter=FieldFilter('vendor_id', '==', vendor_id))\
                        .where(filter=FieldFilter('status', '==', st))
                    acc.extend(list(q.stream()))
                return acc

            all_docs = await asyncio.to_thread(fetch_all_booking_slot_docs)
            seen_ids = set()
            raw: List[Dict[str, Any]] = []
            for doc in all_docs:
                if doc.id in seen_ids:
                    continue
                seen_ids.add(doc.id)
                booking_data = doc.to_dict()
                booking_data['id'] = doc.id

                start = booking_data.get('start_time')
                if start and hasattr(start, 'astimezone'):
                    try:
                        start_khi = start.astimezone(KARACHI_TZ)
                        if not _slot_date_to_str(booking_data.get('date')):
                            booking_data['date'] = start_khi.strftime('%Y-%m-%d')
                        booking_data['time'] = start_khi.strftime('%I:%M %p')
                    except Exception:
                        booking_data['time'] = str(start)
                elif isinstance(start, str):
                    booking_data['time'] = start

                slot_date = _slot_date_to_str(booking_data.get('date'))
                if slot_date:
                    booking_data['date'] = slot_date

                if date:
                    want = date[:10] if len(date) >= 10 else date
                    if slot_date != want:
                        continue
                elif slot_date and slot_date < history_cutoff:
                    continue

                raw.append(booking_data)

            logger.info(
                "get_vendor_bookings vendor_id=%s date=%s raw_count=%d",
                vendor_id, date, len(raw),
            )

            user_ids = set()
            payment_ids = set()
            for b in raw:
                if not b.get('customer_name') and b.get('user_id'):
                    user_ids.add(b['user_id'])
                pid = b.get('payment_id')
                if pid:
                    payment_ids.add(pid)

            def batch_get_map(coll: str, ids: set) -> Dict[str, Dict]:
                out: Dict[str, Dict] = {}
                if not ids:
                    return out
                refs = [self.db.collection(coll).document(i) for i in ids]
                chunk = 10
                for i in range(0, len(refs), chunk):
                    for snap in self.db.get_all(refs[i:i + chunk]):
                        if snap.exists:
                            out[snap.id] = snap.to_dict() or {}
                return out

            users_map = await asyncio.to_thread(batch_get_map, 'users', user_ids)
            pays_map = await asyncio.to_thread(batch_get_map, 'payments', payment_ids)

            bookings = []
            for booking_data in raw:
                if not booking_data.get('customer_name'):
                    uid = booking_data.get('user_id')
                    if uid and uid in users_map:
                        u = users_map[uid]
                        booking_data['customer_name'] = (
                            u.get('name') or u.get('full_name') or
                            u.get('display_name') or u.get('phone_number') or
                            'Customer'
                        )

                pid = booking_data.get('payment_id')
                if pid and pid in pays_map:
                    booking_data['payment'] = pays_map[pid]

                bookings.append(booking_data)

            def _sort_key(b):
                return (b.get('date') or '0000-00-00', b.get('time') or '00:00 AM')

            return sorted(bookings, key=_sort_key, reverse=True)

        except Exception as e:
            import traceback
            logger.error(f"Error getting vendor bookings: {e}\n{traceback.format_exc()}")
            return []
    
    async def get_vendor_booking_single(self, vendor_id: str, booking_id: str) -> Optional[Dict[str, Any]]:
        """Get a single booking by ID for a vendor - optimized single document fetch"""
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            import pytz
            
            KARACHI_TZ = pytz.timezone('Asia/Karachi')
            
            # Fetch single document by ID
            doc = self.db.collection('slots').document(booking_id).get()
            
            if not doc.exists:
                return None
            
            booking_data = doc.to_dict()
            booking_data['id'] = doc.id
            
            # Verify this booking belongs to the vendor
            if booking_data.get('vendor_id') != vendor_id:
                logger.warning(f"Booking {booking_id} does not belong to vendor {vendor_id}")
                return None
            
            # Verify it's a valid booking status
            valid_statuses = ['locked', 'pending', 'confirmed', 'completed', 'cancelled', 'blocked']
            if booking_data.get('status') not in valid_statuses:
                return None
            
            # Derive human-readable PKT time string
            start_time = booking_data.get('start_time')
            if start_time and hasattr(start_time, 'astimezone'):
                try:
                    start_khi = start_time.astimezone(KARACHI_TZ)
                    booking_data['time'] = start_khi.strftime('%I:%M %p')
                    if not booking_data.get('date'):
                        booking_data['date'] = start_khi.strftime('%Y-%m-%d')
                except Exception:
                    booking_data['time'] = str(start_time)
            elif isinstance(start_time, str):
                booking_data['time'] = start_time
            
            # Get customer name if not present
            if not booking_data.get('customer_name'):
                user_id = booking_data.get('user_id')
                if user_id:
                    try:
                        user_doc = self.db.collection('users').document(user_id).get()
                        if user_doc.exists:
                            u = user_doc.to_dict()
                            booking_data['customer_name'] = (
                                u.get('name') or u.get('full_name') or
                                u.get('display_name') or u.get('phone_number') or
                                'Customer'
                            )
                    except Exception:
                        pass
            
            # Hydrate payment screenshot if linked
            payment_id = booking_data.get('payment_id')
            if payment_id:
                try:
                    payment_doc = self.db.collection('payments').document(payment_id).get()
                    if payment_doc.exists:
                        booking_data['payment'] = payment_doc.to_dict()
                except Exception:
                    pass
            
            return booking_data
            
        except Exception as e:
            logger.error(f"Error getting single booking {booking_id}: {e}")
            return None
    
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
        """Deprecated old-schema helper. Use database.seed.smart_reseed."""
        logger.warning(
            "Deprecated create_availability_slots called for vendor=%s date=%s; "
            "not writing old availability_slots data.",
            vendor_id,
            date,
        )
        return {
            "success": False,
            "error": "Deprecated helper. Use smart_reseed for canonical slot creation.",
        }


# Global Firestore instance
firestore_db = FirestoreDB()
