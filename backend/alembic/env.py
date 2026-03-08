"""
Alembic Environment Configuration

This file tells Alembic HOW to connect to the database and
WHICH models to watch for changes. It uses async because
our app uses asyncpg (async PostgreSQL driver).
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

from app.config import settings

# Import ALL models here so Alembic can detect them.
# Without these imports, Alembic won't know the tables exist.
from app.models.user import User  # noqa: F401

# Alembic Config object — gives access to alembic.ini values
config = context.config

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tell Alembic to watch SQLModel's metadata for changes.
# When you add/change/delete a model, Alembic compares this
# metadata to the actual database and generates a migration.
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """
    Run migrations without a live database connection.
    Generates SQL scripts instead of executing directly.
    Useful for reviewing changes before applying them.
    """
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Helper that runs migrations using an existing connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """
    Run migrations with a live database connection (async).
    This is what happens when you run 'alembic upgrade head'.
    """
    connectable = create_async_engine(
        settings.DATABASE_URL,
        future=True,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
