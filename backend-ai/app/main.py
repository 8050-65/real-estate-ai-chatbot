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

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

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
