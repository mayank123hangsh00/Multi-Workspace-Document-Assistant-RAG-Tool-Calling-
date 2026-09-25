"""
Pydantic schemas for chat-related requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    session_id: Optional[UUID] = None


class Citation(BaseModel):
    document_id: UUID
    chunk_id: UUID
    filename: str
    snippet: str
    similarity: float
    chunk_index: int


class RetrievedChunk(BaseModel):
    chunk_id: UUID
    document_id: UUID
    filename: str
    content: str
    similarity: float
    chunk_index: int
    metadata: dict = {}


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    citations: list = []
    metadata: dict = {}
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    message: ChatMessageResponse
    session_id: UUID
    retrieved_chunks: list[RetrievedChunk] = []  # For retrieval debug view
    tool_calls: list[dict] = []


class ChatSessionResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatSessionListResponse(BaseModel):
    sessions: list[ChatSessionResponse]
