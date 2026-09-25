"""
Pydantic schemas for document-related requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class DocumentResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    filename: str
    file_hash: str
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[UUID] = None
    uploaded_at: datetime
    status: str

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]


class DocumentUploadResponse(BaseModel):
    document: Optional[DocumentResponse] = None
    message: str
    already_exists: bool = False
