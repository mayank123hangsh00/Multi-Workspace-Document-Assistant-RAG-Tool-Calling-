"""
send_summary_to_discord tool — sends a message to a Discord channel via webhook.
Real side-effect: posts to Discord.
"""
import httpx
import logging
from uuid import UUID

from app.config import get_settings

logger = logging.getLogger(__name__)


async def execute_send_discord(
    workspace_id: UUID,
    session_id: UUID,
    message: str,
    title: str = None,
) -> dict:
    """
    Send a message to the configured Discord channel via webhook.
    """
    settings = get_settings()

    if not settings.discord_webhook_url:
        return {
            "success": False,
            "error": "Discord webhook is not configured for this deployment.",
        }

    try:
        # Build Discord embed
        embed = {
            "description": message[:4096],  # Discord limit
            "color": 5814783,  # Soft blue
            "footer": {"text": f"Workspace Assistant • Session: {str(session_id)[:8]}"},
        }
        if title:
            embed["title"] = title[:256]  # Discord limit

        payload = {
            "embeds": [embed],
            "username": "Abstrat Assistant",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.discord_webhook_url,
                json=payload,
                timeout=10.0,
            )
            response.raise_for_status()

        result = {
            "success": True,
            "message": "Summary sent to Discord successfully.",
        }
        logger.info(f"Discord message sent for workspace {workspace_id}")
        return result

    except httpx.HTTPStatusError as e:
        logger.error(f"Discord webhook error: {e.response.status_code}")
        return {
            "success": False,
            "error": f"Discord returned status {e.response.status_code}",
        }
    except Exception as e:
        logger.error(f"Discord send failed: {e}")
        return {
            "success": False,
            "error": f"Failed to send to Discord: {str(e)}",
        }


# Tool definition for registration
SEND_DISCORD_DEFINITION = {
    "name": "send_summary_to_discord",
    "description": (
        "Send a summary or message to the team's Discord channel. "
        "Use this when the user asks to share information, notify the team, "
        "or send a summary to Discord."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "The message content to send to Discord",
            },
            "title": {
                "type": "string",
                "description": "An optional title or heading for the message",
            },
        },
        "required": ["message"],
    },
    "execute_fn": execute_send_discord,
    "required_params": ["message"],
}
