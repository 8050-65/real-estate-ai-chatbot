"""SQLAlchemy ORM models matching Flyway schema (9 tables)."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, Time, Text, Date, Index, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Tenant(Base):
    """Multi-tenant organization."""
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    plan = Column(String(50), nullable=False, default="starter")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, slug={self.slug}, plan={self.plan})>"


class User(Base):
    """System users (admin, sales manager, RM, marketing)."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(String(50), nullable=False)  # ADMIN, SALES_MANAGER, RM, MARKETING
    whatsapp_number = Column(String(20))
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_users_tenant_id", "tenant_id"),
        Index("idx_users_email", "email"),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class BotConfig(Base):
    """Chatbot configuration per tenant."""
    __tablename__ = "bot_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    persona_name = Column(String(100), nullable=False, default="Aria")
    greeting_message = Column(Text, nullable=False)
    tone = Column(String(20), nullable=False, default="friendly")  # formal, friendly
    active_hours_start = Column(Time, nullable=False)
    active_hours_end = Column(Time, nullable=False)
    after_hours_message = Column(Text, nullable=False)
    language = Column(String(10), nullable=False, default="en")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<BotConfig(id={self.id}, persona_name={self.persona_name})>"


class WhatsAppSession(Base):
    """WhatsApp conversation session per customer."""
    __tablename__ = "whatsapp_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    whatsapp_number = Column(String(20), nullable=False, index=True)
    leadrat_lead_id = Column(String(100), index=True)
    session_data = Column(JSONB, nullable=False, default=dict)
    visit_booking_state = Column(JSONB, nullable=False, default=dict)
    current_intent = Column(String(100))
    message_count = Column(Integer, nullable=False, default=0)
    last_active = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_whatsapp_sessions_tenant_id", "tenant_id"),
        Index("idx_whatsapp_sessions_number", "whatsapp_number"),
        Index("idx_whatsapp_sessions_leadrat_id", "leadrat_lead_id"),
        Index("idx_whatsapp_sessions_last_active", "last_active"),
    )

    def __repr__(self) -> str:
        return f"<WhatsAppSession(id={self.id}, whatsapp={self.whatsapp_number})>"


class ConversationLog(Base):
    """Conversation log for auditing and analytics."""
    __tablename__ = "conversation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("whatsapp_sessions.id", ondelete="CASCADE"))
    whatsapp_number = Column(String(20), nullable=False)
    leadrat_lead_id = Column(String(100), index=True)
    message = Column(Text, nullable=False)
    role = Column(String(10), nullable=False)  # user, bot, rm
    intent = Column(String(100))
    confidence = Column(DECIMAL(4, 3))
    media_shared = Column(JSONB, default=list)
    processing_ms = Column(Integer)
    llm_provider = Column(String(20))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_conversation_logs_tenant_id", "tenant_id"),
        Index("idx_conversation_logs_session_id", "session_id"),
        Index("idx_conversation_logs_leadrat_id", "leadrat_lead_id"),
        Index("idx_conversation_logs_intent", "intent"),
        Index("idx_conversation_logs_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<ConversationLog(id={self.id}, whatsapp={self.whatsapp_number})>"


class SiteVisit(Base):
    """Site visit scheduling and tracking."""
    __tablename__ = "site_visits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    leadrat_lead_id = Column(String(100), nullable=False, index=True)
    leadrat_project_id = Column(String(100), index=True)
    leadrat_visit_id = Column(String(100))
    customer_name = Column(String(200), nullable=False)
    whatsapp_number = Column(String(20), nullable=False)
    rm_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    visitor_count = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False, default="scheduled")  # scheduled, confirmed, completed, cancelled, no_show
    notes = Column(Text)
    google_maps_link = Column(Text)
    reminder_24h_sent = Column(Boolean, nullable=False, default=False)
    reminder_2h_sent = Column(Boolean, nullable=False, default=False)
    leadrat_synced = Column(Boolean, nullable=False, default=False)
    leadrat_sync_error = Column(Text)
    cancelled_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_site_visits_tenant_id", "tenant_id"),
        Index("idx_site_visits_leadrat_lead_id", "leadrat_lead_id"),
        Index("idx_site_visits_leadrat_project_id", "leadrat_project_id"),
        Index("idx_site_visits_status", "status"),
        Index("idx_site_visits_scheduled_at", "scheduled_at"),
        Index("idx_site_visits_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<SiteVisit(id={self.id}, customer={self.customer_name}, status={self.status})>"


class AiQueryLog(Base):
    """AI query and response logging for observability."""
    __tablename__ = "ai_query_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    query_text = Column(Text, nullable=False)
    interpreted_query = Column(Text)
    result_type = Column(String(50))
    result_summary = Column(Text)
    execution_ms = Column(Integer)
    was_successful = Column(Boolean, nullable=False, default=True)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_ai_query_logs_tenant_id", "tenant_id"),
        Index("idx_ai_query_logs_user_id", "user_id"),
        Index("idx_ai_query_logs_created_at", "created_at"),
        Index("idx_ai_query_logs_success", "was_successful"),
    )

    def __repr__(self) -> str:
        return f"<AiQueryLog(id={self.id}, success={self.was_successful})>"


class SavedReport(Base):
    """Named NLQ reports saved by users."""
    __tablename__ = "saved_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    query_text = Column(Text, nullable=False)
    chart_type = Column(String(50), nullable=False, default="table")  # table, bar, line, pie, funnel, kpi
    filters = Column(JSONB, nullable=False, default=dict)
    is_pinned = Column(Boolean, nullable=False, default=False)
    schedule = Column(String(20), nullable=False, default="none")  # none, daily, weekly, monthly
    schedule_recipients = Column(JSONB, nullable=False, default=list)
    last_run_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_saved_reports_tenant_id", "tenant_id"),
        Index("idx_saved_reports_user_id", "user_id"),
        Index("idx_saved_reports_created_at", "created_at"),
        Index("idx_saved_reports_pinned", "is_pinned"),
    )

    def __repr__(self) -> str:
        return f"<SavedReport(id={self.id}, name={self.name})>"


class AnalyticsSummary(Base):
    """Daily analytics aggregates."""
    __tablename__ = "analytics_summary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    summary_date = Column(Date, nullable=False)
    total_messages = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    total_visits_scheduled = Column(Integer, default=0)
    total_visits_completed = Column(Integer, default=0)
    average_response_time_ms = Column(Integer, default=0)
    total_tokens_used = Column(Integer, default=0)
    failed_queries = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_analytics_summary_tenant_id", "tenant_id"),
        Index("idx_analytics_summary_date", "summary_date"),
    )

    def __repr__(self) -> str:
        return f"<AnalyticsSummary(date={self.summary_date}, messages={self.total_messages})>"
