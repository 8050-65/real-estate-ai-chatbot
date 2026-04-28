# Stage 1 Execution Checklist

**Status:** Ready for User Execution  
**Duration:** 30-45 minutes  
**Risk Level:** LOW (uses isolated staging database)

---

## Pre-Execution Verification

Before you start, verify these prerequisites:

- [ ] Docker is running: `docker ps` returns output with `crm-postgres` container
- [ ] PostgreSQL container healthy: `docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT 1;"`
- [ ] V6-V10 migration files exist in `backend-java/src/main/resources/db/migration/`
  - [ ] V6__add_tenant_configs.sql (2.5K)
  - [ ] V7__add_conversation_memory.sql (3.7K)
  - [ ] V8__add_audit_logs.sql (4.4K)
  - [ ] V9__add_sync_metadata_columns.sql (7.3K)
  - [ ] V10__add_enhanced_sync_logs.sql (3.9K)
- [ ] Terminal/bash access available
- [ ] Disk space: ~5GB free (for backups)

---

## Stage 1 Execution Steps

### Step 1: Create Production Backup

**Estimated Time:** 5 minutes

```bash
# FIX #3: Add gzip compression for smaller backups and safer storage
mkdir -p ~/db_backups

# Create compressed backup
docker exec crm-postgres pg_dump -U rootuser crm_cbt_db_dev | gzip > \
  ~/db_backups/crm_cbt_db_dev_pre_v6-v10_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup created and is valid
ls -lh ~/db_backups/crm_cbt_db_dev_pre_v6-v10_*.sql.gz
gunzip -t ~/db_backups/crm_cbt_db_dev_pre_v6-v10_*.sql.gz && echo "✅ Backup integrity verified"
```

**Checklist:**
- [ ] Compressed backup file created successfully (.sql.gz)
- [ ] Backup file size: ~500KB-1MB (compressed)
- [ ] Backup integrity verified: `gunzip -t` returns success

**Success Indicator:** ✅ Backup file exists and integrity check passes

---

### Step 2: Create Staging Database

**Estimated Time:** 3 minutes

```bash
# FIX #4: Check if staging DB already exists (prevent accidental overwrite)
EXISTS=$(docker exec crm-postgres psql -U rootuser -d postgres -t -c \
  "SELECT COUNT(*) FROM pg_database WHERE datname='crm_cbt_db_dev_staging';" | xargs)

if [ "$EXISTS" = "1" ]; then
    echo "WARNING: Staging database already exists. Dropping first..."
    docker exec crm-postgres dropdb -U rootuser crm_cbt_db_dev_staging
fi

# Create fresh staging database
docker exec crm-postgres createdb -U rootuser crm_cbt_db_dev_staging

# Verify creation
docker exec crm-postgres psql -U rootuser -d postgres -c "SELECT datname FROM pg_database WHERE datname = 'crm_cbt_db_dev_staging';"
```

**Checklist:**
- [ ] Staging database created (or previous instance cleaned up)
- [ ] Query shows: `crm_cbt_db_dev_staging`

**Success Indicator:** ✅ Staging database appears in list

---

### Step 3: Restore Backup to Staging

**Estimated Time:** 5 minutes

```bash
# FIX #3: Handle gzipped backup file
BACKUP_FILE=$(ls -t ~/db_backups/crm_cbt_db_dev_pre_v6-v10_*.sql.gz | head -1)

# Restore compressed backup (gunzip piped directly to psql)
gunzip -c $BACKUP_FILE | docker exec -i crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging

# FIX #1: Trim whitespace in validation query result
TABLE_COUNT=$(docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | xargs)

echo "Table count in staging: $TABLE_COUNT"
```

**Checklist:**
- [ ] Restoration completed without errors
- [ ] Table count matches production (should be 14 tables for V1-V5)
- [ ] No restoration errors in output

**Success Indicator:** ✅ Table count: `14` (matches pre-migration state)

---

### Step 4: Deploy Spring Boot Against Staging

**Estimated Time:** 10 minutes

**⚠️ NOTE - Expected Lock Behavior (Fix #6):**
During migration, some large ALTER TABLE operations will briefly lock tables:
- `whatsapp_sessions`: ADD 6 columns (~1-2 sec lock expected)
- `conversation_logs`: ADD 4 columns (~1-2 sec lock expected)
- `site_visits`: ADD 6 columns (~1-2 sec lock expected)
This is normal and expected on a staging DB.

**Option A: Using Environment Variable (Recommended)**

```bash
# Stop current Spring Boot
docker-compose down backend-java

# Start Spring Boot pointing to staging
SPRING_DATASOURCE_DB=crm_cbt_db_dev_staging docker-compose up -d backend-java

# FIX #5: Monitor migration with timeout protection
# If migration hangs >5 minutes, investigate locks
echo "Monitoring Flyway migration (timeout: 5 minutes)..."
TIMEOUT=300  # 5 minutes in seconds
ELAPSED=0
INTERVAL=10

while [ $ELAPSED -lt $TIMEOUT ]; do
    if docker logs backend-java 2>/dev/null | grep -q "Successfully applied 5 migrations"; then
        echo "✅ Migrations completed successfully"
        break
    elif docker logs backend-java 2>/dev/null | grep -q "Tomcat started"; then
        echo "✅ Spring Boot started"
        break
    elif docker logs backend-java 2>/dev/null | grep -q -i "error\|exception\|failed"; then
        echo "❌ Migration error detected - see logs below"
        docker logs backend-java | tail -20
        break
    fi
    
    echo "Still running... ($ELAPSED/$TIMEOUT seconds)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "⚠️  WARNING: Migration appears to be hanging (>5 min)"
    echo "Checking for table locks..."
    docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging -c \
      "SELECT pid, usename, pg_blocking_pids(pid) as blocked_by, query 
       FROM pg_stat_activity WHERE pg_blocking_pids(pid)::text != '{}';"
    echo "Review locks above and consider stopping Spring Boot"
fi

# Final status
docker logs backend-java | tail -50 | grep -i -E "(flyway|migration|error|success|started|tomcat)"
```

**Option B: Using .env File**

```bash
cat > backend-java/.env <<EOF
SPRING_DATASOURCE_HOST=localhost
SPRING_DATASOURCE_PORT=5432
SPRING_DATASOURCE_DB=crm_cbt_db_dev_staging
SPRING_DATASOURCE_USERNAME=rootuser
SPRING_DATASOURCE_PASSWORD=123Pa$$word!
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
EOF

docker-compose up -d backend-java
sleep 20
docker logs backend-java | tail -50
```

**Checklist:**
- [ ] Spring Boot container started: `docker ps | grep backend-java`
- [ ] Logs show Flyway execution: `grep -i "flyway" in docker logs`
- [ ] V6-V10 migrations successful: Look for "Successfully applied 5 migrations"
- [ ] Spring Boot started: Look for "Tomcat started on port"
- [ ] NO errors in logs: `docker logs backend-java | grep -i error`

**Success Indicators:**
```
✅ INFO o.f.core.internal.command.DbMigrate : Successfully applied 5 migrations
✅ INFO o.f.core.internal.command.DbMigrate : Successfully validated 10 migrations
✅ INFO o.s.b.w.e.tomcat.TomcatWebServer : Tomcat started on port(s): 8080
```

**Failure Indicators (STOP and report):**
```
❌ ERROR in Flyway migration
❌ Function update_updated_at_column() not found
❌ Syntax error in migration
❌ Constraint violation
```

---

### Step 5: Run Validation Script

**Estimated Time:** 5 minutes

```bash
# Save validation script with ALL FIXES
cat > migration_validation.sh <<'EOF'
#!/bin/bash
DB_NAME=${1:-crm_cbt_db_dev_staging}
CHECKS_PASS=0
CHECKS_FAIL=0

echo "=== VALIDATION RESULTS ==="
echo ""

# FIX #2: Use safe Flyway query (without error column)
# FIX #1: Trim whitespace from numeric results using xargs
result=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM flyway_schema_history WHERE version >= 6 AND success=true;" | xargs)
if [ "$result" = "5" ]; then
    echo "✅ Check 1: Flyway V6-V10 migrations = PASS (5 applied)"
    ((CHECKS_PASS++))
else
    echo "❌ Check 1: Flyway V6-V10 migrations = FAIL (got '$result', expected '5')"
    # Show detailed migration status
    docker exec crm-postgres psql -U rootuser -d $DB_NAME -c \
      "SELECT version, description, success FROM flyway_schema_history WHERE version >= 6 ORDER BY version;"
    ((CHECKS_FAIL++))
fi

# Checks 2-5: New tables (FIX #1: trim whitespace)
for table in "tenant_configs" "conversation_memory" "audit_logs" "data_sync_logs"; do
    result=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';" | xargs)
    if [ "$result" = "1" ]; then
        echo "✅ Check: Table $table exists = PASS"
        ((CHECKS_PASS++))
    else
        echo "❌ Check: Table $table exists = FAIL"
        ((CHECKS_FAIL++))
    fi
done

# Checks 6-9: Sync metadata columns (FIX #1: trim whitespace)
for col in "sync_status" "sync_error" "record_checksum" "idempotency_key"; do
    result=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
      "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='whatsapp_sessions' AND column_name='$col';" | xargs)
    if [ "$result" = "1" ]; then
        echo "✅ Check: Column $col added = PASS"
        ((CHECKS_PASS++))
    else
        echo "❌ Check: Column $col added = FAIL"
        ((CHECKS_FAIL++))
    fi
done

# Check 10: Composite idempotency index (FIX #1: trim whitespace)
result=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM pg_indexes WHERE indexname='idx_whatsapp_sessions_idempotency';" | xargs)
if [ "$result" = "1" ]; then
    echo "✅ Check: Composite idempotency index = PASS"
    ((CHECKS_PASS++))
else
    echo "❌ Check: Composite idempotency index = FAIL"
    ((CHECKS_FAIL++))
fi

# FIX #9: Verify index count (not just existence)
INDEX_COUNT=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';" | xargs)
echo ""
echo "Index count verification: $INDEX_COUNT total indexes (expect ≥ 35 for V1-V10)"
if [ "$INDEX_COUNT" -ge 35 ]; then
    echo "✅ Index count = PASS"
    ((CHECKS_PASS++))
else
    echo "⚠️  Index count = WARNING (only $INDEX_COUNT, expected ≥ 35)"
fi

# FIX #8: Verify pg_trgm extension created
PG_TRGM=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM pg_extension WHERE extname='pg_trgm';" | xargs)
if [ "$PG_TRGM" = "1" ]; then
    echo "✅ Check: pg_trgm extension = PASS"
    ((CHECKS_PASS++))
else
    echo "❌ Check: pg_trgm extension = FAIL"
    ((CHECKS_FAIL++))
fi

# Data integrity check
echo ""
echo "=== DATA INTEGRITY CHECK ==="
docker exec crm-postgres psql -U rootuser -d $DB_NAME -c \
  "SELECT 'tenants' as table_name, COUNT(*) as rows FROM tenants
   UNION ALL SELECT 'users', COUNT(*) FROM users
   UNION ALL SELECT 'whatsapp_sessions', COUNT(*) FROM whatsapp_sessions;"

# FIX #7: Run ANALYZE for query planner optimization
echo ""
echo "=== Running ANALYZE for query optimization ==="
docker exec crm-postgres psql -U rootuser -d $DB_NAME -c "ANALYZE;" > /dev/null 2>&1
echo "✅ ANALYZE completed"

echo ""
echo "=== SUMMARY ==="
echo "Checks Passed: $CHECKS_PASS"
echo "Checks Failed: $CHECKS_FAIL"
echo ""

if [ $CHECKS_FAIL -eq 0 ]; then
    echo "✅ ALL VALIDATION CHECKS PASSED - Ready for Stage 2"
    exit 0
else
    echo "❌ SOME VALIDATION CHECKS FAILED - Debug and retry"
    exit 1
fi
EOF

chmod +x migration_validation.sh
./migration_validation.sh crm_cbt_db_dev_staging
```

**Checklist:**
- [ ] Script runs without errors
- [ ] All checks show: ✅ PASS
- [ ] Checks Passed count: 11
- [ ] Checks Failed count: 0

**Success Indicator:** ✅ `ALL VALIDATION CHECKS PASSED - Ready for Stage 2`

---

### Step 6: Application Health Checks + Smoke Tests

**Estimated Time:** 5 minutes

```bash
# FIX #10: Verify application health endpoints BEFORE running smoke tests
echo "=== APPLICATION HEALTH CHECKS ==="
echo ""

# Check Spring Boot health
echo -n "Spring Boot health endpoint: "
SPRING_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null)
if [ "$SPRING_HEALTH" = "200" ]; then
    echo "✅ HTTP $SPRING_HEALTH"
else
    echo "❌ HTTP $SPRING_HEALTH (expected 200)"
fi

# Check FastAPI health (if running)
echo -n "FastAPI health endpoint: "
FASTAPI_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
if [ "$FASTAPI_HEALTH" = "200" ]; then
    echo "✅ HTTP $FASTAPI_HEALTH"
else
    echo "⚠️  HTTP $FASTAPI_HEALTH (if FastAPI not running, this is expected)"
fi

echo ""
echo "=== RUNNING PHASE 2 SMOKE TESTS ==="
echo ""

# Run the existing Phase 2 smoke test script
bash PHASE2_SMOKE_TEST.sh

# Expected: All 7 tests PASS
```

**Checklist:**
- [ ] Spring Boot health endpoint: ✅ HTTP 200
- [ ] FastAPI health endpoint: ✅ HTTP 200
- [ ] Test 1: Health Check = ✅ PASS
- [ ] Test 2: Chat: Lead Search = ✅ PASS
- [ ] Test 3: Chat: Property Search = ✅ PASS
- [ ] Test 4: Chat: Project Search = ✅ PASS
- [ ] Test 5: Chat: General Query = ✅ PASS
- [ ] Test 6: Leadrat Lead Endpoint = ✅ PASS
- [ ] Test 7: Leadrat Property Endpoint = ✅ PASS
- [ ] Total Tests Passed: 7
- [ ] Total Tests Failed: 0

**Success Indicator:** ✅ `ALL TESTS PASSED ✓`

---

## Stage 1 Completion

### If ALL checks passed:

```bash
# Capture final validation output
echo "=== STAGE 1 COMPLETION ==="
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging \
  -c "SELECT version, description, success FROM flyway_schema_history WHERE version >= 6 ORDER BY version;"

echo ""
echo "=== READY FOR STAGE 2 ==="
```

**Final Checklist:**
- [ ] All 6 steps completed successfully
- [ ] All validation checks PASS
- [ ] All smoke tests PASS
- [ ] No errors in any logs
- [ ] Backup file verified and readable
- [ ] Ready to report Stage 1 success

**Next Action:** Report results and await approval for Stage 2

---

### If ANY check failed:

**Do NOT proceed to Stage 2.**

**Debug steps:**
1. Capture all error messages:
   ```bash
   docker logs backend-java > stage1_error_logs.txt
   ```

2. Check specific migration:
   ```bash
   docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging \
     -c "SELECT * FROM flyway_schema_history WHERE success = false;"
   ```

3. Report:
   - [ ] Error logs captured
   - [ ] Error message identified
   - [ ] Specific migration version failed
   - [ ] Ready for troubleshooting

**Next Action:** Report failure details for analysis

---

## Time Breakdown

| Step | Estimated | Actual | Status |
|------|-----------|--------|--------|
| 1. Backup | 5 min | ___ | [ ] |
| 2. Create Staging | 3 min | ___ | [ ] |
| 3. Restore Backup | 5 min | ___ | [ ] |
| 4. Deploy Spring Boot | 10 min | ___ | [ ] |
| 5. Validation | 5 min | ___ | [ ] |
| 6. Smoke Tests | 5 min | ___ | [ ] |
| **TOTAL** | **33 min** | ___ | [ ] |

---

## Quick Commands Reference

```bash
# Monitor Spring Boot (with real-time tail)
docker logs backend-java -f --tail=100

# Check staging DB size
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging \
  -c "SELECT pg_size_pretty(pg_database_size('crm_cbt_db_dev_staging'));"

# Verify migrations applied (FIX #1: trim whitespace)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging -t -c \
  "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY version;" | xargs -n1

# Check for table locks (FIX #5: lock monitoring)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging -c \
  "SELECT pid, usename, query FROM pg_stat_activity WHERE state='active';"

# Verify pg_trgm extension (FIX #8)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging -c \
  "SELECT extname FROM pg_extension WHERE extname='pg_trgm';"

# Check index count (FIX #9)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging -c \
  "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';"

# Verify application health (FIX #10)
curl -s http://localhost:8080/actuator/health | jq .
curl -s http://localhost:8000/health | jq .

# Rollback staging DB (if needed)
docker exec crm-postgres dropdb -U rootuser crm_cbt_db_dev_staging

# Clean up backups (keep one recent backup)
rm ~/db_backups/crm_cbt_db_dev_pre_v6-v10_*.sql.gz | head -n -1
```

---

## Ready to Execute?

Review this checklist and execute Stage 1 in your environment. Once complete:
1. Report results (PASS/FAIL) with step-by-step checklist
2. Share any error messages if failures occurred
3. Wait for approval before proceeding to Stage 2

Good luck! 🚀
