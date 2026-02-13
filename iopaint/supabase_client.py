"""
Supabase client configuration for IOPaint.
Supports offline mode when ENABLE_SUPABASE is not set to 'true'.
"""
import os
from typing import Optional

from dotenv import load_dotenv
from loguru import logger

load_dotenv()

_supabase_client = None
_supabase_enabled: Optional[bool] = None


def is_supabase_enabled() -> bool:
    global _supabase_enabled
    if _supabase_enabled is None:
        _supabase_enabled = os.getenv("ENABLE_SUPABASE", "false").lower() == "true"
    return _supabase_enabled


def get_supabase_client():
    """Returns the Supabase client singleton, or None if disabled."""
    global _supabase_client
    if not is_supabase_enabled():
        return None
    if _supabase_client is None:
        try:
            from supabase import create_client

            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            if not url or not key:
                logger.warning("SUPABASE_URL or SUPABASE_ANON_KEY not set, disabling Supabase")
                return None
            _supabase_client = create_client(url, key)
            logger.info(f"Supabase client initialized: {url}")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    return _supabase_client


def get_service_client():
    """Returns a Supabase client with service role key for admin operations."""
    if not is_supabase_enabled():
        return None
    try:
        from supabase import create_client

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            return None
        return create_client(url, key)
    except Exception as e:
        logger.error(f"Failed to create service client: {e}")
        return None
