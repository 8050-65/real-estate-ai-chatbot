import pytest
from unittest.mock import patch, MagicMock
import json


@pytest.mark.asyncio
async def test_classify_project_discovery_intent():
    """Test classifying project discovery intent"""
    from app.agents.intent_router import classify_intent

    message = "What projects do you have available?"

    mock_response = {
        "intent": "project_discovery",
        "confidence": 0.95,
        "entities": {
            "location": None,
            "bhk_type": None,
            "budget_min": None,
            "budget_max": None,
        }
    }

    with patch('app.agents.intent_router.llm_classify', return_value=mock_response):
        result = await classify_intent(message)

    assert result["intent"] == "project_discovery"
    assert result["confidence"] >= 0.9


@pytest.mark.asyncio
async def test_classify_pricing_inquiry():
    """Test classifying pricing inquiry"""
    from app.agents.intent_router import classify_intent

    message = "What's the price for a 3 BHK apartment?"

    mock_response = {
        "intent": "pricing_inquiry",
        "confidence": 0.92,
        "entities": {
            "bhk_type": "3 BHK",
            "budget_min": None,
            "budget_max": None,
        }
    }

    with patch('app.agents.intent_router.llm_classify', return_value=mock_response):
        result = await classify_intent(message)

    assert result["intent"] == "pricing_inquiry"


@pytest.mark.asyncio
async def test_classify_site_visit_booking():
    """Test classifying site visit booking intent"""
    from app.agents.intent_router import classify_intent

    message = "I'd like to schedule a site visit tomorrow at 2 PM"

    mock_response = {
        "intent": "site_visit_booking",
        "confidence": 0.94,
        "entities": {
            "visit_date": "tomorrow",
            "visit_time": "2 PM",
            "visitor_count": 1,
        }
    }

    with patch('app.agents.intent_router.llm_classify', return_value=mock_response):
        result = await classify_intent(message)

    assert result["intent"] == "site_visit_booking"


@pytest.mark.asyncio
async def test_extract_budget_entity():
    """Test extracting budget entity from message"""
    from app.agents.intent_router import classify_intent

    message = "Looking for something under 50 lakhs"

    mock_response = {
        "intent": "unit_availability",
        "confidence": 0.88,
        "entities": {
            "budget_max": 5000000,  # 50 lakhs in rupees
            "location": None,
        }
    }

    with patch('app.agents.intent_router.llm_classify', return_value=mock_response):
        result = await classify_intent(message)

    assert result["entities"]["budget_max"] == 5000000


@pytest.mark.asyncio
async def test_extract_bhk_entity():
    """Test extracting BHK type entity"""
    from app.agents.intent_router import classify_intent

    message = "Show me 2 BHK apartments in Bangalore"

    mock_response = {
        "intent": "unit_availability",
        "confidence": 0.91,
        "entities": {
            "bhk_type": "2 BHK",
            "location": "Bangalore",
        }
    }

    with patch('app.agents.intent_router.llm_classify', return_value=mock_response):
        result = await classify_intent(message)

    assert result["entities"]["bhk_type"] == "2 BHK"
    assert result["entities"]["location"] == "Bangalore"


@pytest.mark.asyncio
async def test_low_confidence_threshold():
    """Test handling low confidence predictions"""
    from app.agents.intent_router import classify_intent

    message = "Hmm, maybe, I don't know..."

    mock_response = {
        "intent": "out_of_scope",
        "confidence": 0.55,
        "entities": {}
    }

    with patch('app.agents.intent_router.llm_classify', return_value=mock_response):
        result = await classify_intent(message)

    # Low confidence should trigger escalation
    assert result["confidence"] < 0.7


@pytest.mark.asyncio
async def test_classify_human_handoff_request():
    """Test classifying human handoff request"""
    from app.agents.intent_router import classify_intent

    message = "I want to talk to a human agent"

    mock_response = {
        "intent": "human_handoff_request",
        "confidence": 0.98,
        "entities": {}
    }

    with patch('app.agents.intent_router.llm_classify', return_value=mock_response):
        result = await classify_intent(message)

    assert result["intent"] == "human_handoff_request"
