import asyncio
from app.utils.logger import get_logger
from app.services.crm_sync import CRMSyncService

logger = get_logger(__name__)

async def scheduled_sync_worker(interval_seconds: int = 7200):
    """
    Background worker that triggers CRM sync every `interval_seconds`.
    By default: 7200 seconds = 2 hours.
    """
    logger.info("background_sync_worker_started", interval_seconds=interval_seconds)
    
    sync_service = CRMSyncService()
    # Replace with logic to get all active tenants if needed
    tenants_to_sync = ["dubait11"]
    
    while True:
        try:
            # Wait for the interval BEFORE running (so we don't sync right at startup when services might be warming up)
            # Or run immediately and then wait. Let's run after a short delay first.
            await asyncio.sleep(60) # Initial delay of 1 minute
            
            while True:
                logger.info("scheduled_sync_triggered")
                for tenant_id in tenants_to_sync:
                    try:
                        logger.info("scheduled_sync_tenant_start", tenant_id=tenant_id)
                        await sync_service.sync_and_index_all(tenant_id)
                        logger.info("scheduled_sync_tenant_success", tenant_id=tenant_id)
                    except Exception as e:
                        logger.error("scheduled_sync_tenant_failed", tenant_id=tenant_id, error=str(e), exc_info=True)
                
                logger.info("scheduled_sync_completed", next_run_in_seconds=interval_seconds)
                await asyncio.sleep(interval_seconds)
                
        except asyncio.CancelledError:
            logger.info("background_sync_worker_cancelled")
            break
        except Exception as e:
            logger.error("background_sync_worker_error", error=str(e), exc_info=True)
            # Sleep a bit before retrying the outer loop to prevent tight loops on errors
            await asyncio.sleep(60)
