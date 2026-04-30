# ⚠️ PRODUCTION SCHEMA REFERENCE
## Complete Database Access & Inspection Guide

**🔴 STATUS: PRODUCTION EXECUTION DOCUMENT**  
**Do not execute without approved maintenance window and verified backups.**

**Status:** To be created AFTER Stage 2 migration completes  
**Date:** Updated 2026-04-28

### SAFETY CRITICAL WARNINGS

- ⚠️ This document describes the PRODUCTION database schema
- ⚠️ All commands in this guide connect to LIVE production data
- ⚠️ Use READ ONLY transactions (BEGIN READ ONLY;) for all inspections
- ⚠️ NEVER manually modify schema - use Flyway migrations only
- ⚠️ NEVER execute UPDATE/DELETE/INSERT commands directly
- ⚠️ One-time backups before any migrations are MANDATORY

---

## 1. DATABASE INSTANCES

### PRIMARY APPLICATION DATABASE (PRODUCTION)
- **Database Name:** `crm_cbt_db_dev` (⚠️ Naming legacy - this IS the production database)
- **Logical Name:** `ACTIVE_RUNTIME_DB` (use this in internal docs to avoid confusion)
- **Host:** `postgres` (Docker container) OR `localhost` (direct connection)
- **Port:** `5432`
- **Username:** `rootuser`
- **Authentication:** Password-based (stored in env var `DB_PASSWORD`)
- **Status:** 🔴 PRODUCTION - Live application database
- **Contains:** Live tenant data, conversations, all migrations (V1-V10 after Stage 2)
- **⚠️ CRITICAL:** This is PRODUCTION. Any changes require approval. Backups are mandatory before any migrations.

### Staging Environment (Testing)
- **Database Name:** `crm_cbt_db_dev_staging`
- **Host:** `postgres` (Docker container) OR `localhost` (direct connection)
- **Port:** `5432`
- **Username:** `rootuser`
- **Authentication:** Password-based (stored in env var `DB_PASSWORD`)
- **Status:** Stage 1 testing database (temporary)
- **Contains:** Copy of production at migration start for safe testing
- **Note:** Can be dropped/recreated for new testing cycles

### Local Development (Optional)
- Use docker-compose to run local instances
- Same credentials as above
- Database names can vary per setup

---

## 2. CONNECTION METHODS

### Method A: psql Command Line (Recommended for inspections)

**From Docker host (fastest):**
```bash
# Connect to PRODUCTION database
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev

# Connect to STAGING database (after Stage 1)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging

# List all commands
\?

# List all tables
\dt

# Describe a table
\d table_name

# Exit
\q
```

**From localhost (requires PostgreSQL client installed):**
```bash
# Set password if prompted
export PGPASSWORD="$DB_PASSWORD"

# Connect to production
psql -h localhost -U rootuser -d crm_cbt_db_dev

# Unset password after done
unset PGPASSWORD
```

### Method B: DBeaver (GUI Tool)

1. **Download:** https://dbeaver.io/
2. **Create New Database Connection:**
   - Driver: PostgreSQL
   - Host: `localhost` (if running locally) or server IP
   - Port: `5432`
   - Database: `crm_cbt_db_dev` (production) or `crm_cbt_db_dev_staging` (staging)
   - Username: `rootuser`
   - Password: (from `DB_PASSWORD` env var)
   - Test Connection → OK
3. **Browse Tables:** Left panel → Database → crm_cbt_db_dev → Tables
4. **Write Queries:** Right-click database → SQL Editor → New SQL Script

### Method C: pgAdmin (Web-Based Tool)

1. **Access:** http://localhost:5050 (if running in docker-compose)
2. **Login:** admin@example.com / admin (default, change in production)
3. **Add Server:**
   - Name: production-db
   - Host: postgres (Docker) or localhost
   - Port: 5432
   - Username: rootuser
   - Password: (from `DB_PASSWORD` env var)
   - Save
4. **Browse:** Server → Databases → crm_cbt_db_dev → Schemas → public → Tables

---

## 3. COMPLETE TABLE INVENTORY (After V10 Migration)

### Table Count Summary
- **Application Tables:** 13 total
  - Existing tables (V1-V5): 9 tables
  - New tables (V6-V10): 4 tables
- **System Tables:** 1 (flyway_schema_history)
- **Total:** 14 tables including system table

### EXISTING TABLES (V1-V5 Migrations - Pre-existing - 9 tables)

#### 1. **tenants** (V1)
- Multi-tenant support for SaaS model
- Fields: id (UUID), slug (VARCHAR 50), plan (VARCHAR), is_active (BOOLEAN), created_at, updated_at
- Primary Key: id
- Index: tenant_slug (unique)

#### 2. **users** (V1)
- Team members and bot managers
- Fields: id (UUID), tenant_id (FK → tenants), email, password_hash, full_name, role (RM/Admin/Bot), whatsapp_number, is_active, created_at, updated_at
- Primary Key: id
- Indexes: tenant_id, email (unique per tenant)
- Foreign Key: tenant_id → tenants(id)

#### 3. **bot_configs** (V1)
- Chatbot personality and settings per tenant
- Fields: id (UUID), tenant_id (FK), persona_name, greeting_message, tone, active_hours_start/end, after_hours_message, language, is_active, created_at, updated_at
- Primary Key: id
- Foreign Key: tenant_id → tenants(id)

#### 4. **whatsapp_sessions** (V2)
- Active conversations with WhatsApp contacts
- Fields: id (UUID), tenant_id (FK), whatsapp_number, leadrat_lead_id, session_data (JSONB), visit_booking_state (JSONB), current_intent, message_count, last_active, created_at, updated_at
- NEW V9 FIELDS: sync_status, sync_error, last_synced_at, source_updated_at, record_checksum, idempotency_key
- Primary Key: id
- Indexes: tenant_id, whatsapp_number, leadrat_lead_id, sync_status, source_updated_at, idempotency (unique scoped to tenant_id)
- Foreign Key: tenant_id → tenants(id)

#### 5. **conversation_logs** (V2)
- Message history for conversations
- Fields: id (UUID), tenant_id (FK), session_id (FK), whatsapp_number, leadrat_lead_id, message (TEXT), role (user/assistant), intent, confidence, media_shared (JSONB), processing_ms, llm_provider, created_at, updated_at
- NEW V9 FIELDS: sync_status, sync_error, source_updated_at, record_checksum
- Primary Key: id
- Indexes: tenant_id, session_id, leadrat_lead_id, sync_status, source_updated_at
- Foreign Key: tenant_id → tenants(id), session_id → whatsapp_sessions(id)
- Retention: 90 days (old records auto-deleted)

#### 6. **site_visits** (V3)
- Scheduled property visits for leads
- Fields: id (UUID), tenant_id (FK), leadrat_lead_id, leadrat_project_id, leadrat_visit_id, customer_name, whatsapp_number, rm_id (FK → users), scheduled_at, duration_minutes, visitor_count, status (scheduled/completed/cancelled), notes, google_maps_link, reminder_24h_sent, reminder_2h_sent, leadrat_synced, leadrat_sync_error, cancelled_reason, created_at, updated_at
- NEW V9 FIELDS: sync_status, sync_error, last_synced_at, source_updated_at, record_checksum, idempotency_key
- Primary Key: id
- Indexes: tenant_id, leadrat_lead_id, rm_id, sync_status, source_updated_at, idempotency (unique scoped to tenant_id)
- Foreign Keys: tenant_id → tenants(id), rm_id → users(id)

#### 7. **ai_query_logs** (V4)
- Audit trail for AI query execution
- Fields: id (UUID), tenant_id (FK), user_id (FK), query_text (TEXT), interpreted_query (TEXT), result_type (lead/property/project/general), result_summary (TEXT), execution_ms, was_successful (BOOLEAN), error_message (TEXT), created_at, updated_at
- Primary Key: id
- Indexes: tenant_id, user_id, created_at
- Foreign Keys: tenant_id → tenants(id), user_id → users(id)

#### 8. **saved_reports** (V4)
- User-saved search queries and reports
- Fields: id (UUID), tenant_id (FK), user_id (FK), name (VARCHAR), query_text (TEXT), chart_type (bar/pie/line), filters (JSONB), is_pinned (BOOLEAN), schedule (cron expression), schedule_recipients (JSONB array of emails), last_run_at, created_at, updated_at
- Primary Key: id
- Indexes: tenant_id, user_id, is_pinned
- Foreign Keys: tenant_id → tenants(id), user_id → users(id)

#### 9. **analytics_summary** (V4)
- Daily aggregated metrics
- Fields: id (UUID), tenant_id (FK), summary_date (DATE), total_messages, total_sessions, total_visits_scheduled, total_visits_completed, average_response_time_ms, total_tokens_used, failed_queries, success_rate, created_at, updated_at
- NEW V9 FIELD: cache_invalidated_at
- Primary Key: id
- Indexes: tenant_id, summary_date (unique per tenant per day)
- Foreign Key: tenant_id → tenants(id)

---

### CRITICAL: Tenant Identifier Strategy

**Multi-tenancy uses `tenant_id` (UUID foreign key) across ALL tables:**
- All existing tables (V1-V5) use: `tenant_id UUID FK → tenants(id)`
- All new tables (V6-V10) use: `tenant_id UUID FK → tenants(id)`
- **Single source of truth:** `tenants.id` is UUID primary key

**Note on previous discussions:**
- Earlier architectural discussions mentioned `tenant_code` (VARCHAR string identifier)
- **Decision made:** Using UUID `tenant_id` is more robust for foreign keys and indexing
- This is the authoritative implementation across the entire schema

**When querying:**
```sql
-- Always filter by tenant_id (UUID), not tenant_code
SELECT * FROM conversation_logs WHERE tenant_id = 'actual-uuid-here'::uuid;
```

---

### NEW TABLES (V6-V10 Migrations - Newly Added - 4 tables)

#### 10. **tenant_configs** (V6)
- Per-tenant feature flags and settings
- Purpose: Enable/disable features per tenant, store tenant-specific configuration
- Fields: id (UUID), tenant_id (FK → tenants, unique), feature_flags (JSONB), encryption_keys (JSONB encrypted), sync_strategy (VARCHAR: full/incremental), max_conversations_per_session (INT), max_conversation_history_days (INT), enable_audit_logs (BOOLEAN), created_at, updated_at
- Primary Key: id
- Unique Index: tenant_id
- Foreign Key: tenant_id → tenants(id)
- Sample Data: Stores which features are enabled, encryption keys for PII, sync strategies

#### 11. **conversation_memory** (V7)
- Long-term context for multi-turn conversations
- Purpose: Maintain conversation history with TTL, avoid token bloat
- Fields: id (UUID), tenant_id (FK), session_id (FK → whatsapp_sessions), context_key (VARCHAR), context_value (JSONB), priority (INT: 0-100), expires_at (TIMESTAMPTZ: 24h default), created_at, updated_at
- Primary Key: id
- Indexes: tenant_id, session_id, expires_at (for cleanup)
- Foreign Keys: tenant_id → tenants(id), session_id → whatsapp_sessions(id)
- **TTL Cleanup Mechanism:**
  - FastAPI background worker runs every 1 hour (configurable)
  - Uses batched deletion to avoid long locks on high-write tables
  - Logs cleanup in application logs (FastAPI startup logs)
  - Frequency: Configurable in backend-ai/.env: `CONVERSATION_MEMORY_CLEANUP_INTERVAL_MINUTES=60`
- **Manual cleanup (if needed) - BATCHED for safety:**
  ```sql
  -- Check expired records
  SELECT COUNT(*) FROM conversation_memory WHERE expires_at < NOW();
  
  -- Delete expired records in batches (safer for production)
  -- This avoids locking the entire table for long periods
  DELETE FROM conversation_memory
  WHERE id IN (
    SELECT id
    FROM conversation_memory
    WHERE expires_at < NOW()
    LIMIT 1000
  );
  
  -- Repeat batch delete until all expired records removed
  -- Verification:
  SELECT COUNT(*) FROM conversation_memory WHERE expires_at < NOW();
  -- Expected: 0 (all expired records deleted)
  
  -- ⚠️ NEVER use: DELETE FROM conversation_memory WHERE expires_at < NOW();
  -- Reason: Can lock table for extended time on large datasets
  ```
- Retention Policy: Default 24 hours (configurable per tenant in `tenant_configs`)
- Sample Data: Customer preferences, previous queries, conversation summary

#### 12. **audit_logs** (V8)
- Compliance audit trail with PII masking
- Purpose: Track all data access, changes, and API calls for compliance
- Fields: id (UUID), tenant_id (FK), user_id (FK), entity_type (VARCHAR: lead/conversation/visit), entity_id (UUID), action (VARCHAR: CREATE/READ/UPDATE/DELETE), old_value (JSONB, PII masked), new_value (JSONB, PII masked), ip_address (INET), user_agent (VARCHAR), timestamp
- Primary Key: id
- Indexes: tenant_id, user_id, entity_type, action, timestamp (DESC)
- Foreign Keys: tenant_id → tenants(id), user_id → users(id) [NULL for system]
- PII Masking: Phone numbers → ***-****-XXXX, Emails → ***@***.com, Names → Fn*** L***
- **Retention Policy (CRITICAL):**
  - Online records: 90 days (GDPR compliance window)
  - Archive records: 2 years (Legal hold requirement)
  - Cleanup: Automatic via background job (runs daily at 2 AM UTC)
  - Manual archive: `PARTITION BY YEAR(timestamp)` for efficient archival
- **Growth Management:**
  - Expected size: ~1-2 MB per 10,000 transactions
  - At 1M transactions/month: ~100-200 MB/month = 3-6 GB/year
  - Mitigation: Archive to `audit_logs_archive` table after 90 days
  - Compression: Archived records compressed at rest
- **Monitoring (Critical):**
  ```sql
  -- Monitor table growth
  SELECT pg_size_pretty(pg_total_relation_size('audit_logs')) as size;
  
  -- Check age of oldest records
  SELECT MIN(timestamp) as oldest_record FROM audit_logs;
  
  -- Delete records older than 90 days (if archival failed)
  DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '90 days';
  ```
- Sample Data: "User A viewed Lead B", "System synced property P", "Admin deleted conversation C"

#### 13. **data_sync_logs** (V9)
- Leadrat CRM sync metadata and deduplication
- Purpose: Track sync status, retry failed syncs, detect conflicts
- Fields: id (UUID), tenant_id (FK), source_table (VARCHAR: whatsapp_sessions/site_visits/conversation_logs), source_record_id (UUID), leadrat_entity_type (VARCHAR: lead/property/project), leadrat_entity_id (VARCHAR), sync_status (VARCHAR: pending/synced/failed/conflict), attempt_count (INT), last_error (TEXT), record_checksum_before (VARCHAR), record_checksum_after (VARCHAR), idempotency_key (VARCHAR unique per tenant), conflict_resolution (VARCHAR: manual_review/auto_merge), resolved_by_user_id (FK → users), resolved_at, created_at, updated_at
- Primary Key: id
- Indexes: tenant_id, sync_status, source_table, created_at
- Unique Index: (tenant_id, idempotency_key)
- Foreign Keys: tenant_id → tenants(id), resolved_by_user_id → users(id)
- Sample Data: Tracks which Leadrat syncs succeeded/failed, deduplication for idempotent operations

---

## 4. ENTITY RELATIONSHIPS (ER Diagram)

```
┌─────────────────┐
│    tenants      │  (Multi-tenant root)
│  (id: UUID)     │
└────────┬────────┘
         │ (has many)
         │
    ┌────┴──────────────────────────────┬──────────────┬──────────────┐
    │                                    │              │              │
    │                                    │              │              │
┌───▼──────────┐  ┌──────────────┐  ┌───▼──────┐  ┌──▼──────────┐  ┌▼──────────┐
│    users     │  │ bot_configs  │  │tenant_   │  │conversation│  │analytics_ │
│(FK tenant_id)│  │(FK tenant_id)│  │configs   │  │   memory   │  │  summary  │
└───┬──────────┘  └──────────────┘  │(FK tnt)  │  │(FK tenant, │  │(FK tenant)│
    │                                │          │  │   session) │  │           │
    │ (manages)                       └──────────┘  └────────────┘  └───────────┘
    │
    │                    ┌──────────────────┐
    │                    │ whatsapp_        │
    │                    │ sessions         │
    │                    │(FK tenant_id)    │
    │                    │(leadrat_lead_id) │
    │                    │(sync metadata v9)│
    │                    └────┬─────────────┘
    │                         │ (has many)
    │                         │
    │                    ┌────▼──────────────┐
    │                    │ conversation_logs │
    │                    │(FK tenant, session│
    │                    │(leadrat_lead_id) │
    │                    │(sync metadata v9)│
    │                    └───────────────────┘
    │
    └────────────┬─────────────────────────────────┐
                 │ (rm_id FK to users)              │
                 │                                  │
            ┌────▼────────────────┐           ┌────▼──────────────┐
            │   site_visits       │           │ audit_logs         │
            │(FK tenant_id)       │           │(FK user_id opt)    │
            │(FK rm_id→users)     │           │(FK tenant_id)      │
            │(leadrat_*_id fields)│           │(entity_type,action)│
            │(sync metadata v9)   │           │(pii masked values) │
            └─────────────────────┘           └────────────────────┘

                                        ┌────────────────────┐
                                        │ data_sync_logs     │
                                        │(FK tenant_id)      │
                                        │(FK resolved_by_user│
                                        │(source_table,id)   │
                                        │(leadrat_entity_*)  │
                                        │(idempotency_key)   │
                                        │(checksum fields)   │
                                        │(conflict_resolution│
                                        └────────────────────┘

        ┌──────────────────┐
        │   saved_reports  │
        │(FK tenant_id)    │
        │(FK user_id)      │
        │(filters: JSONB)  │
        │(schedule: cron)  │
        └──────────────────┘

        ┌──────────────────┐
        │   ai_query_logs  │
        │(FK tenant_id)    │
        │(FK user_id)      │
        │(result_type)     │
        │(execution_ms)    │
        └──────────────────┘
```

---

## 5. DATA STORAGE OVERVIEW

### Chatbot Conversations
**Where stored:**
- `whatsapp_sessions` — Active conversation state and metadata
- `conversation_logs` — Individual messages in the conversation
- `conversation_memory` — Long-term context (24h TTL)

**Query example:**
```sql
-- Get last 10 messages in a conversation
SELECT cl.message, cl.role, cl.intent, cl.created_at
FROM conversation_logs cl
WHERE cl.session_id = 'session-uuid-here'
ORDER BY cl.created_at DESC
LIMIT 10;
```

### Sync Metadata
**Where stored:**
- `whatsapp_sessions` — sync_status, sync_error, last_synced_at, record_checksum, idempotency_key
- `conversation_logs` — sync_status, sync_error, source_updated_at, record_checksum
- `site_visits` — sync_status, sync_error, last_synced_at, source_updated_at, record_checksum, idempotency_key
- `data_sync_logs` — Central audit: what synced, conflicts, resolution

**Query example:**
```sql
-- Find conversations that failed to sync
SELECT sl.id, sl.whatsapp_number, sl.sync_status, sl.sync_error, sl.last_synced_at
FROM whatsapp_sessions sl
WHERE sl.tenant_id = 'tenant-uuid' AND sl.sync_status = 'failed'
ORDER BY sl.last_synced_at DESC;
```

### Tenant Mappings
**Where stored:**
- `tenants` — SaaS tenant definition
- `users` — Team members assigned to tenant
- `tenant_configs` — Per-tenant feature flags and settings
- All tables have `tenant_id (UUID FK)` for data isolation

**Query example:**
```sql
-- Get all users in a tenant
SELECT u.email, u.full_name, u.role
FROM users u
WHERE u.tenant_id = 'tenant-uuid'
AND u.is_active = true
ORDER BY u.email;
```

### Synced Leads/Properties/Projects (Future)
**Currently not stored locally** — These will be added in Phase 4:
- Will reference `leadrat_lead_id`, `leadrat_property_id`, `leadrat_project_id` from API responses
- May eventually have local cache tables for performance (e.g., `leads_cache`)
- For now: Live queries to Leadrat API via FastAPI `/api/v1/leadrat/leads/search`

---

## 6. INSPECTION QUERIES

### 6.1 Verify Migration Completeness

```sql
-- Check Flyway version (should be 10)
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 1;

-- List all successful migrations
SELECT version, description, installed_on 
FROM flyway_schema_history 
WHERE success = true 
ORDER BY installed_rank;

-- Count migrations
SELECT COUNT(*) as total_migrations 
FROM flyway_schema_history 
WHERE success = true;
```

### 6.2 Inspect Sync Logs

```sql
-- Recent sync failures
SELECT id, source_table, leadrat_entity_type, sync_status, last_error, created_at
FROM data_sync_logs
WHERE tenant_id = 'YOUR-TENANT-UUID'
AND sync_status IN ('failed', 'conflict')
ORDER BY created_at DESC
LIMIT 20;

-- Sync success rate (last 24h)
SELECT 
  sync_status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM data_sync_logs
WHERE tenant_id = 'YOUR-TENANT-UUID'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY sync_status;

-- Idempotency key usage (deduplication)
SELECT COUNT(DISTINCT idempotency_key) as unique_operations
FROM data_sync_logs
WHERE tenant_id = 'YOUR-TENANT-UUID'
AND idempotency_key IS NOT NULL;
```

### 6.3 Inspect Conversation Memory

```sql
-- Active memory entries (not expired)
SELECT session_id, context_key, context_value, priority, expires_at
FROM conversation_memory
WHERE tenant_id = 'YOUR-TENANT-UUID'
AND expires_at > NOW()
ORDER BY priority DESC, expires_at;

-- Memory about to expire (next 1 hour)
SELECT session_id, context_key, expires_at
FROM conversation_memory
WHERE tenant_id = 'YOUR-TENANT-UUID'
AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '1 hour'
ORDER BY expires_at;

-- Cleanup: Count expired records
SELECT COUNT(*) as expired_records
FROM conversation_memory
WHERE tenant_id = 'YOUR-TENANT-UUID'
AND expires_at < NOW();
```

### 6.4 Inspect Audit Logs (with PII Masking)

```sql
-- Recent activities for a user
SELECT user_id, entity_type, entity_id, action, old_value, new_value, timestamp
FROM audit_logs
WHERE tenant_id = 'YOUR-TENANT-UUID'
AND user_id = 'USER-UUID'
ORDER BY timestamp DESC
LIMIT 20;

-- All deletions (potential data loss tracking)
SELECT user_id, entity_type, entity_id, action, old_value, timestamp
FROM audit_logs
WHERE tenant_id = 'YOUR-TENANT-UUID'
AND action = 'DELETE'
ORDER BY timestamp DESC;

-- IP addresses accessing the system
SELECT DISTINCT ip_address, COUNT(*) as request_count
FROM audit_logs
WHERE tenant_id = 'YOUR-TENANT-UUID'
GROUP BY ip_address
ORDER BY request_count DESC;
```

### 6.5 Inspect Tenant Configs

```sql
-- Check which features are enabled for a tenant
SELECT feature_flags::text as flags
FROM tenant_configs
WHERE tenant_id = 'YOUR-TENANT-UUID';

-- Check sync strategy
SELECT sync_strategy, max_conversations_per_session, max_conversation_history_days
FROM tenant_configs
WHERE tenant_id = 'YOUR-TENANT-UUID';
```

### 6.6 PostgreSQL Lock Diagnostics (Critical for Migrations)

```sql
-- CRITICAL: Detect blocked transactions and migration locks
SELECT 
    blocked.pid AS blocked_pid,
    blocked.query AS blocked_query,
    blocked.application_name AS blocked_app,
    blocking.pid AS blocking_pid,
    blocking.query AS blocking_query,
    blocking.application_name AS blocking_app,
    NOW() - blocking.query_start AS lock_duration
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
    ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.datname = current_database();

-- INTERPRETATION:
-- If rows returned: Something is blocked
-- blocked_pid = PID of query waiting
-- blocking_pid = PID of query holding the lock
-- lock_duration = how long lock has been held

-- COMMON MIGRATION ISSUES:
-- 1. Long-running transaction holding lock
--    Solution: CANCEL blocking_pid, re-run migration
-- 2. Idle transaction in READ ONLY holding lock
--    Solution: Terminate idle connection
-- 3. Application still connected to old schema
--    Solution: Restart application, retry migration

-- Terminate blocking query (use with caution):
-- SELECT pg_terminate_backend(blocking_pid);

-- Check for long-running DDL operations (migrations):
SELECT 
    pid,
    usename,
    query,
    NOW() - query_start AS duration,
    state
FROM pg_stat_activity
WHERE datname = current_database()
AND query ILIKE '%ALTER%' OR query ILIKE '%CREATE%' OR query ILIKE '%DROP%'
ORDER BY query_start;

-- DURING MIGRATION: Monitor this query every 10 seconds
-- If duration > 5 minutes, investigate blocking locks
-- If error appears, migration may have failed
```

**Lock Diagnostics During Migration:**
- Run every 10 seconds while migration is running
- If blocked pids > 0: migration is waiting
- If blocking query = idle: terminate the blocker
- If blocking query = application code: restart that service
- If duration > 10 minutes: escalate to DBA, consider rollback

---

### 6.7 Schema Statistics & Connection Pooling Monitoring

```sql
-- Table sizes (in MB)
SELECT 
  schemaname,
  tablename,
  ROUND(pg_total_relation_size(schemaname||'.'||tablename) / 1024.0 / 1024.0, 2) as size_mb
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_mb DESC;

-- Index count per table
SELECT 
  t.tablename,
  COUNT(i.indexname) as index_count
FROM pg_tables t
LEFT JOIN pg_indexes i ON t.tablename = i.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY index_count DESC;

-- Total database size
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;

-- CRITICAL: Active connections (connection pool monitoring)
SELECT 
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active_queries,
  COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = current_database();

-- Connections by application (identify leaks)
SELECT 
  application_name,
  usename,
  COUNT(*) as connection_count,
  state
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY application_name, usename, state
ORDER BY connection_count DESC;

-- Long-running queries (potential bottleneck)
SELECT 
  pid,
  usename,
  application_name,
  state,
  query,
  NOW() - query_start as duration
FROM pg_stat_activity
WHERE datname = current_database()
AND state = 'active'
AND NOW() - query_start > INTERVAL '5 seconds'
ORDER BY duration DESC;

-- Connection pool health (if using pg_bounce or similar)
-- Max connections allowed
SELECT current_setting('max_connections') as max_db_connections;

-- Warning: If active_connections approaches max_connections, connection pool is exhausted
```

**⚠️ CRITICAL ALERT THRESHOLDS:**
- Active queries > 20: Investigate slow queries
- Idle connections > 50: Check for connection leaks (restart services if needed)
- Long-running queries > 30 seconds: Likely dead connection or slow query
- Used connections > 80% of max: Risk of connection exhaustion

---

## 7. SAFE PRODUCTION INSPECTION GUIDELINES

### ⚠️ CRITICAL: READ-ONLY INSPECTION ONLY

**When inspecting production database:**
- ✅ **ALLOWED:** SELECT queries only
- ❌ **FORBIDDEN:** UPDATE, DELETE, INSERT, DROP, ALTER
- ❌ **FORBIDDEN:** Manual schema changes (use Flyway migrations only)
- ❌ **FORBIDDEN:** TRUNCATE table operations

**SAFER: Transaction-scoped read-only (Recommended)**
```sql
-- Wrap queries in read-only transaction (safest approach)
BEGIN READ ONLY;

-- Run your inspection queries here
SELECT * FROM whatsapp_sessions LIMIT 10;
SELECT COUNT(*) FROM conversation_logs;

-- Automatically rolled back - no changes possible
COMMIT;

-- Try to write - this will fail:
UPDATE whatsapp_sessions SET sync_status = 'test';
-- ERROR: cannot execute UPDATE in a read-only transaction
```

**Session-level read-only mode (Alternative)**
```bash
# Connect with session-level readonly (can still be overridden by SUPERUSER)
PGOPTIONS='-c default_transaction_read_only=on' psql -U rootuser -d crm_cbt_db_dev

# Or inside psql:
SET default_transaction_read_only = on;
```

**Verify you're in read-only mode:**
```sql
-- This command will fail if read-only is enabled:
CREATE TEMPORARY TABLE test (id INT);

-- If you see "ERROR: cannot execute CREATE TABLE in a read-only transaction", you're safe
```

**⚠️ CRITICAL:** Transaction-scoped `BEGIN READ ONLY;` is safer than session-level because:
- Cannot be overridden even by superuser
- Auto-rolls back all changes if connection drops
- Explicit scope - easier to audit
- Recommended for production inspection

**Safe query patterns:**
```sql
-- ✅ SAFE - Information gathering
SELECT * FROM conversation_logs LIMIT 10;
SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 day';
SELECT tablename FROM pg_tables WHERE schemaname='public';

-- ✅ SAFE - Inspection
EXPLAIN SELECT * FROM whatsapp_sessions WHERE tenant_id = 'xxx';

-- ⚠️  ANALYZE SAFETY NOTES:
-- - Full ANALYZE scans entire database and can spike IO/CPU
-- - Only run ANALYZE during maintenance windows
-- - SAFER: Analyze specific tables instead
ANALYZE whatsapp_sessions;  -- Safer: specific table only
ANALYZE conversation_logs;  -- Safer: specific table only

-- -- Or use transaction-scoped:
-- BEGIN READ ONLY;
-- ANALYZE whatsapp_sessions;
-- COMMIT;

-- ❌ UNSAFE - Data modification
UPDATE whatsapp_sessions SET sync_status = 'synced' WHERE id = 'xxx';
DELETE FROM conversation_logs WHERE id = 'xxx';
INSERT INTO tenants VALUES (...);
ALTER TABLE conversation_logs ADD COLUMN new_col VARCHAR;

-- ❌ UNSAFE - Manual migrations (use Flyway only)
DROP TABLE audit_logs;
CREATE INDEX idx_new ON some_table(column);
TRUNCATE TABLE temp_data;
```

**If you accidentally modify data:**
1. Do NOT commit
2. Type `ROLLBACK;` immediately to undo changes
3. Report the incident to the DevOps team
4. Coordinate rollback from backup if committed

---

## 8. DATABASE INSPECTION WORKFLOW

### Quick Health Check (2 minutes)

```bash
# 1. Check Flyway version (must be 10 after Stage 2)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT MAX(version::int) as schema_version FROM flyway_schema_history WHERE success=true;"

# Expected: schema_version = 10

# 2. Verify all required migrations applied
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT COUNT(*) as migration_count FROM flyway_schema_history WHERE success=true AND version IN (1,2,3,4,5,6,7,8,9,10);"

# Expected: migration_count = 10

# 3. Count tables (should be 13 application tables + 1 system = 14 total)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Expected: 14

# 4. Check for recent sync failures
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT COUNT(*) as failed_syncs FROM data_sync_logs WHERE sync_status='failed' AND created_at > NOW() - INTERVAL '1 hour';"

# Expected: < 10 (some failures acceptable, ongoing retries)

# 5. Database size
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT pg_size_pretty(pg_database_size('crm_cbt_db_dev'));"

# Expected: 10-100 MB (depending on data volume)

# 6. Active connections (should be < max_connections)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT COUNT(*) as active_connections FROM pg_stat_activity WHERE datname='crm_cbt_db_dev';"

# Expected: < 20 (investigate if > 50)
```

### Pre-Backup Disk Space Check (1 minute - CRITICAL)

**Before creating any backup, verify disk space:**

```bash
# 1. Check available disk space
df -h /home
df -h ~/db_backups

# Expected: At least 1.5x the database size free
# Example: If database is 50MB, need 75MB free minimum

# 2. Check database size
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT pg_size_pretty(pg_database_size('crm_cbt_db_dev')) as db_size;"

# 3. Estimate compressed backup size (usually 5-20% of original)
# If DB is 50MB, compressed backup will be ~5-10MB

# 4. Verify backup directory exists and is writable
ls -la ~/db_backups
touch ~/db_backups/.write_test && rm ~/db_backups/.write_test

# If any check fails:
# - Clean up old backups: rm ~/db_backups/crm_cbt_db_dev_pre_stage2_*.sql.gz
# - Or expand disk space before proceeding
```

**⚠️ CRITICAL:** If disk is < 50% free, DO NOT START STAGE 2 migration. Backup creation will fail and leave database in inconsistent state.

---

### Backup Verification & Corruption Detection (CRITICAL)

**After backup is created, MUST verify integrity before migration:**

```bash
# 1. Verify backup file exists and has content
ls -lh ~/db_backups/crm_cbt_db_dev_pre_stage2_*.sql.gz

# 2. CRITICAL: Test gzip integrity (detects corruption)
gunzip -t ~/db_backups/crm_cbt_db_dev_pre_stage2_*.sql.gz

# Expected output: (silence = success)
# If error: "gzip: ... unexpected end of file" = CORRUPTED BACKUP
# Action: Re-create backup, do NOT proceed with migration

# 3. CRITICAL: Create and verify checksum
sha256sum ~/db_backups/crm_cbt_db_dev_pre_stage2_*.sql.gz > ~/db_backups/backup.sha256
cat ~/db_backups/backup.sha256

# Save checksum to separate location (safe from disk failure)
# Store in: ticket system, email, document

# 4. Verify checksum integrity (before restore)
sha256sum -c ~/db_backups/backup.sha256

# Expected output: "...OK"
# If fails: file may have been corrupted during storage

# 5. Test restore procedure (optional but recommended)
# Create temporary test database
docker exec crm-postgres createdb -U rootuser crm_cbt_db_dev_test
gunzip -c ~/db_backups/crm_cbt_db_dev_pre_stage2_*.sql.gz | \
  docker exec -i crm-postgres psql -U rootuser -d crm_cbt_db_dev_test 2>&1 | head -20
# If "ERROR": backup cannot be restored, do NOT proceed
# If "SUCCESS": backup is valid and restorable
docker exec crm-postgres dropdb -U rootuser crm_cbt_db_dev_test
```

**Backup Verification Checklist (DO NOT SKIP):**
- [ ] Backup file created and has size > 1KB
- [ ] `gunzip -t` passes without corruption errors
- [ ] SHA256 checksum created and saved
- [ ] Checksum verified with `sha256sum -c`
- [ ] Test restore succeeds (optional but recommended)
- [ ] Checksum saved to secure location outside of server

---

### Detailed Inspection (15 minutes)

1. **Connect via DBeaver:**
   - Opens visual interface
   - Browse tables and indexes
   - Run complex queries visually

2. **Export Schema:**
   ```bash
   # Verify disk space first (see Pre-Backup Disk Space Check above)
   
   docker exec crm-postgres pg_dump -U rootuser -d crm_cbt_db_dev \
     --schema-only > schema_export.sql
   ```

3. **Check Key Tables:**
   - `tenant_configs` → Verify feature flags for your tenant
   - `data_sync_logs` → Check for recent sync errors
   - `conversation_memory` → Verify TTL is working
   - `audit_logs` → Check for unauthorized access

4. **Run Performance Queries:**
   - Table sizes (see 6.6)
   - Active connections
   - Index usage

### Complete Schema Audit (30 minutes)

```bash
# Verify disk space first (see Pre-Backup Disk Space Check above)

# Export full database
docker exec crm-postgres pg_dump -U rootuser -d crm_cbt_db_dev > db_full_export.sql

# Generate comprehensive report
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev << 'EOF'
\echo "=== SCHEMA AUDIT REPORT ===" 
\echo "Time: "`date`
\echo ""
\echo "=== TABLES ==="
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
\echo ""
\echo "=== INDEXES ==="
SELECT indexname, tablename FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname;
\echo ""
\echo "=== CONSTRAINTS ==="
SELECT constraint_name, table_name, constraint_type FROM information_schema.table_constraints WHERE table_schema='public' ORDER BY table_name;
\echo ""
\echo "=== MIGRATION HISTORY ==="
SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;
EOF
```

---

### Backup Restore Verification (After Rollback or Recovery)

**Critical: Verify backup was restored correctly**

```bash
# After restore, run these verification queries:

# 1. Confirm database is accessible
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT 'Database OK' as status;"

# Expected: Database OK (if fails, restore failed)

# 2. Verify table count matches expected pre-migration state
TABLE_COUNT=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
echo "Table count: $TABLE_COUNT"

# Expected for post-Stage2 restore: 14 (9 base + 4 new + 1 system)
# Expected for pre-Stage2 restore: 10 (9 base + 1 system)

if [ "$TABLE_COUNT" -lt 9 ]; then
    echo "❌ CRITICAL: Table count too low - restore may be incomplete"
    exit 1
fi

# 3. Verify Flyway history is intact
FLYWAY_COUNT=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
  "SELECT COUNT(*) FROM flyway_schema_history WHERE success=true;")
echo "Successful migrations: $FLYWAY_COUNT"

# Expected post-Stage2: 10
# Expected pre-Stage2: 5

# 4. Spot check key tables have data
for TABLE in tenants users bot_configs; do
    COUNT=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT COUNT(*) FROM $TABLE;")
    echo "$TABLE: $COUNT rows"
    
    if [ "$COUNT" -eq 0 ]; then
        echo "⚠️  WARNING: $TABLE is empty - unexpected after restore"
    fi
done

# 5. Check for any schema inconsistencies
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
  "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY';" \
  > /tmp/fk_count.txt

FK_COUNT=$(cat /tmp/fk_count.txt | xargs)
echo "Foreign key constraints: $FK_COUNT"

# Expected: 8+ (multiple tenant_id FKs)

# If FK_COUNT is 0, schema restoration is incomplete

# 6. Final integrity check (specific tables only, not full ANALYZE)
# Note: Full ANALYZE scans entire DB and can spike IO - only safe during maintenance windows
echo "Running targeted statistics update on key tables..."
for TABLE in tenants users whatsapp_sessions conversation_logs; do
    docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "ANALYZE $TABLE;" 2>&1 > /dev/null || true
done
echo "✅ Table statistics updated (specific tables only, not full database)"
```

**Restore verification checklist:**
- [ ] Database connection successful
- [ ] Table count matches expected state (9+ tables)
- [ ] Flyway history matches expected migration count
- [ ] Key tables (tenants, users) have data
- [ ] Foreign key constraints are intact (8+)
- [ ] ANALYZE runs without errors
- [ ] No orphaned rows or inconsistencies

**If any verification fails:**
1. Do NOT proceed with application restart
2. Keep database in current state
3. Restore from backup again (try earlier backup if multiple exist)
4. Contact DBA team for forensics
5. Consider point-in-time recovery (PITR) if available
```

---

## 9. PRODUCTION vs STAGING CLARIFICATION

### After Stage 1 Complete:
- **Production DB:** `crm_cbt_db_dev` (unchanged, running V1-V5)
- **Staging DB:** `crm_cbt_db_dev_staging` (Stage 1 tested V6-V10)

### During Stage 2 Execution:
- **Production DB:** `crm_cbt_db_dev` (being migrated V1→V10)
- Staging DB dropped (no longer needed)

### After Stage 2 Complete:
- **Production DB:** `crm_cbt_db_dev` (now running V1-V10, ready for Phase 3)
- **No staging DB** (can recreate for next phase if needed)

**Critical:** Always verify which DB you're connected to before running UPDATE/DELETE queries.

```bash
# Confirm which database you're in
psql -c "SELECT current_database();"  # Should show: crm_cbt_db_dev
```

---

## 10. POST-MIGRATION SCHEMA WALKTHROUGH

### After Stage 2 completes, manually verify:

**Step 1: Count tables (should be 13 application + 1 system = 14 total)**
```bash
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

**Step 2: List all tables**
```bash
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

Expected output:
```
analytics_summary
audit_logs
bot_configs
conversation_logs
conversation_memory
data_sync_logs
saved_reports
site_visits
tenant_configs
tenants
users
whatsapp_sessions
ai_query_logs
flyway_schema_history (system table)
```

**Step 3: Verify new V6-V10 tables have data**
```bash
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev << 'EOF'
SELECT 'tenant_configs' as table_name, COUNT(*) FROM tenant_configs
UNION ALL
SELECT 'conversation_memory', COUNT(*) FROM conversation_memory
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'data_sync_logs', COUNT(*) FROM data_sync_logs
ORDER BY table_name;
EOF
```

**Step 4: Check indexes on sync tables**
```bash
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT indexname FROM pg_indexes WHERE tablename IN ('whatsapp_sessions','site_visits','conversation_logs') ORDER BY indexname;"
```

Expected: sync_status, source_updated_at, idempotency indexes

**Step 5: Verify constraints and foreign keys**
```bash
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public' ORDER BY table_name;"
```

Expected: tenant_id, user_id, session_id, rm_id foreign keys

---

## 11. TROUBLESHOOTING & COMMON QUESTIONS

### ⚠️ CRITICAL WARNING: NEVER MANUALLY MIGRATE THE DATABASE

**Problem:** Running SQL ALTER/CREATE/DROP statements directly in psql

**Why it's dangerous:**
- Flyway migration history becomes out of sync with actual schema
- Future migrations may fail or apply twice
- Impossible to rollback manually-applied changes
- Version control is lost
- Multi-environment consistency breaks

**What to do instead:**
```bash
# ❌ WRONG - Never do this:
psql -U rootuser -d crm_cbt_db_dev << 'EOF'
ALTER TABLE whatsapp_sessions ADD COLUMN new_field VARCHAR;
CREATE INDEX idx_new ON whatsapp_sessions(new_field);
EOF

# ✅ RIGHT - Always use Flyway:
# 1. Create migration file: backend-java/src/main/resources/db/migration/V11__description.sql
# 2. Add your SQL changes to V11__description.sql
# 3. Restart Spring Boot (triggers Flyway automatically)
# 4. Verify in Flyway history: SELECT * FROM flyway_schema_history WHERE version = '11';
```

**If you accidentally made manual changes:**
1. Immediately contact DBA/DevOps team
2. Do NOT restart Spring Boot (Flyway will detect conflicts)
3. Rollback database from backup
4. Re-apply changes through proper Flyway migration

**Verify database is only changed through Flyway:**
```sql
-- Check that all changes are tracked
SELECT version, description, success, installed_on 
FROM flyway_schema_history 
ORDER BY installed_rank;

-- Verify no unexpected tables/columns exist
SELECT column_name, table_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;
```

---

### Q: How do I verify a rollback completed successfully?
**A:** After executing the rollback procedure from STAGE2_PRODUCTION_EXECUTION_CHECKLIST.md, verify:

```bash
# 1. Verify database is accessible
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT current_database();"

# Expected: crm_cbt_db_dev

# 2. Verify Flyway version (should be back to pre-Stage 2 version, typically 5)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT MAX(version::int) as schema_version FROM flyway_schema_history WHERE success=true;"

# Expected: 5 (if rolling back from Stage 2)

# 3. Verify table count matches pre-migration state
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Expected: 10 (9 existing tables + 1 flyway_schema_history system table, without V6-V10 tables)

# 4. Verify data integrity (spot check)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT COUNT(*) as conversation_count FROM conversation_logs LIMIT 1;"

# Expected: Should return a number (not error), indicating table is intact

# 5. Verify backup source
grep "Backup used:" /tmp/rollback.log

# Confirm backup file matches the pre-Stage2 backup created in Step 1
```

**Rollback verification checklist:**
- [ ] Database is accessible (can connect)
- [ ] Flyway version matches pre-migration state
- [ ] Table count matches pre-migration state  
- [ ] Key tables have data (spot check SELECT COUNT)
- [ ] Backup file is confirmed as source of restoration
- [ ] Application services restart successfully

**If any verification fails:**
1. Do NOT restart application services
2. Do NOT force any changes
3. Contact DBA/DevOps team immediately
4. Maintain database in current state for forensics

---

### Q: Can I connect to the database remotely?
**A:** Yes, if the server IP is whitelisted. Use `host: <server-ip>` instead of `localhost`. Default PostgreSQL port is 5432.

### Q: Are there backups of old tables?
**A:** Yes. Before Stage 2, a backup is created: `~/db_backups/crm_cbt_db_dev_pre_stage2_*.sql.gz`. Keep this for 30 days minimum.

### Q: How do I rollback if something goes wrong?
**A:** See STAGE2_PRODUCTION_EXECUTION_CHECKLIST.md → ROLLBACK PROCEDURE. It restores from the backup in < 15 minutes.

### Q: Can I query across tenants?
**A:** Yes, but remember to filter by `tenant_id`. Without filtering, queries return data for ALL tenants (security risk in multi-tenant SaaS).

**Safe pattern:**
```sql
-- Good: filtered by tenant
SELECT * FROM conversation_logs WHERE tenant_id = 'tenant-uuid';

-- Bad: unfiltered
SELECT * FROM conversation_logs;  -- ⚠️ Returns all tenant data
```

### Q: What is the PII masking in audit_logs?
**A:** Phone numbers, emails, and names are hashed/masked to comply with GDPR/privacy regulations:
- Phone: `***-****-XXXX` (last 4 digits visible)
- Email: `***@***.com` (domain visible)
- Name: `Fn*** L***` (first/last initial + asterisks)

---

## Next Steps

**After you review this guide:**

1. ✅ Understand the database architecture
2. ✅ Verify you can connect via psql/DBeaver
3. ✅ Run the sample inspection queries
4. ✅ Confirm production vs staging database names
5. ✅ Approve Stage 2 execution OR request clarifications

**Before approving Stage 2:**
- [ ] You can connect to production database
- [ ] You understand the table relationships
- [ ] You know how to run inspection queries
- [ ] You know how to rollback if needed
- [ ] You have backed up this guide

---

**Document Status:** Template (to be updated with actual data after Stage 2)  
**Last Updated:** 2026-04-28  
**Maintained By:** DevOps / DBA Team
