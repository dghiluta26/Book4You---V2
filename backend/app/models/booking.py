import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

BOOKING_STATUSES = ("confirmed", "cancelled")


class Booking(Base):
    """A simulated booking.

    Overlap rule: two bookings overlap if
        new.check_in < existing.check_out AND new.check_out > existing.check_in
    Only `confirmed` bookings count, so cancelling frees the period. The rule is checked
    in the service layer AND enforced by an EXCLUDE constraint created in the migration.
    """

    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_bookings_dates"),
        CheckConstraint("status IN ('confirmed', 'cancelled')", name="ck_bookings_status"),
        CheckConstraint("guests > 0", name="ck_bookings_guests"),
        Index("ix_bookings_user_id", "user_id"),
        Index("ix_bookings_accommodation_dates", "accommodation_id", "check_in", "check_out"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    accommodation_id: Mapped[int] = mapped_column(
        ForeignKey("accommodations.id", ondelete="RESTRICT"), nullable=False
    )
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    guests: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(10), nullable=False, server_default="confirmed")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["Profile"] = relationship(back_populates="bookings")  # noqa: F821
    accommodation: Mapped["Accommodation"] = relationship(back_populates="bookings")  # noqa: F821
