import asyncio
from app.firestore import firestore_db
from google.cloud.firestore_v1.base_query import FieldFilter

USER_ID = "8Gn0tTHxSItHnOdBT0gj"

async def main():
    print(f"Checking slots/bookings for user_id={USER_ID}")

    # Query slots where user_id matches
    q = firestore_db.db.collection("slots").where(filter=FieldFilter("user_id", "==", USER_ID))
    docs = list(q.stream())
    print(f"slots where user_id=={USER_ID}: {len(docs)}")

    # Show sample
    for doc in docs[:10]:
        d = doc.to_dict()
        print(
            f"- {doc.id} status={d.get('status')} vendor_id={d.get('vendor_id')} date={d.get('date')} start_time={d.get('start_time')} payment_id={d.get('payment_id')}"
        )

    # Also check if bookings are stored in a separate collection
    bookings_col = firestore_db.db.collection("bookings")
    try:
        qb = bookings_col.where(filter=FieldFilter("user_id", "==", USER_ID))
        bdocs = list(qb.stream())
        print(f"bookings collection docs where user_id=={USER_ID}: {len(bdocs)}")
        for doc in bdocs[:10]:
            d = doc.to_dict()
            print(f"- booking {doc.id} keys={list(d.keys())}")
    except Exception as e:
        print(f"Error querying bookings collection: {e}")

if __name__ == "__main__":
    asyncio.run(main())
