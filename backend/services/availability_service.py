"""
Availability Service - Slot checking and booking with concurrency control
Member 3: Database & Availability Logic Lead

This service handles availability checking and booking creation with PostgreSQL
row-level locking to prevent double-bookings across all channels (WhatsApp, Web, Sheet).

Reference: PostgreSQL SELECT ... FOR UPDATE pattern for concurrency control
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import date, time
from sqlalchemy import select, and_, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.availability import AvailabilitySlot
from app.models.booking import Booking
from app.models.vendor import Vendor

logger = logging.getLogger(__name__)


class AvailabilityService:
    """Availability and booking service with concurrency control"""
    
    def __init__(self):
        """Initialize availability service"""
        logger.info("Availability Service initialized")
    
    async def get_available_slots(self, vendor_id: int, target_date: str) -> List[Dict[str, Any]]:
        """
        Get available time slots for a vendor on a specific date
        
        Args:
            vendor_id: Vendor ID
            target_date: Date in YYYY-MM-DD format
            
        Returns:
            List of available slots with time and price
        """
        try:
            logger.info(f"Getting available slots for vendor {vendor_id} on {target_date}")
            
            async with AsyncSessionLocal() as session:
                # Query available slots
                query = select(AvailabilitySlot).where(
                    and_(
                        AvailabilitySlot.vendor_id == vendor_id,
                        AvailabilitySlot.slot_date == target_date,
                        AvailabilitySlot.status == 'available'
                    )
                ).order_by(AvailabilitySlot.slot_time)
                
                result = await session.execute(query)
                slots = result.scalars().all()
                
                # Format results
                available_slots = []
                for slot in slots:
                    available_slots.append({
                        'slot_id': slot.id,
                        'time': slot.slot_time.strftime('%H:%M'),
                        'price': float(slot.price) if slot.price else 0.0,
                        'status': slot.status
                    })
                
                logger.info(f"Found {len(available_slots)} available slots")
                return available_slots
                
        except Exception as e:
            logger.error(f"Error getting available slots: {e}")
            return []
    
    async def check_and_book_slot(
        self, 
        vendor_id: int, 
        date: str, 
        time: str, 
        customer_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Check availability and book slot with row-level locking
        
        This method uses PostgreSQL row-level locking to prevent double-bookings
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
            
            async with AsyncSessionLocal() as session:
                # Start transaction with row-level locking
                async with session.begin():
                    # Lock the specific slot row for update
                    slot_query = select(AvailabilitySlot).where(
                        and_(
                            AvailabilitySlot.vendor_id == vendor_id,
                            AvailabilitySlot.slot_date == date,
                            AvailabilitySlot.slot_time == time
                        )
                    ).with_for_update()  # Row-level lock
                    
                    slot_result = await session.execute(slot_query)
                    slot = slot_result.scalar_one_or_none()
                    
                    if not slot:
                        return {
                            'success': False,
                            'error': 'Slot not found'
                        }
                    
                    if slot.status != 'available':
                        return {
                            'success': False,
                            'error': f'Slot is {slot.status}, not available'
                        }
                    
                    # Update slot status to booked
                    slot.status = 'booked'
                    slot.updated_at = slot.updated_at  # Trigger update timestamp
                    
                    # Create booking record
                    booking = Booking(
                        vendor_id=vendor_id,
                        slot_id=slot.id,
                        customer_name=customer_info.get('name', 'Unknown'),
                        customer_phone=customer_info.get('phone', ''),
                        booking_source='whatsapp',  # TODO: Make this dynamic
                        status='confirmed'
                    )
                    
                    session.add(booking)
                    await session.flush()  # Get booking ID
                    
                    # Commit transaction
                    await session.commit()
                    
                    logger.info(f"Booking created successfully: {booking.id}")
                    return {
                        'success': True,
                        'booking_id': booking.id,
                        'slot_id': slot.id
                    }
                    
        except Exception as e:
            logger.error(f"Error booking slot: {e}")
            return {
                'success': False,
                'error': f'Booking failed: {str(e)}'
            }
    
    async def create_availability_slots(self, vendor_id: int, date: str, slots: List[Dict[str, Any]]) -> Dict[str, Any]:
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
            
            async with AsyncSessionLocal() as session:
                created_slots = []
                
                for slot_data in slots:
                    slot = AvailabilitySlot(
                        vendor_id=vendor_id,
                        slot_date=date,
                        slot_time=slot_data['time'],
                        price=slot_data.get('price', 0.0),
                        status='available'
                    )
                    session.add(slot)
                    created_slots.append(slot)
                
                await session.commit()
                
                logger.info(f"Created {len(created_slots)} availability slots")
                return {
                    'success': True,
                    'created_count': len(created_slots)
                }
                
        except Exception as e:
            logger.error(f"Error creating availability slots: {e}")
            return {
                'success': False,
                'error': f'Failed to create slots: {str(e)}'
            }
    
    async def block_slot(self, vendor_id: int, date: str, time: str, reason: str = "Manual block") -> Dict[str, Any]:
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
            
            async with AsyncSessionLocal() as session:
                async with session.begin():
                    # Find and update slot
                    slot_query = select(AvailabilitySlot).where(
                        and_(
                            AvailabilitySlot.vendor_id == vendor_id,
                            AvailabilitySlot.slot_date == date,
                            AvailabilitySlot.slot_time == time
                        )
                    )
                    
                    slot_result = await session.execute(slot_query)
                    slot = slot_result.scalar_one_or_none()
                    
                    if not slot:
                        return {
                            'success': False,
                            'error': 'Slot not found'
                        }
                    
                    slot.status = 'blocked'
                    await session.commit()
                    
                    logger.info(f"Slot blocked successfully")
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
    
    async def get_vendor_schedule(self, vendor_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
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
            
            async with AsyncSessionLocal() as session:
                # Query slots in date range
                query = select(AvailabilitySlot).where(
                    and_(
                        AvailabilitySlot.vendor_id == vendor_id,
                        AvailabilitySlot.slot_date >= start_date,
                        AvailabilitySlot.slot_date <= end_date
                    )
                ).order_by(AvailabilitySlot.slot_date, AvailabilitySlot.slot_time)
                
                result = await session.execute(query)
                slots = result.scalars().all()
                
                # Group by date
                schedule = {}
                for slot in slots:
                    date_str = slot.slot_date.strftime('%Y-%m-%d')
                    if date_str not in schedule:
                        schedule[date_str] = []
                    
                    schedule[date_str].append({
                        'time': slot.slot_time.strftime('%H:%M'),
                        'status': slot.status,
                        'price': float(slot.price) if slot.price else 0.0
                    })
                
                return {
                    'success': True,
                    'schedule': schedule
                }
                
        except Exception as e:
            logger.error(f"Error getting vendor schedule: {e}")
            return {
                'success': False,
                'error': f'Failed to get schedule: {str(e)}'
            }
