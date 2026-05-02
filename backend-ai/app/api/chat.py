"""
RAG + Ollama powered chat endpoint for real estate CRM.

Decision tree:
1. Detect if query needs live data (leads/properties/projects/status)
   → Return intent + tell frontend to call Leadrat API
2. Otherwise: Use RAG + Ollama to generate answer
   - Search ChromaDB for relevant context
   - Build prompt with RAG context
   - Call Ollama llama3.2 for response
3. Return AI-generated answer
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import structlog
from app.rag.retriever import get_retriever
from app.agents.llm_factory import get_llm
from app.config import settings
from app.services.leadrat_property import search_properties
from app.services.leadrat_project import get_projects
from langchain.schema import HumanMessage, SystemMessage

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    """Chat request model."""
    message: str
    session_id: str = "default"
    tenant_id: str = "dubait11"
    conversation_history: List[Dict] = []


class ChatResponse(BaseModel):
    """Chat response model."""
    response: Optional[str]
    intent: str
    source: str  # "leadrat_api", "ollama_rag", "ollama", "error"
    rag_used: bool = False
    needs_api_call: bool = False
    metadata: Dict = {}
    data: Optional[List[Dict]] = None  # Properties/projects data for frontend


# Keywords that indicate need for live Leadrat API data
LIVE_DATA_KEYWORDS = [
    'lead', 'leads', 'enquiry', 'enquiries', 'customer', 'customer',
    'property', 'properties', 'flat', 'flat', 'apartment', 'apartment',
    'project', 'projects', 'tower', 'tower', 'phase', 'phase',
    'schedule', 'visit', 'meeting', 'callback', 'booking', 'appointment',
    'status', 'progress', 'update',
    'show', 'list', 'find', 'search', 'display',
    'create', 'add', 'new',
]

# Intent detection keywords
INTENT_KEYWORDS = {
    'lead': ['lead', 'enquiry', 'customer', 'contact', 'person', 'individual'],
    'property': ['property', 'properties', 'flat', 'apartment', 'unit', 'bhk', 'villa', 'house', 'home'],
    'project': ['project', 'projects', 'development', 'tower', 'phase', 'complex'],
    'site_visit': ['schedule', 'visit', 'meeting', 'site', 'appointment', 'demo', 'show'],
    'status': ['status', 'progress', 'update', 'check', 'current'],
}


def detect_intent(message: str) -> str:
    """Detect user intent from message."""
    msg_lower = message.lower()

    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in msg_lower for kw in keywords):
            return intent

    return 'general'


def needs_live_data(message: str) -> bool:
    """Check if query needs live data from Leadrat."""
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in LIVE_DATA_KEYWORDS)


async def search_rag(query: str, tenant_id: str = "dubait11", top_k: int = 3) -> List[Dict]:
    """
    Search ChromaDB for relevant documents.

    Returns:
        List of {text, score, metadata} dicts
    """
    try:
        retriever = get_retriever()
        results = await retriever.semantic_search(
            query=query,
            tenant_id=tenant_id,
            top_k=top_k,
            score_threshold=0.3,
        )
        logger.debug("rag_search_success", query=query[:50], results=len(results))
        return results
    except Exception as e:
        logger.warning("rag_search_failed", query=query[:50], error=str(e))
        return []


async def call_ollama(
    message: str,
    rag_context: Optional[List[Dict]] = None,
    conversation_history: Optional[List[Dict]] = None,
) -> str:
    """
    Call Ollama llama3.2 with optional RAG context.

    Args:
        message: User message
        rag_context: List of RAG search results
        conversation_history: Recent chat history for context

    Returns:
        Generated response from Ollama
    """
    try:
        llm = get_llm()

        # System prompt
        system_msg = SystemMessage(content="""You are Aria, an AI Real Estate Assistant
for a CRM system. You help sales teams with:
- Property information (amenities, location, specifications)
- Project details (pricing, payment plans, timeline)
- RERA regulations and legal information
- Customer inquiries and follow-ups
- Market information and trends

Respond concisely and professionally. If you don't know something,
say so honestly. Do not make up property details or pricing.
Always be helpful and prompt customers to contact sales team for specific deals.""")

        # Build messages with history
        messages = [system_msg]

        # Add conversation history (last 6 turns = 3 back-and-forths)
        if conversation_history:
            for turn in conversation_history[-6:]:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role == "user":
                    messages.append(HumanMessage(content=content))
                else:
                    messages.append(HumanMessage(content=f"Assistant: {content}"))

        # Build user prompt with RAG context
        if rag_context:
            context_str = "\n\n".join([
                f"📍 {result.get('metadata', {}).get('source', 'Knowledge Base')}\n"
                f"{result.get('text', '')}\n"
                f"(Relevance: {result.get('score', 0):.1%})"
                for result in rag_context
            ])
            user_prompt = f"""Based on this information from our knowledge base:

{context_str}

---

Answer this question: {message}

If the knowledge base doesn't have enough information,
acknowledge what you know and suggest checking with
the sales team for specific details."""
        else:
            user_prompt = f"""{message}

Note: I don't have specific knowledge base data for this query.
I can provide general guidance, but for specific property/project details,
please check with the sales team."""

        messages.append(HumanMessage(content=user_prompt))

        # Call Ollama
        logger.debug("ollama_call_start", message=message[:50], rag_used=bool(rag_context))
        response = llm.invoke(messages)
        answer = response.content if hasattr(response, 'content') else str(response)

        logger.debug("ollama_call_complete", message=message[:50], response_len=len(answer))
        return answer

    except Exception as e:
        logger.error("ollama_call_failed", error=str(e), message=message[:50], exc_info=True)
        raise


@router.post("/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest) -> ChatResponse:
    """Chat message endpoint with fast-path property search and lead creation."""
    try:
        message = request.message.lower()
        tenant_id = request.tenant_id or "dubait11"

        # Check if user is expressing interest in a property
        if message.startswith('interested:'):
            property_name = message.replace('interested:', '', 1).strip()
            return ChatResponse(
                response=f"Great! I'm interested in helping you with {property_name}. To proceed, could you please share your name?",
                intent="lead_creation_name",
                source="embedded_mode_fast",
                needs_api_call=False,
                rag_used=False,
                metadata={"property_name": property_name}
            )

        # Check if user wants to find/search for properties
        property_keywords = ['property', 'properties', 'flat', 'apartment', 'flat', 'unit', 'bhk', 'house', 'home']
        is_property_search = any(kw in message for kw in property_keywords) and any(kw in message for kw in ['find', 'search', 'show', 'list', 'available'])

        if is_property_search:
            try:
                properties = await search_properties(tenant_id)
                # Return top 5 properties with minimal data
                properties_data = [
                    {"name": p.get("name") or p.get("title", "Property"), "id": p.get("id"), "bhk": p.get("bhk"), "price": p.get("price")}
                    for p in (properties or [])[:5]
                ]

                if properties_data:
                    response_text = f"Found {len(properties_data)} available properties. Here are the top ones:"
                    return ChatResponse(
                        response=response_text,
                        intent="property",
                        source="embedded_mode_fast",
                        needs_api_call=False,
                        rag_used=False,
                        metadata={"search_term": message},
                        data=properties_data
                    )
                else:
                    return ChatResponse(
                        response="Sorry, no properties are currently available. Please try again later.",
                        intent="general",
                        source="embedded_mode_fast",
                        needs_api_call=False,
                        rag_used=False
                    )
            except Exception as e:
                logger.warning("property_search_failed", error=str(e), tenant_id=tenant_id)
                return ChatResponse(
                    response="I'm having trouble accessing the property database. Please try again in a moment.",
                    intent="error",
                    source="embedded_mode_fast",
                    needs_api_call=False,
                    rag_used=False
                )

        # Check if user wants to find/search for projects
        project_keywords = ['project', 'projects', 'development', 'tower', 'phase', 'complex']
        is_project_search = any(kw in message for kw in project_keywords) and any(kw in message for kw in ['find', 'search', 'show', 'list'])

        if is_project_search:
            try:
                projects = await get_projects(tenant_id)
                # Return top 5 projects with minimal data
                projects_data = [
                    {"name": p.get("name") or p.get("title", "Project"), "id": p.get("id"), "location": p.get("location")}
                    for p in (projects or [])[:5]
                ]

                if projects_data:
                    response_text = f"Found {len(projects_data)} projects. Here are the top ones:"
                    return ChatResponse(
                        response=response_text,
                        intent="project",
                        source="embedded_mode_fast",
                        needs_api_call=False,
                        rag_used=False,
                        metadata={"search_term": message},
                        data=projects_data
                    )
                else:
                    return ChatResponse(
                        response="Sorry, no projects are currently available. Please try again later.",
                        intent="general",
                        source="embedded_mode_fast",
                        needs_api_call=False,
                        rag_used=False
                    )
            except Exception as e:
                logger.warning("project_search_failed", error=str(e), tenant_id=tenant_id)
                return ChatResponse(
                    response="I'm having trouble accessing the project database. Please try again in a moment.",
                    intent="error",
                    source="embedded_mode_fast",
                    needs_api_call=False,
                    rag_used=False
                )

        # Default: general conversation
        return ChatResponse(
            response="Hello! I'm Aria, your real estate assistant. I can help you find properties, projects, or create a lead. What would you like to do?",
            intent="general",
            source="embedded_mode",
            needs_api_call=False,
            rag_used=False,
        )
    except Exception as e:
        logger.error("chat_error", error=str(e), message=request.message[:50], exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_documents(q: str, n: int = 3, tenant_id: str = "dubait11"):
    """
    Test RAG search endpoint.

    Query: ?q=payment+plan&n=3
    """
    try:
        results = await search_rag(q, tenant_id=tenant_id, top_k=n)
        return {
            "query": q,
            "results": results,
            "count": len(results),
        }
    except Exception as e:
        logger.error("search_failed", query=q, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def health_check():
    """Check if chat endpoints are healthy."""
    try:
        # Quick LLM init check
        llm = get_llm()
        retriever = get_retriever()

        return {
            "status": "healthy",
            "llm_provider": settings.llm_provider,
            "llm_model": settings.ollama_model if settings.llm_provider == "ollama" else "configured",
            "rag_ready": True,
        }
    except Exception as e:
        logger.error("health_check_failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e),
        }
