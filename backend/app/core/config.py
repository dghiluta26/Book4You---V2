"""Application settings, read from environment variables / the .env file."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Book4You API"
    app_env: str = "development"
    # Comma-separated string in .env; use `cors_origins_list` in code.
    cors_origins: str = "http://localhost:3000"
    # Supabase Postgres connection string (see docs/database.md). Empty until configured.
    database_url: str = ""
    # Supabase project URL, e.g. https://<ref>.supabase.co. Used to verify login tokens.
    supabase_url: str = ""
    jwt_audience: str = "authenticated"

    @property
    def supabase_issuer(self) -> str:
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def supabase_jwks_url(self) -> str:
        return f"{self.supabase_issuer}/.well-known/jwks.json"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings, so the .env file is read only once."""
    return Settings()
