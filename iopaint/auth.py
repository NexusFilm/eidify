"""
Authentication middleware and utilities for IOPaint.
Handles JWT validation, user context, and tenant resolution.
Gracefully bypasses auth when Supabase is disabled (offline mode).
"""
import os
from typing import Optional

import jwt
from fastapi import Request, HTTPException
from loguru import logger

from iopaint.supabase_client import is_supabase_enabled, get_supabase_client


def _get_jwt_secret() -> str:
    return os.getenv("SUPABASE_JWT_SECRET", os.getenv("SUPABASE_ANON_KEY", ""))


def decode_token(token: str) -> dict:
    """Decode and validate a Supabase JWT token."""
    try:
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


def get_user_from_request(request: Request) -> Optional[dict]:
    """Extract user info from request. Returns None in offline mode."""
    if not is_supabase_enabled():
        return None

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    return decode_token(token)


def require_auth(request: Request) -> dict:
    """Require authentication. Raises 401 if not authenticated."""
    if not is_supabase_enabled():
        # In offline mode, return a dummy user context
        return {"sub": "local-user", "email": "local@localhost", "role": "authenticated"}

    user = get_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def get_user_tenant_id(user_id: str) -> Optional[str]:
    """Look up the tenant_id for a given user."""
    client = get_supabase_client()
    if not client:
        return None
    try:
        result = client.table("user_profiles").select("tenant_id").eq("id", user_id).single().execute()
        return result.data.get("tenant_id") if result.data else None
    except Exception as e:
        logger.error(f"Failed to get tenant for user {user_id}: {e}")
        return None
