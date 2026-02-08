"""
Fix Comments Data Corruption Script
Syncs comments_count with actual comment count for all posts
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from google.cloud import firestore
from app.firestore import firestore_db

db = firestore_db.db

async def fix_comments_corruption():
    """Fix posts where comments_count doesn't match actual number of comments"""
    posts_ref = db.collection('posts')
    posts_docs = await asyncio.to_thread(lambda: list(posts_ref.stream()))
    
    fixed_count = 0
    
    for post_doc in posts_docs:
        post_data = post_doc.to_dict()
        stored_count = post_data.get('comments_count', 0)
        
        # Get actual comment count from comments collection
        comments_query = db.collection('comments').where('post_id', '==', post_doc.id)
        actual_comments = await asyncio.to_thread(lambda: list(comments_query.stream()))
        actual_count = len(actual_comments)
        
        # If they don't match, fix it
        if actual_count != stored_count:
            print(f"❌ Post {post_doc.id}: comments_count={stored_count}, actual comments={actual_count}")
            await asyncio.to_thread(
                post_doc.reference.update,
                {'comments_count': actual_count}
            )
            print(f"✅ Fixed: set comments_count to {actual_count}")
            fixed_count += 1
    
    print(f"\n🎉 Fixed {fixed_count} posts with corrupted comments data")

if __name__ == "__main__":
    asyncio.run(fix_comments_corruption())
