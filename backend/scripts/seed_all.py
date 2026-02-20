"""
Convenience wrapper for the master seed script.
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
    
    args = parser.parse_args()
    
    import asyncio
    from database.seed.seed_all import get_firestore_client, clear_collections
    
    if args.clear:
        db = get_firestore_client()
        clear_collections(db)
        
    seed_all(days=args.days)
