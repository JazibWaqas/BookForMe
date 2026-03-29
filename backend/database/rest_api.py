"""
REST API Module
Handles REST API endpoints for frontend integration
"""

import logging
import asyncio
import json
from typing import Dict, List, Any, Optional, AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends, Header, File, UploadFile, Form
from fastapi.responses import StreamingResponse
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
from nlu.ocr import PaymentOCR

payment_ocr = PaymentOCR()

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


def require_vendor_owner(user_id: str, vendor_id: str) -> None:
    doc = firestore_db.db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=403, detail="User not found")
    data = doc.to_dict() or {}
    role = (data.get("role") or "").lower()
    if role == "admin":
        return
    if data.get("vendor_id") != vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized for this vendor")


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
    Get bookings for a vendor (no HTTP cache — list must stay fresh; Firestore reads are batched)
    
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


@router.get("/vendors/{vendor_id}/bookings/{booking_id}")
async def get_vendor_booking(vendor_id: str, booking_id: str):
    """
    Get a single booking by ID for a vendor (optimized - fetches one document)
    
    Args:
        vendor_id: Vendor ID
        booking_id: Booking ID (slot document ID)
        
    Returns:
        Single booking details
    """
    try:
        logger.info(f"Getting single booking {booking_id} for vendor {vendor_id}")
        
        # Fetch single booking directly from Firestore (optimized - 1 document read)
        booking = await firestore_db.get_vendor_booking_single(vendor_id, booking_id)
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        return {
            "success": True,
            "booking": booking
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting single booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to get booking")


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
        print(f"\n{'='*60}")
        print(f"[PAYMENT UPLOAD] HIT /payments/upload endpoint")
        print(f"[PAYMENT UPLOAD] slot_id={slot_id}, user_id={user_id}, amount_claimed={amount_claimed}")
        print(f"[PAYMENT UPLOAD] file={file.filename}, content_type={file.content_type}")
        print(f"{'='*60}")
        logger.info(f"Uploading payment screenshot for slot {slot_id} by user {user_id}")
        
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
        
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"{slot_id}_{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        print(f"[PAYMENT UPLOAD] File saved: {file_path}, size={len(content)} bytes")
        screenshot_url = f"/uploads/payments/{unique_filename}"

        print(f"[PAYMENT UPLOAD] Starting OCR verification...")
        ocr_result = await payment_ocr.verify_payment(content, amount_claimed)
        print(f"[PAYMENT UPLOAD] OCR result: {ocr_result}")

        if not ocr_result["verified"]:
            print(f"[PAYMENT UPLOAD] OCR REJECTED - cleaning up file")
            if file_path.exists():
                file_path.unlink()
            extracted = ocr_result.get("extracted_amount")
            if extracted is not None:
                detail = f"Payment amount doesn't match. Expected PKR {int(amount_claimed)}, found PKR {int(extracted)} in screenshot."
                print(f"[PAYMENT UPLOAD] Returning 400: {detail}")
                raise HTTPException(status_code=400, detail=detail)
            detail = "Couldn't read a payment amount from the screenshot. Please upload a clear payment confirmation image."
            print(f"[PAYMENT UPLOAD] Returning 400: {detail}")
            raise HTTPException(status_code=400, detail=detail)

        print(f"[PAYMENT UPLOAD] OCR PASSED - proceeding to create payment record")
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

@router.get("/vendors/{vendor_id}/grid")
async def get_vendor_grid(vendor_id: str, date: str):
    """Get ALL slots (available, locked, pending, confirmed) for a vendor on a date for the grid"""
    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
        from datetime import datetime, timedelta
        import pytz

        # Calculate next date for overnight business hours
        parsed_date = datetime.strptime(date, '%Y-%m-%d')
        next_date = (parsed_date + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Fetch vendor document to get operating hours
        vendor_doc = firestore_db.db.collection('vendors').document(vendor_id).get()
        operating_hours = {}
        if vendor_doc.exists:
            vendor_data = vendor_doc.to_dict()
            operating_hours = vendor_data.get('operating_hours', {})

        # Query for today and tomorrow to catch 1 AM, 2 AM slots
        query = firestore_db.db.collection('slots')\
            .where(filter=FieldFilter('vendor_id', '==', vendor_id))\
            .where(filter=FieldFilter('date', 'in', [date, next_date]))
        
        import asyncio
        slots_docs = await asyncio.to_thread(lambda: list(query.stream()))
        
        slots = []
        for doc in slots_docs:
            slot_data = doc.to_dict()
            slot_data['id'] = doc.id
            
            # Format raw datetime
            start_time = slot_data.get('start_time')
            if start_time:
                try:
                    KARACHI_TZ = pytz.timezone('Asia/Karachi')
                    if hasattr(start_time, 'astimezone'):
                        start_karachi = start_time.astimezone(KARACHI_TZ)
                        slot_data['time'] = start_karachi.strftime('%H:%M')
                    elif hasattr(start_time, 'strftime'):
                        slot_data['time'] = start_time.strftime('%H:%M')
                    else:
                        slot_data['time'] = str(start_time)
                except Exception:
                    slot_data['time'] = str(start_time)
            
            if not slot_data.get('time') and slot_data.get('start_time'):
                 slot_data['time'] = str(slot_data['start_time'])
                 
            # Business Day Logic
            # If the slot is on the next_date, only include it if it's before 06:00 AM
            if slot_data.get('date') == next_date:
                # Expecting 'HH:MM' string in 'time'
                time_str = slot_data.get('time', '23:59')
                if time_str >= '06:00':
                    continue # Skip next day's regular business hours
                 
            # Pop unsupported/datetime objects before returning
            slot_data.pop('start_time', None)
            slot_data.pop('end_time', None)
            slot_data.pop('hold_expires_at', None)
            slot_data.pop('created_at', None)
            slot_data.pop('updated_at', None)
            slot_data.pop('completed_at', None)
                
            slots.append(slot_data)
        
        return {
            "success": True,
            "vendor_id": vendor_id,
            "date": date,
            "operating_hours": operating_hours,
            "slots": sorted(slots, key=lambda x: x.get('time', ''))
        }
    except Exception as e:
        import traceback
        logger.error(f"Error getting vendor grid: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to get grid")

def _slot_time_str_khi(data: dict, KARACHI_TZ) -> str:
    start_time = data.get('start_time')
    if start_time and hasattr(start_time, 'astimezone'):
        return start_time.astimezone(KARACHI_TZ).strftime('%H:%M')
    return '00:00'


def _khi_hhmm_from_slot(data: dict, doc_id: str, KARACHI_TZ) -> Optional[str]:
    start_time = data.get('start_time')
    if start_time and hasattr(start_time, 'astimezone'):
        return start_time.astimezone(KARACHI_TZ).strftime('%H:%M')
    parts = doc_id.split('_')
    if len(parts) >= 2 and parts[0].isdigit() and len(parts[0]) == 8 and parts[1].isdigit():
        try:
            h = int(parts[1])
            if 0 <= h <= 23:
                return f'{h:02d}:00'
        except ValueError:
            pass
    return None


def _customer_label_from_slot(data: dict, db) -> str:
    if data.get('customer_name'):
        return str(data.get('customer_name'))
    uid = data.get('user_id')
    if not uid:
        return 'Customer'
    user_doc = db.collection('users').document(uid).get()
    if user_doc.exists:
        u = user_doc.to_dict() or {}
        return u.get('name') or u.get('phone') or u.get('email') or 'Customer'
    return 'Customer'


@router.get("/vendors/{vendor_id}/analytics/today")
async def vendor_dashboard_analytics(vendor_id: str):
    """Get live metrics, KPIs, and upcoming rows for vendor dashboard (Karachi day)."""
    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
        from datetime import datetime
        import pytz
        import asyncio

        KARACHI_TZ = pytz.timezone('Asia/Karachi')
        now_khi = datetime.now(KARACHI_TZ)
        today_date_str = now_khi.strftime('%Y-%m-%d')
        now_time_str = now_khi.strftime('%H:%M')
        db = firestore_db.db

        def load_today_slots():
            q = db.collection('slots').where(
                filter=FieldFilter('vendor_id', '==', vendor_id)
            ).where(
                filter=FieldFilter('date', '==', today_date_str)
            )
            return list(q.stream())

        def load_attention_slots():
            q = db.collection('slots').where(
                filter=FieldFilter('vendor_id', '==', vendor_id)
            ).where(
                filter=FieldFilter('status', 'in', ['pending', 'locked'])
            )
            return list(q.stream())

        slots_today, slots_attention = await asyncio.gather(
            asyncio.to_thread(load_today_slots),
            asyncio.to_thread(load_attention_slots),
        )

        def norm_slot_status(raw):
            if raw is None:
                return ''
            s = raw if isinstance(raw, str) else str(raw)
            return s.strip().lower()

        revenue_today = 0.0
        bookings_today_count = 0
        available_today_count = 0
        resources_today = set()

        for doc in slots_today:
            data = doc.to_dict() or {}
            status_key = norm_slot_status(data.get('status'))
            price = float(data.get('price') or 0)
            rid = data.get('resource_id')
            if rid:
                resources_today.add(rid)

            if status_key in ('confirmed', 'pending', 'locked'):
                bookings_today_count += 1
            if status_key in ('confirmed', 'completed'):
                revenue_today += price
            if status_key in ('available', 'cancelled'):
                t = _khi_hhmm_from_slot(data, doc.id, KARACHI_TZ)
                if t is None or t >= now_time_str:
                    available_today_count += 1

        resource_name_cache: Dict[str, str] = {}
        user_name_cache: Dict[str, str] = {}

        def get_resource_name(rid: str) -> str:
            if rid in resource_name_cache:
                return resource_name_cache[rid]
            rdoc = db.collection('resources').document(rid).get()
            name = rid
            if rdoc.exists:
                name = (rdoc.to_dict() or {}).get('name') or rid
            resource_name_cache[rid] = name
            return name

        def get_customer_name(data: dict) -> str:
            if data.get('customer_name'):
                return str(data['customer_name'])
            uid = data.get('user_id')
            if not uid:
                return 'Customer'
            if uid in user_name_cache:
                return user_name_cache[uid]
            user_doc = db.collection('users').document(uid).get()
            name = 'Customer'
            if user_doc.exists:
                u = user_doc.to_dict() or {}
                name = u.get('name') or u.get('phone') or u.get('email') or 'Customer'
            user_name_cache[uid] = name
            return name

        pending_actions_count = 0
        pending_items = []
        for doc in slots_attention:
            data = doc.to_dict() or {}
            if (data.get('date') or '') < today_date_str:
                continue
            pending_actions_count += 1
            time_str = _slot_time_str_khi(data, KARACHI_TZ)
            hold_exp = data.get('hold_expires_at')
            hold_iso = None
            if hold_exp and hasattr(hold_exp, 'isoformat'):
                hold_iso = hold_exp.isoformat()
            customer_name = get_customer_name(data)
            resource_id = data.get('resource_id') or ''
            resource_name = get_resource_name(resource_id) if resource_id else resource_id
            pending_items.append({
                "id": doc.id,
                "status": data.get('status'),
                "date": data.get('date'),
                "time": time_str,
                "customer_name": customer_name,
                "resource_id": resource_id,
                "resource_name": resource_name,
                "amount": float(data.get('price') or 0),
                "hold_expires_at": hold_iso,
                "booking_source": data.get('booking_source') or 'app',
            })

        def _pending_sort_key(r):
            if r["status"] == 'locked' and r.get("hold_expires_at"):
                return r["hold_expires_at"]
            return f"{r.get('date', '')}T{r.get('time', '00:00')}"

        pending_items.sort(key=_pending_sort_key)
        pending_items = pending_items[:15]

        upcoming_bookings = []
        for doc in slots_today:
            data = doc.to_dict() or {}
            status_key = norm_slot_status(data.get('status'))
            if status_key not in ('confirmed', 'pending', 'locked'):
                continue
            time_str = _slot_time_str_khi(data, KARACHI_TZ)
            if time_str < now_time_str:
                continue
            price = float(data.get('price') or 0)
            customer_name = get_customer_name(data)
            resource_id = data.get('resource_id') or ''
            resource_name = get_resource_name(resource_id) if resource_id else resource_id

            upcoming_bookings.append({
                "id": doc.id,
                "customer_name": customer_name,
                "service": data.get('service_id', 'Service'),
                "resource_id": resource_id,
                "resource_name": resource_name,
                "time": time_str,
                "status": data.get('status') or status_key,
                "amount": price,
                "booking_source": data.get('booking_source') or 'app',
            })

        upcoming_bookings = sorted(upcoming_bookings, key=lambda x: x.get('time', ''))[:8]

        return {
            "success": True,
            "metrics": {
                "revenue_today": revenue_today,
                "bookings_today": bookings_today_count,
                "pending_actions": pending_actions_count,
                "available_today": available_today_count,
                "active_courts": len(resources_today) or 0,
            },
            "upcoming": upcoming_bookings,
            "pending_items": pending_items,
        }

    except Exception as e:
        import traceback
        logger.error(f"Error getting vendor analytics: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to get vendor analytics")


@router.get("/vendors/{vendor_id}/dashboard/pending-actions")
async def vendor_dashboard_pending_actions(
    vendor_id: str,
    user_id: str = Depends(get_current_user_id),
    limit: int = 15,
):
    """Slots needing vendor attention: pending payment or locked hold."""
    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
        import pytz
        from datetime import datetime
        import asyncio

        require_vendor_owner(user_id, vendor_id)
        KARACHI_TZ = pytz.timezone('Asia/Karachi')
        today_date_str = datetime.now(KARACHI_TZ).strftime('%Y-%m-%d')
        db = firestore_db.db

        def load():
            q = db.collection('slots').where(
                filter=FieldFilter('vendor_id', '==', vendor_id)
            ).where(
                filter=FieldFilter('status', 'in', ['pending', 'locked'])
            )
            return list(q.stream())

        docs = await asyncio.to_thread(load)
        rows = []
        for doc in docs:
            data = doc.to_dict() or {}
            if (data.get('date') or '') < today_date_str:
                continue
            time_str = _slot_time_str_khi(data, KARACHI_TZ)
            hold_exp = data.get('hold_expires_at')
            hold_iso = None
            if hold_exp and hasattr(hold_exp, 'isoformat'):
                hold_iso = hold_exp.isoformat()
            customer_name = _customer_label_from_slot(data, db)
            resource_id = data.get('resource_id') or ''
            resource_name = resource_id
            if resource_id:
                rdoc = db.collection('resources').document(resource_id).get()
                if rdoc.exists:
                    resource_name = (rdoc.to_dict() or {}).get('name') or resource_id
            rows.append({
                "id": doc.id,
                "status": data.get('status'),
                "date": data.get('date'),
                "time": time_str,
                "customer_name": customer_name,
                "resource_id": resource_id,
                "resource_name": resource_name,
                "amount": float(data.get('price') or 0),
                "hold_expires_at": hold_iso,
                "booking_source": data.get('booking_source') or 'app',
            })

        def sort_key(r):
            if r["status"] == 'locked' and r.get("hold_expires_at"):
                return r["hold_expires_at"]
            return f"{r.get('date', '')}T{r.get('time', '00:00')}"

        rows.sort(key=sort_key)
        return {"success": True, "items": rows[: max(1, min(limit, 50))]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pending-actions: {e}")
        raise HTTPException(status_code=500, detail="Failed to load pending actions")


@router.post("/vendors/{vendor_id}/smart-reseed")
async def vendor_run_smart_reseed(vendor_id: str, uid: str = Depends(get_current_user_id)):
    """
    Runs the same additive logic as database/seed/smart_reseed.py (creates missing slot docs only).
    """
    try:
        require_vendor_owner(uid, vendor_id)
        from database.seed.smart_reseed import smart_reseed
        import asyncio

        def run():
            return smart_reseed(firestore_db.db)

        created = await asyncio.to_thread(run)
        return {"success": True, "created": int(created), "message": f"Added {created} missing slot documents (if any)."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"smart_reseed failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vendors/{vendor_id}/notifications")
async def vendor_get_notifications(
    vendor_id: str,
    uid: str = Depends(get_current_user_id),
    limit: int = 30,
):
    """Notifications for the logged-in vendor user (Firestore notifications collection)."""
    try:
        require_vendor_owner(uid, vendor_id)
        import asyncio

        def load():
            q = firestore_db.db.collection('notifications').where('user_id', '==', uid)
            return list(q.stream())

        docs = await asyncio.to_thread(load)
        out = []
        for doc in docs:
            d = doc.to_dict() or {}
            created = d.get('created_at')
            created_s = None
            if created is not None and hasattr(created, 'isoformat'):
                created_s = created.isoformat()
            out.append({
                "id": doc.id,
                "user_id": d.get('user_id'),
                "type": str(d.get('type') or 'system'),
                "title": d.get('title') or '',
                "message": d.get('message') or '',
                "read": bool(d.get('read', False)),
                "created_at": created_s,
                "data": d.get('data') or {},
            })
        out.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        return {"success": True, "notifications": out[: max(1, min(limit, 100))]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"vendor notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to load notifications")


@router.patch("/notifications/{notification_id}/read")
async def notification_mark_read(notification_id: str, uid: str = Depends(get_current_user_id)):
    try:
        ref = firestore_db.db.collection('notifications').document(notification_id)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Notification not found")
        data = doc.to_dict() or {}
        if data.get('user_id') != uid:
            raise HTTPException(status_code=403, detail="Not your notification")
        ref.update({'read': True})
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"mark read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vendors/{vendor_id}/slots/{slot_id}/approve")
async def vendor_approve_slot(vendor_id: str, slot_id: str, user_id: str = Depends(get_current_user_id)):
    """Manually approve a pending booking"""
    try:
        result = slot_service.confirm_booking(slot_id, vendor_id)
        if result['success']:
            return result
        raise HTTPException(status_code=400, detail=result.get('error'))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving slot {slot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vendors/{vendor_id}/slots/{slot_id}/reject")
async def vendor_reject_slot(vendor_id: str, slot_id: str, user_id: str = Depends(get_current_user_id)):
    """Manually reject a pending booking"""
    try:
        result = slot_service.reject_booking(slot_id, vendor_id, reason="Manual rejection by vendor")
        if result['success']:
            return result
        raise HTTPException(status_code=400, detail=result.get('error'))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting slot {slot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vendors/{vendor_id}/slots/{slot_id}/block")
async def vendor_block_slot(vendor_id: str, slot_id: str, user_id: str = Depends(get_current_user_id)):
    """Manually lock/block an empty slot"""
    try:
        from database.schema import SlotStatus
        slot_ref = firestore_db.db.collection('slots').document(slot_id)
        slot_doc = slot_ref.get()
        if not slot_doc.exists:
            raise HTTPException(status_code=404, detail="Slot not found")
        
        slot_data = slot_doc.to_dict()
        if slot_data.get('vendor_id') != vendor_id:
             raise HTTPException(status_code=403, detail="Unauthorized")
        if slot_data.get('status') != SlotStatus.AVAILABLE.value:
             raise HTTPException(status_code=400, detail="Only available slots can be blocked")
             
        slot_ref.update({
            'status': 'blocked',
            'user_id': user_id, 
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        return {"success": True, "message": "Slot blocked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error blocking slot {slot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    operating_hours: Optional[Dict[str, Any]] = None
    owner_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    area: Optional[str] = None
    owner_cnic: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    primary_sport_type: Optional[str] = None

@router.patch("/vendors/{vendor_id}")
async def update_vendor_profile(vendor_id: str, data: VendorUpdate, user_id: str = Depends(get_current_user_id)):
    """Update vendor profile details"""
    try:
        require_vendor_owner(user_id, vendor_id)
        vendor_ref = firestore_db.db.collection('vendors').document(vendor_id)
        if not vendor_ref.get().exists:
            raise HTTPException(status_code=404, detail="Vendor not found")
            
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        update_data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        vendor_ref.update(update_data)
        
        return {"success": True, "message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating vendor {vendor_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Vendor profile sub-resources ─────────────────────────────────────────────

@router.get("/vendors/{vendor_id}/resources")
async def vendor_get_resources(vendor_id: str, uid: str = Depends(get_current_user_id)):
    require_vendor_owner(uid, vendor_id)
    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
        docs = firestore_db.db.collection('resources') \
            .where(filter=FieldFilter('vendor_id', '==', vendor_id)).stream()
        return {"success": True, "resources": [{"id": d.id, **(d.to_dict() or {})} for d in docs]}
    except Exception as e:
        logger.error(f"Error getting resources: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    active: Optional[bool] = None


@router.patch("/vendors/{vendor_id}/resources/{resource_id}")
async def vendor_update_resource(
    vendor_id: str, resource_id: str, data: ResourceUpdate, uid: str = Depends(get_current_user_id)
):
    require_vendor_owner(uid, vendor_id)
    try:
        ref = firestore_db.db.collection('resources').document(resource_id)
        doc = ref.get()
        if not doc.exists or (doc.to_dict() or {}).get('vendor_id') != vendor_id:
            raise HTTPException(status_code=404, detail="Resource not found for this vendor")
        update = {k: v for k, v in data.dict().items() if v is not None}
        update['updated_at'] = firestore.SERVER_TIMESTAMP
        ref.update(update)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating resource: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vendors/{vendor_id}/services")
async def vendor_get_services(vendor_id: str, uid: str = Depends(get_current_user_id)):
    require_vendor_owner(uid, vendor_id)
    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
        docs = firestore_db.db.collection('services') \
            .where(filter=FieldFilter('vendor_id', '==', vendor_id)).stream()
        return {"success": True, "services": [{"id": d.id, **(d.to_dict() or {})} for d in docs]}
    except Exception as e:
        logger.error(f"Error getting services: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ServicePriceUpdate(BaseModel):
    base_price: Optional[int] = None
    duration_min: Optional[int] = None
    name: Optional[str] = None


@router.patch("/vendors/{vendor_id}/services/{service_id}")
async def vendor_update_service(
    vendor_id: str, service_id: str, data: ServicePriceUpdate, uid: str = Depends(get_current_user_id)
):
    require_vendor_owner(uid, vendor_id)
    try:
        ref = firestore_db.db.collection('services').document(service_id)
        doc = ref.get()
        if not doc.exists or (doc.to_dict() or {}).get('vendor_id') != vendor_id:
            raise HTTPException(status_code=404, detail="Service not found for this vendor")
        update: dict = {}
        if data.name is not None:
            update['name'] = data.name
        if data.duration_min is not None:
            update['duration_min'] = data.duration_min
        if data.base_price is not None:
            update['pricing'] = {**(doc.to_dict() or {}).get('pricing', {}), 'base': data.base_price}
        update['updated_at'] = firestore.SERVER_TIMESTAMP
        if update:
            ref.update(update)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vendors/{vendor_id}/payment-accounts")
async def vendor_get_payment_accounts(vendor_id: str, uid: str = Depends(get_current_user_id)):
    require_vendor_owner(uid, vendor_id)
    try:
        from google.cloud.firestore_v1.base_query import FieldFilter
        docs = firestore_db.db.collection('vendor_payment_accounts') \
            .where(filter=FieldFilter('vendor_id', '==', vendor_id)).stream()
        return {"success": True, "accounts": [{"id": d.id, **(d.to_dict() or {})} for d in docs]}
    except Exception as e:
        logger.error(f"Error getting payment accounts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class PaymentAccountUpsert(BaseModel):
    type: str
    account_number: str
    account_title: str
    bank_name: Optional[str] = None
    is_default: bool = False


@router.patch("/vendors/{vendor_id}/payment-accounts/{account_id}")
async def vendor_update_payment_account(
    vendor_id: str, account_id: str, data: PaymentAccountUpsert, uid: str = Depends(get_current_user_id)
):
    require_vendor_owner(uid, vendor_id)
    try:
        ref = firestore_db.db.collection('vendor_payment_accounts').document(account_id)
        doc = ref.get()
        if not doc.exists or (doc.to_dict() or {}).get('vendor_id') != vendor_id:
            raise HTTPException(status_code=404, detail="Account not found for this vendor")
        update = {k: v for k, v in data.dict().items()}
        update['vendor_id'] = vendor_id
        update['updated_at'] = firestore.SERVER_TIMESTAMP
        ref.update(update)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment account: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class WalkInRequest(BaseModel):
    customer_name: str
    phone: str
    amount: float
    paid: bool = True

@router.post("/vendors/{vendor_id}/slots/{slot_id}/walk-in")
async def vendor_walk_in_booking(vendor_id: str, slot_id: str, data: WalkInRequest, user_id: str = Depends(get_current_user_id)):
    """Create a manual walk-in booking"""
    try:
        from database.schema import SlotStatus, Collections
        
        @firestore.transactional
        def walk_in_transaction(transaction):
            slot_ref = firestore_db.db.collection(Collections.SLOTS).document(slot_id)
            slot_doc = slot_ref.get(transaction=transaction)
            
            if not slot_doc.exists:
                return {'success': False, 'error': 'Slot not found'}
                
            slot_data = slot_doc.to_dict()
            if slot_data.get('vendor_id') != vendor_id:
                return {'success': False, 'error': 'Unauthorized'}
                
            if slot_data.get('status') != SlotStatus.AVAILABLE.value:
                return {'success': False, 'error': 'Slot is not available'}
            
            # Use vendor's user ID as the booking user for tracking
            transaction.update(slot_ref, {
                'status': SlotStatus.CONFIRMED.value if data.paid else SlotStatus.PENDING.value,
                'user_id': user_id, 
                'booking_source': 'walk-in',
                'customer_name': data.customer_name,
                'customer_phone': data.phone,
                'price': data.amount,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            
            return {'success': True}
            
        transaction = firestore_db.db.transaction()
        result = walk_in_transaction(transaction)
        
        if result['success']:
            return {"success": True, "message": "Walk-in booking created"}
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating walk-in for {slot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── SSE Real-time Stream ─────────────────────────────────────────────────────

async def _vendor_event_stream(vendor_id: str) -> AsyncGenerator[str, None]:
    """
    Stream Firestore slot changes for a vendor as SSE events.
    Uses on_snapshot to receive pushes the moment a slot doc changes —
    no polling. Each change is forwarded to the client immediately.
    """
    queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def on_snapshot(doc_snapshots, changes, read_time):
        for change in changes:
            doc = change.document
            data = doc.to_dict() or {}
            # Strip non-serialisable Firestore timestamps
            for field in ('start_time', 'end_time', 'hold_expires_at', 'created_at', 'updated_at', 'completed_at'):
                if field in data and hasattr(data[field], 'isoformat'):
                    data[field] = data[field].isoformat()
                elif field in data:
                    data.pop(field, None)

            event_type = (
                'slot_added' if change.type.name == 'ADDED'
                else 'slot_updated' if change.type.name == 'MODIFIED'
                else 'slot_removed'
            )
            payload = {'type': event_type, 'slot_id': doc.id, 'slot': data}
            loop.call_soon_threadsafe(queue.put_nowait, payload)

    db = firestore_db.db
    query = db.collection('slots').where('vendor_id', '==', vendor_id)
    unsubscribe = query.on_snapshot(on_snapshot)

    try:
        # Send initial heartbeat so the client knows the connection is live
        yield "event: connected\ndata: {\"vendor_id\": \"" + vendor_id + "\"}\n\n"

        while True:
            try:
                # Heartbeat every 25s to keep the connection alive through proxies
                payload = await asyncio.wait_for(queue.get(), timeout=25.0)
                yield f"event: slot_change\ndata: {json.dumps(payload)}\n\n"
            except asyncio.TimeoutError:
                yield "event: heartbeat\ndata: {}\n\n"
    finally:
        unsubscribe()
        logger.info(f"SSE stream closed for vendor {vendor_id}")


@router.get("/vendors/{vendor_id}/stream")
async def vendor_stream(vendor_id: str, user_id: str = Depends(get_current_user_id)):
    """
    SSE endpoint — streams real-time slot change events for a vendor.
    Connect once; the server pushes an event whenever any slot changes.
    """
    require_vendor_owner(user_id, vendor_id)
    return StreamingResponse(
        _vendor_event_stream(vendor_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering on Render
        },
    )
