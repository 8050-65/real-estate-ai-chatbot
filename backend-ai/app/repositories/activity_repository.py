"""Activity repository implementations for 3 storage modes."""

from typing import Optional
import structlog

from app.repositories.base import BaseActivityRepository
from app.utils.logger import get_logger

logger = get_logger(__name__)


class HybridActivityRepository(BaseActivityRepository):
    """
    MODE: hybrid (default, safest)
    - Writes to OUR PostgreSQL database first (never loses data)
    - Async syncs to Leadrat API in background
    - Reads from our DB (fast, no API latency)
    - Status updates → our DB + Leadrat API

    Best for: Production with data ownership requirement
    """

    async def create_activity(
        self, activity_data: dict, tenant_id: str
    ) -> dict:
        """
        Create activity in our DB + async sync to Leadrat.

        Returns immediately with local record (fast).
        Background sync handles Leadrat updates.
        """
        logger.debug(
            "hybrid_activity_create",
            tenant_id=tenant_id,
            activity_type=activity_data.get("type")
        )

        # TODO: Implement DB insert into site_visits
        # 1. Save to our site_visits table
        # 2. Spawn background task for Leadrat sync
        # 3. Return activity with our DB id + leadrat_visit_id (initially null)

        activity_data["tenant_id"] = tenant_id
        activity_data["leadrat_synced"] = False
        return activity_data

    async def update_status(
        self,
        activity_id: str,
        status: str,
        notes: Optional[str] = None
    ) -> dict:
        """Update activity status in both DB and Leadrat."""
        logger.debug(
            "hybrid_activity_update_status",
            activity_id=activity_id,
            status=status
        )

        # TODO: Implement:
        # 1. UPDATE our site_visits SET status=?, updated_at=NOW()
        # 2. PUT to Leadrat API
        # 3. If Leadrat fails → mark for retry queue
        # 4. Return updated record

        return {
            "id": activity_id,
            "status": status,
            "notes": notes
        }

    async def get_activities_by_lead(
        self, leadrat_lead_id: str, tenant_id: str
    ) -> list:
        """Get activities from our DB (fastest, no API call)."""
        logger.debug(
            "hybrid_activity_list",
            leadrat_lead_id=leadrat_lead_id,
            tenant_id=tenant_id
        )

        # TODO: Implement:
        # SELECT * FROM site_visits
        # WHERE leadrat_lead_id = ? AND tenant_id = ?
        # ORDER BY scheduled_at DESC

        return []

    async def get_pending_reminders(
        self, reminder_type: str
    ) -> list:
        """Get activities needing reminders from our DB."""
        logger.debug(
            "hybrid_activity_reminders",
            reminder_type=reminder_type
        )

        # TODO: Implement:
        # SELECT * FROM site_visits
        # WHERE status IN ('scheduled', 'confirmed')
        # AND reminder_type_sent = FALSE
        # AND scheduled_at <= NOW() + interval

        return []


class ApiOnlyActivityRepository(BaseActivityRepository):
    """
    MODE: api_only
    - No local DB storage at all
    - All reads/writes go directly to Leadrat API
    - Redis cache for performance (5 min TTL for property data)
    - Stateless deployment (scales horizontally)

    Best for: Simple deployments, Leadrat as single source of truth
    """

    async def create_activity(
        self, activity_data: dict, tenant_id: str
    ) -> dict:
        """Create activity directly in Leadrat API."""
        logger.debug(
            "api_only_activity_create",
            tenant_id=tenant_id
        )

        # TODO: Implement:
        # POST to Leadrat /activities endpoint
        # leadrat_response = await leadrat_client.post(...)
        # Cache result in Redis with 5min TTL
        # Return response

        return activity_data

    async def update_status(
        self,
        activity_id: str,
        status: str,
        notes: Optional[str] = None
    ) -> dict:
        """Update activity status directly in Leadrat API."""
        logger.debug(
            "api_only_activity_update_status",
            activity_id=activity_id,
            status=status
        )

        # TODO: Implement:
        # PUT to Leadrat /activities/{id} endpoint
        # Invalidate Redis cache key for this activity
        # Return updated record

        return {
            "id": activity_id,
            "status": status
        }

    async def get_activities_by_lead(
        self, leadrat_lead_id: str, tenant_id: str
    ) -> list:
        """Get activities from Leadrat API (with Redis cache)."""
        logger.debug(
            "api_only_activity_list",
            leadrat_lead_id=leadrat_lead_id
        )

        # TODO: Implement:
        # cache_key = f"leadrat:activities:{leadrat_lead_id}"
        # cached = await redis.get(cache_key)
        # if cached: return json.loads(cached)
        #
        # response = await leadrat_client.get(...)
        # await redis.setex(cache_key, 300, json.dumps(response))
        # return response

        return []

    async def get_pending_reminders(
        self, reminder_type: str
    ) -> list:
        """Get pending reminders from Leadrat API."""
        logger.debug(
            "api_only_activity_reminders",
            reminder_type=reminder_type
        )

        # TODO: Implement:
        # GET from Leadrat /activities endpoint
        # Filter locally by reminder_type and scheduled_at
        # Return matching records

        return []


class DbDirectActivityRepository(BaseActivityRepository):
    """
    MODE: db_direct (FUTURE - not implemented yet)
    - Connect directly to Leadrat PostgreSQL database
    - No API calls — raw SQL queries only
    - Fastest possible reads/writes
    - Requires Leadrat to grant direct DB access

    Best for: High-performance scenarios when Leadrat enables direct DB
    """

    async def create_activity(
        self, activity_data: dict, tenant_id: str
    ) -> dict:
        """Create activity via direct Leadrat DB connection."""
        raise NotImplementedError(
            "db_direct mode not yet implemented. "
            "Set DATA_STORAGE_MODE=hybrid or api_only"
        )

    async def update_status(
        self,
        activity_id: str,
        status: str,
        notes: Optional[str] = None
    ) -> dict:
        """Update activity status via direct Leadrat DB."""
        raise NotImplementedError(
            "db_direct mode not yet implemented. "
            "Set DATA_STORAGE_MODE=hybrid or api_only"
        )

    async def get_activities_by_lead(
        self, leadrat_lead_id: str, tenant_id: str
    ) -> list:
        """Get activities via direct Leadrat DB."""
        raise NotImplementedError(
            "db_direct mode not yet implemented. "
            "Set DATA_STORAGE_MODE=hybrid or api_only"
        )

    async def get_pending_reminders(
        self, reminder_type: str
    ) -> list:
        """Get pending reminders via direct Leadrat DB."""
        raise NotImplementedError(
            "db_direct mode not yet implemented. "
            "Set DATA_STORAGE_MODE=hybrid or api_only"
        )
