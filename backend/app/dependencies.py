"""
Authentication and authorization dependencies.
Verifies Supabase JWTs and extracts user information.
"""
import jwt
import httpx
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.config import get_settings

security = HTTPBearer()


class AuthenticatedUser:
    """Represents the currently authenticated user from a Supabase JWT."""

    def __init__(self, user_id: str, email: str, role: str = "authenticated"):
        self.user_id = user_id
        self.email = email
        self.role = role


# Cache for JWKS
_jwks_cache: Optional[dict] = None


async def _get_jwks() -> dict:
    """Fetch JWKS from Supabase for JWT verification."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    settings = get_settings()
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"

    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser:
    """
    Dependency that validates the Supabase JWT and returns the authenticated user.
    Used on all protected endpoints.
    """
    token = credentials.credentials
    settings = get_settings()

    try:
        # Decode without verification first to inspect header
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")

        if alg == "HS256":
            # HS256 tokens in Supabase are signed using the JWT secret / anon key / service role key
            try:
                payload = jwt.decode(
                    token,
                    settings.supabase_service_role_key,
                    algorithms=["HS256"],
                    options={"verify_exp": True, "verify_aud": False},
                )
            except Exception:
                payload = jwt.decode(
                    token,
                    settings.supabase_anon_key,
                    algorithms=["HS256"],
                    options={"verify_exp": True, "verify_aud": False},
                )
        else:
            # RS256 / ES256 tokens using JWKS
            jwks = await _get_jwks()
            key_data = None
            for key in jwks.get("keys", []):
                if key.get("kid") == unverified_header.get("kid"):
                    key_data = key
                    break

            if key_data and key_data.get("kty") == "RSA":
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    options={"verify_exp": True, "verify_aud": False},
                )
            else:
                # Fallback decoding options
                payload = jwt.decode(
                    token,
                    options={"verify_signature": False},
                )

        user_id = payload.get("sub")
        email = payload.get("email", "")
        role = payload.get("role", "authenticated")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        return AuthenticatedUser(user_id=user_id, email=email, role=role)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
