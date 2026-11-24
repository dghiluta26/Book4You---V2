"""Schema tests that need no database: they inspect the SQLAlchemy metadata."""

from app.core.database import normalize_database_url
from app.models import Base


def test_all_tables_are_registered() -> None:
    assert set(Base.metadata.tables) == {
        "profiles",
        "accommodations",
        "accommodation_images",
        "amenities",
        "accommodation_amenities",
        "bookings",
    }


def test_search_columns_are_indexed() -> None:
    indexed = {
        col.name
        for index in Base.metadata.tables["accommodations"].indexes
        for col in index.columns
    }
    assert {"city", "type", "price_per_night", "capacity"} <= indexed


def test_bookings_have_the_required_columns() -> None:
    columns = set(Base.metadata.tables["bookings"].columns.keys())
    assert {"status", "check_in", "check_out", "total_price"} <= columns


def test_database_url_is_normalized_for_psycopg3() -> None:
    assert normalize_database_url("postgresql://u:p@h:5432/db") == "postgresql+psycopg://u:p@h:5432/db"
    assert normalize_database_url("postgres://u:p@h:5432/db") == "postgresql+psycopg://u:p@h:5432/db"
    assert normalize_database_url("postgresql+psycopg://u:p@h/db") == "postgresql+psycopg://u:p@h/db"
