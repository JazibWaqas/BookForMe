"""
Safe Firestore Wipe Script
Deletes all collections except system_config
Requires explicit confirmation before executing
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.firestore import firestore_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Collections to preserve
EXCLUDE_COLLECTIONS = ["system_config"]


def delete_collection(coll_ref, batch_size=200):
    """Recursively delete all documents in a collection"""
    deleted = 0
    docs = coll_ref.limit(batch_size).stream()
    
    for doc in docs:
        # Delete subcollections first
        for subcoll in doc.reference.collections():
            delete_collection(subcoll, batch_size)
        
        # Delete the document
        doc.reference.delete()
        deleted += 1
    
    if deleted >= batch_size:
        # More documents exist, recurse
        return deleted + delete_collection(coll_ref, batch_size)
    
    return deleted


def wipe_firestore():
    """Wipe all Firestore collections except excluded ones"""
    try:
        # List all collections
        collections = list(firestore_db.db.collections())
        
        if not collections:
            logger.info("✅ Firestore is already empty")
            return True
        
        logger.info("=" * 60)
        logger.info("FIRESTORE WIPE SCRIPT")
        logger.info("=" * 60)
        logger.info("\nCollections found:")
        
        collections_to_delete = []
        collections_to_skip = []
        
        for coll in collections:
            if coll.id in EXCLUDE_COLLECTIONS:
                collections_to_skip.append(coll.id)
                logger.info(f"  ⚠️  {coll.id} (WILL BE PRESERVED)")
            else:
                collections_to_delete.append(coll.id)
                logger.info(f"  ❌ {coll.id} (WILL BE DELETED)")
        
        if not collections_to_delete:
            logger.info("\n✅ No collections to delete")
            return True
        
        logger.info("\n" + "=" * 60)
        logger.warning(f"⚠️  WARNING: This will DELETE {len(collections_to_delete)} collections!")
        logger.info("=" * 60)
        
        # Require explicit confirmation
        confirm = input("\nType 'DELETE' to confirm wipe (or anything else to abort): ")
        
        if confirm != "DELETE":
            logger.info("❌ Wipe aborted by user")
            return False
        
        logger.info("\n🗑️  Starting wipe process...\n")
        
        # Delete each collection
        for coll in firestore_db.db.collections():
            if coll.id in EXCLUDE_COLLECTIONS:
                logger.info(f"⏭️  Skipping {coll.id}")
                continue
            
            logger.info(f"🗑️  Deleting collection: {coll.id}")
            deleted_count = delete_collection(coll)
            logger.info(f"   ✅ Deleted {deleted_count} documents from {coll.id}")
        
        logger.info("\n" + "=" * 60)
        logger.info("✅ WIPE COMPLETE")
        logger.info("=" * 60)
        
        # Verify
        remaining = list(firestore_db.db.collections())
        logger.info(f"\nRemaining collections: {[c.id for c in remaining]}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error during wipe: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    logger.info("🔥 Firestore Wipe Script")
    logger.info("⚠️  Make sure backend server is STOPPED before running this!\n")
    
    success = wipe_firestore()
    
    if success:
        logger.info("\n✅ Ready for reseeding")
        logger.info("Run: python -m database.seed.seed_all --days 14")
    else:
        logger.error("\n❌ Wipe failed or was aborted")
        sys.exit(1)
