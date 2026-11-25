"""Orchestrates one chat message: understand -> validate -> merge -> ask if something is missing."""

from datetime import date

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat.criteria import merge, sanitize
from app.services.chat.fallback import detect_language, extract_with_rules
from app.services.chat.gemini import LLMClient, LLMError

CLARIFICATIONS = {
    "destination": {
        "ro": "Unde ai vrea să mergi? Spune-mi un oraș sau o zonă.",
        "en": "Where would you like to go? Tell me a city or an area.",
    },
}


def parse_message(
    request: ChatRequest, llm: LLMClient | None, known_cities: list[str], today: date | None = None
) -> ChatResponse:
    today = today or date.today()
    warnings: list[str] = []
    raw = None

    if llm is not None:
        try:
            raw = llm.extract(request.message, today, request.previous)
        except LLMError:
            warnings.append("llm_unavailable")

    source = "llm" if raw is not None else "fallback"
    if raw is None:
        raw = extract_with_rules(request.message, known_cities, today, request.locale)

    language = raw.get("language")
    if language not in ("ro", "en"):
        language = detect_language(request.message, request.locale)

    new, dates_ignored = sanitize(raw, today)
    if dates_ignored:
        warnings.append("dates_ignored")
    criteria = merge(request.previous, new)

    missing = [] if criteria.destination else ["destination"]
    return ChatResponse(
        criteria=criteria,
        missing=missing,
        clarification=CLARIFICATIONS[missing[0]][language] if missing else None,
        language=language,
        source=source,
        warnings=warnings,
    )
