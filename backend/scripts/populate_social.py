import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set dummy key for config validation
os.environ["GROQ_API_KEY"] = "dummy_key_for_scripts"

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

def create_chats(users):
    messages = [
        "Hey, are you free for a game?",
        "Yes, what time?",
        "How about 6 PM?",
        "Perfect, see you there!",
        "Did you bring the racquets?",
        "On my way!",
        "Great game yesterday!",
        "Thanks, you played well too."
    ]
    
    # Create 5 conversations
    for i in range(5):
        # Pick 2 random users
        participants = random.sample(users, 2)
        p1, p2 = participants[0], participants[1]
        
        # Conversation ID is usually sorted IDs joined, or auto-generated. 
        # For simplicity and to match common patterns, we'll let Firestore auto-id or just make one.
        # But wait, our API might expect specific structure. 
        # Let's create a conversation document.
        conv_data = {
            "participants": participants,
            "last_message": random.choice(messages),
            "updated_at": datetime.now() - timedelta(minutes=random.randint(1, 120)),
            "created_at": datetime.now() - timedelta(days=1),
            "type": "individual"
        }
        conv_ref = db.collection('conversations').add(conv_data)[1]
        
        # Add messages to subcollection
        for _ in range(random.randint(3, 8)):
            sender = random.choice(participants)
            msg_data = {
                "conversation_id": conv_ref.id,
                "sender_id": sender,
                "content": random.choice(messages),
                "created_at": datetime.now() - timedelta(minutes=random.randint(1, 60)),
                "read": True
            }
            db.collection('conversations').document(conv_ref.id).collection('messages').add(msg_data)
            
    print("Created 5 chats with messages")

def main():
    print("Populating Social Data...")
    users = create_users(8)
    create_posts(users)
    create_matches(users)
    create_chats(users)
    print("Done!")

if __name__ == "__main__":
    main()
