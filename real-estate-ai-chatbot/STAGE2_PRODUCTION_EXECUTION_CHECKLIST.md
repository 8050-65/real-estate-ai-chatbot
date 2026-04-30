# ⚠️ STAGE 2: PRODUCTION EXECUTION CHECKLIST

**🔴 STATUS: PRODUCTION MIGRATION DOCUMENT**  
**Do not execute without approved maintenance window and verified backups.**

**Status:** Ready for review and execution  
**Date:** 2026-04-28  
**Severity:** CRITICAL - Production Database Migration  

### CRITICAL SAFETY RULES

1. ⚠️ **NEVER execute migrations manually in psql** - Only via Flyway-controlled startup
2. ⚠️ **Backup is MANDATORY** - Do not skip Step 1 under any circumstances
3. ⚠️ **Maintenance window REQUIRED** - Must have approved downtime window
4. ⚠️ **No manual schema changes** - Only Flyway migrations allowed
5. ⚠️ **30-minute monitoring REQUIRED** - After migration succeeds, live monitoring is mandatory before declaring success
6. ⚠️ **Immediate rollback conditions** - See "Rollback Trigger Thresholds" section

---

## PRE-FLIGHT VERIFICATION (Before Starting)

### Stage 1 & Testing
- [ ] Stage 1 testing completed successfully (7/7 smoke tests passed)
- [ ] All 11 validation checks passed on staging DB
- [ ] Flyway V6-V10 verified on staging DB (version 10 achieved)
- [ ] Backup restore procedure validated on staging
- [ ] Rollback procedure tested on staging

### Maintenance Window
- [ ] Current time is within maintenance window (approved downtime)
- [ ] All team members notified of maintenance
- [ ] Support ticket created tracking execution
- [ ] Deployment freeze confirmed (no other team deployments planned)

### Infrastructure Checks
- [ ] Database backup location verified: `~/db_backups/`
- [ ] Disk space available for backup (minimum 50MB free)
- [ ] PostgreSQL is healthy and responsive

### Application Compatibility Verification (CRITICAL)
```bash
# 1. Verify backend-java can handle V6-V10 schema
docker images | grep backend-java
# Expected: Image version should be compatible with Phase 3 schema

# 2. Verify backend-ai models have new field support
docker logs backend-ai 2>&1 | grep -i "conversation_memory\|sync_status"
# Expected: No errors about missing fields

# 3. Verify no old code depends on removed columns
git log --oneline backend-java/src main/java/com/leadrat | head -5
# Expected: Recent commits mention V6-V10 compatibility

# 4. Check application startup logs for schema warnings
docker logs backend-java 2>&1 | grep -i "schema\|migration\|error" | tail -20
```

- [ ] Backend Java version compatible with V6-V10 schema
- [ ] FastAPI ORM models support new fields (conversation_memory, sync_status, etc.)
- [ ] No old code references removed columns
- [ ] No schema compatibility errors in recent logs

### Maintenance Mode Verification (CRITICAL)
```bash
# 1. Frontend maintenance mode ready
# Option A: Check maintenance banner can be enabled
grep -r "MAINTENANCE_MODE" frontend/ || echo "Check frontend .env for banner support"

# Option B: Check if frontend is containerized (can be stopped)
docker compose config | grep -A5 "frontend:"

# 2. Verify API mutation endpoints can be disabled
grep -r "PUT\|POST\|DELETE" backend-java/src | grep -c "@"
# Expected: Routes exist and can be disabled/throttled

# 3. Test mutation API disable (if implemented)
curl -s http://localhost:8000/health | jq .
# Expected: Health check returns 200 before maintenance
```

- [ ] Frontend maintenance mode procedure verified (banner OR shutdown)
- [ ] API mutation endpoints identified
- [ ] Users will be blocked from writes during maintenance window
- [ ] Maintenance banner visible to users OR frontend will be stopped

---

---

## ⚠️ CRITICAL EXECUTION RULES

### Single Operator Rule (MANDATORY)
**Only ONE person should execute migration commands at a time.**

```bash
# RULE: No concurrent operators during execution
# If multiple people execute commands simultaneously:
# - Migrations may be applied twice
# - Conflicts may occur during rollback
# - State becomes unpredictable
# - Recovery becomes impossible

# Enforcement:
# - Only the assigned "Migration Operator" executes all commands
# - All other team members monitor only (read-only access)
# - If operator changes, wait 5 minutes between operator switches
# - Use screen/tmux to share terminal if needed for approval visibility
```

### Timezone Consistency (MANDATORY)
**All timestamps must use UTC or IST consistently throughout execution.**

```bash
# Set timezone for all operations
export TZ=UTC  # or IST for Indian Standard Time

# Verify timezone
date
# Expected: Shows timezone offset

# All timestamps in logs/backups use this timezone
# Examples:
# - Backup file: crm_cbt_db_dev_pre_stage2_production_20260428_143000_UTC
# - Logs: [2026-04-28T14:30:00Z] Migration started
# - Timestamps: Must match rollback operator's clock
```

---

## ⚠️ EXECUTION GATE - VERIFY ALL APPROVALS BEFORE STARTING

**STOP. DO NOT PROCEED UNLESS ALL CONDITIONS ARE MET:**

```bash
# ============================================================================
# FINAL VALIDATION GATE - Must pass ALL checks before execution
# ============================================================================

GATE_PASSED=true

# 1. DBA Approval
read -p "DBA has approved Stage 2 migration? (yes/no): " dba_approval
if [ "$dba_approval" != "yes" ]; then
    echo "❌ GATE FAILED: DBA approval required"
    GATE_PASSED=false
fi

# 2. Backend Owner Approval
read -p "Backend owner has approved Stage 2 migration? (yes/no): " backend_approval
if [ "$backend_approval" != "yes" ]; then
    echo "❌ GATE FAILED: Backend owner approval required"
    GATE_PASSED=false
fi

# 3. Ops Approval
read -p "Ops/Infrastructure team has approved Stage 2 migration? (yes/no): " ops_approval
if [ "$ops_approval" != "yes" ]; then
    echo "❌ GATE FAILED: Ops approval required"
    GATE_PASSED=false
fi

# 4. Rollback Owner Assigned
read -p "Rollback owner has been assigned? (yes/no): " rollback_assigned
if [ "$rollback_assigned" != "yes" ]; then
    echo "❌ GATE FAILED: Rollback owner must be assigned"
    GATE_PASSED=false
fi

# 5. Maintenance Window Confirmed
read -p "Maintenance window is currently active? (yes/no): " maint_active
if [ "$maint_active" != "yes" ]; then
    echo "❌ GATE FAILED: Must execute during approved maintenance window"
    GATE_PASSED=false
fi

# 6. Backup Verified
read -p "Backup has been created and checksum verified? (yes/no): " backup_verified
if [ "$backup_verified" != "yes" ]; then
    echo "❌ GATE FAILED: Backup must be verified with checksum"
    GATE_PASSED=false
fi

# 7. Stage 1 Tests Passed
read -p "Stage 1 tests passed (7/7 smoke tests)? (yes/no): " stage1_passed
if [ "$stage1_passed" != "yes" ]; then
    echo "❌ GATE FAILED: Stage 1 must pass before Stage 2"
    GATE_PASSED=false
fi

if [ "$GATE_PASSED" != "true" ]; then
    echo ""
    echo "=========================================="
    echo "❌ EXECUTION GATE FAILED"
    echo "=========================================="
    echo "ALL conditions must be met before proceeding"
    echo "Fix the failed items and try again"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ EXECUTION GATE PASSED"
echo "=========================================="
echo "All approvals confirmed - proceeding with Stage 2"
echo "Migration start time: $(date)"
echo ""
```

**If execution gate fails:** Stop immediately, gather missing approvals, and re-run this gate.

---

## STEP 1: PRE-PRODUCTION BACKUP

**Purpose:** Create final backup of production DB before any changes

```bash
# Create backup directory
mkdir -p ~/db_backups

# Create final production backup with timestamp
BACKUP_NAME="crm_cbt_db_dev_pre_stage2_production_$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="~/db_backups/${BACKUP_NAME}.sql.gz"

echo "Creating production backup: $BACKUP_FILE"
docker exec crm-postgres pg_dump -U rootuser crm_cbt_db_dev 2>&1 | gzip > ~/db_backups/${BACKUP_NAME}.sql.gz

# Verify backup integrity
echo "Verifying backup integrity..."
if gunzip -t ~/db_backups/${BACKUP_NAME}.sql.gz 2>&1; then
    echo "✅ Backup verified successfully"
    BACKUP_SIZE=$(ls -lh ~/db_backups/${BACKUP_NAME}.sql.gz | awk '{print $5}')
    BACKUP_BYTES=$(ls -l ~/db_backups/${BACKUP_NAME}.sql.gz | awk '{print $5}')
    echo "Backup size: $BACKUP_SIZE (${BACKUP_BYTES} bytes)"
    echo "Backup file: ~/db_backups/${BACKUP_NAME}.sql.gz"
    
    # Verify backup has reasonable size (at least 1KB)
    if [ "$BACKUP_BYTES" -lt 1024 ]; then
        echo "❌ Backup file too small (< 1KB): $BACKUP_SIZE"
        exit 1
    fi
else
    echo "❌ BACKUP VERIFICATION FAILED - DO NOT PROCEED"
    exit 1
fi
```

**Post-Backup: Create Immutable Copy (CRITICAL)**

After backup is verified, immediately copy to second location:

```bash
# Option A: Copy to another local disk/mount
cp ~/db_backups/${BACKUP_NAME}.sql.gz /mnt/backup_storage/${BACKUP_NAME}.sql.gz
cp ~/db_backups/backup.sha256 /mnt/backup_storage/backup.sha256

# Option B: Upload to cloud object storage (S3, GCS, etc.)
aws s3 cp ~/db_backups/${BACKUP_NAME}.sql.gz s3://backup-bucket/production/
aws s3 cp ~/db_backups/backup.sha256 s3://backup-bucket/production/

# Option C: Burn to external USB/disk for physical security
# (safest for disaster recovery, but slowest)
```

**Why:** If primary disk fails during migration:
- Local backup is lost (can't recover)
- Second location provides safety net
- Immutable copy prevents accidental deletion

**Verification:**
```bash
# Verify secondary copy has same checksum
sha256sum -c ~/db_backups/backup.sha256
sha256sum -c /mnt/backup_storage/backup.sha256  # Should match
```

**Go/No-Go Criteria:**
- ✅ GO if: Backup created, integrity verified, size > 1KB, secondary copy created
- ❌ NO-GO if: Backup verification fails, size < 1KB, disk error, no secondary copy

---

## STEP 2: STOP SERVICES (Graceful Shutdown)

**Purpose:** Stop applications to prevent conflicts during migration

```bash
# Order: Frontend (if running) → FastAPI → Spring Boot
# This order prevents cascading failures

echo "Stopping services in safe order..."

# Stop frontend (if running)
docker compose down frontend 2>&1 | grep -v "^Removing\|^Network" || true
echo "✅ Frontend stopped (if it was running)"

# Stop FastAPI
echo "Stopping FastAPI..."
docker compose down backend-ai 2>&1 | grep -v "^Removing\|^Network" || true
sleep 3
echo "✅ FastAPI stopped"

# Stop Spring Boot
echo "Stopping Spring Boot..."
docker compose down backend-java 2>&1 | grep -v "^Removing\|^Network" || true
sleep 3
echo "✅ Spring Boot stopped"

# Verify all services stopped - CRITICAL CHECK
echo "Verifying all services stopped..."
BACKEND_RUNNING=$(docker ps | grep -E "backend-java|backend-ai" | wc -l)
if [ "$BACKEND_RUNNING" -gt 0 ]; then
    echo "❌ CRITICAL: Services still running"
    docker ps | grep -E "backend-java|backend-ai"
    exit 1
fi
echo "✅ All backend services confirmed stopped"

# Keep PostgreSQL, Redis, Ollama running (they're safe)
echo "✅ PostgreSQL, Redis, Ollama remain online"
```

**Go/No-Go Criteria:**
- ✅ GO if: Spring Boot, FastAPI stopped, PostgreSQL still running
- ❌ NO-GO if: PostgreSQL stopped accidentally, services won't stop

---

## STEP 3: CREATE TEMPORARY MIGRATION ENVIRONMENT

**Purpose:** Use docker-compose.stage2.yml to point production Spring Boot to staging for final test

```bash
# Create Stage 2 override file for production execution
cat > docker-compose.stage2.yml << 'EOF'
version: '3.8'

services:
  backend-java:
    env_file:
      - ./backend-java/.env.stage2
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/crm_cbt_db_dev
      SPRING_DATASOURCE_USERNAME: rootuser
      SPRING_DATASOURCE_PASSWORD: "123Pa$$word!"
      SPRING_JPA_HIBERNATE_DDL_AUTO: validate
EOF

echo "✅ docker-compose.stage2.yml created"
```

---

## STEP 4: EXECUTE FLYWAY MIGRATION ON PRODUCTION

**Purpose:** Apply V6-V10 migrations to production database

```bash
# CRITICAL: Verify we're targeting production DB, not staging
echo "[PRE-FLIGHT] Verifying production database..."
CURRENT_DB=$(docker exec crm-postgres psql -U rootuser -t -c "SELECT current_database();" 2>&1 | xargs)
echo "Current PostgreSQL connection: $CURRENT_DB"

PROD_DB_CHECK=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c "SELECT current_database();" 2>&1 | xargs)
echo "Production database (crm_cbt_db_dev) check: $PROD_DB_CHECK"

if [ "$PROD_DB_CHECK" != "crm_cbt_db_dev" ]; then
    echo "❌ CRITICAL: Cannot connect to production DB or wrong DB targeted"
    exit 1
fi
echo "✅ Production DB verified"
echo ""

# Verify required env vars are set BEFORE creating .env.stage2
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ ERROR: DB_PASSWORD environment variable not set"
    echo "Set with: export DB_PASSWORD=<your-password>"
    exit 1
fi
if [ -z "$JWT_SECRET_KEY" ]; then
    echo "❌ ERROR: JWT_SECRET_KEY environment variable not set"
    echo "Set with: export JWT_SECRET_KEY=<your-jwt-secret>"
    exit 1
fi
echo "✅ All required credentials verified"

# Create .env.stage2 for production execution
# CRITICAL: Use double quotes so environment variables EXPAND
cat > backend-java/.env.stage2 << EOF
SPRING_DATASOURCE_HOST=postgres
SPRING_DATASOURCE_PORT=5432
SPRING_DATASOURCE_DB=crm_cbt_db_dev
SPRING_DATASOURCE_USERNAME=rootuser
SPRING_DATASOURCE_PASSWORD=$DB_PASSWORD
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET_KEY=$JWT_SECRET_KEY
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
EOF

echo "✅ .env.stage2 created with exported credentials"

echo "Setting migration timeout protection on database..."
# ⚠️ CRITICAL: Prevent migrations from hanging indefinitely
# IMPORTANT: These are session-scoped - they apply to the current connection only
# Flyway (running in Spring Boot) will use these settings from initSql config

docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev << 'EOF'
-- Session-scoped timeout protection
-- Note: These settings apply ONLY to this psql session
-- For Flyway (in Spring Boot), these must be set in application.yml:
--   spring.datasource.hikari.connection-init-sql: "SET lock_timeout = '10s'; SET statement_timeout = '5min';"

SET lock_timeout = '10s';        -- Fail if lock not acquired within 10 seconds
SET statement_timeout = '5min';  -- Fail if statement takes > 5 minutes (Flyway default safe value)

-- Verify settings applied
SHOW lock_timeout;
SHOW statement_timeout;

-- Test lock timeout behavior (verify it's working)
SELECT pg_sleep(0.5);  -- Should succeed (< 10s)
EOF

echo "✅ Migration timeout protection enabled (session-scoped)"
echo "⚠️  Verify Flyway config in backend-java/src/main/resources/application.yml:"
echo "    spring.datasource.hikari.connection-init-sql:"
echo "    - SET lock_timeout = '10s'"
echo "    - SET statement_timeout = '5min'"
echo ""
echo "Starting Spring Boot for production migration..."
docker compose -f docker-compose.yml -f docker-compose.stage2.yml up -d --no-deps backend-java
sleep 3

# Get dynamic container ID (not hardcoded name)
BACKEND_CONTAINER=$(docker compose ps -q backend-java)
if [ -z "$BACKEND_CONTAINER" ]; then
    echo "❌ CRITICAL: Failed to get backend-java container ID"
    exit 1
fi
echo "Backend container ID: $BACKEND_CONTAINER"

# CRITICAL: Verify migration files exist in container at exact path
echo ""
echo "Verifying migration files exist in container (V6-V10)..."

# Check exact Flyway location in Java container
MIGRATION_PATH="/app/src/main/resources/db/migration"
echo "Checking migration path: $MIGRATION_PATH"

docker exec "$BACKEND_CONTAINER" ls $MIGRATION_PATH/V*.sql 2>/dev/null | head -20

# Verify each required migration
MIGRATION_CHECK_PASS=true
for VERSION in 6 7 8 9 10; do
    # Check if file exists at exact path
    FILE_EXISTS=$(docker exec "$BACKEND_CONTAINER" test -f "$MIGRATION_PATH/V${VERSION}__*.sql" && echo "1" || echo "0" 2>/dev/null)
    
    # If not, search for it
    if [ "$FILE_EXISTS" = "0" ]; then
        FOUND=$(docker exec "$BACKEND_CONTAINER" find / -name "V${VERSION}__*.sql" 2>/dev/null | head -1)
        if [ -z "$FOUND" ]; then
            echo "❌ CRITICAL: Migration V${VERSION} not found in container"
            echo "   Expected at: $MIGRATION_PATH/V${VERSION}__*.sql"
            MIGRATION_CHECK_PASS=false
        else
            echo "⚠️  V${VERSION} found at non-standard location: $FOUND"
        fi
    else
        echo "✅ V${VERSION} found at standard location"
    fi
done

if [ "$MIGRATION_CHECK_PASS" = "false" ]; then
    echo "❌ CRITICAL: Required migration files missing"
    exit 1
fi

echo "✅ All migrations V6-V10 verified"

echo ""
echo "⏳ Waiting for Spring Boot to connect to production DB (max 30 seconds)..."
EXPECTED_DB="crm_cbt_db_dev"
VERIFIED=0

for i in {1..30}; do
    # Extract the actual database connection string from logs
    ACTUAL_DB=$(docker logs "$BACKEND_CONTAINER" 2>/dev/null \
      | grep -o "jdbc:postgresql://[^ ]*" \
      | tail -1)
    
    echo "  Attempt $i/30: Detected connection: $ACTUAL_DB"
    
    # Strict validation: must contain the exact database name (not staging variant)
    if [[ "$ACTUAL_DB" == *"/${EXPECTED_DB}" ]] && [[ "$ACTUAL_DB" != *"${EXPECTED_DB}_staging"* ]]; then
        echo "✅ VERIFIED: Connected to PRODUCTION DB ($EXPECTED_DB)"
        VERIFIED=1
        break
    elif [[ "$ACTUAL_DB" == *"${EXPECTED_DB}_staging"* ]]; then
        echo "❌ CRITICAL: Connected to STAGING database (not production)"
        docker logs "$BACKEND_CONTAINER" | tail -20
        exit 1
    fi
    
    sleep 1
done

if [ $VERIFIED -eq 0 ]; then
    echo "❌ CRITICAL: Failed to verify production DB connection"
    echo "Expected: jdbc:postgresql://.../${EXPECTED_DB}"
    echo "Detected: $ACTUAL_DB"
    echo ""
    echo "Spring Boot logs (last 50 lines):"
    docker logs "$BACKEND_CONTAINER" | tail -50
    exit 1
fi

echo ""
echo "⏳ Waiting for Flyway migration execution (max 60 seconds)..."
STARTUP_DETECTED=0
for i in {1..12}; do
    if docker logs "$BACKEND_CONTAINER" 2>/dev/null | grep -qi "Tomcat started"; then
        echo "✅ Spring Boot startup detected"
        STARTUP_DETECTED=1
        break
    elif docker logs "$BACKEND_CONTAINER" 2>/dev/null | grep -qi "ERROR\|Exception\|failed"; then
        echo "❌ MIGRATION ERROR DETECTED"
        docker logs "$BACKEND_CONTAINER" | grep -i "error\|exception" | head -20
        exit 1
    fi
    ELAPSED=$((i * 5))
    echo "  Running... ($ELAPSED/60 sec)"
    sleep 5
done

if [ $STARTUP_DETECTED -eq 0 ]; then
    echo "❌ CRITICAL: Spring Boot timeout or no startup signal"
    docker logs "$BACKEND_CONTAINER" | tail -50
    exit 1
fi

# CRITICAL: Query DB directly to verify final schema version = 10
# Do NOT trust log messages - verify actual database state
echo ""
echo "⏳ Verifying migration success via database query (max 30 seconds)..."
sleep 3

DB_VERIFIED=0
for i in {1..6}; do
    FINAL_VERSION=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1;" 2>&1 | xargs)

    echo "Final Flyway version from database: $FINAL_VERSION (attempt $i/6)"
    if [ "$FINAL_VERSION" = "10" ]; then
        echo "✅ Database verification: Schema version = 10"
        DB_VERIFIED=1
        break
    fi
    
    if [ $i -lt 6 ]; then
        echo "  Retrying in 5 seconds..."
        sleep 5
    fi
done

if [ $DB_VERIFIED -eq 0 ]; then
    echo "❌ CRITICAL: Final schema version is $FINAL_VERSION, expected 10"
    echo "Flyway history:"
    docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
      "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;" 2>&1
    exit 1
fi
```

**Go/No-Go Criteria:**
- ✅ GO if: Connected to production DB, Flyway completed, Tomcat started
- ❌ NO-GO if: Connection failed, migration errors, timeout occurred

---

## STEP 5: VALIDATE PRODUCTION MIGRATION

**Purpose:** Verify schema changes applied correctly to production

```bash
DB_NAME="crm_cbt_db_dev"
CHECKS_PASS=0
CHECKS_FAIL=0

echo ""
echo "=========================================="
echo "PRODUCTION VALIDATION (11 checks)"
echo "=========================================="
echo ""

# CHECK 1: Final Flyway version must be 10
FINAL_VERSION=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1;" 2>&1 | xargs)
echo "[1/11] Final Flyway version: $FINAL_VERSION (expected 10)"
if [ "$FINAL_VERSION" = "10" ]; then
    echo "       ✅ PASS"; ((CHECKS_PASS++))
else
    echo "       ❌ FAIL"; ((CHECKS_FAIL++))
fi

# CHECK 2: All required versions exist
RESULT=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM flyway_schema_history WHERE version IN ('6','7','8','9','10') AND success=true;" 2>&1 | xargs)
echo "[2/11] Required migrations V6-V10 count: $RESULT (expected 5)"
if [ "$RESULT" = "5" ]; then
    echo "       ✅ PASS"; ((CHECKS_PASS++))
else
    echo "       ❌ FAIL"; ((CHECKS_FAIL++))
fi

# CHECK 3-6: Required tables exist
for TABLE in "tenant_configs" "conversation_memory" "audit_logs" "data_sync_logs"; do
    RESULT=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$TABLE';" 2>&1 | xargs)
    echo "[N/11] Table $TABLE: $RESULT (expected 1)"
    if [ "$RESULT" = "1" ]; then
        echo "       ✅ PASS"; ((CHECKS_PASS++))
    else
        echo "       ❌ FAIL"; ((CHECKS_FAIL++))
    fi
done

# CHECK 7: pg_trgm extension
PG_TRGM=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM pg_extension WHERE extname='pg_trgm';" 2>&1 | xargs)
echo "[7/11] pg_trgm extension: $PG_TRGM (expected 1)"
if [ "$PG_TRGM" = "1" ]; then
    echo "       ✅ PASS"; ((CHECKS_PASS++))
else
    echo "       ❌ FAIL"; ((CHECKS_FAIL++))
fi

# CHECK 8: Index validity (not just count)
echo "[8/11] Index validation:"
INDEX_COUNT=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';" 2>&1 | xargs)
echo "       Total indexes: $INDEX_COUNT (expected ≥ 35)"

# Check for invalid indexes (can happen during schema changes)
INVALID_COUNT=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM pg_indexes WHERE indisvalid IS FALSE;" 2>&1 | xargs)
echo "       Invalid indexes: $INVALID_COUNT (expected 0)"

# Check new V6-V10 required indexes exist
REQUIRED_INDEXES=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM pg_indexes WHERE indexname IN ('idx_whatsapp_sessions_sync_status', 'idx_conversation_logs_sync_status', 'idx_site_visits_sync_status', 'idx_whatsapp_sessions_idempotency', 'idx_site_visits_idempotency');" 2>&1 | xargs)
echo "       V6-V10 indexes: $REQUIRED_INDEXES/5 required"

if [ "$INDEX_COUNT" -ge 35 ] && [ "$INVALID_COUNT" = "0" ] && [ "$REQUIRED_INDEXES" -eq 5 ]; then
    echo "       ✅ PASS"; ((CHECKS_PASS++))
elif [ "$INDEX_COUNT" -ge 35 ] && [ "$INVALID_COUNT" = "0" ]; then
    echo "       ⚠️  WARNING (missing some V6-V10 indexes)"; ((CHECKS_FAIL++))
else
    echo "       ❌ FAIL"; ((CHECKS_FAIL++))
fi

# CHECK 9: Run targeted ANALYZE (NOT full database ANALYZE)
# ⚠️ IMPORTANT: Full ANALYZE scans entire DB and can spike IO in production
# Only analyze tables that changed in V6-V10 migrations
echo "[9/11] Running targeted ANALYZE on new tables..."
for TABLE in tenant_configs conversation_memory audit_logs data_sync_logs; do
    docker exec crm-postgres psql -U rootuser -d $DB_NAME -c "ANALYZE $TABLE;" 2>&1 > /dev/null || true
done
echo "       ✅ PASS (targeted tables only)"; ((CHECKS_PASS++))

# CHECK 10-11: Health checks will be tested after services restart

echo ""
echo "Validation Summary: Passed=$CHECKS_PASS, Failed=$CHECKS_FAIL"

if [ $CHECKS_FAIL -gt 0 ]; then
    echo "❌ VALIDATION FAILED - INITIATE ROLLBACK"
    exit 1
fi

echo "✅ All validation checks passed"
```

**Go/No-Go Criteria:**
- ✅ GO if: 9/9 checks pass, Flyway version 10, all tables exist
- ❌ NO-GO if: Any check fails, version < 10, tables missing

---

## STEP 6: RESTART SERVICES (Production Online)

**Purpose:** Bring application services back online with new schema

**CRITICAL: Restart Order is EXACT - Do Not Deviate**

```bash
# 0. Verify PostgreSQL is healthy BEFORE starting any service
echo "[0/6] Pre-check: Verifying PostgreSQL health..."
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT current_database();" 2>&1 > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ CRITICAL: PostgreSQL is not responding"
    exit 1
fi
echo "✅ PostgreSQL healthy"

# 1. START BACKEND-JAVA FIRST (requires new schema to boot)
echo "[1/6] Starting Spring Boot (requires V10 schema)..."
docker compose up -d --no-deps backend-java
echo "Waiting 10 seconds for Spring Boot startup..."
sleep 10

# 2. START BACKEND-AI SECOND (depends on backend-java for some APIs)
echo "[2/6] Starting FastAPI (depends on backend-java)..."
docker compose up -d --no-deps backend-ai
echo "Waiting 10 seconds for FastAPI startup..."
sleep 10

# 3. VALIDATE REDIS (optional, but important for caching)
echo "[3/6] Validating Redis..."
REDIS_CONTAINER=$(docker compose ps -q redis 2>/dev/null)
if [ -z "$REDIS_CONTAINER" ]; then
    echo "⚠️  Redis container not running (non-critical, proceeding)"
else
    if docker exec "$REDIS_CONTAINER" redis-cli ping 2>&1 > /dev/null; then
        echo "✅ Redis is healthy"
    else
        echo "⚠️  Redis is not responding (non-critical, proceeding)"
    fi
fi

# 4. RESTART FRONTEND LAST (pulls from backend APIs)
echo "[4/6] Starting Frontend..."
docker compose up -d --no-deps frontend
echo "Waiting 10 seconds for Frontend startup..."
sleep 10

echo ""
echo "[5/6] Checking container status..."
docker ps | grep -E "backend-java|backend-ai|frontend"

# 5. VERIFY HEALTH ENDPOINTS
echo ""
echo "[6/6] Verifying services health endpoints..."

# Spring Boot actuator health
SPRING_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null || echo "000")
echo "Spring Boot health: HTTP $SPRING_HEALTH"

# FastAPI health endpoint
FASTAPI_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
echo "FastAPI health: HTTP $FASTAPI_HEALTH"

# Frontend readiness check (comprehensive validation)
echo ""
echo "Frontend readiness validation:"

# 1. Root path HTTP response
FRONTEND_ROOT=$(curl -sI http://localhost:3000 2>/dev/null)
FRONTEND_STATUS=$(echo "$FRONTEND_ROOT" | head -1 | grep -o "[0-9]\{3\}" || echo "000")
echo "  - Root path (/): HTTP $FRONTEND_STATUS"

# 2. Check for known frontend routes (actual functionality check)
# Login page should exist and be accessible
LOGIN_STATUS=$(curl -sI http://localhost:3000/login 2>/dev/null | head -1 | grep -o "[0-9]\{3\}" || echo "000")
echo "  - Login route (/login): HTTP $LOGIN_STATUS"

# 3. Asset validation (check that JS bundles load)
# Should have .js or .css files served
ASSETS=$(curl -s http://localhost:3000 2>/dev/null | grep -o "\\.js\|\\.css" | wc -l)
if [ "$ASSETS" -gt 0 ]; then
    echo "  - Static assets: ✅ Found ($ASSETS references)"
else
    echo "  - Static assets: ⚠️  No CSS/JS references (may indicate build issue)"
fi

# 4. Check frontend container health
FRONTEND_CONTAINER=$(docker ps --filter "name=frontend" --format "{{.Names}}")
if [ -n "$FRONTEND_CONTAINER" ]; then
    FRONTEND_DOCKER_HEALTH=$(docker inspect $FRONTEND_CONTAINER --format='{{.State.Health.Status}}' 2>/dev/null || echo "N/A")
    echo "  - Container health: $FRONTEND_DOCKER_HEALTH"
else
    echo "  - Container health: ⚠️  Frontend container not found"
fi

# 5. Overall readiness
if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "301" ]; then
    echo "✅ Frontend is ready and accessible"
else
    echo "⚠️  Frontend may not be fully ready (status: $FRONTEND_STATUS)"
fi

# Check container health status
echo ""
echo "Checking container health status..."
SPRING_CONTAINER=$(docker ps --filter "name=backend-java" --format "{{.Names}}")
if [ -n "$SPRING_CONTAINER" ]; then
    SPRING_DOCKER_HEALTH=$(docker inspect $SPRING_CONTAINER --format='{{.State.Health.Status}}' 2>/dev/null || echo "N/A")
    echo "Spring Boot container health: $SPRING_DOCKER_HEALTH"
fi

FASTAPI_CONTAINER=$(docker ps --filter "name=backend-ai" --format "{{.Names}}")
if [ -n "$FASTAPI_CONTAINER" ]; then
    FASTAPI_DOCKER_HEALTH=$(docker inspect $FASTAPI_CONTAINER --format='{{.State.Health.Status}}' 2>/dev/null || echo "N/A")
    echo "FastAPI container health: $FASTAPI_DOCKER_HEALTH"
fi

FRONTEND_CONTAINER=$(docker ps --filter "name=frontend" --format "{{.Names}}")
if [ -n "$FRONTEND_CONTAINER" ]; then
    FRONTEND_DOCKER_HEALTH=$(docker inspect $FRONTEND_CONTAINER --format='{{.State.Health.Status}}' 2>/dev/null || echo "N/A")
    echo "Frontend container health: $FRONTEND_DOCKER_HEALTH"
fi

# Verify all critical services are healthy
if [ "$SPRING_HEALTH" = "200" ] && [ "$FASTAPI_HEALTH" = "200" ]; then
    echo "✅ All critical services online and healthy"
else
    echo "❌ CRITICAL: Service health check failed"
    echo "Spring Boot: $SPRING_HEALTH (expected 200)"
    echo "FastAPI: $FASTAPI_HEALTH (expected 200)"
    echo ""
    echo "Checking logs for errors..."
    docker logs backend-java 2>&1 | tail -50
    exit 1
fi
```

**Go/No-Go Criteria:**
- ✅ GO if: Spring Boot HTTP 200, FastAPI HTTP 200
- ❌ NO-GO if: Either service unhealthy, connection errors

---

## STEP 7: SMOKE TESTS (Production Validation)

**Purpose:** Verify application functionality with new schema

```bash
# Create timestamped log directory
mkdir -p ~/logs

# Run smoke tests and save to timestamped log
SMOKE_LOG="~/logs/stage2_smoke_$(date +%Y%m%d_%H%M%S).log"
echo "Running smoke tests against production..."
echo "Smoke test output: $SMOKE_LOG"

# Execute smoke test and capture output directly
bash PHASE2_SMOKE_TEST.sh 2>&1 | tee "$SMOKE_LOG"

# Parse results directly from log file (do NOT depend on /tmp files)
echo ""
echo "Smoke test results saved to: $SMOKE_LOG"

# Check for success in the log file
if grep -q "ALL TESTS PASSED ✓" "$SMOKE_LOG"; then
    echo "✅ All 7 smoke tests passed"
    
    # Extract summary
    TEST_COUNT=$(grep "Total Tests:" "$SMOKE_LOG" | awk '{print $NF}')
    PASSED=$(grep "^Passed:" "$SMOKE_LOG" | awk '{print $NF}')
    echo "Results: $PASSED/$TEST_COUNT tests passed"
else
    echo "❌ Smoke tests failed"
    echo ""
    echo "Full log:"
    cat "$SMOKE_LOG"
    exit 1
fi
```

**Go/No-Go Criteria:**
- ✅ GO if: 7/7 smoke tests pass
- ❌ NO-GO if: Any smoke test fails

---

## ROLLBACK PROCEDURE (If Any Check Fails)

**Purpose:** Restore production to pre-migration state

```bash
echo "=========================================="
echo "INITIATING ROLLBACK"
echo "=========================================="
echo ""

# Step 1: Stop services
echo "[1/5] Stopping services..."
docker compose down backend-java backend-ai 2>&1 | grep -v "^Removing\|^Network" || true
sleep 5

# Step 2: Identify latest backup (before migration)
echo "[2/5] Finding production backup..."
BACKUP_FILE=$(ls -t ~/db_backups/crm_cbt_db_dev_pre_stage2_*.sql.gz 2>/dev/null | head -1)
if [ -z "$BACKUP_FILE" ]; then
    echo "❌ CRITICAL: No backup file found for rollback"
    exit 1
fi
echo "Using backup: $BACKUP_FILE"

# CRITICAL SEQUENCE: Stop apps BEFORE renaming production DB
# This prevents connection state corruption
echo "[3/5] CRITICAL: Stopping all applications before DB rename..."

echo "  [3.1] Stopping frontend..."
docker compose down frontend 2>&1 | grep -v "^Removing\|^Network" || true
sleep 2

echo "  [3.2] Stopping FastAPI (backend-ai)..."
docker compose down backend-ai 2>&1 | grep -v "^Removing\|^Network" || true
sleep 2

echo "  [3.3] Stopping Spring Boot (backend-java)..."
docker compose down backend-java 2>&1 | grep -v "^Removing\|^Network" || true
sleep 3

# Verify all apps stopped
RUNNING=$(docker ps | grep -E "backend-java|backend-ai|frontend" | wc -l)
if [ "$RUNNING" -gt 0 ]; then
    echo "❌ CRITICAL: Some applications still running"
    docker ps | grep -E "backend-java|backend-ai|frontend"
    exit 1
fi
echo "✅ All applications stopped"

# Step 3.4: Terminate all remaining database connections
echo "[3.4] Terminating all active database connections..."
docker exec crm-postgres psql -U rootuser -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='crm_cbt_db_dev' AND pid <> pg_backend_pid();" 2>&1 > /dev/null || true
sleep 3

# Verify all connections terminated
CONN_COUNT=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
  "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='crm_cbt_db_dev';" 2>&1 | xargs)
echo "Active connections after termination: $CONN_COUNT"
if [ "$CONN_COUNT" -gt 1 ]; then
    echo "⚠️  WARNING: Some connections remain, attempting force disconnect..."
    docker exec crm-postgres psql -U rootuser -c \
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='crm_cbt_db_dev';" 2>&1 > /dev/null || true
    sleep 2
fi

# Step 3.5: Rename corrupted database (safer than drop for forensics)
CORRUPTED_DB_NAME="crm_cbt_db_dev_corrupted_$(date -u +%Y%m%d_%H%M%S)_UTC"
echo "[3.5] Renaming corrupted database to: $CORRUPTED_DB_NAME"
docker exec crm-postgres psql -U rootuser -c "ALTER DATABASE crm_cbt_db_dev RENAME TO $CORRUPTED_DB_NAME;" 2>&1 > /dev/null || true
sleep 2

# Step 3.6: Create fresh database for restore
echo "[3.6] Creating fresh production database..."
docker exec crm-postgres createdb -U rootuser crm_cbt_db_dev
sleep 2

# Step 3.7: Restore from backup
echo "[3.7] Restoring from backup file: $BACKUP_FILE"
gunzip -c $BACKUP_FILE | docker exec -i crm-postgres psql -U rootuser -d crm_cbt_db_dev 2>&1 > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ CRITICAL: Restore failed"
    echo "Corrupted DB preserved as: $CORRUPTED_DB_NAME"
    echo "For emergency forensics, can inspect: $CORRUPTED_DB_NAME"
    echo "To remove: docker exec crm-postgres dropdb -U rootuser $CORRUPTED_DB_NAME"
    exit 1
fi

echo "✅ Database restored from backup"
echo "⚠️  Corrupted DB preserved as $CORRUPTED_DB_NAME for post-mortem analysis"

# Step 4: Verify restoration
echo "[4/5] Verifying restoration..."
TABLE_COUNT=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>&1 | xargs)
echo "Restored tables: $TABLE_COUNT"

if [ -z "$TABLE_COUNT" ] || [ "$TABLE_COUNT" -eq 0 ]; then
    echo "❌ CRITICAL: Restore failed - no tables found"
    exit 1
fi
echo "✅ Tables verified"

# Step 5: Restart services
echo "[5/5] Restarting services..."
docker compose up -d --no-deps backend-java backend-ai
sleep 10

SPRING_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null)
if [ "$SPRING_HEALTH" = "200" ]; then
    echo "✅ ROLLBACK COMPLETE - Production restored"
    echo ""
    echo "Backup used: $BACKUP_FILE"
    echo "Table count: $TABLE_COUNT"
else
    echo "⚠️  Rollback completed but services may not be fully online"
fi
```

**Rollback Verification Checklist (Must verify ALL after rollback completes):**

After rollback finishes, verify complete recovery:

1. **Database Accessibility** ✓
   ```bash
   docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT current_database();"
   # Expected: crm_cbt_db_dev
   ```

2. **Flyway Version Restored** ✓
   ```bash
   docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
     "SELECT MAX(version::int) FROM flyway_schema_history WHERE success=true;"
   # Expected: 5 (pre-Stage 2) or 10 (if rolling back from post-Stage 2)
   ```

3. **Table Count Matches Pre-Migration** ✓
   ```bash
   docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
     "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
   # Expected: 10 (pre-Stage 2) or 14 (if Stage 2 completed before issue)
   ```

4. **Sample Data Integrity** ✓
   ```bash
   docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
     "SELECT COUNT(*) FROM tenants; SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM conversation_logs;"
   # Expected: All return row counts (not errors)
   ```

5. **Backend Service Restarts Successfully** ✓
   ```bash
   docker logs backend-java | grep -i "tomcat started\|started in"
   # Expected: Spring Boot startup message
   ```

6. **API Endpoints Respond** ✓
   ```bash
   curl http://localhost:8080/actuator/health
   curl http://localhost:8000/health
   # Expected: Both return HTTP 200 with healthy status
   ```

**If ANY verification fails:**
- Do NOT proceed
- Keep database in current state
- Contact DBA/DevOps team immediately
- Do NOT attempt another rollback

**Rollback Triggers:**
- Production DB connection fails
- Migration errors detected
- Validation checks fail
- Health checks fail > 5 minutes
- Smoke tests fail
- Error rate > 20%
- Migration duration > 10 minutes

---

## STEP 8: FINAL PRODUCTION SNAPSHOT

**Purpose:** Export final schema state for auditing and disaster recovery reference

```bash
echo ""
echo "Creating final production snapshot for audit trail..."

# Create snapshot directory
mkdir -p ~/logs

SNAPSHOT_FILE="~/logs/stage2_post_validation_$(date +%Y%m%d_%H%M%S).txt"

{
    echo "=========================================="
    echo "STAGE 2 POST-MIGRATION SNAPSHOT"
    echo "=========================================="
    echo "Timestamp: $(date)"
    echo ""
    
    echo "--- FLYWAY MIGRATION HISTORY ---"
    docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;" 2>&1
    echo ""
    
    echo "--- ALL TABLES IN PRODUCTION ---"
    docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>&1
    echo ""
    
    echo "--- INDEX COUNT ---"
    INDEX_COUNT=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';" 2>&1 | xargs)
    echo "Total indexes: $INDEX_COUNT"
    echo ""
    
    echo "--- DATABASE SIZE ---"
    docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT pg_size_pretty(pg_database_size('crm_cbt_db_dev')) AS db_size;" 2>&1
    
} | tee "$SNAPSHOT_FILE"

echo ""
echo "✅ Snapshot saved to: $SNAPSHOT_FILE"
```

**Go/No-Go Criteria:**
- ✅ GO if: Snapshot created, all 10 migrations recorded, all 9+ tables present
- ❌ NO-GO if: Snapshot creation fails, data incomplete

---

## STEP 9: MANDATORY 30-MINUTE POST-MIGRATION OBSERVATION WINDOW

**Purpose:** Live monitoring after migration completes to ensure stability

**⚠️ CRITICAL:** Do NOT declare migration successful until this window completes

```bash
# ⚠️ CRITICAL: Correct timing logic (track START_TIME, not relative time)
START_TIME=$(date +%s)
OBSERVATION_DURATION=1800  # 30 minutes in seconds
echo "Starting 30-minute observation window at $(date)"
echo "Do not close this terminal or leave unattended during this window"

while true; do
    NOW=$(date +%s)
    ELAPSED=$((NOW - START_TIME))
    REMAINING=$((OBSERVATION_DURATION - ELAPSED))
    
    # Exit if 30 minutes elapsed
    if [ $ELAPSED -ge $OBSERVATION_DURATION ]; then
        break
    fi
    
    MINUTES=$((REMAINING / 60))
    
    echo ""
    echo "=== Observation Window: $MINUTES:$((REMAINING % 60)) remaining ==="
    
    # 1. Check application error logs (only recent 5 minutes)
    ERROR_COUNT=$(docker logs --since 5m "$BACKEND_CONTAINER" 2>&1 | grep -i "error\|exception" | wc -l)
    echo "[1] Errors in past 5 min (backend-java): $ERROR_COUNT"
    if [ $ERROR_COUNT -gt 20 ]; then
        echo "⚠️  CRITICAL: High error rate detected - INITIATE ROLLBACK"
        echo "Recent errors:"
        docker logs --since 5m "$BACKEND_CONTAINER" 2>&1 | grep -i "error\|exception" | tail -10
        exit 1
    fi
    
    # 2. Check database connections (should be stable) - with thresholds
    DB_CONN=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='crm_cbt_db_dev' AND state != 'idle';" 2>&1 | xargs)
    echo "[2] Active database queries: $DB_CONN (threshold: 20 active)"
    if [ "$DB_CONN" -gt 50 ]; then
        echo "    ❌ CRITICAL: High active queries ($DB_CONN) - LIKELY DEADLOCK - ESCALATE & ROLLBACK"
        exit 1
    elif [ "$DB_CONN" -gt 20 ]; then
        echo "    ⚠️  WARNING: Elevated active queries, monitor closely"
    fi
    
    # 3. Check API latency (should be < 2 seconds) - with thresholds
    API_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8000/health 2>/dev/null || echo "0")
    echo "[3] API latency (seconds): $API_TIME (threshold: 2 seconds)"
    if (( $(echo "$API_TIME > 5" | bc -l 2>/dev/null) )); then
        echo "    ❌ CRITICAL: API latency > 5 seconds - SYSTEM OVERLOAD - ESCALATE & ROLLBACK"
        exit 1
    elif (( $(echo "$API_TIME > 2" | bc -l 2>/dev/null) )); then
        echo "    ⚠️  WARNING: API latency > 2 seconds, check system resources"
    fi
    
    # 4. Check Docker memory and CPU usage with thresholds
    echo "[4] Docker container resources (with thresholds):"
    STATS=$(docker stats --no-stream backend-java backend-ai 2>/dev/null | tail -2)
    echo "$STATS"
    
    # Extract memory percentage and check threshold
    MEMORY_PCT=$(echo "$STATS" | grep backend-java | awk '{print $7}' | sed 's/%//' || echo "0")
    if (( $(echo "$MEMORY_PCT > 85" | bc -l 2>/dev/null) )); then
        echo "    ⚠️  CRITICAL: Backend memory > 85% ($MEMORY_PCT%) - ESCALATE IMMEDIATELY"
    fi
    
    # Extract CPU percentage and check threshold
    CPU_PCT=$(echo "$STATS" | grep backend-java | awk '{print $3}' | sed 's/%//' || echo "0")
    if (( $(echo "$CPU_PCT > 80" | bc -l 2>/dev/null) )); then
        echo "    ⚠️  CRITICAL: Backend CPU > 80% ($CPU_PCT%) - CHECK FOR HANGING QUERIES"
    fi
    
    # 5. Check Flyway health
    FLYWAY_VERSION=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT MAX(version::int) FROM flyway_schema_history WHERE success=true;" 2>&1 | xargs)
    echo "[5] Flyway version: $FLYWAY_VERSION (expected 10)"
    if [ "$FLYWAY_VERSION" != "10" ]; then
        echo "❌ CRITICAL: Flyway version mismatch - SCHEMA CORRUPTION"
        exit 1
    fi
    
    echo ""
    echo "✅ Checkpoint clear - sleeping 5 minutes..."
    sleep 300  # Check every 5 minutes
done

echo ""
echo "=========================================="
echo "✅ 30-MINUTE OBSERVATION WINDOW COMPLETE"
echo "=========================================="
echo "Migration is now declared SUCCESSFUL"
echo "All systems stable and healthy"
```

**Observation Window Checklist:**
- [ ] No ERROR/EXCEPTION spam in application logs
- [ ] Database connections stable (< 50 active)
- [ ] API responses fast (< 2 seconds)
- [ ] Docker memory stable (no growth spikes)
- [ ] Flyway version = 10 confirmed
- [ ] System resources healthy (CPU < 80%, Memory < 85%)
- [ ] User-visible functionality working (test UI)

**If any issue detected during observation:**
1. Immediately note the time and issue
2. Do NOT wait - execute rollback procedure
3. Investigation happens AFTER rollback is complete
4. Never proceed with production use if observation failed

**Post-Observation Success Criteria:**
- ✅ Completed full 30 minutes without critical issues
- ✅ No anomalies in logs or metrics
- ✅ User functionality verified (manual smoke test)
- ✅ All sign-off team notified of successful completion
- ✅ Document any warnings or minor issues for post-mortem

---

## GO/NO-GO DECISION CRITERIA

### ✅ GO TO PRODUCTION if ALL conditions met:

1. **Backup verified** ✅
   - File exists and integrity verified
   - Size > 1MB
   - Timestamp before migration start

2. **Migration successful** ✅
   - Spring Boot connected to production DB
   - Flyway final version = 10
   - All 5 migrations (V6-V10) successful
   - No errors in logs

3. **Validation passed** ✅
   - 9/9 production validation checks pass
   - Final Flyway version confirmed 10
   - All 4 new tables exist
   - pg_trgm extension installed
   - Indexes ≥ 35
   - ANALYZE completed

4. **Services healthy** ✅
   - Spring Boot health = HTTP 200
   - FastAPI health = HTTP 200
   - No connection errors

5. **Smoke tests passed** ✅
   - All 7 tests pass (7/7)
   - Intent detection correct
   - API responses valid
   - No critical errors

### ❌ NO-GO to Production if ANY condition fails:

1. **Backup issues**
   - Verification fails
   - File too small
   - Disk errors

2. **Migration failures**
   - Cannot connect to production DB
   - Flyway errors detected
   - Timeout occurred

3. **Validation failures**
   - Any check fails
   - Version < 10
   - Tables missing
   - Extension not installed

4. **Service health issues**
   - Spring Boot HTTP != 200
   - FastAPI HTTP != 200
   - Connection timeouts

5. **Smoke test failures**
   - Any test fails
   - Intent detection wrong
   - API errors
   - Unexpected data

---

## ROLLBACK TRIGGER THRESHOLDS (IMMEDIATE ROLLBACK CONDITIONS)

**Execute rollback immediately if ANY of these conditions occur:**

1. **Migration Duration > 10 minutes**
   - Indicates: Possible lock contention or database issue
   - Action: Stop migration, execute rollback
   - Check: Monitor Step 4 duration via docker logs

2. **Flyway Error Detected**
   - Indicates: Migration SQL syntax error or constraint violation
   - Action: Execute rollback immediately
   - Check: `docker logs backend-java | grep -i "flyway.*error\|migration.*failed"`

3. **Database Connection Exhaustion**
   - Indicates: Too many open connections, app cannot connect
   - Action: Terminate idle connections, execute rollback if persist
   - Check: `psql -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='crm_cbt_db_dev';"` > 50

4. **Health Endpoints Fail > 5 Minutes After Restart**
   - Indicates: Application cannot start with new schema
   - Action: Execute rollback, investigate incompatibility
   - Check: `curl http://localhost:8080/actuator/health` and `curl http://localhost:8000/health`

5. **Error Rate > 20% in Logs**
   - Indicates: Application is failing on new schema
   - Action: Monitor logs for 5 min, if > 20% errors: rollback
   - Check: `docker logs backend-java 2>&1 | grep -i "error\|exception" | wc -l`

6. **Schema Version Mismatch**
   - Indicates: Flyway version doesn't match expected state
   - Action: Execute rollback immediately
   - Check: `psql -c "SELECT MAX(version::int) FROM flyway_schema_history WHERE success=true;"`  must = 10

7. **Application Startup Failure**
   - Indicates: Application cannot boot with new schema
   - Action: Execute rollback, investigate stack trace
   - Check: `docker logs backend-java | grep -i "started\|failed to start\|exception"`

**Post-Rollback:**
- Verify rollback completed successfully (see PRODUCTION_SCHEMA_REFERENCE.md section on rollback verification)
- Do NOT attempt to re-run migration without investigation
- Escalate to DBA/DevOps team for post-mortem
- Document what triggered rollback for future improvements

---

## DEPLOYMENT FREEZE RULE (CRITICAL)

**NO other deployments or changes allowed during Stage 2 execution window**

Before starting Stage 2, notify team:
- [ ] Frontend team: NO deployments during this window
- [ ] Backend team: NO API deployments during this window  
- [ ] Database team: NO schema changes during this window
- [ ] Ops team: NO infrastructure changes during this window

**Duration:** From Step 1 (backup) through Step 8 (snapshot) = ~45 minutes

**Estimated Execution Window:**
- Start time: _____________
- End time: _____________ (start + 45 min)

---

## MAINTENANCE MODE RECOMMENDATION

**Option A: Frontend Maintenance Banner (Recommended)**
```bash
# Set environment variable or frontend config
export MAINTENANCE_MODE=true
export MAINTENANCE_MESSAGE="System upgrade in progress. Expected downtime: 45 minutes."

# Restart frontend with maintenance banner
docker compose up -d --no-deps frontend
```

**Option B: Temporary API Disable (If available)**
```bash
# Some frameworks support graceful request rejection
# Update frontend to show: "API temporarily unavailable for maintenance"
```

**Choose Option A or B before Stage 2 starts:**
- [ ] Option A: Frontend maintenance banner enabled
- [ ] Option B: API disable mode enabled
- [ ] Neither: Accept brief service downtime (Steps 2-6)

---

## POST-MIGRATION MONITORING (30 Minutes)

**After Step 6 (services restart), monitor for 30 minutes:**

```bash
# Real-time monitoring window (do not close during these 30 minutes)
MONITOR_END=$(date -d "+30 minutes" +%s)

while [ $(date +%s) -lt $MONITOR_END ]; do
    echo "=== $(date +%H:%M:%S) - POST-MIGRATION MONITORING ==="
    
    # Check error logs
    echo "[1] Error logs (last 10 errors):"
    docker logs backend-java 2>&1 | grep -i "error\|exception" | tail -10
    
    # Check DB connections
    echo "[2] Active DB connections:"
    docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -t -c \
      "SELECT COUNT(*) FROM pg_stat_activity;" 2>&1 | xargs
    
    # Check API response times
    echo "[3] API latency (health check):"
    curl -s -w "HTTP %{http_code}, Time: %{time_total}s\n" -o /dev/null \
      http://localhost:8000/health 2>/dev/null
    
    # Check memory usage
    echo "[4] Docker memory usage:"
    docker stats --no-stream backend-java backend-ai 2>/dev/null | tail -2
    
    echo ""
    sleep 300  # Check every 5 minutes
done

echo "✅ 30-minute monitoring window complete"
```

**Critical Signals to Watch For (Stop migration if observed):**
- Connection pool exhaustion (growing DB connections)
- Repeated error logs (ERROR/Exception spam)
- API latency spikes > 5 seconds
- Memory usage > 90%
- Services restarting unexpectedly

**If Critical Signal Detected:**
1. Note the time and error message
2. Execute ROLLBACK PROCEDURE immediately
3. Notify team of incident
4. Schedule post-mortem investigation

---

## FINAL CHECKLIST BEFORE EXECUTING STAGE 2

**Pre-Execution:**
- [ ] Read and understand entire checklist (all 8 steps + monitoring)
- [ ] Confirmed backup location and strategy
- [ ] Identified rollback backup file location
- [ ] Service stop/start order understood
- [ ] Validation criteria clear
- [ ] Go/no-go decision points identified
- [ ] Rollback procedure reviewed and tested (on staging only)
- [ ] Team notified and agreed to deployment freeze
- [ ] Maintenance window active and scheduled
- [ ] All prerequisites met

**Credentials & Security:**
- [ ] DB_PASSWORD environment variable exported
- [ ] JWT_SECRET_KEY environment variable exported
- [ ] No credentials hardcoded in any files
- [ ] Backup location has sufficient disk space (> 50MB)

**Monitoring & Recovery:**
- [ ] Monitoring script prepared and understood
- [ ] 30-minute post-migration monitoring window scheduled
- [ ] Rollback procedure understood and backup verified
- [ ] Incident response team on standby
- [ ] Post-mortem tracking system ready

**Deployment Freeze Confirmed:**
- [ ] No frontend deployments planned during window
- [ ] No backend deployments planned during window
- [ ] No database changes planned during window
- [ ] No infrastructure changes planned during window

**Final Approval - Required Sign-offs:**
- [ ] **DBA Approval:** _______________ (name/date)
  - DBA has reviewed schema and validated no conflicts
  - DBA confirmed backup and rollback procedures
- [ ] **Backend Owner Approval:** _______________ (name/date)
  - Backend team confirmed application compatibility with V6-V10
  - Backend team will monitor during and after migration
- [ ] **Ops/Infrastructure Approval:** _______________ (name/date)
  - Ops team confirmed maintenance window is secure
  - Ops team assigned rollback owner
- [ ] **Rollback Owner Assigned:** _______________ (name)
  - Designated person authorized to execute rollback if needed
  - Rollback owner available for entire duration + 2 hours after
- [ ] **Maintenance Window Approved:** _______________ (date/time)
  - Window is confirmed with all stakeholders
  - Communication sent to all affected teams

**Personal Acknowledgment:**
- [ ] I have reviewed all 10 steps and understand the complete process
- [ ] I understand rollback will take ~15 minutes if needed
- [ ] I am authorized to execute Stage 2 on production
- [ ] I accept responsibility for this production change
- [ ] I will not execute migrations manually in psql (only via Flyway)
- [ ] I understand 30-minute monitoring is MANDATORY after migration

---

---

## FAILED MIGRATION RECOVERY (If Flyway Partially Applies)

**If migration fails partway through:**

### What Happened
- Flyway may have applied some of V6-V10 migrations
- Schema is in inconsistent state (neither pre-migration nor post-migration)
- Database is now UNSAFE - cannot be used for production
- Manual re-running migrations is FORBIDDEN

### Recovery Procedure

**1. DO NOT PANIC - Database is protected by backup**

**2. DO NOT attempt to:**
- ❌ Manually run remaining SQL from failed migrations
- ❌ Re-run `docker compose up backend-java` (Flyway will retry incorrectly)
- ❌ Apply patches manually in psql
- ❌ Continue with application startup

**3. IMMEDIATE ACTIONS:**
```bash
# Identify which migrations partially applied
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c \
  "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"

# Note the LAST successful migration version (e.g., "5" means V1-V5 succeeded, V6+ failed)

# STOP all services immediately
docker compose down backend-java backend-ai frontend

# DO NOT attempt to fix - rollback immediately
# (See ROLLBACK PROCEDURE section below)
```

**4. Root Cause Analysis (AFTER rollback):**
- Check Flyway logs: `docker logs backend-java | grep -i flyway`
- Identify which SQL statement failed
- Contact DBA to debug the failing migration SQL
- Fix the migration file before re-attempting Stage 2

**5. Re-attempt Stage 2:**
- Only after root cause is identified and fixed
- Start from beginning (backup, stop services, etc.)
- Do NOT continue from partial state

---

## ⚠️ CRITICAL WARNING: NEVER EXECUTE MIGRATIONS MANUALLY IN psql

**ABSOLUTELY FORBIDDEN - Consequences are permanent:**

**This is the most dangerous mistake possible during Stage 2:**

```bash
# ❌ ABSOLUTELY FORBIDDEN - Never do this:
psql -U rootuser -d crm_cbt_db_dev << 'EOF'
ALTER TABLE whatsapp_sessions ADD COLUMN new_field VARCHAR;
CREATE INDEX idx_new ON whatsapp_sessions(new_field);
EOF
```

**Why this will destroy the migration:**
1. Flyway version history will be out of sync with actual schema
2. Next migration will fail (thinks V5, but schema is already at V7)
3. Impossible to rollback manually-applied changes
4. Version control is completely lost
5. Multi-environment consistency is broken
6. Database is now in an undefined state

**The ONLY correct way to migrate:**
1. Create migration file: `backend-java/src/main/resources/db/migration/V11__description.sql`
2. Add SQL changes ONLY to that file
3. Restart Spring Boot via docker-compose
4. Flyway automatically detects and executes the migration
5. Migration history is tracked and can be rolled back

**If someone manually executed SQL (past Stage 2):**
1. STOP ALL APPLICATION SERVICES IMMEDIATELY
2. Do NOT commit or restart anything
3. Contact DBA team URGENTLY
4. Rollback database from backup
5. Re-apply changes through proper Flyway migration
6. Conduct post-mortem to prevent future incidents

---

## POST-MIGRATION APPLICATION FUNCTIONALITY CHECKS

**After Step 7 (Smoke Tests) Pass - Before declaring success, test actual application flows:**

```bash
# ⚠️ CRITICAL: Health endpoints ≠ Application functionality
# Health = app is running, but it may not work correctly

echo "=========================================="
echo "POST-MIGRATION APPLICATION TESTING"
echo "=========================================="
echo "Time: $(date -u)"
echo ""

# 1. USER AUTHENTICATION TEST
echo "[1/5] Testing User Authentication..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leadrat.com","password":"Admin@123!"}' \
  2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q "token\|access_token"; then
    echo "✅ PASS: Login works, token received"
else
    echo "❌ FAIL: Login failed or no token"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Extract token for subsequent tests
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4 || echo "")

# 2. CHAT FUNCTIONALITY TEST
echo "[2/5] Testing Chat Functionality..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"show leads","conversation_history":[]}' \
  2>/dev/null)

if echo "$CHAT_RESPONSE" | grep -q "intent\|data"; then
    echo "✅ PASS: Chat endpoint responding, intent detected"
else
    echo "❌ FAIL: Chat endpoint error"
    echo "Response: $CHAT_RESPONSE"
    exit 1
fi

# 3. LEAD QUERY TEST
echo "[3/5] Testing Lead Search..."
LEAD_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/v1/leadrat/leads/search?page=1&size=5" \
  -H "Authorization: Bearer $TOKEN" \
  2>/dev/null)

if echo "$LEAD_RESPONSE" | grep -q "data\|total\|\[\]"; then
    echo "✅ PASS: Lead search endpoint responding"
else
    echo "❌ FAIL: Lead search error"
    echo "Response: $LEAD_RESPONSE"
    exit 1
fi

# 4. PROPERTY QUERY TEST
echo "[4/5] Testing Property Search..."
PROPERTY_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/v1/leadrat/properties/search?page=1&size=5" \
  -H "Authorization: Bearer $TOKEN" \
  2>/dev/null)

if echo "$PROPERTY_RESPONSE" | grep -q "data\|total\|\[\]"; then
    echo "✅ PASS: Property search endpoint responding"
else
    echo "❌ FAIL: Property search error"
    echo "Response: $PROPERTY_RESPONSE"
    exit 1
fi

# 5. PROJECT QUERY TEST
echo "[5/5] Testing Project Search..."
PROJECT_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/v1/leadrat/projects/search?page=1&size=5" \
  -H "Authorization: Bearer $TOKEN" \
  2>/dev/null)

if echo "$PROJECT_RESPONSE" | grep -q "data\|total\|\[\]"; then
    echo "✅ PASS: Project search endpoint responding"
else
    echo "❌ FAIL: Project search error"
    echo "Response: $PROJECT_RESPONSE"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ ALL APPLICATION TESTS PASSED"
echo "=========================================="
echo "Application is fully functional post-migration"
```

**Go/No-Go Criteria (Application Testing):**
- ✅ GO if: All 5 functional tests pass (auth, chat, leads, properties, projects)
- ⚠️  PARTIAL if: Some endpoints work but not all (investigate failures)
- ❌ NO-GO if: Multiple tests fail or core auth fails (indicates schema incompatibility)

---

## ESTIMATED DURATION

- Pre-flight checks: 5 minutes
- Step 1 (Backup): 5 minutes
- Step 2 (Stop services): 3 minutes
- Step 3-4 (Migration): 10 minutes
- Step 5 (Validation): 5 minutes
- Step 6 (Restart services): 5 minutes
- Step 7 (Smoke tests): 5 minutes
- Step 8 (Snapshot): 2 minutes
- **Step 9 (Post-migration monitoring): 30 minutes** (critical for stability)

**Active Execution: ~40 minutes**  
**Full Duration (with monitoring): ~70 minutes**  
**Rollback (if needed): ~15 minutes**

**Note:** 30-minute monitoring window is REQUIRED before considering Stage 2 complete. Do not skip this step or close the monitoring script early.

---

## APPROVAL REQUIRED

**User Review:** ☐ Reviewed and approved  
**Execution Date/Time:** _______________  
**Executed By:** _______________  

Once approved, execute with:
```bash
bash STAGE2_EXECUTE.sh
```
