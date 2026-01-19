import sys
import os

# Add parent directory to path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore import firestore_db
from datetime import datetime, timedelta
import random

db = firestore_db.db

def create_users(count=5):
    users = []
    names = ["Ahmed Khan", "Sara Ali", "Bilal Shah", "Fatima Malik", "Omar Shah", "Zainab Khan", "Hassan Raza", "Ayesha Bibi"]
    avatars = [
        "https://i.pravatar.cc/150?img=12", "https://i.pravatar.cc/150?img=5", 
        "https://i.pravatar.cc/150?img=33", "https://i.pravatar.cc/150?img=47",
        "https://i.pravatar.cc/150?img=51", "https://i.pravatar.cc/150?img=32",
        "https://i.pravatar.cc/150?img=60", "https://i.pravatar.cc/150?img=20"
    ]
    
    for i in range(count):
        uid = f"user_{i}"
        name = names[i % len(names)]
        user_data = {
            "name": name,
            "email": f"user{i}@example.com",
            "avatar_url": avatars[i % len(avatars)],
            "points": random.randint(100, 3000),
            "rank": random.randint(1, 100),
            "created_at": datetime.now()
        }
        db.collection('users').document(uid).set(user_data)
        print(f"Created user: {name} ({uid})")
        users.append(uid)
    return users

def create_posts(users):
    contents = [
        "Looking for a match this weekend!",
        "Just won my first Padel tournament! 🏆",
        "Anyone available for a quick game at DHA?",
        "Tennis practice was intense today.",
        "Badminton is underrated, change my mind.",
        "Check out this new gear I got.",
        "Need a partner for the upcoming league.",
        "Weather is perfect for sports today! ☀️",
        "Great game with @Ahmed today.",
        "Training hard for the championships."
    ]
    
    for i in range(15):
        uid = random.choice(users)
        post_data = {
            "user_id": uid,
            "type": "general",
            "content": random.choice(contents),
            "created_at": datetime.now() - timedelta(hours=random.randint(1, 48)),
            "updated_at": datetime.now(),
            "likes_count": random.randint(0, 50),
            "comments_count": random.randint(0, 10),
            "likes": []
        }
        db.collection('posts').add(post_data)
    print("Created 15 posts")

def create_matches(users):
    sports = ["Padel", "Tennis", "Badminton"]
    locations = ["DHA Courts", "Sports Complex", "City Arena", "Club 5"]
    
    for i in range(8):
        host = random.choice(users)
        data = {
            "host_user_id": host,
            "sport_type": random.choice(sports),
            "match_type": "casual" if random.random() > 0.3 else "ranked",
            "date": "Tomorrow",
            "time": f"{random.randint(6, 10)}:00 PM",
            "location": random.choice(locations),
            "max_players": 4,
            "current_players": 1,
            "participants_ids": [host],
            "status": "open",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        db.collection('matches').add(data)
    print("Created 8 matches")

def main():
    print("Populating Social Data...")
    users = create_users(8)
    create_posts(users)
    create_matches(users)
    print("Done!")

if __name__ == "__main__":
    main()
