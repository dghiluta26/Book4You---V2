from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AuthUser, get_current_user
from app.schemas.booking import BookingCreate, BookingOut
from app.services import booking_service
from app.services.errors import ConflictError, NotFoundError, RuleViolationError

router = APIRouter(prefix="/bookings", tags=["bookings"])

CurrentUser = Annotated[AuthUser, Depends(get_current_user)]


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingCreate, user: CurrentUser, db: Session = Depends(get_db)) -> BookingOut:
    """Book a stay (simulated, no payment). 409 if the dates are taken, 422 on rule violations."""
    try:
        return booking_service.create_booking(db, user, data)
    except NotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except RuleViolationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get("/me", response_model=list[BookingOut])
def my_bookings(user: CurrentUser, db: Session = Depends(get_db)) -> list[BookingOut]:
    """The logged-in user's bookings, newest stay first."""
    return booking_service.list_my_bookings(db, user)


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, user: CurrentUser, db: Session = Depends(get_db)) -> BookingOut:
    """Cancel one of my bookings. This frees the period for other guests."""
    try:
        return booking_service.cancel_booking(db, user, booking_id)
    except NotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
