"""
Leadrat CRM API client with automatic token generation.
Uses API Key/Secret for auto-token generation with manual JWT fallback.
"""

import os
import httpx
import json
import time
from typing import Optional, Dict, Any

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


async def get_token() -> tuple[Optional[str], str]:
    """Get valid token (auto-generated or manual fallback).

    Returns:
        (token, error_message) - token is None if both methods fail
    """
    global _cached_token, _token_expires_at

    # Check if cached token is still valid
    if _cached_token and time.time() < _token_expires_at:
        return _cached_token, ""

    # Try auto-generation first
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
                            _token_expires_at = time.time() + expires_in - 60  # Refresh 60s before expiry
                            print(f"[LeadRat API] ✓ Token auto-generated successfully")
                            return token, ""
        except Exception as e:
            print(f"[LeadRat API] ✗ Auto token generation failed: {str(e)}")

    # Fall back to manual token
    if LEADRAT_TOKEN_MANUAL and LEADRAT_TOKEN_MANUAL.strip():
        print(f"[LeadRat API] ⚠ Using manual token (auto-generation unavailable)")
        return LEADRAT_TOKEN_MANUAL, ""

    # Both methods failed
    error_msg = (
        "⚠️ LeadRat authentication unavailable.\n"
        "Configure either:\n"
        "1. LEADRAT_API_KEY + LEADRAT_SECRET_KEY (for auto token generation)\n"
        "2. LEADRAT_TOKEN (manual Cognito JWT)\n"
        "See .env file for details."
    )
    return None, error_msg


async def validate_token() -> tuple[bool, str]:
    """Validate that a token is available."""
    token, error = await get_token()
    return (token is not None), error


async def get_headers(tenant_id: str = None) -> Optional[dict]:
    """Get headers for Leadrat API requests with Bearer token."""
    token, error = await get_token()
    if not token:
        print(f"[LeadRat API] ✗ {error}")
        return None

    tenant = tenant_id or LEADRAT_TENANT_ID
    if tenant == "dubai11":
        tenant = "dubait11" # Force correct tenant spelling
        
    auth_header = f"Bearer {token}"
    print(f"[LeadRat API] Authorization starts with Bearer: {auth_header.startswith('Bearer ')}")
    
    return {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "Authorization": auth_header,
        "tenant": tenant,
        "Referer": f"https://{tenant}.leadrat.com/",
    }


def log_api_call(endpoint: str, method: str, params: dict = None, status: int = None,
                 response_preview: str = None, data_count: int = None):
    """Log Leadrat API call details."""
    url = f"{LEADRAT_BASE_URL}{endpoint}"
    print(f"\n[LeadRat API] {method} {url}")
    print(f"[LeadRat API] Tenant: {LEADRAT_TENANT_ID}")
    if params:
        print(f"[LeadRat API] Params: {params}")
    if status:
        print(f"[LeadRat API] Status: {status}")
    if response_preview:
        print(f"[LeadRat API] Response: {response_preview[:200]}")
    if data_count is not None:
        print(f"[LeadRat API] Records returned: {data_count}")


# ============================================================================
# PROPERTY APIS
# ============================================================================

async def get_properties(filters: dict = None, tenant_id: str = None) -> dict:
    """Get properties from Leadrat API.

    Returns:
        {
            "data": [...properties...],
            "total": count,
            "error": error_message (if any)
        }
    """
    tenant_id = tenant_id or LEADRAT_TENANT_ID
    filters = filters or {}

    page_number = filters.get("page_number", 1)
    page_size = filters.get("page_size", 10)
    search = filters.get("search", "")

    # Check token availability
    is_valid, error_msg = await validate_token()
    if not is_valid:
        print(f"[LeadRat API] ✗ {error_msg}")
        return {"data": [], "total": 0, "error": error_msg}

    try:
        headers = await get_headers(tenant_id=tenant_id)
        if not headers:
            error_msg = "Failed to get authentication headers"
            print(f"[LeadRat API] ✗ {error_msg}")
            return {"data": [], "total": 0, "error": error_msg}

        params = {
            "pageNumber": page_number,
            "pageSize": page_size,
        }
        
        if search:
            params["PropertySearch"] = search

        endpoint = "/api/v1/property"
        log_api_call(endpoint, "GET", params)

        async with httpx.AsyncClient(timeout=30, verify=False) as client:
            resp = await client.get(
                f"https://connect.leadrat.com{endpoint}",
                headers=headers,
                params=params
            )

            log_api_call(endpoint, "GET", status=resp.status_code)

            # Handle authentication errors
            if resp.status_code == 401:
                error_msg = (
                    "⚠️ LeadRat token expired or unauthorized (401).\n"
                    "Please refresh your Cognito token and update LEADRAT_TOKEN in .env."
                )
                print(f"[LeadRat API] ✗ {error_msg}")
                print(f"[LeadRat API] Response: {resp.text[:300]}")
                return {"data": [], "total": 0, "error": error_msg}

            if resp.status_code == 403:
                error_msg = (
                    "⚠️ LeadRat token forbidden (403).\n"
                    "Your token doesn't have permission to access properties.\n"
                    "Please verify your token and user permissions."
                )
                print(f"[LeadRat API] ✗ {error_msg}")
                print(f"[LeadRat API] Response: {resp.text[:300]}")
                return {"data": [], "total": 0, "error": error_msg}

            if resp.status_code >= 500:
                error_msg = (
                    f"⚠️ LeadRat API server error ({resp.status_code}).\n"
                    "Please try again later or contact support."
                )
                print(f"[LeadRat API] ✗ {error_msg}")
                print(f"[LeadRat API] Response: {resp.text[:300]}")
                return {"data": [], "total": 0, "error": error_msg}

            if resp.status_code != 200:
                error_msg = (
                    f"⚠️ LeadRat API error ({resp.status_code}).\n"
                    f"{resp.text[:200]}"
                )
                print(f"[LeadRat API] ✗ {error_msg}")
                return {"data": [], "total": 0, "error": error_msg}

            raw_data = resp.json()
            raw_items = []
            
            if isinstance(raw_data, dict):
                raw_items = raw_data.get("items", []) or raw_data.get("data", []) or []
            elif isinstance(raw_data, list):
                raw_items = raw_data

            print(f"[LeadRat API] Response content length: {len(resp.content)}")
            print(f"[LeadRat API] Raw items count: {len(raw_items)}")

            mapped_items = []
            for item in raw_items:
                p_type = item.get("propertyType", {}).get("displayName", "N/A") if isinstance(item.get("propertyType"), dict) else item.get("propertyType", "N/A")
                mapped_items.append({
                    "id": item.get("id"),
                    "title": item.get("propertyTitle") or item.get("name") or "Property",
                    "location": item.get("location") or item.get("address", "N/A"),
                    "type": p_type,
                    "propertyType": p_type,
                    "price": item.get("price") or item.get("formattedPrice", "On Request"),
                    "status": "Active" if item.get("isActive") else "Inactive"
                })

            if mapped_items:
                print(f"[LeadRat API] First record preview: {json.dumps(mapped_items[0])[:150]}...")

            total = raw_data.get("totalCount", len(mapped_items)) if isinstance(raw_data, dict) else len(mapped_items)
            print(f"[LeadRat API] ✓ Mapped data count: {len(mapped_items)}")
            
            return {
                "data": mapped_items,
                "total": total
            }

    except httpx.TimeoutException:
        error_msg = "⚠️ LeadRat API request timed out. Please try again."
        print(f"[LeadRat API] ✗ {error_msg}")
        return {"data": [], "total": 0, "error": error_msg}
    except Exception as e:
        error_msg = f"⚠️ LeadRat API error: {str(e)}"
        print(f"[LeadRat API] ✗ {error_msg}")
        import traceback
        traceback.print_exc()
        return {"data": [], "total": 0, "error": error_msg}


# ============================================================================
# PROJECT APIS
# ============================================================================

async def get_projects(filters: dict = None, tenant_id: str = None) -> dict:
    """Get projects from Leadrat API.

    Returns:
        {
            "data": [...projects...],
            "total": count,
            "error": error_message (if any)
        }
    """
    tenant_id = tenant_id or LEADRAT_TENANT_ID
    filters = filters or {}

    page_number = filters.get("page_number", 1)
    page_size = filters.get("page_size", 10)
    search = filters.get("search", "")

    # Check token availability
    is_valid, error_msg = await validate_token()
    if not is_valid:
        print(f"[LeadRat API] ✗ {error_msg}")
        return {"data": [], "total": 0, "error": error_msg}

    try:
        headers = await get_headers(tenant_id=tenant_id)
        if not headers:
            error_msg = "Failed to get authentication headers"
            print(f"[LeadRat API] ✗ {error_msg}")
            return {"data": [], "total": 0, "error": error_msg}

        params = {
            "pageNumber": page_number,
            "pageSize": page_size,
        }
        
        if search:
            params["Search"] = search

        endpoint = "/api/v1/project"
        log_api_call(endpoint, "GET", params)

        async with httpx.AsyncClient(timeout=30, verify=False) as client:
            resp = await client.get(
                f"https://connect.leadrat.com{endpoint}",
                headers=headers,
                params=params
            )

            log_api_call(endpoint, "GET", status=resp.status_code)

            # Handle authentication errors
            if resp.status_code == 401:
                error_msg = (
                    "⚠️ LeadRat token expired or unauthorized (401).\n"
                    "Please refresh your Cognito token and update LEADRAT_TOKEN in .env."
                )
                print(f"[LeadRat API] ✗ {error_msg}")
                print(f"[LeadRat API] Response: {resp.text[:300]}")
                return {"data": [], "total": 0, "error": error_msg}

            if resp.status_code == 403:
                error_msg = (
                    "⚠️ LeadRat token forbidden (403).\n"
                    "Your token doesn't have permission to access projects.\n"
                    "Please verify your token and user permissions."
                )
                print(f"[LeadRat API] ✗ {error_msg}")
                print(f"[LeadRat API] Response: {resp.text[:300]}")
                return {"data": [], "total": 0, "error": error_msg}

            if resp.status_code >= 500:
                error_msg = (
                    f"⚠️ LeadRat API server error ({resp.status_code}).\n"
                    "Please try again later or contact support."
                )
                print(f"[LeadRat API] ✗ {error_msg}")
                print(f"[LeadRat API] Response: {resp.text[:300]}")
                return {"data": [], "total": 0, "error": error_msg}

            if resp.status_code != 200:
                error_msg = (
                    f"⚠️ LeadRat API error ({resp.status_code}).\n"
                    f"{resp.text[:200]}"
                )
                print(f"[LeadRat API] ✗ {error_msg}")
                return {"data": [], "total": 0, "error": error_msg}

            raw_data = resp.json()
            raw_items = []
            
            if isinstance(raw_data, dict):
                raw_items = raw_data.get("items", []) or raw_data.get("data", []) or []
            elif isinstance(raw_data, list):
                raw_items = raw_data

            print(f"[LeadRat API] Response content length: {len(resp.content)}")
            print(f"[LeadRat API] Raw items count: {len(raw_items)}")

            mapped_items = []
            for item in raw_items:
                mapped_items.append({
                    "id": item.get("id"),
                    "name": item.get("projectName") or item.get("name") or "Project",
                    "type": item.get("projectType") or "N/A",
                    "status": item.get("status") or "Active"
                })

            if mapped_items:
                print(f"[LeadRat API] First record preview: {json.dumps(mapped_items[0])[:150]}...")

            total = raw_data.get("totalCount", len(mapped_items)) if isinstance(raw_data, dict) else len(mapped_items)
            print(f"[LeadRat API] ✓ Mapped data count: {len(mapped_items)}")
            
            return {
                "data": mapped_items,
                "total": total
            }

    except httpx.TimeoutException:
        error_msg = "⚠️ LeadRat API request timed out. Please try again."
        print(f"[LeadRat API] ✗ {error_msg}")
        return {"data": [], "total": 0, "error": error_msg}
    except Exception as e:
        error_msg = f"⚠️ LeadRat API error: {str(e)}"
        print(f"[LeadRat API] ✗ {error_msg}")
        import traceback
        traceback.print_exc()
        return {"data": [], "total": 0, "error": error_msg}


# ============================================================================
# LEAD APIS
# ============================================================================

async def create_lead(payload: dict, tenant_id: str = None) -> dict:
    """Create a new lead in Leadrat."""
    tenant_id = tenant_id or LEADRAT_TENANT_ID

    # Check token availability
    is_valid, error_msg = await validate_token()
    if not is_valid:
        return {"error": error_msg}

    try:
        headers = await get_headers(tenant_id=tenant_id)
        if not headers:
            return {"error": "Failed to get authentication headers"}

        leadrat_payload = {
            "name": payload.get("name", ""),
            "contactNo": payload.get("phone", "").replace("+", ""),
            "alternateContactNo": payload.get("alternate_phone", ""),
            "email": payload.get("email", ""),
            "notes": f"Source: {payload.get('source', 'chatbot')}\nProject: {payload.get('projectInterest', '')}\nBudget: {payload.get('budget', '')}"
        }

        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.post(
                f"{LEADRAT_BASE_URL}/api/v1/lead",
                json=leadrat_payload,
                headers=headers
            )

            if resp.status_code in [401, 403]:
                return {"error": "LeadRat token expired or unauthorized"}

            resp.raise_for_status()
            data = resp.json()
            print(f"[LeadRat API] ✓ Lead created: {data}")
            return data
    except Exception as e:
        print(f"[LeadRat API] ✗ Create lead failed: {e}")
        return {"error": str(e)}


async def get_leads(filters: dict = None, tenant_id: str = None) -> dict:
    """Get leads from Leadrat."""
    tenant_id = tenant_id or LEADRAT_TENANT_ID
    filters = filters or {}

    # Check token availability
    is_valid, error_msg = await validate_token()
    if not is_valid:
        return {"data": [], "error": error_msg}

    try:
        headers = await get_headers(tenant_id=tenant_id)
        if not headers:
            return {"data": [], "error": "Failed to get authentication headers"}

        page_number = filters.get("page_number", 1)
        page_size = filters.get("page_size", 50)

        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.get(
                f"{LEADRAT_BASE_URL}/api/v1/lead/status",
                params={
                    "pageNumber": page_number,
                    "pageSize": page_size
                },
                headers=headers
            )

            if resp.status_code in [401, 403]:
                return {"data": [], "error": "LeadRat token expired or unauthorized"}

            resp.raise_for_status()
            data = resp.json()
            print(f"[LeadRat API] ✓ Got {len(data.get('data', []))} leads")
            return {"data": data.get("data", data if isinstance(data, list) else [])}
    except Exception as e:
        print(f"[LeadRat API] ✗ Get leads failed: {e}")
        return {"data": [], "error": str(e)}


async def update_lead(lead_id: str, payload: dict, tenant_id: str = None) -> dict:
    """Update a lead in Leadrat."""
    tenant_id = tenant_id or LEADRAT_TENANT_ID

    # Check token availability
    is_valid, error_msg = await validate_token()
    if not is_valid:
        return {"error": error_msg}

    try:
        headers = await get_headers(tenant_id=tenant_id)
        if not headers:
            return {"error": "Failed to get authentication headers"}

        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.put(
                f"{LEADRAT_BASE_URL}/api/v1/lead/status/{lead_id}",
                json=payload,
                headers=headers
            )

            if resp.status_code in [401, 403]:
                return {"error": "LeadRat token expired or unauthorized"}

            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"[LeadRat API] ✗ Update lead failed: {e}")
        return {"error": str(e)}
