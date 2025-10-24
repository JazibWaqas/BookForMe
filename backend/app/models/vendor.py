"""
Vendor model - represents service providers (futsal courts, salons)
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Vendor(Base):
    """Vendor model for service providers"""
    
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    service_type = Column(String(100), nullable=False)  # futsal, salon, etc.
    whatsapp_connected = Column(Boolean, default=False)
    sheet_id = Column(String(255), nullable=True)  # Google Sheets ID
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Vendor(id={self.id}, name='{self.name}', service_type='{self.service_type}')>"
