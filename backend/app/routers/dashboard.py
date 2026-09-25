"""
Dashboard endpoints — stats, tool call log, tasks.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.dependencies import get_current_user, AuthenticatedUser
from app.db.client import db
from app.db import queries
from app.models.tool import DashboardResponse, ToolCallListResponse, ToolCallResponse, TaskListResponse, TaskResponse

router = APIRouter(prefix="/api/workspaces/{workspace_id}", tags=["dashboard"])


async def _verify_workspace_access(workspace_id: UUID, user_id: str):
    """Verify the user has access to the workspace."""
    row = await db.fetchrow(queries.GET_WORKSPACE, str(workspace_id), user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return row


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get dashboard statistics for a workspace."""
    await _verify_workspace_access(workspace_id, user.user_id)

    stats = await db.fetchrow(queries.GET_WORKSPACE_STATS, str(workspace_id))

    # Get recent documents
    recent_docs = await db.fetch(
        "SELECT id, filename, status, uploaded_at FROM documents WHERE workspace_id = $1 ORDER BY uploaded_at DESC LIMIT 5",
        str(workspace_id),
    )

    # Get recent tool calls
    recent_tc = await db.fetch(
        "SELECT id, tool_name, status, created_at FROM tool_calls WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 5",
        str(workspace_id),
    )

    # Get recent tasks
    recent_tasks = await db.fetch(
        "SELECT id, title, priority, status, created_at FROM tasks WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 5",
        str(workspace_id),
    )

    return DashboardResponse(
        doc_count=stats["doc_count"],
        chunk_count=stats["chunk_count"],
        session_count=stats["session_count"],
        message_count=stats["message_count"],
        tool_call_count=stats["tool_call_count"],
        task_count=stats["task_count"],
        recent_documents=[dict(row) for row in recent_docs],
        recent_tool_calls=[dict(row) for row in recent_tc],
        recent_tasks=[dict(row) for row in recent_tasks],
    )


@router.get("/tool-calls", response_model=ToolCallListResponse)
async def list_tool_calls(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all tool calls for a workspace."""
    await _verify_workspace_access(workspace_id, user.user_id)
    rows = await db.fetch(queries.GET_WORKSPACE_TOOL_CALLS, str(workspace_id))
    tool_calls = [
        ToolCallResponse(
            id=row["id"],
            session_id=row["session_id"],
            tool_name=row["tool_name"],
            arguments=json.loads(row["arguments"]) if isinstance(row["arguments"], str) else row["arguments"],
            result=json.loads(row["result"]) if isinstance(row["result"], str) else row["result"],
            status=row["status"],
            error_message=row["error_message"],
            duration_ms=row["duration_ms"],
            created_at=row["created_at"],
        )
        for row in rows
    ]
    return ToolCallListResponse(tool_calls=tool_calls)


@router.get("/tasks", response_model=TaskListResponse)
async def list_tasks(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all tasks in a workspace."""
    await _verify_workspace_access(workspace_id, user.user_id)
    rows = await db.fetch(queries.GET_WORKSPACE_TASKS, str(workspace_id))
    tasks = [
        TaskResponse(
            id=row["id"],
            workspace_id=row["workspace_id"],
            title=row["title"],
            description=row["description"],
            priority=row["priority"],
            status=row["status"],
            created_at=row["created_at"],
        )
        for row in rows
    ]
    return TaskListResponse(tasks=tasks)
