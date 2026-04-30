"""Intent classification and entity extraction."""

import json
from langchain_core.language_models import BaseLLM
from typing import Optional

from app.utils.logger import get_logger
from app.agents.llm_factory import get_llm

logger = get_logger(__name__)


def llm_classify(message: str) -> dict:
    """
    Classify message intent using LLM (for testing/mocking).

    Args:
        message: User message to classify

    Returns:
        dict: Classification result with intent, confidence, entities
    """
    llm = get_llm()
    prompt = f"""Classify WhatsApp message intent and extract entities.
Message: {message}

Intent categories: project_discovery, unit_availability, pricing_inquiry, payment_plan,
amenities_query, rera_legal, site_visit_booking, document_request, offer_inquiry,
status_followup, human_handoff_request, out_of_scope

Entity types: location, bhk, budget_min, budget_max, project_name, visit_date

Return JSON: {{"intent": "...", "confidence": 0.0, "entities": {{}}}}"""

    try:
        response = llm.invoke(prompt)
        result = json.loads(response.content)
        logger.info("intent_classified", intent=result.get("intent"), confidence=result.get("confidence"))
        return result
    except Exception as e:
        logger.error("intent_classification_failed", error=str(e))
        return {"intent": "out_of_scope", "confidence": 0.0, "entities": {}}


async def classify_intent(message: str, llm: Optional[BaseLLM] = None, tenant_id: str = "dubait11") -> dict:
    """
    Classify message intent using LLM.

    Args:
        message: User message to classify
        llm: Language model instance from factory (optional, will use default)
        tenant_id: Tenant context

    Returns:
        dict: Classification result with intent, confidence, entities
    """
    # Call the mockable llm_classify function
    return llm_classify(message)
