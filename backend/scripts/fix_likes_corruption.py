"""
Fix Likes Data Corruption Script
Syncs likes_count with likes array length for all posts
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from google.cloud import firestore
from app.firestore import firestore_db

db = firestore_db.db

async def fix_likes_corruption():
    """Fix posts where likes_count doesn't match len(likes)"""
    posts_ref = db.collection('posts')
    docs = await asyncio.to_thread(lambda: list(posts_ref.stream()))
    
    fixed_count = 0
    
    for doc in docs:
        data = doc.to_dict()
        likes = data.get('likes', [])
        likes_count = data.get('likes_count', 0)
        
        # If they don't match, fix it
        if len(likes) != likes_count:
            print(f"❌ Post {doc.id}: likes_count={likes_count}, actual likes={len(likes)}")
            await asyncio.to_thread(
                doc.reference.update,
                {'likes_count': len(likes)}
            )
            print(f"✅ Fixed: set likes_count to {len(likes)}")
            fixed_count += 1
    
    print(f"\n🎉 Fixed {fixed_count} posts with corrupted likes data")

if __name__ == "__main__":
    asyncio.run(fix_likes_corruption())
