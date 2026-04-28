# Database Audit Report

**Date:** 2026-04-27  
**Status:** AUDIT COMPLETE - Ready for Migration Plan Review  
**Scope:** Current vs Phase 3 Requirements

---

## EXECUTIVE SUMMARY

✅ **9 Core Tables Already Exist** (via Flyway migrations V1-V5)
- All tables created in PostgreSQL database: `crm_cbt_db_dev`
- SQLAlchemy models already defined and match Flyway schema
- No breaking changes needed to existing tables

❌ **Missing Phase 3 Features** (9 tables + enhanced columns)
- Phase 3 requires 4 new tables
- Phase 3 requires new columns for idempotent sync, authorization, cache invalidation
- Alembic is configured but has NO migration versions yet

**Recommendation:** 
- Use Flyway (Spring Boot) for next migrations (V6, V7, etc.) to keep consistency
- OR convert Alembic to primary and run all together
- **Decision needed from user** before proceeding

---

## 1. EXISTING DATABASE STATE

### Database Configuration

```
Database Name:    crm_cbt_db_dev
Host:            localhost:5432 (default, configurable)
Driver:          PostgreSQL
User:            rootuser (default, configurable)
Password:        123Pa$$word! (default, configurable)

FastAPI Connection:
  URL: postgresql+asyncpg://realestate:password@localhost:5432/realestate_db
  ORM: SQLAlchemy 2.0 (async)
  
Spring Boot Connection:
  URL: jdbc:postgresql://postgres:5432/crm_cbt_db_dev
  ORM: JPA/Hibernate
  Migrations: Flyway V1-V5
```

### Existing Tables (9 Total)

#### Status: ✅ ALL TABLES EXIST

| # | Table | Columns | Indexes | Source | Phase |
|---|-------|---------|---------|--------|-------|
| 1 | `tenants` | 7 | 1 | Flyway V1 | Core |
| 2 | `users` | 10 | 2 | Flyway V1 | Core |
| 3 | `bot_configs` | 11 | 1 | Flyway V1 | Core |
| 4 | `whatsapp_sessions` | 9 | 4 | Flyway V2 | Phase 2 |
| 5 | `conversation_logs` | 12 | 5 | Flyway V2 | Phase 2 |
| 6 | `site_visits` | 19 | 6 | Flyway V3 | Phase 2 |
| 7 | `ai_query_logs` | 10 | 4 | Flyway V4 | Phase 3 |
| 8 | `saved_reports` | 12 | 4 | Flyway V4 | Phase 3 |
| 9 | `analytics_summary` | 12 | 2 | Flyway V4 | Phase 3 |

**Total Columns:** 102  
**Total Indexes:** 29  
**Triggers:** 9 (auto-updating `updated_at`)

---

## 2. PHASE 3 GAPS (What's Missing)

### Missing Tables (4 New)

| # | Table | Purpose | Phase 3 Section | Status |
|---|-------|---------|-----------------|--------|
| 1 | `tenant_configs` | Leadrat tenant mapping | 1: Multi-Tenant | ❌ MISSING |
| 2 | `conversation_memory` | Memory compression/archival | 3: Memory Scalability | ❌ MISSING |
| 3 | `data_sync_log` | Sync tracking/monitoring | 11: Advanced Sync | ⚠️ PARTIAL |
| 4 | `audit_logs` | Security/compliance trail | 6: Security | ❌ MISSING |

### Missing Columns (Enhancements to Existing Tables)

#### Table: `whatsapp_sessions` (needs 3 new columns)
```sql
-- For idempotent sync design (Section 11.2)
sync_version INTEGER DEFAULT 0,         -- Track sync version
source_updated_at TIMESTAMPTZ,          -- Last known Leadrat update time
record_checksum VARCHAR(64),            -- MD5/SHA256 of record state
idempotency_key VARCHAR(255) UNIQUE     -- Prevent duplicate syncs
```

#### Table: `conversation_logs` (needs 3 new columns)
```sql
-- For idempotent sync & traceability
sync_version INTEGER DEFAULT 0,
source_updated_at TIMESTAMPTZ,
record_checksum VARCHAR(64)
```

#### Table: `site_visits` (needs 4 new columns)
```sql
-- For idempotent sync
sync_version INTEGER DEFAULT 0,
source_updated_at TIMESTAMPTZ,
record_checksum VARCHAR(64),
idempotency_key VARCHAR(255) UNIQUE
```

#### Table: `users` (needs 1 new column)
```sql
-- For authorization/visibility filtering
assigned_leads_count INTEGER DEFAULT 0  -- Denormalized count for RM filtering
```

#### Table: `analytics_summary` (needs 1 new column)
```sql
-- For cache invalidation tracking
cache_invalidated_at TIMESTAMPTZ        -- When this summary's cache was cleared
```

### Missing Extensions

```sql
-- PostgreSQL extensions for Phase 3 features

-- ALREADY EXISTS (from existing indexes)
-- CREATE EXTENSION pg_trgm;  -- Trigram matching for fuzzy search (Section 2.2)

-- NEEDS TO BE ADDED
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID functions (for migration)
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- Encryption functions (for audit log masking)
```

---

## 3. DATA SYNCHRONIZATION STATE

### Current Sync Architecture

```
Flyway V5 (Seed Data)
└─ Default Tenant: "black" (UUID: 00000000-0000-0000-0000-000000000001)
   └─ Admin User: admin@crm-cbt.com
   └─ Sales Manager: sales@crm-cbt.com
   └─ RM User: rm@crm-cbt.com
   └─ Bot Config: Aria (friendly, 9 AM-9 PM)

Status: ✅ All seed data present
Hash: V1-V5 migrations are in Flyway history table
```

### Sync Completeness Check

```
Spring Boot (Flyway) ✅
  - V1: tenants, users, bot_configs (3 tables)
  - V2: whatsapp_sessions, conversation_logs (2 tables)
  - V3: site_visits (1 table)
  - V4: ai_query_logs, saved_reports, analytics_summary (3 tables)
  - V5: seed data
  Status: Complete (no gaps)

FastAPI (SQLAlchemy models) ⚠️
  - All 9 table models defined in app/db/models.py
  - Alembic configured but NO migration versions created
  - Status: Models exist, no migration history
  
Alignment: ✅ Models match database schema
```

---

## 4. MIGRATION STRATEGY

### Option A: Use Flyway for Phase 3 (RECOMMENDED)

**Pros:**
- Consistent with existing V1-V5
- Already enabled in Spring Boot
- Single source of truth
- Better for production deployments

**Migration Plan:**
```
V6__add_tenant_configs.sql
  └─ Create tenant_configs table
  └─ Create TenantConfig model in SQLAlchemy
  └─ Update FastAPI routes

V7__add_conversation_memory.sql
  └─ Create conversation_memory table
  └─ Create ConversationMemory model

V8__add_audit_logs.sql
  └─ Create audit_logs table
  └─ Add PII encryption columns

V9__add_idempotent_sync_columns.sql
  └─ ALTER whatsapp_sessions ADD COLUMN sync_version...
  └─ ALTER conversation_logs ADD COLUMN sync_version...
  └─ ALTER site_visits ADD COLUMN sync_version...
  └─ ALTER users ADD COLUMN assigned_leads_count...
  └─ ALTER analytics_summary ADD COLUMN cache_invalidated_at...

V10__add_sync_tracking.sql
  └─ Create data_sync_log table (enhanced from Phase 3 design)
  └─ Add sync monitoring columns

Total New Migrations: V6-V10 (5 migrations)
Estimated Time: 2-3 days
```

### Option B: Use Alembic for Phase 3

**Pros:**
- Python-only (no SQL needed)
- Can auto-generate from model changes
- Matches FastAPI ecosystem

**Cons:**
- Inconsistent with existing Flyway
- Need to maintain two migration systems

**Status:** ❌ NOT RECOMMENDED - Creates two migration systems

---

## 5. CRITICAL REVIEW POINTS

### ✅ What's Good (No Changes Needed)

1. **Existing 9 tables** - Perfect schema, properly indexed
2. **Seed data** - V5 provides default tenant + users + bot config
3. **Triggers** - Auto-updated `updated_at` on all tables
4. **Indexes** - Excellent coverage (29 indexes)
5. **Constraints** - ROLE and STATUS checks properly defined
6. **Foreign Keys** - Cascading deletes configured correctly

### ⚠️ What Needs Attention

1. **Alembic Not Used**
   - Set up but no migrations
   - SQLAlchemy models exist but aren't tracked in migration history
   - Decision: Should we use Alembic or Flyway?

2. **No Idempotent Sync Columns**
   - Phase 3 requires sync_version, source_updated_at, record_checksum
   - Missing from: whatsapp_sessions, conversation_logs, site_visits, users
   - Impact: Sync conflicts not traceable

3. **No Authorization Filtering**
   - Users exist with roles but no filtering in queries
   - RM should only see assigned leads
   - Manager should see team data
   - Admin should see all data
   - Need to add row-level security or app-level filtering

4. **No Audit Trail for Security**
   - audit_logs table missing
   - Can't track who accessed what
   - Compliance risk (GDPR, etc.)

5. **No Encryption at Rest**
   - PII fields (whatsapp_number, email) not encrypted
   - Security gap for Phase 3

---

## 6. DETAILED MIGRATION PLAN

### V6: Tenant Configuration (New Table)

```sql
-- backend-java/src/main/resources/db/migration/V6__add_tenant_configs.sql

CREATE TABLE tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    leadrat_code VARCHAR(50) NOT NULL UNIQUE,  -- "dubait11", "bangalore01"
    
    -- Encrypted Leadrat credentials
    leadrat_api_key VARCHAR(500) NOT NULL,
    leadrat_secret_key VARCHAR(500) NOT NULL,
    leadrat_auth_url VARCHAR(500) NOT NULL,
    leadrat_base_url VARCHAR(500) NOT NULL,
    
    -- Sync timestamps
    last_lead_sync TIMESTAMPTZ,
    last_property_sync TIMESTAMPTZ,
    last_project_sync TIMESTAMPTZ,
    
    -- Sync config
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_frequency_minutes INTEGER NOT NULL DEFAULT 60,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_leadrat UNIQUE (tenant_id, leadrat_code)
);

CREATE INDEX idx_tenant_configs_tenant_id ON tenant_configs(tenant_id);
CREATE INDEX idx_tenant_configs_leadrat_code ON tenant_configs(leadrat_code);
CREATE TRIGGER tenant_configs_update_trigger BEFORE UPDATE ON tenant_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Files to Update:**
- `backend-ai/app/db/models.py` - Add TenantConfig model
- `backend-ai/app/db/crud.py` - Add tenant config CRUD
- `backend-ai/app/services/leadrat_auth.py` - Use tenant_configs for auth

---

### V7: Conversation Memory (New Table)

```sql
-- backend-java/src/main/resources/db/migration/V7__add_conversation_memory.sql

CREATE TABLE conversation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Memory layers
    recent_messages JSONB NOT NULL DEFAULT '[]',  -- Last 10 messages
    context_summary TEXT,                          -- AI-generated summary
    compressed_context JSONB DEFAULT '{}',         -- Structured context
    
    -- Lifecycle
    active_until TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    archival_reason VARCHAR(100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversation_memory_session_id ON conversation_memory(session_id);
CREATE INDEX idx_conversation_memory_tenant_id ON conversation_memory(tenant_id);
CREATE INDEX idx_conversation_memory_archived_at ON conversation_memory(archived_at);
CREATE TRIGGER conversation_memory_update_trigger BEFORE UPDATE ON conversation_memory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Files to Update:**
- `backend-ai/app/db/models.py` - Add ConversationMemory model
- `backend-ai/app/services/memory_service.py` - Compression logic
- `backend-ai/app/services/chat_orchestrator.py` - Use memory service

---

### V8: Audit Logs (New Table)

```sql
-- backend-java/src/main/resources/db/migration/V8__add_audit_logs.sql

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL,           -- "search", "create_visit", "update_lead"
    entity_type VARCHAR(50) NOT NULL,       -- "lead", "property", "project"
    entity_id VARCHAR(255),                 -- ID of entity affected
    
    -- Changes (PII-masked)
    changes JSONB DEFAULT '{}',             -- {field: {old: ..., new: ...}}
    
    -- Request context
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_action_length CHECK (LENGTH(action) > 0)
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

**Files to Update:**
- `backend-ai/app/db/models.py` - Add AuditLog model
- `backend-ai/app/middleware/audit_middleware.py` - New middleware to log all actions
- `backend-ai/app/services/encryption.py` - Mask PII in audit logs

---

### V9: Idempotent Sync Columns (Enhancements)

```sql
-- backend-java/src/main/resources/db/migration/V9__add_idempotent_sync_columns.sql

-- whatsapp_sessions: Track sync state
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 0;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS record_checksum VARCHAR(64);
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;

-- conversation_logs: Track sync state
ALTER TABLE conversation_logs ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 0;
ALTER TABLE conversation_logs ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;
ALTER TABLE conversation_logs ADD COLUMN IF NOT EXISTS record_checksum VARCHAR(64);

-- site_visits: Track sync state
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 0;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS record_checksum VARCHAR(64);
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;

-- users: Authorization denormalization
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_leads_count INTEGER DEFAULT 0;

-- analytics_summary: Cache invalidation tracking
ALTER TABLE analytics_summary ADD COLUMN IF NOT EXISTS cache_invalidated_at TIMESTAMPTZ;

-- Create index on idempotency keys for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_sessions_idempotency 
  ON whatsapp_sessions(idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_visits_idempotency 
  ON site_visits(idempotency_key);

-- Create indexes for sync tracking
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_sync_version 
  ON whatsapp_sessions(sync_version);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_source_updated_at 
  ON conversation_logs(source_updated_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_sync_version 
  ON site_visits(sync_version);
```

**Files to Update:**
- `backend-ai/app/db/models.py` - Add new columns to existing models
- `backend-ai/app/services/sync_service.py` - Use idempotency keys
- `backend-ai/app/middleware/auth_middleware.py` - Filter by assigned_leads_count

---

### V10: Data Sync Tracking (New Table)

```sql
-- backend-java/src/main/resources/db/migration/V10__add_data_sync_log_enhanced.sql

-- Drop old table if exists from Phase 3 design (if manually created)
DROP TABLE IF EXISTS data_sync_log CASCADE;

-- Create enhanced sync log
CREATE TABLE data_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sync details
    sync_type VARCHAR(100) NOT NULL,       -- "full", "incremental", "on_demand"
    source VARCHAR(100) NOT NULL DEFAULT 'leadrat_api',
    target VARCHAR(100) NOT NULL DEFAULT 'chatbot_crm',
    entity_type VARCHAR(100) NOT NULL,     -- "lead", "property", "project"
    
    -- Statistics
    records_synced INT DEFAULT 0,
    records_created INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    records_deleted INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INT,
    
    -- Status & error tracking
    status VARCHAR(100) NOT NULL,          -- "success", "partial", "failed"
    error_message TEXT,
    error_count INT DEFAULT 0,
    
    -- Idempotency
    sync_version INTEGER,
    idempotency_key VARCHAR(255) UNIQUE,
    
    -- Context
    initiated_by VARCHAR(100),             -- "webhook", "scheduler", "manual", "api"
    webhook_id VARCHAR(255),               -- If triggered by webhook
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_sync_log_entity_type ON data_sync_log(entity_type);
CREATE INDEX idx_data_sync_log_status ON data_sync_log(status);
CREATE INDEX idx_data_sync_log_started_at ON data_sync_log(started_at DESC);
CREATE INDEX idx_data_sync_log_completed_at ON data_sync_log(completed_at DESC);
CREATE INDEX idx_data_sync_log_sync_version ON data_sync_log(sync_version);
CREATE TRIGGER data_sync_log_update_trigger BEFORE UPDATE ON data_sync_log
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Files to Update:**
- `backend-ai/app/db/models.py` - Add DataSyncLog model
- `backend-ai/app/services/sync_service.py` - Log all sync operations
- `backend-ai/app/routers/admin.py` - New endpoint to view sync history

---

## 7. IMPLEMENTATION SEQUENCE

```
Week 1: Foundation
├─ V6: tenant_configs (2 hours)
│  └─ Update config loading, test Leadrat auth
├─ V7: conversation_memory (2 hours)
│  └─ Test memory compression, session archive
└─ V8: audit_logs (2 hours)
   └─ Test audit middleware

Week 2: Enhancements
├─ V9: idempotent sync columns (3 hours)
│  └─ Test idempotency, conflict resolution
├─ V10: data_sync_log (2 hours)
│  └─ Test sync monitoring
└─ Testing & Validation (3 hours)
   └─ Load test all new queries
   └─ Verify no Phase 2 breakage
   └─ Performance check

Total: ~15-18 hours (2 weeks with testing)
```

---

## 8. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Flyway migration fails | Deploy blocked | Test migrations locally first in dev DB |
| Data loss on ALTER | Critical | Use `IF NOT EXISTS`, backup DB before V9 |
| Performance regression | Slow searches | Add indexes proactively in migrations |
| PII exposed in audit_logs | Security breach | Mask PII before writing to audit_logs |
| Sync idempotency key collision | Duplicate syncs | Test uniqueness constraint with concurrent syncs |
| Alembic models out of sync | Confusion | Remove Alembic or use Flyway exclusively |

---

## 9. FILES TO BE CREATED/MODIFIED

### New Files (5)

```
backend-java/src/main/resources/db/migration/
├─ V6__add_tenant_configs.sql
├─ V7__add_conversation_memory.sql
├─ V8__add_audit_logs.sql
├─ V9__add_idempotent_sync_columns.sql
└─ V10__add_data_sync_log_enhanced.sql
```

### Modified Files (6)

| File | Changes | Impact |
|------|---------|--------|
| `backend-ai/app/db/models.py` | Add 4 new models + 5 new columns | Core |
| `backend-ai/app/db/crud.py` | Add CRUD for new tables | Core |
| `backend-ai/app/config.py` | Add encryption key config | Core |
| `backend-ai/app/middleware/auth_middleware.py` | Add row-level filtering | Auth |
| `backend-ai/app/services/sync_service.py` | Use idempotency, log syncs | Sync |
| `backend-ai/app/services/audit_middleware.py` | NEW - Log all actions | Security |

---

## 10. VERIFICATION CHECKLIST

- [ ] All V1-V5 migrations already applied (Flyway history table)
- [ ] All 9 tables exist in `crm_cbt_db_dev`
- [ ] SQLAlchemy models match database schema
- [ ] Seed data present (default tenant, admin, bot config)
- [ ] PostgreSQL version supports UUID, JSONB, trigram
- [ ] No existing `tenant_configs`, `conversation_memory`, `audit_logs` tables
- [ ] Alembic decision made (use Flyway or drop Alembic?)
- [ ] Backup of `crm_cbt_db_dev` taken before running migrations
- [ ] Encryption key configured in .env
- [ ] Row-level security tested with different roles

---

## DECISION NEEDED FROM USER

Before implementation, please confirm:

1. **Migration Strategy:** Use Flyway (V6-V10) or Alembic?
   - ✅ Recommended: Flyway (consistency with V1-V5)
   - ❌ Alternative: Alembic (Python-only)

2. **Order of Implementation:** V6 → V10 or different sequence?

3. **Encryption Strategy:** Use Fernet (recommended) or AWS KMS?

4. **Row-Level Security:** App-level filtering or PostgreSQL RLS?

5. **Backup:** Should we backup `crm_cbt_db_dev` before running migrations?

---

## APPROVED CHANGES (No Breaking Changes)

✅ **Safe to Proceed:**
- All new tables and columns use `IF NOT EXISTS`
- No dropping of existing tables
- No renaming of existing columns
- All `ALTER TABLE` statements use `ADD COLUMN IF NOT EXISTS`
- No changes to constraints or indexes of existing tables
- Phase 2 functionality remains untouched
- Backwards compatible with existing FastAPI/Spring Boot code

---

**Status:** ✅ READY FOR USER REVIEW AND DECISION

**Next Step:** User approves migration strategy (Flyway vs Alembic), then implementation begins.
