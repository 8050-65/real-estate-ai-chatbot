<<<<<<< HEAD
# real-estate-ai-chatbot
AI-powered WhatsApp chatbot for real estate property search integrated with Leadrat CRM. Supports dynamic property discovery, lead capture, and scalable microservices architecture with optional RAG-based intelligence.
=======
# Real Estate AI Chatbot — WhatsApp + CRM Dashboard

A **production-grade, commercially scalable** AI-powered WhatsApp chatbot for real estate builders that answers customer queries 24/7, captures leads, books site visits, and provides an admin analytics dashboard.

**Status:** 🚀 **Development** | Current Version: 1.0.0 | Stack: Next.js 14 · Spring Boot 3 · FastAPI · LangGraph · Ollama · PostgreSQL · Redis

---

## 🎯 Project Overview

### What This Does
- **WhatsApp Bot**: Answers customer queries about projects, properties, pricing, legal details, and site visit bookings
- **Lead Capture**: Automatically qualifies and stores leads in Leadrat CRM
- **Site Visit Scheduling**: Books appointments, sends ICS invites and SMS reminders
- **Admin Dashboard**: Real-time analytics with natural language queries (NLQ)
- **Multi-Tenant**: Supports multiple real estate builders with isolated data

### Key Features
✓ 24/7 AI WhatsApp support with intent classification  
✓ Live property & project data from Leadrat CRM  
✓ Semantic search (RAG) for project documentation  
✓ Site visit calendar with automated reminders  
✓ Natural language analytics dashboard  
✓ Role-based access (Admin, Sales Manager, RM, Marketing)  
✓ Secure JWT authentication  
✓ Structured logging & monitoring  
✓ Horizontal scaling ready (stateless services)  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Business API                     │
│                      (Engageto BSP)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌─────────────────────────────────────┐
        │   FastAPI AI Service (Port 8000)     │
        │  ─────────────────────────────────  │
        │  • LangGraph Intent Classifier       │
        │  • Ollama LLaMA 3.2                  │
        │  • ChromaDB RAG Search               │
        │  • Session Management                │
        │  • Leadrat API Integration           │
        └─────────────────────────────────────┘
                      │              │
        ┌─────────────▼──┐    ┌──────▼────────────┐
        │ PostgreSQL 15  │    │  Redis 7 Cache    │
        │  (Async with   │    │  • Sessions       │
        │   asyncpg)     │    │  • Tokens         │
        │                │    │  • Rate limits    │
        └────────────────┘    └───────────────────┘
                            │
        ┌───────────────────▼──────────────────┐
        │  Spring Boot 3.x Backend (Port 8080)  │
        │  ──────────────────────────────────  │
        │  • Lead Management                   │
        │  • Property Inventory                │
        │  • Visit Scheduling                  │
        │  • Analytics Queries                 │
        │  • Multi-Tenant Filtering            │
        └───────────────────┬──────────────────┘
                            │
        ┌───────────────────▼──────────────────┐
        │   Next.js 14 Dashboard (Port 3000)    │
        │  ──────────────────────────────────  │
        │  • KPI Cards & Charts                │
        │  • Lead Management Table             │
        │  • NLQ Analytics Interface           │
        │  • Site Visit Calendar               │
        │  • Bot Configuration                 │
        └───────────────────┬──────────────────┘
                            │
        ┌───────────────────▼──────────────────┐
        │    Leadrat CRM API (External)         │
        │  ──────────────────────────────────  │
        │  • Projects & Properties             │
        │  • Lead Creation & Assignment        │
        │  • Tenant Data Isolation             │
        └───────────────────────────────────────┘
```

### Service Communication
- **Frontend → Backend**: REST API (JWT auth) + TanStack Query
- **Backend ↔ AI Service**: REST API
- **AI ↔ Leadrat**: HTTP with OAuth token caching (5-min TTL)
- **All services**: Async I/O, structured logging, health checks

---

## 📋 Prerequisites

### System Requirements
- **Docker & Docker Compose** 20.10+
- **Git** 2.30+
- **Make** (for Linux/Mac; Windows: use `Makefile` with WSL or manually run commands)

### For Local Development (without Docker)
- **Node.js** 18.17+
- **Python** 3.11+
- **Java** JDK 17
- **PostgreSQL** 15
- **Redis** 7

---

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone <repo-url>
cd real-estate-ai-chatbot
make setup
```

### 2. Configure Environment
```bash
# Copy template and fill in actual values
cp backend-ai/.env.example backend-ai/.env

# Fill these with your actual API keys:
# - LEADRAT_API_KEY
# - LEADRAT_SECRET_KEY
# - ENGAGETO_TOKEN
# - ENGAGETO_PHONE_ID
# - JWT_SECRET_KEY (generate: openssl rand -base64 32)

nano backend-ai/.env  # Edit with your values
```

### 3. Start Development Environment
```bash
# Start all services (docker-compose will build automatically)
make dev

# Wait for services to be ready (~2-3 minutes)
make health  # Check all services

# Pull LLaMA 3.2 model to Ollama (one-time, ~4GB)
make pull-model
```

### 4. Verify Services
```bash
# FastAPI AI Service
curl http://localhost:8000/health

# Spring Boot Backend
curl http://localhost:8080/actuator/health

# Next.js Frontend
open http://localhost:3000
```

### 5. Configure Engageto Webhook
Update your Engageto dashboard to point webhook to:
```
POST http://<your-ip>:8000/webhook/whatsapp
```

Add webhook secret to `backend-ai/.env`:
```env
ENGAGETO_WEBHOOK_SECRET=<secret-from-engageto>
```

### 6. Send Test Message
Send a WhatsApp message to your bot number and check logs:
```bash
make logs-ai  # FastAPI logs
make logs     # All services
```

---

## 📁 Project Structure

```
real-estate-ai-chatbot/
├── frontend/                    # Next.js 14 CRM Dashboard
│   ├── app/                     # App Router
│   ├── components/              # React components
│   ├── lib/                     # API client, auth, utilities
│   ├── hooks/                   # Custom React hooks (TanStack Query)
│   ├── types/                   # TypeScript types
│   ├── package.json
│   └── Dockerfile
│
├── backend-java/                # Spring Boot 3.x API
│   ├── src/main/java/com/realestate/
│   │   ├── config/              # Security, Redis, OpenAPI config
│   │   ├── auth/                # JWT, login endpoints
│   │   ├── user/                # User management
│   │   ├── lead/                # Lead management
│   │   ├── property/            # Property APIs
│   │   ├── project/             # Project APIs
│   │   ├── visit/               # Site visit scheduling
│   │   ├── analytics/           # NLQ analytics
│   │   └── common/              # Exception handlers, utilities
│   ├── src/main/resources/db/migration/  # Flyway migrations
│   ├── pom.xml
│   └── Dockerfile
│
├── backend-ai/                  # FastAPI + LangGraph
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Pydantic settings from .env
│   │   ├── webhook/             # Engageto webhook handler
│   │   ├── agents/              # LangGraph orchestrator
│   │   ├── services/            # Leadrat, Engageto, Redis
│   │   ├── rag/                 # ChromaDB RAG
│   │   ├── db/                  # SQLAlchemy models
│   │   ├── cache/               # Redis client
│   │   └── utils/               # Logging, exceptions
│   ├── tests/                   # Pytest tests
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── docs/                        # Documentation & configs
│   ├── init-db.sql              # PostgreSQL init script
│   ├── nginx.conf               # Nginx proxy config (prod)
│   └── architecture.md          # Detailed architecture docs
│
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production overrides
├── Makefile                     # Convenience commands
└── README.md                    # This file
```

---

## 🛠️ Development Commands

```bash
make dev            # Start development environment
make down           # Stop all services
make logs           # Tail all logs
make logs-ai        # FastAPI logs only
make logs-java      # Spring Boot logs only
make logs-frontend  # Next.js logs only
make health         # Check service health
make pull-model     # Pull LLaMA 3.2 to Ollama
make test           # Run all tests
make clean          # Delete containers, volumes, cache
make prod-up        # Start production environment
make prod-down      # Stop production environment
```

---

## 🔑 Environment Variables

### backend-ai/.env
All sensitive config lives here:
- **Leadrat**: API key, secret, tenant, URLs
- **Engageto**: Token, phone ID, webhook secret
- **JWT**: Secret key for token signing
- **Database**: PostgreSQL connection string
- **Redis**: Cache connection
- **Ollama**: LLM model and base URL
- **Logging**: Level (INFO, DEBUG, WARNING)

See `backend-ai/.env.example` for full template.

### backend-java/application.properties
Configured via `docker-compose.yml` environment variables.

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=RealEstate AI CRM
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 🔗 API Endpoints

### FastAPI (Port 8000)
```
POST   /webhook/whatsapp          # Engageto sends WhatsApp messages here
GET    /health                    # Service health check
POST   /ai/test-intent            # Test intent classification (dev)
```

### Spring Boot (Port 8080)
```
POST   /api/v1/auth/login         # Login
POST   /api/v1/auth/refresh       # Refresh JWT token
GET    /api/v1/leads              # List leads (with filters, pagination)
GET    /api/v1/leads/{id}         # Get lead details
GET    /api/v1/properties         # List properties
GET    /api/v1/projects           # List projects
GET    /api/v1/visits             # List site visits
POST   /api/v1/visits             # Create site visit
POST   /api/v1/analytics/query    # Natural language query to analytics
GET    /api/v1/settings/bot-config    # Get bot configuration
PUT    /api/v1/settings/bot-config    # Update bot configuration
GET    /actuator/health           # Spring Boot health check
```

Full API docs:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI: http://localhost:8080/v3/api-docs

### Next.js (Port 3000)
```
GET    /                          # Dashboard
GET    /login                     # Login page
GET    /leads                     # Leads list
GET    /leads/[id]                # Lead details
GET    /properties                # Property inventory
GET    /projects                  # Project list
GET    /visits                    # Site visit calendar
GET    /analytics                 # NLQ analytics
GET    /settings                  # Bot configuration
```

---

## 🔐 Security

### Implemented
✓ **No hardcoded secrets** — All in `.env` (git-ignored)  
✓ **JWT authentication** — RS256 (RS512 in prod)  
✓ **HTTPS in production** — nginx with SSL termination  
✓ **Multi-tenant isolation** — Every table has `tenant_id` filter  
✓ **Rate limiting** — Per-IP, per-user  
✓ **CORS configured** — Only allow frontend origin  
✓ **Non-root Docker users** — Principle of least privilege  
✓ **Health checks** — Prevent cascading failures  
✓ **Structured logging** — Full audit trail  

### To Implement Post-Launch
- [ ] API key rotation policy
- [ ] Database encryption at rest
- [ ] VPN/private networking for backends
- [ ] WAF (Web Application Firewall)
- [ ] Penetration testing
- [ ] GDPR compliance audit

---

## 📊 Monitoring & Logging

### Logs Location
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend-ai

# View logs in container
docker exec realestate_backend_ai tail -f logs/app.log
```

### Log Format
Every log line includes:
- Timestamp (ISO 8601)
- Level (INFO, WARNING, ERROR, DEBUG)
- Tenant ID
- Request ID (for tracing)
- Service name
- Message + context

### Health Checks
All services expose health endpoints:
```bash
curl http://localhost:8000/health    # FastAPI
curl http://localhost:8080/actuator/health  # Spring Boot
curl http://localhost:3000           # Next.js
```

---

## 🚀 Scaling Strategy

### Phase 1: Single Server (0–100 builders)
Current setup. All services on one Docker host.

```bash
# Scale up services vertically
# Edit docker-compose.yml and increase resource limits
```

### Phase 2: Separate Services (100–500 builders)
- FastAPI on GPU server (for Ollama)
- Spring Boot on app server
- PostgreSQL on managed database (Supabase/AWS RDS)
- Redis on managed cache (Upstash/AWS ElastiCache)

### Phase 3: Kubernetes (500+ builders)
- FastAPI pods with auto-scaling on message volume
- Spring Boot pods with auto-scaling on API load
- Ollama on GPU node pool
- PostgreSQL with primary + read replicas
- Redis Cluster

---

## 🧪 Testing

### Run All Tests
```bash
make test
```

### FastAPI Tests
```bash
docker-compose exec backend-ai pytest tests/ -v
docker-compose exec backend-ai pytest tests/test_orchestrator.py -v  # Specific test
```

### Spring Boot Tests
```bash
docker-compose exec backend-java ./mvnw test
```

### Next.js Tests
```bash
docker-compose exec frontend npm test
```

### Test Coverage
```bash
docker-compose exec backend-ai pytest --cov=app tests/
```

---

## 🔧 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs -f

# Rebuild images
docker-compose build --no-cache

# Full cleanup
make clean
make dev
```

### Database Connection Error
```bash
# Wait for PostgreSQL
docker-compose exec postgres pg_isready -U realestate

# Check environment variables
docker-compose exec backend-java env | grep DATABASE
```

### Ollama Model Not Found
```bash
# Pull model explicitly
make pull-model

# Verify
curl http://localhost:11434/api/tags
```

### Redis Cache Issues
```bash
# Flush cache
docker-compose exec redis redis-cli FLUSHALL

# Check connection
docker-compose exec redis redis-cli ping
```

### API Latency
```bash
# Check PostgreSQL slow queries
docker-compose exec postgres psql -U realestate -d realestate_db -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check Redis memory
docker-compose exec redis redis-cli info memory
```

---

## 📚 Documentation

- **[Architecture Details](docs/architecture.md)** — Detailed system design
- **[Database Schema](docs/database-schema.md)** — Tables, relationships, indexes
- **[LangGraph Orchestrator](docs/langgraph-agent.md)** — AI agent flow
- **[API Reference](docs/api-reference.md)** — Complete endpoint docs
- **[Deployment Guide](docs/deployment.md)** — Production checklist

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code style (see below)
3. Write/update tests
4. Commit: `git commit -am 'Add feature'`
5. Push: `git push origin feature/your-feature`
6. Open PR

### Code Style
- **Python**: Black + Pylint + MyPy strict mode
- **Java**: Google Java Style Guide + SonarQube
- **TypeScript**: ESLint + Prettier, strict mode (no `any`)

```bash
# Format code
docker-compose exec backend-ai black app/
docker-compose exec backend-java ./mvnw spotless:apply
docker-compose exec frontend npm run format
```

---

## 📦 Deployment

### Docker Compose (Development)
```bash
make dev
```

### Docker Compose (Production)
```bash
make prod-up
# or
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes (Future)
Helm charts will be provided for K8s deployment.

---

## 📞 Support & Contact

- **Issues**: Report bugs in GitHub Issues
- **Email**: vikram.h@leadrat.com
- **Documentation**: See `docs/` folder

---

## 📄 License

MIT License — See LICENSE file

---

## ✅ First Day Checklist

- [ ] Clone repository
- [ ] Copy `.env.example` → `.env` and fill values
- [ ] Run `make setup`
- [ ] Run `make dev` (wait for all services to be healthy)
- [ ] Run `make pull-model` (wait ~5 min for LLaMA 3.2)
- [ ] Verify: `make health` (all green)
- [ ] Open http://localhost:3000 and login
- [ ] Configure Engageto webhook
- [ ] Send test WhatsApp message
- [ ] Check logs: `make logs`
- [ ] Read `docs/architecture.md` for deeper understanding

---

**Built with ❤️ for real estate builders worldwide**  
*Version 1.0.0 · Next.js 14 · Spring Boot 3 · FastAPI · Ollama · PostgreSQL · Redis*
>>>>>>> f84d4d051a229cf41722c09203701c87da3e75d4
