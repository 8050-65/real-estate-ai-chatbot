"""Leadrat API authentication with Redis token caching and auto-refresh."""

import httpx

from app.config import settings
from app.cache.redis_client import redis_client
from app.utils.logger import get_logger
from app.utils.exceptions import LeadratException

logger = get_logger(__name__)


async def get_leadrat_token(tenant_id: str) -> str:
    """
    Get Leadrat API token with Redis caching and auto-refresh.

    Token is cached in Redis with TTL = token_expiry - 60 seconds.
    Automatically refreshes before expiry to avoid API call overhead.

    Args:
        tenant_id: Tenant ID for multi-tenant support

    Returns:
        str: Bearer token for Leadrat API calls

    Raises:
        LeadratException: If token retrieval fails
    """
    cache_key = f"{tenant_id}:leadrat_token"
    logger.debug("leadrat_token_request", tenant_id=tenant_id, cache_key=cache_key)

    try:
        # Check Redis cache first
        cached_token = await redis_client.cache_get(cache_key)
        if cached_token:
            logger.debug("leadrat_token_cache_hit", tenant_id=tenant_id)
            return cached_token

        logger.info("leadrat_token_fetch_start", tenant_id=tenant_id)

        # Fetch new token from Leadrat auth endpoint
        async with httpx.AsyncClient(timeout=settings.leadrat_request_timeout) as client:
            response = await client.post(
                settings.leadrat_auth_url,
                json={
                    "apiKey": settings.leadrat_api_key,
                    "secretKey": settings.leadrat_secret_key,
                },
                headers={"tenant": settings.leadrat_tenant},
            )

        response.raise_for_status()
        data = response.json()

        # Extract token from response
        token = data.get("token") or data.get("access_token")
        if not token:
            logger.error("leadrat_token_missing_in_response", response=data)
            raise LeadratException("Token not found in Leadrat response", endpoint="/authentication/token")

        # Cache token with TTL = expiry - 60 seconds
        ttl = settings.leadrat_token_cache_ttl - 60
        await redis_client.cache_set(cache_key, token, ttl=ttl)

        logger.info("leadrat_token_fetched_and_cached", tenant_id=tenant_id, ttl=ttl)
        return token

    except httpx.TimeoutException as e:
        logger.error("leadrat_token_timeout", tenant_id=tenant_id, timeout=settings.leadrat_request_timeout)
        raise LeadratException(
            f"Leadrat auth timeout after {settings.leadrat_request_timeout}s",
            endpoint="/authentication/token"
        )
    except httpx.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        logger.error(
            "leadrat_token_http_error",
            tenant_id=tenant_id,
            status_code=status_code,
            error=str(e),
            exc_info=True
        )
        raise LeadratException(f"Leadrat auth failed: {str(e)}", endpoint="/authentication/token")
    except Exception as e:
        logger.error("leadrat_token_error", tenant_id=tenant_id, error=str(e), exc_info=True)
        raise LeadratException(str(e), endpoint="/authentication/token")
