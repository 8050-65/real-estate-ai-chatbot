"""Lead repository implementations for 3 storage modes."""

from typing import Optional
from app.repositories.base import BaseLeadRepository
from app.utils.logger import get_logger

logger = get_logger(__name__)


class HybridLeadRepository(BaseLeadRepository):
    """
    MODE: hybrid (default)
    - Store lead_id reference in our whatsapp_sessions table
    - Lead details (name, email, status) always fetched from Leadrat
    - Create lead in Leadrat first, store ID in our DB
    - Sync lead status from Leadrat periodically

    Best for: Production, data ownership + API integration
    """

    async def create_or_update_lead(
        self, lead_data: dict, tenant_id: str
    ) -> dict:
        """
        Create lead in Leadrat, store ID reference in our DB.

        Returns immediately with Leadrat response.
        Our DB only stores the leadrat_lead_id reference.
        """
        logger.debug(
            "hybrid_lead_create_or_update",
            tenant_id=tenant_id,
            phone=lead_data.get("phone")
        )

        # TODO: Implement:
        # 1. POST to Leadrat /leads (or PUT if exists)
        # 2. Extract leadrat_lead_id from response
        # 3. Store reference in our whatsapp_sessions
        # 4. Return full Leadrat lead record

        return lead_data

    async def get_lead_by_phone(
        self, phone: str, tenant_id: str
    ) -> Optional[dict]:
        """
        Find lead by phone via Leadrat API.

        Our DB has the session entry with leadrat_lead_id.
        Fetch full lead details from Leadrat.
        """
        logger.debug(
            "hybrid_lead_get_by_phone",
            phone=phone,
            tenant_id=tenant_id
        )

        # TODO: Implement:
        # 1. Query our DB: SELECT leadrat_lead_id FROM whatsapp_sessions
        #    WHERE phone=? AND tenant_id=?
        # 2. If found, GET from Leadrat API using leadrat_lead_id
        # 3. Return full Leadrat lead record
        # 4. If not found in our DB, search Leadrat API directly

        return None

    async def get_lead_by_id(
        self, leadrat_lead_id: str
    ) -> Optional[dict]:
        """Get lead by Leadrat ID from Leadrat API."""
        logger.debug(
            "hybrid_lead_get_by_id",
            leadrat_lead_id=leadrat_lead_id
        )

        # TODO: Implement:
        # GET from Leadrat /leads/{id} endpoint
        # Return full lead record

        return None

    async def update_lead_status(
        self, leadrat_lead_id: str, status_id: str
    ) -> bool:
        """Update lead status in Leadrat."""
        logger.debug(
            "hybrid_lead_update_status",
            leadrat_lead_id=leadrat_lead_id,
            status_id=status_id
        )

        # TODO: Implement:
        # PUT to Leadrat /leads/{id} with new status
        # Return True if successful

        return True


class ApiOnlyLeadRepository(BaseLeadRepository):
    """
    MODE: api_only
    - All lead operations go through Leadrat API
    - Redis caching for read performance
    - No local storage of lead details (only session state)
    - Stateless, can scale horizontally

    Best for: Simple deployments, Leadrat as single source of truth
    """

    async def create_or_update_lead(
        self, lead_data: dict, tenant_id: str
    ) -> dict:
        """Create/update lead directly in Leadrat API."""
        logger.debug(
            "api_only_lead_create_or_update",
            tenant_id=tenant_id
        )

        # TODO: Implement:
        # POST/PUT to Leadrat /leads endpoint
        # Cache result in Redis with 60sec TTL
        # Return Leadrat response

        return lead_data

    async def get_lead_by_phone(
        self, phone: str, tenant_id: str
    ) -> Optional[dict]:
        """Get lead from Leadrat API using phone (with cache)."""
        logger.debug(
            "api_only_lead_get_by_phone",
            phone=phone
        )

        # TODO: Implement:
        # cache_key = f"leadrat:lead:phone:{phone}"
        # cached = await redis.get(cache_key)
        # if cached: return json.loads(cached)
        #
        # response = await leadrat_client.search_leads(phone=phone)
        # await redis.setex(cache_key, 60, json.dumps(response))
        # return response

        return None

    async def get_lead_by_id(
        self, leadrat_lead_id: str
    ) -> Optional[dict]:
        """Get lead from Leadrat API (with cache)."""
        logger.debug(
            "api_only_lead_get_by_id",
            leadrat_lead_id=leadrat_lead_id
        )

        # TODO: Implement:
        # cache_key = f"leadrat:lead:{leadrat_lead_id}"
        # cached = await redis.get(cache_key)
        # if cached: return json.loads(cached)
        #
        # response = await leadrat_client.get_lead(leadrat_lead_id)
        # await redis.setex(cache_key, 60, json.dumps(response))
        # return response

        return None

    async def update_lead_status(
        self, leadrat_lead_id: str, status_id: str
    ) -> bool:
        """Update lead status in Leadrat API."""
        logger.debug(
            "api_only_lead_update_status",
            leadrat_lead_id=leadrat_lead_id
        )

        # TODO: Implement:
        # PUT to Leadrat /leads/{id}
        # Invalidate Redis cache
        # Return True if successful

        return True


class DbDirectLeadRepository(BaseLeadRepository):
    """
    MODE: db_direct (FUTURE - not implemented yet)
    - Connect directly to Leadrat PostgreSQL
    - Query lead data via SQL
    - No API latency — fastest possible
    - Requires Leadrat to grant DB access

    Best for: High-performance when Leadrat enables direct DB
    """

    async def create_or_update_lead(
        self, lead_data: dict, tenant_id: str
    ) -> dict:
        """Create/update lead via direct DB connection."""
        raise NotImplementedError(
            "db_direct mode not yet implemented. "
            "Set DATA_STORAGE_MODE=hybrid or api_only"
        )

    async def get_lead_by_phone(
        self, phone: str, tenant_id: str
    ) -> Optional[dict]:
        """Get lead via direct DB connection."""
        raise NotImplementedError(
            "db_direct mode not yet implemented. "
            "Set DATA_STORAGE_MODE=hybrid or api_only"
        )

    async def get_lead_by_id(
        self, leadrat_lead_id: str
    ) -> Optional[dict]:
        """Get lead via direct DB connection."""
        raise NotImplementedError(
            "db_direct mode not yet implemented. "
            "Set DATA_STORAGE_MODE=hybrid or api_only"
        )

    async def update_lead_status(
        self, leadrat_lead_id: str, status_id: str
    ) -> bool:
        """Update lead status via direct DB connection."""
        raise NotImplementedError(
            "db_direct mode not yet implemented. "
            "Set DATA_STORAGE_MODE=hybrid or api_only"
        )
