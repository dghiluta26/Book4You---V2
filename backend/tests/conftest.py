"""Shared test fixtures.

Search tests need a real PostgreSQL (the search uses Postgres functions). Point
TEST_DATABASE_URL at a THROWAWAY database, e.g. a local Docker container:

    docker run --rm -d --name b4y-test-pg -p 54329:5432 -e POSTGRES_PASSWORD=test postgres:17
    export TEST_DATABASE_URL=postgresql://postgres:test@localhost:54329/postgres

Without TEST_DATABASE_URL these tests are skipped. NEVER point it at the Supabase database:
the fixture drops and recreates all tables.
"""

import os
import uuid
from collections.abc import Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import get_db, normalize_database_url
from app.main import app
from app.models import Accommodation, AccommodationImage, Amenity, Base, Booking, Profile

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")


def _stay(source_id: str, title: str, type_: str, city: str, price: int, capacity: int, **extra):
    return Accommodation(
        source_id=source_id, title=title, type=type_, city=city, latitude=45.6, longitude=25.6,
        price_per_night=price, capacity=capacity, **extra,
    )


@pytest.fixture(scope="session")
def engine():
    if not TEST_DATABASE_URL:
        pytest.skip("TEST_DATABASE_URL not set (see tests/conftest.py)")
    engine = create_engine(normalize_database_url(TEST_DATABASE_URL))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db(engine) -> Iterator[Session]:
    """A session whose changes are rolled back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def catalog(db: Session) -> dict[str, Accommodation]:
    """A small known catalog. Prices: cabin 450, apartment 200, hotel 350, villa 900."""
    wifi = Amenity(slug="wifi", name_en="Wi-Fi", name_ro="Wi-Fi")
    cabin = _stay("t-cabin", "Cabin in Brașov", "cabin", "Brașov", 450, 6, bedrooms=3)
    cabin.images = [AccommodationImage(url="http://x/2.jpg", position=1),
                    AccommodationImage(url="http://x/1.jpg", position=0)]
    cabin.amenities = [wifi]
    stays = {
        "cabin": cabin,
        "apartment": _stay("t-apt", "Flat in Sibiu", "apartment", "Sibiu", 200, 2),
        "hotel": _stay("t-hotel", "Hotel Poiana Brașov", "hotel", "Poiana Brașov", 350, 3),
        "villa": _stay("t-villa", "Villa in Mamaia", "villa", "Mamaia", 900, 10),
    }
    db.add_all(stays.values())
    db.flush()
    db.expire_all()  # force real queries later, as a fresh request would
    return stays


@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def make_booking(db: Session):
    """Create a booking (and its profile) for an accommodation."""
    def _make(accommodation: Accommodation, check_in: date, check_out: date, status="confirmed"):
        user = Profile(id=uuid.uuid4(), email=f"{uuid.uuid4().hex[:6]}@test.dev")
        db.add(user)
        db.flush()
        booking = Booking(
            user_id=user.id, accommodation_id=accommodation.id, check_in=check_in,
            check_out=check_out, guests=2, total_price=100, status=status,
        )
        db.add(booking)
        db.flush()
        return booking
    return _make
