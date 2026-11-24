"""initial schema: profiles, accommodations, images, amenities, bookings

Revision ID: 0001
Revises:
Create Date: 2026-11-24
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLES = [
    "profiles",
    "accommodations",
    "accommodation_images",
    "amenities",
    "accommodation_amenities",
    "bookings",
]


def upgrade() -> None:
    # btree_gist lets an EXCLUDE constraint combine "=" (accommodation) with "&&" (date range)
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    op.create_table(
        "profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(150)),
        sa.Column("preferred_language", sa.String(2), nullable=False, server_default="ro"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("preferred_language IN ('ro', 'en')", name="ck_profiles_language"),
    )
    # profiles.id IS the Supabase Auth user id: deleting the auth user deletes the profile.
    # Skipped when the auth schema does not exist (plain local Postgres used for tests).
    op.execute(
        """
        DO $$
        BEGIN
            IF to_regclass('auth.users') IS NOT NULL THEN
                ALTER TABLE profiles
                    ADD CONSTRAINT fk_profiles_auth_users
                    FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
            END IF;
        END $$;
        """
    )

    op.create_table(
        "accommodations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("source_id", sa.String(50), unique=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("country", sa.String(100), nullable=False, server_default="Romania"),
        sa.Column("address", sa.String(255)),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("price_per_night", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="RON"),
        sa.Column("capacity", sa.Integer, nullable=False),
        sa.Column("bedrooms", sa.Integer),
        sa.Column("bathrooms", sa.Numeric(3, 1)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "type IN ('apartment', 'house', 'cabin', 'villa', 'hotel', 'hostel', 'room')",
            name="ck_accommodations_type",
        ),
        sa.CheckConstraint("capacity > 0", name="ck_accommodations_capacity"),
        sa.CheckConstraint("price_per_night >= 0", name="ck_accommodations_price"),
    )
    op.create_index("ix_accommodations_city", "accommodations", ["city"])
    op.create_index("ix_accommodations_type", "accommodations", ["type"])
    op.create_index("ix_accommodations_price_per_night", "accommodations", ["price_per_night"])
    op.create_index("ix_accommodations_capacity", "accommodations", ["capacity"])

    op.create_table(
        "accommodation_images",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "accommodation_id",
            sa.Integer,
            sa.ForeignKey("accommodations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index(
        "ix_accommodation_images_accommodation_id", "accommodation_images", ["accommodation_id"]
    )

    op.create_table(
        "amenities",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("slug", sa.String(50), nullable=False, unique=True),
        sa.Column("name_en", sa.String(100), nullable=False),
        sa.Column("name_ro", sa.String(100), nullable=False),
    )

    op.create_table(
        "accommodation_amenities",
        sa.Column(
            "accommodation_id",
            sa.Integer,
            sa.ForeignKey("accommodations.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "amenity_id",
            sa.Integer,
            sa.ForeignKey("amenities.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "accommodation_id",
            sa.Integer,
            sa.ForeignKey("accommodations.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("check_in", sa.Date, nullable=False),
        sa.Column("check_out", sa.Date, nullable=False),
        sa.Column("guests", sa.Integer, nullable=False),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(10), nullable=False, server_default="confirmed"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("cancelled_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("check_out > check_in", name="ck_bookings_dates"),
        sa.CheckConstraint("status IN ('confirmed', 'cancelled')", name="ck_bookings_status"),
        sa.CheckConstraint("guests > 0", name="ck_bookings_guests"),
    )
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index(
        "ix_bookings_accommodation_dates", "bookings", ["accommodation_id", "check_in", "check_out"]
    )
    # Safety net for CF-06: the database itself refuses two confirmed bookings of the same
    # stay with overlapping periods (half-open range [check_in, check_out), so a stay can
    # start on the day the previous one ends). Cancelled bookings are ignored.
    op.execute(
        """
        ALTER TABLE bookings ADD CONSTRAINT ex_bookings_no_overlap
        EXCLUDE USING gist (
            accommodation_id WITH =,
            daterange(check_in, check_out, '[)') WITH &&
        ) WHERE (status = 'confirmed')
        """
    )

    # Row Level Security: the browser only talks to Supabase for Auth. All data goes through
    # our FastAPI backend (which connects as the table owner and bypasses RLS). Enabling RLS
    # without policies blocks anyone using the public anon key against the auto-generated
    # Supabase REST API.
    for table in TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_table("bookings")
    op.drop_table("accommodation_amenities")
    op.drop_table("amenities")
    op.drop_table("accommodation_images")
    op.drop_table("accommodations")
    op.drop_table("profiles")
