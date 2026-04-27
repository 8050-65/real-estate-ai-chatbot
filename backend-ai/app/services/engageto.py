"""Engageto WhatsApp Business API integration for sending messages."""

from typing import Optional

import httpx

from app.config import settings
from app.utils.logger import get_logger
from app.utils.exceptions import EngagetoException

logger = get_logger(__name__)


async def send_whatsapp_message(
    whatsapp_number: str,
    message_text: str,
    media_url: Optional[str] = None,
    quick_replies: Optional[list] = None,
) -> dict:
    """
    Send WhatsApp text message via Engageto Business API.

    Args:
        whatsapp_number: Recipient WhatsApp number (format: 1234567890)
        message_text: Message text (max 1000 characters for WhatsApp)
        media_url: Optional media URL (image, document, etc.)
        quick_replies: Optional list of quick reply buttons

    Returns:
        dict: Engageto response with message_id and status

    Raises:
        EngagetoException: If message sending fails
    """
    logger.debug(
        "engageto_send_start",
        whatsapp_number=whatsapp_number,
        has_media=bool(media_url),
        has_quick_replies=bool(quick_replies),
    )

    try:
        # Build message payload
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": whatsapp_number,
            "type": "text",
            "text": {
                "preview_url": True,
                "body": message_text,
            },
        }

        # Add quick replies if provided
        if quick_replies and len(quick_replies) > 0:
            payload["type"] = "interactive"
            payload["interactive"] = {
                "type": "button",
                "body": {
                    "text": message_text,
                },
                "action": {
                    "buttons": [
                        {
                            "type": "reply",
                            "reply": {
                                "id": qr.get("id", qr.get("title", f"btn_{i}")),
                                "title": qr.get("title", ""),
                            },
                        }
                        for i, qr in enumerate(quick_replies[:3])  # Max 3 buttons
                    ]
                },
            }

        logger.debug("engageto_payload_ready", whatsapp_number=whatsapp_number)

        # Send to Engageto API
        async with httpx.AsyncClient(timeout=settings.engageto_request_timeout) as client:
            response = await client.post(
                f"{settings.engageto_api_base_url}/messages",
                json=payload,
                headers={"Authorization": f"Bearer {settings.engageto_token}"},
            )

        response.raise_for_status()
        result = response.json()

        # Extract message ID from response
        message_id = None
        if "messages" in result and len(result["messages"]) > 0:
            message_id = result["messages"][0].get("id")

        logger.info(
            "engageto_message_sent",
            whatsapp_number=whatsapp_number,
            message_id=message_id,
            status="sent",
        )

        return {
            "status": "sent",
            "message_id": message_id,
            "whatsapp_number": whatsapp_number,
            "response": result,
        }

    except httpx.TimeoutException as e:
        logger.error(
            "engageto_timeout",
            whatsapp_number=whatsapp_number,
            timeout=settings.engageto_request_timeout,
        )
        raise EngagetoException(
            f"Engageto API timeout after {settings.engageto_request_timeout}s"
        )
    except httpx.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        try:
            error_data = e.response.json() if e.response else {}
        except Exception:
            error_data = {}

        logger.error(
            "engageto_http_error",
            whatsapp_number=whatsapp_number,
            status_code=status_code,
            error=str(e),
            error_data=error_data,
        )
        raise EngagetoException(f"Failed to send message: {str(e)}")
    except Exception as e:
        logger.error(
            "engageto_error",
            whatsapp_number=whatsapp_number,
            error=str(e),
            exc_info=True,
        )
        raise EngagetoException(str(e))
