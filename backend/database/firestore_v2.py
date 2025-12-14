"""
Firestore Database Operations V2
New database layer using the redesigned schema with proper slot management
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from google.cloud import firestore

from database.schema import (
    Collections, SlotStatus, PaymentStatus, UserRole,
    SportType, PriceTier, HOLD_EXPIRY_MINUTES
)

logger = logging.getLogger(__name__)


class FirestoreV2:
    def __init__(self, db_client: firestore.Client):
        self.db = db_client
        logger.info("FirestoreV2 initialized")
    
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.db.collection(Collections.USERS).document(user_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None
    
    async def get_user_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        try:
            docs = self.db.collection(Collections.USERS).where('phone', '==', phone).limit(1).stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error getting user by phone {phone}: {e}")
            return None
    
    async def create_user(self, user_data: Dict[str, Any]) -> Optional[str]:
        try:
            user_doc = {
                'phone': user_data.get('phone'),
                'name': user_data.get('name', ''),
                'email': user_data.get('email', ''),
                'role': user_data.get('role', UserRole.CUSTOMER.value),
                'vendor_id': user_data.get('vendor_id'),
                'created_at': firestore.SERVER_TIMESTAMP
            }
            
            if 'password_hash' in user_data:
                user_doc['password_hash'] = user_data['password_hash']
            
            if 'id' in user_data:
                self.db.collection(Collections.USERS).document(user_data['id']).set(user_doc)
                return user_data['id']
            else:
                doc_ref = self.db.collection(Collections.USERS).add(user_doc)
                return doc_ref[1].id
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    async def get_or_create_user_by_phone(self, phone: str, name: str = '') -> Dict[str, Any]:
        user = await self.get_user_by_phone(phone)
        if user:
            return user
        
        user_id = await self.create_user({'phone': phone, 'name': name})
        return await self.get_user(user_id)
    
    
    async def get_vendor(self, vendor_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.db.collection(Collections.VENDORS).document(vendor_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error getting vendor {vendor_id}: {e}")
            return None
    
    async def get_vendors_by_area(self, area: str) -> List[Dict[str, Any]]:
        try:
            vendors = []
            docs = self.db.collection(Collections.VENDORS).where('area', '==', area).stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                vendors.append(data)
            return vendors
        except Exception as e:
            logger.error(f"Error getting vendors by area: {e}")
            return []
    
    async def get_vendors_by_sport(self, sport_type: str) -> List[Dict[str, Any]]:
        try:
            services = self.db.collection(Collections.SERVICES).where('sport_type', '==', sport_type).stream()
            vendor_ids = set()
            for doc in services:
                vendor_ids.add(doc.to_dict().get('vendor_id'))
            
            vendors = []
            for vid in vendor_ids:
                vendor = await self.get_vendor(vid)
                if vendor:
                    vendors.append(vendor)
            return vendors
        except Exception as e:
            logger.error(f"Error getting vendors by sport: {e}")
            return []
    
    async def get_all_vendors(self) -> List[Dict[str, Any]]:
        try:
            vendors = []
            docs = self.db.collection(Collections.VENDORS).stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                vendors.append(data)
            return vendors
        except Exception as e:
            logger.error(f"Error getting all vendors: {e}")
            return []
    
    
    async def get_vendor_resources(self, vendor_id: str) -> List[Dict[str, Any]]:
        try:
            resources = []
            docs = self.db.collection(Collections.RESOURCES).where('vendor_id', '==', vendor_id).where('active', '==', True).stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                resources.append(data)
            return resources
        except Exception as e:
            logger.error(f"Error getting resources for vendor {vendor_id}: {e}")
            return []
    
    async def get_resource(self, resource_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.db.collection(Collections.RESOURCES).document(resource_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error getting resource {resource_id}: {e}")
            return None
    
    
    async def get_vendor_services(self, vendor_id: str) -> List[Dict[str, Any]]:
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            services = []
            docs = self.db.collection(Collections.SERVICES)\
                .where(filter=FieldFilter('vendor_id', '==', vendor_id))\
                .where(filter=FieldFilter('active', '==', True))\
                .stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                services.append(data)
            return services
        except Exception as e:
            logger.error(f"Error getting services for vendor {vendor_id}: {e}")
            return []
    
    async def get_service(self, service_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.db.collection(Collections.SERVICES).document(service_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error getting service {service_id}: {e}")
            return None
    
    async def get_services_by_sport(self, sport_type: str) -> List[Dict[str, Any]]:
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            services = []
            docs = self.db.collection(Collections.SERVICES)\
                .where(filter=FieldFilter('sport_type', '==', sport_type))\
                .where(filter=FieldFilter('active', '==', True))\
                .stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                services.append(data)
            return services
        except Exception as e:
            logger.error(f"Error getting services by sport: {e}")
            return []
    
    
    async def get_available_slots(self, vendor_id: str, date: str) -> List[Dict[str, Any]]:
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            slots = []
            docs = self.db.collection(Collections.SLOTS)\
                .where(filter=FieldFilter('vendor_id', '==', vendor_id))\
                .where(filter=FieldFilter('date', '==', date))\
                .where(filter=FieldFilter('status', '==', SlotStatus.AVAILABLE.value))\
                .stream()
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                
                # Normalize: extract time string from start_time timestamp
                if 'start_time' in data and data['start_time']:
                    try:
                        start_ts = data['start_time']
                        if hasattr(start_ts, 'strftime'):
                            data['time'] = start_ts.strftime('%H:%M')
                    except:
                        pass
                
                slots.append(data)
            
            return sorted(slots, key=lambda x: x.get('start_time', datetime.min))
        except Exception as e:
            logger.error(f"Error getting available slots: {e}")
            return []
    
    async def get_slot(self, slot_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.db.collection(Collections.SLOTS).document(slot_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error getting slot {slot_id}: {e}")
            return None
    
    async def get_slots_by_resource(self, resource_id: str, date: str) -> List[Dict[str, Any]]:
        try:
            slots = []
            docs = self.db.collection(Collections.SLOTS)\
                .where('resource_id', '==', resource_id)\
                .where('date', '==', date)\
                .stream()
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                slots.append(data)
            
            return sorted(slots, key=lambda x: x.get('start_time', datetime.min))
        except Exception as e:
            logger.error(f"Error getting slots by resource: {e}")
            return []
    
    async def get_vendor_bookings(self, vendor_id: str, date: str = None, status: str = None) -> List[Dict[str, Any]]:
        try:
            query = self.db.collection(Collections.SLOTS).where('vendor_id', '==', vendor_id)
            
            if date:
                query = query.where('date', '==', date)
            
            if status:
                query = query.where('status', '==', status)
            else:
                query = query.where('status', 'in', [
                    SlotStatus.LOCKED.value,
                    SlotStatus.PENDING.value,
                    SlotStatus.CONFIRMED.value
                ])
            
            slots = []
            docs = query.stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                slots.append(data)
            
            return sorted(slots, key=lambda x: x.get('start_time', datetime.min))
        except Exception as e:
            logger.error(f"Error getting vendor bookings: {e}")
            return []
    
    async def get_user_bookings(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            slots = []
            docs = self.db.collection(Collections.SLOTS)\
                .where('user_id', '==', user_id)\
                .where('status', 'in', [
                    SlotStatus.LOCKED.value,
                    SlotStatus.PENDING.value,
                    SlotStatus.CONFIRMED.value,
                    SlotStatus.CANCELLED.value
                ])\
                .stream()
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                slots.append(data)
            
            return sorted(slots, key=lambda x: x.get('start_time', datetime.min), reverse=True)
        except Exception as e:
            logger.error(f"Error getting user bookings: {e}")
            return []
    
    
    async def create_payment(self, payment_data: Dict[str, Any]) -> Optional[str]:
        try:
            payment_doc = {
                'slot_id': payment_data.get('slot_id'),
                'user_id': payment_data.get('user_id'),
                'vendor_id': payment_data.get('vendor_id'),
                'screenshot_url': payment_data.get('screenshot_url'),
                'amount_claimed': payment_data.get('amount_claimed'),
                'ocr_verified_amount': payment_data.get('ocr_verified_amount'),
                'status': payment_data.get('status', PaymentStatus.UPLOADED.value),
                'created_at': firestore.SERVER_TIMESTAMP
            }
            
            doc_ref = self.db.collection(Collections.PAYMENTS).add(payment_doc)
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Error creating payment: {e}")
            return None
    
    async def get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.db.collection(Collections.PAYMENTS).document(payment_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error getting payment {payment_id}: {e}")
            return None
    
    async def update_payment_status(self, payment_id: str, status: str, ocr_amount: float = None) -> bool:
        try:
            update_data = {
                'status': status,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            if ocr_amount is not None:
                update_data['ocr_verified_amount'] = ocr_amount
            
            self.db.collection(Collections.PAYMENTS).document(payment_id).update(update_data)
            return True
        except Exception as e:
            logger.error(f"Error updating payment status: {e}")
            return False
    
    
    async def get_vendor_payment_accounts(self, vendor_id: str) -> List[Dict[str, Any]]:
        try:
            accounts = []
            docs = self.db.collection(Collections.VENDOR_PAYMENT_ACCOUNTS)\
                .where('vendor_id', '==', vendor_id)\
                .stream()
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                accounts.append(data)
            
            return sorted(accounts, key=lambda x: x.get('is_default', False), reverse=True)
        except Exception as e:
            logger.error(f"Error getting vendor payment accounts: {e}")
            return []
    
    async def get_vendor_default_payment(self, vendor_id: str) -> Optional[Dict[str, Any]]:
        try:
            docs = self.db.collection(Collections.VENDOR_PAYMENT_ACCOUNTS)\
                .where('vendor_id', '==', vendor_id)\
                .where('is_default', '==', True)\
                .limit(1)\
                .stream()
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error getting default payment account: {e}")
            return None
    
    
    async def get_conversation_state(self, phone: str, vendor_id: str) -> Dict[str, Any]:
        try:
            doc_id = f"{phone}_{vendor_id}"
            doc = self.db.collection(Collections.CONVERSATION_STATES).document(doc_id).get()
            if doc.exists:
                return doc.to_dict()
            return {
                'phone': phone,
                'vendor_id': vendor_id,
                'state': 'greeting',
                'current_slot_id': None,
                'hold_expires_at': None,
                'history': []
            }
        except Exception as e:
            logger.error(f"Error getting conversation state: {e}")
            return {'state': 'greeting', 'history': []}
    
    async def update_conversation_state(self, phone: str, vendor_id: str, state_data: Dict[str, Any]) -> bool:
        try:
            doc_id = f"{phone}_{vendor_id}"
            state_data['updated_at'] = firestore.SERVER_TIMESTAMP
            self.db.collection(Collections.CONVERSATION_STATES).document(doc_id).set(state_data, merge=True)
            return True
        except Exception as e:
            logger.error(f"Error updating conversation state: {e}")
            return False
    
    
    async def get_vendor_stats_today(self, vendor_id: str) -> Dict[str, Any]:
        today = datetime.now().strftime("%Y-%m-%d")
        
        bookings = await self.get_vendor_bookings(vendor_id, date=today, status=SlotStatus.CONFIRMED.value)
        
        total_revenue = sum(slot.get('price', 0) for slot in bookings)
        
        return {
            'date': today,
            'bookings_count': len(bookings),
            'revenue': total_revenue
        }
