
-- ============================================================================
-- V8: Audit Logs (Security, Compliance, Observability, PII-Safe)
-- ============================================================================
-- Immutable audit trail for all actions with PII masking and size constraints
-- ============================================================================

-- Safety Check: Verify update_updated_at_column() function exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE EXCEPTION 'Function update_updated_at_column() not found. Check V1-V5 migrations executed successfully.';
    END IF;
END $$;

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    tenant_code VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_id VARCHAR(36),                       -- UUID from X-Request-ID header
    
    -- Action Details
    action VARCHAR(100) NOT NULL,                 -- "search_properties", "create_visit", etc.
    entity_type VARCHAR(50) NOT NULL,             -- "lead", "property", "project", "session"
    entity_id VARCHAR(255),                       -- ID of affected entity
    
    -- Changes (PII-MASKED)
    changes JSONB DEFAULT '{}',                   -- {field: {old: "***REDACTED***", new: "..."}
    
    -- AI/LLM Specific (with SIZE CONSTRAINTS to prevent storage explosion)
    prompt_input VARCHAR(2000),                   -- CRITICAL FIX: Max 2000 chars (truncated from user input)
    ai_response_summary VARCHAR(500),             -- Max 500 chars of response
    ai_provider VARCHAR(50),                      -- "ollama", "groq", "openai"
    confidence DECIMAL(3,2),                      -- Intent confidence 0-1
    
    -- Request Context (PII-SAFE)
    ip_address VARCHAR(50),                       -- For rate limiting/security (hashed in future RLS)
    user_agent VARCHAR(500),                      -- Browser/client info (truncated to 500 chars)
    execution_ms INT,                             -- How long the action took
    
    -- Error Tracking
    error_code VARCHAR(50),                       -- "INVALID_FILTER", "DB_ERROR"
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying (optimized for audit patterns)
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_code);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

-- ============================================================================
-- PII MASKING POLICY (APPLICATION-LEVEL IMPLEMENTATION)
-- ============================================================================
-- These are guidelines - implement in FastAPI audit middleware
--
-- Rule 1: Phone Numbers
--   Input:  "+91 9876543210"
--   Masked: "+91 ****3210"  (last 4 digits only)
--   Implementation: phone[-4:] if len(phone) > 4
--
-- Rule 2: Email Addresses
--   Input:  "user@example.com"
--   Masked: "u***@example.com"  (first char + ***@ + domain)
--   Implementation: email.split('@')[0][0] + '***@' + email.split('@')[1]
--
-- Rule 3: API Keys / Secrets
--   Input:  Any field named *_key, *_secret, *_token
--   Masked: "***REDACTED***"  (never logged)
--   Implementation: Check field name pattern
--
-- Rule 4: Personal Names
--   Input:  "John Doe"
--   Masked: "J*** D***"  (first letter + *** for each word)
--   Implementation: ' '.join([word[0] + '***' for word in name.split()])
--
-- Rule 5: Leadrat IDs
--   Input:  "leadrat_lead_id: 'abc123def456'"
--   Masked: "leadrat_lead_id: 'abc1***'"  (first 4 chars + ***)
--   Implementation: value[:4] + '***' if len(value) > 4

-- Constraint: Never update audit logs (append-only)
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- (Future RLS policy: CREATE POLICY no_update_audit ON audit_logs FOR UPDATE USING (FALSE);)

-- RETENTION POLICY:
-- - Keep logs for 90 days (compliance requirement)
-- - Archive older logs to audit_logs_archive table (if needed)
-- - Monthly DELETE audit_logs WHERE created_at < NOW() - INTERVAL '90 days'

-- Verify table created
-- SELECT COUNT(*) FROM audit_logs;


