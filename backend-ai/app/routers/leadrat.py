"""
Leadrat API Router - Expose Leadrat services through FastAPI endpoints
"""
from fastapi import APIRouter, Query
from typing import Optional
import logging

from app.services.leadrat_service import (
    LeadratAuthService,
    LeadratLeadService,
    LeadratPropertyService,
    LeadratProjectService
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/leadrat", tags=["leadrat"])

# Initialize services (singleton pattern)
auth_service = LeadratAuthService()
lead_service = LeadratLeadService(auth_service)
property_service = LeadratPropertyService(auth_service)
project_service = LeadratProjectService(auth_service)


@router.get("/leads/search")
async def search_leads(
    search_term: str = Query("", description="Search by name or number"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    size: int = Query(10, ge=1, le=100, description="Page size")
):
    """Search leads by name or phone number"""
    result = lead_service.search_leads(
        search_term=search_term,
        page_number=page,
        page_size=size
    )

    if result:
        return {
            "success": True,
            "data": result.get("data", []),
            "total": result.get("totalRecords", 0),
            "page": page,
            "size": size,
            "source": "Leadrat API"
        }

    return {
        "success": False,
        "error": "Failed to fetch leads from Leadrat",
        "data": []
    }


@router.get("/leads/{lead_id}")
async def get_lead(lead_id: str):
    """Get specific lead details"""
    result = lead_service.get_lead_by_id(lead_id)

    if result:
        return {
            "success": True,
            "data": result,
            "source": "Leadrat API"
        }

    return {
        "success": False,
        "error": f"Lead {lead_id} not found",
        "data": None
    }


@router.get("/properties/search")
async def search_properties(
    query: str = Query("", description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size")
):
    """Search properties"""
    result = property_service.search_properties(
        query=query,
        page_number=page,
        page_size=size
    )

    if result:
        return {
            "success": True,
            "data": result.get("data", []),
            "total": result.get("totalRecords", 0),
            "page": page,
            "size": size,
            "source": "Leadrat API"
        }

    return {
        "success": False,
        "error": "Failed to fetch properties from Leadrat",
        "data": []
    }


@router.get("/properties/{property_id}")
async def get_property(property_id: str):
    """Get specific property details"""
    result = property_service.get_property_by_id(property_id)

    if result:
        return {
            "success": True,
            "data": result,
            "source": "Leadrat API"
        }

    return {
        "success": False,
        "error": f"Property {property_id} not found",
        "data": None
    }


@router.get("/projects")
async def get_projects(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size")
):
    """Get list of projects"""
    result = project_service.get_projects(
        page_number=page,
        page_size=size
    )

    if result:
        return {
            "success": True,
            "data": result.get("data", []),
            "total": result.get("totalRecords", 0),
            "page": page,
            "size": size,
            "source": "Leadrat API"
        }

    return {
        "success": False,
        "error": "Failed to fetch projects from Leadrat",
        "data": []
    }


@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get specific project details"""
    result = project_service.get_project_by_id(project_id)

    if result:
        return {
            "success": True,
            "data": result,
            "source": "Leadrat API"
        }

    return {
        "success": False,
        "error": f"Project {project_id} not found",
        "data": None
    }
