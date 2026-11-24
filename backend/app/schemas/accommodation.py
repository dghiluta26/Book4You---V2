from datetime import date
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

AccommodationType = Literal["apartment", "house", "cabin", "villa", "hotel", "hostel", "room"]
SortOption = Literal["price_asc", "price_desc"]


class SearchParams(BaseModel):
    """Query parameters of GET /accommodations. FastAPI validates them automatically (422)."""

    city: str | None = Field(default=None, max_length=100, description="Partial, accent-insensitive")
    check_in: date | None = None
    check_out: date | None = None
    guests: int | None = Field(default=None, ge=1, le=20)
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    type: list[AccommodationType] = Field(default_factory=list, description="Repeat to allow several")
    sort: SortOption = "price_asc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=12, ge=1, le=50)

    @model_validator(mode="after")
    def check_consistency(self) -> Self:
        if (self.check_in is None) != (self.check_out is None):
            raise ValueError("check_in and check_out must be provided together")
        if self.check_in and self.check_out and self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        if (
            self.min_price is not None
            and self.max_price is not None
            and self.min_price > self.max_price
        ):
            raise ValueError("min_price must not be greater than max_price")
        return self


class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name_en: str
    name_ro: str


class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str
    position: int


class AccommodationSummary(BaseModel):
    """One card in the results list / one marker on the map."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    type: AccommodationType
    city: str
    country: str
    latitude: float
    longitude: float
    price_per_night: float
    currency: str
    capacity: int
    bedrooms: int | None
    bathrooms: float | None
    thumbnail: str | None = None


class AccommodationDetail(AccommodationSummary):
    description: str | None
    address: str | None
    images: list[ImageOut]
    amenities: list[AmenityOut]


class AccommodationPage(BaseModel):
    items: list[AccommodationSummary]
    total: int
    page: int
    page_size: int
    total_pages: int
