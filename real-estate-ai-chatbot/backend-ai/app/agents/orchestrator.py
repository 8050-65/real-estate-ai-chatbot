"""
LangGraph Orchestrator for WhatsApp Chatbot AI Agent.

Implements complete conversation flow with 11 nodes:
  load_session → classify_intent → fetch_property_data/fetch_project_data/rag_search
  → lead_capture → build_response → handoff_detection → save_session → send_whatsapp → END

Uses LLM provider from factory (no direct LLM instantiation).
"""

import json
import time
from typing import Any, TypedDict

from langgraph.graph import StateGraph, START, END
from langchain_core.language_models import BaseLLM

from app.agents.llm_factory import get_llm
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ChatbotState(TypedDict):
    """Complete state schema for orchestrator."""

    # Input
    whatsapp_number: str
    tenant_id: str
    incoming_message: str
    message_type: str  # text, image, audio
    message_id: str

    # Session & user
    session: dict
    lead_id: str | None

    # Intent classification
    intent: str
    confidence: float
    extracted_entities: dict

    # External API data
    leadrat_token: str
    property_results: list
    project_results: list
    lead_data: dict
    rag_context: str

    # Response
    response_text: str
    response_type: str  # text, list, buttons, media
    quick_replies: list
    media_to_send: dict

    # Flow control
    should_handoff: bool
    handoff_reason: str
    conversation_summary: str
    error: str | None


class WhatsAppChatbotOrchestrator:
    """LangGraph orchestrator for WhatsApp chatbot conversation flow."""

    def __init__(self):
        """Initialize orchestrator with LLM and compile state graph."""
        self.llm: BaseLLM = get_llm()
        self.graph = self._build_graph()
        logger.info("orchestrator_initialized", llm_provider=settings.llm_provider)

    def _build_graph(self) -> Any:
        """
        Build and compile LangGraph state graph.

        Flow:
          START → load_session → classify_intent
               → [conditional routing]
               → fetch_data (properties/projects/RAG)
               → lead_capture → build_response
               → handoff_detection → save_session
               → send_whatsapp → END
        """
        graph = StateGraph(ChatbotState)

        # Add all 11 nodes
        graph.add_node("load_session", self._load_session_node)
        graph.add_node("classify_intent", self._classify_intent_node)
        graph.add_node("fetch_property_data", self._fetch_property_data_node)
        graph.add_node("fetch_project_data", self._fetch_project_data_node)
        graph.add_node("rag_search", self._rag_search_node)
        graph.add_node("visit_booking", self._visit_booking_node)
        graph.add_node("lead_capture", self._lead_capture_node)
        graph.add_node("build_response", self._build_response_node)
        graph.add_node("handoff_detection", self._handoff_detection_node)
        graph.add_node("save_session", self._save_session_node)
        graph.add_node("send_whatsapp", self._send_whatsapp_node)

        # Define edges
        graph.add_edge(START, "load_session")
        graph.add_edge("load_session", "classify_intent")

        # Conditional routing based on intent
        graph.add_conditional_edges(
            "classify_intent",
            self._route_by_intent,
            {
                "property": "fetch_property_data",
                "project": "fetch_project_data",
                "rag": "rag_search",
                "booking": "visit_booking",
                "default": "build_response",
            },
        )

        # Convergent paths to lead_capture
        graph.add_edge("fetch_property_data", "lead_capture")
        graph.add_edge("fetch_project_data", "lead_capture")
        graph.add_edge("rag_search", "lead_capture")
        graph.add_edge("visit_booking", "lead_capture")
        graph.add_edge("build_response", "lead_capture")

        # Continue flow
        graph.add_edge("lead_capture", "build_response")
        graph.add_edge("build_response", "handoff_detection")
        graph.add_edge("handoff_detection", "save_session")
        graph.add_edge("save_session", "send_whatsapp")
        graph.add_edge("send_whatsapp", END)

        return graph.compile()

    def _route_by_intent(self, state: ChatbotState) -> str:
        """Route to appropriate handler based on classified intent."""
        intent = state.get("intent", "").lower()

        if intent in ["unit_availability", "pricing_inquiry"]:
            return "property"
        elif intent in ["project_discovery"]:
            return "project"
        elif intent in ["amenities_query", "rera_legal"]:
            return "rag"
        elif intent in ["site_visit_booking"]:
            return "booking"
        else:
            return "default"

    async def invoke(self, state: ChatbotState) -> ChatbotState:
        """
        Invoke orchestrator with incoming message state.

        Args:
            state: ChatbotState with incoming_message and context

        Returns:
            ChatbotState: Final state with response_text and response_type
        """
        logger.info(
            "orchestrator_invoke",
            whatsapp_number=state["whatsapp_number"],
            tenant_id=state["tenant_id"],
        )

        try:
            result = await self.graph.ainvoke(state)
            logger.info(
                "orchestrator_success",
                intent=result.get("intent"),
                response_type=result.get("response_type"),
            )
            return result
        except Exception as e:
            logger.error("orchestrator_error", error=str(e), exc_info=True)
            return {
                **state,
                "response_text": "Sorry, I encountered an error. Please try again.",
                "response_type": "text",
                "error": str(e),
            }

    # ========================================================================
    # Node Implementations (11 nodes for full conversation flow)
    # ========================================================================

    async def _load_session_node(self, state: ChatbotState) -> ChatbotState:
        """Load or create WhatsApp session from Redis."""
        logger.debug("load_session_start", whatsapp_number=state["whatsapp_number"])
        # TODO: Implement Redis session loading
        return state

    async def _classify_intent_node(self, state: ChatbotState) -> ChatbotState:
        """Classify message intent using configured LLM provider."""
        try:
            prompt = f"""Classify WhatsApp message intent concisely.
Message: {state["incoming_message"]}

Categories: project_discovery, unit_availability, pricing_inquiry, payment_plan,
amenities_query, rera_legal, site_visit_booking, document_request, offer_inquiry,
status_followup, human_handoff_request, out_of_scope

Return JSON: {{"intent": "...", "confidence": 0.0, "entities": {{}}}}"""

            response = self.llm.invoke(prompt)
            data = json.loads(response.content)

            return {
                **state,
                "intent": data.get("intent", "out_of_scope"),
                "confidence": float(data.get("confidence", 0.0)),
                "extracted_entities": data.get("entities", {}),
            }
        except Exception as e:
            logger.error("classify_intent_failed", error=str(e))
            return {**state, "intent": "out_of_scope", "confidence": 0.0, "extracted_entities": {}}

    async def _fetch_property_data_node(self, state: ChatbotState) -> ChatbotState:
        """Fetch property data from Leadrat based on extracted entities."""
        logger.debug("fetch_property_data", entities=state["extracted_entities"])
        # TODO: Implement Leadrat property API call with caching
        return state

    async def _fetch_project_data_node(self, state: ChatbotState) -> ChatbotState:
        """Fetch project data from Leadrat."""
        logger.debug("fetch_project_data")
        # TODO: Implement Leadrat project API call with caching
        return state

    async def _rag_search_node(self, state: ChatbotState) -> ChatbotState:
        """Search ChromaDB for relevant project documentation."""
        logger.debug("rag_search", query=state["incoming_message"])
        # TODO: Implement ChromaDB semantic search
        return state

    async def _visit_booking_node(self, state: ChatbotState) -> ChatbotState:
        """Handle site visit booking conversation flow."""
        logger.debug("visit_booking_start")
        # TODO: Implement multi-step visit booking flow
        return state

    async def _lead_capture_node(self, state: ChatbotState) -> ChatbotState:
        """Capture or update lead in Leadrat CRM."""
        logger.debug("lead_capture", whatsapp_number=state["whatsapp_number"])
        # TODO: Implement Leadrat lead creation/update
        return state

    async def _build_response_node(self, state: ChatbotState) -> ChatbotState:
        """Build WhatsApp-formatted response based on intent and data."""
        logger.debug("build_response", intent=state["intent"])
        # TODO: Implement response formatting with LLM
        return {
            **state,
            "response_text": "Thank you for your message. We'll get back to you soon.",
            "response_type": "text",
        }

    async def _handoff_detection_node(self, state: ChatbotState) -> ChatbotState:
        """Detect if human handoff is needed."""
        logger.debug("handoff_detection", confidence=state["confidence"])
        if state["confidence"] < 0.6 or state["intent"] == "human_handoff_request":
            return {
                **state,
                "should_handoff": True,
                "handoff_reason": f"Low confidence: {state['confidence']}",
            }
        return state

    async def _save_session_node(self, state: ChatbotState) -> ChatbotState:
        """Save updated session to Redis and conversation to database."""
        logger.debug("save_session", whatsapp_number=state["whatsapp_number"])
        # TODO: Implement Redis session + database logging
        return state

    async def _send_whatsapp_node(self, state: ChatbotState) -> ChatbotState:
        """Send WhatsApp response via Engageto API."""
        logger.debug("send_whatsapp", whatsapp_number=state["whatsapp_number"])
        # TODO: Implement Engageto WhatsApp send
        return state


# Global singleton orchestrator
_orchestrator: WhatsAppChatbotOrchestrator | None = None


def get_orchestrator() -> WhatsAppChatbotOrchestrator:
    """
    Get or create singleton orchestrator instance.

    Returns:
        WhatsAppChatbotOrchestrator: Orchestrator instance
    """
    global _orchestrator
    if _orchestrator is None:
        logger.info("creating_orchestrator")
        _orchestrator = WhatsAppChatbotOrchestrator()
    return _orchestrator


async def process_message(whatsapp_number: str, message: str, tenant_id: str) -> dict:
    """
    Process a WhatsApp message through the orchestrator.

    Args:
        whatsapp_number: WhatsApp number of the user
        message: Incoming message text
        tenant_id: Tenant context

    Returns:
        dict: Response with response_type and response_text
    """
    logger.info(
        "process_message_start",
        whatsapp_number=whatsapp_number,
        tenant_id=tenant_id,
        message=message[:50],
    )

    try:
        orchestrator = get_orchestrator()

        # Build initial state
        state: ChatbotState = {
            "whatsapp_number": whatsapp_number,
            "tenant_id": tenant_id,
            "incoming_message": message,
            "message_type": "text",
            "message_id": f"{whatsapp_number}_{int(time.time())}",
            "session": {},
            "lead_id": None,
            "intent": "",
            "confidence": 0.0,
            "extracted_entities": {},
            "leadrat_token": "",
            "property_results": [],
            "project_results": [],
            "lead_data": {},
            "rag_context": "",
            "response_text": "",
            "response_type": "text",
            "quick_replies": [],
            "media_to_send": {},
            "should_handoff": False,
            "handoff_reason": "",
            "conversation_summary": "",
            "error": None,
        }

        # Invoke orchestrator
        result = await orchestrator.invoke(state)

        return {
            "response_type": result.get("response_type", "text"),
            "response_text": result.get("response_text", "Thank you for your message."),
            "intent": result.get("intent", ""),
            "should_handoff": result.get("should_handoff", False),
        }

    except Exception as e:
        logger.error("process_message_failed", error=str(e), exc_info=True)
        return {
            "response_type": "text",
            "response_text": "Sorry, I encountered an error. Please try again.",
            "intent": "error",
            "should_handoff": True,
        }
