"""Lead management via Leadrat API (create, update, retrieve)."""

import httpx

from app.config import settings
from app.utils.logger import get_logger
from app.utils.exceptions import LeadratException
from app.services.leadrat_auth import get_leadrat_token

logger = get_logger(__name__)


async def create_or_update_lead(
    tenant_id: str,
    whatsapp_number: str,
    name: str,
    data: dict = None,
) -> dict:
    """
    Create or update lead in Leadrat CRM.

    Args:
        tenant_id: Tenant ID for multi-tenant support
        whatsapp_number: WhatsApp number (unique identifier)
        name: Customer name
        data: Additional lead data (bhk, budget, project_id, etc.)

    Returns:
        dict: Created/updated lead with lead_id and all fields

    Raises:
        LeadratException: If creation/update fails
    """
    if data is None:
        data = {}

    logger.debug(
        "leadrat_lead_create_or_update",
        whatsapp_number=whatsapp_number,
        tenant_id=tenant_id,
    )

    try:
        token = await get_leadrat_token(tenant_id)

        payload = {
            "phone": whatsapp_number,
            "name": name,
            **data,
        }

        async with httpx.AsyncClient(timeout=settings.leadrat_request_timeout) as client:
            response = await client.post(
                f"{settings.leadrat_base_url}/lead",
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
            )

        response.raise_for_status()
        lead = response.json()

        logger.info(
            "leadrat_lead_created_or_updated",
            whatsapp_number=whatsapp_number,
            lead_id=lead.get("id"),
            tenant_id=tenant_id,
        )
        return lead

    except httpx.TimeoutException as e:
        logger.error(
            "leadrat_lead_timeout",
            whatsapp_number=whatsapp_number,
            timeout=settings.leadrat_request_timeout,
        )
        raise LeadratException(
            f"Leadrat lead API timeout after {settings.leadrat_request_timeout}s",
            endpoint="/lead"
        )
    except httpx.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        logger.error(
            "leadrat_lead_http_error",
            whatsapp_number=whatsapp_number,
            status_code=status_code,
            error=str(e),
        )
        raise LeadratException(f"Failed to create/update lead: {str(e)}", endpoint="/lead")
    except Exception as e:
        logger.error(
            "leadrat_lead_error",
            whatsapp_number=whatsapp_number,
            error=str(e),
            exc_info=True,
        )
        raise LeadratException(str(e), endpoint="/lead")


async def get_lead(tenant_id: str, lead_id: str) -> dict:
    """
    Get lead details from Leadrat.

    Args:
        tenant_id: Tenant ID
        lead_id: Lead ID from Leadrat

    Returns:
        dict: Lead details

    Raises:
        LeadratException: If retrieval fails
    """
    logger.debug("leadrat_lead_get", lead_id=lead_id, tenant_id=tenant_id)

    try:
        token = await get_leadrat_token(tenant_id)

        async with httpx.AsyncClient(timeout=settings.leadrat_request_timeout) as client:
            response = await client.get(
                f"{settings.leadrat_base_url}/lead/{lead_id}",
                headers={"Authorization": f"Bearer {token}"},
            )

        response.raise_for_status()
        lead = response.json()

        logger.info("leadrat_lead_retrieved", lead_id=lead_id, tenant_id=tenant_id)
        return lead

    except httpx.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        logger.error(
            "leadrat_lead_get_failed",
            lead_id=lead_id,
            status_code=status_code,
            error=str(e),
        )
        raise LeadratException(f"Failed to get lead: {str(e)}", endpoint=f"/lead/{lead_id}")
    except Exception as e:
        logger.error("leadrat_lead_get_error", lead_id=lead_id, error=str(e), exc_info=True)
        raise LeadratException(str(e), endpoint=f"/lead/{lead_id}")
