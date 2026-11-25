import logging

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_engine
from app.models import Accommodation
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat import service
from app.services.chat.gemini import GeminiClient, LLMClient

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


def get_llm_client() -> LLMClient | None:
    """None when no API key is configured: the fallback rules are used."""
    settings = get_settings()
    if not settings.llm_api_key:
        return None
    return GeminiClient(settings.llm_api_key, settings.llm_model, settings.llm_timeout_seconds)


def get_known_cities() -> list[str]:
    """Cities of the catalog, used by the fallback rules. Empty if the database is unreachable."""
    try:
        with Session(get_engine()) as db:
            return list(db.scalars(select(Accommodation.city).distinct()))
    except Exception:  # noqa: BLE001 - the chat must answer even without the database
        logger.warning("Could not load the city list")
        return []


@router.post("/parse", response_model=ChatResponse)
def parse(
    request: ChatRequest,
    llm: LLMClient | None = Depends(get_llm_client),
    cities: list[str] = Depends(get_known_cities),
) -> ChatResponse:
    """Understand a free-text request (RO/EN) and return editable search filters."""
    return service.parse_message(request, llm, cities)
