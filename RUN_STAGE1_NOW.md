# STAGE 1: RUN NOW

**Status:** All preparation complete. Ready for immediate execution.

---

## Quick Start

Copy and paste these commands into your terminal (not through IDE):

```bash
cd c:/Users/vikra/source/repos/Chatbot_Leadrat/real-estate-ai-chatbot/real-estate-ai-chatbot

chmod +x execute_stage1.sh

./execute_stage1.sh
```

**Estimated Duration:** 10-15 minutes

---

## What the Script Does

### Step 1: Backup with Gzip (2 min)
- Creates compressed backup of production DB
- Verifies backup integrity
- Reports backup file path and size

### Step 2: Create Staging DB (1 min)
- Checks if staging DB exists, cleans it up if needed
- Creates fresh staging database
- Verifies creation

### Step 3: Restore Backup (2 min)
- Decompresses backup
- Restores to staging DB
- Verifies table count matches

### Step 4: Deploy Spring Boot (3 min)
- Stops current Spring Boot
- Restarts against staging DB
- Monitors Flyway V6-V10 migrations with 5-min timeout
- Watches for lock contention

### Step 5: Validation (2 min)
- Checks all 5 Flyway migrations applied (V6-V10)
- Verifies 4 new tables created
- Confirms pg_trgm extension
- Counts indexes (should be ≥35)
- Runs ANALYZE optimization

### Step 6: Health Checks (1 min)
- Tests Spring Boot health endpoint (expect HTTP 200)
- Tests FastAPI health endpoint (expect HTTP 200)

### Step 7: Smoke Tests (2 min)
- Runs Phase 2 smoke test suite
- Expects all 7 tests to PASS

---

## Expected Output

```
========================================
STAGE 1: SAFE MIGRATION TESTING
========================================

[STEP 1] Creating backup with gzip compression...
  ✅ Backup created
  Size: 0.5M
  ✅ Backup integrity verified

[STEP 2] Creating clean staging database...
  ✅ Staging database created: crm_cbt_db_dev_staging

[STEP 3] Restoring backup to staging...
  Restored table count: 14
  ✅ Restoration successful

[STEP 4] Deploying Spring Boot to staging...
  ✅ Migrations completed successfully
  Flyway Result: SUCCESS

[STEP 5] Running validation script...
  Validation Checks:
    [1/11] Flyway V6-V10 migrations: 5 (expected 5)
           ✅ PASS
    [2/11] Table tenant_configs: 1 (expected 1)
           ✅ PASS
    [3/11] Table conversation_memory: 1 (expected 1)
           ✅ PASS
    [4/11] Table audit_logs: 1 (expected 1)
           ✅ PASS
    [5/11] Table data_sync_logs: 1 (expected 1)
           ✅ PASS
    [6/11] pg_trgm extension: 1 (expected 1)
           ✅ PASS
    [7/11] Total indexes: 47 (expected ≥ 35)
           ✅ PASS
    [8/11] Running ANALYZE for optimization...
           ✅ PASS

  Validation Summary:
    Passed: 8
    Failed: 0

[STEP 6] Application health checks...
  Spring Boot health endpoint:
    HTTP 200
    ✅ PASS

  FastAPI health endpoint:
    HTTP 200
    ✅ PASS

[STEP 7] Running Phase 2 smoke tests...
  [TEST 1] Health Check ... ✅ PASS (HTTP 200)
  [TEST 2] Chat: Lead Search ... ✅ PASS (Intent: lead, Items: 10)
  [TEST 3] Chat: Property Search ... ✅ PASS (Intent: property, Items: 7)
  [TEST 4] Chat: Project Search ... ✅ PASS (Intent: project, Items: 5)
  [TEST 5] Chat: General Query ... ✅ PASS (Intent: general)
  [TEST 6] Leadrat Lead Endpoint ... ✅ PASS (HTTP 200)
  [TEST 7] Leadrat Property Endpoint ... ✅ PASS (HTTP 200)

  TEST SUMMARY
  Total Tests: 7
  Passed: 7
  Failed: 0

  ✅ ALL TESTS PASSED ✓

========================================
STAGE 1 EXECUTION COMPLETE
========================================

Results saved to: /tmp/stage1_results_*.txt
```

---

## After Execution

1. **Copy the results file:**
   ```bash
   cat ~/stage1_results_latest.txt
   ```

2. **Report to Claude with:**
   - Backup file path and size
   - Staging DB name
   - Flyway V6-V10 result
   - Validation result (all passes)
   - Spring Boot health result
   - FastAPI health result
   - Smoke test result
   - Any warnings/errors

3. **If ALL PASS:**
   - We proceed to Stage 2 (production execution)
   - Must have your explicit approval

4. **If ANY FAIL:**
   - Report the specific failure
   - We debug and retry before Stage 2

---

## Troubleshooting

If migration hangs (>5 min):
```bash
# Check for table locks
docker exec crm-postgres psql -U rootuser -d crm_cbt_db_dev_staging -c \
  "SELECT pid, usename, query FROM pg_stat_activity WHERE state='active';"

# If needed, stop Spring Boot
docker-compose down backend-java

# Clean up staging
docker exec crm-postgres dropdb -U rootuser crm_cbt_db_dev_staging

# Then rerun script
./execute_stage1.sh
```

If health check fails:
```bash
# Check Spring Boot logs
docker logs backend-java | tail -50

# Verify Spring Boot is running
docker ps | grep backend-java

# Check if Spring Boot can see staging DB
docker exec crm-postgres psql -U rootuser -l | grep staging
```

---

## Ready?

Run this now in your terminal:

```bash
cd c:/Users/vikra/source/repos/Chatbot_Leadrat/real-estate-ai-chatbot/real-estate-ai-chatbot
chmod +x execute_stage1.sh
./execute_stage1.sh
```

**DO NOT run on production database.** This script only touches staging DB.

Good luck! 🚀
