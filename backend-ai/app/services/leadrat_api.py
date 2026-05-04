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


def _flatten_location(value: Any) -> str:
    """Coerce a LeadRat location field into a single display string.

    LeadRat returns location as either a plain string OR a nested object like:
      {id, placeId, subLocality, locality, district, city, state, country, ...,
       location, community, subCommunity, towerName}
    Rendering the object directly in JSX crashes React. This builds a comma-joined
    string from the most specific available parts, falling back to the raw value.
    """
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        # Some tenants put the formatted address in a nested 'location' key.
        nested = value.get("location")
        if isinstance(nested, str) and nested.strip():
            return nested.strip()
        # Otherwise, build "subLocality, locality, city, state, country" skipping blanks.
        parts = []
        for key in ("towerName", "subCommunity", "community", "subLocality", "locality", "district", "city", "state", "country"):
            v = value.get(key)
            if isinstance(v, str) and v.strip() and v.strip() not in parts:
                parts.append(v.strip())
        if parts:
            return ", ".join(parts)
        return ""
    # Lists or other types — best effort
    try:
        return str(value)
    except Exception:
        return ""


def _coerce_to_string(value: Any) -> str:
    """Defensive coercion — use for any field that might come back as an object/dict."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, dict):
        # Try common display keys
        for key in ("displayName", "name", "title", "value", "label"):
            v = value.get(key)
            if isinstance(v, str) and v.strip():
                return v
        return ""
    return str(value) if value else ""


def _generate_filter_chips(items: List[Dict], kind: str = "property") -> List[Dict]:
    """Generate filter chip options from the actual returned items."""
    if not items:
        return []

    chips: List[Dict] = []

    # ── Location chips (deduplicated, up to 6) ──────────────────────────────
    locations = set()
    for item in items:
        loc_raw = item.get("location") or ""
        if isinstance(loc_raw, dict):
            # Handle nested location object
            loc = loc_raw.get("locality") or loc_raw.get("city") or str(loc_raw)
        else:
            # Handle string location, extract first part before comma
            loc = str(loc_raw).split(",")[0].strip() if loc_raw else ""

        loc = loc.strip()
        if loc and loc.lower() != "n/a":
            locations.add(loc)

    for loc in sorted(list(locations))[:6]:
        chips.append({"type": "location", "value": loc, "label": f"📍 {loc}"})

    # ── BHK chips (property only) ────────────────────────────────────────────
    if kind == "property":
        bhk_values = sorted({item["bhk"] for item in items if item.get("bhk")})
        for b in bhk_values[:4]:
            chips.append({"type": "bhk", "value": b, "label": f"🛏️ {b} BHK"})

    # ── Budget chips derived from actual data ────────────────────────────────
    budgets = [item.get("budget", 0) for item in items if item.get("budget", 0) > 0]
    if budgets:
        max_b = max(budgets)
        # Build meaningful range tiers
        tiers = []
        if max_b > 10_000_000:   # >1Cr
            tiers = [
                (5_000_000,  "Under 50 Lakh"),
                (10_000_000, "Under 1 Cr"),
                (30_000_000, "Under 3 Cr"),
                (50_000_000, "Under 5 Cr"),
            ]
        elif max_b > 1_000_000:  # >10L
            tiers = [
                (1_000_000,  "Under 10 Lakh"),
                (3_000_000,  "Under 30 Lakh"),
                (5_000_000,  "Under 50 Lakh"),
                (10_000_000, "Under 1 Cr"),
            ]
        for val, label in tiers:
            if any(b <= val for b in budgets):
                chips.append({"type": "maxPrice", "value": val, "label": f"💰 {label}"})

    # ── Status chips ─────────────────────────────────────────────────────────
    statuses = {(item.get("status") or "").strip() for item in items if item.get("status")}
    statuses.discard("")
    for s in list(statuses)[:3]:
        chips.append({"type": "status", "value": s, "label": f"✓ {s}"})

    # ── Property type chips ───────────────────────────────────────────────────
    type_key = "propertyType" if kind == "property" else "projectType"
    types = {(item.get(type_key) or "").strip() for item in items if item.get(type_key)}
    types.discard("")
    types.discard("N/A")
    for t in list(types)[:3]:
        chips.append({"type": "propertyType", "value": t, "label": f"🏷️ {t}"})

    return chips


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

            # One-time debug: log the keys + sample values of the first raw item so we can see
            # what LeadRat actually sends back for this tenant. Helps diagnose missing-field bugs.
            if raw_items:
                first = raw_items[0]
                print(f"[LeadRat API] Property raw item keys: {list(first.keys())}")
                print(f"[LeadRat API] Property raw item sample: {json.dumps(first, default=str)[:600]}")

            mapped_items = []
            for item in raw_items:
                # Title — try a wide fallback chain since LeadRat field names vary across tenants.
                title = _coerce_to_string(
                    item.get("propertyTitle")
                    or item.get("title")
                    or item.get("name")
                    or item.get("unitName")
                    or item.get("unitNumber")
                    or item.get("displayName")
                    or item.get("projectName")
                ) or (f"Property #{item.get('id')}" if item.get("id") else "Untitled Property")

                price_str = _coerce_to_string(
                    item.get("price") or item.get("formattedPrice") or item.get("totalPrice")
                ) or "0"

                # propertyType can be string or {displayName, name}
                p_type = _coerce_to_string(item.get("propertyType")) or _coerce_to_string(item.get("type")) or "N/A"

                # location can be string OR a deeply nested object — must flatten before sending to frontend
                location = (
                    _flatten_location(item.get("location"))
                    or _flatten_location(item.get("address"))
                    or _coerce_to_string(item.get("city"))
                    or _coerce_to_string(item.get("area"))
                    or "N/A"
                )

                # Status can also be an object on some tenants
                status_raw = item.get("status")
                status_str = _coerce_to_string(status_raw) if status_raw is not None else None

                mapped_items.append({
                    "id": item.get("id"),
                    "title": title,
                    "name": title,  # alias so frontend never falls through to "Property"
                    "location": location,
                    "type": p_type,
                    "propertyType": p_type,
                    "price": price_str,
                    "budget": _parse_price(price_str),
                    "bhk": _extract_bhk(title) or _extract_bhk(_coerce_to_string(item.get("description", ""))),
                    "status": status_str or ("Active" if item.get("isActive") else "Inactive"),
                    "description": _coerce_to_string(item.get("description", "")),
                    "source": "leadrat_api"
                })

            # Update global cache (must update dict, not reassign, to affect global)
            _property_cache["data"] = mapped_items
            _property_cache["timestamp"] = time.time()
            _property_cache["tenant"] = tenant_id
            print(f"[LeadRat API] Cached {len(mapped_items)} properties for tenant {tenant_id}")

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

            if raw_items:
                first = raw_items[0]
                print(f"[LeadRat API] Project raw item keys: {list(first.keys())}")
                print(f"[LeadRat API] Project raw item sample: {json.dumps(first, default=str)[:600]}")

            mapped_items = []
            for item in raw_items:
                name = _coerce_to_string(
                    item.get("projectName")
                    or item.get("name")
                    or item.get("title")
                    or item.get("displayName")
                ) or (f"Project #{item.get('id')}" if item.get("id") else "Untitled Project")

                p_type = _coerce_to_string(item.get("projectType")) or "N/A"

                location = (
                    _flatten_location(item.get("location"))
                    or _flatten_location(item.get("address"))
                    or _coerce_to_string(item.get("city"))
                    or _coerce_to_string(item.get("area"))
                    or "N/A"
                )

                status_raw = item.get("status")
                status_str = _coerce_to_string(status_raw) if status_raw is not None else None

                mapped_items.append({
                    "id": item.get("id"),
                    "name": name,
                    "title": name,  # alias for frontend resilience
                    "location": location,
                    "projectType": p_type,
                    "type": p_type,
                    "status": status_str or "Active",
                    "description": _coerce_to_string(item.get("description", "")),
                    "source": "leadrat_api"
                })

            # Update global cache (must update dict, not reassign)
            _project_cache["data"] = mapped_items
            _project_cache["timestamp"] = time.time()
            _project_cache["tenant"] = tenant_id
            print(f"[LeadRat API] Cached {len(mapped_items)} projects for tenant {tenant_id}")

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

    # Use the same hardcoded host as get_properties/get_projects (which work).
    # Avoid LEADRAT_BASE_URL env-var indirection — it points to the wrong host in some envs
    # (.env has prd-lrb-webapi.leadrat.com which 404s for /api/v1/lead).
    lead_url = "https://connect.leadrat.com/api/v1/lead"
    print(f"[LeadRat API] POST {lead_url} with payload: {leadrat_payload}")
    try:
        async with httpx.AsyncClient(timeout=15, verify=False) as client:
            resp = await client.post(
                lead_url,
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
