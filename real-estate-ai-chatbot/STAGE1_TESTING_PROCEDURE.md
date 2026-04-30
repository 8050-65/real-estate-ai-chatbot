# Stage 1: Safe Migration Testing Procedure

**Objective:** Test V6-V10 migrations on a staging database before running on production  
**Duration:** ~30-45 minutes  
**Risk Level:** LOW (uses copy of DB, no production impact)

---

## Prerequisites

Ensure you have:
- PostgreSQL 15+ running in Docker (crm-postgres container)
- V6-V10 migration files in `backend-java/src/main/resources/db/migration/`
- Docker Compose setup available
- Access to terminal/command line

---

## Stage 1 Execution Steps

### STEP 1: Create Database Backup (5 min)

**Purpose:** Preserve current production database state for rollback

```bash
# Create backup directory
mkdir -p ~/db_backups

# Create backup of production database
docker exec crm-postgres pg_dump -U rootuser crm_cbt_db_dev > ~/db_backups/crm_cbt_db_dev_pre_v6-v10_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh ~/db_backups/crm_cbt_db_dev_pre_v6-v10_*.sql

# Show backup size
du -h ~/db_backups/crm_cbt_db_dev_pre_v6-v10_*.sql | tail -1
```

**Expected Output:**
```
-rw-r--r-- 1 user user 2.5M Apr 28 10:15 crm_cbt_db_dev_pre_v6-v10_20260428_101530.sql
2.5M    ~/db_backups/...
```

---

### STEP 2: Create Staging Database (3 min)

**Purpose:** Create isolated copy of production for testing

```bash
# Create staging database
docker exec crm-postgres createdb -U rootuser crm_cbt_db_dev_staging

# Verify creation
docker exec crm-postgres psql -U rootuser -d postgres -c "SELECT datname FROM pg_database WHERE datname LIKE '%staging%';"
```

**Expected Output:**
```
     datname
─────────────────────────
 crm_cbt_db_dev_staging
(1 row)
```

---

### STEP 3: Restore Backup into Staging (5 min)

**Purpose:** Copy production data into staging for migration testing

```bash
# Restore backup to staging database
BACKUP_FILE=$(ls -t ~/db_backups/crm_cbt_db_dev_pre_v6-v10_*.sql | head -1)
docker exec -i crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging < $BACKUP_FILE

# Verify restoration (should show same table count as production)
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

**Expected Output:**
```
 count
───────
    14
(1 row)
```

**Note:** Should match row count from production DB.

---

### STEP 4: Deploy Spring Boot Against Staging DB (10 min)

**Purpose:** Trigger Flyway V6-V10 migrations on staging database

**Option A: Using Environment Variable (Easiest)**

```bash
# Stop current Spring Boot
docker-compose down backend-java

# Start Spring Boot pointing to staging database
SPRING_DATASOURCE_DB=crm_cbt_db_dev_staging docker-compose up -d backend-java

# Monitor migration execution
docker logs backend-java -f --tail=50 | grep -i -E "(flyway|migration|error|success)"

# Wait until you see:
# "Flyway: ... V6__add_tenant_configs ... REDO ... 0ms"
# "Flyway: Successfully validated 10 migrations"
# ... and Spring Boot startup completes
```

**Option B: Using .env File**

```bash
# Edit .env or create backend-java/.env
cat >> backend-java/.env <<EOF
SPRING_DATASOURCE_HOST=localhost
SPRING_DATASOURCE_PORT=5432
SPRING_DATASOURCE_DB=crm_cbt_db_dev_staging
SPRING_DATASOURCE_USERNAME=rootuser
SPRING_DATASOURCE_PASSWORD=123Pa$$word!
EOF

# Start Spring Boot
docker-compose up -d backend-java

# Tail logs
docker logs backend-java -f --tail=50
```

**Expected Log Output (CRITICAL):**
```
2026-04-28T10:20:15 INFO  o.f.core.internal.command.DbMigrate : 
    Successfully applied 5 migrations to the database.

2026-04-28T10:20:15 INFO  o.f.core.internal.command.DbMigrate :
    Successfully validated 10 migrations (of which 5 newly applied)

2026-04-28T10:20:20 INFO  o.s.b.w.e.tomcat.TomcatWebServer :
    Tomcat started on port(s): 8080 with context path '/'
```

**If you see errors:**
```
ERROR in Flyway migration:
  Migration V6__add_tenant_configs.sql failed
  Reason: Function update_updated_at_column() not found
```

→ **Stop and report immediately.** Do NOT proceed to Step 5.

---

### STEP 5: Run Migration Validation Script (5 min)

**Purpose:** Verify all tables, columns, indexes created correctly

**Create validation script:** `migration_validation.sh`

```bash
#!/bin/bash
# Save as: migration_validation.sh

DB_NAME=${1:-crm_cbt_db_dev_staging}
RESULTS_FILE="/tmp/migration_validation_$(date +%s).txt"

echo "========================================" > $RESULTS_FILE
echo "MIGRATION VALIDATION REPORT" >> $RESULTS_FILE
echo "Database: $DB_NAME" >> $RESULTS_FILE
echo "Timestamp: $(date)" >> $RESULTS_FILE
echo "========================================" >> $RESULTS_FILE

PASS_COUNT=0
FAIL_COUNT=0

# CHECK 1: Flyway History
echo "[CHECK 1] Verifying Flyway migrations V6-V10..."
result=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM flyway_schema_history WHERE version >= 6 AND success=true;")
if [ "$result" -eq 5 ]; then
    echo "✅ PASS: All V6-V10 migrations successful" >> $RESULTS_FILE
    ((PASS_COUNT++))
else
    echo "❌ FAIL: Expected 5 successful migrations, got $result" >> $RESULTS_FILE
    ((FAIL_COUNT++))
fi

# CHECK 2: New Tables
echo "[CHECK 2] Verifying new tables created..."
tables=("tenant_configs" "conversation_memory" "audit_logs" "data_sync_logs")
for table in "${tables[@]}"; do
    result=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';")
    if [ "$result" -eq 1 ]; then
        echo "✅ PASS: Table $table exists" >> $RESULTS_FILE
        ((PASS_COUNT++))
    else
        echo "❌ FAIL: Table $table not found" >> $RESULTS_FILE
        ((FAIL_COUNT++))
    fi
done

# CHECK 3: Sync Metadata Columns
echo "[CHECK 3] Verifying sync metadata columns..."
columns=("sync_status" "sync_error" "record_checksum" "idempotency_key")
for col in "${columns[@]}"; do
    result=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
      "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='whatsapp_sessions' AND column_name='$col';")
    if [ "$result" -eq 1 ]; then
        echo "✅ PASS: Column $col added" >> $RESULTS_FILE
        ((PASS_COUNT++))
    else
        echo "❌ FAIL: Column $col not found" >> $RESULTS_FILE
        ((FAIL_COUNT++))
    fi
done

# CHECK 4: Key Constraints
echo "[CHECK 4] Verifying composite idempotency constraints..."
result=$(docker exec crm-postgres psql -U rootuser -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM pg_indexes WHERE indexname='idx_whatsapp_sessions_idempotency';")
if [ "$result" -eq 1 ]; then
    echo "✅ PASS: Composite idempotency index exists" >> $RESULTS_FILE
    ((PASS_COUNT++))
else
    echo "❌ FAIL: Composite idempotency index not found" >> $RESULTS_FILE
    ((FAIL_COUNT++))
fi

# CHECK 5: Data Integrity
echo "[CHECK 5] Verifying data integrity..."
docker exec crm-postgres psql -U rootuser -d $DB_NAME -c \
  "SELECT 'tenants' as table_name, COUNT(*) as rows FROM tenants
   UNION ALL
   SELECT 'users', COUNT(*) FROM users
   UNION ALL
   SELECT 'whatsapp_sessions', COUNT(*) FROM whatsapp_sessions;" >> $RESULTS_FILE

echo "" >> $RESULTS_FILE
echo "SUMMARY" >> $RESULTS_FILE
echo "Passed: $PASS_COUNT" >> $RESULTS_FILE
echo "Failed: $FAIL_COUNT" >> $RESULTS_FILE

cat $RESULTS_FILE
if [ $FAIL_COUNT -eq 0 ]; then
    echo "✅ ALL VALIDATION CHECKS PASSED"
    exit 0
else
    echo "❌ SOME VALIDATION CHECKS FAILED"
    exit 1
fi
```

**Run validation:**

```bash
chmod +x migration_validation.sh
./migration_validation.sh crm_cbt_db_dev_staging
```

**Expected Output:**
```
========================================
MIGRATION VALIDATION REPORT
Database: crm_cbt_db_dev_staging
Timestamp: Mon Apr 28 10:35:00 2026
========================================

✅ PASS: All V6-V10 migrations successful
✅ PASS: Table tenant_configs exists
✅ PASS: Table conversation_memory exists
✅ PASS: Table audit_logs exists
✅ PASS: Table data_sync_logs exists
✅ PASS: Column sync_status added
✅ PASS: Column sync_error added
✅ PASS: Column record_checksum added
✅ PASS: Column idempotency_key added
✅ PASS: Composite idempotency index exists

SUMMARY
Passed: 10
Failed: 0

✅ ALL VALIDATION CHECKS PASSED
```

---

### STEP 6: Run Phase 2 Smoke Tests Against Staging (5 min)

**Purpose:** Verify application still works with new database schema

```bash
# Run existing Phase 2 smoke tests against staging database environment
# (Update smoke test script to point to staging DB or use FastAPI)

# If using FastAPI pointing to staging:
SPRING_DATASOURCE_DB=crm_cbt_db_dev_staging python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 &

# Run smoke tests
bash PHASE2_SMOKE_TEST.sh http://localhost:8001

# Expected: All 7 tests PASS
```

**Expected Output:**
```
==========================================
PHASE 2 SMOKE TESTS
==========================================

[TEST 1] Health Check ... ✅ PASS (HTTP 200)
[TEST 2] Chat: Lead Search ... ✅ PASS (Intent: lead, Items: 10)
[TEST 3] Chat: Property Search ... ✅ PASS (Intent: property, Items: 7)
[TEST 4] Chat: Project Search ... ✅ PASS (Intent: project, Items: 5)
[TEST 5] Chat: General Query ... ✅ PASS (Intent: general)
[TEST 6] Leadrat Lead Endpoint ... ✅ PASS (HTTP 200)
[TEST 7] Leadrat Property Endpoint ... ✅ PASS (HTTP 200)

==========================================
TEST SUMMARY
==========================================
Total Tests: 7
Passed: ✅ 7
Failed: ❌ 0

✅ ALL TESTS PASSED ✓
```

---

## Stage 1 Completion Criteria

✅ **PASS Stage 1 if ALL conditions met:**

1. ✅ Database backup created successfully (file exists, ~2.5MB)
2. ✅ Staging database created and restored
3. ✅ Flyway migrations V6-V10 executed successfully (5 migrations applied)
4. ✅ All 10 validation checks PASS
5. ✅ All 7 Phase 2 smoke tests PASS
6. ✅ Zero errors in Spring Boot logs
7. ✅ Zero data loss (row counts match pre-migration)

---

## If Stage 1 Fails

**Option A: Debug Migration Issues**
```bash
# Check Flyway history for details
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging \
  -c "SELECT version, description, success, error FROM flyway_schema_history ORDER BY installed_rank;"

# Check Spring Boot logs for detailed error
docker logs backend-java | grep -i -A 5 "error\|exception\|failed"
```

**Option B: Rollback Staging Database**
```bash
# Drop staging database
docker exec crm-postgres dropdb -U rootuser crm_cbt_db_dev_staging

# Retry from STEP 2
```

---

## If Stage 1 Succeeds

**You are now cleared for Stage 2 (Production Execution):**

Next steps:
1. Report Stage 1 results to user
2. Wait for final approval
3. Proceed with Stage 2:
   - Backup production database
   - Deploy Spring Boot against production
   - Run validation on production
   - Announce service restoration

---

## Quick Reference Commands

```bash
# Tail Spring Boot logs
docker logs backend-java -f --tail=50

# Check staging database size
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging \
  -c "SELECT pg_size_pretty(pg_database_size('crm_cbt_db_dev_staging'));"

# Count tables in staging
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Clean up (if needed)
docker exec crm-postgres dropdb -U rootuser crm_cbt_db_dev_staging
rm ~/db_backups/crm_cbt_db_dev_pre_v6-v10_*.sql
```

---

## Support

If you encounter any errors, collect:
1. Spring Boot log output (docker logs backend-java)
2. Validation script output
3. Specific error message
4. Execution step where it failed

Then report findings for troubleshooting.
