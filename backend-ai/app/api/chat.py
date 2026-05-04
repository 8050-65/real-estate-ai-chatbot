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
    get_projects, get_properties,
    _generate_filter_chips, _property_cache, _project_cache
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
    selectedItem: Optional[Dict] = None
    language: Optional[str] = "en"
    filter: Optional[Dict] = None


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
    filter_chips: Optional[List[Dict]] = None


def _parse_text_filters(message: str) -> Dict:
    """Extract filter criteria from natural language message."""
    f: Dict = {}
    msg = message.lower()

    # Location: "near X", "in X", "around X", "at X"
    loc_match = re.search(r'\b(?:near|in|around|at)\s+([a-z][a-z\s]{1,30}?)(?:\s+(?:under|below|above|with|\d)|$)', msg)
    if loc_match:
        f["location"] = loc_match.group(1).strip()

    # Budget: "under/below N lakh/lac/cr/crore"
    budget_match = re.search(r'\b(?:under|below|max|upto|up to)\s+(\d+\.?\d*)\s*(lakh|lac|cr|crore)', msg)
    if budget_match:
        val = float(budget_match.group(1))
        unit = budget_match.group(2)
        if "cr" in unit:
            f["maxPrice"] = int(val * 10_000_000)
        else:
            f["maxPrice"] = int(val * 100_000)

    # BHK: "2BHK", "3 bhk", "2 bedroom"
    bhk_match = re.search(r'(\d)\s*(?:bhk|bedroom)', msg)
    if bhk_match:
        f["bhk"] = int(bhk_match.group(1))

    # Status
    if "active" in msg:
        f["status"] = "Active"
    elif "inactive" in msg:
        f["status"] = "Inactive"

    # Property type
    for t in ("residential", "commercial", "villa", "apartment", "plot", "flat"):
        if t in msg:
            f["propertyType"] = t.capitalize()
            break

    return f


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
            filtered = [i for i in filtered if i.get("budget", 0) <= int(max_p)]
        except: pass

    bhk = filters.get("bhk")
    if bhk:
        try:
            filtered = [i for i in filtered if i.get("bhk") == int(bhk)]
        except: pass

    status = filters.get("status")
    if status:
        filtered = [i for i in filtered if (i.get("status") or "").lower() == status.lower()]

    p_type = filters.get("propertyType")
    if p_type:
        filtered = [i for i in filtered if p_type.lower() in (i.get("propertyType") or i.get("type") or "").lower()]

    return filtered


def filter_projects(items: List[Dict], filters: Dict) -> List[Dict]:
    """Filter projects based on extracted criteria."""
    filtered = items
    loc = filters.get("location")
    if loc:
        loc = loc.lower()
        filtered = [i for i in filtered if loc in (i.get("location") or "").lower() or loc in (i.get("name") or "").lower()]
    status = filters.get("status")
    if status:
        filtered = [i for i in filtered if (i.get("status") or "").lower() == status.lower()]
    p_type = filters.get("propertyType")
    if p_type:
        filtered = [i for i in filtered if p_type.lower() in (i.get("projectType") or i.get("type") or "").lower()]
    return filtered


@router.post("/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest) -> ChatResponse:
    try:
        message = request.message.strip()
        tenant_id = request.tenant_id or "dubait11"
        flow_state = request.flow_state or {}
        history = request.conversation_history or []

        print(f"[ChatAPI-START] Processing: {message[:30]} | Code version with filter_chips")
        print(f"[ChatAPI] Incoming message: {message} | Action: {request.action} | Type: {type(request.action)}")

        # ── APPLY FILTER ACTION (no Ollama, re-filter cached data) ──────────
        if request.action == "apply_filter":
            # Merge prior filters from flow_state with the new chip filter
            prior_filters: Dict = (flow_state.get("filters") or {}).copy()
            new_filter: Dict = request.filter or {}
            merged: Dict = {**prior_filters, **new_filter}

            # Determine kind from flow_state or cached data availability
            kind = flow_state.get("kind", "property")
            if kind == "project" or (not _property_cache["data"] and _project_cache["data"]):
                kind = "project"

            if kind == "project":
                all_items = _project_cache["data"] or []
                filtered = filter_projects(all_items, merged)
                chips = _generate_filter_chips(all_items, "project")
                template = "project_list"
                intent = "project"
            else:
                all_items = _property_cache["data"] or []
                filtered = filter_properties(all_items, merged)
                chips = _generate_filter_chips(all_items, "property")
                template = "property_list"
                intent = "property"

            if not filtered:
                return ChatResponse(
                    response="No results match this filter. Try a different combination.",
                    intent=intent,
                    source="filter",
                    filter_chips=chips,
                    flow_state={**flow_state, "filters": merged, "kind": kind}
                )

            label = new_filter.get("label", "your filter")
            return ChatResponse(
                response=f"Showing {len(filtered)} result(s) for **{label}**:",
                intent=intent,
                source="filter",
                template=template,
                data=filtered[:10],
                filter_chips=chips,
                flow_state={**flow_state, "filters": merged, "kind": kind}
            )

        # ── HANDLE STRUCTURED ACTIONS (INTERESTED ETC.) ─────
        # Strip leading non-word chars (emoji like ✅, whitespace) before pattern check so chips
        # such as "✅ Interested: Aamor" still trigger the lead flow even if the structured `action`
        # field is missing from the payload.
        normalized_msg = re.sub(r'^[^\w]+', '', message).lower()
        if (
            request.action == "interest_selected"
            or normalized_msg.startswith("interested:")
            or normalized_msg.startswith("i am interested")
        ):
            print(f"[ChatAPI] ✓ Detected interest_selected action, starting lead flow")
            item_name = request.selectedItemName or message.split(":", 1)[-1].strip()
            item_type = request.selectedItemType or ("property" if "property" in message.lower() else "project")

            # Build a short, human-friendly summary of the selected item to confirm context
            # before asking for personal info. Uses selectedItem (full object) when frontend passes it.
            item = request.selectedItem or {}
            summary_lines = [f"✨ Great choice! Here's what you've picked:", f"🏠 **{item_name}**"]
            location = item.get("location") or item.get("address") or item.get("city")
            if location and location != "N/A":
                summary_lines.append(f"📍 {location}")
            type_label = item.get("propertyType") or item.get("projectType") or item.get("type")
            if type_label and type_label != "N/A":
                summary_lines.append(f"🏷️ {type_label}")
            price = item.get("price") or item.get("formattedPrice")
            if price and str(price) not in ("0", "N/A"):
                summary_lines.append(f"💰 {price}")
            if item.get("bhk"):
                summary_lines.append(f"🛏️ {item['bhk']} BHK")
            if item.get("status"):
                summary_lines.append(f"✓ Status: {item['status']}")

            summary_lines.append("")
            summary_lines.append("To connect you with our team, may I know your **name**?")
            response_text = "\n".join(summary_lines)

            first_step = get_next_step({})
            return ChatResponse(
                response=response_text,
                intent="lead_creation_step",
                source="leadrat_api",
                flow_state={
                    "active_flow": "create_lead",
                    "current_step": "get_name",
                    "collected": {
                        "project_interest": item_name,
                        "item_type": item_type,
                        "item_id": request.selectedItemId,
                        "item_snapshot": {
                            "name": item_name,
                            "location": location,
                            "type": type_label,
                            "price": price,
                            "bhk": item.get("bhk"),
                            "status": item.get("status"),
                            "id": request.selectedItemId,
                        },
                    }
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

        # Merge any text-derived filters (free-form "2BHK near Jigani under 50 lakh")
        text_filters = _parse_text_filters(message)
        filters = {**text_filters, **filters}  # semantics wins on conflict

        print(f"[ChatAPI] Detected Module: {module} | Intent: {intent} | Filters: {filters}")

        # ── PROPERTY FLOW ──────────────────────────────────
        if module == "property" or any(kw in message.lower() for kw in ["properties", "flat", "apartment", "villa", "bhk"]):
            res = await get_properties(tenant_id=tenant_id)
            items = res.get("data", [])
            chips = _generate_filter_chips(items, "property")
            filtered = filter_properties(items, filters)

            if not filtered and items:
                return ChatResponse(
                    response="I couldn't find an exact match for your criteria, but here are the closest options available:",
                    intent="property",
                    source="leadrat_api",
                    template="property_list",
                    data=items[:3],
                    filter_chips=chips,
                    flow_state={"kind": "property"}
                )

            if filtered:
                count = len(filtered)
                msg = f"I found {count} properties matching your interest:" if count > 1 else "I found this property for you:"
                debug_info = f"<<<EDITED_BACKEND_CODE_LOADED: {len(chips)} chips>>>"
                import sys; print(f"[PROPERTY-PATH-EXECUTED] {len(chips)} chips", file=sys.stderr, flush=True)
                return ChatResponse(
                    response=msg + " " + debug_info,
                    intent="property",
                    source="leadrat_api",
                    template="property_list",
                    data=filtered[:10],
                    filter_chips=chips,
                    flow_state={"kind": "property"}
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
            chips = _generate_filter_chips(items, "project")
            filtered = filter_projects(items, filters)

            if filtered:
                return ChatResponse(
                    response=f"I found {len(filtered)} projects for you:",
                    intent="project",
                    source="leadrat_api",
                    template="project_list",
                    data=filtered[:10],
                    filter_chips=chips,
                    flow_state={"kind": "project"}
                )
            else:
                return ChatResponse(
                    response="I couldn't find any projects matching your criteria.",
                    intent="project",
                    source="leadrat_api",
                    filter_chips=chips,
                    flow_state={"kind": "project"}
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
