"""
Authentication API Endpoints
Handles user registration, login, and password management
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from app.firestore import firestore_db
from database.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

auth_service = AuthService(firestore_db.db)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: str = "customer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PhoneLoginRequest(BaseModel):
    phone: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class SetPasswordRequest(BaseModel):
    password: str


def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """
    Extract and verify JWT token from Authorization header
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = auth_service.verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


@router.post("/register")
async def register(request: RegisterRequest):
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
        result = await auth_service.register(
            email=request.email,
            password=request.password,
            name=request.name,
            phone=request.phone,
            role=request.role
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Registration failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register endpoint: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login")
async def login(request: LoginRequest):
    """
    Login with email and password
    
    Returns:
        {
            "success": bool,
            "token": str,
            "user": dict
        }
    """
    try:
        result = await auth_service.login(
            email=request.email,
            password=request.password
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=401, detail=result.get("error", "Login failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login endpoint: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/login/phone")
async def login_with_phone(request: PhoneLoginRequest):
    """
    Login with phone number and password
    
    Returns:
        {
            "success": bool,
            "token": str,
            "user": dict
        }
    """
    try:
        result = await auth_service.login_with_phone(
            phone=request.phone,
            password=request.password
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=401, detail=result.get("error", "Login failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in phone login endpoint: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: Dict = Depends(get_current_user)):
    """
    Change user password (requires authentication)
    
    Returns:
        {
            "success": bool,
            "message": str
        }
    """
    try:
        user_id = current_user["sub"]
        result = await auth_service.change_password(
            user_id=user_id,
            old_password=request.old_password,
            new_password=request.new_password
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Password change failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in change password endpoint: {e}")
        raise HTTPException(status_code=500, detail="Password change failed")


@router.post("/set-password")
async def set_password(request: SetPasswordRequest, current_user: Dict = Depends(get_current_user)):
    """
    Set password for existing user (e.g., WhatsApp user linking account)
    
    Returns:
        {
            "success": bool,
            "message": str
        }
    """
    try:
        user_id = current_user["sub"]
        result = await auth_service.set_password(
            user_id=user_id,
            password=request.password
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Password setup failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in set password endpoint: {e}")
        raise HTTPException(status_code=500, detail="Password setup failed")


@router.get("/me")
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """
    Get current authenticated user info
    
    Returns:
        {
            "user": dict
        }
    """
    try:
        user_id = current_user["sub"]
        from database.firestore_v2 import FirestoreV2
        firestore_v2 = FirestoreV2(firestore_db.db)
        user = await firestore_v2.get_user(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.pop('password_hash', None)
        
        return {
            "success": True,
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get current user endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user info")
