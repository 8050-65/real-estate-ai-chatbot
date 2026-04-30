"""LLM grounding - build context prompts with real CRM data."""

from app.config import settings
from app.agents.llm_factory import get_llm
from app.utils.logger import get_logger

logger = get_logger(__name__)


def build_crm_context(user_message: str, intent: str, crm_data: dict, history: list = None):
    """Build context prompt that grounds LLM in real CRM data."""

    if history is None:
        history = []

    # Format CRM data based on intent
    data_section = ""
    if intent == "lead" and crm_data.get("data"):
        leads = crm_data["data"][:5]
        if leads:
            data_section = "Available leads:\n"
            for lead in leads:
                data_section += f"- {lead.get('name', 'Unknown')} ({lead.get('phone', 'N/A')}) - Status: {lead.get('status', 'New')}\n"

    elif intent == "property" and crm_data.get("data"):
        props = crm_data["data"][:5]
        if props:
            data_section = "Available properties:\n"
            for prop in props:
                data_section += f"- {prop.get('name', 'Property')} - {prop.get('bhkType', 'N/A')} BHK - ₹{prop.get('price', 'On Request')}\n"

    elif intent == "project" and crm_data.get("data"):
        projects = crm_data["data"][:5]
        if projects:
            data_section = "Available projects:\n"
            for proj in projects:
                data_section += f"- {proj.get('name', 'Project')} ({proj.get('type', 'N/A')}) - {proj.get('status', 'Active')}\n"

    # Build conversation context
    history_section = ""
    if history:
        history_section = "Conversation so far:\n"
        for msg in history[-5:]:  # Last 5 messages
            history_section += f"- {msg['role']}: {msg['content'][:100]}...\n"

    # Build final prompt
    prompt = f"""You are an AI Real Estate CRM Assistant. Help the user with their query.

IMPORTANT: Ground your response in the real CRM data below. Do NOT make up data.

{f"Current Data:{data_section}" if data_section else "No data available for this query."}

{f"Conversation Context:{history_section}" if history_section else ""}

User: {user_message}

Respond conversationally and naturally. Reference specific data points. If no data, acknowledge that."""

    return prompt


async def generate_llm_response(user_message: str, intent: str, crm_data: dict, history: list = None):
    """Generate LLM response grounded in CRM data."""

    try:
        # Build context prompt
        prompt = build_crm_context(user_message, intent, crm_data, history)

        # Call Ollama LLM
        llm = get_llm()
        response = llm.invoke(prompt)

        logger.info("llm_response_generated", intent=intent, tokens=len(response.content.split()))
        return response.content

    except Exception as e:
        logger.error("llm_generation_failed", error=str(e), exc_info=True)
        # Fallback to None if LLM fails - caller will handle
        return None
