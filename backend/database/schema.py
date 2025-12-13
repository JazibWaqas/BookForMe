"""
Firestore Schema Definitions
Collection names, field constants, and status enums for the booking system
"""

from enum import Enum
from typing import TypedDict, Optional, List
from datetime import datetime


class Collections:
    USERS = "users"
    VENDORS = "vendors"
    RESOURCES = "resources"
    SERVICES = "services"
    SLOTS = "slots"
    PAYMENTS = "payments"
    VENDOR_PAYMENT_ACCOUNTS = "vendor_payment_accounts"
    CONVERSATION_STATES = "conversation_states"


class SlotStatus(str, Enum):
    AVAILABLE = "available"
    LOCKED = "locked"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    BLOCKED = "blocked"


class PaymentStatus(str, Enum):
    UPLOADED = "uploaded"
    VERIFIED = "verified"
    REJECTED = "rejected"


class PaymentAccountType(str, Enum):
    JAZZCASH = "jazzcash"
    EASYPAISA = "easypaisa"
    BANK = "bank"


class UserRole(str, Enum):
    CUSTOMER = "customer"
    VENDOR = "vendor"


class SportType(str, Enum):
    PADEL = "padel"
    FUTSAL = "futsal"
    CRICKET = "cricket"
    PICKLEBALL = "pickleball"


class PriceTier(str, Enum):
    BASE = "base"
    PEAK = "peak"
    DISCOUNT = "discount"


class BookingSource(str, Enum):
    APP = "app"
    WHATSAPP = "whatsapp"
    MANUAL = "manual"


class Areas:
    DHA = "DHA"
    CLIFTON = "Clifton"
    GULSHAN = "Gulshan"
    BAHRIA = "Bahria Town"
    KORANGI = "Korangi"


SLOT_DURATION_MINUTES = 60
HOLD_EXPIRY_MINUTES = 10
SLOT_GENERATION_DAYS = 14


DEFAULT_OPERATING_HOURS = {
    "mon": {"open": "07:00", "close": "00:00"},
    "tue": {"open": "07:00", "close": "00:00"},
    "wed": {"open": "07:00", "close": "00:00"},
    "thu": {"open": "07:00", "close": "00:00"},
    "fri": {"open": "07:00", "close": "00:00"},
    "sat": {"open": "08:00", "close": "00:00"},
    "sun": {"open": "08:00", "close": "00:00"}
}


WEEKEND_OPERATING_HOURS = {
    "mon": {"open": "08:00", "close": "00:00"},
    "tue": {"open": "08:00", "close": "00:00"},
    "wed": {"open": "08:00", "close": "00:00"},
    "thu": {"open": "08:00", "close": "00:00"},
    "fri": {"open": "08:00", "close": "02:00"},
    "sat": {"open": "08:00", "close": "02:00"},
    "sun": {"open": "09:00", "close": "00:00"}
}


SPORT_BASE_PRICING = {
    SportType.PADEL: {"min": 1500, "max": 2000},
    SportType.FUTSAL: {"min": 2000, "max": 2500},
    SportType.CRICKET: {"min": 1000, "max": 1500},
    SportType.PICKLEBALL: {"min": 1200, "max": 1500}
}
