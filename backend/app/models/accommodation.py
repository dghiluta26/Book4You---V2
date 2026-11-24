from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

ACCOMMODATION_TYPES = ("apartment", "house", "cabin", "villa", "hotel", "hostel", "room")


class Accommodation(Base):
    __tablename__ = "accommodations"
    __table_args__ = (
        CheckConstraint(
            "type IN ('apartment', 'house', 'cabin', 'villa', 'hotel', 'hostel', 'room')",
            name="ck_accommodations_type",
        ),
        CheckConstraint("capacity > 0", name="ck_accommodations_capacity"),
        CheckConstraint("price_per_night >= 0", name="ck_accommodations_price"),
        # Indexes on the filtered columns (classic search must stay under 1s)
        Index("ix_accommodations_city", "city"),
        Index("ix_accommodations_type", "type"),
        Index("ix_accommodations_price_per_night", "price_per_night"),
        Index("ix_accommodations_capacity", "capacity"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # id of the listing in the source dataset (Inside Airbnb); makes the import re-runnable
    source_id: Mapped[str | None] = mapped_column(String(50), unique=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False, server_default="Romania")
    address: Mapped[str | None] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    price_per_night: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="RON")
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)  # max guests
    bedrooms: Mapped[int | None] = mapped_column(Integer)
    bathrooms: Mapped[Decimal | None] = mapped_column(Numeric(3, 1))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    images: Mapped[list["AccommodationImage"]] = relationship(
        back_populates="accommodation",
        cascade="all, delete-orphan",
        order_by="AccommodationImage.position",
    )
    amenities: Mapped[list["Amenity"]] = relationship(
        secondary="accommodation_amenities", back_populates="accommodations"
    )
    bookings: Mapped[list["Booking"]] = relationship(back_populates="accommodation")  # noqa: F821


class AccommodationImage(Base):
    __tablename__ = "accommodation_images"
    __table_args__ = (Index("ix_accommodation_images_accommodation_id", "accommodation_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    accommodation_id: Mapped[int] = mapped_column(
        ForeignKey("accommodations.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    accommodation: Mapped["Accommodation"] = relationship(back_populates="images")


class Amenity(Base):
    """An amenity (wifi, parking, ...) with both RO and EN names."""

    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    name_ro: Mapped[str] = mapped_column(String(100), nullable=False)

    accommodations: Mapped[list["Accommodation"]] = relationship(
        secondary="accommodation_amenities", back_populates="amenities"
    )


class AccommodationAmenity(Base):
    """Many-to-many link table between accommodations and amenities."""

    __tablename__ = "accommodation_amenities"

    accommodation_id: Mapped[int] = mapped_column(
        ForeignKey("accommodations.id", ondelete="CASCADE"), primary_key=True
    )
    amenity_id: Mapped[int] = mapped_column(
        ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True
    )
