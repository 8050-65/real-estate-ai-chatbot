"""Async Redis client with tenant-aware key prefixing and session management."""

import json
from typing import Any, Optional

import redis.asyncio as redis

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Global Redis connection pool
_redis_pool: Optional[redis.ConnectionPool] = None


async def get_redis_client() -> redis.Redis:
    """
    Get or create async Redis client.

    Reuses connection pool for efficiency.

    Returns:
        redis.Redis: Async Redis client instance
    """
    global _redis_pool

    if _redis_pool is None:
        logger.debug("redis_pool_init", url=settings.redis_url)
        _redis_pool = redis.ConnectionPool.from_url(
            settings.redis_url,
            db=settings.redis_db,
            decode_responses=True,
            max_connections=50,
        )

    return redis.Redis(connection_pool=_redis_pool)


class RedisClient:
    """Async Redis client wrapper with tenant-aware operations."""

    async def cache_get(self, key: str) -> Any:
        """
        Get value from cache.

        Args:
            key: Cache key (should include tenant prefix)

        Returns:
            Any: Cached value (parsed if JSON), or None if not found
        """
        try:
            client = await get_redis_client()
            value = await client.get(key)

            if value is None:
                return None

            # Try to parse as JSON if it looks like JSON
            if isinstance(value, str) and (value.startswith("{") or value.startswith("[")):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return value

        except Exception as e:
            logger.error("redis_get_failed", key=key, error=str(e), exc_info=True)
            return None

    async def cache_set(self, key: str, value: Any, ttl: int = 300) -> None:
        """
        Set value in cache with TTL.

        Args:
            key: Cache key (should include tenant prefix)
            value: Value to cache
            ttl: Time-to-live in seconds (default: 300 = 5 minutes)
        """
        try:
            client = await get_redis_client()

            # Serialize to JSON if dict or list
            if isinstance(value, (dict, list)):
                json_value = json.dumps(value)
            else:
                json_value = str(value)

            await client.setex(key, ttl, json_value)
            logger.debug("redis_set_success", key=key, ttl=ttl)

        except Exception as e:
            logger.error("redis_set_failed", key=key, error=str(e), exc_info=True)

    async def cache_delete(self, key: str) -> None:
        """
        Delete key from cache.

        Args:
            key: Cache key to delete
        """
        try:
            client = await get_redis_client()
            await client.delete(key)
            logger.debug("redis_delete_success", key=key)

        except Exception as e:
            logger.error("redis_delete_failed", key=key, error=str(e), exc_info=True)

    async def get_session(self, whatsapp_number: str, tenant_id: str) -> dict:
        """
        Get WhatsApp session from cache.

        Key format: {tenant_id}:session:{whatsapp_number}

        Args:
            whatsapp_number: WhatsApp number (without + prefix)
            tenant_id: Tenant ID

        Returns:
            dict: Session data or empty dict if not found
        """
        key = f"{tenant_id}:session:{whatsapp_number}"
        logger.debug("redis_session_get", whatsapp_number=whatsapp_number, tenant_id=tenant_id)

        session_data = await self.cache_get(key)
        return session_data if isinstance(session_data, dict) else {}

    async def save_session(
        self,
        whatsapp_number: str,
        tenant_id: str,
        data: dict,
    ) -> None:
        """
        Save WhatsApp session to cache (24-hour TTL).

        Key format: {tenant_id}:session:{whatsapp_number}

        Args:
            whatsapp_number: WhatsApp number
            tenant_id: Tenant ID
            data: Session data to save
        """
        key = f"{tenant_id}:session:{whatsapp_number}"
        logger.debug(
            "redis_session_save",
            whatsapp_number=whatsapp_number,
            tenant_id=tenant_id,
            ttl=settings.session_cache_ttl,
        )

        await self.cache_set(key, data, ttl=settings.session_cache_ttl)

    async def delete_session(self, whatsapp_number: str, tenant_id: str) -> None:
        """
        Delete WhatsApp session from cache.

        Args:
            whatsapp_number: WhatsApp number
            tenant_id: Tenant ID
        """
        key = f"{tenant_id}:session:{whatsapp_number}"
        await self.cache_delete(key)


# Global singleton instance
redis_client = RedisClient()
