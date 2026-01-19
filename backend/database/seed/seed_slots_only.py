"""
Seed only the slots collection (does not touch other collections)
Use this after manually deleting the slots collection
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import logging
from database.seed.seed_all import get_firestore_client, seed_slots

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed only the slots collection")
    parser.add_argument("--days", type=int, default=14, help="Number of days to generate slots for")
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("Seeding SLOTS collection only")
    logger.info("=" * 60)
    
    try:
        db = get_firestore_client()
        logger.info("Firestore client initialized")
        
        seed_slots(db, days=args.days)
        
        logger.info("=" * 60)
        logger.info("Slots seeding completed successfully")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Slots seeding failed: {e}")
        raise
