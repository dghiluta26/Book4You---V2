"""Database engine and session. The engine is created lazily, so the app and the tests
can start even when DATABASE_URL is not configured yet."""

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def normalize_database_url(url: str) -> str:
    """Supabase gives `postgresql://...`; SQLAlchemy needs the psycopg 3 driver name."""
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]
    return url


@lru_cache
def get_engine() -> Engine:
    url = get_settings().database_url
    if not url:
        raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
    return create_engine(normalize_database_url(url), pool_pre_ping=True)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request, always closed afterwards."""
    with sessionmaker(bind=get_engine(), expire_on_commit=False)() as session:
        yield session
