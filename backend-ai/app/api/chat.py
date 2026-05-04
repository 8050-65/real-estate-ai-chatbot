"""
Chat endpoint with Ollama semantic extraction, RAG retrieval, and Leadrat API integration.
Supports lead creation flow, property/project search, and conversational queries.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import structlog
import json
import re
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
    action: Optional[str] = None
    selectedItemId: Optional[str] = None
    selectedItemType: Optional[str] = None
    selectedItemName: Optional[str] = None


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


def filter_properties(items: List[Dict], filters: Dict) -> List[Dict]:
    """Filter properties based on extracted criteria."""
    filtered = items
    
    loc = filters.get("location")
    if loc:
        loc = loc.lower()
        filtered = [i for i in filtered if loc in (i.get("location") or "").lower() or loc in (i.get("title") or "").lower()]
        
    max_p = filters.get("maxPrice")
    if max_p:
        try:
            max_p = int(max_p)
            filtered = [i for i in filtered if i.get("budget", 0) <= max_p]
        except: pass
        
    bhk = filters.get("bhk")
    if bhk:
        try:
            bhk = int(bhk)
            filtered = [i for i in filtered if i.get("bhk") == bhk]
        except: pass
        
    return filtered


def filter_projects(items: List[Dict], filters: Dict) -> List[Dict]:
    """Filter projects based on extracted criteria."""
    filtered = items
    loc = filters.get("location")
    if loc:
        loc = loc.lower()
        filtered = [i for i in filtered if loc in (i.get("location") or "").lower() or loc in (i.get("name") or "").lower()]
    return filtered


@router.post("/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest) -> ChatResponse:
    try:
        message = request.message.strip()
        tenant_id = request.tenant_id or "dubait11"
        flow_state = request.flow_state or {}
        history = request.conversation_history or []
        
        print(f"[ChatAPI] Incoming message: {message} | Action: {request.action} | Type: {type(request.action)}")

        # ── HANDLE STRUCTURED ACTIONS (INTERESTED ETC.) ─────
        if request.action == "interest_selected" or message.lower().startswith("interested:"):
            print(f"[ChatAPI] ✓ Detected interest_selected action, starting lead flow")
            item_name = request.selectedItemName or message.split(":", 1)[-1].strip()
            item_type = request.selectedItemType or ("property" if "property" in message.lower() else "project")
            
            first_step = get_next_step({})
            return ChatResponse(
                response=f"Great choice! I'd love to help you with **{item_name}**. May I know your name?",
                intent="lead_creation_step",
                source="leadrat_api",
                flow_state={
                    "active_flow": "create_lead",
                    "current_step": "get_name",
                    "collected": {"project_interest": item_name, "item_type": item_type, "item_id": request.selectedItemId}
                }
            )

        # ── ACTIVE LEAD CREATION FLOW ──────────────────────
        if flow_state.get("active_flow") == "create_lead":
            collected = flow_state.get("collected", {})
            current_step = flow_state.get("current_step")

            # Handle confirmation step
            if current_step == "confirm":
                msg_lower = message.lower()
                is_confirm = any(kw in msg_lower for kw in ["yes", "y", "confirm", "ok", "proceed", "✅"])
                is_cancel = any(kw in msg_lower for kw in ["no", "cancel", "❌", "stop"])

                if is_confirm:
                    # Build payload for Leadrat lead creation API
                    payload = {
                        "name": collected.get("name", ""),
                        "phone": collected.get("phone", ""),
                        "email": collected.get("email", ""),
                        "source": "AI Chatbot",
                        "projectInterest": collected.get("project_interest", ""),
                        "appointmentType": collected.get("appointmentType", "Information"),
                        "notes": (
                            f"Lead created via AI Chatbot\n"
                            f"Interest: {collected.get('project_interest', '')}\n"
                            f"Type: {collected.get('item_type', 'property')}\n"
                            f"Item ID: {collected.get('item_id', 'N/A')}\n"
                            f"Preference: {collected.get('appointmentType', 'Information')}"
                        )
                    }
                    print(f"[ChatAPI] Creating lead with payload: {payload}")
                    try:
                        result = await create_lead(payload, tenant_id)
                        print(f"[ChatAPI] Lead creation result: {result}")

                        if result.get("error"):
                            return ChatResponse(
                                response=(
                                    f"⚠️ I've recorded your details but couldn't sync with our CRM right now.\n\n"
                                    f"Don't worry — our team has your info and will reach out to **{collected.get('name')}** at **{collected.get('phone')}** soon.\n\n"
                                    f"Is there anything else I can help you with?"
                                ),
                                intent="lead_creation_complete",
                                source="leadrat_api",
                                metadata={"lead_data": collected, "error": result.get("error")},
                                flow_state={}
                            )

                        return ChatResponse(
                            response=(
                                f"✅ **Request submitted successfully!**\n\n"
                                f"Our team will contact **{collected.get('name')}** at **{collected.get('phone')}** soon "
                                f"regarding your interest in **{collected.get('project_interest', 'this property')}**.\n\n"
                                f"Is there anything else I can help you with?"
                            ),
                            intent="lead_creation_complete",
                            source="leadrat_api",
                            metadata={"lead_id": result.get("id"), "lead_data": collected},
                            flow_state={}
                        )
                    except Exception as e:
                        print(f"[ChatAPI] Lead creation error: {e}")
                        return ChatResponse(
                            response=(
                                f"⚠️ I've noted your interest. Our team will reach out to "
                                f"**{collected.get('name')}** at **{collected.get('phone')}** shortly.\n\n"
                                f"Is there anything else I can help you with?"
                            ),
                            intent="lead_creation_complete",
                            source="leadrat_api",
                            flow_state={}
                        )
                elif is_cancel:
                    return ChatResponse(
                        response="No problem, I've cancelled the request. What else can I help you with?",
                        intent="general",
                        source="leadrat_api",
                        flow_state={}
                    )
                else:
                    return ChatResponse(
                        response="Please confirm with **Yes** to proceed or **Cancel** to abort.",
                        intent="lead_creation_confirm",
                        source="leadrat_api",
                        metadata={"quickReplies": ["✅ Yes, proceed", "❌ Cancel"]},
                        flow_state=flow_state
                    )

            # Handle collecting a field
            # Override flow steps for natural language
            if current_step == "get_name":
                # Basic validation - require at least 2 characters
                if len(message.strip()) < 2:
                    return ChatResponse(
                        response="Please share your full name so I can personalize your experience.",
                        intent="lead_creation_step",
                        source="leadrat_api",
                        flow_state=flow_state
                    )
                collected["name"] = message.strip()
                flow_state["current_step"] = "get_phone"
                flow_state["collected"] = collected
                return ChatResponse(
                    response=f"Thanks **{collected['name']}**! Could you please share your phone number so our team can reach out?",
                    intent="lead_creation_step",
                    source="leadrat_api",
                    flow_state=flow_state
                )
            elif current_step == "get_phone":
                phone = re.sub(r"\D", "", message)
                if len(phone) < 10:
                    return ChatResponse(
                        response="Please provide a valid phone number (at least 10 digits).",
                        intent="lead_creation_step",
                        source="leadrat_api",
                        flow_state=flow_state
                    )
                collected["phone"] = phone
                flow_state["current_step"] = "get_appointment"
                flow_state["collected"] = collected
                return ChatResponse(
                    response=(
                        f"Perfect! How would you like to proceed?\n\n"
                        f"Choose one option below:"
                    ),
                    intent="lead_creation_step",
                    source="leadrat_api",
                    metadata={"quickReplies": ["📞 Schedule a Callback", "🏠 Schedule a Site Visit", "💬 Just need information"]},
                    flow_state=flow_state
                )
            elif current_step == "get_appointment":
                msg_lower = message.lower()
                if "callback" in msg_lower or "call" in msg_lower:
                    collected["appointmentType"] = "Callback"
                elif "visit" in msg_lower or "site" in msg_lower:
                    collected["appointmentType"] = "Site Visit"
                else:
                    collected["appointmentType"] = "Information"
                flow_state["current_step"] = "confirm"
                flow_state["collected"] = collected
                appt = collected["appointmentType"]
                return ChatResponse(
                    response=(
                        f"Great! Here's a summary:\n\n"
                        f"👤 **Name:** {collected.get('name')}\n"
                        f"📞 **Phone:** {collected.get('phone')}\n"
                        f"🏠 **Interested in:** {collected.get('project_interest')}\n"
                        f"📋 **Preference:** {appt}\n\n"
                        f"Shall I proceed and have our team contact you?"
                    ),
                    intent="lead_creation_confirm",
                    source="leadrat_api",
                    metadata={"quickReplies": ["✅ Yes, proceed", "❌ Cancel"]},
                    flow_state=flow_state
                )

        # ── INTENT DETECTION ───────────────────────────────
        semantics = await extract_semantics(message, history)
        module = semantics.get("module", "general")
        intent = semantics.get("intent", "query")
        filters = semantics.get("filters", {})
        
        print(f"[ChatAPI] Detected Module: {module} | Intent: {intent} | Filters: {filters}")

        # ── PROPERTY FLOW ──────────────────────────────────
        if module == "property" or any(kw in message.lower() for kw in ["properties", "flat", "apartment", "villa", "bhk"]):
            res = await get_properties(tenant_id=tenant_id)
            items = res.get("data", [])
            filtered = filter_properties(items, filters)
            
            if not filtered and items:
                # If no exact match, show nearest matches (top 3)
                return ChatResponse(
                    response="I couldn't find an exact match for your criteria, but here are the closest options available:",
                    intent="property",
                    source="leadrat_api",
                    template="property_list",
                    data=items[:3]
                )
            
            if filtered:
                count = len(filtered)
                msg = f"I found {count} properties matching your interest:" if count > 1 else "I found this property for you:"
                return ChatResponse(
                    response=msg,
                    intent="property",
                    source="leadrat_api",
                    template="property_list",
                    data=filtered[:10]
                )
            else:
                return ChatResponse(
                    response="I couldn't find any properties at the moment. Would you like to speak with an agent?",
                    intent="property",
                    source="leadrat_api"
                )

        # ── PROJECT FLOW ───────────────────────────────────
        if module == "project" or any(kw in message.lower() for kw in ["projects", "ongoing"]):
            res = await get_projects(tenant_id=tenant_id)
            items = res.get("data", [])
            filtered = filter_projects(items, filters)
            
            if filtered:
                return ChatResponse(
                    response=f"I found {len(filtered)} projects for you:",
                    intent="project",
                    source="leadrat_api",
                    template="project_list",
                    data=filtered[:10]
                )
            else:
                return ChatResponse(
                    response="I couldn't find any projects matching your criteria.",
                    intent="project",
                    source="leadrat_api"
                )

        # ── APPOINTMENT FLOW ───────────────────────────────
        if module == "appointment" or any(kw in message.lower() for kw in ["book", "appointment", "visit", "callback", "schedule"]):
            first_step = get_next_step({})
            return ChatResponse(
                response="I'd be happy to help you schedule that. May I know your name first?",
                intent="lead_creation_step",
                source="leadrat_api",
                flow_state={
                    "active_flow": "create_lead",
                    "current_step": "get_name",
                    "collected": {"appointmentType": "Callback"}
                }
            )

        # ── GENERAL / RAG ──────────────────────────────────
        rag_context = await hybrid_search(message, "general", filters)
        response_text = await generate_response(message, rag_context, "general", history)
        
        return ChatResponse(
            response=response_text,
            intent="general",
            source="ollama_rag",
            rag_used=bool(rag_context)
        )

    except Exception as e:
        logger.error("chat_error", error=str(e), exc_info=True)
        return ChatResponse(
            response="I'm sorry, I encountered an error. How else can I help you?",
            intent="error",
            source="fallback"
        )
