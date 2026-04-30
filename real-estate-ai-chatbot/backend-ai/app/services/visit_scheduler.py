"""Site visit scheduling and reminder management."""

from datetime import datetime
import httpx

from app.config import settings
from app.utils.logger import get_logger
from app.utils.exceptions import TimeoutException

logger = get_logger(__name__)


async def schedule_visit(
    tenant_id: str,
    lead_id: str,
    project_id: str,
    visit_date: str,
    visitor_name: str,
    whatsapp_number: str,
) -> dict:
    """
    Schedule a site visit through Spring Boot backend.

    Args:
        tenant_id: Tenant ID
        lead_id: Lead ID from Leadrat
        project_id: Project ID
        visit_date: Visit date (ISO format: YYYY-MM-DDTHH:MM:SS)
        visitor_name: Name of visitor
        whatsapp_number: WhatsApp number for reminders

    Returns:
        dict: Visit details with visit_id and status

    Raises:
        TimeoutException: If scheduling times out
    """
    logger.debug(
        "visit_schedule_start",
        lead_id=lead_id,
        project_id=project_id,
        visit_date=visit_date,
        tenant_id=tenant_id,
    )

    try:
        payload = {
            "lead_id": lead_id,
            "project_id": project_id,
            "scheduled_at": visit_date,
            "visitor_name": visitor_name,
            "whatsapp_number": whatsapp_number,
            "status": "scheduled",
        }

        async with httpx.AsyncClient(timeout=settings.spring_boot_timeout_seconds) as client:
            response = await client.post(
                f"{settings.spring_boot_url}/api/v1/site-visits",
                json=payload,
                headers={"Authorization": "Bearer"},  # Add JWT token here
            )

        response.raise_for_status()
        visit = response.json().get("data", {})

        logger.info(
            "visit_scheduled",
            visit_id=visit.get("id"),
            lead_id=lead_id,
            project_id=project_id,
            tenant_id=tenant_id,
        )

        return {
            "visit_id": visit.get("id"),
            "status": "scheduled",
            "visit_date": visit_date,
            "ics_url": f"/api/v1/visits/{visit.get('id')}/ics",
        }

    except httpx.TimeoutException as e:
        logger.error(
            "visit_schedule_timeout",
            lead_id=lead_id,
            timeout=settings.spring_boot_timeout_seconds,
        )
        raise TimeoutException(f"Visit scheduling timed out after {settings.spring_boot_timeout_seconds}s")
    except httpx.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        logger.error(
            "visit_schedule_http_error",
            lead_id=lead_id,
            status_code=status_code,
            error=str(e),
        )
        raise Exception(f"Failed to schedule visit: {str(e)}")
    except Exception as e:
        logger.error(
            "visit_schedule_error",
            lead_id=lead_id,
            error=str(e),
            exc_info=True,
        )
        raise
