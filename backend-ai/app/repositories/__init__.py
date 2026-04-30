"""Repository pattern for data storage abstraction.

Decouples business logic from storage implementation.
Supports 3 configurable modes without code changes:
- hybrid: Our DB + Leadrat API (default, safe)
- api_only: Leadrat API only, no local DB
- db_direct: Direct Leadrat DB (future)
"""

from app.repositories.base import BaseActivityRepository, BaseLeadRepository
from app.repositories.factory import get_activity_repository, get_lead_repository

__all__ = [
    "BaseActivityRepository",
    "BaseLeadRepository",
    "get_activity_repository",
    "get_lead_repository",
]
