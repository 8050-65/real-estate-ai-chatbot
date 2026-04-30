"""CRUD (Create, Read, Update, Delete) operations for database models."""

import uuid
from datetime import datetime
from typing import Optional
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.models import (
    ConversationLog, SiteVisit, WhatsAppSession, AiQueryLog
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def log_conversation(
    session: AsyncSession,
    tenant_id: str,
    whatsapp_number: str,
    message: str,
    role: str,
    leadrat_lead_id: Optional[str] = None,
    session_id: Optional[str] = None,
    intent: Optional[str] = None,
    confidence: Optional[float] = None,
    media_shared: Optional[list] = None,
    processing_ms: Optional[int] = None,
    llm_provider: Optional[str] = None,
) -> ConversationLog:
    """Log conversation turn to database."""
    logger.debug(
        "db_conversation_log_insert",
        whatsapp_number=whatsapp_number,
        intent=intent,
        tenant_id=tenant_id,
    )

    try:
        log = ConversationLog(
            tenant_id=tenant_id,
            session_id=session_id,
            whatsapp_number=whatsapp_number,
            leadrat_lead_id=leadrat_lead_id,
            message=message,
            role=role,
            intent=intent,
            confidence=Decimal(str(confidence)) if confidence else None,
            media_shared=media_shared or [],
            processing_ms=processing_ms,
            llm_provider=llm_provider,
        )

        session.add(log)
        await session.flush()

        logger.info(
            "db_conversation_logged",
            log_id=log.id,
            whatsapp_number=whatsapp_number,
            intent=intent,
        )
        return log

    except Exception as e:
        logger.error(
            "db_conversation_log_failed",
            whatsapp_number=whatsapp_number,
            error=str(e),
            exc_info=True,
        )
        raise


async def get_or_create_session(
    session: AsyncSession,
    tenant_id: str,
    whatsapp_number: str,
) -> WhatsAppSession:
    """Get existing WhatsApp session or create new one."""
    logger.debug(
        "db_session_get_or_create",
        whatsapp_number=whatsapp_number,
        tenant_id=tenant_id,
    )

    try:
        query = select(WhatsAppSession).where(
            and_(
                WhatsAppSession.tenant_id == tenant_id,
                WhatsAppSession.whatsapp_number == whatsapp_number,
            )
        )
        result = await session.execute(query)
        ws_session = result.scalar_one_or_none()

        if ws_session:
            logger.info(
                "db_session_found",
                session_id=ws_session.id,
                whatsapp_number=whatsapp_number,
            )
            return ws_session

        # Create new session
        ws_session = WhatsAppSession(
            tenant_id=tenant_id,
            whatsapp_number=whatsapp_number,
            session_data={},
            visit_booking_state={},
            message_count=0,
        )
        session.add(ws_session)
        await session.flush()

        logger.info(
            "db_session_created",
            session_id=ws_session.id,
            whatsapp_number=whatsapp_number,
        )
        return ws_session

    except Exception as e:
        logger.error(
            "db_session_get_or_create_failed",
            whatsapp_number=whatsapp_number,
            error=str(e),
            exc_info=True,
        )
        raise


async def update_session(
    session: AsyncSession,
    session_id: str,
    **updates,
) -> WhatsAppSession:
    """Update WhatsApp session fields."""
    logger.debug("db_session_update", session_id=session_id, updates=updates)

    try:
        query = select(WhatsAppSession).where(WhatsAppSession.id == session_id)
        result = await session.execute(query)
        ws_session = result.scalar_one_or_none()

        if not ws_session:
            logger.warning("db_session_not_found", session_id=session_id)
            raise Exception(f"Session {session_id} not found")

        for key, value in updates.items():
            if hasattr(ws_session, key):
                setattr(ws_session, key, value)

        ws_session.updated_at = datetime.utcnow()
        await session.flush()

        logger.info("db_session_updated", session_id=session_id)
        return ws_session

    except Exception as e:
        logger.error(
            "db_session_update_failed",
            session_id=session_id,
            error=str(e),
            exc_info=True,
        )
        raise


async def create_visit(
    session: AsyncSession,
    tenant_id: str,
    leadrat_lead_id: str,
    leadrat_project_id: str,
    customer_name: str,
    whatsapp_number: str,
    scheduled_at,
    rm_id: Optional[str] = None,
    visitor_count: int = 1,
    notes: Optional[str] = None,
    google_maps_link: Optional[str] = None,
) -> SiteVisit:
    """Create site visit record in database."""
    logger.debug(
        "db_visit_create",
        leadrat_lead_id=leadrat_lead_id,
        scheduled_at=scheduled_at,
        tenant_id=tenant_id,
    )

    try:
        visit = SiteVisit(
            tenant_id=tenant_id,
            leadrat_lead_id=leadrat_lead_id,
            leadrat_project_id=leadrat_project_id,
            customer_name=customer_name,
            whatsapp_number=whatsapp_number,
            scheduled_at=scheduled_at,
            rm_id=rm_id,
            visitor_count=visitor_count,
            notes=notes,
            google_maps_link=google_maps_link,
            status="scheduled",
        )

        session.add(visit)
        await session.flush()

        logger.info(
            "db_visit_created",
            visit_id=visit.id,
            leadrat_lead_id=leadrat_lead_id,
            scheduled_at=scheduled_at,
        )
        return visit

    except Exception as e:
        logger.error(
            "db_visit_create_failed",
            leadrat_lead_id=leadrat_lead_id,
            error=str(e),
            exc_info=True,
        )
        raise


async def get_conversation_history(
    session: AsyncSession,
    tenant_id: str,
    whatsapp_number: str,
    limit: int = 20,
) -> list[ConversationLog]:
    """Get conversation history for a WhatsApp number."""
    logger.debug(
        "db_conversation_history_get",
        whatsapp_number=whatsapp_number,
        limit=limit,
    )

    try:
        query = (
            select(ConversationLog)
            .where(
                and_(
                    ConversationLog.tenant_id == tenant_id,
                    ConversationLog.whatsapp_number == whatsapp_number,
                )
            )
            .order_by(ConversationLog.created_at.desc())
            .limit(limit)
        )

        result = await session.execute(query)
        logs = result.scalars().all()

        logger.debug(
            "db_conversation_history_retrieved",
            whatsapp_number=whatsapp_number,
            count=len(logs),
        )
        return list(reversed(logs))  # Return oldest first

    except Exception as e:
        logger.error(
            "db_conversation_history_failed",
            whatsapp_number=whatsapp_number,
            error=str(e),
            exc_info=True,
        )
        return []


async def update_visit_status(
    session: AsyncSession,
    visit_id: str,
    new_status: str,
) -> SiteVisit:
    """Update site visit status."""
    logger.debug("db_visit_status_update", visit_id=visit_id, new_status=new_status)

    try:
        query = select(SiteVisit).where(SiteVisit.id == visit_id)
        result = await session.execute(query)
        visit = result.scalar_one_or_none()

        if not visit:
            logger.warning("db_visit_not_found", visit_id=visit_id)
            raise Exception(f"Visit {visit_id} not found")

        visit.status = new_status
        visit.updated_at = datetime.utcnow()
        await session.flush()

        logger.info("db_visit_status_updated", visit_id=visit_id, new_status=new_status)
        return visit

    except Exception as e:
        logger.error(
            "db_visit_status_update_failed",
            visit_id=visit_id,
            error=str(e),
            exc_info=True,
        )
        raise


async def log_ai_query(
    session: AsyncSession,
    tenant_id: str,
    user_id: Optional[str] = None,
    query_text: str = None,
    interpreted_query: Optional[str] = None,
    result_type: Optional[str] = None,
    result_summary: Optional[str] = None,
    execution_ms: Optional[int] = None,
    was_successful: bool = True,
    error_message: Optional[str] = None,
) -> AiQueryLog:
    """Log AI query to database for observability."""
    logger.debug(
        "db_ai_query_log_insert",
        tenant_id=tenant_id,
        query_text=query_text[:50] if query_text else None,
    )

    try:
        log = AiQueryLog(
            tenant_id=tenant_id,
            user_id=user_id,
            query_text=query_text,
            interpreted_query=interpreted_query,
            result_type=result_type,
            result_summary=result_summary,
            execution_ms=execution_ms,
            was_successful=was_successful,
            error_message=error_message,
        )

        session.add(log)
        await session.flush()

        logger.info(
            "db_ai_query_logged",
            log_id=log.id,
            success=was_successful,
            execution_ms=execution_ms,
        )
        return log

    except Exception as e:
        logger.error(
            "db_ai_query_log_failed",
            error=str(e),
            exc_info=True,
        )
        raise
