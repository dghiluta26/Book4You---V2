"""Alembic environment: uses the same DATABASE_URL and models as the app."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import get_settings
from app.core.database import normalize_database_url
from app.models import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Constraints that exist only in the database on purpose (created by raw SQL in a migration).
# fk_profiles_auth_users points to Supabase's auth.users table, which is not one of our models.
IGNORED_CONSTRAINTS = {"fk_profiles_auth_users"}


def include_object(obj, name, type_, reflected, compare_to):  # noqa: ANN001
    """Tell autogenerate/`alembic check` to skip the objects listed above."""
    return not (type_ == "foreign_key_constraint" and name in IGNORED_CONSTRAINTS)


def get_url() -> str:
    url = get_settings().database_url
    if not url:
        raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
    return normalize_database_url(url)


def run_migrations_offline() -> None:
    """Generate SQL without connecting to the database."""
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        include_object=include_object,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Connect to the database and apply the migrations."""
    connectable = create_engine(get_url(), poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata, include_object=include_object
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
