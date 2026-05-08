"""
Read-only smoke check for the current Firestore booking shape.
"""

import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore import firestore_db
from google.cloud.firestore_v1.base_query import FieldFilter


SUPPORTED_SPORTS = ["padel", "futsal", "cricket", "pickleball"]


async def test_firestore_connection():
    """Verify the current canonical collections can be queried."""
    print("Testing Firestore connection...")

    try:
        if not firestore_db.db:
            print("ERROR: Firestore not initialized")
            return False

        vendors = list(firestore_db.db.collection("vendors").limit(5).stream())
        services = list(firestore_db.db.collection("services").limit(5).stream())
        resources = list(firestore_db.db.collection("resources").limit(5).stream())
        slots = list(firestore_db.db.collection("slots").limit(5).stream())

        print(f"vendors sample: {len(vendors)}")
        print(f"services sample: {len(services)}")
        print(f"resources sample: {len(resources)}")
        print(f"slots sample: {len(slots)}")

        print("\nSupported sport service counts:")
        for sport in SUPPORTED_SPORTS:
            docs = firestore_db.db.collection("services").where(
                filter=FieldFilter("sport_type", "==", sport)
            ).stream()
            count = len(list(docs))
            print(f"  {sport}: {count}")

        print("\nSample slot IDs:")
        for doc in slots[:5]:
            data = doc.to_dict() or {}
            print(
                f"  {doc.id} | {data.get('date')} | "
                f"{data.get('vendor_id')} | {data.get('status')}"
            )

        return True

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    asyncio.run(test_firestore_connection())
