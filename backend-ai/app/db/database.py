"""Async SQLAlchemy database configuration and session management."""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,  # Log all SQL statements in debug mode
    future=True,
    pool_pre_ping=True,  # Test connections before using
    pool_size=20,
    max_overflow=40,
)

# Session factory for dependency injection
AsyncSession = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def init_db() -> None:
    """
    Initialize database (run migrations via Flyway).

    Called on application startup to ensure schema is up-to-date.
    """
    logger.info("database_init_start")

    try:
        # TODO: Run Flyway migrations
        # migrations_dir = "backend-ai/alembic/versions"
        # Run: alembic upgrade head

        logger.info("database_init_complete")
    except Exception as e:
        logger.error("database_init_failed", error=str(e), exc_info=True)
        raise


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session for dependency injection.

    Usage in FastAPI:
        from fastapi import Depends
        async def endpoint(session: AsyncSession = Depends(get_session)):
            ...

    Yields:
        AsyncSession: Database session (auto-committed on exit)
    """
    async with AsyncSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
