"""Classic search: all filters are combined with AND, results are sorted and paginated."""

import math

from sqlalchemy import and_, exists, func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Accommodation, AccommodationImage, Booking
from app.schemas.accommodation import (
    AccommodationDetail,
    AccommodationPage,
    AccommodationSummary,
    SearchParams,
)
from app.services.errors import NotFoundError

# Accent-insensitive matching for Romanian letters (so "Brasov" finds "Brașov").
# Includes both the comma-below (ș ț) and the old cedilla (ş ţ) variants.
_ACCENTED = "ăâîșțşţ"
_PLAIN = "aaistst"


def normalize_text(text: str) -> str:
    """Lowercase and strip Romanian diacritics. Mirrors the SQL expression below."""
    return text.strip().lower().translate(str.maketrans(_ACCENTED, _PLAIN))


def _normalized_column(column):  # noqa: ANN001, ANN202
    return func.translate(func.lower(column), _ACCENTED, _PLAIN)


def _escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _build_conditions(params: SearchParams) -> list:
    conditions = []

    if params.city and params.city.strip():
        pattern = f"%{_escape_like(normalize_text(params.city))}%"
        conditions.append(_normalized_column(Accommodation.city).like(pattern, escape="\\"))
    if params.guests is not None:
        conditions.append(Accommodation.capacity >= params.guests)
    if params.min_price is not None:
        conditions.append(Accommodation.price_per_night >= params.min_price)
    if params.max_price is not None:
        conditions.append(Accommodation.price_per_night <= params.max_price)
    if params.type:
        conditions.append(Accommodation.type.in_(params.type))

    if params.check_in and params.check_out:
        # Available = no CONFIRMED booking overlaps the requested period.
        # Overlap rule: new.check_in < existing.check_out AND new.check_out > existing.check_in
        overlapping = exists().where(
            and_(
                Booking.accommodation_id == Accommodation.id,
                Booking.status == "confirmed",
                Booking.check_in < params.check_out,
                Booking.check_out > params.check_in,
            )
        )
        conditions.append(~overlapping)

    return conditions


def search_accommodations(db: Session, params: SearchParams) -> AccommodationPage:
    conditions = _build_conditions(params)

    total = db.scalar(select(func.count()).select_from(Accommodation).where(*conditions)) or 0

    thumbnail = (
        select(AccommodationImage.url)
        .where(AccommodationImage.accommodation_id == Accommodation.id)
        .order_by(AccommodationImage.position)
        .limit(1)
        .scalar_subquery()
    )
    price_order = (
        Accommodation.price_per_night.desc()
        if params.sort == "price_desc"
        else Accommodation.price_per_night.asc()
    )
    rows = db.execute(
        select(Accommodation, thumbnail.label("thumbnail"))
        .where(*conditions)
        .order_by(price_order, Accommodation.id)  # id keeps the order stable between pages
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
    ).all()

    items = []
    for accommodation, thumb in rows:
        item = AccommodationSummary.model_validate(accommodation)
        item.thumbnail = thumb
        items.append(item)

    return AccommodationPage(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=math.ceil(total / params.page_size),
    )


def get_accommodation(db: Session, accommodation_id: int) -> AccommodationDetail:
    accommodation = db.scalar(
        select(Accommodation)
        .options(selectinload(Accommodation.images), selectinload(Accommodation.amenities))
        .where(Accommodation.id == accommodation_id)
    )
    if accommodation is None:
        raise NotFoundError(f"Accommodation {accommodation_id} not found")

    detail = AccommodationDetail.model_validate(accommodation)
    detail.thumbnail = detail.images[0].url if detail.images else None
    return detail
