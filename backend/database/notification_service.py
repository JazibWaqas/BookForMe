"""
Notification Service
Handles creating and serving user notifications.
"""
import logging
from google.cloud import firestore
from database.models_social import NotificationType

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db_client: firestore.Client):
        self.db = db_client

    def create_notification(self, user_id: str, type: NotificationType, title: str, message: str, data: dict = None):
        """
        Create a notification for a user.
        """
        try:
            notification_data = {
                'user_id': user_id,
                'type': type,
                'title': title,
                'message': message,
                'read': False,
                'data': data or {},
                'created_at': firestore.SERVER_TIMESTAMP
            }
            
            self.db.collection('notifications').add(notification_data)
            logger.info(f"Notification created for {user_id}: {type}")
            
        except Exception as e:
            logger.error(f"Failed to create notification for {user_id}: {e}")

    def notify_match_join(self, host_id: str, joiner_name: str, match_id: str):
        self.create_notification(
            host_id,
            NotificationType.MATCH_JOINED,
            "New Player Joined!",
            f"{joiner_name} has joined your match.",
            {'match_id': match_id}
        )

    def notify_post_like(self, author_id: str, liker_name: str, post_id: str):
        self.create_notification(
            author_id,
            NotificationType.FORUM_LIKE,
            "New Like",
            f"{liker_name} liked your post.",
            {'post_id': post_id}
        )

    def notify_post_comment(self, author_id: str, commenter_name: str, post_id: str, comment_text: str):
        self.create_notification(
            author_id,
            NotificationType.FORUM_REPLY,
            "New Comment",
            f"{commenter_name} commented: {comment_text[:30]}...",
            {'post_id': post_id}
        )
