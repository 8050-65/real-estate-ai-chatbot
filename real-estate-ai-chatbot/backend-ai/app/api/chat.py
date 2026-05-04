"""
Chat endpoint with Ollama semantic extraction, RAG retrieval, and Leadrat API integration.
Supports lead creation flow, property/project search, and conversational queries.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import structlog
from app.config import settings
from app.services.ollama_service import extract_semantics, generate_response
from app.services.rag_service import hybrid_search
from app.services.leadrat_api import (
    create_lead, update_lead, get_leads,
    get_projects, get_properties
)
from app.flows.lead_creation_flow import (
    get_next_step,
    build_confirmation_message,
    build_leadrat_payload,
    LEAD_CREATION_STEPS
)

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    """Chat request model."""
    message: str
    session_id: str = "default"
    tenant_id: str = "dubait11"
    conversation_history: List[Dict] = []
    flow_state: Optional[Dict] = {}


class ChatResponse(BaseModel):
    """Chat response model."""
    response: Optional[str]
    intent: str
    source: str
    rag_used: bool = False
    needs_api_call: bool = False
    template: Optional[str] = None
    data: Optional[List[Dict]] = None
    metadata: Dict = {}
    flow_state: Optional[Dict] = {}


@router.post("/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest) -> ChatResponse:
    """
    Main chat endpoint with Ollama + RAG + Leadrat APIs.
    Handles lead creation flow, property/project search, and general queries.
    """
    try:
        message = request.message.strip()
        tenant_id = request.tenant_id or "dubait11"
        flow_state = request.flow_state or {}
        history = request.conversation_history or []
        
        print(f"[ChatAPI] Incoming message: {message}")
        print(f"[ChatAPI] Tenant ID: {tenant_id}")

        # ── ACTIVE LEAD CREATION FLOW ──────────────────────
        if flow_state.get("active_flow") == "create_lead":
            collected = flow_state.get("collected", {})
            current_step = flow_state.get("current_step")

            # If project was already selected via button, confirm we have the required flow step
            if not current_step and collected.get("project_interest"):
                # Start from the first step (name) if not specified
                current_step = "name"

            # Handle confirmation step
            if current_step == "confirm":
                if message.lower() in ["yes", "y", "confirm", "ok"]:
                    payload = build_leadrat_payload(collected, tenant_id)
                    try:
                        result = await create_lead(payload, tenant_id)
                        return ChatResponse(
                            response=(
                                f"✅ Request sent successfully!\n\n"
                                f"Our team will contact {collected['name']} soon regarding your interest in {collected.get('project_interest', 'this property')}.\n"
                            ),
                            intent="lead_creation_complete",
                            source="embedded_mode_fast",
                            rag_used=False,
                            metadata={
                                "request_sent": True,
                                "name": collected['name'],
                                "phone": collected['phone'],
                                "property": collected.get('project_interest', '')
                            },
                            flow_state={}
                        )
                    except Exception as e:
                        logger.error("lead_creation_failed", error=str(e))
                        return ChatResponse(
                            response=(
                                f"❌ Failed to create lead: {str(e)}\n"
                                "Please try again."
                            ),
                            intent="error",
                            source="embedded_mode_fast",
                            rag_used=False,
                            flow_state={}
                        )
                else:
                    # User said No — cancel flow
                    return ChatResponse(
                        response="No problem. What else can I help you with today?",
                        intent="general",
                        source="embedded_mode_fast",
                        rag_used=False,
                        flow_state={}
                    )

            # Handle collecting a field
            step_def = next(
                (s for s in LEAD_CREATION_STEPS if s["field"] == current_step),
                None
            )

            if step_def:
                # Map number input to option
                if step_def.get("map_number"):
                    try:
                        idx = int(message.strip()) - 1
                        options = step_def.get("options", [])
                        if 0 <= idx < len(options):
                            message = options[idx]
                    except:
                        pass

                # Validate input
                if not step_def["validation"](message):
                    return ChatResponse(
                        response=step_def.get("error", "Invalid input. Please try again."),
                        intent="lead_creation_error",
                        source="embedded_mode_fast",
                        rag_used=False,
                        flow_state=flow_state
                    )

                # Save field
                value = message.strip()
                collected[current_step] = value

                # Get next step
                next_step = get_next_step(collected)

                if next_step["step"] == "confirm":
                    return ChatResponse(
                        response=build_confirmation_message(collected),
                        intent="lead_creation_confirm",
                        source="embedded_mode_fast",
                        rag_used=False,
                        flow_state={
                            "active_flow": "create_lead",
                            "current_step": "confirm",
                            "collected": collected
                        }
                    )
                else:
                    return ChatResponse(
                        response=next_step["question"],
                        intent="lead_creation_step",
                        source="embedded_mode_fast",
                        rag_used=False,
                        flow_state={
                            "active_flow": "create_lead",
                            "current_step": next_step["field"],
                            "collected": collected
                        }
                    )
            else:
                # Error: step_def not found but we're in lead creation flow
                logger.error("lead_creation_step_not_found", current_step=current_step)
                return ChatResponse(
                    response="Something went wrong with the form. Let's start over.",
                    intent="error",
                    source="embedded_mode_fast",
                    rag_used=False,
                    flow_state={}
                )

        # ── FAST PATH: KEYWORD DETECTION (no LLM) ─────────
        msg_lower = message.lower()

        # Detect interested property button (format: "interested: PropertyName")
        if msg_lower.startswith("interested:"):
            property_name = message.replace("interested:", "", 1).replace("Interested:", "", 1).strip()
            first_step = get_next_step({})
            return ChatResponse(
                response=first_step["question"],
                intent="lead_creation_step",
                source="embedded_mode_fast",
                rag_used=False,
                flow_state={
                    "active_flow": "create_lead",
                    "current_step": first_step["field"],
                    "collected": {"project_interest": property_name}
                },
                metadata={"property_name": property_name}
            )

        # Detect request/enquiry (text version)
        if any(kw in msg_lower for kw in ["enquiry", "contact sales", "speak to agent", "reach out", "help me"]):
            first_step = get_next_step({})
            return ChatResponse(
                response=first_step["question"],
                intent="lead_creation_step",
                source="embedded_mode_fast",
                rag_used=False,
                flow_state={
                    "active_flow": "create_lead",
                    "current_step": first_step["field"],
                    "collected": {}
                }
            )

        # Detect property search
        if any(kw in msg_lower for kw in ["find property", "search property", "properties", "find flat", "apartment"]):
            print(f"[ChatAPI] Detected intent: property")
            print(f"[ChatAPI] Tenant ID: {tenant_id}")
            try:
                live_data = await get_properties({}, tenant_id)
                properties = live_data.get("data", [])
                print(f"[ChatAPI] LeadRat response data count: {len(properties)}")

                if properties:
                    return ChatResponse(
                        response=f"I found {len(properties)} properties matching your interest. Here are the top options:",
                        intent="property",
                        source="leadrat_api",
                        rag_used=False,
                        template="property_list",
                        data=properties,
                        metadata={"properties_found": len(properties)}
                    )
                else:
                    return ChatResponse(
                        response="I couldn't find any properties matching your criteria at the moment. Would you like to speak with an agent?",
                        intent="property",
                        source="leadrat_api",
                        rag_used=False
                    )
            except Exception as e:
                print(f"[ChatAPI] Error in property search: {str(e)}")
                return ChatResponse(
                    response="Unable to fetch live property data. Please try again.",
                    intent="error",
                    source="leadrat_api",
                    rag_used=False
                )

        # Detect project search
        if any(kw in msg_lower for kw in ["find project", "show project", "projects", "view project"]):
            print(f"[ChatAPI] Detected intent: project")
            print(f"[ChatAPI] Tenant ID: {tenant_id}")
            try:
                live_data = await get_projects({}, tenant_id)
                projects = live_data.get("data", [])
                print(f"[ChatAPI] LeadRat response data count: {len(projects)}")

                if projects:
                    return ChatResponse(
                        response=f"I found {len(projects)} projects for you. Explore our top developments below:",
                        intent="project",
                        source="leadrat_api",
                        rag_used=False,
                        template="project_list",
                        data=projects,
                        metadata={"projects_found": len(projects)}
                    )
                else:
                    return ChatResponse(
                        response="I couldn't find any active projects for the selected criteria.",
                        intent="project",
                        source="leadrat_api",
                        rag_used=False
                    )
            except Exception as e:
                print(f"[ChatAPI] Error in project search: {str(e)}")
                return ChatResponse(
                    response="Unable to fetch live project data. Please try again.",
                    intent="error",
                    source="leadrat_api",
                    rag_used=False
                )

        # ── INTENT DETECTION WITH OLLAMA ──────────────────
        try:
            semantics = await extract_semantics(message, history)
            module = semantics.get("module", "general")
            intent = semantics.get("intent", "query")
            filters = semantics.get("filters", {})
        except Exception as e:
            logger.warning("ollama_extraction_failed", error=str(e))
            # Fallback: keyword-based intent detection
            module = "general"
            intent = "query"
            filters = {}

        logger.info("chat_intent_extracted", module=module, intent=intent, filters=filters)

        # ── CREATE LEAD INTENT ─────────────────────────────
        if module == "lead" and intent == "create":
            first_step = get_next_step({})
            return ChatResponse(
                response=first_step["question"],
                intent="lead_creation_step",
                source="embedded_mode_fast",
                rag_used=False,
                flow_state={
                    "active_flow": "create_lead",
                    "current_step": first_step["field"],
                    "collected": {}
                }
            )

        # ── QUERY LEADS WITH RAG + LIVE API ───────────────
        elif module == "lead" and intent == "query":
            try:
                # Get live data from Leadrat
                live_data = await get_leads(filters, tenant_id)
                leads = live_data.get("data", live_data if isinstance(live_data, list) else [])

                # Also search RAG for context
                rag_context = await hybrid_search(message, "lead", filters)

                # Build combined context
                live_context = "\n".join([
                    f"Lead: {l.get('name')} | Status: {l.get('status')} | Phone: {l.get('phone')}"
                    for l in leads[:5]
                ])
                combined_context = (
                    f"LIVE DATA:\n{live_context}\n\n"
                    f"ADDITIONAL CONTEXT:\n{rag_context}" if rag_context else live_context
                )

                # Generate response with Ollama
                response_text = await generate_response(
                    message, combined_context, module, history
                )

                return ChatResponse(
                    response=response_text,
                    intent="lead",
                    source="ollama_rag",
                    rag_used=bool(rag_context),
                    template="lead_list" if leads else None,
                    data=leads[:5] if leads else None,
                    metadata={"leads_found": len(leads)}
                )
            except Exception as e:
                logger.error("lead_query_failed", error=str(e))
                return ChatResponse(
                    response="I'm having trouble accessing leads. Please try again.",
                    intent="error",
                    source="fallback",
                    rag_used=False
                )

        # ── QUERY PROJECTS WITH RAG ───────────────────────
        elif module == "project" and intent == "query":
            try:
                # Search RAG first
                rag_context = await hybrid_search(message, "project", filters)

                # If no RAG results, try live API
                if not rag_context:
                    live_data = await get_projects(filters, tenant_id)
                    projects = live_data.get("data", live_data if isinstance(live_data, list) else [])
                    live_context = "\n".join([
                        f"Project: {p.get('name') or p.get('title', 'N/A')} | Location: {p.get('city') or p.get('address', {}).get('city', 'Dubai')} | Status: {p.get('status', 'Active')}"
                        for p in projects[:5]
                    ])
                    rag_context = live_context
                else:
                    projects = []

                # Generate response
                response_text = await generate_response(
                    message, rag_context, module, history
                )

                return ChatResponse(
                    response=response_text,
                    intent="project",
                    source="ollama_rag",
                    rag_used=True,
                    metadata={"projects_found": len(projects) if projects else 0}
                )
            except Exception as e:
                logger.error("project_query_failed", error=str(e))
                return ChatResponse(
                    response="I'm having trouble accessing projects. Please try again.",
                    intent="error",
                    source="fallback",
                    rag_used=False
                )

        # ── QUERY PROPERTIES WITH RAG ──────────────────────
        elif module == "property" and intent == "query":
            try:
                # Search RAG first
                rag_context = await hybrid_search(message, "property", filters)

                # If no RAG results, try live API
                if not rag_context:
                    live_data = await get_properties(filters, tenant_id)
                    properties = live_data.get("data", live_data if isinstance(live_data, list) else [])
                    live_context = "\n".join([
                        f"Property: {p.get('title') or p.get('name') or p.get('serialNo', 'N/A')} | BHK: {p.get('bhkType') or p.get('bhk', 'N/A')} | Price: {p.get('price') or 'On Request'} | City: {p.get('city') or p.get('address', {}).get('city', 'Dubai')}"
                        for p in properties[:5]
                    ])
                    rag_context = live_context
                else:
                    properties = []

                # Generate response
                response_text = await generate_response(
                    message, rag_context, module, history
                )

                return ChatResponse(
                    response=response_text,
                    intent="property",
                    source="ollama_rag",
                    rag_used=True,
                    metadata={"properties_found": len(properties) if properties else 0}
                )
            except Exception as e:
                logger.error("property_query_failed", error=str(e))
                return ChatResponse(
                    response="I'm having trouble accessing properties. Please try again.",
                    intent="error",
                    source="fallback",
                    rag_used=False
                )

        # ── GENERAL QUERY WITH OLLAMA ──────────────────────
        else:
            try:
                # Try RAG context if available
                try:
                    rag_context = await hybrid_search(message, "general", filters)
                except:
                    rag_context = ""

                # Try to generate response with Ollama
                try:
                    response_text = await generate_response(
                        message, rag_context, "general", history
                    )
                except:
                    response_text = None

                # If Ollama fails, use fallback response
                if not response_text:
                    response_text = "Hello! I'm Aria, your real estate assistant. I can help you find properties, projects, or create a lead. What would you like to do?"

                return ChatResponse(
                    response=response_text,
                    intent="general",
                    source="ollama_rag" if rag_context else ("ollama" if response_text else "fallback"),
                    rag_used=bool(rag_context)
                )
            except Exception as e:
                logger.error("general_query_failed", error=str(e))
                return ChatResponse(
                    response="Hello! I'm Aria, your real estate assistant. I can help you find properties, projects, or create a lead. What would you like to do?",
                    intent="general",
                    source="fallback",
                    rag_used=False
                )

    except Exception as e:
        logger.error("chat_error", error=str(e), message=request.message[:50], exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-token")
async def test_jwt_token():
    """Test JWT token generation from Leadrat."""
    from app.services.leadrat_api import get_jwt_token

    results = {
        "timestamp": str(__import__('datetime').datetime.now()),
        "test": "JWT Token Generation"
    }

    try:
        token = await get_jwt_token()
        results["status"] = "✅ SUCCESS"
        results["token_generated"] = True
        results["token_preview"] = token[:50] + "..." if token else "Empty token"
        results["token_length"] = len(token) if token else 0
    except Exception as e:
        results["status"] = "❌ FAILED"
        results["error"] = str(e)
        results["error_type"] = type(e).__name__

    return results


@router.get("/test-apis")
async def test_leadrat_apis(tenant_id: str = "dubait11"):
    """Test all Leadrat API endpoints."""
    from app.services.leadrat_api import get_jwt_token

    results = {
        "timestamp": str(__import__('datetime').datetime.now()),
        "leadrat_url": settings.leadrat_api_url if hasattr(settings, 'leadrat_api_url') else "https://connect.leadrat.com",
        "tests": {}
    }

    # Test JWT token first
    try:
        token = await get_jwt_token()
        results["tests"]["jwt_token"] = {"status": "✅ SUCCESS", "token_preview": token[:50] + "..."}
    except Exception as e:
        results["tests"]["jwt_token"] = {"status": "❌ FAILED", "error": str(e)}

    # Test lead creation
    try:
        lead_result = await create_lead({
            "name": "Test Lead",
            "phone": "+971501234567",
            "email": "test@example.com",
            "source": "test",
            "projectInterest": "Test Project",
            "status": "New",
            "tenantId": tenant_id
        }, tenant_id)
        results["tests"]["create_lead"] = {"status": "✅ SUCCESS", "data": lead_result}
    except Exception as e:
        results["tests"]["create_lead"] = {"status": "❌ FAILED", "error": str(e)}

    # Test get leads
    try:
        leads_result = await get_leads({}, tenant_id)
        results["tests"]["get_leads"] = {"status": "✅ SUCCESS", "count": len(leads_result.get("data", []))}
    except Exception as e:
        results["tests"]["get_leads"] = {"status": "❌ FAILED", "error": str(e)}

    # Test get properties
    try:
        props_result = await get_properties({}, tenant_id)
        results["tests"]["get_properties"] = {"status": "✅ SUCCESS", "count": len(props_result.get("data", []))}
    except Exception as e:
        results["tests"]["get_properties"] = {"status": "❌ FAILED", "error": str(e)}

    # Test get projects
    try:
        projects_result = await get_projects({}, tenant_id)
        results["tests"]["get_projects"] = {"status": "✅ SUCCESS", "count": len(projects_result.get("data", []))}
    except Exception as e:
        results["tests"]["get_projects"] = {"status": "❌ FAILED", "error": str(e)}

    return results


@router.get("/status")
async def health_check():
    """Check if chat endpoints are healthy."""
    try:
        return {
            "status": "healthy",
            "service": "Leadrat AI Chatbot",
            "version": "2.0.0",
            "features": ["lead_creation", "ollama_rag", "leadrat_api"],
            "leadrat_api_url": "https://connect.leadrat.com"
        }
    except Exception as e:
        logger.error("health_check_failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e),
        }
