
-- ============================================================================
-- V10: Enhanced Data Sync Logs (Monitoring + Observability)
-- ============================================================================
-- Track all sync operations with detailed metadata for debugging, monitoring, and compliance
-- ============================================================================

-- Safety Check: Verify update_updated_at_column() function exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE EXCEPTION 'Function update_updated_at_column() not found. Check V1-V5 migrations executed successfully.';
    END IF;
END $$;

-- CRITICAL: Enable trigram extension for future fuzzy search support
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE data_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sync Configuration
    sync_type VARCHAR(50) NOT NULL,               -- "full", "incremental", "on_demand", "webhook"
    source VARCHAR(100) NOT NULL DEFAULT 'leadrat_api',
    target VARCHAR(100) NOT NULL DEFAULT 'chatbot_crm',
    entity_type VARCHAR(100) NOT NULL,            -- "lead", "property", "project"
    tenant_code VARCHAR(50) NOT NULL,
    
    -- Statistics
    records_synced INT DEFAULT 0,
    records_created INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    records_deleted INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    records_skipped INT DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INT,
    
    -- Status & Errors
    status VARCHAR(50) NOT NULL,                  -- "success", "partial_success", "failed"
    error_message TEXT,
    error_count INT DEFAULT 0,
    
    -- Idempotency & Conflict Management
    sync_version INTEGER DEFAULT 1,
    idempotency_key VARCHAR(255),                 -- Prevent duplicate syncs
    conflict_resolution_policy VARCHAR(50),       -- "remote_wins", "local_wins", "manual"
    conflicts_detected INT DEFAULT 0,
    conflicts_resolved INT DEFAULT 0,
    
    -- Context & Initiation
    initiated_by VARCHAR(100),                    -- "webhook", "scheduler", "manual_api", "admin"
    initiated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    webhook_id VARCHAR(255),                      -- If triggered by webhook
    
    -- Metrics
    avg_processing_time_ms INT,                   -- Average time per record
    throughput_records_per_second DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for monitoring and debugging
CREATE INDEX idx_data_sync_logs_tenant ON data_sync_logs(tenant_code);
CREATE INDEX idx_data_sync_logs_entity_type ON data_sync_logs(entity_type);
CREATE INDEX idx_data_sync_logs_status ON data_sync_logs(status);
CREATE INDEX idx_data_sync_logs_sync_type ON data_sync_logs(sync_type);
CREATE INDEX idx_data_sync_logs_started_at ON data_sync_logs(started_at DESC);
CREATE INDEX idx_data_sync_logs_completed_at ON data_sync_logs(completed_at DESC);
CREATE INDEX idx_data_sync_logs_sync_version ON data_sync_logs(sync_version);

-- Unique index on idempotency key (prevents duplicate syncs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_sync_logs_idempotency 
  ON data_sync_logs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Fast lookup for recent failures (for alerting)
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_failures 
  ON data_sync_logs(status, completed_at DESC) WHERE status IN ('failed', 'partial_success');

-- Auto-update timestamp
CREATE TRIGGER data_sync_logs_update_trigger BEFORE UPDATE ON data_sync_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table created
-- SELECT sync_type, entity_type, status FROM data_sync_logs ORDER BY started_at DESC LIMIT 10;


