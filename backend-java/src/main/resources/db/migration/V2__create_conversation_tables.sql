-- ============================================================================
-- V2: Conversation Tables (WhatsApp Sessions, Logs)
-- OUR DATA (conversation history + session state)
-- Stores Leadrat IDs only, never duplicates Leadrat data
-- ============================================================================

-- ============================================================================
-- WhatsApp Sessions Table (Active conversation state)
-- ============================================================================
CREATE TABLE whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(20) NOT NULL,
    leadrat_lead_id VARCHAR(100),
    session_data JSONB NOT NULL DEFAULT '{}',
    visit_booking_state JSONB NOT NULL DEFAULT '{}',
    current_intent VARCHAR(100),
    message_count INT NOT NULL DEFAULT 0,
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_whatsapp UNIQUE (tenant_id, whatsapp_number)
);

CREATE INDEX idx_whatsapp_sessions_tenant_id ON whatsapp_sessions(tenant_id);
CREATE INDEX idx_whatsapp_sessions_number ON whatsapp_sessions(whatsapp_number);
CREATE INDEX idx_whatsapp_sessions_leadrat_id ON whatsapp_sessions(leadrat_lead_id);
CREATE INDEX idx_whatsapp_sessions_last_active ON whatsapp_sessions(last_active);

-- ============================================================================
-- Conversation Logs Table (Full message history)
-- ============================================================================
CREATE TABLE conversation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(20) NOT NULL,
    leadrat_lead_id VARCHAR(100),
    message TEXT NOT NULL,
    role VARCHAR(10) NOT NULL,
    intent VARCHAR(100),
    confidence DECIMAL(4,3),
    media_shared JSONB DEFAULT '[]',
    processing_ms INT,
    llm_provider VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_role CHECK (role IN ('user','bot','rm'))
);

CREATE INDEX idx_conversation_logs_tenant_id ON conversation_logs(tenant_id);
CREATE INDEX idx_conversation_logs_session_id ON conversation_logs(session_id);
CREATE INDEX idx_conversation_logs_leadrat_id ON conversation_logs(leadrat_lead_id);
CREATE INDEX idx_conversation_logs_intent ON conversation_logs(intent);
CREATE INDEX idx_conversation_logs_created_at ON conversation_logs(created_at);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER whatsapp_sessions_update_trigger BEFORE UPDATE ON whatsapp_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER conversation_logs_update_trigger BEFORE UPDATE ON conversation_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
