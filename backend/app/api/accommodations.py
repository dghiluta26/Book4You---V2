from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.accommodation import AccommodationDetail, AccommodationPage, SearchParams
from app.schemas.booking import Availability, AvailabilityParams
from app.services import accommodation_search, booking_service
from app.services.errors import NotFoundError

router = APIRouter(prefix="/accommodations", tags=["accommodations"])


@router.get("", response_model=AccommodationPage)
def list_accommodations(
    params: Annotated[SearchParams, Query()],
    db: Session = Depends(get_db),
) -> AccommodationPage:
    """Search stays. All filters are optional and combined; only stays available in the
    requested period are returned (when check_in and check_out are given)."""
    return accommodation_search.search_accommodations(db, params)


@router.get("/{accommodation_id}", response_model=AccommodationDetail)
def get_accommodation(accommodation_id: int, db: Session = Depends(get_db)) -> AccommodationDetail:
    """Full details of one stay: photos, description, amenities, location."""
    try:
        return accommodation_search.get_accommodation(db, accommodation_id)
    except NotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{accommodation_id}/availability", response_model=Availability)
def check_availability(
    accommodation_id: int,
    params: Annotated[AvailabilityParams, Query()],
    db: Session = Depends(get_db),
) -> Availability:
    """Is this stay free for the period? Also returns the number of nights and the total price."""
    try:
        return booking_service.check_availability(db, accommodation_id, params.check_in, params.check_out)
    except NotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
