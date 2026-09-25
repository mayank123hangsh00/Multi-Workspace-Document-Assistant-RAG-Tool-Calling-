"""
save_task tool — saves a task/todo item into the active workspace.
This is a side-effect tool that creates a real record.
"""
import json
import logging
from uuid import UUID

from app.db.client import db
from app.db import queries

logger = logging.getLogger(__name__)


async def execute_save_task(
    workspace_id: UUID,
    session_id: UUID,
    title: str,
    description: str = None,
    priority: str = "medium",
) -> dict:
    """
    Save a task into the workspace's task list.
    The workspace_id comes from the authenticated session, NOT from the model.
    """
    try:
        row = await db.fetchrow(
            queries.INSERT_TASK,
            str(workspace_id),
            title,
            description,
            priority,
            str(session_id),
        )

        result = {
            "success": True,
            "task_id": str(row["id"]),
            "title": row["title"],
            "priority": row["priority"],
            "status": row["status"],
            "message": f"Task '{title}' saved successfully.",
        }

        logger.info(f"Task saved: {title} (workspace: {workspace_id})")
        return result

    except Exception as e:
        logger.error(f"Failed to save task: {e}")
        return {
            "success": False,
            "error": f"Failed to save task: {str(e)}",
        }


# Tool definition for registration
SAVE_TASK_DEFINITION = {
    "name": "save_task",
    "description": (
        "Save a task or todo item into the current workspace's task list. "
        "Use this when the user asks to create, save, remember, or track a task, "
        "action item, or todo."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "A short, descriptive title for the task",
            },
            "description": {
                "type": "string",
                "description": "A more detailed description of the task (optional)",
            },
            "priority": {
                "type": "string",
                "enum": ["low", "medium", "high", "urgent"],
                "description": "Priority level of the task (default: medium)",
            },
        },
        "required": ["title"],
    },
    "execute_fn": execute_save_task,
    "required_params": ["title"],
}
