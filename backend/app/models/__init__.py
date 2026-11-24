"""Import every model here so Base.metadata knows all tables (needed by Alembic)."""

from app.models.accommodation import (
    Accommodation,
    AccommodationAmenity,
    AccommodationImage,
    Amenity,
)
from app.models.base import Base
from app.models.booking import Booking
from app.models.profile import Profile

__all__ = [
    "Accommodation",
    "AccommodationAmenity",
    "AccommodationImage",
    "Amenity",
    "Base",
    "Booking",
    "Profile",
]
