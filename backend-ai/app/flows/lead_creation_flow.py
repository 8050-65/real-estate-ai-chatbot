"""
Multi-step lead creation conversation flow.
Guides user through collecting lead information step-by-step.
"""

LEAD_CREATION_STEPS = [
    {
        "step": "ask_name",
        "question": "Great choice! I'd love to help you with that. May I know your name?",
        "field": "name",
        "validation": lambda v: len(v.strip()) >= 2,
        "error": "Please share your name so I can assist you better."
    },
    {
        "step": "ask_phone",
        "question": "Thanks! Could you please share your phone number? Our team will use this to contact you with more details.",
        "field": "phone",
        "validation": lambda v: len(v.strip().replace(' ', '').replace('-', '')) >= 10,
        "error": "Please provide a valid phone number so we can reach out."
    },
    {
        "step": "confirm",
        "question": None,  # Built dynamically
        "field": None
    }
]


def get_next_step(collected: dict) -> dict:
    """Get the next step in the lead creation flow."""
    for step in LEAD_CREATION_STEPS:
        if step["field"] and step["field"] not in collected:
            return step
    return LEAD_CREATION_STEPS[-1]  # confirm step


def build_confirmation_message(collected: dict) -> str:
    """Build a confirmation message with all collected data."""
    return (
        f"Thank you, {collected.get('name', '')}! I've noted your interest in {collected.get('project_interest', 'this property')}.\n\n"
        f"Shall I have our team contact you at {collected.get('phone', '-')}? [Yes] [No]"
    )


def build_leadrat_payload(collected: dict, tenant_id: str) -> dict:
    """Build the payload for Leadrat API lead creation."""
    email = collected.get('email', '')
    if email.lower() == 'skip':
        email = ''

    return {
        "name": collected.get('name', ''),
        "phone": collected.get('phone', ''),
        "email": email,
        "source": collected.get('source', 'Other'),
        "projectInterest": collected.get('project_interest', ''),
        "budget": collected.get('budget', ''),
        "status": "New",
        "tenantId": tenant_id
    }
