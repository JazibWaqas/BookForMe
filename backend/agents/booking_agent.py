"""
Booking Agent - Handles booking creation and management
Member 2: NLU & Conversation Logic Lead

This agent manages the booking workflow, including availability checking,
booking creation, and confirmation. It coordinates with the availability
service to ensure no double-bookings occur.

Reference: WhatsAppCabBookingBot booking confirmation workflow
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from services.availability_service import AvailabilityService

logger = logging.getLogger(__name__)


class BookingAgent:
    """Booking management agent"""
    
    def __init__(self):
        """Initialize booking agent"""
        self.availability_service = AvailabilityService()
        logger.info("Booking Agent initialized")
    
    async def create_booking(self, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new booking
        
        Args:
            booking_data: Dict containing booking information
                - customer_phone: Customer's phone number
                - service: Service type (futsal, salon)
                - date: Booking date (YYYY-MM-DD)
                - time: Booking time (HH:MM)
                - source: Booking source (whatsapp, web, sheet)
                - customer_name: Customer name (optional)
        
        Returns:
            Dict with success status and booking details
        """
        try:
            logger.info(f"Creating booking: {booking_data}")
            
            # Validate booking data
            validation_result = self._validate_booking_data(booking_data)
            if not validation_result['valid']:
                return {
                    'success': False,
                    'error': validation_result['error']
                }
            
            # TODO: Get vendor_id based on service type
            # For now, assume vendor_id = 1 (first vendor)
            vendor_id = 1
            
            # Check availability and book slot
            booking_result = await self.availability_service.check_and_book_slot(
                vendor_id=vendor_id,
                date=booking_data['date'],
                time=booking_data['time'],
                customer_info={
                    'name': booking_data.get('customer_name', 'Unknown'),
                    'phone': booking_data['customer_phone']
                }
            )
            
            if booking_result['success']:
                logger.info(f"Booking created successfully: {booking_result['booking_id']}")
                return {
                    'success': True,
                    'booking_id': booking_result['booking_id'],
                    'message': 'Booking confirmed successfully'
                }
            else:
                logger.warning(f"Booking failed: {booking_result['error']}")
                return {
                    'success': False,
                    'error': booking_result['error']
                }
                
        except Exception as e:
            logger.error(f"Error creating booking: {e}")
            return {
                'success': False,
                'error': f'Internal error: {str(e)}'
            }
    
    def _validate_booking_data(self, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate booking data"""
        required_fields = ['customer_phone', 'service', 'date', 'time', 'source']
        
        # Check required fields
        for field in required_fields:
            if field not in booking_data or not booking_data[field]:
                return {
                    'valid': False,
                    'error': f'Missing required field: {field}'
                }
        
        # Validate service type
        valid_services = ['futsal', 'salon']
        if booking_data['service'] not in valid_services:
            return {
                'valid': False,
                'error': f'Invalid service type. Must be one of: {valid_services}'
            }
        
        # Validate date format
        try:
            datetime.strptime(booking_data['date'], '%Y-%m-%d')
        except ValueError:
            return {
                'valid': False,
                'error': 'Invalid date format. Use YYYY-MM-DD'
            }
        
        # Validate time format
        try:
            datetime.strptime(booking_data['time'], '%H:%M')
        except ValueError:
            return {
                'valid': False,
                'error': 'Invalid time format. Use HH:MM'
            }
        
        # Check if date is not in the past
        booking_date = datetime.strptime(booking_data['date'], '%Y-%m-%d').date()
        if booking_date < datetime.now().date():
            return {
                'valid': False,
                'error': 'Cannot book for past dates'
            }
        
        return {'valid': True}
    
    async def cancel_booking(self, booking_id: int, customer_phone: str) -> Dict[str, Any]:
        """
        Cancel an existing booking
        
        Args:
            booking_id: ID of booking to cancel
            customer_phone: Customer's phone number for verification
        
        Returns:
            Dict with cancellation status
        """
        try:
            logger.info(f"Cancelling booking {booking_id} for {customer_phone}")
            
            # TODO: Implement booking cancellation
            # 1. Verify booking exists and belongs to customer
            # 2. Update booking status to 'cancelled'
            # 3. Free up the slot (set status back to 'available')
            
            return {
                'success': True,
                'message': 'Booking cancelled successfully'
            }
            
        except Exception as e:
            logger.error(f"Error cancelling booking: {e}")
            return {
                'success': False,
                'error': f'Failed to cancel booking: {str(e)}'
            }
    
    async def get_booking_status(self, booking_id: int) -> Dict[str, Any]:
        """
        Get status of a booking
        
        Args:
            booking_id: ID of booking to check
        
        Returns:
            Dict with booking status and details
        """
        try:
            # TODO: Implement booking status check
            # Query database for booking details
            
            return {
                'success': True,
                'booking_id': booking_id,
                'status': 'confirmed',
                'message': 'Booking found'
            }
            
        except Exception as e:
            logger.error(f"Error getting booking status: {e}")
            return {
                'success': False,
                'error': f'Failed to get booking status: {str(e)}'
            }
