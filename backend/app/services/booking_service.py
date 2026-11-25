"""Availability check, simulated booking, history and cancellation (CF-06).

Overlap rule: two bookings overlap if
    new.check_in < existing.check_out AND new.check_out > existing.check_in
Only `confirmed` bookings count, so cancelling frees the period. The database also enforces
this with an EXCLUDE constraint, which catches two requests arriving at the same moment.
"""

from datetime import date, datetime, timezone

from sqlalchemy import and_, exists, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import AuthUser
from app.models import Accommodation, Booking, Profile
from app.schemas.accommodation import AccommodationSummary
from app.schemas.booking import Availability, BookingCreate, BookingOut
from app.services.errors import ConflictError, NotFoundError, RuleViolationError

MAX_NIGHTS = 30


def _nights(check_in: date, check_out: date) -> int:
    return (check_out - check_in).days


def _is_booked(db: Session, accommodation_id: int, check_in: date, check_out: date) -> bool:
    overlapping = exists().where(
        and_(
            Booking.accommodation_id == accommodation_id,
            Booking.status == "confirmed",
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
    )
    return bool(db.scalar(select(overlapping)))


def _get_accommodation(db: Session, accommodation_id: int) -> Accommodation:
    accommodation = db.get(Accommodation, accommodation_id)
    if accommodation is None:
        raise NotFoundError(f"Accommodation {accommodation_id} not found")
    return accommodation


def check_availability(
    db: Session, accommodation_id: int, check_in: date, check_out: date, today: date | None = None
) -> Availability:
    accommodation = _get_accommodation(db, accommodation_id)
    nights = _nights(check_in, check_out)
    reason = None
    if check_in < (today or date.today()):
        reason = "past"
    elif _is_booked(db, accommodation_id, check_in, check_out):
        reason = "booked"
    return Availability(
        available=reason is None,
        nights=nights,
        total_price=float(accommodation.price_per_night * nights),
        currency=accommodation.currency,
        reason=reason,
    )


def _ensure_profile(db: Session, user: AuthUser) -> None:
    """Bookings reference profiles.id. The profile is created the first time a user books."""
    db.execute(
        pg_insert(Profile)
        .values(id=user.id, email=user.email, full_name=user.full_name)
        .on_conflict_do_nothing(index_elements=["id"])
    )


def _to_out(booking: Booking) -> BookingOut:
    accommodation = booking.accommodation
    summary = AccommodationSummary.model_validate(accommodation)
    summary.thumbnail = accommodation.images[0].url if accommodation.images else None
    return BookingOut(
        id=booking.id,
        accommodation=summary,
        check_in=booking.check_in,
        check_out=booking.check_out,
        nights=_nights(booking.check_in, booking.check_out),
        guests=booking.guests,
        total_price=float(booking.total_price),
        currency=accommodation.currency,
        status=booking.status,  # type: ignore[arg-type]
        created_at=booking.created_at,
        cancelled_at=booking.cancelled_at,
    )


def _load_booking(db: Session, booking_id: int) -> Booking | None:
    return db.scalar(
        select(Booking)
        .options(selectinload(Booking.accommodation).selectinload(Accommodation.images))
        .where(Booking.id == booking_id)
    )


def create_booking(
    db: Session, user: AuthUser, data: BookingCreate, today: date | None = None
) -> BookingOut:
    accommodation = _get_accommodation(db, data.accommodation_id)

    if data.check_in < (today or date.today()):
        raise RuleViolationError("check_in cannot be in the past")
    nights = _nights(data.check_in, data.check_out)
    if nights > MAX_NIGHTS:
        raise RuleViolationError(f"A booking cannot be longer than {MAX_NIGHTS} nights")
    if data.guests > accommodation.capacity:
        raise RuleViolationError(f"This stay accepts at most {accommodation.capacity} guests")
    if _is_booked(db, accommodation.id, data.check_in, data.check_out):
        raise ConflictError("These dates are no longer available")

    _ensure_profile(db, user)
    booking = Booking(
        user_id=user.id,
        accommodation_id=accommodation.id,
        check_in=data.check_in,
        check_out=data.check_out,
        guests=data.guests,
        total_price=accommodation.price_per_night * nights,
        status="confirmed",
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError:
        # Someone booked the same dates a moment ago: the database exclusion constraint caught it.
        db.rollback()
        raise ConflictError("These dates are no longer available") from None

    return _to_out(_load_booking(db, booking.id))  # type: ignore[arg-type]


def list_my_bookings(db: Session, user: AuthUser) -> list[BookingOut]:
    bookings = db.scalars(
        select(Booking)
        .options(selectinload(Booking.accommodation).selectinload(Accommodation.images))
        .where(Booking.user_id == user.id)
        .order_by(Booking.check_in.desc(), Booking.id.desc())
    ).all()
    return [_to_out(booking) for booking in bookings]


def cancel_booking(db: Session, user: AuthUser, booking_id: int) -> BookingOut:
    booking = _load_booking(db, booking_id)
    # Somebody else's booking looks exactly like a missing one: no information is leaked.
    if booking is None or booking.user_id != user.id:
        raise NotFoundError(f"Booking {booking_id} not found")
    if booking.status == "cancelled":
        raise ConflictError("This booking is already cancelled")

    booking.status = "cancelled"
    booking.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    return _to_out(_load_booking(db, booking_id))  # type: ignore[arg-type]
