"""
Vendor seed data for Firestore
Includes vendors, resources, services, and payment accounts
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database.schema import (
    SportType, PaymentAccountType, Areas,
    DEFAULT_OPERATING_HOURS, WEEKEND_OPERATING_HOURS
)


VENDORS_DATA = [
    {
        "id": "ace_padel_dha",
        "name": "Ace Padel Club",
        "area": Areas.DHA,
        "address": "Street 12, Phase 6, DHA, Karachi",
        "phone": "+92 321 1234567",
        "whatsapp_number": "+92 321 1234567",
        "operating_hours": DEFAULT_OPERATING_HOURS,
        "description": "Premium padel facility with international-standard courts"
    },
    {
        "id": "golden_court_dha",
        "name": "Golden Court",
        "area": Areas.DHA,
        "address": "Commercial Area, Phase 5, DHA, Karachi",
        "phone": "+92 322 2345678",
        "whatsapp_number": "+92 322 2345678",
        "operating_hours": DEFAULT_OPERATING_HOURS,
        "description": "Modern padel courts with coaching available"
    },
    {
        "id": "smash_padel_clifton",
        "name": "Smash Padel",
        "area": Areas.CLIFTON,
        "address": "Block 4, Clifton, Karachi",
        "phone": "+92 323 3456789",
        "whatsapp_number": "+92 323 3456789",
        "operating_hours": WEEKEND_OPERATING_HOURS,
        "description": "Family-friendly padel center with cafe"
    },
    {
        "id": "elite_futsal_clifton",
        "name": "Elite Futsal Arena",
        "area": Areas.CLIFTON,
        "address": "Sea View, Clifton, Karachi",
        "phone": "+92 324 4567890",
        "whatsapp_number": "+92 324 4567890",
        "operating_hours": WEEKEND_OPERATING_HOURS,
        "description": "Professional futsal pitches with floodlights"
    },
    {
        "id": "goal_zone_gulshan",
        "name": "Goal Zone",
        "area": Areas.GULSHAN,
        "address": "Block 13-D, Gulshan-e-Iqbal, Karachi",
        "phone": "+92 325 5678901",
        "whatsapp_number": "+92 325 5678901",
        "operating_hours": DEFAULT_OPERATING_HOURS,
        "description": "Indoor futsal arena with air conditioning"
    },
    {
        "id": "urban_futsal_bahria",
        "name": "Urban Futsal",
        "area": Areas.BAHRIA,
        "address": "Precinct 10, Bahria Town, Karachi",
        "phone": "+92 326 6789012",
        "whatsapp_number": "+92 326 6789012",
        "operating_hours": DEFAULT_OPERATING_HOURS,
        "description": "State-of-the-art futsal facility"
    },
    {
        "id": "clifton_cricket_nets",
        "name": "Clifton Cricket Nets",
        "area": Areas.CLIFTON,
        "address": "Block 9, Clifton, Karachi",
        "phone": "+92 327 7890123",
        "whatsapp_number": "+92 327 7890123",
        "operating_hours": DEFAULT_OPERATING_HOURS,
        "description": "Professional cricket practice nets with bowling machines"
    },
    {
        "id": "pitch_perfect_dha",
        "name": "Pitch Perfect",
        "area": Areas.DHA,
        "address": "Phase 8, DHA, Karachi",
        "phone": "+92 328 8901234",
        "whatsapp_number": "+92 328 8901234",
        "operating_hours": DEFAULT_OPERATING_HOURS,
        "description": "Cricket nets and coaching academy"
    },
    {
        "id": "pickle_pod_dha",
        "name": "The Pickle Pod",
        "area": Areas.DHA,
        "address": "Zamzama, Phase 5, DHA, Karachi",
        "phone": "+92 329 9012345",
        "whatsapp_number": "+92 329 9012345",
        "operating_hours": WEEKEND_OPERATING_HOURS,
        "description": "Karachi's first dedicated pickleball facility"
    },
    {
        "id": "dink_masters_clifton",
        "name": "Dink Masters",
        "area": Areas.CLIFTON,
        "address": "Block 2, Clifton, Karachi",
        "phone": "+92 330 0123456",
        "whatsapp_number": "+92 330 0123456",
        "operating_hours": DEFAULT_OPERATING_HOURS,
        "description": "Premium pickleball courts with equipment rental"
    },
    {
        "id": "rally_point_gulshan",
        "name": "Rally Point",
        "area": Areas.GULSHAN,
        "address": "Block 10-A, Gulshan-e-Iqbal, Karachi",
        "phone": "+92 331 1234567",
        "whatsapp_number": "+92 331 1234567",
        "operating_hours": DEFAULT_OPERATING_HOURS,
        "description": "Multi-court pickleball center"
    }
]


RESOURCES_DATA = [
    {"id": "ace_court_1", "vendor_id": "ace_padel_dha", "name": "Court 1", "capacity": 4, "active": True},
    {"id": "ace_court_2", "vendor_id": "ace_padel_dha", "name": "Court 2", "capacity": 4, "active": True},
    {"id": "ace_court_3", "vendor_id": "ace_padel_dha", "name": "Court 3", "capacity": 4, "active": True},
    
    {"id": "golden_court_a", "vendor_id": "golden_court_dha", "name": "Court A", "capacity": 4, "active": True},
    {"id": "golden_court_b", "vendor_id": "golden_court_dha", "name": "Court B", "capacity": 4, "active": True},
    
    {"id": "smash_court_1", "vendor_id": "smash_padel_clifton", "name": "Court 1", "capacity": 4, "active": True},
    {"id": "smash_court_2", "vendor_id": "smash_padel_clifton", "name": "Court 2", "capacity": 4, "active": True},
    
    {"id": "elite_pitch_1", "vendor_id": "elite_futsal_clifton", "name": "Pitch 1", "capacity": 10, "active": True},
    {"id": "elite_pitch_2", "vendor_id": "elite_futsal_clifton", "name": "Pitch 2", "capacity": 10, "active": True},
    
    {"id": "goal_zone_pitch", "vendor_id": "goal_zone_gulshan", "name": "Main Pitch", "capacity": 10, "active": True},
    
    {"id": "urban_pitch_1", "vendor_id": "urban_futsal_bahria", "name": "Pitch 1", "capacity": 10, "active": True},
    {"id": "urban_pitch_2", "vendor_id": "urban_futsal_bahria", "name": "Pitch 2", "capacity": 10, "active": True},
    
    {"id": "clifton_net_1", "vendor_id": "clifton_cricket_nets", "name": "Net 1", "capacity": 2, "active": True},
    {"id": "clifton_net_2", "vendor_id": "clifton_cricket_nets", "name": "Net 2", "capacity": 2, "active": True},
    
    {"id": "pitch_perfect_net", "vendor_id": "pitch_perfect_dha", "name": "Practice Net", "capacity": 2, "active": True},
    
    {"id": "pickle_pod_court_1", "vendor_id": "pickle_pod_dha", "name": "Court 1", "capacity": 4, "active": True},
    {"id": "pickle_pod_court_2", "vendor_id": "pickle_pod_dha", "name": "Court 2", "capacity": 4, "active": True},
    
    {"id": "dink_court", "vendor_id": "dink_masters_clifton", "name": "Main Court", "capacity": 4, "active": True},
    
    {"id": "rally_court_1", "vendor_id": "rally_point_gulshan", "name": "Court 1", "capacity": 4, "active": True},
    {"id": "rally_court_2", "vendor_id": "rally_point_gulshan", "name": "Court 2", "capacity": 4, "active": True}
]


SERVICES_DATA = [
    {
        "id": "ace_padel_service",
        "vendor_id": "ace_padel_dha",
        "sport_type": SportType.PADEL.value,
        "name": "Padel Court Booking",
        "duration_min": 60,
        "pricing": {"base": 2000},
        "active": True
    },
    {
        "id": "golden_padel_service",
        "vendor_id": "golden_court_dha",
        "sport_type": SportType.PADEL.value,
        "name": "Padel Court Booking",
        "duration_min": 60,
        "pricing": {"base": 1800},
        "active": True
    },
    {
        "id": "smash_padel_service",
        "vendor_id": "smash_padel_clifton",
        "sport_type": SportType.PADEL.value,
        "name": "Padel Court Booking",
        "duration_min": 60,
        "pricing": {"base": 1500},
        "active": True
    },
    {
        "id": "elite_futsal_service",
        "vendor_id": "elite_futsal_clifton",
        "sport_type": SportType.FUTSAL.value,
        "name": "Futsal Pitch Booking",
        "duration_min": 60,
        "pricing": {"base": 2500},
        "active": True
    },
    {
        "id": "goal_zone_service",
        "vendor_id": "goal_zone_gulshan",
        "sport_type": SportType.FUTSAL.value,
        "name": "Futsal Pitch Booking",
        "duration_min": 60,
        "pricing": {"base": 2000},
        "active": True
    },
    {
        "id": "urban_futsal_service",
        "vendor_id": "urban_futsal_bahria",
        "sport_type": SportType.FUTSAL.value,
        "name": "Futsal Pitch Booking",
        "duration_min": 60,
        "pricing": {"base": 2200},
        "active": True
    },
    {
        "id": "clifton_cricket_service",
        "vendor_id": "clifton_cricket_nets",
        "sport_type": SportType.CRICKET.value,
        "name": "Cricket Net Session",
        "duration_min": 60,
        "pricing": {"base": 1200},
        "active": True
    },
    {
        "id": "pitch_perfect_service",
        "vendor_id": "pitch_perfect_dha",
        "sport_type": SportType.CRICKET.value,
        "name": "Cricket Net Session",
        "duration_min": 60,
        "pricing": {"base": 1500},
        "active": True
    },
    {
        "id": "pickle_pod_service",
        "vendor_id": "pickle_pod_dha",
        "sport_type": SportType.PICKLEBALL.value,
        "name": "Pickleball Court Booking",
        "duration_min": 60,
        "pricing": {"base": 1500},
        "active": True
    },
    {
        "id": "dink_masters_service",
        "vendor_id": "dink_masters_clifton",
        "sport_type": SportType.PICKLEBALL.value,
        "name": "Pickleball Court Booking",
        "duration_min": 60,
        "pricing": {"base": 1400},
        "active": True
    },
    {
        "id": "rally_point_service",
        "vendor_id": "rally_point_gulshan",
        "sport_type": SportType.PICKLEBALL.value,
        "name": "Pickleball Court Booking",
        "duration_min": 60,
        "pricing": {"base": 1200},
        "active": True
    }
]


PAYMENT_ACCOUNTS_DATA = [
    {"id": "ace_jazzcash", "vendor_id": "ace_padel_dha", "type": PaymentAccountType.JAZZCASH.value, "account_number": "03211234567", "account_title": "Ace Padel Club", "bank_name": None, "is_default": True},
    {"id": "ace_easypaisa", "vendor_id": "ace_padel_dha", "type": PaymentAccountType.EASYPAISA.value, "account_number": "03211234567", "account_title": "Ace Padel Club", "bank_name": None, "is_default": False},
    
    {"id": "golden_jazzcash", "vendor_id": "golden_court_dha", "type": PaymentAccountType.JAZZCASH.value, "account_number": "03222345678", "account_title": "Golden Court", "bank_name": None, "is_default": True},
    {"id": "golden_bank", "vendor_id": "golden_court_dha", "type": PaymentAccountType.BANK.value, "account_number": "PK36MEZN0001234567890", "account_title": "Golden Court Pvt Ltd", "bank_name": "Meezan Bank", "is_default": False},
    
    {"id": "smash_easypaisa", "vendor_id": "smash_padel_clifton", "type": PaymentAccountType.EASYPAISA.value, "account_number": "03233456789", "account_title": "Smash Padel", "bank_name": None, "is_default": True},
    
    {"id": "elite_jazzcash", "vendor_id": "elite_futsal_clifton", "type": PaymentAccountType.JAZZCASH.value, "account_number": "03244567890", "account_title": "Elite Futsal", "bank_name": None, "is_default": True},
    {"id": "elite_bank", "vendor_id": "elite_futsal_clifton", "type": PaymentAccountType.BANK.value, "account_number": "PK50HBL00001234567891", "account_title": "Elite Sports Pvt Ltd", "bank_name": "HBL", "is_default": False},
    
    {"id": "goal_jazzcash", "vendor_id": "goal_zone_gulshan", "type": PaymentAccountType.JAZZCASH.value, "account_number": "03255678901", "account_title": "Goal Zone", "bank_name": None, "is_default": True},
    
    {"id": "urban_easypaisa", "vendor_id": "urban_futsal_bahria", "type": PaymentAccountType.EASYPAISA.value, "account_number": "03266789012", "account_title": "Urban Futsal", "bank_name": None, "is_default": True},
    
    {"id": "clifton_jazzcash", "vendor_id": "clifton_cricket_nets", "type": PaymentAccountType.JAZZCASH.value, "account_number": "03277890123", "account_title": "Clifton Cricket", "bank_name": None, "is_default": True},
    
    {"id": "pitch_easypaisa", "vendor_id": "pitch_perfect_dha", "type": PaymentAccountType.EASYPAISA.value, "account_number": "03288901234", "account_title": "Pitch Perfect", "bank_name": None, "is_default": True},
    
    {"id": "pickle_jazzcash", "vendor_id": "pickle_pod_dha", "type": PaymentAccountType.JAZZCASH.value, "account_number": "03299012345", "account_title": "The Pickle Pod", "bank_name": None, "is_default": True},
    {"id": "pickle_bank", "vendor_id": "pickle_pod_dha", "type": PaymentAccountType.BANK.value, "account_number": "PK72UBL00001234567892", "account_title": "Pickle Pod Sports", "bank_name": "UBL", "is_default": False},
    
    {"id": "dink_easypaisa", "vendor_id": "dink_masters_clifton", "type": PaymentAccountType.EASYPAISA.value, "account_number": "03300123456", "account_title": "Dink Masters", "bank_name": None, "is_default": True},
    
    {"id": "rally_jazzcash", "vendor_id": "rally_point_gulshan", "type": PaymentAccountType.JAZZCASH.value, "account_number": "03311234567", "account_title": "Rally Point", "bank_name": None, "is_default": True}
]


def get_vendor_resources(vendor_id: str) -> list:
    return [r for r in RESOURCES_DATA if r["vendor_id"] == vendor_id]


def get_vendor_service(vendor_id: str) -> dict:
    for s in SERVICES_DATA:
        if s["vendor_id"] == vendor_id:
            return s
    return None


def get_vendor_default_payment(vendor_id: str) -> str:
    for p in PAYMENT_ACCOUNTS_DATA:
        if p["vendor_id"] == vendor_id and p["is_default"]:
            return p["id"]
    return None
