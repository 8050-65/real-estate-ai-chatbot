"""
Sync service - syncs data from Leadrat APIs to ChromaDB for RAG.
Runs every 2 hours to keep RAG index up-to-date.
"""

import asyncio
from app.services.leadrat_api import get_leads, get_projects, get_properties
from app.services.rag_service import upsert_record


def build_lead_chunk(lead: dict) -> str:
    """Format lead data for RAG storage."""
    return (
        f"Lead: {lead.get('name','')} | "
        f"Phone: {lead.get('phone','')} | "
        f"Status: {lead.get('status','')} | "
        f"Source: {lead.get('source','')} | "
        f"Assigned To: {lead.get('assignedTo','')} | "
        f"Project Interest: {lead.get('projectInterest','')} | "
        f"Budget: {lead.get('budget','')} | "
        f"Last Contact: {lead.get('lastContact','')} | "
        f"Follow-up: {lead.get('followUpDate','')}"
    )


def build_project_chunk(project: dict) -> str:
    """Format project data for RAG storage."""
    return (
        f"Project: {project.get('name','')} | "
        f"Location: {project.get('city','')} | "
        f"Unit Types: {project.get('unitTypes','')} | "
        f"Price Range: {project.get('priceRange','')} | "
        f"Available Units: {project.get('availableUnits','')} | "
        f"Possession: {project.get('possession','')} | "
        f"Amenities: {project.get('amenities','')}"
    )


def build_property_chunk(prop: dict) -> str:
    """Format property data for RAG storage."""
    return (
        f"Property: Unit {prop.get('unitNumber','')} | "
        f"Project: {prop.get('projectName','')} | "
        f"BHK: {prop.get('bhk','')} | "
        f"Floor: {prop.get('floor','')} | "
        f"Price: {prop.get('price','')} | "
        f"Facing: {prop.get('facing','')} | "
        f"Status: {prop.get('status','')} | "
        f"City: {prop.get('city','')} | "
        f"Possession: {prop.get('possessionDate','')}"
    )


async def sync_all(tenant_id: str = "dubait11"):
    """Sync all data from Leadrat to ChromaDB."""
    print(f"[SYNC] Starting sync for tenant: {tenant_id}")

    # Sync leads
    try:
        leads_resp = await get_leads({}, tenant_id)
        leads = leads_resp.get("data", leads_resp if isinstance(leads_resp, list) else [])

        for lead in leads:
            await upsert_record(
                module="lead",
                record_id=str(lead.get("id", "")),
                text_chunk=build_lead_chunk(lead),
                metadata={
                    "name": str(lead.get("name", "")),
                    "status": str(lead.get("status", "")),
                    "source": str(lead.get("source", "")),
                    "assignedTo": str(lead.get("assignedTo", "")),
                    "phone": str(lead.get("phone", "")),
                    "tenant_id": tenant_id
                }
            )
        print(f"[SYNC] Synced {len(leads)} leads")

    except Exception as e:
        print(f"[SYNC] Lead sync failed: {e}")

    # Sync projects
    try:
        projects_resp = await get_projects({}, tenant_id)
        projects = projects_resp.get("data", projects_resp if isinstance(projects_resp, list) else [])

        for project in projects:
            await upsert_record(
                module="project",
                record_id=str(project.get("id", "")),
                text_chunk=build_project_chunk(project),
                metadata={
                    "name": str(project.get("name", "")),
                    "city": str(project.get("city", "")),
                    "possession": str(project.get("possession", "")),
                    "tenant_id": tenant_id
                }
            )
        print(f"[SYNC] Synced {len(projects)} projects")

    except Exception as e:
        print(f"[SYNC] Project sync failed: {e}")

    # Sync properties
    try:
        props_resp = await get_properties({}, tenant_id)
        props = props_resp.get("data", props_resp if isinstance(props_resp, list) else [])

        for prop in props:
            await upsert_record(
                module="property",
                record_id=str(prop.get("id", "")),
                text_chunk=build_property_chunk(prop),
                metadata={
                    "unitType": str(prop.get("bhk", "")),
                    "bhk": str(prop.get("bhk", "")),
                    "city": str(prop.get("city", "")),
                    "projectName": str(prop.get("projectName", "")),
                    "status": str(prop.get("status", "")),
                    "tenant_id": tenant_id
                }
            )
        print(f"[SYNC] Synced {len(props)} properties")

    except Exception as e:
        print(f"[SYNC] Property sync failed: {e}")

    print("[SYNC] Sync complete")


async def start_sync_scheduler(tenant_id: str = "dubait11"):
    """Run sync every 2 hours continuously."""
    while True:
        try:
            await sync_all(tenant_id)
        except Exception as e:
            print(f"[SYNC] Scheduler error: {e}")

        print("[SYNC] Next sync in 2 hours...")
        await asyncio.sleep(7200)  # 2 hours
