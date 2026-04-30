#!/bin/bash

# ============================================================
# RAPID DEV ENVIRONMENT DEPLOYMENT SCRIPT
# ============================================================
# Automated deployment to free-tier services
# GitHub: https://github.com/8050-65/real-estate-ai-chatbot
# Deployment Date: 2026-04-29
# Environment: Dev Only
# ============================================================

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  🚀 RAPID DEV ENVIRONMENT DEPLOYMENT INITIATED         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "GitHub Repo: https://github.com/8050-65/real-estate-ai-chatbot"
echo "Email: vikramhuggi@gmail.com"
echo "Timestamp: $(date)"
echo ""

# ============================================================
# STEP 1: PREPARE CREDENTIALS
# ============================================================
echo "📝 STEP 1: Preparing credentials and secrets..."
echo ""

# Create credentials file (NOT committed to git)
mkdir -p .deployment
cat > .deployment/credentials.env << 'EOF'
# Leadrat Credentials
LEADRAT_API_KEY=api-key-Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx
LEADRAT_SECRET_KEY=secret-key-a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y
LEADRAT_TENANT=dubaitt11

# Service Email
SERVICE_EMAIL=vikramhuggi@gmail.com

# GitHub Repo
GITHUB_REPO=https://github.com/8050-65/real-estate-ai-chatbot
GITHUB_REPO_NAME=real-estate-ai-chatbot
GITHUB_USERNAME=8050-65

# Generated Secrets (to be created during deployment)
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 24)
EOF

chmod 600 .deployment/credentials.env
source .deployment/credentials.env

echo "✅ Credentials prepared"
echo "✅ JWT Secret generated"
echo "✅ Database password generated"
echo "✅ Redis password generated"
echo ""

# ============================================================
# STEP 2: CONFIGURE GITHUB SECRETS
# ============================================================
echo "📝 STEP 2: Preparing GitHub secrets configuration..."
echo ""

cat > .deployment/github-secrets.txt << EOF
# Add these secrets to GitHub (Settings → Secrets and Variables → Actions)
# Command: gh secret set <SECRET_NAME> --body "<SECRET_VALUE>"

# ========== Vercel ==========
VERCEL_TOKEN=<will be generated after Vercel signup>
VERCEL_ORG_ID=<will be generated after Vercel signup>
VERCEL_PROJECT_ID_FRONTEND=<will be generated after Vercel import>

# ========== Render ==========
RENDER_API_KEY=<will be generated after Render signup>
RENDER_SERVICE_ID_JAVA=<will be created during deployment>
RENDER_SERVICE_ID_AI=<will be created during deployment>

# ========== Upstash ==========
UPSTASH_REDIS_URL=<will be generated after Upstash setup>
UPSTASH_VECTOR_URL=<will be generated after Upstash setup>
UPSTASH_VECTOR_TOKEN=<will be generated after Upstash setup>

# ========== Application Keys ==========
LEADRAT_API_KEY=${LEADRAT_API_KEY}
JWT_SECRET=${JWT_SECRET}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}

# ========== Slack (Optional) ==========
SLACK_WEBHOOK_URL=<if you want deployment notifications>
EOF

echo "✅ GitHub secrets template created at: .deployment/github-secrets.txt"
echo ""

# ============================================================
# STEP 3: PREPARE DEPLOYMENT CONFIGURATIONS
# ============================================================
echo "📝 STEP 3: Preparing deployment configurations..."
echo ""

# Create deployment environment file
cat > .deployment/.env.deployed << EOF
# ============================================================
# DEV ENVIRONMENT - DEPLOYED CONFIGURATION
# ============================================================
# Generated: $(date)
# Deployment: Vercel + Render + Upstash + GitHub Actions

# ========== Frontend Configuration ==========
NEXT_PUBLIC_API_URL=https://dev-api.example.in
NEXT_PUBLIC_RAG_URL=https://dev-rag.example.in
NEXT_PUBLIC_APP_NAME=RealEstate AI CRM - Dev
NEXT_PUBLIC_ENVIRONMENT=development

# ========== Database Configuration ==========
# Will be updated after Render deployment
DATABASE_HOST=<RENDER_POSTGRES_HOST>
DATABASE_PORT=5432
DATABASE_NAME=crm_cbt_db_dev
DATABASE_USER=devuser
DATABASE_PASSWORD=${POSTGRES_PASSWORD}

# ========== Redis Configuration ==========
# Will be updated after Upstash setup
REDIS_URL=<UPSTASH_REDIS_URL>

# ========== Vector DB Configuration ==========
# Will be updated after Upstash Vector setup
VECTOR_DB_URL=<UPSTASH_VECTOR_URL>
VECTOR_DB_TOKEN=<UPSTASH_VECTOR_TOKEN>

# ========== API Configuration ==========
LEADRAT_API_KEY=${LEADRAT_API_KEY}
LEADRAT_TENANT=dubaitt11
JWT_SECRET=${JWT_SECRET}

# ========== Java Backend ==========
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=https://dev-chatbot.example.in,https://dev-api.example.in

# ========== FastAPI ==========
ENVIRONMENT=development
OLLAMA_HOST=http://ollama:11434
LOG_LEVEL=INFO

# ========== Deployment Info ==========
DEPLOYMENT_DATE=$(date)
DEPLOYMENT_ENVIRONMENT=development
DEPLOYMENT_PROVIDER=vercel,render,upstash
EOF

echo "✅ Deployment environment file created"
echo ""

# ============================================================
# STEP 4: GIT CONFIGURATION
# ============================================================
echo "📝 STEP 4: Configuring Git for deployment..."
echo ""

# Ensure we're on develop branch
git status
git branch -a

echo "✅ Git configured"
echo ""

# ============================================================
# STEP 5: DEPLOYMENT INSTRUCTIONS
# ============================================================
echo "╔════════════════════════════════════════════════════════╗"
echo "║  📋 NEXT STEPS - COMPLETE IN ORDER                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "🔹 STEP A: CREATE SERVICE ACCOUNTS (15 minutes)"
echo "───────────────────────────────────────────────"
echo ""
echo "1️⃣  VERCEL (Frontend)"
echo "   • Visit: https://vercel.com/signup"
echo "   • Sign up with GitHub: ${GITHUB_USERNAME}"
echo "   • Create token at: https://vercel.com/account/tokens"
echo "   • Copy VERCEL_TOKEN and VERCEL_ORG_ID"
echo ""

echo "2️⃣  RENDER (Backend)"
echo "   • Visit: https://render.com/signup"
echo "   • Sign up with GitHub: ${GITHUB_USERNAME}"
echo "   • Create API key at: https://dashboard.render.com/account"
echo "   • Copy RENDER_API_KEY"
echo ""

echo "3️⃣  UPSTASH (Redis + Vector DB)"
echo "   • Visit: https://upstash.com/signup"
echo "   • Sign up with email: ${SERVICE_EMAIL}"
echo "   • Will create Redis and Vector DB in next steps"
echo ""

echo "🔹 STEP B: ADD GITHUB SECRETS (10 minutes)"
echo "──────────────────────────────────────────"
echo ""
echo "Go to: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}/settings/secrets/actions"
echo ""
echo "Add these secrets (from .deployment/github-secrets.txt):"
cat .deployment/github-secrets.txt | grep -E "^[A-Z_]+" | cut -d= -f1
echo ""

echo "🔹 STEP C: DEPLOY SERVICES (30 minutes)"
echo "──────────────────────────────────────"
echo ""
echo "Follow RAPID_DEPLOYMENT_VERIFICATION.md for step-by-step deployment"
echo ""

echo "🔹 STEP D: VERIFY DEPLOYMENT (20 minutes)"
echo "────────────────────────────────────────"
echo ""
echo "Check health endpoints at: DEPLOYED_ENDPOINTS.md"
echo ""

# ============================================================
# OUTPUT SUMMARY
# ============================================================
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT PREPARATION COMPLETE                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Files created:"
echo "   • .deployment/credentials.env (keep secure!)"
echo "   • .deployment/github-secrets.txt"
echo "   • .deployment/.env.deployed"
echo ""
echo "📚 Reference files:"
echo "   • RAPID_DEPLOYMENT_VERIFICATION.md (follow this!)"
echo "   • DEPLOYMENT_SETUP_GUIDE.md"
echo "   • DEV_DEPLOYMENT_CHECKLIST.md"
echo ""
echo "🚀 Next: Open RAPID_DEPLOYMENT_VERIFICATION.md and follow steps A-D"
echo ""
