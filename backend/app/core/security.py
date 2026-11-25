"""Verifies the Supabase Auth token sent by the frontend.

Flow: the browser logs in with Supabase and gets a JWT. It sends it to us as
`Authorization: Bearer <token>`. We check the signature with Supabase's PUBLIC keys (JWKS),
the issuer, the audience and the expiry. No secret is needed, and we never see passwords.
"""

import uuid
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

# Only asymmetric algorithms: a token signed with a shared secret is never accepted.
ALLOWED_ALGORITHMS = ["ES256", "RS256"]

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthUser:
    """The authenticated user, taken from the verified token."""

    id: uuid.UUID
    email: str
    full_name: str | None = None


@lru_cache
def _jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    # PyJWKClient downloads the public keys once and caches them.
    return jwt.PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)


def _signing_key(token: str) -> Any:
    """The public key that must have signed this token. Tests replace this function."""
    return _jwks_client(get_settings().supabase_jwks_url).get_signing_key_from_jwt(token).key


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(
        token,
        _signing_key(token),
        algorithms=ALLOWED_ALGORITHMS,
        audience=settings.jwt_audience,
        issuer=settings.supabase_issuer,
        options={"require": ["exp", "sub", "iss", "aud"]},
    )


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthUser:
    """FastAPI dependency: returns the logged-in user or answers 401."""
    if not get_settings().supabase_url:
        raise HTTPException(status_code=503, detail="Authentication is not configured (SUPABASE_URL)")
    if credentials is None:
        raise _unauthorized("Not authenticated")
    try:
        claims = decode_token(credentials.credentials)
        user_id = uuid.UUID(claims["sub"])
    except (jwt.PyJWTError, ValueError):
        # Do not reveal why the token was rejected.
        raise _unauthorized("Invalid or expired token") from None

    metadata = claims.get("user_metadata") or {}
    return AuthUser(
        id=user_id,
        email=claims.get("email") or "",
        full_name=metadata.get("full_name") or metadata.get("name"),
    )
