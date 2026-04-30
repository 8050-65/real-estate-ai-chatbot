from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.crm_sync import get_sync_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/sync", tags=["Sync"])

class SyncRequest(BaseModel):
    tenant_id: str = "dubait11"
    entity_type: Optional[str] = "all"  # projects, properties, all

class SyncResponse(BaseModel):
    status: str
    message: str
    results: Optional[Dict[str, Any]] = None

@router.post("/trigger", response_model=SyncResponse)
async def trigger_sync(request: SyncRequest):
    """
    Trigger a manual sync of Leadrat data into RAG.
    """
    sync_service = get_sync_service()
    try:
        if request.entity_type == "projects":
            results = await sync_service.sync_projects(request.tenant_id)
        elif request.entity_type == "properties":
            results = await sync_service.sync_properties(request.tenant_id)
        else:
            results = await sync_service.sync_and_index_all(request.tenant_id)
        
        return SyncResponse(
            status="success",
            message=f"Sync completed for {request.entity_type}",
            results=results
        )
    except Exception as e:
        logger.error(f"Sync trigger failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/background", status_code=202)
async def trigger_sync_background(request: SyncRequest, background_tasks: BackgroundTasks):
    """
    Trigger a sync in the background.
    """
    sync_service = get_sync_service()
    
    async def run_sync():
        try:
            await sync_service.sync_and_index_all(request.tenant_id)
            logger.info(f"Background sync completed for {request.tenant_id}")
        except Exception as e:
            logger.error(f"Background sync failed: {str(e)}")

    background_tasks.add_task(run_sync)
    return {"status": "accepted", "message": "Sync started in background"}
