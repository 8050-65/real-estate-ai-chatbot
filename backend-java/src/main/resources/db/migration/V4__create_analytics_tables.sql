-- ============================================================================
-- V4: Analytics Tables (Reports, Query Logs)
-- OUR DATA (analytics + observability, never synced to Leadrat)
-- ============================================================================

-- ============================================================================
-- AI Query Logs Table (LLM observability)
-- ============================================================================
CREATE TABLE ai_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    interpreted_query TEXT,
    result_type VARCHAR(50),
    result_summary TEXT,
    execution_ms INT,
    was_successful BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_query_logs_tenant_id ON ai_query_logs(tenant_id);
CREATE INDEX idx_ai_query_logs_user_id ON ai_query_logs(user_id);
CREATE INDEX idx_ai_query_logs_created_at ON ai_query_logs(created_at);
CREATE INDEX idx_ai_query_logs_success ON ai_query_logs(was_successful);

-- ============================================================================
-- Saved Reports Table (Named NLQ reports)
-- ============================================================================
CREATE TABLE saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    query_text TEXT NOT NULL,
    chart_type VARCHAR(50) NOT NULL DEFAULT 'table',
    filters JSONB NOT NULL DEFAULT '{}',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    schedule VARCHAR(20) NOT NULL DEFAULT 'none',
    schedule_recipients JSONB NOT NULL DEFAULT '[]',
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_chart_type CHECK (chart_type IN
        ('table','bar','line','pie','funnel','kpi')),
    CONSTRAINT check_schedule CHECK (schedule IN
        ('none','daily','weekly','monthly')),
    CONSTRAINT unique_tenant_report UNIQUE (tenant_id, name)
);

CREATE INDEX idx_saved_reports_tenant_id ON saved_reports(tenant_id);
CREATE INDEX idx_saved_reports_user_id ON saved_reports(user_id);
CREATE INDEX idx_saved_reports_created_at ON saved_reports(created_at);
CREATE INDEX idx_saved_reports_pinned ON saved_reports(is_pinned);

-- ============================================================================
-- Analytics Summary Table (Daily aggregates)
-- ============================================================================
CREATE TABLE analytics_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    total_messages INT DEFAULT 0,
    total_sessions INT DEFAULT 0,
    total_visits_scheduled INT DEFAULT 0,
    total_visits_completed INT DEFAULT 0,
    average_response_time_ms INT DEFAULT 0,
    total_tokens_used INT DEFAULT 0,
    failed_queries INT DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_date UNIQUE (tenant_id, summary_date)
);

CREATE INDEX idx_analytics_summary_tenant_id ON analytics_summary(tenant_id);
CREATE INDEX idx_analytics_summary_date ON analytics_summary(summary_date);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER ai_query_logs_update_trigger BEFORE UPDATE ON ai_query_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER saved_reports_update_trigger BEFORE UPDATE ON saved_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER analytics_summary_update_trigger BEFORE UPDATE ON analytics_summary
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
