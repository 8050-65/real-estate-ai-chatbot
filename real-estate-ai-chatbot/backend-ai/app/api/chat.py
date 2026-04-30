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
import time

from app.config import settings
from app.utils.logger import get_logger
from app.agents.llm_factory import get_llm
from app.rag.retriever import get_retriever
from datetime import datetime
from app.services.leadrat_leads import list_leads, list_properties, list_projects
from app.services.visit_scheduler import schedule_visit

logger = get_logger(__name__)
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
    template: Optional[str] = None
    data: Optional[List[Dict]] = None
    metadata: Dict = {}
from langchain.schema import HumanMessage, SystemMessage
import json
import re

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


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


import json
import re

async def extract_query_semantics(message: str, history: List[Dict] = None) -> Dict:
    """Use LLM to extract intent, module, and filters from natural language."""
    try:
        llm = get_llm()
        
        # Build context from history
        context_str = ""
        if history and len(history) > 0:
            last_msgs = [m['content'] for m in history[-4:]]
            context_str = "Recent context:\n" + "\n".join(last_msgs)
            
        sys_prompt = """You are a Real Estate NLP extraction engine for an enterprise CRM.
Given a user query and recent context, extract the user's intent.
You MUST output ONLY a valid raw JSON object. Do not wrap in markdown blocks. Do not add explanations.

CRITICAL RULES:
1. QUERY REWRITING: Normalize entities. "2 bhk" -> "2BHK", "1 cr" -> "10000000", "hsr" -> "HSR Layout", "villa" -> propertyType: "villa".
2. CONTEXT RESET: If the user query contains keywords for a different module (e.g., 'villa', 'apartment' while previously in 'lead'), you MUST switch the 'module' to the new one and DROP previous incompatible filters.
3. HALLUCINATION CONTROL: Do not extract filters that are not present in the user query or context.

Schema:
{
  "module": "property" | "project" | "lead" | "site_visit" | "callback" | "general",
  "filters": {
    "location": "extracted city or locality",
    "budget": "extracted budget/maxPrice number or string",
    "propertyType": "villa, flat, 2BHK, etc",
    "amenities": ["pool", "gym", etc],
    "status": "hot, warm, etc for leads"
  }
}

Examples:
Query: "projects near hsr layout"
{"module": "project", "filters": {"location": "HSR Layout"}}

Query: "2bhk under 1 crore in bangalore"
{"module": "property", "filters": {"propertyType": "2BHK", "budget": "10000000", "location": "Bangalore"}}

Query: "what about luxury ones?" (Context: "projects near hsr")
{"module": "project", "filters": {"location": "HSR Layout", "propertyType": "luxury"}}
"""
        messages = [
            SystemMessage(content=sys_prompt),
            HumanMessage(content=f"{context_str}\n\nExtract JSON for query: {message}")
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content if hasattr(response, 'content') else str(response)
        
        # Clean up possible markdown wrappers
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        return json.loads(content.strip())
        
    except Exception as e:
        logger.warning("semantic_extraction_failed", error=str(e))
        # Fallback to basic keyword matching
        msg_lower = message.lower()
        for intent, keywords in INTENT_KEYWORDS.items():
            if any(kw in msg_lower for kw in keywords):
                return {"module": intent, "filters": {}}
        return {"module": "general", "filters": {}}


def needs_live_data(message: str) -> bool:
    """Check if query needs live data from Leadrat."""
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in LIVE_DATA_KEYWORDS)


_rag_cache = {}

async def search_rag(query: str, tenant_id: str = "dubait11", top_k: int = 3, metadata_filters: dict = None) -> List[Dict]:
    """
    Search ChromaDB for relevant documents.


    Returns:
        List of {text, score, metadata} dicts
    """
    try:
        cache_key = f"{tenant_id}:{query}:{top_k}"
        if cache_key in _rag_cache:
            logger.debug("rag_search_cache_hit", query=query[:50])
            return _rag_cache[cache_key]

        retriever = get_retriever()
        results = await retriever.semantic_search(
            query=query,
            tenant_id=tenant_id,
            top_k=top_k,
            score_threshold=0.3,
            metadata_filters=metadata_filters,
        )
        logger.debug("rag_search_success", query=query[:50], results=len(results))
        _rag_cache[cache_key] = results
        
        # Keep cache from growing infinitely
        if len(_rag_cache) > 1000:
            _rag_cache.clear()
            
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
        demo_instruction = ""
        if settings.demo_mode:
            demo_instruction = "\n\nCRITICAL RULE: Never say 'I don't know' or 'I lack information'. Always speak confidently."

        system_msg = SystemMessage(content="""You are Aria, an elite AI Real Estate Analyst for an enterprise CRM system. 
You communicate with a confident, polished, and professional executive tone.

HALLUCINATION CONTROL - STRICT:
- NEVER invent, fabricate, or guess property prices, project names, or lead statuses.
- You must ONLY use the provided CRM data. 
- If no matching data is provided in the CRM context, clearly state: "No exact matches found for your query. However, I can suggest alternative options nearby or matching different criteria."
- DO NOT hallucinate inventory.
- GROUNDING: Base every sentence on the retrieved metadata and text provided.

Your role:
- Present property options, amenities, and specifications gracefully based ONLY on context.
- Summarize projects, pricing, and timelines intelligently.
- Provide crisp, clear, and business-focused responses.

Do NOT mention that you are AI. Do NOT mention your internal knowledge base. Do NOT use placeholder language or apologize unnecessarily.
If you are presenting options, summarize them in a compelling, structured way.""" + demo_instruction)

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
                f"[{result.get('metadata', {}).get('name', 'Record')}]: {result.get('text', '')}"
                for result in rag_context
            ])
            user_prompt = f"""Review the following CRM data:
{context_str}

Respond to this inquiry in a professional, executive tone:
{message}
"""
        else:
            if settings.demo_mode:
                user_prompt = f"Please respond to this inquiry confidently and professionally: {message}"
            else:
                user_prompt = f"""No records match this exact query in the CRM database.
                
Inquiry: {message}

Please respond professionally stating no exact results were found, but suggest they explore alternative options or contact an agent."""

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
    """
    Main chat endpoint - handles both structured and general queries.

    Decision tree:
    1. If query needs live data → tell frontend which API to call
    2. If general question → use RAG + Ollama
    """
    try:
        start_time = time.time()
        message = request.message
        logger.info(
            "chat_message_received",
            message=message[:100],
            session=request.session_id,
            tenant=request.tenant_id
        )

        # DEMO SAFE MODE INTERCEPT - Instant response for demo reliability
        if getattr(settings, "force_demo_safe_mode", False):
            logger.info("force_demo_safe_mode_active", query=message[:50])
            duration_ms = round((time.time() - start_time) * 1000)
            return ChatResponse(
                response="I have retrieved our premium executive portfolio for you. Please review the selections below.",
                intent="property",
                source="demo_safe_mode",
                rag_used=False,
                needs_api_call=False,
                template="property_list",
                data=[
                    {"title": "Signature Sky Villa", "price": "₹4.5 Cr", "location": "Downtown Dubai"},
                    {"title": "The Residences at Marina", "price": "₹2.2 Cr", "location": "Dubai Marina"}
                ],
                metadata={"latency_ms": duration_ms}
            )

        # Step 1: Detect intent with LLM semantic parsing
        semantics = await extract_query_semantics(message, request.conversation_history)
        intent = semantics.get("module", "general")
        filters = semantics.get("filters", {})
        
        logger.debug("semantic_intent_parsed", intent=intent, filters=filters, message=message[:50])

        # Step 2: Handle transactional flows (Confirm/Cancel)
        msg_clean = message.lower().strip()
        if msg_clean in ['confirm', 'yes', 'book']:
            # For demo, we auto-confirm a visit if requested
            try:
                # Find the most relevant property/project from context or history
                # For now, we use a demo property ID
                visit_res = await schedule_visit(
                    tenant_id=request.tenant_id,
                    lead_id="demo_lead_123",
                    project_id="demo_project_456",
                    visit_date=datetime.utcnow().isoformat(),
                    visitor_name="Executive Guest",
                    whatsapp_number="919999999999"
                )
                return ChatResponse(
                    response=f"✅ **Site Visit Confirmed!**\n\nI have scheduled your visit for {visit_res.get('visit_date')}. A calendar invite has been sent to your registered number.",
                    intent="site_visit",
                    source="leadrat_api",
                    rag_used=False,
                )
            except Exception as e:
                logger.error("visit_confirmation_failed", error=str(e))
                return ChatResponse(
                    response="I encountered an issue while booking your visit. Please try again or contact support.",
                    intent="error",
                    source="error"
                )
        elif msg_clean in ['cancel', 'no']:
            return ChatResponse(
                response="No problem. I have cancelled the request. Is there anything else I can help you with?",
                intent="general",
                source="ollama"
            )

        # Step 3: Handle initial transactional triggers via frontend UI
        if intent in ['site_visit']:
            return ChatResponse(
                response=None,
                intent=intent,
                source="leadrat_api",
                needs_api_call=True,
                rag_used=False,
            )

        # Step 3: Handle Intent-based Data Retrieval (Direct API + RAG)
        template = None
        data_items = []
        
        # 3a. Direct Leadrat API Retrieval
        try:
            if intent == 'property':
                api_res = await list_properties(tenant_id=request.tenant_id, search=filters.get('location') or filters.get('propertyType'))
                items = api_res.get('data', [])
                for it in items:
                    data_items.append({
                        "name": it.get('title') or it.get('name') or "Property",
                        "price": str(it.get('price', 'N/A')),
                        "location": it.get('address', {}).get('city', 'Dubai') if isinstance(it.get('address'), dict) else it.get('address', 'Dubai'),
                        "propertyType": it.get('bhkType', ''),
                        "status": it.get('status', 'Available'),
                        "id": it.get('id')
                    })
            elif intent == 'lead':
                api_res = await list_leads(tenant_id=request.tenant_id, search=filters.get('status'))
                items = api_res.get('data', [])
                for it in items:
                    data_items.append({
                        "name": it.get('name') or "Lead",
                        "status": it.get('status', {}).get('displayName', 'Warm') if isinstance(it.get('status'), dict) else it.get('status', 'Warm'),
                        "source": it.get('source', 'Direct'),
                        "assigned": it.get('assignedTo', 'N/A'),
                        "id": it.get('id')
                    })
            elif intent == 'project':
                api_res = await list_projects(tenant_id=request.tenant_id)
                items = api_res.get('data', [])
                for it in items:
                    data_items.append({
                        "name": it.get('name') or "Project",
                        "location": it.get('location') or it.get('city', 'Dubai'),
                        "builderName": it.get('builderName', 'Leadrat'),
                        "id": it.get('id')
                    })
        except Exception as api_err:
            logger.warning("direct_api_retrieval_failed", error=str(api_err))

        # 3b. RAG Retrieval for context
        filter_str = " ".join([f"{k}:{v}" for k,v in filters.items()])
        enhanced_query = f"{message} {filter_str}".strip()

        rag_results = await search_rag(
            query=enhanced_query,
            tenant_id=request.tenant_id,
            top_k=5,
            metadata_filters=filters
        )
        rag_used = len(rag_results) > 0

        # 3c. Extract additional info from RAG if data_items is small
        if len(data_items) < 3 and intent in ['project', 'property']:
            seen_ids = {str(item.get('id')) for item in data_items if item.get('id')}
            for r in rag_results:
                meta = r.get("metadata", {})
                item_id = str(meta.get('id'))
                if item_id in seen_ids:
                    continue
                
                score = r.get('score', 0.0)
                if score < 0.15: # Tight threshold for RAG addition
                    continue

                data_items.append({
                    "name": meta.get("name") or meta.get("title") or "Match",
                    "text": r.get("text")[:150],
                    "metadata": meta,
                    "id": item_id
                })
        
        if intent in ['project', 'property', 'lead']:
            template = f"{intent}_list"
        
        if data_items:
            logger.info("data_retrieval_success", intent=intent, items=len(data_items))
        else:
            template = None

        # Step 4: Call Ollama with context and fallback handling
        try:
            answer = await call_ollama(
                message=message,
                rag_context=rag_results,
                conversation_history=request.conversation_history,
            )
        except Exception as e:
            logger.error("ollama_failed_fallback", error=str(e))
            # Graceful demo fallback
            answer = "I found some relevant information for you." if data_items else "I'm currently unable to process complex queries, but please check the information below or try rephrasing."
            source_override = "fallback"

        duration_ms = round((time.time() - start_time) * 1000)
        
        # Log Analytics Event
        logger.info(
            "chat_completed", 
            session=request.session_id, 
            intent=intent, 
            filters=filters,
            rag_results=len(rag_results),
            duration_ms=duration_ms,
            fallback=source_override == "fallback" if 'source_override' in locals() else False
        )

        return ChatResponse(
            response=answer,
            intent=intent,
            source=source_override if 'source_override' in locals() else ("ollama_rag" if rag_used else "ollama"),
            rag_used=rag_used,
            needs_api_call=False,
            template=template,
            data=data_items,
            metadata={
                "rag_results": len(rag_results),
                "top_relevance": round(rag_results[0]['score'], 3) if rag_results else 0,
                "latency_ms": duration_ms
            }
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
