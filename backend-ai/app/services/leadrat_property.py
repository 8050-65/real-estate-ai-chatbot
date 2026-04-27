"""Property/unit search with Leadrat API and Redis caching (5-min TTL)."""

import hashlib
import httpx

from app.config import settings
from app.cache.redis_client import redis_client
from app.utils.logger import get_logger
from app.utils.exceptions import LeadratException
from app.services.leadrat_auth import get_leadrat_token

logger = get_logger(__name__)

# Status values that indicate unit is NOT available
UNAVAILABLE_STATUSES = {"Sold", "Blocked", "Hold", "Under Construction", "Restricted"}


async def search_properties(
    tenant_id: str,
    project_id: str = None,
    bhk: str = None,
    price_min: float = None,
    price_max: float = None,
) -> list:
    """
    Search for available properties with Redis caching (5-min TTL).

    CRITICAL: Filters out Sold, Blocked, Hold, and other unavailable units.
    Only returns properties with available status.

    Args:
        tenant_id: Tenant ID for multi-tenant support
        project_id: Optional project filter
        bhk: Optional BHK preference (1, 2, 3, 4, etc.)
        price_min: Optional minimum price filter
        price_max: Optional maximum price filter

    Returns:
        list: Available properties only (filtered)

    Raises:
        LeadratException: If search fails
    """
    # Create cache key from query parameters
    query_hash = hashlib.md5(
        f"{project_id}:{bhk}:{price_min}:{price_max}".encode()
    ).hexdigest()
    cache_key = f"{tenant_id}:properties:{query_hash}"

    logger.debug(
        "leadrat_property_search",
        project_id=project_id,
        bhk=bhk,
        cache_key=cache_key,
    )

    try:
        # Check Redis cache first (5-min TTL)
        cached_properties = await redis_client.cache_get(cache_key)
        if cached_properties:
            logger.info(
                "leadrat_property_cache_hit",
                project_id=project_id,
                count=len(cached_properties),
                cache_key=cache_key,
            )
            return cached_properties

        logger.info("leadrat_property_fetch_start", project_id=project_id, bhk=bhk)

        # Fetch from Leadrat API
        token = await get_leadrat_token(tenant_id)

        params = {}
        if project_id:
            params["project_id"] = project_id
        if bhk:
            params["bhk"] = bhk

        async with httpx.AsyncClient(timeout=settings.leadrat_request_timeout) as client:
            response = await client.get(
                f"{settings.leadrat_base_url}/property",
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )

        response.raise_for_status()
        data = response.json()
        all_properties = data.get("properties", [])

        # CRITICAL: Filter out unavailable properties (Sold, Blocked, Hold, etc.)
        available_properties = []
        for prop in all_properties:
            status = prop.get("status", "")
            if status not in UNAVAILABLE_STATUSES:
                # Optional: Apply price filters
                if price_min and prop.get("price", 0) < price_min:
                    continue
                if price_max and prop.get("price", 0) > price_max:
                    continue
                available_properties.append(prop)

        # Cache for 5 minutes
        await redis_client.cache_set(cache_key, available_properties, ttl=settings.property_cache_ttl)

        logger.info(
            "leadrat_property_fetched",
            project_id=project_id,
            total_count=len(all_properties),
            available_count=len(available_properties),
            filtered_out=len(all_properties) - len(available_properties),
            cache_key=cache_key,
        )

        return available_properties

    except httpx.TimeoutException as e:
        logger.error(
            "leadrat_property_timeout",
            project_id=project_id,
            timeout=settings.leadrat_request_timeout,
        )
        raise LeadratException(
            f"Leadrat property search timeout after {settings.leadrat_request_timeout}s",
            endpoint="/property"
        )
    except httpx.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        logger.error(
            "leadrat_property_http_error",
            project_id=project_id,
            status_code=status_code,
            error=str(e),
        )
        raise LeadratException(f"Failed to search properties: {str(e)}", endpoint="/property")
    except Exception as e:
        logger.error(
            "leadrat_property_error",
            project_id=project_id,
            error=str(e),
            exc_info=True,
        )
        raise LeadratException(str(e), endpoint="/property")
