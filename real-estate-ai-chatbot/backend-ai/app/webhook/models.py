"""
Pydantic models for Engageto WhatsApp webhook payloads.

Validates incoming webhook messages from Engageto Business API.
"""

from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field


class WebhookMessage(BaseModel):
    """Engageto webhook message payload."""

    message_id: str = Field(..., alias="id")
    timestamp: datetime
    whatsapp_number: str = Field(..., alias="from")
    phone_id: str
    message_type: str = Field(default="text", alias="type")
    text_body: Optional[str] = Field(default=None, alias="text")
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    context: Optional[dict] = None

    class Config:
        """Pydantic config."""

        populate_by_name = True  # Accept both alias and field name


class WebhookStatus(BaseModel):
    """Engageto webhook status update (delivery, read receipts)."""

    message_id: str = Field(..., alias="id")
    timestamp: datetime
    whatsapp_number: str = Field(..., alias="to")
    status: str  # delivered, read, failed, sent
    error_code: Optional[int] = None
    error_message: Optional[str] = None

    class Config:
        """Pydantic config."""

        populate_by_name = True


class WebhookRequest(BaseModel):
    """Complete Engageto webhook request."""

    entry: list[dict[str, Any]]
    changes: Optional[list[dict[str, Any]]] = None

    class Config:
        """Pydantic config."""

        populate_by_name = True


class WebhookResponse(BaseModel):
    """Response to Engageto webhook (acknowledgment)."""

    status: str = "received"
    message_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "status": "received",
                "message_id": "msg-123",
                "timestamp": "2026-04-24T10:00:00",
            }
        }
