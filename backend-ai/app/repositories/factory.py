"""Factory pattern for repository instantiation.

Returns the correct repository implementation based on DATA_STORAGE_MODE.
Called once at startup. Switching modes = change .env only, restart service.
"""

from app.config import settings
from app.repositories.activity_repository import (
    HybridActivityRepository,
    ApiOnlyActivityRepository,
    DbDirectActivityRepository,
)
from app.repositories.lead_repository import (
    HybridLeadRepository,
    ApiOnlyLeadRepository,
    DbDirectLeadRepository,
)
from app.repositories.base import BaseActivityRepository, BaseLeadRepository
from app.utils.logger import get_logger

logger = get_logger(__name__)


def get_activity_repository() -> BaseActivityRepository:
    """
    Factory function to instantiate activity repository.

    Returns the correct implementation based on settings.DATA_STORAGE_MODE.
    Enables switching storage strategies without code changes.

    Supported modes:
    - "hybrid": Our DB + Leadrat API (default, safest)
    - "api_only": Leadrat API only, no local DB
    - "db_direct": Direct Leadrat DB (future)

    Returns:
        BaseActivityRepository: Configured repository instance

    Raises:
        ValueError: If DATA_STORAGE_MODE is invalid
    """
    mode = settings.data_storage_mode.lower()

    if mode == "hybrid":
        logger.info("activity_repository_initialized", mode="hybrid")
        return HybridActivityRepository()

    elif mode == "api_only":
        logger.info("activity_repository_initialized", mode="api_only")
        return ApiOnlyActivityRepository()

    elif mode == "db_direct":
        if not settings.leadrat_db_url:
            raise ValueError(
                "DATA_STORAGE_MODE=db_direct requires LEADRAT_DB_URL in .env"
            )
        logger.info("activity_repository_initialized", mode="db_direct")
        return DbDirectActivityRepository()

    else:
        raise ValueError(
            f"Unknown DATA_STORAGE_MODE: {mode}. "
            f"Supported values: hybrid, api_only, db_direct"
        )


def get_lead_repository() -> BaseLeadRepository:
    """
    Factory function to instantiate lead repository.

    Returns the correct implementation based on settings.DATA_STORAGE_MODE.
    Enables switching storage strategies without code changes.

    Returns:
        BaseLeadRepository: Configured repository instance

    Raises:
        ValueError: If DATA_STORAGE_MODE is invalid
    """
    mode = settings.data_storage_mode.lower()

    if mode == "hybrid":
        logger.info("lead_repository_initialized", mode="hybrid")
        return HybridLeadRepository()

    elif mode == "api_only":
        logger.info("lead_repository_initialized", mode="api_only")
        return ApiOnlyLeadRepository()

    elif mode == "db_direct":
        if not settings.leadrat_db_url:
            raise ValueError(
                "DATA_STORAGE_MODE=db_direct requires LEADRAT_DB_URL in .env"
            )
        logger.info("lead_repository_initialized", mode="db_direct")
        return DbDirectLeadRepository()

    else:
        raise ValueError(
            f"Unknown DATA_STORAGE_MODE: {mode}. "
            f"Supported values: hybrid, api_only, db_direct"
        )


# Global singleton instances
# Instantiated once at startup
# All services use these to access data
activity_repo = get_activity_repository()
lead_repo = get_lead_repository()
