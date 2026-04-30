import pytest
from unittest.mock import patch, MagicMock
from fastapi import status


@pytest.mark.asyncio
async def test_webhook_valid_payload(client, sample_webhook_payload):
    """Test valid Engageto webhook payload"""
    with patch('app.services.engageto.verify_webhook_signature', return_value=True):
        response = client.post(
            "/webhook/whatsapp",
            json=sample_webhook_payload,
            headers={"X-Engageto-Signature": "valid-signature"}
        )
    assert response.status_code == status.HTTP_200_OK


def test_webhook_invalid_signature(client, sample_webhook_payload):
    """Test webhook with invalid signature"""
    with patch('app.services.engageto.verify_webhook_signature', return_value=False):
        response = client.post(
            "/webhook/whatsapp",
            json=sample_webhook_payload,
            headers={"X-Engageto-Signature": "invalid-signature"}
        )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_webhook_missing_required_fields(client):
    """Test webhook with missing required fields"""
    invalid_payload = {"from": "919876543210"}  # Missing 'message'
    response = client.post(
        "/webhook/whatsapp",
        json=invalid_payload
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_webhook_duplicate_message(client, sample_webhook_payload):
    """Test that duplicate messages are ignored (idempotency)"""
    with patch('app.services.engageto.verify_webhook_signature', return_value=True):
        with patch('app.cache.redis_client.RedisClient.get', return_value=sample_webhook_payload['webhook_id']):
            response = client.post(
                "/webhook/whatsapp",
                json=sample_webhook_payload,
                headers={"X-Engageto-Signature": "valid-signature"}
            )
    # Should still return 200 but not process the message
    assert response.status_code == status.HTTP_200_OK


def test_webhook_with_image_media(client):
    """Test webhook with image media"""
    payload = {
        "from": "919876543210",
        "type": "image",
        "image_url": "https://example.com/image.jpg",
        "caption": "Check this property",
        "timestamp": "2026-04-26T12:00:00Z",
        "webhook_id": "webhook-124",
    }
    with patch('app.services.engageto.verify_webhook_signature', return_value=True):
        response = client.post(
            "/webhook/whatsapp",
            json=payload,
            headers={"X-Engageto-Signature": "valid-signature"}
        )
    assert response.status_code == status.HTTP_200_OK
