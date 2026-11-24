"""Cleaning and importing the demo catalog.

Pipeline: raw records (dicts) -> clean_catalog() drops incomplete/invalid records and
normalizes type, capacity, amenities and coordinates -> import_catalog() writes them to the
database. The import is idempotent: running it twice updates the same rows (matched by
`source_id`) instead of creating duplicates.
"""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field, ValidationError, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Accommodation, AccommodationImage, Amenity
from app.models.accommodation import ACCOMMODATION_TYPES

# Bounding box of Romania: coordinates outside it are treated as data errors.
ROMANIA_LAT = (43.6, 48.3)
ROMANIA_LON = (20.2, 29.8)
MAX_CAPACITY = 20

# Raw type labels (our own, and Inside Airbnb's property/room types) -> our 7 types.
TYPE_ALIASES: dict[str, str] = {
    "apartment": "apartment", "flat": "apartment", "studio": "apartment", "condo": "apartment",
    "entire rental unit": "apartment", "entire condo": "apartment", "entire loft": "apartment",
    "entire serviced apartment": "apartment",
    "house": "house", "entire home": "house", "entire townhouse": "house", "chalet": "house",
    "entire home/apt": "house", "entire guesthouse": "house",
    "cabin": "cabin", "entire cabin": "cabin", "cottage": "cabin", "entire cottage": "cabin",
    "villa": "villa", "entire villa": "villa",
    "hotel": "hotel", "boutique hotel": "hotel", "room in hotel": "hotel",
    "room in boutique hotel": "hotel", "aparthotel": "hotel",
    "hostel": "hostel", "room in hostel": "hostel", "shared room in hostel": "hostel",
    "room": "room", "private room": "room", "private room in home": "room",
    "private room in rental unit": "room", "guest room": "room",
}


class CleanAccommodation(BaseModel):
    """A validated, normalized accommodation, ready to be stored."""

    source_id: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    type: str
    city: str = Field(min_length=2, max_length=100)
    country: str = "Romania"
    address: str | None = None
    latitude: float
    longitude: float
    price_per_night: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    currency: str = Field(default="RON", min_length=3, max_length=3)
    capacity: int = Field(ge=1, le=MAX_CAPACITY)
    bedrooms: int | None = Field(default=None, ge=0, le=20)
    bathrooms: Decimal | None = Field(default=None, ge=0, le=20)
    amenities: list[str] = []
    images: list[str] = []

    @field_validator("title", "city", "description", "address", mode="before")
    @classmethod
    def strip_text(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, value: Any) -> str:
        normalized = TYPE_ALIASES.get(str(value).strip().lower())
        if normalized is None or normalized not in ACCOMMODATION_TYPES:
            raise ValueError(f"unknown accommodation type: {value!r}")
        return normalized

    @field_validator("latitude")
    @classmethod
    def latitude_in_romania(cls, value: float) -> float:
        if not ROMANIA_LAT[0] <= value <= ROMANIA_LAT[1]:
            raise ValueError("latitude outside Romania")
        return round(value, 6)

    @field_validator("longitude")
    @classmethod
    def longitude_in_romania(cls, value: float) -> float:
        if not ROMANIA_LON[0] <= value <= ROMANIA_LON[1]:
            raise ValueError("longitude outside Romania")
        return round(value, 6)


@dataclass
class DroppedRecord:
    source_id: str
    reason: str


@dataclass
class CleaningReport:
    clean: list[CleanAccommodation] = field(default_factory=list)
    dropped: list[DroppedRecord] = field(default_factory=list)


@dataclass
class ImportStats:
    created: int = 0
    updated: int = 0
    amenities: int = 0


def clean_catalog(raw_records: list[dict[str, Any]], known_amenities: set[str]) -> CleaningReport:
    """Validate and normalize raw records. Invalid records are dropped, with the reason."""
    report = CleaningReport()
    seen_ids: set[str] = set()

    for index, raw in enumerate(raw_records):
        source_id = str(raw.get("source_id") or f"#{index}")
        if source_id in seen_ids:
            report.dropped.append(DroppedRecord(source_id, "duplicate source_id"))
            continue
        try:
            record = CleanAccommodation.model_validate(raw)
        except ValidationError as error:
            first = error.errors()[0]
            where = ".".join(str(part) for part in first["loc"])
            report.dropped.append(DroppedRecord(source_id, f"{where}: {first['msg']}"))
            continue

        # Normalize amenities: lowercase, drop unknown ones, remove duplicates (keep order)
        slugs = dict.fromkeys(a.strip().lower() for a in record.amenities)
        record.amenities = [slug for slug in slugs if slug in known_amenities]
        record.images = list(dict.fromkeys(record.images))

        seen_ids.add(source_id)
        report.clean.append(record)
    return report


def import_catalog(
    session: Session, amenities: list[dict[str, str]], records: list[CleanAccommodation]
) -> ImportStats:
    """Upsert amenities and accommodations. The caller commits the transaction."""
    stats = ImportStats()

    amenity_by_slug: dict[str, Amenity] = {a.slug: a for a in session.scalars(select(Amenity))}
    for item in amenities:
        amenity = amenity_by_slug.get(item["slug"])
        if amenity is None:
            amenity = Amenity(slug=item["slug"], name_en=item["name_en"], name_ro=item["name_ro"])
            session.add(amenity)
            amenity_by_slug[item["slug"]] = amenity
            stats.amenities += 1
        else:
            amenity.name_en, amenity.name_ro = item["name_en"], item["name_ro"]

    existing = {
        a.source_id: a
        for a in session.scalars(select(Accommodation).where(Accommodation.source_id.is_not(None)))
    }
    for record in records:
        accommodation = existing.get(record.source_id)
        if accommodation is None:
            accommodation = Accommodation(source_id=record.source_id)
            session.add(accommodation)
            stats.created += 1
        else:
            stats.updated += 1

        for column in (
            "title", "description", "type", "city", "country", "address", "latitude",
            "longitude", "price_per_night", "currency", "capacity", "bedrooms", "bathrooms",
        ):
            setattr(accommodation, column, getattr(record, column))
        accommodation.amenities = [amenity_by_slug[slug] for slug in record.amenities]
        accommodation.images = [
            AccommodationImage(url=url, position=position) for position, url in enumerate(record.images)
        ]

    session.flush()
    return stats
