"""
Availability model - represents time slots for booking
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Date, Time, DateTime, DECIMAL, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class AvailabilitySlot(Base):
    """Availability slot model for time slots"""
    
    __tablename__ = "availability_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    slot_date = Column(Date, nullable=False)
    slot_time = Column(Time, nullable=False)
    status = Column(String(20), default="available")  # available, booked, blocked
    price = Column(DECIMAL(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Unique constraint to prevent duplicate slots
    __table_args__ = (
        UniqueConstraint('vendor_id', 'slot_date', 'slot_time', name='unique_vendor_slot'),
    )
    
    # Relationships
    vendor = relationship("Vendor", back_populates="availability_slots")
    booking = relationship("Booking", back_populates="slot", uselist=False)
    
    def __repr__(self):
        return f"<AvailabilitySlot(id={self.id}, vendor_id={self.vendor_id}, date={self.slot_date}, time={self.slot_time}, status='{self.status}')>"
