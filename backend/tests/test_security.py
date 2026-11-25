"""Token verification, tested with a locally generated ES256 key (no network, no database)."""

import time
import types
import uuid

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient

from app.core import security
from app.core.config import get_settings
from app.main import app

SUPABASE_URL = "https://test-project.supabase.co"
ISSUER = f"{SUPABASE_URL}/auth/v1"
USER_ID = str(uuid.uuid4())

# Only these tests use a protected endpoint with the real dependency
client = TestClient(app)


@pytest.fixture(autouse=True)
def configured(monkeypatch: pytest.MonkeyPatch) -> ec.EllipticCurvePrivateKey:
    """Point the app at a fake Supabase project whose public key we control."""
    monkeypatch.setenv("SUPABASE_URL", SUPABASE_URL)
    get_settings.cache_clear()
    private_key = ec.generate_private_key(ec.SECP256R1())
    monkeypatch.setattr(
        security, "_signing_key", lambda token: types.SimpleNamespace(key=private_key.public_key()).key
    )
    yield private_key
    get_settings.cache_clear()


def make_token(key, **overrides) -> str:
    claims = {
        "sub": USER_ID,
        "email": "ana@example.com",
        "aud": "authenticated",
        "iss": ISSUER,
        "exp": int(time.time()) + 600,
        "user_metadata": {"full_name": "Ana Pop"},
    }
    claims.update(overrides)
    claims = {k: v for k, v in claims.items() if v is not None}
    return jwt.encode(claims, key, algorithm="ES256", headers={"kid": "test"})


def get_me(token: str | None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.get("/bookings/me", headers=headers)


def test_decode_valid_token(configured) -> None:
    claims = security.decode_token(make_token(configured))
    assert claims["sub"] == USER_ID and claims["email"] == "ana@example.com"


def test_missing_token_is_401() -> None:
    response = get_me(None)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize(
    "overrides",
    [
        {"exp": int(time.time()) - 10},          # expired
        {"aud": "something-else"},               # wrong audience
        {"iss": "https://evil.example/auth/v1"},  # wrong issuer
        {"sub": "not-a-uuid"},                   # malformed user id
        {"sub": None},                           # missing required claim
    ],
)
def test_invalid_claims_are_401(configured, overrides) -> None:
    assert get_me(make_token(configured, **overrides)).status_code == 401


def test_token_signed_by_another_key_is_401() -> None:
    attacker_key = ec.generate_private_key(ec.SECP256R1())
    assert get_me(make_token(attacker_key)).status_code == 401


def test_garbage_token_is_401() -> None:
    assert get_me("not.a.jwt").status_code == 401


def test_symmetric_algorithm_is_rejected(configured) -> None:
    """A token signed with HS256 must never be accepted (algorithm confusion attack)."""
    forged = jwt.encode(
        {"sub": USER_ID, "aud": "authenticated", "iss": ISSUER, "exp": int(time.time()) + 600},
        "x" * 64,
        algorithm="HS256",
    )
    assert get_me(forged).status_code == 401


def test_auth_not_configured_is_503(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUPABASE_URL", "")
    get_settings.cache_clear()
    assert get_me("whatever").status_code == 503
