"""
Intent Router - Route user messages to appropriate service based on detected intent
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import logging

from app.config import settings
from app.routers.leadrat import (
    lead_service,
    property_service,
    project_service
)
from app.services.llm_grounding import generate_llm_response

logger = logging.getLogger(__name__)

# Default tenant from settings (loads from .env via pydantic)
DEFAULT_TENANT = settings.leadrat_tenant
logger.info(f"Intent router initialized with DEFAULT_TENANT={DEFAULT_TENANT}")

# Intent detection keywords
INTENT_KEYWORDS = {
    "lead": ["lead", "leads", "enquiry", "inquiry", "customer", "contact", "hot lead", "new lead", "follow up", "customers"],
    "property": ["property", "properties", "flat", "apartment", "bhk", "unit", "available", "inventory", "sqft", "carpet area", "2bhk", "3bhk"],
    "project": ["project", "projects", "tower", "block", "phase", "rera", "possession", "launch", "development", "development"],
    "analytics": ["how many", "total", "count", "analytics", "report", "conversion", "performance", "stats", "revenue", "rate"],
    "visit": ["visit", "site visit", "meeting", "schedule", "appointment", "callback", "book a visit", "site see", "property tour"],
}

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Intent-based chat request"""
    message: str
    intent: Optional[str] = None  # Make optional - backend will detect if not provided
    tenant_id: Optional[str] = None  # Will default from .env if not provided
    search_term: str = ""
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    """Chat response"""
    response: str
    intent: str
    source: str
    data: Optional[Any] = None


def _detect_intent(message: str) -> str:
    """Detect intent from message using keyword matching"""
    message_lower = message.lower()

    # Check each intent's keywords
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(keyword in message_lower for keyword in keywords):
            logger.info(f"Intent detected: {intent}")
            return intent

    logger.info("🎯 Intent detected: general (no keywords matched)")
    return "general"


@router.post("/message")
async def route_intent(request: ChatRequest) -> ChatResponse:
    """
    Route intent to appropriate service and return response

    Intent routing:
    - lead → Leadrat Lead Service
    - property → Leadrat Property Service
    - project → Leadrat Project Service
    - analytics → LLM with analytics context
    - visit/activity → Activity Service
    - general → LLM general response

    Tenant defaults to LEADRAT_TENANT from .env if not provided.
    Intent is auto-detected from message if not provided.
    """
    # Use provided tenant or default from .env
    tenant_id = request.tenant_id or DEFAULT_TENANT
    if not tenant_id:
        logger.warning("⚠️ No tenant configured. Set LEADRAT_TENANT in .env or pass tenant_id in request")
        raise HTTPException(status_code=400, detail="Tenant not configured")

    # Auto-detect intent if not provided
    intent = (request.intent or _detect_intent(request.message)).lower().strip()
    message = request.message
    search_term = request.search_term or message

    logger.info(f"Intent routing: {intent} | Tenant: {tenant_id} | Message: {message[:50]}...")

    try:
        # Route based on intent
        if intent == "lead":
            return await _handle_lead_intent(message, search_term, tenant_id)
        elif intent == "property":
            return await _handle_property_intent(message, search_term, tenant_id)
        elif intent == "project":
            return await _handle_project_intent(message, search_term, tenant_id)
        elif intent == "analytics":
            return await _handle_analytics_intent(message, request.conversation_history, tenant_id)
        elif intent == "visit":
            return await _handle_visit_intent(message, tenant_id)
        else:
            return await _handle_general_intent(message, request.conversation_history, tenant_id)

    except Exception as e:
        logger.error(f"Intent routing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing intent {intent}: {str(e)}"
        )


async def _handle_lead_intent(message: str, search_term: str, tenant_id: Optional[str]) -> ChatResponse:
    """Handle lead search intent"""
    logger.info(f"Handling lead intent: message='{message}' | search_term='{search_term}'")

    # Clean up search term - remove generic words
    generic_phrases = ["show", "leads", "lead", "hot", "filter", "status", "assign", "follow", "up", "customer", "customers"]
    cleaned_term = " ".join([w for w in search_term.lower().split() if w not in generic_phrases]).strip()

    # If search term is empty or too generic, search with empty term to get all leads
    actual_term = cleaned_term if cleaned_term and len(cleaned_term) > 1 else ""

    logger.info(f"Lead search - cleaned_term: '{cleaned_term}' -> actual_term: '{actual_term}'")

    # Search leads using Leadrat service
    result = lead_service.search_leads(
        search_term=actual_term,
        page_number=1,
        page_size=10
    )

    logger.info(f"Lead search result: {result}")

    if result and result.get("data"):
        leads = result.get("data", [])
        response_text = _format_leads_response(leads)
        return ChatResponse(
            response=response_text,
            intent="lead",
            source="Leadrat API",
            data=leads
        )

    return ChatResponse(
        response="No leads found. Try refining your search or check back later.",
        intent="lead",
        source="Leadrat API",
        data=[]
    )


async def _handle_property_intent(message: str, search_term: str, tenant_id: Optional[str]) -> ChatResponse:
    """Handle property search intent"""
    logger.info(f"Handling property intent: message='{message}' | search_term='{search_term}'")

    # Clean up search term - remove generic words that won't help with search
    generic_phrases = ["available", "properties", "show", "find", "list", "search", "filter", "price", "range", "map"]
    cleaned_term = " ".join([w for w in search_term.lower().split() if w not in generic_phrases]).strip()

    # If search term is empty or too generic, search with empty query to get all properties
    actual_query = cleaned_term if cleaned_term and len(cleaned_term) > 1 else ""

    logger.info(f"Property search - cleaned_term: '{cleaned_term}' -> actual_query: '{actual_query}'")

    # Search properties using Leadrat service
    result = property_service.search_properties(
        query=actual_query,
        page_number=1,
        page_size=10
    )

    logger.info(f"Property search result: {result}")

    if result and result.get("data"):
        properties = result.get("data", [])
        response_text = _format_properties_response(properties)
        return ChatResponse(
            response=response_text,
            intent="property",
            source="Leadrat API",
            data=properties
        )

    return ChatResponse(
        response="No properties found. Try refining your search or ask about a specific location.",
        intent="property",
        source="Leadrat API",
        data=[]
    )


async def _handle_project_intent(message: str, search_term: str, tenant_id: Optional[str]) -> ChatResponse:
    """Handle project search intent"""
    logger.info(f"Handling project intent: {search_term}")

    # Get projects using Leadrat service
    result = project_service.get_projects(
        page_number=1,
        page_size=5
    ) # Note: tenant_id not used here as Leadrat project API doesn't support filtering

    if result and result.get("data"):
        projects = result.get("data", [])
        response_text = _format_projects_response(projects)
        return ChatResponse(
            response=response_text,
            intent="project",
            source="Leadrat API",
            data=projects
        )

    return ChatResponse(
        response="No projects available at the moment.",
        intent="project",
        source="Leadrat API",
        data=[]
    )


async def _handle_analytics_intent(message: str, conversation_history: Optional[List[ChatMessage]], tenant_id: Optional[str]) -> ChatResponse:
    """Handle analytics intent - use LLM with context"""
    logger.info(f"Handling analytics intent for tenant: {tenant_id}")

    # Generate LLM response for analytics
    history = [{"role": m.role, "content": m.content} for m in conversation_history] if conversation_history else []
    response_text = await generate_llm_response(
        user_message=message,
        intent="analytics",
        crm_data={},
        history=history
    )

    return ChatResponse(
        response=response_text or "Unable to generate analytics response. Please try again.",
        intent="analytics",
        source="LLM + Analytics Context"
    )


async def _handle_visit_intent(message: str, tenant_id: Optional[str]) -> ChatResponse:
    """Handle visit/activity intent"""
    logger.info(f"Handling visit intent for tenant: {tenant_id}")

    # For now, return a placeholder response
    # In Phase 3, this will integrate with Activity service
    return ChatResponse(
        response="I can help you schedule a site visit. Please provide details like preferred date and time.",
        intent="visit",
        source="Activity Service"
    )


async def _handle_general_intent(message: str, conversation_history: Optional[List[ChatMessage]], tenant_id: Optional[str]) -> ChatResponse:
    """Handle general questions with LLM"""
    logger.info(f"Handling general intent for tenant: {tenant_id}")

    # Generate LLM response for general query
    history = [{"role": m.role, "content": m.content} for m in conversation_history] if conversation_history else []
    response_text = await generate_llm_response(
        user_message=message,
        intent="general",
        crm_data={},
        history=history
    )

    return ChatResponse(
        response=response_text or "I'm here to help! Ask me about leads, properties, projects, or scheduling visits.",
        intent="general",
        source="LLM"
    )


def _format_leads_response(leads: List[dict]) -> str:
    """Format leads data into readable response"""
    if not leads:
        return "No leads found."

    response = f"Found {len(leads)} lead(s):\n\n"
    for i, lead in enumerate(leads[:5], 1):
        name = lead.get("name", "Unknown")
        phone = lead.get("contactNo", "N/A")

        # Status can be nested or a string
        status_obj = lead.get("status", {})
        if isinstance(status_obj, dict):
            status = status_obj.get("displayName", "New")
        else:
            status = status_obj

        response += f"{i}. {name}\n   Phone: {phone} | Status: {status}\n\n"

    return response.strip()


def _format_properties_response(properties: List[dict]) -> str:
    """Format properties data into readable response"""
    if not properties:
        return "No properties found."

    response = f"Found {len(properties)} properties:\n\n"
    for i, prop in enumerate(properties[:5], 1):
        # Extract from Leadrat property structure
        title = prop.get("title", "Unknown Property")
        price = prop.get("price", "Contact for price")
        if price is None or price == "":
            price = "Contact for price"

        # Address can be a dict or string
        addr = prop.get("address", {})
        city = addr.get("city") if isinstance(addr, dict) else addr
        location = city or "Unknown location"

        # Property type/BHK
        bhk = prop.get("bhkType", "")
        bhk_text = f" | {bhk}" if bhk else ""

        # Area from dimension
        dimension = prop.get("dimension", {})
        area = dimension.get("area") if isinstance(dimension, dict) else None
        area_text = f" | {area} sqft" if area else ""

        response += f"{i}. {title}\n   {location}{bhk_text}{area_text}\n   Price: {price}\n\n"

    return response.strip()


def _format_projects_response(projects: List[dict]) -> str:
    """Format projects data into readable response"""
    if not projects:
        return "No projects available."

    response = f"Found {len(projects)} project(s):\n\n"
    for i, proj in enumerate(projects[:5], 1):
        name = proj.get("name", "Unknown")
        area = proj.get("area", "N/A")
        min_price = proj.get("minimumPrice", "N/A")
        max_price = proj.get("maximumPrice", "N/A")

        # Format price range
        if min_price and max_price and min_price != "N/A" and max_price != "N/A":
            price_text = f"Price: {min_price} - {max_price}"
        elif min_price and min_price != "N/A":
            price_text = f"Price: From {min_price}"
        else:
            price_text = "Contact for pricing"

        response += f"{i}. {name}\n   Area: {area} | {price_text}\n\n"

    return response.strip()
