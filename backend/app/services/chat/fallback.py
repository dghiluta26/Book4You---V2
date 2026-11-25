"""Simple keyword rules used when the language model is unavailable (no key, error, quota).

It understands the common cases (place, guests, budget, type, dates like "14-16 martie"),
so the chatbot keeps being useful. It is deliberately basic.
"""

import re
from datetime import date
from typing import Any

from app.services.accommodation_search import normalize_text

CITY_ALIASES = {"bucharest": "bucuresti", "cluj": "cluj-napoca"}

MONTHS = {
    name: number
    for number, names in enumerate(
        [
            ("ianuarie", "january"), ("februarie", "february"), ("martie", "march"),
            ("aprilie", "april"), ("mai", "may"), ("iunie", "june"), ("iulie", "july"),
            ("august", "august"), ("septembrie", "september"), ("octombrie", "october"),
            ("noiembrie", "november"), ("decembrie", "december"),
        ],
        start=1,
    )
    for name in names
}
_MONTH = "|".join(MONTHS)
_DASH = r"\s*(?:-|–|—|pana la|pana pe|to|until)\s*"

TYPE_WORDS = {
    "cabin": r"caban[ae]|cabin|cottage",
    "apartment": r"apartament(?:ul|e)?|apartment|flat",
    "house": r"casa|house",
    "villa": r"vil[ae]|villa",
    "hotel": r"hotel",
    "hostel": r"hostel",
    "room": r"camera|room|pensiune|guest ?house",
}

ACTIVITY_WORDS = {
    r"drumet\w*|hik\w+": {"ro": "drumeții", "en": "hiking"},
    r"schi\w*|ski\w*": {"ro": "schi", "en": "skiing"},
    r"plaja|beach": {"ro": "plajă", "en": "beach"},
    r"relax\w*|spa": {"ro": "relaxare", "en": "relaxing"},
    r"biciclet\w*|cycling|biking": {"ro": "ciclism", "en": "cycling"},
}

_RO_WORDS = r"\b(caut|vreau|pentru|persoane|lei|noapte|cabana|langa|weekendul|vrem|cu)\b"
_EN_WORDS = r"\b(looking|want|for|people|night|near|with|we|the|under)\b"


def detect_language(message: str, default: str) -> str:
    text = normalize_text(message)
    ro, en = len(re.findall(_RO_WORDS, text)), len(re.findall(_EN_WORDS, text))
    if ro == en:
        return default
    return "ro" if ro > en else "en"


def _find_city(text: str, cities: list[str]) -> str | None:
    candidates = {normalize_text(city): city for city in cities}
    for alias, target in CITY_ALIASES.items():
        if target in candidates:
            candidates[alias] = candidates[target]
    # Longest first, so "Poiana Brașov" wins over "Brașov".
    for key in sorted(candidates, key=len, reverse=True):
        if re.search(rf"\b{re.escape(key)}(?:ului)?\b", text):
            return candidates[key]
    return None


def _make_date(day: int, month: int, today: date, year: int | None = None) -> date | None:
    try:
        result = date(year or today.year, month, day)
        if year is None and result < today:
            result = date(today.year + 1, month, day)
        return result
    except ValueError:
        return None


def _find_dates(text: str, today: date) -> tuple[date | None, date | None]:
    iso = re.findall(r"\b(\d{4})-(\d{2})-(\d{2})\b", text)
    if len(iso) >= 2:
        first, second = (_make_date(int(d), int(m), today, int(y)) for y, m, d in iso[:2])
        return first, second

    # "28 martie - 2 aprilie"
    match = re.search(rf"\b(\d{{1,2}})\s+({_MONTH}){_DASH}(\d{{1,2}})\s+({_MONTH})\b", text)
    if match:
        start = _make_date(int(match[1]), MONTHS[match[2]], today)
        end = _make_date(int(match[3]), MONTHS[match[4]], start or today)
        return start, end

    # "14-16 martie" or "march 14-16"
    match = re.search(rf"\b(\d{{1,2}}){_DASH}(\d{{1,2}})\s+({_MONTH})\b", text)
    if match:
        first_day, last_day, month = int(match[1]), int(match[2]), MONTHS[match[3]]
    else:
        match = re.search(rf"\b({_MONTH})\s+(\d{{1,2}}){_DASH}(\d{{1,2}})\b", text)
        if not match:
            return None, None
        month, first_day, last_day = MONTHS[match[1]], int(match[2]), int(match[3])
    start = _make_date(first_day, month, today)
    end = _make_date(last_day, month, today, start.year) if start else None
    return start, end


def _find_prices(text: str) -> tuple[float | None, float | None]:
    currency = r"(lei|ron|euros?|eur|€)"

    def to_ron(amount: str, unit: str) -> float:
        return float(amount) * (5 if unit.startswith(("eu", "€")) else 1)

    match = re.search(rf"\b(?:intre|between)\s+(\d{{2,5}})\s+(?:si|and)\s+(\d{{2,5}})\s*{currency}", text)
    if match:
        return to_ron(match[1], match[3]), to_ron(match[2], match[3])
    match = re.search(rf"\b(\d{{2,5}})\s*{currency}", text)
    if match:
        amount = to_ron(match[1], match[2])
        if re.search(rf"\b(?:minim|peste|at least|over|from)\s+{match[1]}", text):
            return amount, None
        return None, amount
    return None, None


def extract_with_rules(message: str, cities: list[str], today: date, locale: str) -> dict[str, Any]:
    text = normalize_text(message)
    language = detect_language(message, locale)
    result: dict[str, Any] = {"language": language}

    if city := _find_city(text, cities):
        result["destination"] = city

    people = r"(?:persoane|persoana|oameni|adulti|people|persons|guests|adults|pers)\b"
    if match := re.search(rf"\b(\d{{1,2}})\s*{people}", text):
        result["guests"] = int(match[1])
    elif re.search(r"\b(cuplu|couple)\b", text):
        result["guests"] = 2

    check_in, check_out = _find_dates(text, today)
    if check_in or check_out:
        result["check_in"] = check_in.isoformat() if check_in else None
        result["check_out"] = check_out.isoformat() if check_out else None

    result["min_price"], result["max_price"] = _find_prices(text)
    result["types"] = [t for t, words in TYPE_WORDS.items() if re.search(rf"\b(?:{words})\b", text)]
    result["activities"] = [
        names[language] for words, names in ACTIVITY_WORDS.items() if re.search(rf"\b(?:{words})\b", text)
    ]
    return result
