"""Project/builder data retrieval from Leadrat API with caching."""

import httpx

from app.config import settings
from app.cache.redis_client import redis_client
from app.utils.logger import get_logger
from app.utils.exceptions import LeadratException
from app.services.leadrat_auth import get_leadrat_token

logger = get_logger(__name__)


async def get_projects(tenant_id: str) -> list:
    """
    Get all projects for tenant with Redis caching (5-min TTL).

    Args:
        tenant_id: Tenant ID for multi-tenant support

    Returns:
        list: All available projects

    Raises:
        LeadratException: If retrieval fails
    """
    cache_key = f"{tenant_id}:projects"
    logger.debug("leadrat_projects_request", tenant_id=tenant_id)

    try:
        # Check cache first
        cached_projects = await redis_client.cache_get(cache_key)
        if cached_projects:
            logger.info(
                "leadrat_projects_cache_hit",
                tenant_id=tenant_id,
                count=len(cached_projects),
            )
            return cached_projects

        logger.info("leadrat_projects_fetch_start", tenant_id=tenant_id)

        token = await get_leadrat_token(tenant_id)

        async with httpx.AsyncClient(timeout=settings.leadrat_request_timeout) as client:
            response = await client.get(
                f"{settings.leadrat_base_url}/project/all",
                headers={"Authorization": f"Bearer {token}"},
            )

        response.raise_for_status()
        data = response.json()
        projects = data.get("projects", [])

        # Cache for 5 minutes
        await redis_client.cache_set(cache_key, projects, ttl=settings.property_cache_ttl)

        logger.info(
            "leadrat_projects_fetched",
            tenant_id=tenant_id,
            count=len(projects),
        )
        return projects

    except httpx.TimeoutException as e:
        logger.error(
            "leadrat_projects_timeout",
            tenant_id=tenant_id,
            timeout=settings.leadrat_request_timeout,
        )
        raise LeadratException(
            f"Leadrat project API timeout after {settings.leadrat_request_timeout}s",
            endpoint="/project/all"
        )
    except httpx.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        logger.error(
            "leadrat_projects_http_error",
            tenant_id=tenant_id,
            status_code=status_code,
            error=str(e),
        )
        raise LeadratException(f"Failed to fetch projects: {str(e)}", endpoint="/project/all")
    except Exception as e:
        logger.error("leadrat_projects_error", tenant_id=tenant_id, error=str(e), exc_info=True)
        raise LeadratException(str(e), endpoint="/project/all")


async def get_project(tenant_id: str, project_id: str) -> dict:
    """
    Get specific project details.

    Args:
        tenant_id: Tenant ID
        project_id: Project ID

    Returns:
        dict: Project details

    Raises:
        LeadratException: If retrieval fails
    """
    logger.debug("leadrat_project_get", project_id=project_id, tenant_id=tenant_id)

    try:
        token = await get_leadrat_token(tenant_id)

        async with httpx.AsyncClient(timeout=settings.leadrat_request_timeout) as client:
            response = await client.get(
                f"{settings.leadrat_base_url}/project/{project_id}",
                headers={"Authorization": f"Bearer {token}"},
            )

        response.raise_for_status()
        project = response.json()

        logger.info("leadrat_project_retrieved", project_id=project_id, tenant_id=tenant_id)
        return project

    except httpx.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        logger.error(
            "leadrat_project_get_failed",
            project_id=project_id,
            status_code=status_code,
            error=str(e),
        )
        raise LeadratException(f"Failed to get project: {str(e)}", endpoint=f"/project/{project_id}")
    except Exception as e:
        logger.error(
            "leadrat_project_get_error",
            project_id=project_id,
            error=str(e),
            exc_info=True,
        )
        raise LeadratException(str(e), endpoint=f"/project/{project_id}")
