"""
Multi-step lead creation conversation flow.
Guides user through collecting lead information step-by-step.
"""

LEAD_CREATION_STEPS = [
    {
        "step": "ask_name",
        "question": "Sure! I'll help you create a new lead. What is the lead's full name?",
        "field": "name",
        "validation": lambda v: len(v.strip()) >= 2,
        "error": "Please enter a valid full name (at least 2 characters)."
    },
    {
        "step": "ask_phone",
        "question": "Got it! What is their phone number? (with country code, e.g. +91XXXXXXXXXX)",
        "field": "phone",
        "validation": lambda v: len(v.strip().replace(' ', '').replace('-', '')) >= 10,
        "error": "Please enter a valid phone number with at least 10 digits."
    },
    {
        "step": "ask_email",
        "question": "What is their email address? (or type 'skip' to skip)",
        "field": "email",
        "validation": lambda v: ('@' in v or v.lower().strip() == 'skip'),
        "error": "Please enter a valid email address or type 'skip'.",
        "optional": True
    },
    {
        "step": "ask_source",
        "question": "How did this lead come in? Choose one:\n1. Facebook\n2. Instagram\n3. Website\n4. Referral\n5. Walk-in\n6. Other",
        "field": "source",
        "options": ["Facebook", "Instagram", "Website", "Referral", "Walk-in", "Other"],
        "validation": lambda v: True,
        "map_number": True
    },
    {
        "step": "ask_project",
        "question": "Which project are they interested in? Type the project name or 'any'.",
        "field": "project_interest",
        "validation": lambda v: len(v.strip()) >= 1,
        "error": "Please enter a project name."
    },
    {
        "step": "ask_budget",
        "question": "What is their budget range? (e.g. '50L - 1Cr' or 'skip')",
        "field": "budget",
        "validation": lambda v: True,
        "optional": True
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
    email = collected.get('email', 'Not provided')
    if email and email.lower() == 'skip':
        email = 'Not provided'

    return (
        f"Please confirm the lead details:\n\n"
        f"👤 Name: {collected.get('name', '-')}\n"
        f"📞 Phone: {collected.get('phone', '-')}\n"
        f"📧 Email: {email}\n"
        f"📣 Source: {collected.get('source', '-')}\n"
        f"🏗️ Project Interest: {collected.get('project_interest', '-')}\n"
        f"💰 Budget: {collected.get('budget', 'Not specified')}\n\n"
        f"Shall I create this lead? [Yes] [No]"
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
