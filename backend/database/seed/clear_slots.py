"""
Destructive legacy helper: deletes every document in the slots collection.

For normal slot maintenance, use smart_reseed.py. This file is kept only for a
deliberate dev reset and refuses to run without an explicit confirmation flag.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database.seed.seed_all import get_firestore_client
from database.schema import Collections
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def clear_all_slots():
    db = get_firestore_client()
    
    logger.warning("Deleting all slots (this is destructive)...")
    
    deleted = 0
    batch = db.batch()
    batch_count = 0
    
    slots = db.collection(Collections.SLOTS).stream()
    
    for slot in slots:
        batch.delete(slot.reference)
        batch_count += 1
        deleted += 1
        
        if batch_count >= 500:
            batch.commit()
            logger.info(f"  Deleted batch of {batch_count} slots (total: {deleted})")
            batch = db.batch()
            batch_count = 0
    
    if batch_count > 0:
        batch.commit()
        logger.info(f"  Deleted final batch of {batch_count} slots")
    
    logger.info(f"✅ Deleted {deleted} slots total")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Delete every slot document")
    parser.add_argument(
        "--confirm-delete-slots",
        action="store_true",
        help="Required. Confirms you intend to delete all slot documents.",
    )
    args = parser.parse_args()

    if not args.confirm_delete_slots:
        logger.error(
            "Refusing to delete slots without --confirm-delete-slots. "
            "Use smart_reseed.py for safe additive slot creation."
        )
        sys.exit(2)

    clear_all_slots()
