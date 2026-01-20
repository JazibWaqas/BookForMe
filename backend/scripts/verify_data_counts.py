import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["GROQ_API_KEY"] = "dummy"

from app.firestore import firestore_db

async def count_docs():
    db = firestore_db.db
    collections = ['users', 'vendors', 'posts', 'matches', 'conversations', 'bookings']
    print("Database Counts:")
    for col in collections:
        docs = db.collection(col).stream()
        count = sum(1 for _ in docs)
        print(f"  - {col}: {count}")

if __name__ == "__main__":
    asyncio.run(count_docs())
