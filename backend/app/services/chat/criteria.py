"""Validation of what the language model (or the fallback rules) extracted.

The model's answer is untrusted input. Each field is checked on its own, so one bad value
(for example a date in the past) is dropped without losing the rest.
"""

from datetime import date
from typing import Any, get_args

from app.schemas.accommodation import AccommodationType
from app.schemas.chat import SearchCriteria

ALLOWED_TYPES: tuple[str, ...] = get_args(AccommodationType)
MAX_ACTIVITIES = 8


def _text(value: Any, max_length: int) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.split())
    return cleaned if 2 <= len(cleaned) <= max_length else None


def _date(value: Any) -> date | None:
    if isinstance(value, date):
        return value
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        return None


def _number(value: Any, low: float, high: float) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value) if low <= value <= high else None


def _list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def sanitize(raw: dict[str, Any], today: date) -> tuple[SearchCriteria, bool]:
    """Returns the valid criteria and whether some dates had to be ignored."""
    check_in, check_out = _date(raw.get("check_in")), _date(raw.get("check_out"))
    mentioned_dates = bool(raw.get("check_in") or raw.get("check_out"))
    # The search needs a complete, future period.
    if not (check_in and check_out and today <= check_in < check_out):
        check_in = check_out = None
    dates_ignored = mentioned_dates and check_in is None

    guests = _number(raw.get("guests"), 1, 20)
    min_price = _number(raw.get("min_price"), 1, 100_000)
    max_price = _number(raw.get("max_price"), 1, 100_000)
    if min_price is not None and max_price is not None and min_price > max_price:
        min_price = None

    types = [str(t).lower() for t in _list(raw.get("types"))]
    activities = [a for a in (_text(item, 40) for item in _list(raw.get("activities"))) if a]

    criteria = SearchCriteria(
        destination=_text(raw.get("destination"), 100),
        check_in=check_in,
        check_out=check_out,
        guests=int(guests) if guests is not None and guests.is_integer() else None,
        min_price=min_price,
        max_price=max_price,
        types=list(dict.fromkeys(t for t in types if t in ALLOWED_TYPES)),
        activities=list(dict.fromkeys(activities))[:MAX_ACTIVITIES],
    )
    return criteria, dates_ignored


def merge(previous: SearchCriteria | None, new: SearchCriteria) -> SearchCriteria:
    """New information wins; anything not mentioned this time is kept."""
    if previous is None:
        return new
    merged = previous.model_dump()
    for key, value in new.model_dump().items():
        if value not in (None, [], ""):
            merged[key] = value
    # A new budget limit may contradict the old other limit: the new one wins.
    if (
        merged["min_price"] is not None
        and merged["max_price"] is not None
        and merged["min_price"] > merged["max_price"]
    ):
        merged["min_price" if new.max_price is not None else "max_price"] = None
    return SearchCriteria(**merged)
