# Phase 3 Migration Plan (Corrected)

**Status:** READY FOR REVIEW (No Execution Yet)  
**Date:** 2026-04-27  
**Strategy:** Flyway V6-V10 (Single Migration System)

---

## KEY CORRECTIONS APPLIED

✅ **tenant_id → tenant_code (VARCHAR)**
- NOT UUID
- Examples: "black", "prdblack", "dubait11"
- Primary tenant identifier across all tables

✅ **Authorization Model**
- App-level filtering initially
- Design for future PostgreSQL RLS
- RM sees only assigned_leads
- Manager sees team data
- Admin sees all

✅ **Encryption**
- Fernet (cryptography library)
- Key from environment only
- Never hardcoded
- Future migration to KMS/Vault supported

✅ **Sync Metadata**
- sync_status, sync_error, last_synced_at
- source_updated_at, record_checksum
- idempotency_key for deduplication

✅ **Search Optimization**
- Indexes on: locality, city, budget, bhk, status, assigned_to, created_at
- Trigram indexes for fuzzy search

✅ **Conversation Memory Enriched**
- summarized_context (AI-generated)
- compressed_context (structured)
- last_intent, last_filters
- expires_at (24h TTL)

✅ **Audit Logs Comprehensive**
- user_id, tenant_code, action
- entity_type, entity_id
- ip_address, user_agent
- prompt_input, ai_response_summary
- PII-masked fields

---

## MIGRATION FILES PREVIEW

### V6__add_tenant_configs.sql

```sql
-- ============================================================================
-- V6: Tenant Configurations (Leadrat Mapping + Credentials)
-- ============================================================================
-- Maps internal tenant_code to Leadrat credentials
-- tenant_code: "black", "prdblack", "dubait11"
-- ============================================================================

CREATE TABLE tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant identifier (NOT UUID - use tenant_code from tenants table)
    tenant_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Leadrat Integration
    leadrat_code VARCHAR(50) NOT NULL UNIQUE,     -- Leadrat organization code
    leadrat_api_key VARCHAR(500) NOT NULL,        -- ENCRYPTED
    leadrat_secret_key VARCHAR(500) NOT NULL,     -- ENCRYPTED
    leadrat_auth_url VARCHAR(500) NOT NULL,
    leadrat_base_url VARCHAR(500) NOT NULL,
    
    -- Sync Tracking
    last_lead_sync TIMESTAMPTZ,
    last_property_sync TIMESTAMPTZ,
    last_project_sync TIMESTAMPTZ,
    
    -- Sync Configuration
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_frequency_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Webhook Support
    webhook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_secret VARCHAR(500),                  -- ENCRYPTED if provided
    webhook_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_sync_frequency CHECK (sync_frequency_minutes >= 5),
    CONSTRAINT unique_tenant_leadrat UNIQUE (tenant_code, leadrat_code)
);

-- Indexes for fast lookup
CREATE INDEX idx_tenant_configs_tenant_code ON tenant_configs(tenant_code);
CREATE INDEX idx_tenant_configs_leadrat_code ON tenant_configs(leadrat_code);

-- Auto-update timestamp
CREATE TRIGGER tenant_configs_update_trigger BEFORE UPDATE ON tenant_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table created
-- SELECT tenant_code, leadrat_code, sync_enabled FROM tenant_configs;
```

---

### V7__add_conversation_memory.sql

```sql
-- ============================================================================
-- V7: Conversation Memory (Compression + Archival)
-- ============================================================================
-- Scalable conversation memory with token windowing and compression
-- ============================================================================

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
    archived_at TIMESTAMPTZ,
    archival_reason VARCHAR(100),                 -- "timeout", "manual", "expired"
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversation_memory_session_id ON conversation_memory(session_id);
CREATE INDEX idx_conversation_memory_tenant ON conversation_memory(tenant_code);
CREATE INDEX idx_conversation_memory_active_until ON conversation_memory(active_until);
CREATE INDEX idx_conversation_memory_archived_at ON conversation_memory(archived_at);

-- Auto-update timestamp
CREATE TRIGGER conversation_memory_update_trigger BEFORE UPDATE ON conversation_memory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table created
-- SELECT COUNT(*) FROM conversation_memory;
```

---

### V8__add_audit_logs.sql

```sql
-- ============================================================================
-- V8: Audit Logs (Security, Compliance, Observability)
-- ============================================================================
-- Immutable audit trail for all actions, with PII masking
-- ============================================================================

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
    
    -- AI/LLM Specific
    prompt_input TEXT,                            -- User question/intent
    ai_response_summary TEXT,                     -- First 200 chars of response
    ai_provider VARCHAR(50),                      -- "ollama", "groq", "openai"
    confidence DECIMAL(3,2),                      -- Intent confidence 0-1
    
    -- Request Context (PII-SAFE)
    ip_address VARCHAR(50),                       -- For rate limiting/security
    user_agent VARCHAR(500),                      -- Browser/client info
    execution_ms INT,                             -- How long the action took
    
    -- Error Tracking
    error_code VARCHAR(50),                       -- "INVALID_FILTER", "DB_ERROR"
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_code);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

-- Constraint: Never update audit logs (append-only)
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- (Future RLS policy: CREATE POLICY no_update_audit ON audit_logs FOR UPDATE USING (FALSE);)

-- Verify table created
-- SELECT COUNT(*) FROM audit_logs;
```

---

### V9__add_sync_metadata_columns.sql

```sql
-- ============================================================================
-- V9: Sync Metadata Columns (Idempotent Sync + Conflict Resolution)
-- ============================================================================
-- Add columns for tracking sync state, conflicts, and deduplication
-- ============================================================================

-- whatsapp_sessions: Track sync state with Leadrat
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'pending';
-- Values: pending, synced, failed, conflict
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS record_checksum VARCHAR(64);
-- MD5/SHA256 of {leadrat_lead_id, session_data} for conflict detection
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;
-- Prevent duplicate syncs from same webhook/batch

-- conversation_logs: Track sync state
ALTER TABLE conversation_logs ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE conversation_logs ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE conversation_logs ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;
ALTER TABLE conversation_logs ADD COLUMN IF NOT EXISTS record_checksum VARCHAR(64);

-- site_visits: Track sync state with detailed metadata
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS record_checksum VARCHAR(64);
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;

-- users: Authorization optimization
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_leads_count INT DEFAULT 0;
-- Denormalized count for fast "My Leads" queries (for RM role)

-- analytics_summary: Cache invalidation tracking
ALTER TABLE analytics_summary ADD COLUMN IF NOT EXISTS cache_invalidated_at TIMESTAMPTZ;
-- When this summary's cache was cleared (for knowing when to refresh)

-- ============================================================================
-- Create Indexes for Sync Tracking
-- ============================================================================

-- Fast lookup by idempotency key (prevent duplicate syncs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_sessions_idempotency 
  ON whatsapp_sessions(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_visits_idempotency 
  ON site_visits(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Fast lookup by sync status (for monitoring)
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_sync_status 
  ON whatsapp_sessions(sync_status, last_synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_sync_status 
  ON conversation_logs(sync_status);

CREATE INDEX IF NOT EXISTS idx_site_visits_sync_status 
  ON site_visits(sync_status, last_synced_at DESC);

-- Fast lookup by source_updated_at (for incremental sync)
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_source_updated 
  ON whatsapp_sessions(source_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_source_updated 
  ON conversation_logs(source_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_visits_source_updated 
  ON site_visits(source_updated_at DESC);

-- Assigned leads lookup (for RM queries)
CREATE INDEX IF NOT EXISTS idx_users_assigned_leads 
  ON users(tenant_id, assigned_leads_count DESC);

-- ============================================================================
-- Search Optimization Indexes (For Phase 3 Hybrid Search)
-- ============================================================================
-- Note: Requires leads, properties, projects tables from Leadrat sync
-- These will be created when sync service runs
-- But we prepare indexes structure here

-- Trigram support (already exists in pg_trgm extension)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Example structure for when leads table is created:
-- CREATE INDEX idx_leads_locality_trigram ON leads USING GIST(locality gist_trgm_ops);
-- CREATE INDEX idx_properties_city_trigram ON properties USING GIST(city gist_trgm_ops);

-- Verify columns added
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name='whatsapp_sessions' AND column_name LIKE 'sync_%';
```

---

### V10__add_enhanced_sync_logs.sql

```sql
-- ============================================================================
-- V10: Enhanced Data Sync Logs (Monitoring + Observability)
-- ============================================================================
-- Track all sync operations with detailed metadata for debugging and monitoring
-- ============================================================================

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
    idempotency_key VARCHAR(255) UNIQUE,          -- Prevent duplicate syncs
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

-- Unique index on idempotency key
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_sync_logs_idempotency 
  ON data_sync_logs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Fast lookup for recent failures
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_failures 
  ON data_sync_logs(status, completed_at DESC) WHERE status IN ('failed', 'partial_success');

-- Auto-update timestamp
CREATE TRIGGER data_sync_logs_update_trigger BEFORE UPDATE ON data_sync_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table created
-- SELECT sync_type, entity_type, status FROM data_sync_logs ORDER BY started_at DESC LIMIT 10;
```

---

## EXECUTION ORDER

```
Phase: Pre-Migration
├─ 1. CREATE DATABASE BACKUP
│  └─ Command: pg_dump crm_cbt_db_dev > /backups/crm_cbt_db_dev_pre_v6-v10.sql
│  └─ Verify: ls -lh /backups/
│  └─ Test restore: psql crm_cbt_db_dev_test < /backups/crm_cbt_db_dev_pre_v6-v10.sql

Phase: Migration (Flyway Auto-runs)
├─ 2. V6__add_tenant_configs.sql (2 min)
│  └─ Creates: tenant_configs (1 table, 2 indexes, 1 trigger)
│  └─ Populate: INSERT INTO tenant_configs (tenant_code, leadrat_code, ...)
│  
├─ 3. V7__add_conversation_memory.sql (2 min)
│  └─ Creates: conversation_memory (1 table, 4 indexes, 1 trigger)
│  
├─ 4. V8__add_audit_logs.sql (2 min)
│  └─ Creates: audit_logs (1 table, 5 indexes, append-only)
│  
├─ 5. V9__add_sync_metadata_columns.sql (5 min)
│  └─ Alters: 5 existing tables with 20 new columns
│  └─ Creates: 10 new indexes on existing tables
│  └─ IMPORTANT: IF NOT EXISTS prevents errors on re-run
│  
└─ 6. V10__add_enhanced_sync_logs.sql (2 min)
   └─ Creates: data_sync_logs (1 table, 9 indexes, 1 trigger)

Total Duration: ~13 minutes
```

---

## MIGRATION VERIFICATION CHECKLIST

```
✓ Flyway History Update
  - SELECT * FROM flyway_schema_history WHERE version >= 6;
  - Verify: All V6-V10 show success=true

✓ Table Creation (6 new tables)
  - \dt tenant_configs
  - \dt conversation_memory
  - \dt audit_logs
  - \dt data_sync_logs
  - SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN (...)

✓ Column Additions (20 new columns)
  - SELECT column_name FROM information_schema.columns WHERE table_name='whatsapp_sessions' AND column_name LIKE 'sync_%';
  - Verify: sync_status, sync_error, last_synced_at, source_updated_at, record_checksum, idempotency_key

✓ Indexes (15 new indexes)
  - SELECT * FROM pg_indexes WHERE tablename LIKE '%sync%' OR tablename LIKE '%memory%' OR tablename LIKE '%audit%';

✓ Triggers (5 new triggers for updated_at)
  - SELECT * FROM pg_trigger WHERE tgname LIKE '%update%' AND tgrelname IN ('tenant_configs', 'conversation_memory', 'audit_logs', 'data_sync_logs', 'whatsapp_sessions');

✓ Data Integrity
  - SELECT COUNT(*) FROM tenants;   -- Should match pre-migration count
  - SELECT COUNT(*) FROM users;     -- Should match pre-migration count
  - SELECT COUNT(*) FROM whatsapp_sessions;  -- Should match
  - SELECT COUNT(*) FROM conversation_logs;  -- Should match
  - SELECT COUNT(*) FROM site_visits;  -- Should match

✓ No Errors in Application Logs
  - Check FastAPI startup: /logs/backend-ai.log
  - Check Spring Boot startup: /logs/spring-boot.log

✓ Phase 2 Functionality Intact
  - Test: POST /api/v1/chat/message
  - Test: GET /api/v1/leadrat/leads/search
  - Test: GET /api/v1/leadrat/properties/search
```

---

## ROLLBACK PLAN

### If Something Goes Wrong

```
STEP 1: Stop Applications
  docker-compose down  # Stop FastAPI and Spring Boot

STEP 2: Restore Database
  psql -h localhost -U rootuser -d crm_cbt_db_dev_temp \
    < /backups/crm_cbt_db_dev_pre_v6-v10.sql

STEP 3: Reset Flyway History
  UPDATE flyway_schema_history SET success=false, installed_rank=5 WHERE version >= 6;
  DELETE FROM flyway_schema_history WHERE version >= 6;

STEP 4: Restart Applications
  docker-compose up -d

STEP 5: Verify Rollback
  SELECT * FROM flyway_schema_history ORDER BY installed_rank;
  -- Should show V1-V5 only
```

---

## FILE LOCATIONS

These migration files go here:

```
backend-java/src/main/resources/db/migration/
├─ V6__add_tenant_configs.sql
├─ V7__add_conversation_memory.sql
├─ V8__add_audit_logs.sql
├─ V9__add_sync_metadata_columns.sql
└─ V10__add_enhanced_sync_logs.sql
```

Flyway will auto-execute them in order when Spring Boot starts.

---

## NEXT STEPS AFTER MIGRATION

### SQLAlchemy Model Updates

```python
# backend-ai/app/db/models.py

class TenantConfig(Base):
    __tablename__ = "tenant_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_code = Column(String(50), nullable=False, unique=True, index=True)
    leadrat_code = Column(String(50), nullable=False, unique=True)
    # ... rest of columns

class ConversationMemory(Base):
    __tablename__ = "conversation_memory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("whatsapp_sessions.id"), nullable=False)
    tenant_code = Column(String(50), nullable=False)
    # ... rest of columns

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_code = Column(String(50), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # ... rest of columns

class DataSyncLog(Base):
    __tablename__ = "data_sync_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sync_type = Column(String(50), nullable=False)
    entity_type = Column(String(100), nullable=False)
    tenant_code = Column(String(50), nullable=False)
    # ... rest of columns
```

### Environment Variables Needed

```bash
# .env file additions

# Encryption
ENCRYPTION_KEY="your-fernet-key-here"  # Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Backup location
DB_BACKUP_DIR="/backups"

# Audit logging
AUDIT_LOG_ENABLED=true
AUDIT_LOG_PII_MASKING=true
```

---

## STATUS

✅ **Migration Files Ready for Review**
- V6-V10 SQL files prepared
- All corrections applied (tenant_code VARCHAR, sync metadata, etc.)
- Indexes optimized for Phase 3 queries
- Rollback plan documented
- Verification checklist provided

❌ **Not Yet Executed**
- Database still unchanged
- Backup not created
- FastAPI models not updated
- No environment variables set

---

## USER ACTION REQUIRED

1. ✅ **Review** all 5 migration SQL files above
2. ✅ **Approve** migration sequence and rollback plan
3. ✅ **Confirm** backup location and environment variables
4. ✅ **Approve execution** when ready

Then I will:
1. Create backup
2. Execute V6-V10 migrations
3. Update SQLAlchemy models
4. Verify all tables and columns
5. Run verification checklist
6. Provide migration report
