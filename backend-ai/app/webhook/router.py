"""
Engageto WhatsApp webhook router.

Handles incoming WhatsApp messages from Engageto Business API
and routes them through the LangGraph orchestrator.
"""

import hashlib
import hmac
from typing import Any

from fastapi import APIRouter, Request, HTTPException, status

from app.config import settings
from app.utils.logger import get_logger
from app.webhook.models import WebhookRequest, WebhookResponse
from app.agents.orchestrator import get_orchestrator

logger = get_logger(__name__)
webhook_router = APIRouter()


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """
    Verify Engageto webhook signature for security.

    Args:
        body: Raw request body
        signature: X-Hub-Signature header value

    Returns:
        bool: True if signature is valid
    """
    expected_signature = hmac.new(
        settings.engageto_webhook_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)


@webhook_router.post("/whatsapp")
async def whatsapp_webhook(request: Request) -> WebhookResponse:
    """
    Engageto WhatsApp webhook endpoint.

    Receives incoming WhatsApp messages and processes them through
    the LangGraph orchestrator.

    Args:
        request: HTTP request with webhook payload

    Returns:
        WebhookResponse: Acknowledgment response

    Raises:
        HTTPException: If signature verification fails or processing fails
    """
    logger.debug("webhook_received", path="/webhook/whatsapp")

    # Verify webhook signature
    signature = request.headers.get("X-Hub-Signature")
    if not signature:
        logger.warning("webhook_missing_signature")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Hub-Signature header",
        )

    # Get raw body for signature verification
    body = await request.body()

    if not verify_webhook_signature(body, signature):
        logger.warning("webhook_invalid_signature")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        )

    # Parse JSON payload
    try:
        payload = await request.json()
        webhook_request = WebhookRequest(**payload)
        logger.debug("webhook_parsed", entries=len(webhook_request.entry))
    except Exception as e:
        logger.error("webhook_parse_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook payload",
        )

    # Process webhook entries
    try:
        await process_webhook_entries(webhook_request.entry)
    except Exception as e:
        logger.error("webhook_processing_failed", error=str(e), exc_info=True)
        # Return 200 OK even on error to prevent Engageto retries
        # Actual error details logged for investigation

    return WebhookResponse(status="received")


async def process_webhook_entries(entries: list[dict[str, Any]]) -> None:
    """
    Process webhook entries from Engageto.

    Args:
        entries: List of webhook entries

    Raises:
        Exception: If processing fails
    """
    for entry in entries:
        if "changes" not in entry:
            logger.debug("webhook_entry_no_changes", entry_id=entry.get("id"))
            continue

        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})

            # Handle incoming messages
            messages = value.get("messages", [])
            for message in messages:
                await process_incoming_message(message, value)

            # Handle status updates (delivery, read receipts)
            statuses = value.get("statuses", [])
            for status_update in statuses:
                await process_status_update(status_update)


async def process_incoming_message(message: dict, context: dict) -> None:
    """
    Process incoming WhatsApp message through orchestrator.

    Args:
        message: Message data from webhook
        context: Context including metadata and phone_id

    Raises:
        Exception: If orchestrator processing fails
    """
    try:
        whatsapp_number = message.get("from")
        message_id = message.get("id")
        tenant_id = settings.leadrat_tenant  # From config, could be enhanced for multi-tenant

        logger.info(
            "message_received",
            whatsapp_number=whatsapp_number,
            message_id=message_id,
            tenant_id=tenant_id,
        )

        # Extract message content
        message_type = message.get("type", "text")
        text_body = ""
        media_url = None

        if message_type == "text":
            text_body = message.get("text", {}).get("body", "")
        elif message_type == "image":
            media = message.get("image", {})
            media_url = media.get("link") or media.get("url")
        elif message_type == "document":
            media = message.get("document", {})
            media_url = media.get("link") or media.get("url")
        elif message_type == "audio":
            media = message.get("audio", {})
            media_url = media.get("link") or media.get("url")

        if not text_body and not media_url:
            logger.warning(
                "message_empty_content",
                whatsapp_number=whatsapp_number,
                message_type=message_type,
            )
            return

        # Prepare state for orchestrator
        state = {
            "whatsapp_number": whatsapp_number,
            "tenant_id": tenant_id,
            "incoming_message": text_body,
            "message_type": message_type,
            "message_id": message_id,
            "session": {},
            "lead_id": None,
            "intent": "",
            "confidence": 0.0,
            "extracted_entities": {},
            "leadrat_token": "",
            "property_results": [],
            "project_results": [],
            "lead_data": {},
            "rag_context": "",
            "response_text": "",
            "response_type": "text",
            "quick_replies": [],
            "media_to_send": {},
            "should_handoff": False,
            "handoff_reason": "",
            "conversation_summary": "",
            "error": None,
        }

        # Process through orchestrator
        orchestrator = get_orchestrator()
        result = await orchestrator.invoke(state)

        logger.info(
            "message_processed",
            whatsapp_number=whatsapp_number,
            intent=result.get("intent", "unknown"),
            response_type=result.get("response_type", "text"),
        )

    except Exception as e:
        logger.error(
            "message_processing_error",
            whatsapp_number=message.get("from"),
            error=str(e),
            exc_info=True,
        )
        raise


async def process_status_update(status_update: dict) -> None:
    """
    Process WhatsApp message status update (delivery, read receipts).

    Args:
        status_update: Status update from webhook
    """
    try:
        message_id = status_update.get("id")
        message_status = status_update.get("status")
        whatsapp_number = status_update.get("recipient_id")

        logger.debug(
            "status_update_received",
            message_id=message_id,
            status=message_status,
            whatsapp_number=whatsapp_number,
        )

        # Status update can be stored in database for analytics
        # Future: Store delivery/read status in conversation_logs table

    except Exception as e:
        logger.error("status_update_processing_error", error=str(e), exc_info=True)


@webhook_router.get("/whatsapp")
async def whatsapp_webhook_verify(request: Request) -> dict:
    """
    Verify webhook endpoint for Engageto verification.

    Engageto sends a GET request with verify_token to verify the webhook.

    Query parameters:
        hub.mode: "subscribe"
        hub.verify_token: Token to verify
        hub.challenge: Challenge to return

    Returns:
        dict: Challenge response
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode != "subscribe":
        logger.warning("webhook_verify_invalid_mode", mode=mode)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid mode",
        )

    if token != settings.engageto_webhook_secret:
        logger.warning("webhook_verify_invalid_token")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid verify token",
        )

    logger.info("webhook_verified")
    return {"hub.challenge": challenge}
