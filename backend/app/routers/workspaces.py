"""
Workspace management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.dependencies import get_current_user, AuthenticatedUser
from app.db.client import db
from app.db import queries
from app.models.workspace import WorkspaceCreate, WorkspaceResponse, WorkspaceListResponse

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(user: AuthenticatedUser = Depends(get_current_user)):
    """List all workspaces for the authenticated user."""
    rows = await db.fetch(queries.GET_USER_WORKSPACES, user.user_id)
    workspaces = []
    for row in rows:
        # Get doc count for each workspace
        doc_count = await db.fetchval(
            "SELECT COUNT(*) FROM documents WHERE workspace_id = $1",
            row["id"],
        )
        workspaces.append(
            WorkspaceResponse(
                id=row["id"],
                name=row["name"],
                owner_id=row["owner_id"],
                created_at=row["created_at"],
                doc_count=doc_count,
            )
        )
    return WorkspaceListResponse(workspaces=workspaces)


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    body: WorkspaceCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new workspace."""
    try:
        row = await db.fetchrow(queries.CREATE_WORKSPACE, body.name, user.user_id)
        return WorkspaceResponse(
            id=row["id"],
            name=row["name"],
            owner_id=row["owner_id"],
            created_at=row["created_at"],
        )
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Workspace '{body.name}' already exists.",
            )
        raise


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Get a specific workspace."""
    row = await db.fetchrow(queries.GET_WORKSPACE, str(workspace_id), user.user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")

    doc_count = await db.fetchval(
        "SELECT COUNT(*) FROM documents WHERE workspace_id = $1",
        row["id"],
    )
    return WorkspaceResponse(
        id=row["id"],
        name=row["name"],
        owner_id=row["owner_id"],
        created_at=row["created_at"],
        doc_count=doc_count,
    )


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete a workspace and all its data."""
    result = await db.fetchrow(queries.DELETE_WORKSPACE, str(workspace_id), user.user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Workspace not found")
