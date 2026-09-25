"""
Pydantic schemas for workspace-related requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Workspace name")


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    owner_id: UUID
    created_at: datetime
    doc_count: Optional[int] = 0

    class Config:
        from_attributes = True


class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceResponse]
