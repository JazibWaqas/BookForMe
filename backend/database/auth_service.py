"""
Authentication Service
Handles user registration, login, and password management
"""

import logging
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from google.cloud import firestore

from database.schema import Collections, UserRole
from database.firestore_v2 import FirestoreV2
from app.config import settings

logger = logging.getLogger(__name__)

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7


class AuthService:
    def __init__(self, db_client: firestore.Client):
        self.db = db_client
        self.firestore_v2 = FirestoreV2(db_client)
        logger.info("AuthService initialized")
    
    def hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_access_token(self, user_id: str, email: str, role: str) -> str:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user_id,
            "email": email,
            "role": role,
            "exp": expire
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return token
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
    
    async def register(self, email: str, password: str, name: str, phone: str, role: str = "customer") -> Dict[str, Any]:
        """
        Register a new user with email and password
        
        Returns:
            {
                "success": bool,
                "user_id": str,
                "token": str,
                "user": dict
            }
        """
        try:
            if not email or not password:
                return {"success": False, "error": "Email and password are required"}
            
            if len(password) < 6:
                return {"success": False, "error": "Password must be at least 6 characters"}
            
            existing_user = await self.firestore_v2.get_user_by_phone(phone)
            if existing_user:
                return {"success": False, "error": "Phone number already registered"}
            
            email_query = self.db.collection(Collections.USERS).where('email', '==', email).limit(1).stream()
            if any(email_query):
                return {"success": False, "error": "Email already registered"}
            
            password_hash = self.hash_password(password)
            
            user_data = {
                "email": email,
                "password_hash": password_hash,
                "name": name,
                "phone": phone,
                "role": role if role in [UserRole.CUSTOMER.value, UserRole.VENDOR.value] else UserRole.CUSTOMER.value,
                "vendor_id": None,
                "created_at": firestore.SERVER_TIMESTAMP
            }
            
            doc_ref = self.db.collection(Collections.USERS).add(user_data)
            user_id = doc_ref[1].id
            
            user = await self.firestore_v2.get_user(user_id)
            
            token = self.create_access_token(user_id, email, user_data["role"])
            
            logger.info(f"User registered: {user_id} ({email})")
            
            return {
                "success": True,
                "user_id": user_id,
                "token": token,
                "user": user
            }
            
        except Exception as e:
            logger.error(f"Error registering user: {e}")
            return {"success": False, "error": f"Registration failed: {str(e)}"}
    
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Login user with email and password
        
        Returns:
            {
                "success": bool,
                "token": str,
                "user": dict
            }
        """
        try:
            if not email or not password:
                return {"success": False, "error": "Email and password are required"}
            
            docs = self.db.collection(Collections.USERS).where('email', '==', email).limit(1).stream()
            user_doc = None
            user_id = None
            
            for doc in docs:
                user_doc = doc.to_dict()
                user_id = doc.id
                break
            
            if not user_doc:
                return {"success": False, "error": "Invalid email or password"}
            
            password_hash = user_doc.get('password_hash')
            if not password_hash:
                return {"success": False, "error": "Account not set up with password. Please use phone login or reset password."}
            
            if not self.verify_password(password, password_hash):
                return {"success": False, "error": "Invalid email or password"}
            
            user = await self.firestore_v2.get_user(user_id)
            
            token = self.create_access_token(user_id, email, user_doc.get('role', 'customer'))
            
            self.db.collection(Collections.USERS).document(user_id).update({
                'last_login': firestore.SERVER_TIMESTAMP,
                'online_status': True
            })
            
            logger.info(f"User logged in: {user_id} ({email})")
            
            return {
                "success": True,
                "token": token,
                "user": user
            }
            
        except Exception as e:
            logger.error(f"Error logging in: {e}")
            return {"success": False, "error": f"Login failed: {str(e)}"}
    
    async def login_with_phone(self, phone: str, password: str) -> Dict[str, Any]:
        """
        Login user with phone number and password
        
        Returns:
            {
                "success": bool,
                "token": str,
                "user": dict
            }
        """
        try:
            if not phone or not password:
                return {"success": False, "error": "Phone and password are required"}
            
            user = await self.firestore_v2.get_user_by_phone(phone)
            if not user:
                return {"success": False, "error": "Invalid phone or password"}
            
            password_hash = user.get('password_hash')
            if not password_hash:
                return {"success": False, "error": "Account not set up with password. Please register or reset password."}
            
            if not self.verify_password(password, password_hash):
                return {"success": False, "error": "Invalid phone or password"}
            
            token = self.create_access_token(user['id'], user.get('email', ''), user.get('role', 'customer'))
            
            self.db.collection(Collections.USERS).document(user['id']).update({
                'last_login': firestore.SERVER_TIMESTAMP,
                'online_status': True
            })
            
            logger.info(f"User logged in with phone: {user['id']} ({phone})")
            
            return {
                "success": True,
                "token": token,
                "user": user
            }
            
        except Exception as e:
            logger.error(f"Error logging in with phone: {e}")
            return {"success": False, "error": f"Login failed: {str(e)}"}
    
    async def change_password(self, user_id: str, old_password: str, new_password: str) -> Dict[str, Any]:
        """
        Change user password
        
        Returns:
            {
                "success": bool,
                "message": str
            }
        """
        try:
            user = await self.firestore_v2.get_user(user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            password_hash = user.get('password_hash')
            if not password_hash:
                return {"success": False, "error": "Account has no password set"}
            
            if not self.verify_password(old_password, password_hash):
                return {"success": False, "error": "Current password is incorrect"}
            
            if len(new_password) < 6:
                return {"success": False, "error": "New password must be at least 6 characters"}
            
            new_password_hash = self.hash_password(new_password)
            
            self.db.collection(Collections.USERS).document(user_id).update({
                'password_hash': new_password_hash,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            
            logger.info(f"Password changed for user: {user_id}")
            
            return {
                "success": True,
                "message": "Password changed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            return {"success": False, "error": f"Failed to change password: {str(e)}"}
    
    async def set_password(self, user_id: str, password: str) -> Dict[str, Any]:
        """
        Set password for existing user (e.g., WhatsApp user linking account)
        
        Returns:
            {
                "success": bool,
                "message": str
            }
        """
        try:
            user = await self.firestore_v2.get_user(user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            if user.get('password_hash'):
                return {"success": False, "error": "Password already set. Use change_password instead."}
            
            if len(password) < 6:
                return {"success": False, "error": "Password must be at least 6 characters"}
            
            password_hash = self.hash_password(password)
            
            self.db.collection(Collections.USERS).document(user_id).update({
                'password_hash': password_hash,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            
            logger.info(f"Password set for user: {user_id}")
            
            return {
                "success": True,
                "message": "Password set successfully"
            }
            
        except Exception as e:
            logger.error(f"Error setting password: {e}")
            return {"success": False, "error": f"Failed to set password: {str(e)}"}
