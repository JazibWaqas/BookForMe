"""
REST API Module
Handles REST API endpoints for frontend integration
"""

import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, File, UploadFile, Form
from pydantic import BaseModel
from google.cloud import firestore
from database.availability_service import AvailabilityService
from database.slot_service import SlotService
from database.firestore_v2 import FirestoreV2
from database.auth_service import AuthService
from app.firestore import firestore_db
from app.cache import DataCache, cached
# TEMPORARILY DISABLED: WhatsApp requires GROQ_API_KEY
# from whatsapp.agent import WhatsAppAgent
import os
import uuid
from pathlib import Path
from datetime import timedelta
from database.ai_search_service import AISearchService

logger = logging.getLogger(__name__)

# Create router for REST API endpoints
router = APIRouter(prefix="/api", tags=["REST API"])

# Initialize services
availability_service = AvailabilityService()
slot_service = SlotService(firestore_db.db)
firestore_v2 = FirestoreV2(firestore_db.db)
auth_service = AuthService(firestore_db.db)
# TEMPORARILY DISABLED: WhatsApp requires GROQ_API_KEY
# Initialize AI Agent
# ai_agent = WhatsAppAgent()
ai_search_service = AISearchService()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("../uploads/payments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_current_user_id(authorization: str = Header(None)) -> str:
    """Extract user_id from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = auth_service.verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return payload.get("sub")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


@router.get("/vendors")
async def get_vendors(service_type: Optional[str] = None, category: Optional[str] = None):
    """
    Get list of all vendors from Firestore
    
    Args:
        service_type: Optional filter by sport type (e.g., 'padel', 'futsal', 'cricket', 'pickleball')
        category: Optional filter by sport type (same as service_type)
    
    Returns:
        List of vendors
    """
    try:
        sport_filter = service_type or category
        
        if sport_filter:
            # Filter by sport type - OPTIMIZED: batch fetch vendors
            logger.info(f"Filtering by sport_type: {sport_filter}")
            services = firestore_db.db.collection('services').where('sport_type', '==', sport_filter).stream()
            vendor_ids = set()
            for doc in services:
                vendor_ids.add(doc.to_dict().get('vendor_id'))
            
            logger.info(f"Found {len(vendor_ids)} unique vendor_ids: {vendor_ids}")
            
            # OPTIMIZATION: Batch fetch all vendors in one query using 'in' operator
            # Firestore 'in' supports up to 10 items, so we batch if needed
            vendors = []
            vendor_ids_list = list(vendor_ids)
            
            # Process in batches of 10 (Firestore limitation)
            for i in range(0, len(vendor_ids_list), 10):
                batch_ids = vendor_ids_list[i:i+10]
                vendor_docs = firestore_db.db.collection('vendors').where('__name__', 'in', batch_ids).stream()
                
                for doc in vendor_docs:
                    vendor_data = doc.to_dict()
                    vendor_data['id'] = doc.id
                    vendors.append(vendor_data)
            
            logger.info(f"Returning {len(vendors)} vendors")
        else:
            # Get all vendors
            vendors = []
            docs = firestore_db.db.collection('vendors').stream()
            for doc in docs:
                vendor_data = doc.to_dict()
                vendor_data['id'] = doc.id
                vendors.append(vendor_data)
        
        return {
            "success": True,
            "count": len(vendors),
            "vendors": vendors
        }
        
    except Exception as e:
        logger.error(f"Error getting vendors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get vendors: {str(e)}")


@router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: str):
    """
    Get a single vendor by ID
    
    Args:
        vendor_id: Vendor ID
        
    Returns:
        Vendor details
    """
    try:
        if not firestore_db.db:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
        
        vendor = await firestore_db.get_vendor(vendor_id)
        
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        vendor['id'] = vendor_id
        
        return {
            "success": True,
            "vendor": vendor
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting vendor: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get vendor: {str(e)}")


@router.get("/categories")
async def get_categories():
    """
    Get all service categories
    
    Returns:
        List of categories with vendor counts
    """
    try:
        # Define available categories
        categories = [
            {'id': 'padel', 'name': 'Padel', 'count': 0},
            {'id': 'futsal', 'name': 'Futsal', 'count': 0},
            {'id': 'cricket', 'name': 'Cricket', 'count': 0},
            {'id': 'pickleball', 'name': 'Pickleball', 'count': 0},
        ]
        
        # Count vendors for each category
        for category in categories:
            services = firestore_db.db.collection('services').where('sport_type', '==', category['id']).stream()
            vendor_ids = set()
            for doc in services:
                vendor_ids.add(doc.to_dict().get('vendor_id'))
            category['count'] = len(vendor_ids)
        
        return {
            "success": True,
            "categories": categories
        }
        
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")


@router.get("/sport-courts")
async def get_sport_courts():
    """
    Get all sport courts (padel, tennis, pickleball, table_tennis, futsal)
    
    Returns:
        List of sport court vendors
    """
    try:
        if not firestore_db.db:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
        
        sport_types = ['padel', 'tennis', 'pickleball', 'table_tennis', 'futsal']
        all_sport_courts = []
        
        for sport_type in sport_types:
            vendors = await firestore_db.get_vendors_by_service(sport_type)
            all_sport_courts.extend(vendors)
        
        logger.info(f"Retrieved {len(all_sport_courts)} sport courts from Firestore")
        
        return {
            "success": True,
            "count": len(all_sport_courts),
            "sport_courts": all_sport_courts
        }
        
    except Exception as e:
        logger.error(f"Error getting sport courts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get sport courts: {str(e)}")


@router.get("/vendors/{vendor_id}/availability")
async def get_vendor_availability(vendor_id: str, date: str):
    """
    Get available time slots for a vendor on a specific date
    
    Args:
        vendor_id: Vendor ID
        date: Date in YYYY-MM-DD format
        
    Returns:
        List of available time slots
    """
    try:
        logger.info(f"Getting availability for vendor {vendor_id} on {date}")
        
        # Get available slots
        slots = await availability_service.get_available_slots(vendor_id, date)
        
        return {
            "success": True,
            "vendor_id": vendor_id,
            "date": date,
            "available_slots": slots
        }
        
    except Exception as e:
        logger.error(f"Error getting availability: {e}")
        raise HTTPException(status_code=500, detail="Failed to get availability")


@router.post("/bookings")
async def create_booking(booking_data: dict):
    """
    Create a new booking via frontend
    
    Args:
        booking_data: Booking information
        
    Returns:
        Booking confirmation
    """
    try:
        logger.info(f"Creating booking: {booking_data}")
        
        # Extract booking details
        vendor_id = booking_data.get('vendor_id')
        date = booking_data.get('date')
        time = booking_data.get('time')
        customer_info = {
            'name': booking_data.get('customer_name', ''),
            'phone': booking_data.get('customer_phone', '')
        }
        
        # Create booking
        result = await availability_service.check_and_book_slot(
            vendor_id, date, time, customer_info
        )
        
        if result['success']:
            return {
                "success": True,
                "booking_id": result['booking_id'],
                "message": "Booking created successfully"
            }
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logger.error(f"Error creating booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to create booking")


@router.get("/vendors/{vendor_id}/bookings")
async def get_vendor_bookings(vendor_id: str, date: str = None):
    """
    Get bookings for a vendor
    
    Args:
        vendor_id: Vendor ID
        date: Optional date filter (YYYY-MM-DD)
        
    Returns:
        List of bookings
    """
    try:
        logger.info(f"Getting bookings for vendor {vendor_id}")
        
        # Get bookings from Firestore
        bookings = await firestore_db.get_vendor_bookings(vendor_id, date)
        
        return {
            "success": True,
            "vendor_id": vendor_id,
            "date": date,
            "bookings": bookings
        }
        
    except Exception as e:
        logger.error(f"Error getting bookings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get bookings")


@router.get("/vendors/{vendor_id}/schedule")
async def get_vendor_schedule(vendor_id: str, start_date: str, end_date: str):
    """
    Get vendor's schedule for a date range
    
    Args:
        vendor_id: Vendor ID
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        
    Returns:
        Schedule data
    """
    try:
        logger.info(f"Getting schedule for vendor {vendor_id} from {start_date} to {end_date}")
        
        # Get schedule
        schedule = await availability_service.get_vendor_schedule(
            vendor_id, start_date, end_date
        )
        
        return schedule
        
    except Exception as e:
        logger.error(f"Error getting schedule: {e}")
        raise HTTPException(status_code=500, detail="Failed to get schedule")


@router.post("/vendors")
async def create_vendor(vendor_data: dict):
    """
    Create a new vendor
    
    Args:
        vendor_data: Vendor information
        
    Returns:
        Vendor creation result
    """
    try:
        logger.info(f"Creating vendor: {vendor_data.get('business_name')}")
        
        vendor_id = vendor_data.get('user_id') or vendor_data.get('id')
        if not vendor_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        # Remove id from data if present (we'll use it as document ID)
        vendor_doc = {k: v for k, v in vendor_data.items() if k != 'id'}
        vendor_doc['created_at'] = firestore.SERVER_TIMESTAMP
        
        # Create vendor document
        firestore_db.db.collection('vendors').document(vendor_id).set(vendor_doc)
        
        logger.info(f"Vendor created: {vendor_id}")
        
        return {
            "success": True,
            "vendor_id": vendor_id,
            "message": "Vendor created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating vendor: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create vendor: {str(e)}")


@router.post("/vendors/{vendor_id}/slots")
async def create_availability_slots(vendor_id: str, date: str, slots: List[Dict[str, Any]]):
    """
    Create availability slots for a vendor
    
    Args:
        vendor_id: Vendor ID
        date: Date in YYYY-MM-DD format
        slots: List of slot data
        
    Returns:
        Creation result
    """
    try:
        logger.info(f"Creating slots for vendor {vendor_id} on {date}")
        
        # Create slots
        result = await availability_service.create_availability_slots(
            vendor_id, date, slots
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error creating slots: {e}")
        raise HTTPException(status_code=500, detail="Failed to create slots")


@router.post("/slots/{slot_id}/lock")
async def lock_slot(slot_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Lock a slot for 10 minutes
    
    Args:
        slot_id: Slot ID to lock
        user_id: User ID (from JWT token)
        
    Returns:
        Lock confirmation with expiry time
    """
    try:
        print(f"\n[🔒 X-RAY BACKEND: Locking Slot]")
        print(f"- Slot ID: {slot_id} | User ID: {user_id}")
        logger.info(f"Locking slot {slot_id} for user {user_id}")
        
        result = slot_service.lock_slot(slot_id, user_id, "app")
        print(f"- Lock Core Result: {result}")
        
        if result['success']:
            return {
                "success": True,
                "slot_id": slot_id,
                "expires_in_minutes": result.get('expires_in_minutes', 10),
                "hold_expires_at": result.get('hold_expires_at').isoformat() if result.get('hold_expires_at') else None
            }
        else:
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to lock slot'))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error locking slot: {e}")
        raise HTTPException(status_code=500, detail="Failed to lock slot")


class PaymentRequest(BaseModel):
    slot_id: str
    screenshot_url: str
    amount_claimed: Optional[float] = None


@router.post("/payments/upload")
async def upload_payment_screenshot(
    file: UploadFile = File(...),
    slot_id: str = Form(...),
    amount_claimed: float = Form(...),
    user_id: str = Depends(get_current_user_id)
):
    """
    Upload payment screenshot and create payment record
    
    Args:
        file: Payment screenshot image
        slot_id: Slot ID
        amount_claimed: Amount claimed in payment
        user_id: User ID (from JWT token)
        
    Returns:
        Payment confirmation
    """
    try:
        logger.info(f"Uploading payment screenshot for slot {slot_id} by user {user_id}")
        
        # Validate slot
        slot = await firestore_v2.get_slot(slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        
        if slot.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="This slot is not locked by you")
        
        if slot.get('status') != 'locked':
            raise HTTPException(status_code=400, detail=f"Slot is not locked (current: {slot.get('status')})")
        
        vendor_id = slot.get('vendor_id')
        if not vendor_id:
            raise HTTPException(status_code=400, detail="Slot has no vendor_id")
        
        # Save file
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"{slot_id}_{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Write file to disk
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create relative URL for the file
        screenshot_url = f"/uploads/payments/{unique_filename}"
        
        # Create payment record
        payment_doc = {
            'slot_id': slot_id,
            'user_id': user_id,
            'vendor_id': vendor_id,
            'screenshot_url': screenshot_url,
            'amount_claimed': amount_claimed,
            'status': 'pending',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        payment_ref = firestore_db.db.collection('payments').add(payment_doc)
        payment_id = payment_ref[1].id
        
        # Submit payment
        payment_result = slot_service.submit_payment(slot_id, user_id, payment_id)
        
        if not payment_result['success']:
            # Clean up uploaded file if payment submission fails
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail=payment_result.get('error', 'Failed to submit payment'))
        
        # Confirm booking
        confirm_result = slot_service.confirm_booking(slot_id, vendor_id)
        
        if not confirm_result['success']:
            logger.warning(f"Payment submitted but confirmation failed: {confirm_result.get('error')}")
        
        return {
            "success": True,
            "payment_id": payment_id,
            "slot_id": slot_id,
            "screenshot_url": screenshot_url,
            "status": "confirmed",
            "message": "Payment uploaded and booking confirmed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading payment screenshot: {e}")
        # Clean up file if it was created
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to upload payment: {str(e)}")


@router.post("/payments")
async def submit_payment(payment_data: PaymentRequest, user_id: str = Depends(get_current_user_id)):
    """
    Submit payment screenshot and confirm booking
    
    Args:
        payment_data: Payment information (slot_id, screenshot_url, amount_claimed)
        user_id: User ID (from JWT token)
        
    Returns:
        Payment confirmation
    """
    try:
        print(f"\n[💳 X-RAY BACKEND: Submitting Payment]")
        print(f"- Slot ID: {payment_data.slot_id} | Amount Claimed: {payment_data.amount_claimed}")
        logger.info(f"Submitting payment for slot {payment_data.slot_id} by user {user_id}")
        
        slot = await firestore_v2.get_slot(payment_data.slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        
        if slot.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="This slot is not locked by you")
        
        if slot.get('status') != 'locked':
            raise HTTPException(status_code=400, detail=f"Slot is not locked (current: {slot.get('status')})")
        
        vendor_id = slot.get('vendor_id')
        if not vendor_id:
            raise HTTPException(status_code=400, detail="Slot has no vendor_id")
        
        payment_doc = {
            'slot_id': payment_data.slot_id,
            'user_id': user_id,
            'vendor_id': vendor_id,
            'screenshot_url': payment_data.screenshot_url,
            'amount_claimed': payment_data.amount_claimed,
            'status': 'pending',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        payment_ref = firestore_db.db.collection('payments').add(payment_doc)
        payment_id = payment_ref[1].id
        
        # Submit payment - this changes slot from 'locked' to 'pending'
        payment_result = slot_service.submit_payment(payment_data.slot_id, user_id, payment_id)
        
        if not payment_result['success']:
            raise HTTPException(status_code=400, detail=payment_result.get('error', 'Failed to submit payment'))
        
        # Auto-confirm booking immediately after payment submission
        # In MVP, we auto-confirm. In production, vendor would manually confirm.
        confirm_result = slot_service.confirm_booking(payment_data.slot_id, vendor_id)
        
        final_status = 'pending'  # Default to pending if confirm fails
        if confirm_result['success']:
            final_status = 'confirmed'
            logger.info(f"Payment submitted and booking auto-confirmed for slot {payment_data.slot_id}")
        else:
            logger.warning(f"Payment submitted but auto-confirmation failed: {confirm_result.get('error')}. Status remains 'pending'")
        
        return {
            "success": True,
            "payment_id": payment_id,
            "slot_id": payment_data.slot_id,
            "status": final_status,
            "message": f"Payment submitted and booking {final_status}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit payment")


@router.get("/bookings")
async def get_user_bookings(user_id: str = Depends(get_current_user_id)):
    """
    Get all bookings for the current user (Optimized)
    """
    try:
        print(f"\n[🔍 X-RAY BACKEND: Fetching Bookings]")
        print(f"- User ID: {user_id}")
        logger.info(f"Getting bookings for user {user_id}")
        
        # 1. Fetch all slots (bookings)
        slots_query = firestore_db.db.collection('slots').where('user_id', '==', user_id)
        # slots_docs = slots_query.stream() # Blocking
        import asyncio
        slots_docs = await asyncio.to_thread(lambda: list(slots_query.stream()))
        
        booking_statuses = ['locked', 'pending', 'confirmed', 'completed', 'cancelled']
        
        # Filter relevant slots first
        relevant_slots = []
        for doc in slots_docs:
            data = doc.to_dict()
            if data.get('status') in booking_statuses:
                relevant_slots.append((doc.id, data))

        # 2. Parallel Processing Helper
        from app.cache import DataCache, cache

        async def get_vendor_cached(vendor_id):
            if not vendor_id: return None
            # Try specific vendor cache
            cache_key = f"vendor:{vendor_id}"
            cached = cache.get(cache_key)
            if cached: return cached
            
            # Fetch and cache
            v = await firestore_v2.get_vendor(vendor_id)
            if v: cache.set(cache_key, v, ttl_seconds=300)
            return v

        async def process_booking(slot_id, slot_data):
            # Parallel fetch of dependencies
            vendor_task = get_vendor_cached(slot_data.get('vendor_id'))
            payment_task = asyncio.to_thread(
                lambda: firestore_db.db.collection('payments').document(slot_data.get('payment_id')).get()
            ) if slot_data.get('payment_id') else asyncio.sleep(0) # No-op task

            vendor, payment_doc = await asyncio.gather(vendor_task, payment_task)
            
            payment = None
            if slot_data.get('payment_id') and hasattr(payment_doc, 'exists') and payment_doc.exists:
                payment = payment_doc.to_dict()

            # Format timestamps
            start_time = slot_data.get('start_time')
            end_time = slot_data.get('end_time')
            
            # Helper to safely format time
            def safe_format_time(t, fmt='%H:%M'):
                 if hasattr(t, 'strftime'): return t.strftime(fmt)
                 if isinstance(t, str): return t
                 return None
                   # Print to inspect raw slot content
            print(f"--- Slot {slot_id} RAW KEYS: {list(slot_data.keys())} | Price: {slot_data.get('price')} Amount: {slot_data.get('amount')} ---")
            
            def safe_iso(t):
                if hasattr(t, 'isoformat'): return t.isoformat()
                if isinstance(t, str): return t
                return None

            time_str = safe_format_time(start_time)
            
            # --- FORCE IDENTICAL LOGIC AS AVAILABLE SLOTS (firestore_v2.py) ---
            if start_time:
                try:
                    import pytz
                    KARACHI_TZ = pytz.timezone('Asia/Karachi')
                    if hasattr(start_time, 'astimezone'):
                        start_karachi = start_time.astimezone(KARACHI_TZ)
                        time_str = start_karachi.strftime('%H:%M')
                    elif hasattr(start_time, 'strftime'):
                        time_str = start_time.strftime('%H:%M')
                except Exception as e:
                    print(f"Error applying timezone fix: {e}")
            # -------------------------------------------------------------------
            
            start_time_str = safe_iso(start_time)
            end_time_str = safe_iso(end_time)
            
            return {
                'id': slot_id,
                'slot_id': slot_id,
                'vendor_id': slot_data.get('vendor_id'),
                'date': slot_data.get('date'),
                'time': time_str,
                'start_time': start_time_str,
                'end_time': end_time_str,
                'duration': slot_data.get('duration', 60),
                'price': slot_data.get('price'),
                'amount': slot_data.get('price'),
                'status': slot_data.get('status'),
                'resource_name': slot_data.get('resource_name'),
                'service_name': slot_data.get('service_name'),
                'vendor': vendor,
                'payment': payment
            }

        # 3. Execute Parallel Processing
        bookings = await asyncio.gather(*(process_booking(sid, sdata) for sid, sdata in relevant_slots))
        
        # Sort by date/time (descending)
        bookings.sort(key=lambda x: (x.get('date') or '', x.get('time') or ''), reverse=True)
        
        print(f"- Complete mapped bookings prepared for dispatch: {len(bookings)}")
        return {
            "success": True,
            "bookings": bookings,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user bookings: {e}")
        # Return empty list instead of error for resilience
        return {
            "success": False,
            "bookings": [],
            "error": str(e),
        }


class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None


@router.post("/chat")
async def chat_with_ai(chat_request: ChatRequest, user_id: str = Depends(get_current_user_id)):
    """
    Chat with the AI agent
    
    Args:
        chat_request: Chat message
        user_id: User ID (from JWT token)
        
    Returns:
        AI response
    """
    try:
        logger.info(f"Chat request from user {user_id}: {chat_request.message}")
        
        # Use simple error handling for now since user_id might not be a phone number
        # logic in agent might assume phone number for WhatsApp formatted messages but for logic it should be fine
        response = await ai_agent.process_message(user_id, chat_request.message)
        
        return {
            "success": True,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        # Return a fallback response if agent fails
        return {
            "success": True,
            "response": "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later."
        }

@router.post("/ai-search")
async def ai_search(request: ChatRequest):
    """
    Experimental natural language search for vendors and slots
    """
    try:
        logger.info(f"AI Search request: {request.message} (Model: {request.model})")
        result = await ai_search_service.search(request.message, model=request.model)
        return result
    except Exception as e:
        logger.error(f"Error in AI search endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


