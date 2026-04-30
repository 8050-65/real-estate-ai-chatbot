"""Intent classification and entity extraction."""

import json
from langchain_core.language_models import BaseLLM

from app.utils.logger import get_logger

logger = get_logger(__name__)


async def classify_intent(llm: BaseLLM, message: str, tenant_id: str) -> dict:
    """
    Classify message intent using LLM.

    Args:
        llm: Language model instance from factory
        message: User message to classify
        tenant_id: Tenant context

    Returns:
        dict: Classification result with intent, confidence, entities
    """
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
