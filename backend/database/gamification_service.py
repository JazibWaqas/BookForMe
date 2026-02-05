"""
Gamification Service
Handles points, leveling, and badges for the social platform.
"""
import logging
from google.cloud import firestore
from database.schema import Collections

logger = logging.getLogger(__name__)

class GamificationService:
    def __init__(self, db_client: firestore.Client):
        self.db = db_client

    def calculate_level(self, points: int) -> int:
        """
        Calculate level based on points.
        Level 1: 0-99
        Level 2: 100-249
        Level 3: 250-499
        ...
        """
        if points < 100: return 1
        if points < 250: return 2
        if points < 500: return 3
        if points < 1000: return 4
        if points < 2000: return 5
        return 6 + (points - 2000) // 1000

    def award_points(self, user_id: str, points: int, reason: str) -> None:
        """
        Award points to a user and update their level.
        This is fire-and-forget (void return) to not block main threads,
        but ideally should be awaited in async context.
        """
        try:
            user_ref = self.db.collection(Collections.USERS).document(user_id)
            
            @firestore.transactional
            def update_points_transaction(transaction, ref):
                snapshot = ref.get(transaction=transaction)
                if not snapshot.exists:
                    logger.warning(f"User {user_id} not found for point award")
                    return

                current_points = snapshot.get('points') or 0
                new_points = current_points + points
                new_level = self.calculate_level(new_points)

                transaction.update(ref, {
                    'points': new_points,
                    'level': new_level,
                    'last_active': firestore.SERVER_TIMESTAMP
                })
                
                # Log the point history (optional subcollection)
                # transaction.set(ref.collection('point_history').document(), {
                #     'amount': points,
                #     'reason': reason,
                #     'created_at': firestore.SERVER_TIMESTAMP
                # })

                logger.info(f"Awarded {points} points to {user_id}. New Total: {new_points} (Lvl {new_level})")

            transaction = self.db.transaction()
            update_points_transaction(transaction, user_ref)
            
        except Exception as e:
            logger.error(f"Failed to award points to {user_id}: {e}")

    # Wrappers for specific actions
    def award_booking_completion(self, user_id: str):
        self.award_points(user_id, 10, "booking_completed")

    def award_match_won(self, user_id: str):
        self.award_points(user_id, 50, "match_won")

    def award_match_participation(self, user_id: str):
        self.award_points(user_id, 25, "match_completed")

    def award_post_creation(self, user_id: str):
        self.award_points(user_id, 5, "post_created")
    
    def award_post_like(self, user_id: str):
        """Award points to the AUTHOR of the post when liked"""
        self.award_points(user_id, 1, "post_liked") 
