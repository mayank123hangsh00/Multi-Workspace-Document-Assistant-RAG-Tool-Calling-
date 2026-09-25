"""
Document upload and management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from uuid import UUID

from app.dependencies import get_current_user, AuthenticatedUser
from app.db.client import db
from app.db import queries
from app.config import get_settings
from app.models.document import DocumentResponse, DocumentListResponse, DocumentUploadResponse
from app.services.ingestion import ingestion_service

router = APIRouter(prefix="/api/workspaces/{workspace_id}/documents", tags=["documents"])


async def _verify_workspace_access(workspace_id: UUID, user_id: str):
    """Verify the user has access to the workspace."""
    row = await db.fetchrow(queries.GET_WORKSPACE, str(workspace_id), user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return row


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all documents in a workspace."""
    await _verify_workspace_access(workspace_id, user.user_id)
    rows = await db.fetch(queries.GET_WORKSPACE_DOCUMENTS, str(workspace_id))
    documents = [
        DocumentResponse(
            id=row["id"],
            workspace_id=row["workspace_id"],
            filename=row["filename"],
            file_hash=row["file_hash"],
            file_size_bytes=row["file_size_bytes"],
            mime_type=row["mime_type"],
            uploaded_by=row["uploaded_by"],
            uploaded_at=row["uploaded_at"],
            status=row["status"],
        )
        for row in rows
    ]
    return DocumentListResponse(documents=documents)


@router.post("", response_model=DocumentUploadResponse)
async def upload_document(
    workspace_id: UUID,
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Upload and ingest a document into the workspace."""
    await _verify_workspace_access(workspace_id, user.user_id)
    settings = get_settings()

    # Validate file size
    content = await file.read()
    if len(content) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb}MB.",
        )

    # Validate file type
    allowed_extensions = {".txt", ".md", ".pdf", ".docx", ".csv", ".json", ".log", ".markdown"}
    filename = file.filename or "unnamed"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {ext}. Supported: {', '.join(sorted(allowed_extensions))}",
        )

    try:
        result = await ingestion_service.ingest_document(
            workspace_id=workspace_id,
            user_id=UUID(user.user_id),
            filename=filename,
            content=content,
            mime_type=file.content_type or "application/octet-stream",
        )

        if result["already_exists"]:
            return DocumentUploadResponse(
                message=result["message"],
                already_exists=True,
            )

        # Fetch the created document
        doc_row = await db.fetchrow(
            "SELECT * FROM documents WHERE id = $1",
            result["document_id"],
        )

        return DocumentUploadResponse(
            document=DocumentResponse(
                id=doc_row["id"],
                workspace_id=doc_row["workspace_id"],
                filename=doc_row["filename"],
                file_hash=doc_row["file_hash"],
                file_size_bytes=doc_row["file_size_bytes"],
                mime_type=doc_row["mime_type"],
                uploaded_by=doc_row["uploaded_by"],
                uploaded_at=doc_row["uploaded_at"],
                status=doc_row["status"],
            ),
            message=result["message"],
            already_exists=False,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    workspace_id: UUID,
    document_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete a document and its chunks from the workspace."""
    await _verify_workspace_access(workspace_id, user.user_id)
    result = await db.fetchrow(queries.DELETE_DOCUMENT, str(document_id), str(workspace_id))
    if not result:
        raise HTTPException(status_code=404, detail="Document not found")
