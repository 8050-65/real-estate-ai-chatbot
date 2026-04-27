"""
FastAPI application entry point for Real Estate WhatsApp Chatbot AI Service.

Includes:
- LLM provider switching (Ollama, Groq, OpenAI, Gemini)
- LangGraph orchestrator initialization
- WhatsApp webhook endpoint
- Health checks with database/redis/LLM status
- Logging & structured error handling
"""

from contextlib import asynccontextmanager
import httpx

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.agents.llm_factory import get_llm
from app.agents.orchestrator import get_orchestrator
from app.webhook.router import webhook_router
from app.utils.logger import setup_logging

# Initialize structured logging
logger = setup_logging(__name__)


# ============================================================================
# Lifespan Events (Startup/Shutdown)
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    logger.info("startup_begin", environment=settings.environment, version="1.0.0")

    # Initialize LLM provider (graceful fallback if unavailable)
    llm_available = True
    try:
        llm = get_llm()
        logger.info("llm_initialized", provider=settings.llm_provider)
    except Exception as e:
        logger.warning("llm_init_delayed", provider=settings.llm_provider, error=str(e))
        logger.warning("llm_will_initialize_on_first_use", provider=settings.llm_provider)
        llm_available = False

    # Initialize orchestrator (graceful fallback if unavailable)
    try:
        orchestrator = get_orchestrator()
        logger.info("orchestrator_initialized")
    except Exception as e:
        logger.warning("orchestrator_init_delayed", error=str(e))
        logger.warning("orchestrator_will_initialize_on_first_use")

    overall_status = "healthy" if llm_available else "degraded"
    logger.info(
        "service_ready",
        status=overall_status,
        host="0.0.0.0",
        port=8000,
        llm_provider=settings.llm_provider,
        environment=settings.environment,
        data_storage_mode=settings.data_storage_mode,
        leadrat_db_enabled=bool(settings.leadrat_db_url),
    )

    yield

    # Shutdown
    logger.info("service_shutdown")


# ============================================================================
# FastAPI Application
# ============================================================================
app = FastAPI(
    title="Real Estate AI Chatbot",
    description="FastAPI service for WhatsApp chatbot powered by LangGraph + LLM providers",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

# ============================================================================
# CORS Middleware
# ============================================================================
allowed_origins = [o.strip() for o in settings.allowed_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


# ============================================================================
# Exception Handlers
# ============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions."""
    logger.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.debug else "An error occurred processing your request",
            "path": request.url.path,
        },
    )


# ============================================================================
# API Routes
# ============================================================================
app.include_router(webhook_router, prefix="/webhook", tags=["Webhook"])

# LLM routes for CRM-grounded responses
from app.routers.llm import router as llm_router
app.include_router(llm_router)

# Leadrat Connector Layer routes
from app.routers.leadrat import router as leadrat_router
app.include_router(leadrat_router)

# Intent Router - routes to appropriate service based on intent
from app.routers.intent_router import router as intent_router
app.include_router(intent_router)


# ============================================================================
# Leadrat Integration Routes (for CRM Dashboard)
# ============================================================================
from app.services.leadrat_leads import list_leads, list_properties, list_projects


@app.get("/api/v1/leads", tags=["Leadrat"])
async def get_leads(
    tenant_id: str = "dubait11",
    search: str = None,
    page: int = 1,
    size: int = 10,
):
    """
    Get leads from Leadrat API.

    Args:
        tenant_id: Tenant ID (default: dubait11)
        search: Optional search term
        page: Page number (1-indexed)
        size: Items per page

    Returns:
        Paginated leads list from Leadrat
    """
    try:
        data = await list_leads(
            tenant_id=tenant_id,
            search=search,
            page_number=page,
            page_size=size,
        )
        items = data.get("data") or []
        return {
            "success": True,
            "data": items,
            "totalCount": data.get("total", len(items)),
            "page": page,
            "size": size,
        }
    except Exception as e:
        logger.error("leadrat_leads_error", error=str(e), exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "data": [],
        }


@app.get("/api/v1/properties", tags=["Leadrat"])
async def get_properties(
    tenant_id: str = "dubait11",
    search: str = None,
    page: int = 1,
    size: int = 10,
):
    """
    Get properties from Leadrat API.

    Args:
        tenant_id: Tenant ID (default: dubait11)
        search: Optional search term
        page: Page number (1-indexed)
        size: Items per page

    Returns:
        Paginated properties list from Leadrat
    """
    try:
        data = await list_properties(
            tenant_id=tenant_id,
            search=search,
            page_number=page,
            page_size=size,
        )
        items = data.get("data") or []
        return {
            "success": True,
            "data": items,
            "totalCount": data.get("total", len(items)),
            "page": page,
            "size": size,
        }
    except Exception as e:
        logger.error("leadrat_properties_error", error=str(e), exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "data": [],
        }


@app.get("/api/v1/projects", tags=["Leadrat"])
async def get_projects(
    tenant_id: str = "dubait11",
    search: str = None,
    page: int = 1,
    size: int = 10,
):
    """
    Get projects from Leadrat API.

    Args:
        tenant_id: Tenant ID (default: dubait11)
        search: Optional search term
        page: Page number (1-indexed)
        size: Items per page

    Returns:
        Paginated projects list from Leadrat
    """
    try:
        data = await list_projects(
            tenant_id=tenant_id,
            search=search,
            page_number=page,
            page_size=size,
        )
        items = data.get("data") or []
        return {
            "success": True,
            "data": items,
            "totalCount": data.get("total", len(items)),
            "page": page,
            "size": size,
        }
    except Exception as e:
        logger.error("leadrat_projects_error", error=str(e), exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "data": [],
        }


# ============================================================================
# Helper Functions for Spring Boot API Integration
# ============================================================================
async def get_leads_summary():
  """Fetch leads from Spring Boot API and return summary."""
  try:
    async with httpx.AsyncClient() as client:
      response = await client.get(
        f"{settings.spring_boot_url}/api/v1/leads",
        params={"page": 1, "size": 10},
        timeout=5.0
      )
      if response.status_code == 200:
        data = response.json()
        total = data.get("totalElements", 0)
        leads = data.get("content", [])
        if leads:
          return f"You have {total} active leads. Recent leads include: {', '.join([l.get('name', 'Unknown') for l in leads[:3]])}."
        return f"You have {total} active leads in the system."
      return "Unable to fetch leads at the moment."
  except Exception as e:
    logger.warning("leads_fetch_failed", error=str(e))
    return "Could not retrieve leads data."

async def get_visits_summary():
  """Fetch visits from Spring Boot API and return summary."""
  try:
    async with httpx.AsyncClient() as client:
      response = await client.get(
        f"{settings.spring_boot_url}/api/v1/visits",
        params={"page": 1, "size": 10},
        timeout=5.0
      )
      if response.status_code == 200:
        data = response.json()
        total = data.get("totalElements", 0)
        return f"You have {total} visits scheduled. Would you like to schedule a new visit?"
      return "Unable to fetch visits at the moment."
  except Exception as e:
    logger.warning("visits_fetch_failed", error=str(e))
    return "Could not retrieve visits data."

async def get_properties_summary():
  """Fetch properties from Spring Boot API and return summary."""
  try:
    async with httpx.AsyncClient() as client:
      response = await client.get(
        f"{settings.spring_boot_url}/api/v1/properties",
        params={"page": 1, "size": 10},
        timeout=5.0
      )
      if response.status_code == 200:
        data = response.json()
        total = data.get("totalElements", 0)
        properties = data.get("content", [])
        if properties:
          return f"You have {total} properties in inventory. Top properties: {', '.join([p.get('name', 'Property') for p in properties[:3]])}."
        return f"You have {total} properties in the system."
      return "Unable to fetch properties at the moment."
  except Exception as e:
    logger.warning("properties_fetch_failed", error=str(e))
    return "Could not retrieve properties data."


# ============================================================================
# Chat API for CRM Dashboard (Direct Chat Interface)
# ============================================================================


class ChatRequest(BaseModel):
    message: str
    tenant_id: str = "black"
    whatsapp_number: str = "dashboard_user"


class ChatResponse(BaseModel):
    message: str
    intent: str
    response: str
    error: str | None = None


@app.post("/chat", tags=["Chat"], response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Direct chat endpoint for CRM dashboard AI Assistant.

    This is separate from WhatsApp webhook - for direct dashboard chat.
    Intelligently routes to appropriate APIs based on intent detection.

    Args:
        request: ChatRequest with message, tenant_id, and optional whatsapp_number

    Returns:
        ChatResponse with message, intent, and AI response
    """
    try:
        logger.info(
            "chat_request",
            message=request.message,
            tenant_id=request.tenant_id,
            whatsapp_number=request.whatsapp_number,
        )

        # Intent classification and intelligent response generation
        message_lower = request.message.lower()
        intent = "general"
        response = ""

        # Route to appropriate API based on detected intent
        if any(word in message_lower for word in ["lead", "leads", "hot", "active", "follow"]):
            intent = "leads_inquiry"
            response = await get_leads_summary()

        elif any(word in message_lower for word in ["project", "property", "properties", "available", "inventory"]):
            intent = "property_inquiry"
            response = await get_properties_summary()

        elif any(word in message_lower for word in ["visit", "schedule", "book", "appointment", "site", "meeting"]):
            intent = "visit_booking"
            response = await get_visits_summary()
            response += " Which property would you like to schedule a visit for?"

        elif any(word in message_lower for word in ["price", "cost", "rate", "payment", "budget"]):
            intent = "pricing_inquiry"
            leads_info = await get_leads_summary()
            response = f"Based on your leads and available properties, I can help with pricing. {leads_info} Would you like details on any specific property?"

        elif any(word in message_lower for word in ["analytics", "report", "analysis", "data", "stats", "summary"]):
            intent = "analytics"
            leads_summary = await get_leads_summary()
            visits_summary = await get_visits_summary()
            response = f"Here's your current status:\n• {leads_summary}\n• {visits_summary}\n\nWould you like a detailed report?"

        elif any(word in message_lower for word in ["help", "hello", "hi", "hey", "start", "what can"]):
            intent = "greeting"
            response = "Hello! I'm your AI Real Estate Assistant. I can help you:\n• Manage and follow up on leads\n• Explore available properties\n• Schedule property visits\n• Review analytics and reports\n• Answer pricing questions\n\nWhat would you like to know?"

        else:
            intent = "general"
            response = "I'm here to help! You can ask me about leads, properties, scheduling visits, pricing, or analytics. What interests you?"

        logger.info(
            "chat_response",
            whatsapp_number=request.whatsapp_number,
            intent=intent,
        )

        return ChatResponse(
            message=request.message,
            intent=intent,
            response=response,
            error=None,
        )

    except Exception as e:
        logger.error("chat_error", message=request.message, error=str(e), exc_info=True)
        return ChatResponse(
            message=request.message,
            intent="error",
            response="I'm temporarily unavailable. Please try again in a moment.",
            error=str(e) if settings.debug else None,
        )


# ============================================================================
# Health Check Endpoints
# ============================================================================
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "realestate-ai-service",
        "version": "1.0.0",
        "environment": settings.environment,
        "llm_provider": settings.llm_provider,
    }


@app.get("/health/detailed", tags=["Health"])
async def health_check_detailed():
    """Detailed health check with dependency status."""
    checks = {}

    # Check LLM
    try:
        get_llm()
        checks["llm"] = {"status": "healthy", "provider": settings.llm_provider}
    except Exception as e:
        checks["llm"] = {"status": "unhealthy", "error": str(e)}
        logger.warning("llm_health_check_failed", provider=settings.llm_provider, error=str(e))

    # Check orchestrator
    try:
        get_orchestrator()
        checks["orchestrator"] = {"status": "healthy"}
    except Exception as e:
        checks["orchestrator"] = {"status": "unhealthy", "error": str(e)}
        logger.warning("orchestrator_health_check_failed", error=str(e))

    overall_status = (
        "healthy" if all(c["status"] == "healthy" for c in checks.values()) else "degraded"
    )

    return {
        "status": overall_status,
        "service": "realestate-ai-service",
        "version": "1.0.0",
        "environment": settings.environment,
        "llm_provider": settings.llm_provider,
        "checks": checks,
    }


# ============================================================================
# Debug Endpoints (Development only)
# ============================================================================
@app.post("/ai/test-intent", tags=["Debug"])
async def test_intent_classification(message: str):
    """
    Test endpoint for intent classification using the configured LLM provider.

    Example:
        curl -X POST "http://localhost:8000/ai/test-intent?message=What%20projects%20do%20you%20have"

    Returns:
        Intent classification result with provider info
    """
    if not settings.debug:
        return {"error": "Debug endpoints not available in production"}

    logger.debug("test_intent_called", message=message)

    try:
        llm = get_llm()
        prompt = f"""Classify the intent of this WhatsApp message concisely:
Message: {message}

Intent categories: project_discovery, unit_availability, pricing_inquiry, payment_plan,
amenities_query, rera_legal, site_visit_booking, document_request, offer_inquiry,
status_followup, human_handoff_request, out_of_scope

Respond in JSON: {{"intent": "...", "confidence": 0.0}}"""

        response = llm.invoke(prompt)
        return {
            "message": message,
            "response": response.content,
            "llm_provider": settings.llm_provider,
            "model": settings.llm_model,
        }
    except Exception as e:
        logger.error("intent_test_failed", message=message, error=str(e), exc_info=True)
        return {
            "error": "Intent classification failed",
            "details": str(e) if settings.debug else None,
            "llm_provider": settings.llm_provider,
        }


# ============================================================================
# Root Endpoint
# ============================================================================
@app.get("/", tags=["Info"])
async def root():
    """Root endpoint - service information."""
    provider = settings.llm_provider.lower()
    model_map = {
        "ollama": settings.ollama_model,
        "groq": settings.groq_model,
        "openai": settings.openai_model,
        "gemini": settings.gemini_model,
    }
    return {
        "service": "Real Estate AI Chatbot",
        "version": "1.0.0",
        "llm_provider": settings.llm_provider,
        "llm_model": model_map.get(provider, "unknown"),
        "docs": "/docs" if settings.debug else None,
        "health": "/health",
    }


# ============================================================================
# Application Entry Point
# ============================================================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
