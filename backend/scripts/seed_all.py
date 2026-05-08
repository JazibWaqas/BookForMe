"""
Convenience wrapper for the master seed script.

This writes to Firestore. For routine slot maintenance, prefer the canonical
additive path: backend/database/seed/smart_reseed.py.
"""
import os
import sys

# Change to the backend directory to ensure relative imports work correctly in the master script
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Add current directory to path
sys.path.insert(0, os.getcwd())

from database.seed.seed_all import seed_all

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Seed Firestore database")
    parser.add_argument("--days", type=int, default=14, help="Number of days to generate slots for")
    parser.add_argument("--clear", action="store_true", help="Clear existing data before seeding")
    parser.add_argument(
        "--write",
        action="store_true",
        help="Required safety flag. This script writes to Firestore.",
    )
    
    args = parser.parse_args()

    if not args.write:
        print(
            "Refusing to run without --write. This script mutates Firestore.\n"
            "For routine slot maintenance, use backend/database/seed/smart_reseed.py."
        )
        sys.exit(2)
    
    import asyncio
    from database.seed.seed_all import get_firestore_client, clear_collections
    
    if args.clear:
        db = get_firestore_client()
        clear_collections(db)
        
    seed_all(days=args.days)
