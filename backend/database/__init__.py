"""
Database Module
Handles Firestore operations and availability checking

V2 Schema includes:
- users
- vendors
- resources
- services
- slots (with state management)
- payments
- vendor_payment_accounts
- conversation_states
"""

from database.schema import (
    Collections,
    SlotStatus,
    PaymentStatus,
    PaymentAccountType,
    UserRole,
    SportType,
    PriceTier,
    BookingSource,
    Areas
)
