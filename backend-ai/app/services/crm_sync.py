"""Service for syncing CRM data from Leadrat to ChromaDB RAG index."""

import asyncio
from typing import List, Dict, Any
import structlog
from app.config import settings
from app.services.leadrat_leads import list_leads, list_properties, list_projects
from app.rag.indexer import get_indexer
from app.utils.logger import get_logger

logger = get_logger(__name__)

class CRMSyncService:
    """Handles data extraction from Leadrat and loading into RAG."""

    def __init__(self):
        self.indexer = get_indexer()

    async def sync_and_index_all(self, tenant_id: str) -> Dict[str, Any]:
        """Sync all relevant CRM entities to RAG."""
        results = {
            "projects": await self.sync_projects(tenant_id),
            "properties": await self.sync_properties(tenant_id),
            # Leads are usually too dynamic/private for global RAG, 
            # but we might sync them if needed for specific lead-search flows.
            "status": "completed"
        }
        return results

    async def sync_projects(self, tenant_id: str) -> Dict[str, Any]:
        """Fetch projects and index them."""
        logger.info("sync_projects_start", tenant_id=tenant_id)
        try:
            # 1. Fetch from Leadrat
            data = await list_projects(tenant_id, page_size=100)
            projects = data.get("data") or []
            
            if not projects:
                logger.info("sync_projects_empty", tenant_id=tenant_id)
                return {"count": 0, "status": "no_data"}

            # 2. Transform to text and collect metadata
            documents = []
            metadatas = []
            for p in projects:
                doc = (
                    f"Project Name: {p.get('name', 'N/A')}\n"
                    f"Location: {p.get('location', 'N/A')}\n"
                    f"Description: {p.get('description', 'N/A')}\n"
                    f"Status: {p.get('status', 'N/A')}\n"
                    f"Features: {', '.join(p.get('features', [])) if isinstance(p.get('features'), list) else 'N/A'}\n"
                )
                documents.append(doc)
                
                # Per-project metadata for filtering
                metadatas.append({
                    "type": "project",
                    "source": "leadrat_api",
                    "name": p.get('name'),
                    "location": p.get('location'),
                    "status": p.get('status')
                })

            # 3. Index into ChromaDB
            result = await self.indexer.index_documents(
                tenant_id=tenant_id,
                documents=documents,
                metadata=metadatas
            )
            
            logger.info("sync_projects_complete", tenant_id=tenant_id, count=len(projects))
            return {"count": len(projects), "status": "success", "indexer_result": result}
        
        except Exception as e:
            logger.error("sync_projects_failed", tenant_id=tenant_id, error=str(e), exc_info=True)
            return {"count": 0, "status": "error", "message": str(e)}

    async def sync_properties(self, tenant_id: str) -> Dict[str, Any]:
        """Fetch properties and index them."""
        logger.info("sync_properties_start", tenant_id=tenant_id)
        try:
            # 1. Fetch from Leadrat
            data = await list_properties(tenant_id, page_size=100)
            properties = data.get("data") or []
            
            if not properties:
                logger.info("sync_properties_empty", tenant_id=tenant_id)
                return {"count": 0, "status": "no_data"}

            # 2. Transform to text and collect metadata
            documents = []
            metadatas = []
            for p in properties:
                if not isinstance(p, dict):
                    continue
                
                address = p.get('address') or {}
                city = address.get('city', 'N/A') if isinstance(address, dict) else 'N/A'
                state = address.get('state', 'N/A') if isinstance(address, dict) else 'N/A'
                
                doc = (
                    f"Property Title: {p.get('title', 'N/A')}\n"
                    f"Type: {p.get('propertyType', 'N/A')}\n"
                    f"Configuration: {p.get('bhk', 'N/A')} BHK\n"
                    f"Price: {p.get('price', 'N/A')} {p.get('currency', 'INR')}\n"
                    f"Area: {p.get('area', 'N/A')} {p.get('areaUnit', 'sqft')}\n"
                    f"Location: {city}, {state}\n"
                    f"Project: {p.get('projectName', 'N/A')}\n"
                    f"Description: {p.get('description', 'N/A')}\n"
                )
                documents.append(doc)
                
                # Per-property metadata for filtering
                metadatas.append({
                    "type": "property",
                    "source": "leadrat_api",
                    "name": p.get('title'),
                    "propertyType": p.get('propertyType'),
                    "bhk": str(p.get('bhk')),
                    "budget": str(p.get('price')),
                    "location": city
                })

            # 3. Index into ChromaDB
            result = await self.indexer.index_documents(
                tenant_id=tenant_id,
                documents=documents,
                metadata=metadatas
            )
            
            logger.info("sync_properties_complete", tenant_id=tenant_id, count=len(properties))
            return {"count": len(properties), "status": "success", "indexer_result": result}
        
        except Exception as e:
            logger.error("sync_properties_failed", tenant_id=tenant_id, error=str(e), exc_info=True)
            return {"count": 0, "status": "error", "message": str(e)}

# Singleton instance
_sync_service = None

def get_sync_service() -> CRMSyncService:
    global _sync_service
    if _sync_service is None:
        _sync_service = CRMSyncService()
    return _sync_service
