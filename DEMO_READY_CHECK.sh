#!/bin/bash

# DEMO DEPLOYMENT READINESS CHECK
# Run this before demo to verify all systems are GO

echo "=========================================="
echo "🚀 DEMO READINESS CHECK"
echo "=========================================="
echo ""

READY=true

# Check 1: Docker Compose
echo "📦 Checking Docker Services..."
if docker compose ps | grep -q "healthy"; then
    echo "✅ Services healthy"
else
    echo "❌ Services not healthy - run: docker compose ps"
    READY=false
fi
echo ""

# Check 2: Frontend
echo "🌐 Checking Frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend not accessible - run: npm run dev"
    READY=false
fi
echo ""

# Check 3: Java Backend
echo "⚙️  Checking Java Backend..."
if curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ Java Backend healthy"
else
    echo "❌ Java Backend not accessible"
    READY=false
fi
echo ""

# Check 4: FastAPI Service
echo "🤖 Checking FastAPI Service..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ FastAPI healthy"
else
    echo "❌ FastAPI not accessible"
    READY=false
fi
echo ""

# Check 5: Database
echo "🗄️  Checking Database..."
if docker exec crm-postgres pg_isready -U rootuser -d crm_cbt_db_dev > /dev/null 2>&1; then
    echo "✅ Database accessible"
else
    echo "❌ Database not accessible"
    READY=false
fi
echo ""

# Check 6: Redis
echo "📍 Checking Redis..."
if docker exec realestate_redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis healthy"
else
    echo "❌ Redis not healthy"
    READY=false
fi
echo ""

# Check 7: Backup
echo "💾 Checking Database Backup..."
BACKUP_COUNT=$(ls demo_backup_* 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo "✅ Backup exists ($BACKUP_COUNT file(s))"
else
    echo "⚠️  No backup found - creating one now..."
    docker exec crm-postgres pg_dump -U rootuser -d crm_cbt_db_dev | gzip > demo_backup_$(date +%Y%m%d_%H%M%S).sql.gz
    echo "✅ Backup created"
fi
echo ""

# Check 8: Console Errors
echo "🔍 Checking Frontend for Errors..."
if curl -s http://localhost:3000 | grep -i "error\|undefined" > /dev/null 2>&1; then
    echo "⚠️  Possible errors in frontend"
else
    echo "✅ No obvious errors detected"
fi
echo ""

# Check 9: Git Status
echo "📝 Checking Git Status..."
if git status --porcelain | grep -q .; then
    echo "⚠️  Uncommitted changes exist - consider committing"
else
    echo "✅ Working tree clean"
fi
echo ""

# Final Status
echo "=========================================="
if [ "$READY" = true ]; then
    echo "🟢 DEMO READY! All systems GO!"
    echo ""
    echo "Quick checklist before CEO demo:"
    echo "  ✅ Database backup created"
    echo "  ✅ All services healthy"
    echo "  ✅ Frontend, backend, AI service working"
    echo "  ✅ Redis cache functioning"
    echo ""
    echo "Next steps:"
    echo "  1. Review demo scenarios in DEMO_DEPLOYMENT_GUIDE.md"
    echo "  2. Do a quick dress rehearsal"
    echo "  3. Show confidence!"
    echo ""
    exit 0
else
    echo "🔴 DEMO NOT READY - Fix issues above"
    echo ""
    exit 1
fi
