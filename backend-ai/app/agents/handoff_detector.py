"""Detect when human handoff to support agent is needed."""

from app.utils.logger import get_logger

logger = get_logger(__name__)

# Keywords that trigger human handoff
ESCALATION_KEYWORDS = [
    "angry", "frustrated", "complaint", "problem", "issue",
    "speak to human", "talk to agent", "support", "help",
    "not working", "broken", "bug", "error",
]


async def detect_handoff_needed(
    intent: str,
    confidence: float,
    message: str,
    conversation_turn: int,
) -> tuple[bool, str]:
    """
    Determine if human handoff is needed.

    Triggers:
    - Low confidence classification (<0.6)
    - Explicit handoff request intent
    - Escalation keywords in message
    - Long conversation without resolution

    Args:
        intent: Classified intent
        confidence: Classification confidence (0-1)
        message: User message
        conversation_turn: Conversation turn number

    Returns:
        tuple: (should_handoff: bool, reason: str)
    """
    # Check explicit handoff request
    if intent == "human_handoff_request":
        logger.info("handoff_requested", reason="explicit_request")
        return True, "User requested to speak with support"

    # Check low confidence
    if confidence < 0.6:
        logger.info("handoff_triggered", reason="low_confidence", confidence=confidence)
        return True, f"Low confidence in response (confidence: {confidence:.2f})"

    # Check escalation keywords
    message_lower = message.lower()
    for keyword in ESCALATION_KEYWORDS:
        if keyword in message_lower:
            logger.info("handoff_triggered", reason="escalation_keyword", keyword=keyword)
            return True, f"Escalation detected (keyword: {keyword})"

    # Check conversation length
    if conversation_turn > 10:
        logger.info("handoff_triggered", reason="long_conversation", turns=conversation_turn)
        return True, "Lengthy conversation without resolution"

    return False, ""
