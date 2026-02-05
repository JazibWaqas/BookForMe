"""
Populate timeslots for the next N days in Firestore
Simple script to generate and seed slots
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import argparse
from database.seed.seed_all import get_firestore_client, seed_slots

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="Populate timeslots in Firestore database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/populate_slots.py --days 15
  python scripts/populate_slots.py --days 30
  python scripts/populate_slots.py  # Default: 15 days
        """
    )
    
    parser.add_argument(
        "--days",
        type=int,
        default=15,
        help="Number of days to generate slots for (default: 15)"
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("Populating Timeslots in Firestore")
    logger.info("=" * 60)
    logger.info(f"Days to generate: {args.days}")
    logger.info("=" * 60)
    
    try:
        db = get_firestore_client()
        logger.info("✅ Firestore client initialized")
        
        logger.info(f"Generating slots for {args.days} days...")
        seed_slots(db, days=args.days)
        
        logger.info("=" * 60)
        logger.info("✅ Slots population completed successfully!")
        logger.info(f"✅ Generated slots for {args.days} days")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error("=" * 60)
        logger.error(f"❌ Slots population failed: {e}")
        logger.error("=" * 60)
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()
