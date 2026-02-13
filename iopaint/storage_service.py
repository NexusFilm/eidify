"""
Storage service wrapper for Supabase storage buckets.
Handles file uploads/downloads with tenant-scoped paths.
Bucket structure:
  - originals: {tenant_id}/filename.ext  (original uploaded images)
  - processed: {tenant_id}/filename.ext  (AI-processed results)
  - masks:     {tenant_id}/{image_id}/mask.png  (inpainting masks)
  - projects:  {tenant_id}/{project_id}/filename.ext  (project files)
"""
from typing import Optional
from loguru import logger

from iopaint.supabase_client import is_supabase_enabled, get_supabase_client


class StorageService:
    BUCKET_ORIGINALS = "originals"
    BUCKET_PROCESSED = "processed"
    BUCKET_MASKS = "masks"
    BUCKET_PROJECTS = "projects"

    def __init__(self, tenant_id: Optional[str] = None):
        self.tenant_id = tenant_id
        self.client = get_supabase_client()

    @property
    def enabled(self) -> bool:
        return is_supabase_enabled() and self.client is not None and self.tenant_id is not None

    def _path(self, bucket: str, filename: str) -> str:
        return f"{self.tenant_id}/{filename}"

    def upload(self, bucket: str, filename: str, data: bytes, content_type: str = "image/png") -> Optional[str]:
        if not self.enabled:
            return None
        path = self._path(bucket, filename)
        try:
            self.client.storage.from_(bucket).upload(path, data, {"content-type": content_type})
            return path
        except Exception as e:
            logger.error(f"Storage upload failed [{bucket}/{path}]: {e}")
            return None

    def download(self, bucket: str, filename: str) -> Optional[bytes]:
        if not self.enabled:
            return None
        path = self._path(bucket, filename)
        try:
            return self.client.storage.from_(bucket).download(path)
        except Exception as e:
            logger.error(f"Storage download failed [{bucket}/{path}]: {e}")
            return None

    def get_public_url(self, bucket: str, filename: str) -> Optional[str]:
        if not self.enabled:
            return None
        path = self._path(bucket, filename)
        try:
            return self.client.storage.from_(bucket).get_public_url(path)
        except Exception as e:
            logger.error(f"Failed to get public URL [{bucket}/{path}]: {e}")
            return None

    def delete(self, bucket: str, filename: str) -> bool:
        if not self.enabled:
            return False
        path = self._path(bucket, filename)
        try:
            self.client.storage.from_(bucket).remove([path])
            return True
        except Exception as e:
            logger.error(f"Storage delete failed [{bucket}/{path}]: {e}")
            return False

    def list_files(self, bucket: str, prefix: str = "") -> list:
        if not self.enabled:
            return []
        path = f"{self.tenant_id}/{prefix}" if prefix else self.tenant_id
        try:
            return self.client.storage.from_(bucket).list(path)
        except Exception as e:
            logger.error(f"Storage list failed [{bucket}/{path}]: {e}")
            return []
