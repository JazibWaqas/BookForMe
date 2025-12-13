"""
User seed data for Firestore
Includes test customers and vendor-role users
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database.schema import UserRole


USERS_DATA = [
    {
        "id": "user_ahmad",
        "phone": "+92 333 1111111",
        "name": "Ahmad Khan",
        "email": "ahmad.khan@email.com",
        "role": UserRole.CUSTOMER.value,
        "vendor_id": None
    },
    {
        "id": "user_taha",
        "phone": "+92 333 2222222",
        "name": "Taha Hussain",
        "email": "taha.hussain@email.com",
        "role": UserRole.CUSTOMER.value,
        "vendor_id": None
    },
    {
        "id": "user_maryam",
        "phone": "+92 333 3333333",
        "name": "Maryam Ali",
        "email": "maryam.ali@email.com",
        "role": UserRole.CUSTOMER.value,
        "vendor_id": None
    },
    {
        "id": "user_sara",
        "phone": "+92 333 4444444",
        "name": "Sara Ahmed",
        "email": "sara.ahmed@email.com",
        "role": UserRole.CUSTOMER.value,
        "vendor_id": None
    },
    {
        "id": "user_bilal",
        "phone": "+92 333 5555555",
        "name": "Bilal Shah",
        "email": "bilal.shah@email.com",
        "role": UserRole.CUSTOMER.value,
        "vendor_id": None
    },
    {
        "id": "vendor_admin_ace",
        "phone": "+92 321 1234567",
        "name": "Ace Padel Admin",
        "email": "admin@acepadel.pk",
        "role": UserRole.VENDOR.value,
        "vendor_id": "ace_padel_dha"
    }
]


TEST_PAYMENTS_DATA = [
    {
        "id": "payment_test_1",
        "slot_id": None,
        "user_id": "user_ahmad",
        "vendor_id": "ace_padel_dha",
        "screenshot_url": "https://storage.example.com/payments/test_screenshot_1.jpg",
        "amount_claimed": 2000,
        "ocr_verified_amount": 2000,
        "status": "verified"
    },
    {
        "id": "payment_test_2",
        "slot_id": None,
        "user_id": "user_taha",
        "vendor_id": "elite_futsal_clifton",
        "screenshot_url": "https://storage.example.com/payments/test_screenshot_2.jpg",
        "amount_claimed": 2500,
        "ocr_verified_amount": None,
        "status": "uploaded"
    }
]
