"""
Authentication API endpoints for IOPaint.
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
PUT  /api/v1/auth/profile
POST /api/v1/auth/refresh-token
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from loguru import logger

from iopaint.supabase_client import is_supabase_enabled, get_supabase_client
from iopaint.auth import require_auth, get_user_tenant_id
from iopaint.db_service import DatabaseService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[dict] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.get("/status")
async def auth_status():
    """Check if Supabase auth is enabled."""
    return {"enabled": is_supabase_enabled()}


@router.post("/signup")
async def signup(req: SignupRequest):
    if not is_supabase_enabled():
        raise HTTPException(status_code=503, detail="Authentication not available in offline mode")

    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        options = {}
        if req.display_name:
            options["data"] = {"display_name": req.display_name}

        result = client.auth.sign_up({
            "email": req.email,
            "password": req.password,
            "options": options,
        })

        if result.user:
            return {
                "user": {
                    "id": str(result.user.id),
                    "email": result.user.email,
                },
                "session": {
                    "access_token": result.session.access_token if result.session else None,
                    "refresh_token": result.session.refresh_token if result.session else None,
                } if result.session else None,
            }
        raise HTTPException(status_code=400, detail="Signup failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(req: LoginRequest):
    if not is_supabase_enabled():
        raise HTTPException(status_code=503, detail="Authentication not available in offline mode")

    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        result = client.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })

        if result.user and result.session:
            return {
                "user": {
                    "id": str(result.user.id),
                    "email": result.user.email,
                },
                "session": {
                    "access_token": result.session.access_token,
                    "refresh_token": result.session.refresh_token,
                    "expires_at": result.session.expires_at,
                },
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(request: Request):
    if not is_supabase_enabled():
        return {"message": "ok"}

    client = get_supabase_client()
    if client:
        try:
            client.auth.sign_out()
        except Exception as e:
            logger.warning(f"Logout error: {e}")
    return {"message": "ok"}


@router.get("/me")
async def get_me(request: Request):
    user = require_auth(request)
    user_id = user.get("sub")

    if not is_supabase_enabled():
        return {"id": user_id, "email": user.get("email"), "profile": None, "tenant_id": None}

    db = DatabaseService(user_id=user_id)
    profile = db.get_profile()
    tenant_id = profile.get("tenant_id") if profile else None

    return {
        "id": user_id,
        "email": user.get("email"),
        "profile": profile,
        "tenant_id": tenant_id,
    }


@router.put("/profile")
async def update_profile(req: ProfileUpdateRequest, request: Request):
    user = require_auth(request)
    user_id = user.get("sub")

    if not is_supabase_enabled():
        raise HTTPException(status_code=503, detail="Profile management not available in offline mode")

    db = DatabaseService(user_id=user_id)
    updates = {}
    if req.display_name is not None:
        updates["display_name"] = req.display_name
    if req.avatar_url is not None:
        updates["avatar_url"] = req.avatar_url
    if req.settings is not None:
        updates["settings"] = req.settings

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.update_profile(updates)
    if result:
        return result
    raise HTTPException(status_code=500, detail="Failed to update profile")


@router.post("/refresh-token")
async def refresh_token(req: RefreshTokenRequest):
    if not is_supabase_enabled():
        raise HTTPException(status_code=503, detail="Not available in offline mode")

    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        result = client.auth.refresh_session(req.refresh_token)
        if result.session:
            return {
                "access_token": result.session.access_token,
                "refresh_token": result.session.refresh_token,
                "expires_at": result.session.expires_at,
            }
        raise HTTPException(status_code=401, detail="Failed to refresh token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=401, detail=str(e))
