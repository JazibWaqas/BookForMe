"""
REST API Module
Handles REST API endpoints for frontend integration
"""

import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException
from database.availability_service import AvailabilityService
from app.firestore import firestore_db

logger = logging.getLogger(__name__)

# Create router for REST API endpoints
router = APIRouter(prefix="/api", tags=["REST API"])

# Initialize services
availability_service = AvailabilityService()


@router.get("/vendors")
async def get_vendors(service_type: Optional[str] = None, category: Optional[str] = None):
    """
    Get list of all vendors from Firestore
    
    Args:
        service_type: Optional filter by service type (e.g., 'padel', 'tennis', 'futsal')
        category: Optional filter by category (e.g., 'Padel Court', 'Tennis Court')
    
    Returns:
        List of vendors
    """
    try:
        if not firestore_db.db:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
        
        vendors = []
        
        # Build query
        query = firestore_db.db.collection('vendors')
        
        # Apply filters
        if service_type:
            query = query.where('service_type', '==', service_type)
        if category:
            query = query.where('category', '==', category)
        
        # Execute query
        docs = query.stream()
        
        for doc in docs:
            vendor_data = doc.to_dict()
            vendor_data['id'] = doc.id
            vendors.append(vendor_data)
        
        logger.info(f"Retrieved {len(vendors)} vendors from Firestore")
        
        return {
            "success": True,
            "count": len(vendors),
            "vendors": vendors
        }
        
    except Exception as e:
        logger.error(f"Error getting vendors: {e}")
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
