import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import asyncio


@pytest.mark.asyncio
async def test_orchestrator_message_to_response_flow(sample_session):
    """Test complete message → intent → data → response flow"""
    from app.agents.orchestrator import process_message

    message = "What projects do you have?"

    mock_intent = {
        "intent": "project_discovery",
        "confidence": 0.95,
        "entities": {}
    }

    mock_projects = [
        {"id": "proj-1", "name": "Project A", "location": "Delhi"},
        {"id": "proj-2", "name": "Project B", "location": "Bangalore"},
    ]

    with patch('app.agents.intent_router.classify_intent', return_value=mock_intent):
        with patch('app.services.leadrat_project.get_projects', return_value=mock_projects):
            result = await process_message(
                whatsapp_number="919876543210",
                message=message,
                tenant_id="tenant-123"
            )

    assert result["response_type"] == "text"
    assert "Project" in result["response_text"]


@pytest.mark.asyncio
async def test_orchestrator_site_visit_booking_flow():
    """Test multi-step site visit booking flow"""
    from app.agents.orchestrator import process_message

    # Step 1: User requests site visit
    message1 = "I'd like to schedule a site visit"

    mock_intent1 = {
        "intent": "site_visit_booking",
        "confidence": 0.94,
        "entities": {}
    }

    with patch('app.agents.intent_router.classify_intent', return_value=mock_intent1):
        result1 = await process_message(
            whatsapp_number="919876543210",
            message=message1,
            tenant_id="tenant-123"
        )

    assert "visit" in result1["response_text"].lower()


@pytest.mark.asyncio
async def test_orchestrator_handoff_trigger():
    """Test human handoff trigger"""
    from app.agents.orchestrator import process_message

    message = "This is frustrating! I need to speak to someone now!"

    mock_intent = {
        "intent": "human_handoff_request",
        "confidence": 0.97,
        "entities": {}
    }

    with patch('app.agents.intent_router.classify_intent', return_value=mock_intent):
        with patch('app.services.leadrat_leads.notify_rm', return_value=True):
            result = await process_message(
                whatsapp_number="919876543210",
                message=message,
                tenant_id="tenant-123"
            )

    assert result.get("should_handoff") == True


@pytest.mark.asyncio
async def test_orchestrator_fallback_on_ollama_failure():
    """Test fallback to rule-based response when Ollama fails"""
    from app.agents.orchestrator import process_message

    message = "Tell me about properties"

    with patch('app.agents.intent_router.classify_intent', side_effect=Exception("Ollama unavailable")):
        result = await process_message(
            whatsapp_number="919876543210",
            message=message,
            tenant_id="tenant-123"
        )

    # Should still return a response (fallback)
    assert result["response_text"] is not None
    assert "fallback" in result.get("response_type", "").lower() or result["response_text"] != ""


@pytest.mark.asyncio
async def test_orchestrator_session_persistence():
    """Test that session data persists across messages"""
    from app.agents.orchestrator import process_message

    whatsapp_number = "919876543210"
    tenant_id = "tenant-123"

    # First message
    message1 = "My name is John"

    with patch('app.agents.intent_router.classify_intent') as mock_classify:
        mock_classify.return_value = {
            "intent": "greeting",
            "confidence": 0.9,
            "entities": {}
        }
        with patch('app.cache.redis_client.RedisClient.set') as mock_redis_set:
            await process_message(
                whatsapp_number=whatsapp_number,
                message=message1,
                tenant_id=tenant_id
            )

    # Session should be saved
    assert mock_redis_set.called


@pytest.mark.asyncio
async def test_orchestrator_with_redis_cache():
    """Test caching behavior in orchestrator"""
    from app.agents.orchestrator import process_message

    message = "Show me properties"

    mock_cached_properties = [
        {"id": "1", "bhk": "2", "price": 5000000}
    ]

    with patch('app.agents.intent_router.classify_intent') as mock_classify:
        mock_classify.return_value = {
            "intent": "unit_availability",
            "confidence": 0.92,
            "entities": {}
        }
        with patch('app.cache.redis_client.RedisClient.get', return_value=mock_cached_properties):
            result = await process_message(
                whatsapp_number="919876543210",
                message=message,
                tenant_id="tenant-123"
            )

    # Cache should be used
    assert result is not None
