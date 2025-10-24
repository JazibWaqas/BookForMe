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
async def get_vendors():
    """Get list of all vendors"""
    try:
        # TODO: Query vendors from Firestore
        vendors = [
            {
                "id": "vendor1",
                "name": "Karachi Futsal Arena",
                "service_type": "futsal",
                "whatsapp_connected": True
            },
            {
                "id": "vendor2", 
                "name": "Elite Salon & Spa",
                "service_type": "salon",
                "whatsapp_connected": True
            }
        ]
        
        return {
            "success": True,
            "vendors": vendors
        }
        
    except Exception as e:
        logger.error(f"Error getting vendors: {e}")
        raise HTTPException(status_code=500, detail="Failed to get vendors")


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
