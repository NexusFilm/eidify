"""
Database service layer for Supabase operations.
Provides CRUD operations for all tables with tenant scoping.
Returns None/empty results gracefully when Supabase is disabled.
"""
from typing import Optional, List
from loguru import logger

from iopaint.supabase_client import is_supabase_enabled, get_supabase_client


class DatabaseService:
    def __init__(self, user_id: Optional[str] = None, tenant_id: Optional[str] = None):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.client = get_supabase_client()

    @property
    def enabled(self) -> bool:
        return is_supabase_enabled() and self.client is not None

    # --- User Profiles ---

    def get_profile(self) -> Optional[dict]:
        if not self.enabled or not self.user_id:
            return None
        try:
            result = self.client.table("user_profiles").select("*").eq("id", self.user_id).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"get_profile failed: {e}")
            return None

    def update_profile(self, updates: dict) -> Optional[dict]:
        if not self.enabled or not self.user_id:
            return None
        try:
            result = self.client.table("user_profiles").update(updates).eq("id", self.user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"update_profile failed: {e}")
            return None

    # --- Projects ---

    def list_projects(self) -> List[dict]:
        if not self.enabled or not self.tenant_id:
            return []
        try:
            result = self.client.table("projects").select("*").eq("tenant_id", self.tenant_id).order("created_at", desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"list_projects failed: {e}")
            return []

    def create_project(self, name: str, description: str = "") -> Optional[dict]:
        if not self.enabled or not self.tenant_id or not self.user_id:
            return None
        try:
            result = self.client.table("projects").insert({
                "tenant_id": self.tenant_id,
                "user_id": self.user_id,
                "name": name,
                "description": description,
            }).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"create_project failed: {e}")
            return None

    def get_project(self, project_id: str) -> Optional[dict]:
        if not self.enabled:
            return None
        try:
            result = self.client.table("projects").select("*").eq("id", project_id).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"get_project failed: {e}")
            return None

    def delete_project(self, project_id: str) -> bool:
        if not self.enabled:
            return False
        try:
            self.client.table("projects").delete().eq("id", project_id).eq("user_id", self.user_id).execute()
            return True
        except Exception as e:
            logger.error(f"delete_project failed: {e}")
            return False

    # --- Images ---

    def create_image_record(self, data: dict) -> Optional[dict]:
        if not self.enabled:
            return None
        try:
            data["tenant_id"] = self.tenant_id
            data["user_id"] = self.user_id
            result = self.client.table("images").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"create_image_record failed: {e}")
            return None

    def list_images(self, project_id: Optional[str] = None) -> List[dict]:
        if not self.enabled or not self.tenant_id:
            return []
        try:
            query = self.client.table("images").select("*").eq("tenant_id", self.tenant_id)
            if project_id:
                query = query.eq("project_id", project_id)
            result = query.order("created_at", desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"list_images failed: {e}")
            return []

    def update_image_status(self, image_id: str, status: str) -> bool:
        if not self.enabled:
            return False
        try:
            self.client.table("images").update({"status": status}).eq("id", image_id).execute()
            return True
        except Exception as e:
            logger.error(f"update_image_status failed: {e}")
            return False

    # --- Processing History ---

    def add_processing_record(self, image_id: str, operation_type: str, parameters: dict) -> Optional[dict]:
        if not self.enabled:
            return None
        try:
            result = self.client.table("processing_history").insert({
                "image_id": image_id,
                "user_id": self.user_id,
                "operation_type": operation_type,
                "parameters": parameters,
            }).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"add_processing_record failed: {e}")
            return None

    # --- Batch Jobs ---

    def create_batch_job(self, name: str, operation_type: str, parameters: dict, image_ids: list) -> Optional[dict]:
        if not self.enabled:
            return None
        try:
            result = self.client.table("batch_jobs").insert({
                "tenant_id": self.tenant_id,
                "user_id": self.user_id,
                "name": name,
                "operation_type": operation_type,
                "parameters": parameters,
                "image_ids": image_ids,
                "total_images": len(image_ids),
            }).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"create_batch_job failed: {e}")
            return None

    def update_batch_progress(self, job_id: str, progress: int, status: str = "processing") -> bool:
        if not self.enabled:
            return False
        try:
            update = {"progress": progress, "status": status}
            if status == "completed":
                from datetime import datetime, timezone
                update["completed_at"] = datetime.now(timezone.utc).isoformat()
            self.client.table("batch_jobs").update(update).eq("id", job_id).execute()
            return True
        except Exception as e:
            logger.error(f"update_batch_progress failed: {e}")
            return False

    # --- Chatbot Conversations ---

    def add_chat_message(self, image_id: Optional[str], message: str, role: str, command_parsed: Optional[dict] = None) -> Optional[dict]:
        if not self.enabled:
            return None
        try:
            data = {
                "user_id": self.user_id,
                "message": message,
                "role": role,
            }
            if image_id:
                data["image_id"] = image_id
            if command_parsed:
                data["command_parsed"] = command_parsed
            result = self.client.table("chatbot_conversations").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"add_chat_message failed: {e}")
            return None

    def get_chat_history(self, image_id: str, limit: int = 50) -> List[dict]:
        if not self.enabled:
            return []
        try:
            result = (
                self.client.table("chatbot_conversations")
                .select("*")
                .eq("image_id", image_id)
                .eq("user_id", self.user_id)
                .order("created_at")
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"get_chat_history failed: {e}")
            return []
