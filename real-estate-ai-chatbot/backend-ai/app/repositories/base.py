"""Abstract base classes for repository pattern.

Business logic never calls DB or API directly.
It always goes through these abstract interfaces.
The concrete implementation is swapped at startup based on DATA_STORAGE_MODE.
"""

from abc import ABC, abstractmethod
from typing import Optional


class BaseActivityRepository(ABC):
    """
    Abstract base for activity storage (site visits, meetings, callbacks).
    All 3 storage modes must implement this interface.
    """

    @abstractmethod
    async def create_activity(
        self, activity_data: dict, tenant_id: str
    ) -> dict:
        """
        Create a new activity (site visit, meeting, callback).

        Args:
            activity_data: Activity details (scheduled_at, property_id, etc.)
            tenant_id: Multi-tenant identifier

        Returns:
            Created activity record with id
        """
        pass

    @abstractmethod
    async def update_status(
        self,
        activity_id: str,
        status: str,
        notes: Optional[str] = None
    ) -> dict:
        """
        Update activity status (scheduled → completed, cancelled, etc.).

        Args:
            activity_id: Activity identifier
            status: New status (completed, cancelled, no_show, etc.)
            notes: Optional completion notes

        Returns:
            Updated activity record
        """
        pass

    @abstractmethod
    async def get_activities_by_lead(
        self, leadrat_lead_id: str, tenant_id: str
    ) -> list:
        """
        Get all activities (site visits, meetings) for a lead.

        Args:
            leadrat_lead_id: Leadrat lead identifier
            tenant_id: Multi-tenant identifier

        Returns:
            List of activity records
        """
        pass

    @abstractmethod
    async def get_pending_reminders(
        self, reminder_type: str
    ) -> list:
        """
        Get activities needing reminders (24h before, 2h before, etc.).

        Args:
            reminder_type: Type of reminder (reminder_24h, reminder_2h, etc.)

        Returns:
            List of activities needing reminders
        """
        pass


class BaseLeadRepository(ABC):
    """
    Abstract base for lead storage.
    Handles create, read, update operations on leads.
    """

    @abstractmethod
    async def create_or_update_lead(
        self, lead_data: dict, tenant_id: str
    ) -> dict:
        """
        Create new lead or update existing one (upsert by phone).

        Args:
            lead_data: Lead details (name, phone, email, etc.)
            tenant_id: Multi-tenant identifier

        Returns:
            Lead record with leadrat_lead_id
        """
        pass

    @abstractmethod
    async def get_lead_by_phone(
        self, phone: str, tenant_id: str
    ) -> Optional[dict]:
        """
        Find lead by WhatsApp phone number.

        Args:
            phone: WhatsApp phone number
            tenant_id: Multi-tenant identifier

        Returns:
            Lead record or None if not found
        """
        pass

    @abstractmethod
    async def get_lead_by_id(
        self, leadrat_lead_id: str
    ) -> Optional[dict]:
        """
        Get lead by Leadrat lead ID.

        Args:
            leadrat_lead_id: Leadrat internal lead ID

        Returns:
            Lead record or None if not found
        """
        pass

    @abstractmethod
    async def update_lead_status(
        self, leadrat_lead_id: str, status_id: str
    ) -> bool:
        """
        Update lead status (qualified, site_visit, negotiation, etc.).

        Args:
            leadrat_lead_id: Leadrat lead ID
            status_id: New status ID

        Returns:
            True if successful
        """
        pass
