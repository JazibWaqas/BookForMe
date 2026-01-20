"""
Protect and manage social users separately from seed data
Allows partner to create test users without interfering with core seed
"""

import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google.cloud import firestore
from app.config import settings
import tempfile


def get_firestore_client():
    """Get Firestore client"""
    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        creds_data = json.loads(settings.GOOGLE_APPLICATION_CREDENTIALS)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(creds_data, f)
            temp_file = f.name
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file
    else:
        creds_file = settings.FIRESTORE_CREDENTIALS_FILE
        if not os.path.isabs(creds_file):
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            creds_file = os.path.join(backend_dir, 'credentials', 'firestore-service-account.json')

        if os.path.exists(creds_file):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_file

    return firestore.Client(project=settings.FIRESTORE_PROJECT_ID)


# Protected social test users (partner can use these)
SOCIAL_TEST_USERS = [
    {
        "id": "social_user_ahmad",
        "phone": "+92 333 1119999",
        "name": "Ahmad Social",
        "email": "ahmad.social@test.com",
        "role": "customer",
        "vendor_id": None,
        "points": 500,
        "matches_played": 25,
        "wins": 15,
        "losses": 10,
        "win_rate": 60,
        "rank": 50
    },
    {
        "id": "social_user_fatima",
        "phone": "+92 333 2229999",
        "name": "Fatima Social",
        "email": "fatima.social@test.com",
        "role": "customer",
        "vendor_id": None,
        "points": 750,
        "matches_played": 35,
        "wins": 25,
        "losses": 10,
        "win_rate": 71,
        "rank": 25
    },
    {
        "id": "social_user_zain",
        "phone": "+92 333 3339999",
        "name": "Zain Social",
        "email": "zain.social@test.com",
        "role": "customer",
        "vendor_id": None,
        "points": 1200,
        "matches_played": 50,
        "wins": 35,
        "losses": 15,
        "win_rate": 70,
        "rank": 15
    }
]


def create_social_users(db):
    """Create protected social test users"""
    print("👥 Creating protected social test users...")

    for user_data in SOCIAL_TEST_USERS:
        user_doc = {
            "phone": user_data["phone"],
            "name": user_data["name"],
            "email": user_data["email"],
            "role": user_data["role"],
            "vendor_id": user_data["vendor_id"],
            "points": user_data.get("points", 0),
            "matches_played": user_data.get("matches_played", 0),
            "wins": user_data.get("wins", 0),
            "losses": user_data.get("losses", 0),
            "win_rate": user_data.get("win_rate", 0),
            "rank": user_data.get("rank", 999),
            "avatar_url": f"https://i.pravatar.cc/150?u={user_data['id']}",
            "online_status": False,
            "created_at": firestore.SERVER_TIMESTAMP
        }

        db.collection('users').document(user_data["id"]).set(user_doc)
        print(f"  ✅ Created: {user_data['name']} ({user_data['phone']})")

    print(f"  📊 Created {len(SOCIAL_TEST_USERS)} protected social users")


def list_existing_users(db):
    """List all users to see what's there"""
    print("👀 Checking existing users...")

    users = db.collection('users').stream()
    user_list = []

    for user_doc in users:
        user_data = user_doc.to_dict()
        user_list.append({
            'id': user_doc.id,
            'name': user_data.get('name', 'Unknown'),
            'phone': user_data.get('phone', 'Unknown'),
            'role': user_data.get('role', 'Unknown'),
            'points': user_data.get('points', 0)
        })

    # Sort by points descending
    user_list.sort(key=lambda x: x['points'], reverse=True)

    print(f"  📊 Total users: {len(user_list)}")
    for user in user_list[:10]:  # Show top 10
        print(f"     {user['name']} ({user['phone']}) - {user['points']} pts")

    return user_list


def backup_social_data(db):
    """Backup any social data that might exist"""
    print("💾 Backing up any existing social data...")

    collections_to_backup = ['posts', 'post_comments', 'post_likes', 'matches',
                           'match_participants', 'conversations', 'messages',
                           'notifications', 'reviews', 'chatbot_sessions']

    backup = {}

    for collection in collections_to_backup:
        docs = list(db.collection(collection).limit(100).stream())  # Limit to avoid huge backup
        if docs:
            backup[collection] = []
            for doc in docs:
                backup[collection].append({
                    'id': doc.id,
                    'data': doc.to_dict()
                })
            print(f"     Backed up {len(docs)} documents from {collection}")

    if backup:
        import json
        from datetime import datetime
        backup_file = f"social_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(backup_file, 'w') as f:
            json.dump(backup, f, indent=2, default=str)

        print(f"  💾 Social data backed up to: {backup_file}")
    else:
        print("     No social data found to backup")

    return backup


def main():
    """Main function"""
    print("🛡️  BookForMe Social User Protection")
    print("=" * 50)

    try:
        print("🔌 Connecting to Firestore...")
        db = get_firestore_client()
        print("✅ Connected successfully")

        # Backup any existing social data
        backup_social_data(db)

        # Show current users
        list_existing_users(db)

        # Create protected social users
        create_social_users(db)

        # Show final user list
        print("\n" + "=" * 50)
        print("📊 Final user list:")
        list_existing_users(db)

        print("\n✅ Social user protection complete!")
        print("\n💡 Your partner can now:")
        print("   • Use the protected social users for testing")
        print("   • Create additional test users with different IDs")
        print("   • Focus on social features without breaking booking")
        print("\n🔄 When you need to reset booking data:")
        print("   • Run: python database/seed/seed_all.py --clear")
        print("   • Run: python scripts/protect_social_users.py")
        print("   • This preserves social test data while resetting booking")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()