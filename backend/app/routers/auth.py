"""
Authentication helper router for instant admin user creation bypassing SMTP rate limits.
"""
import httpx
import logging
from fastapi import APIRouter, status
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: str
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def admin_signup(body: SignUpRequest):
    """Create and auto-confirm a new user via Supabase Admin API to bypass email rate limits."""
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/admin/users"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": body.email,
        "password": body.password,
        "email_confirm": True,
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=10.0)
            if resp.status_code in (200, 201):
                logger.info(f"Auto-confirmed new user created: {body.email}")
                return {"message": "Account created successfully", "email": body.email}
            
            error_data = resp.json()
            error_msg = error_data.get("msg") or error_data.get("message") or "Failed to create user"
            
            # If user already exists, return 200 so signin can proceed
            if "already" in error_msg.lower() or "exists" in error_msg.lower():
                return {"message": "User exists, proceed to login", "email": body.email}

            logger.warning(f"Admin signup note: {resp.status_code} - {error_msg}")
            return {"message": error_msg, "email": body.email}
        except Exception as e:
            logger.error(f"Admin signup error: {e}")
            return {"message": str(e), "email": body.email}
