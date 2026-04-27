"""LLM endpoints for generating CRM-grounded responses."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.llm_grounding import generate_llm_response
from app.services.leadrat_leads import list_leads, list_properties, list_projects
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1", tags=["LLM"])


class LLMRequest(BaseModel):
    message: str
    intent: str  # lead, property, project, visit, analytics
    tenant_id: str = "dubait11"
    search_term: str = ""
    conversation_history: list = []


class LLMResponse(BaseModel):
    response: str
    intent: str
    sources: list = []


@router.post("/llm/generate")
async def generate_response(request: LLMRequest):
    """
    Generate LLM response grounded in real CRM data.

    Flow:
    1. Fetch real CRM data based on intent
    2. Build context prompt
    3. Call Ollama LLM
    4. Return dynamic response
    """
    try:
        logger.info("llm_request", intent=request.intent, message=request.message[:50])

        # Fetch real CRM data
        crm_data = {}
        if request.intent == "lead":
            crm_data = await list_leads(
                tenant_id=request.tenant_id,
                search=request.search_term,
                page_number=1,
                page_size=10
            )
        elif request.intent == "property":
            crm_data = await list_properties(
                tenant_id=request.tenant_id,
                search=request.search_term,
                page_number=1,
                page_size=10
            )
        elif request.intent == "project":
            crm_data = await list_projects(
                tenant_id=request.tenant_id,
                search=request.search_term,
                page_number=1,
                page_size=10
            )

        # Generate LLM response grounded in CRM data
        response_text = await generate_llm_response(
            user_message=request.message,
            intent=request.intent,
            crm_data=crm_data,
            history=request.conversation_history
        )

        if not response_text:
            raise HTTPException(status_code=500, detail="LLM generation failed")

        return LLMResponse(
            response=response_text,
            intent=request.intent,
            sources=["Leadrat API", "Ollama LLM"]
        )

    except Exception as e:
        logger.error("llm_endpoint_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
