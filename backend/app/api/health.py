from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness check used by the frontend, tests and (later) CI."""
    settings = get_settings()
    return HealthResponse(status="ok", app=settings.app_name, environment=settings.app_env)
