"""
Ensure canonical slots exist without touching other collections.

This is now a compatibility wrapper around smart_reseed.py. It creates missing
slot documents only and does not delete or overwrite existing slots.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import logging
from database.seed.seed_all import get_firestore_client
from database.seed.smart_reseed import smart_reseed

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Ensure canonical slot documents exist")
    parser.add_argument(
        "--write",
        action="store_true",
        help="Required safety flag. This creates missing slot documents.",
    )
    
    args = parser.parse_args()

    if not args.write:
        logger.error("Refusing to run without --write. This script mutates Firestore.")
        sys.exit(2)
    
    logger.info("=" * 60)
    logger.info("Ensuring SLOTS collection via smart_reseed")
    logger.info("=" * 60)
    
    try:
        db = get_firestore_client()
        logger.info("Firestore client initialized")
        
        created = smart_reseed(db)
        
        logger.info("=" * 60)
        logger.info(f"Slot maintenance completed successfully ({created} created)")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Slots seeding failed: {e}")
        raise
