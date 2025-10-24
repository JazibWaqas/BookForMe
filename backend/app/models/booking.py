"""
Booking model - represents customer bookings
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Booking(Base):
    """Booking model for customer reservations"""
    
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("availability_slots.id"), nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    booking_source = Column(String(50), nullable=False)  # whatsapp, web, sheet
    status = Column(String(20), default="pending")  # pending, confirmed, cancelled
    conversation_id = Column(String(255), nullable=True)  # For WhatsApp state tracking
    notes = Column(Text, nullable=True)
    price_paid = Column(DECIMAL(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    vendor = relationship("Vendor", back_populates="bookings")
    slot = relationship("AvailabilitySlot", back_populates="booking")
    
    def __repr__(self):
        return f"<Booking(id={self.id}, customer='{self.customer_name}', status='{self.status}')>"
