"""
Leadrat CRM API client with automatic token generation.
Uses API Key/Secret for auto-token generation with manual JWT fallback.
"""

import os
import httpx
import json
import time
import re
from typing import Optional, Dict, Any, List

# ============================================================================
# Leadrat API Configuration
# ============================================================================
LEADRAT_BASE_URL = os.getenv("LEADRAT_BASE_URL", "https://prd-lrb-webapi.leadrat.com")
LEADRAT_AUTH_URL = "https://connect.leadrat.com/api/v1/authentication/token"
LEADRAT_TENANT_ID = os.getenv("LEADRAT_TENANT", "dubait11")
LEADRAT_API_KEY = os.getenv("LEADRAT_API_KEY", "")
LEADRAT_SECRET_KEY = os.getenv("LEADRAT_SECRET_KEY", "")
LEADRAT_TOKEN_MANUAL = os.getenv("LEADRAT_TOKEN", "")

# Token caching
_cached_token = None
_token_expires_at = 0

# Data caching
_property_cache = {"data": [], "timestamp": 0, "tenant": None}
_project_cache = {"data": [], "timestamp": 0, "tenant": None}
CACHE_EXPIRY = 600  # 10 minutes


async def get_token() -> tuple[Optional[str], str]:
    """Get valid token (auto-generated or manual fallback)."""
    global _cached_token, _token_expires_at

    if _cached_token and time.time() < _token_expires_at:
        return _cached_token, ""

    if LEADRAT_API_KEY and LEADRAT_SECRET_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    LEADRAT_AUTH_URL,
                    headers={
                        "tenant": LEADRAT_TENANT_ID,
                        "Content-Type": "application/json"
                    },
                    json={
                        "apiKey": LEADRAT_API_KEY,
                        "secretKey": LEADRAT_SECRET_KEY
                    }
                )

                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("succeeded"):
                        token = data.get("data", {}).get("accessToken")
                        expires_in = data.get("data", {}).get("expiresIn", 3600)
                        if token:
                            _cached_token = token
                            _token_expires_at = time.time() + expires_in - 60
                            print(f"[LeadRat API] [OK] Token auto-generated successfully")
                            return token, ""
        except Exception as e:
            print(f"[LeadRat API] [ERROR] Auto token generation failed: {str(e)}")

    if LEADRAT_TOKEN_MANUAL and LEADRAT_TOKEN_MANUAL.strip():
        print(f"[LeadRat API] [WARN] Using manual token (auto-generation unavailable)")
        return LEADRAT_TOKEN_MANUAL, ""

    error_msg = "LeadRat authentication unavailable. Check credentials."
    return None, error_msg


async def validate_token() -> tuple[bool, str]:
    token, error = await get_token()
    return (token is not None), error


async def get_headers(tenant_id: str = None) -> Optional[dict]:
    token, error = await get_token()
    if not token:
        print(f"[LeadRat API] [ERROR] {error}")
        return None

    tenant = tenant_id or LEADRAT_TENANT_ID
    if tenant == "dubai11":
        tenant = "dubait11"
        
    return {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
        "tenant": tenant,
        "Referer": f"https://{tenant}.leadrat.com/",
    }


def log_api_call(endpoint: str, method: str, params: dict = None, status: int = None,
                 response_preview: str = None, data_count: int = None):
    print(f"[LeadRat API] {method} {endpoint} | Status: {status} | Items: {data_count}")


def _parse_price(price_str: Any) -> int:
    """Extract numeric budget from price string."""
    if isinstance(price_str, (int, float)):
        return int(price_str)
    if not price_str or not isinstance(price_str, str):
        return 0
    
    clean = price_str.lower().replace(",", "").replace(" ", "")
    
    # Handle Lac/Lakh
    if "lac" in clean or "lakh" in clean:
        val = re.findall(r"(\d+\.?\d*)", clean)
        if val:
            return int(float(val[0]) * 100000)
    
    # Handle Crore
    if "cr" in clean or "crore" in clean:
        val = re.findall(r"(\d+\.?\d*)", clean)
        if val:
            return int(float(val[0]) * 10000000)
            
    val = re.findall(r"(\d+)", clean)
    return int(val[0]) if val else 0


def _extract_bhk(text: str) -> Optional[int]:
    """Extract BHK number from text."""
    if not text: return None
    match = re.search(r"(\d)\s*bhk", text.lower())
    return int(match.group(1)) if match else None


# ============================================================================
# PROPERTY APIS
# ============================================================================

async def get_properties(filters: dict = None, tenant_id: str = None, force_refresh: bool = False) -> dict:
    """Get properties with caching and normalization."""
    global _property_cache
    tenant_id = tenant_id or LEADRAT_TENANT_ID
    filters = filters or {}

    # Check cache
    if not force_refresh and _property_cache["data"] and \
       time.time() - _property_cache["timestamp"] < CACHE_EXPIRY and \
       _property_cache["tenant"] == tenant_id:
        print("[LeadRat API] Using cached properties")
        return {"data": _property_cache["data"], "total": len(_property_cache["data"])}

    is_valid, error_msg = await validate_token()
    if not is_valid:
        return {"data": [], "total": 0, "error": error_msg}

    try:
        headers = await get_headers(tenant_id=tenant_id)
        if not headers: return {"data": [], "total": 0, "error": "Auth failed"}

        async with httpx.AsyncClient(timeout=30, verify=False) as client:
            resp = await client.get(
                "https://connect.leadrat.com/api/v1/property",
                headers=headers,
                params={"pageNumber": 1, "pageSize": 100}
            )

            if resp.status_code != 200:
                return {"data": [], "total": 0, "error": f"API Error {resp.status_code}"}

            raw_data = resp.json()
            raw_items = raw_data.get("items", []) or raw_data.get("data", []) or []
            
            mapped_items = []
            for item in raw_items:
                title = item.get("propertyTitle") or item.get("name") or "Property"
                price_str = item.get("price") or item.get("formattedPrice", "0")
                p_type = item.get("propertyType", {}).get("displayName", "N/A") if isinstance(item.get("propertyType"), dict) else item.get("propertyType", "N/A")
                
                mapped_items.append({
                    "id": item.get("id"),
                    "title": title,
                    "location": item.get("location") or item.get("address", "N/A"),
                    "type": p_type,
                    "propertyType": p_type,
                    "price": price_str,
                    "budget": _parse_price(price_str),
                    "bhk": _extract_bhk(title) or _extract_bhk(item.get("description", "")),
                    "status": "Active" if item.get("isActive") else "Inactive",
                    "description": item.get("description", ""),
                    "source": "leadrat_api"
                })

            # Update cache
            _property_cache = {
                "data": mapped_items,
                "timestamp": time.time(),
                "tenant": tenant_id
            }
            
            return {"data": mapped_items, "total": len(mapped_items)}

    except Exception as e:
        return {"data": [], "total": 0, "error": str(e)}


# ============================================================================
# PROJECT APIS
# ============================================================================

async def get_projects(filters: dict = None, tenant_id: str = None, force_refresh: bool = False) -> dict:
    """Get projects with caching and normalization."""
    global _project_cache
    tenant_id = tenant_id or LEADRAT_TENANT_ID
    
    if not force_refresh and _project_cache["data"] and \
       time.time() - _project_cache["timestamp"] < CACHE_EXPIRY and \
       _project_cache["tenant"] == tenant_id:
        return {"data": _project_cache["data"], "total": len(_project_cache["data"])}

    try:
        headers = await get_headers(tenant_id=tenant_id)
        async with httpx.AsyncClient(timeout=30, verify=False) as client:
            resp = await client.get(
                "https://connect.leadrat.com/api/v1/project",
                headers=headers,
                params={"pageNumber": 1, "pageSize": 100}
            )
            
            if resp.status_code != 200:
                return {"data": [], "total": 0, "error": f"API Error {resp.status_code}"}

            raw_data = resp.json()
            raw_items = raw_data.get("items", []) or raw_data.get("data", []) or []
            
            mapped_items = []
            for item in raw_items:
                mapped_items.append({
                    "id": item.get("id"),
                    "name": item.get("projectName") or item.get("name") or "Project",
                    "location": item.get("location", "N/A"),
                    "projectType": item.get("projectType") or "N/A",
                    "status": item.get("status") or "Active",
                    "description": item.get("description", ""),
                    "source": "leadrat_api"
                })

            _project_cache = {
                "data": mapped_items,
                "timestamp": time.time(),
                "tenant": tenant_id
            }
            return {"data": mapped_items, "total": len(mapped_items)}
    except Exception as e:
        return {"data": [], "total": 0, "error": str(e)}


# ============================================================================
# LEAD APIS
# ============================================================================

async def create_lead(payload: dict, tenant_id: str = None) -> dict:
    """Create a lead in Leadrat CRM.

    Tries multiple field-name combinations since Leadrat's lead endpoint
    is undocumented and returns 500 on missing required fields.
    """
    tenant_id = tenant_id or LEADRAT_TENANT_ID
    headers = await get_headers(tenant_id=tenant_id)
    if not headers:
        return {"error": "Auth failed"}

    name = payload.get("name", "").strip()
    name_parts = name.split(" ", 1)
    first_name = name_parts[0] if name_parts else name
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    phone = payload.get("phone", "").replace("+", "").replace(" ", "").replace("-", "")

    notes_text = (
        f"Source: AI Chatbot\n"
        f"Interested In: {payload.get('projectInterest', 'N/A')}\n"
        f"Preference: {payload.get('appointmentType', 'Information')}\n"
        f"Budget: {payload.get('budget', 'N/A')}"
    )

    # Try comprehensive payload first
    leadrat_payload = {
        "firstName": first_name,
        "lastName": last_name or "Lead",
        "name": name,
        "contactNo": phone,
        "phoneNumber": phone,
        "mobileNumber": phone,
        "email": payload.get("email", "") or f"{phone}@chatbot.lead",
        "source": payload.get("source", "AI Chatbot"),
        "notes": notes_text,
        "description": notes_text,
        "remarks": notes_text,
    }

    print(f"[LeadRat API] POST /api/v1/lead with payload: {leadrat_payload}")
    try:
        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.post(
                f"{LEADRAT_BASE_URL}/api/v1/lead",
                json=leadrat_payload,
                headers=headers
            )
            print(f"[LeadRat API] Lead create status: {resp.status_code}")
            print(f"[LeadRat API] Lead create response: {resp.text[:300]}")

            if resp.status_code in (200, 201):
                return resp.json()
            return {
                "error": f"Leadrat API error {resp.status_code}",
                "leadrat_response": resp.text[:200],
                "lead_data_captured": leadrat_payload
            }
    except Exception as e:
        print(f"[LeadRat API] Lead create exception: {e}")
        return {"error": str(e), "lead_data_captured": leadrat_payload}


async def get_leads(filters: dict = None, tenant_id: str = None) -> dict:
    """Get leads from Leadrat."""
    tenant_id = tenant_id or LEADRAT_TENANT_ID
    filters = filters or {}
    headers = await get_headers(tenant_id=tenant_id)
    if not headers: return {"data": [], "error": "Auth failed"}

    try:
        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.get(
                f"{LEADRAT_BASE_URL}/api/v1/lead",
                params={"pageNumber": filters.get("page", 1), "pageSize": filters.get("size", 50)},
                headers=headers
            )
            resp.raise_for_status()
            data = resp.json()
            return {"data": data.get("data", data if isinstance(data, list) else [])}
    except Exception as e:
        return {"data": [], "error": str(e)}


async def update_lead(lead_id: str, payload: dict, tenant_id: str = None) -> dict:
    """Update a lead in Leadrat."""
    tenant_id = tenant_id or LEADRAT_TENANT_ID
    headers = await get_headers(tenant_id=tenant_id)
    if not headers: return {"error": "Auth failed"}

    try:
        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.put(
                f"{LEADRAT_BASE_URL}/api/v1/lead/{lead_id}",
                json=payload,
                headers=headers
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        return {"error": str(e)}
