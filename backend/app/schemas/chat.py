from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.accommodation import AccommodationType

Language = Literal["ro", "en"]


class SearchCriteria(BaseModel):
    """The filters understood from the conversation. Every field is editable by the user."""

    destination: str | None = Field(default=None, max_length=100)
    check_in: date | None = None
    check_out: date | None = None
    guests: int | None = Field(default=None, ge=1, le=20)
    min_price: float | None = Field(default=None, ge=0, le=100_000)
    max_price: float | None = Field(default=None, ge=0, le=100_000)
    types: list[AccommodationType] = Field(default_factory=list, max_length=7)
    # Things the user wants to do. Shown as chips; the classic search does not filter by them.
    activities: list[str] = Field(default_factory=list, max_length=8)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    locale: Language = "ro"
    # The filters currently shown to the user, so "make it cheaper" or "Brașov" can refine them.
    previous: SearchCriteria | None = None

    @field_validator("message", mode="before")
    @classmethod
    def strip_message(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class ChatResponse(BaseModel):
    criteria: SearchCriteria
    # Essential information still missing: the search should wait for it.
    missing: list[Literal["destination"]]
    clarification: str | None
    language: Language
    # "llm": understood by the language model; "fallback": simple keyword rules
    source: Literal["llm", "fallback"]
    warnings: list[Literal["dates_ignored", "llm_unavailable"]]
