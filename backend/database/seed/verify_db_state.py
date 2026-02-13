"""
Database State Verification Script
Verifies database integrity after seeding:
- All users have canonical schema
- Vendors have analytics fields
- No orphaned references
- No ghost users
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.firestore import firestore_db
from database.schema import Collections
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def verify_users():
    """Verify all users have canonical schema"""
    logger.info("\n📋 Verifying users collection...")
    
    required_fields = [
        'phone', 'name', 'email', 'role', 'created_at',
        'points', 'level', 'skill_rating', 'avatar_url',
        'stats', 'preferences', 'badges', 'is_online', 'last_active'
    ]
    
    users = firestore_db.db.collection(Collections.USERS).stream()
    user_count = 0
    issues = []
    user_ids = set()
    
    for user_doc in users:
        user_count += 1
        user_data = user_doc.to_dict()
        user_ids.add(user_doc.id)
        
        # Check required fields
        missing_fields = [field for field in required_fields if field not in user_data]
        if missing_fields:
            issues.append(f"  ❌ User {user_doc.id} missing fields: {missing_fields}")
        
        # Check nested objects
        if 'stats' in user_data:
            if not isinstance(user_data['stats'], dict):
                issues.append(f"  ❌ User {user_doc.id} has invalid stats (not a dict)")
            else:
                required_stats = ['matches_played', 'wins', 'losses']
                missing_stats = [s for s in required_stats if s not in user_data['stats']]
                if missing_stats:
                    issues.append(f"  ❌ User {user_doc.id} missing stats fields: {missing_stats}")
        
        if 'preferences' in user_data:
            if not isinstance(user_data['preferences'], dict):
                issues.append(f"  ❌ User {user_doc.id} has invalid preferences (not a dict)")
    
    if issues:
        logger.error(f"❌ Found {len(issues)} issues in users:")
        for issue in issues:
            logger.error(issue)
        return False, user_ids
    else:
        logger.info(f"✅ All {user_count} users have canonical schema")
        return True, user_ids


def verify_vendors():
    """Verify all vendors have analytics fields"""
    logger.info("\n📋 Verifying vendors collection...")
    
    analytics_fields = [
        'rating_sum', 'rating_count', 'average_rating',
        'revenue_today', 'revenue_week', 'revenue_month',
        'booking_count_today'
    ]
    
    vendors = firestore_db.db.collection(Collections.VENDORS).stream()
    vendor_count = 0
    issues = []
    
    for vendor_doc in vendors:
        vendor_count += 1
        vendor_data = vendor_doc.to_dict()
        
        missing_fields = [field for field in analytics_fields if field not in vendor_data]
        if missing_fields:
            issues.append(f"  ❌ Vendor {vendor_doc.id} missing analytics: {missing_fields}")
    
    if issues:
        logger.error(f"❌ Found {len(issues)} issues in vendors:")
        for issue in issues:
            logger.error(issue)
        return False
    else:
        logger.info(f"✅ All {vendor_count} vendors have analytics fields")
        return True


def verify_slots(user_ids):
    """Verify no orphaned slot references"""
    logger.info("\n📋 Verifying slots collection...")
    
    slots = firestore_db.db.collection(Collections.SLOTS).stream()
    slot_count = 0
    orphaned = []
    status_counts = {}
    
    for slot_doc in slots:
        slot_count += 1
        slot_data = slot_doc.to_dict()
        status = slot_data.get('status', 'unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
        
        # Check for orphaned user references
        user_id = slot_data.get('user_id')
        if user_id and user_id not in user_ids:
            orphaned.append(f"  ❌ Slot {slot_doc.id} references non-existent user: {user_id}")
    
    logger.info(f"   Slot status breakdown: {status_counts}")
    
    if orphaned:
        logger.error(f"❌ Found {len(orphaned)} orphaned slot references:")
        for issue in orphaned[:10]:  # Show first 10
            logger.error(issue)
        if len(orphaned) > 10:
            logger.error(f"   ... and {len(orphaned) - 10} more")
        return False
    else:
        logger.info(f"✅ All {slot_count} slots have valid references")
        return True


def verify_system_config():
    """Verify system config exists"""
    logger.info("\n📋 Verifying system_config...")
    
    config_doc = firestore_db.db.collection('system_config').document('global').get()
    
    if not config_doc.exists:
        logger.error("❌ system_config/global does not exist")
        return False
    
    config_data = config_doc.to_dict()
    required_fields = ['schema_version', 'payment_verification_mode', 'booking_lock_minutes']
    missing = [f for f in required_fields if f not in config_data]
    
    if missing:
        logger.error(f"❌ system_config missing fields: {missing}")
        return False
    
    logger.info(f"✅ system_config exists with schema_version: {config_data.get('schema_version')}")
    logger.info(f"   Payment mode: {config_data.get('payment_verification_mode')}")
    return True


def verify_database():
    """Run all verification checks"""
    logger.info("=" * 60)
    logger.info("DATABASE STATE VERIFICATION")
    logger.info("=" * 60)
    
    results = []
    
    # Verify system config
    results.append(("System Config", verify_system_config()))
    
    # Verify users and get user IDs
    users_ok, user_ids = verify_users()
    results.append(("Users Schema", users_ok))
    
    # Verify vendors
    results.append(("Vendors Analytics", verify_vendors()))
    
    # Verify slots (needs user IDs)
    results.append(("Slots References", verify_slots(user_ids)))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("VERIFICATION SUMMARY")
    logger.info("=" * 60)
    
    all_passed = True
    for check_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"{status} - {check_name}")
        if not passed:
            all_passed = False
    
    logger.info("=" * 60)
    
    if all_passed:
        logger.info("\n🎉 ALL CHECKS PASSED - Database is clean!")
        return True
    else:
        logger.error("\n❌ SOME CHECKS FAILED - Review issues above")
        return False


if __name__ == "__main__":
    success = verify_database()
    sys.exit(0 if success else 1)
