"""
Seed script: creates test open matches in Firestore for testing join/create flow.
Run from the backend/ directory:  python seed_matches.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.firestore import firestore_db
from datetime import datetime, timedelta, date

db = firestore_db.db

matches = [
    {
        "sport_type": "Padel",
        "match_type": "casual",
        "host_user_id": "seed_host_1",
        "date": (date.today() + timedelta(days=1)).isoformat(),
        "time": "18:00",
        "location": "DHA Sports Club, Karachi",
        "max_players": 4,
        "current_players": 1,
        "participants_ids": ["seed_host_1"],
        "description": "Looking for 3 more Padel players! Beginners welcome.",
        "status": "open",
    },
    {
        "sport_type": "Futsal",
        "match_type": "ranked",
        "host_user_id": "seed_host_2",
        "date": (date.today() + timedelta(days=2)).isoformat(),
        "time": "20:00",
        "location": "Clifton Sports Arena",
        "max_players": 10,
        "current_players": 3,
        "participants_ids": ["seed_host_2", "seed_p2", "seed_p3"],
        "description": "Ranked 5-a-side Futsal. Need 7 more!",
        "status": "open",
    },
    {
        "sport_type": "Cricket",
        "match_type": "casual",
        "host_user_id": "seed_host_3",
        "date": (date.today() + timedelta(days=3)).isoformat(),
        "time": "08:00",
        "location": "NIPA Ground, Karachi",
        "max_players": 22,
        "current_players": 8,
        "participants_ids": ["seed_host_3"] + [f"seed_c{i}" for i in range(7)],
        "description": "Sunday cricket! Need 14 more. All skill levels.",
        "status": "open",
    },
    {
        "sport_type": "Pickleball",
        "match_type": "casual",
        "host_user_id": "seed_host_4",
        "date": (date.today() + timedelta(days=1)).isoformat(),
        "time": "17:30",
        "location": "Bahria Sports Complex",
        "max_players": 4,
        "current_players": 2,
        "participants_ids": ["seed_host_4", "seed_pb2"],
        "description": "Casual Pickleball doubles. 2 more spots!",
        "status": "open",
    },
    {
        "sport_type": "Padel",
        "match_type": "ranked",
        "host_user_id": "seed_host_5",
        "date": (date.today() + timedelta(days=4)).isoformat(),
        "time": "19:00",
        "location": "The Courts, Defence",
        "max_players": 4,
        "current_players": 1,
        "participants_ids": ["seed_host_5"],
        "description": "Ranked Padel. Intermediate/Advanced players.",
        "status": "open",
    },
]

added = 0
for m in matches:
    m["created_at"] = datetime.now()
    m["updated_at"] = datetime.now()
    db.collection("matches").add(m)
    added += 1
    print(f"  ✅ Created [{m['sport_type']} | {m['match_type']}] on {m['date']} at {m['location']}")

print(f"\n🎉 Done! {added} test matches created in Firestore.")
