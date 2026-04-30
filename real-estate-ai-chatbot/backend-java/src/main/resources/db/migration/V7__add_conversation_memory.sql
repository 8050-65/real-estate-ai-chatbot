
-- ============================================================================
-- V7: Conversation Memory (Compression + Archival + TTL)
-- ============================================================================
-- Scalable conversation memory with token windowing, compression, and TTL enforcement
-- ============================================================================

-- Safety Check: Verify update_updated_at_column() function exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE EXCEPTION 'Function update_updated_at_column() not found. Check V1-V5 migrations executed successfully.';
    END IF;
END $$;

CREATE TABLE conversation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    tenant_code VARCHAR(50) NOT NULL,
    
    -- Recent Messages (Last 10)
    recent_messages JSONB NOT NULL DEFAULT '[]',
    -- {
    --   "messages": [
    --     {"role": "user", "content": "...", "intent": "...", "tokens": 150},
    --     {"role": "assistant", "content": "...", "tokens": 200}
    --   ],
    --   "total_tokens": 1200
    -- }
    
    -- Context Layers
    summarized_context TEXT,                      -- AI-generated summary of older context
    compressed_context JSONB DEFAULT '{}',        -- Structured context for quick lookup
    -- {
    --   "primary_intent": "property_search",
    --   "constraints": {"city": "Bangalore", "bhk": ["2BHK", "3BHK"], "budget_max": 8000000},
    --   "search_history": ["apartments", "villas"],
    --   "entities_seen": ["Whitefield", "50L"]
    -- }
    
    -- Last Known State (For context resolution)
    last_intent VARCHAR(100),
    last_filters JSONB DEFAULT '{}',
    last_entity_extraction JSONB DEFAULT '{}',
    
    -- Lifecycle Management
    active_until TIMESTAMPTZ,                     -- Session expiry time
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),  -- CRITICAL: TTL enforcement
    archived_at TIMESTAMPTZ,
    archival_reason VARCHAR(100),                 -- "timeout", "manual", "expired"
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup and TTL cleanup
CREATE INDEX idx_conversation_memory_session_id ON conversation_memory(session_id);
CREATE INDEX idx_conversation_memory_tenant ON conversation_memory(tenant_code);
CREATE INDEX idx_conversation_memory_active_until ON conversation_memory(active_until);
CREATE INDEX idx_conversation_memory_archived_at ON conversation_memory(archived_at);
CREATE INDEX idx_conversation_memory_expires_at ON conversation_memory(expires_at);  -- For cleanup queries

-- Auto-update timestamp
CREATE TRIGGER conversation_memory_update_trigger BEFORE UPDATE ON conversation_memory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CLEANUP STRATEGY DOCUMENTATION:
-- 1. Scheduled Job (every 1 hour):
--    UPDATE conversation_memory SET archived_at=NOW(), archival_reason='expired'
--    WHERE expires_at < NOW() AND archived_at IS NULL
--
-- 2. Archive Job (daily):
--    INSERT INTO conversation_memory_archive SELECT * FROM conversation_memory
--    WHERE archived_at IS NOT NULL AND archived_at < NOW() - INTERVAL '7 days'
--    THEN DELETE FROM conversation_memory WHERE archived_at < NOW() - INTERVAL '7 days'
--
-- 3. Retention Policy:
--    - Active: 24 hours (expires_at)
--    - Archived: 7 days (archival_retention)
--    - Then moved to cold storage or deleted

-- Verify table created
-- SELECT COUNT(*) FROM conversation_memory;


