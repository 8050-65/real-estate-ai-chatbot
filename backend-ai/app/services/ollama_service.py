"""
Ollama semantic extraction and response generation service.
Uses llama3.2 to extract structured intent/filters and generate natural responses.
"""

import httpx
import json
import re
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


async def extract_semantics(user_message: str, history: list = None) -> dict:
    """
    Use Ollama to extract structured intent and filters from user message.
    Returns JSON with module, intent, entity_id, and filters.
    """
    history = history or []
    history_text = "\n".join([
        f"{m.get('role','user').upper()}: {m.get('content','')}"
        for m in history[-4:]
    ])

    prompt = f"""You are a CRM intent extractor for a real estate system.
Extract intent from the user message and return ONLY a raw JSON object.
No explanation. No markdown. No backticks. Just the JSON.

Special rules for filters:
- "budget": If user says "80 lac" or "80 lakh", set "maxPrice" to 8000000.
- "budget": If user says "1 crore", set "maxPrice" to 10000000.
- "bhk": Extract numeric value (e.g., "2BHK" -> 2).
- "location": Extract specific area/city.

Schema:
{{
  "module": "lead" | "property" | "project" | "appointment" | "general",
  "intent": "query" | "create" | "book" | "general",
  "entity_id": null,
  "filters": {{
    "location": null,
    "propertyType": null,
    "bhk": null,
    "minPrice": null,
    "maxPrice": null,
    "projectName": null
  }}
}}

Recent conversation:
{history_text if history_text else "No history"}

User message: {user_message}
"""

    try:
        async with httpx.AsyncClient(timeout=20, verify=False) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9
                    }
                }
            )
            resp.raise_for_status()
            raw = resp.json().get("response", "")

            # Strip markdown fences
            cleaned = raw.strip()
            cleaned = re.sub(r'^```json?\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)
            cleaned = cleaned.strip()

            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                # Try to extract JSON from response
                match = re.search(r'\{.*\}', cleaned, re.DOTALL)
                if match:
                    try:
                        return json.loads(match.group())
                    except:
                        pass
                # Fallback
                return {
                    "module": "general",
                    "intent": "general",
                    "entity_id": None,
                    "filters": {}
                }

    except Exception as e:
        print(f"Ollama extraction failed: {e}")
        return {
            "module": "general",
            "intent": "general",
            "entity_id": None,
            "filters": {}
        }


async def generate_response(
    user_message: str,
    context: str,
    module: str,
    history: list = None
) -> str:
    """
    Use Ollama to generate natural language response using RAG context.
    """
    history = history or []
    history_text = "\n".join([
        f"{m.get('role','user').upper()}: {m.get('content','')}"
        for m in history[-4:]
    ])

    system_prompts = {
        "lead": (
            "You are a real estate CRM assistant helping manage leads. "
            "Use only the provided context. Be concise and professional. "
            "Always mention lead name, status, and next action."
        ),
        "property": (
            "You are a real estate assistant helping find properties. "
            "Use only the provided context. Mention BHK, price, location, and availability."
        ),
        "project": (
            "You are a real estate assistant helping with projects. "
            "Use only the provided context. Mention project name, location, units, and price."
        ),
        "general": (
            "You are a helpful real estate CRM assistant. "
            "Answer based on the context provided. "
            "If no context, guide the user on what you can do."
        )
    }

    system = system_prompts.get(module, system_prompts["general"])

    prompt = f"""{system}

CONTEXT FROM DATABASE:
{context if context else "No specific data found."}

CONVERSATION HISTORY:
{history_text if history_text else "No history"}

USER: {user_message}

Respond naturally and helpfully based on the context.
ASSISTANT:"""

    try:
        async with httpx.AsyncClient(timeout=30, verify=False) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "num_predict": 300
                    }
                }
            )
            resp.raise_for_status()
            return resp.json().get("response", "I couldn't generate a response. Try again.").strip()

    except Exception as e:
        print(f"Ollama generation failed: {e}")
        return "I'm having trouble right now. Please try again."
