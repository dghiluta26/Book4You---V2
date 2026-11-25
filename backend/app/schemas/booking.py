from datetime import date, datetime
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.accommodation import AccommodationSummary

BookingStatus = Literal["confirmed", "cancelled"]


class BookingCreate(BaseModel):
    accommodation_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=20)

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


class AvailabilityParams(BaseModel):
    check_in: date
    check_out: date

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


class Availability(BaseModel):
    available: bool
    nights: int
    total_price: float
    currency: str
    # Why it is not available: "booked" (dates taken) or "past" (check-in in the past)
    reason: Literal["booked", "past"] | None = None


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    accommodation: AccommodationSummary
    check_in: date
    check_out: date
    nights: int
    guests: int
    total_price: float
    currency: str
    status: BookingStatus
    created_at: datetime
    cancelled_at: datetime | None
