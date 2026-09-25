"""
Pydantic schemas for tool-related requests and responses.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ToolCallResponse(BaseModel):
    id: UUID
    session_id: UUID
    tool_name: str
    arguments: dict
    result: Optional[dict] = None
    status: str
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ToolCallListResponse(BaseModel):
    tool_calls: list[ToolCallResponse]


class TaskResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]


class DashboardResponse(BaseModel):
    doc_count: int = 0
    chunk_count: int = 0
    session_count: int = 0
    message_count: int = 0
    tool_call_count: int = 0
    task_count: int = 0
    recent_documents: list = []
    recent_tool_calls: list = []
    recent_tasks: list = []
