"""WhatsApp message response builder."""

from langchain_core.language_models import BaseLLM

from app.utils.logger import get_logger

logger = get_logger(__name__)


async def build_whatsapp_response(
    llm: BaseLLM,
    intent: str,
    message: str,
    context: dict,
    tenant_id: str,
) -> dict:
    """
    Build WhatsApp response using LLM.

    Args:
        llm: Language model instance
        intent: Classified intent
        message: Original user message
        context: Additional context (properties, projects, etc.)
        tenant_id: Tenant context

    Returns:
        dict: Response with text, type (text/list/buttons), and metadata
    """
    prompt = f"""You are a WhatsApp chatbot for a real estate builder.
Intent: {intent}
User message: {message}
Context: {context}

Generate a helpful, concise WhatsApp response (max 1000 chars).
Be professional and helpful."""

    try:
        response = llm.invoke(prompt)
        logger.info("response_built", intent=intent)
        return {
            "text": response.content,
            "type": "text",  # Can be: text, list, buttons, media
            "quick_replies": [],
        }
    except Exception as e:
        logger.error("response_build_failed", error=str(e))
        return {
            "text": "Thank you for your message. We'll get back to you soon.",
            "type": "text",
            "quick_replies": [],
        }
