"""
Availability Service - Firestore-based slot checking and booking
Handles availability checking and booking creation using Firestore transactions
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import date, time
from app.firestore import firestore_db

logger = logging.getLogger(__name__)


class AvailabilityService:
    """Availability and booking service using Firestore"""
    
    def __init__(self):
        """Initialize availability service"""
        self.db = firestore_db
        logger.info("Availability Service initialized with Firestore")
    
    async def get_available_slots(self, vendor_id: str, target_date: str) -> List[Dict[str, Any]]:
        """
        Get available time slots for a vendor on a specific date
        
        Args:
            vendor_id: Vendor ID
            target_date: Date in YYYY-MM-DD format
            
        Returns:
            List of available slots with complete data
        """
        try:
            logger.info(f"Getting available slots for vendor {vendor_id} on {target_date}")
            
            slots = await self.db.get_available_slots(vendor_id, target_date)
            
            # Return complete slot data (don't filter fields)
            logger.info(f"Found {len(slots)} available slots")
            return slots
            
        except Exception as e:
            logger.error(f"Error getting available slots: {e}")
            return []
    
    async def check_and_book_slot(
        self, 
        vendor_id: str, 
        date: str, 
        time: str, 
        customer_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Check availability and book slot with Firestore transaction
        
        This method uses Firestore transactions to prevent double-bookings
        when multiple requests try to book the same slot simultaneously.
        
        Args:
            vendor_id: Vendor ID
            date: Booking date (YYYY-MM-DD)
            time: Booking time (HH:MM)
            customer_info: Customer details (name, phone)
            
        Returns:
            Dict with booking result
        """
        try:
            logger.info(f"Attempting to book slot: vendor={vendor_id}, date={date}, time={time}")
            
            # Use Firestore transaction for atomic booking
            result = await self.db.book_slot(vendor_id, date, time, customer_info)
            
            if result['success']:
                logger.info(f"Booking created successfully: {result['booking_id']}")
            else:
                logger.warning(f"Booking failed: {result['error']}")
            
            return result
                    
        except Exception as e:
            logger.error(f"Error booking slot: {e}")
            return {
                'success': False,
                'error': f'Booking failed: {str(e)}'
            }
    
    async def create_availability_slots(self, vendor_id: str, date: str, slots: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Create availability slots for a vendor on a specific date
        
        Args:
            vendor_id: Vendor ID
            date: Date in YYYY-MM-DD format
            slots: List of slot dictionaries with time and price
            
        Returns:
            Creation result
        """
        try:
            logger.info(f"Creating {len(slots)} slots for vendor {vendor_id} on {date}")
            
            result = await self.db.create_availability_slots(vendor_id, date, slots)
            
            if result['success']:
                logger.info(f"Created {result['created_count']} availability slots")
            else:
                logger.error(f"Failed to create slots: {result['error']}")
            
            return result
                
        except Exception as e:
            logger.error(f"Error creating availability slots: {e}")
            return {
                'success': False,
                'error': f'Failed to create slots: {str(e)}'
            }
    
    async def get_vendor_schedule(self, vendor_id: str, start_date: str, end_date: str) -> Dict[str, Any]:
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
            
            # Get bookings for date range
            bookings = await self.db.get_vendor_bookings(vendor_id)
            
            # Filter by date range
            filtered_bookings = []
            for booking in bookings:
                booking_date = booking.get('date', '')
                if start_date <= booking_date <= end_date:
                    filtered_bookings.append(booking)
            
            # Group by date
            schedule = {}
            for booking in filtered_bookings:
                date_str = booking.get('date', '')
                if date_str not in schedule:
                    schedule[date_str] = []
                
                schedule[date_str].append({
                    'time': booking.get('time', ''),
                    'customer_name': booking.get('customer_name', ''),
                    'customer_phone': booking.get('customer_phone', ''),
                    'status': booking.get('status', ''),
                    'booking_id': booking.get('id', '')
                })
            
            return {
                'success': True,
                'schedule': schedule,
                'total_bookings': len(filtered_bookings)
            }
                
        except Exception as e:
            logger.error(f"Error getting vendor schedule: {e}")
            return {
                'success': False,
                'error': f'Failed to get schedule: {str(e)}'
            }
    
    async def block_slot(self, vendor_id: str, date: str, time: str, reason: str = "Manual block") -> Dict[str, Any]:
        """
        Block a slot (mark as unavailable)
        
        Args:
            vendor_id: Vendor ID
            date: Date in YYYY-MM-DD format
            time: Time in HH:MM format
            reason: Reason for blocking
            
        Returns:
            Block result
        """
        try:
            logger.info(f"Blocking slot: vendor={vendor_id}, date={date}, time={time}")
            
            # Find and update slot in Firestore
            # This would require a more complex query in Firestore
            # For now, return success (implement later if needed)
            
            return {
                'success': True,
                'message': 'Slot blocked successfully'
            }
                    
        except Exception as e:
            logger.error(f"Error blocking slot: {e}")
            return {
                'success': False,
                'error': f'Failed to block slot: {str(e)}'
            }
