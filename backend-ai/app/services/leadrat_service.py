"""
Leadrat API Service Layer - Handle authentication and API calls
"""
import httpx
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class LeadratAuthService:
    """Handle Leadrat authentication and token caching"""

    def __init__(self, tenant: Optional[str] = None):
        self.api_key = settings.leadrat_api_key
        self.secret_key = settings.leadrat_secret_key
        self.auth_url = settings.leadrat_auth_url
        self.base_url = settings.leadrat_base_url
        # Tenant can be passed in or read from .env, passed value takes precedence
        self.tenant = tenant or settings.leadrat_tenant

        if not self.tenant:
            logger.warning("LEADRAT_TENANT not configured. Set LEADRAT_TENANT in .env")

        # Validate required config
        if not self.api_key or not self.secret_key:
            logger.warning("LEADRAT_API_KEY or LEADRAT_SECRET_KEY not configured")

        self.token_cache: Optional[Dict[str, Any]] = None
        self.token_expiry: Optional[datetime] = None

    def get_token(self) -> Optional[str]:
        """Get valid access token, using cache if available"""
        if self._is_token_valid():
            return self.token_cache.get("token") or self.token_cache.get("accessToken")

        return self._fetch_new_token()

    def _is_token_valid(self) -> bool:
        """Check if cached token is still valid"""
        if not self.token_cache or not self.token_expiry:
            return False

        # Token valid if not expired
        return datetime.utcnow() < self.token_expiry

    def _fetch_new_token(self) -> Optional[str]:
        """Fetch fresh token from Leadrat auth endpoint"""
        try:
            payload = {
                "apiKey": self.api_key,
                "secretKey": self.secret_key
            }

            logger.info(f"Fetching Leadrat token for tenant: {self.tenant}")

            response = httpx.post(
                self.auth_url,
                json=payload,  # NOTE: payload contains secrets but we don't log it
                headers={"tenant": self.tenant, "Content-Type": "application/json"},
                timeout=30.0
            )

            if response.status_code == 200:
                response_data = response.json()

                # Handle nested response structure: {"data": {"accessToken": "..."}}
                token_data = response_data.get("data", {})
                token = token_data.get("accessToken") or response_data.get("token")

                if token:
                    self.token_cache = token_data
                    # Cache token for 55 minutes (Leadrat tokens typically valid for 1 hour)
                    self.token_expiry = datetime.utcnow() + timedelta(minutes=55)
                    logger.info("[Leadrat] Token fetched and cached successfully")
                    return token
                else:
                    logger.error(f"[Leadrat] Token not found in response: {response_data}")
            else:
                logger.error(f"[Leadrat] Failed to fetch token: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"[Leadrat] Exception fetching token: {e}")

        return None


class LeadratLeadService:
    """Leadrat Lead API Service - Search and list leads"""

    def __init__(self, auth_service: LeadratAuthService):
        self.auth = auth_service
        self.base_url = auth_service.base_url
        self.tenant = auth_service.tenant

    def search_leads(
        self,
        search_term: str = "",
        page_number: int = 1,
        page_size: int = 10
    ) -> Optional[Dict[str, Any]]:
        """
        Search leads using Leadrat API
        GET /api/v1/lead?SearchText=<query>&PageNumber=<page>&PageSize=<size>
        """
        try:
            token = self.auth.get_token()
            if not token:
                logger.error("[Leadrat] No valid token available")
                return None

            url = f"{self.base_url}/lead"
            params = {
                "PageNumber": page_number,
                "PageSize": page_size
            }
            if search_term:
                params["SearchText"] = search_term

            logger.info(f"[Leadrat] Searching leads: search_term='{search_term}' page={page_number} size={page_size}")

            response = httpx.get(
                url,
                params=params,
                headers={
                    "Authorization": f"Bearer {token}",
                    "tenant": self.tenant,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                # Format response to match expected structure
                if isinstance(data, dict):
                    items = data.get("items", [])
                    logger.info(f"[Leadrat] Lead search successful: found {len(items)} leads")
                    # Return in standardized format
                    return {
                        "data": items,
                        "totalElements": data.get("totalCount", len(items)),
                        "currentPage": page_number,
                        "pageSize": page_size,
                        "itemsCount": data.get("itemsCount", len(items))
                    }
                return None
            else:
                logger.error(f"[Leadrat] Lead search failed: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"[Leadrat] Exception searching leads: {e}")
            return None

    def get_lead_by_id(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get specific lead by ID"""
        try:
            token = self.auth.get_token()
            if not token:
                logger.error(" No valid Leadrat token available")
                return None

            url = f"{self.base_url}/lead/{lead_id}"

            logger.info(f"Fetching lead: {lead_id}")

            response = httpx.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "tenant": self.tenant,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                logger.info(f" Lead fetch successful: {lead_id}")
                return data
            else:
                logger.error(f" Lead fetch failed: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f" Exception fetching lead: {e}")
            return None


class LeadratPropertyService:
    """Leadrat Property API Service"""

    def __init__(self, auth_service: LeadratAuthService):
        self.auth = auth_service
        self.base_url = auth_service.base_url
        self.tenant = auth_service.tenant

    def search_properties(
        self,
        query: str = "",
        page_number: int = 1,
        page_size: int = 10
    ) -> Optional[Dict[str, Any]]:
        """Search properties using Leadrat API"""
        try:
            token = self.auth.get_token()
            if not token:
                logger.error("[Leadrat] No valid token available")
                return None

            # Leadrat property endpoint: /property (not /property/search)
            url = f"{self.base_url}/property"
            params = {
                "PageNumber": page_number,
                "PageSize": page_size
            }
            if query:
                params["SearchText"] = query

            logger.info(f"[Leadrat] Searching properties: query='{query}' page={page_number} size={page_size}")

            response = httpx.get(
                url,
                params=params,
                headers={
                    "Authorization": f"Bearer {token}",
                    "tenant": self.tenant,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                # Format response to match expected structure
                if isinstance(data, dict):
                    items = data.get("items", [])
                    logger.info(f"[Leadrat] Properties search successful: found {len(items)} properties")
                    # Return in standardized format
                    return {
                        "data": items,
                        "totalElements": data.get("totalCount", len(items)),
                        "currentPage": page_number,
                        "pageSize": page_size,
                        "itemsCount": data.get("itemsCount", len(items))
                    }
                return None
            else:
                logger.error(f"[Leadrat] Property search failed: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"[Leadrat] Exception searching properties: {e}")
            return None

    def get_property_by_id(self, property_id: str) -> Optional[Dict[str, Any]]:
        """Get specific property by ID"""
        try:
            token = self.auth.get_token()
            if not token:
                logger.error(" No valid Leadrat token available")
                return None

            url = f"{self.base_url}/property/{property_id}"

            logger.info(f"Fetching property: {property_id}")

            response = httpx.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "tenant": self.tenant,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                logger.info(f" Property fetch successful: {property_id}")
                return data
            else:
                logger.error(f" Property fetch failed: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f" Exception fetching property: {e}")
            return None


class LeadratProjectService:
    """Leadrat Project API Service"""

    def __init__(self, auth_service: LeadratAuthService):
        self.auth = auth_service
        self.base_url = auth_service.base_url
        self.tenant = auth_service.tenant

    def get_projects(self, page_number: int = 1, page_size: int = 10) -> Optional[Dict[str, Any]]:
        """Get list of projects"""
        try:
            token = self.auth.get_token()
            if not token:
                logger.error("[Leadrat] No valid token available")
                return None

            # Use /project endpoint (not /project/all)
            url = f"{self.base_url}/project"
            params = {
                "PageNumber": page_number,
                "PageSize": page_size
            }

            logger.info(f"[Leadrat] Fetching projects (page {page_number}, size {page_size})")

            response = httpx.get(
                url,
                params=params,
                headers={
                    "Authorization": f"Bearer {token}",
                    "tenant": self.tenant,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                # Format response to match expected structure
                if isinstance(data, dict):
                    items = data.get("items", [])
                    logger.info(f"[Leadrat] Projects fetch successful: found {len(items)} projects")
                    # Return in standardized format
                    return {
                        "data": items,
                        "totalElements": data.get("totalCount", len(items)),
                        "currentPage": page_number,
                        "pageSize": page_size,
                        "itemsCount": data.get("itemsCount", len(items))
                    }
                return None
            else:
                logger.error(f"[Leadrat] Projects fetch failed: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"[Leadrat] Exception fetching projects: {e}")
            return None

    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get specific project by ID"""
        try:
            token = self.auth.get_token()
            if not token:
                logger.error(" No valid Leadrat token available")
                return None

            url = f"{self.base_url}/project/{project_id}"

            logger.info(f"Fetching project: {project_id}")

            response = httpx.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "tenant": self.tenant,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                logger.info(f" Project fetch successful: {project_id}")
                return data
            else:
                logger.error(f" Project fetch failed: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f" Exception fetching project: {e}")
            return None
