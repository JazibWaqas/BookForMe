"""
Conversation state model - for WhatsApp conversation tracking
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ConversationState(Base):
    """Conversation state model for WhatsApp interactions"""
    
    __tablename__ = "conversation_states"
    
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    state = Column(String(50), nullable=False)  # greeting, select_service, select_date, etc.
    context = Column(JSON, nullable=True)  # Store conversation context as JSON
    last_message_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    vendor = relationship("Vendor")
    
    def __repr__(self):
        return f"<ConversationState(phone='{self.phone_number}', state='{self.state}')>"
