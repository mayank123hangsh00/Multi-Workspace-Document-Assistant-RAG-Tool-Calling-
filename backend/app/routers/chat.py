"""
Chat endpoints — the core RAG + tool-calling interface.
"""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.dependencies import get_current_user, AuthenticatedUser
from app.db.client import db
from app.db import queries
from app.models.chat import (
    ChatRequest,
    ChatResponse,
    ChatMessageResponse,
    ChatSessionResponse,
    ChatSessionListResponse,
    RetrievedChunk,
)
from app.services.llm import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/workspaces/{workspace_id}/chat", tags=["chat"])


async def _verify_workspace_access(workspace_id: UUID, user_id: str):
    """Verify the user has access to the workspace."""
    row = await db.fetchrow(queries.GET_WORKSPACE, str(workspace_id), user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return row


@router.post("", response_model=ChatResponse)
async def send_message(
    workspace_id: UUID,
    body: ChatRequest,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Send a message to the assistant.
    Performs RAG retrieval + tool calling and returns the response.
    """
    workspace = await _verify_workspace_access(workspace_id, user.user_id)

    # Get or create chat session
    session_id = body.session_id
    if session_id:
        # Verify session belongs to this workspace
        session = await db.fetchrow(queries.GET_SESSION, str(session_id))
        if not session or str(session["workspace_id"]) != str(workspace_id):
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        # Create new session
        title = body.message[:50] + ("..." if len(body.message) > 50 else "")
        session_row = await db.fetchrow(
            queries.CREATE_CHAT_SESSION,
            str(workspace_id),
            user.user_id,
            title,
        )
        session_id = session_row["id"]

    # Save user message
    user_msg = await db.fetchrow(
        queries.INSERT_MESSAGE,
        str(session_id),
        "user",
        body.message,
        "[]",
        "{}",
    )

    # Load chat history for context
    history_rows = await db.fetch(queries.GET_SESSION_MESSAGES, str(session_id))
    chat_history = [
        {"role": row["role"], "content": row["content"]}
        for row in history_rows[:-1]  # Exclude the just-added message
        if row["role"] in ("user", "assistant")
    ]

    # Run the RAG + tool-calling pipeline
    try:
        result = await llm_service.chat(
            user_message=body.message,
            workspace_id=workspace_id,
            workspace_name=workspace["name"],
            session_id=session_id,
            chat_history=chat_history,
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        result = {
            "content": "I'm sorry, I encountered an error while processing your request. Please try again.",
            "citations": [],
            "retrieved_chunks": [],
            "tool_calls_made": [],
            "metadata": {"error": str(e)},
        }

    # Save assistant message
    assistant_msg = await db.fetchrow(
        queries.INSERT_MESSAGE,
        str(session_id),
        "assistant",
        result["content"],
        json.dumps(result["citations"]),
        json.dumps(result["metadata"]),
    )

    # Update session timestamp
    await db.execute(queries.UPDATE_SESSION_TIMESTAMP, str(session_id))

    return ChatResponse(
        message=ChatMessageResponse(
            id=assistant_msg["id"],
            session_id=session_id,
            role="assistant",
            content=result["content"],
            citations=result["citations"],
            metadata=result["metadata"],
            created_at=assistant_msg["created_at"],
        ),
        session_id=session_id,
        retrieved_chunks=result.get("retrieved_chunks", []),
        tool_calls=result.get("tool_calls_made", []),
    )


@router.get("/sessions", response_model=ChatSessionListResponse)
async def list_sessions(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all chat sessions in a workspace."""
    await _verify_workspace_access(workspace_id, user.user_id)
    rows = await db.fetch(queries.GET_WORKSPACE_SESSIONS, str(workspace_id), user.user_id)
    sessions = [
        ChatSessionResponse(
            id=row["id"],
            workspace_id=row["workspace_id"],
            title=row["title"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
        for row in rows
    ]
    return ChatSessionListResponse(sessions=sessions)


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    workspace_id: UUID,
    session_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get all messages in a chat session."""
    await _verify_workspace_access(workspace_id, user.user_id)

    # Verify session belongs to workspace
    session = await db.fetchrow(queries.GET_SESSION, str(session_id))
    if not session or str(session["workspace_id"]) != str(workspace_id):
        raise HTTPException(status_code=404, detail="Chat session not found")

    rows = await db.fetch(queries.GET_SESSION_MESSAGES, str(session_id))
    messages = [
        ChatMessageResponse(
            id=row["id"],
            session_id=row["session_id"],
            role=row["role"],
            content=row["content"],
            citations=json.loads(row["citations"]) if isinstance(row["citations"], str) else row["citations"],
            metadata=json.loads(row["metadata"]) if isinstance(row["metadata"], str) else row["metadata"],
            created_at=row["created_at"],
        )
        for row in rows
    ]
    return {"messages": messages}
