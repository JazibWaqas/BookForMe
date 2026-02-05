"""
Pydantic Models for WhatsApp Booking Agent
Provides type safety and validation for the booking flow
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from enum import Enum
import re
import logging

logger = logging.getLogger(__name__)


class SlotStatus(str, Enum):
    AVAILABLE = "available"
    LOCKED = "locked"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Intent(str, Enum):
    GREETING = "greeting"
    BOOKING_REQUEST = "booking_request"
    AVAILABILITY_INQUIRY = "availability_inquiry"
    SERVICE_SELECTION = "service_selection"
    DATE_SELECTION = "date_selection"
    TIME_SELECTION = "time_selection"
    PRICE_INQUIRY = "price_inquiry"
    CONFIRMATION = "confirmation"
    CANCELLATION = "cancellation"
    MODIFICATION = "modification"
    INFORMATION = "information"
    PAYMENT_RELATED = "payment_related"
    NAME_PROVIDED = "name_provided"
    UNKNOWN = "unknown"


class AvailableSlot(BaseModel):
    """A slot available for booking from Firestore"""
    slot_id: str = Field(..., description="Firestore document ID")
    slot_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(default="", description="End time in HH:MM format")
    price: float = Field(default=0, description="Price in PKR")
    resource_id: str = Field(default="", description="Court/resource ID")
    resource_name: str = Field(default="", description="Court name like 'Court 1'")

    @field_validator('price', mode='before')
    @classmethod
    def clean_price(cls, v):
        if isinstance(v, (str, int)):
            original = v
            if isinstance(v, str):
                # Remove commas, currency symbols, and whitespace
                v = re.sub(r'[^\d\.]', '', v)
            try:
                result = float(v)
                if isinstance(original, str):
                    logger.info(f"💰 Cleaned price: '{original}' -> {result}")
                return result
            except ValueError:
                logger.warning(f"⚠️ Failed to parse price: '{original}', defaulting to 0.0")
                return 0.0
        return v or 0.0


class SelectedSlot(BaseModel):
    """A slot selected by the user for booking"""
    slot_id: str = Field(..., description="Firestore document ID - REQUIRED for booking")
    slot_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(default="", description="End time in HH:MM format")
    price: float = Field(..., description="Price in PKR - REQUIRED for payment")
    resource_id: str = Field(default="")
    vendor_id: str = Field(default="")

    @field_validator('price', mode='before')
    @classmethod
    def clean_price(cls, v):
        if isinstance(v, (str, int)):
            original = v
            if isinstance(v, str):
                v = re.sub(r'[^\d\.]', '', v)
            try:
                result = float(v)
                if isinstance(original, str):
                    logger.info(f"💰 Cleaned selected price: '{original}' -> {result}")
                return result
            except ValueError:
                logger.warning(f"⚠️ Failed to parse selected price: '{original}', defaulting to 0.0")
                return 0.0
        return v or 0.0


class VendorSlots(BaseModel):
    """Vendor with their available slots"""
    vendor_id: str
    vendor_name: str
    vendor_address: str = ""
    area: str = ""
    slots: List[AvailableSlot] = []


class AvailabilityResult(BaseModel):
    """Result from check_availability"""
    success: bool
    date: str = ""
    sport_type: str = ""
    area: str = ""
    vendors: List[VendorSlots] = []
    total_vendors: int = 0
    error: Optional[str] = None


class PendingBooking(BaseModel):
    """Booking waiting for confirmation"""
    slot: SelectedSlot
    slot_id: str = Field(..., description="Firestore slot document ID")
    date: str
    vendor_id: str
    service_type: str = "padel"
    area: str = "DHA"
    price: float = Field(default=0, description="Price for payment")


class BookingResult(BaseModel):
    """Result from booking operation"""
    success: bool
    booking_id: Optional[str] = None
    slot_id: Optional[str] = None
    status: str = ""
    amount: float = 0
    hold_expires_in_minutes: int = 0
    message: str = ""
    error: Optional[str] = None


class ExtractedEntities(BaseModel):
    """Entities extracted by NLU"""
    service_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    time_range: Optional[Dict[str, str]] = None
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_id: Optional[str] = None
    area: Optional[str] = None
    duration_hours: Optional[float] = None
    
    class Config:
        extra = "ignore"


class IntentResult(BaseModel):
    """Result from intent classification - LLM response model"""
    intent: str = "unknown"
    confidence: float = 0.0
    reasoning: Optional[str] = None
    entities: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    class Config:
        extra = "ignore"
    
    def get_entities_model(self) -> ExtractedEntities:
        """Convert dict entities to ExtractedEntities model"""
        if self.entities:
            return ExtractedEntities(**{k: v for k, v in self.entities.items() if v is not None})
        return ExtractedEntities()


class LLMIntentResponse(BaseModel):
    """Pydantic model for parsing LLM intent classification response"""
    intent: str = Field(default="unknown", description="Classified intent")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    reasoning: Optional[str] = None
    entities: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        extra = "ignore"


class LLMEntityResponse(BaseModel):
    """Pydantic model for parsing LLM entity extraction response"""
    service_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    vendor_name: Optional[str] = None
    area: Optional[str] = None
    
    class Config:
        extra = "ignore"


class PaymentDetails(BaseModel):
    """Vendor payment account details"""
    method: str = ""
    account_name: str = ""
    account_number: str = ""


def slot_from_query_result(slot_data: Dict[str, Any]) -> AvailableSlot:
    """Convert raw slot dict from query to AvailableSlot model"""
    time_slot = slot_data.get("time_slot", "")
    if " - " in time_slot:
        parts = time_slot.split(" - ")
        slot_time = parts[0].strip()
        end_time = parts[1].strip() if len(parts) > 1 else ""
    else:
        slot_time = slot_data.get("slot_time", time_slot)
        end_time = slot_data.get("end_time", "")
    
    return AvailableSlot(
        slot_id=slot_data.get("slot_id", "") or slot_data.get("id", ""),
        slot_time=slot_time,
        end_time=end_time,
        price=float(slot_data.get("price", 0)),
        resource_id=slot_data.get("resource_id", ""),
        resource_name=slot_data.get("resource_name", "")
    )


def find_matching_slot(
    user_time: str,
    available_slots: List[AvailableSlot]
) -> Optional[AvailableSlot]:
    """
    Find a slot that matches the user's requested time
    Handles various time formats
    """
    user_time_normalized = user_time.strip().replace(" ", "")
    
    for slot in available_slots:
        slot_time_normalized = slot.slot_time.strip().replace(" ", "")
        
        if slot_time_normalized == user_time_normalized:
            return slot
        
        if slot_time_normalized.startswith(user_time_normalized.split(":")[0] + ":"):
            return slot
    
    return None
