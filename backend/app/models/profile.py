import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Profile(Base):
    """Public profile of a user. `id` equals the Supabase Auth user id (auth.users.id).

    The foreign key to auth.users is created in the migration (it lives in another schema).
    """

    __tablename__ = "profiles"
    __table_args__ = (
        CheckConstraint("preferred_language IN ('ro', 'en')", name="ck_profiles_language"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(150))
    preferred_language: Mapped[str] = mapped_column(String(2), nullable=False, server_default="ro")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    bookings: Mapped[list["Booking"]] = relationship(back_populates="user")  # noqa: F821
