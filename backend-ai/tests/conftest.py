import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch


@pytest.fixture
def client():
    """FastAPI test client"""
    from app.main import app
    return TestClient(app)


@pytest.fixture
def mock_leadrat_client():
    """Mock Leadrat API client"""
    with patch('app.services.leadrat_auth.LeadratAuthService') as mock:
        yield mock


@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    with patch('app.cache.redis_client.RedisClient') as mock:
        yield mock


@pytest.fixture
def sample_webhook_payload():
    """Sample Engageto webhook payload"""
    return {
        "from": "919876543210",
        "message": "Hi, I'm interested in your properties",
        "type": "text",
        "timestamp": "2026-04-26T12:00:00Z",
        "webhook_id": "webhook-123",
    }


@pytest.fixture
def sample_session():
    """Sample WhatsApp session"""
    return {
        "whatsapp_number": "+919876543210",
        "tenant_id": "tenant-123",
        "lead_id": "lead-456",
        "conversation_history": [],
        "current_intent": None,
        "created_at": "2026-04-26T10:00:00Z",
        "last_active": "2026-04-26T12:00:00Z",
    }
