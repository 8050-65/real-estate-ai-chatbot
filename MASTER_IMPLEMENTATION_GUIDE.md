# Real Estate AI Chatbot — Master Implementation Guide
> Use this entire document as your Claude prompt in VS Code (Claude Code extension)
> Project: AI-Powered WhatsApp Chatbot + CRM Dashboard for Real Estate Builders
> Stack: Next.js 14 · Spring Boot · FastAPI · LangGraph · Ollama · PostgreSQL · Redis

---

## HOW TO USE THIS DOCUMENT

1. Open VS Code
2. Install Claude Code extension
3. Open your project folder `real-estate-ai-chatbot`
4. Press `Ctrl+Shift+P` → "Claude: New Chat"
5. Paste any section below as your prompt
6. Claude will generate the code for that section

---

# PART 1 — PROJECT BOOTSTRAP PROMPT
> Paste this FIRST before anything else

```
You are a senior full-stack architect helping build a production-grade,
commercially scalable Real Estate AI Chatbot SaaS product from scratch.

## Project Overview
An AI-powered WhatsApp chatbot for real estate builders that:
- Answers customer queries 24/7 via WhatsApp (Engageto BSP)
- Fetches live property/inventory/pricing from Leadrat CRM
- Captures and qualifies leads automatically
- Books site visits and sends reminders
- Provides a builder admin dashboard with AI analytics

## Tech Stack (STRICT — do not suggest alternatives)
- Frontend:   Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- Backend:    Spring Boot 3.x (Java 17), REST APIs, JWT auth
- AI Service: FastAPI (Python 3.11), LangGraph, Ollama (LLaMA 3.2), ChromaDB
- Cache:      Redis (sessions, API TTL 5min)
- Database:   PostgreSQL 15
- WhatsApp:   Engageto Business API
- CRM:        Leadrat REST API (connect.leadrat.info/api/v1)
- Deploy:     Docker + docker-compose

## Non-Negotiable Rules
1. NEVER use OpenAI or Google Gemini — use Ollama with LLaMA 3.2 only
2. NEVER hardcode API keys — always use .env files
3. ALWAYS add .env to .gitignore before writing any code
4. All Python deps use --break-system-packages or venv
5. All code must be production-ready, not prototype quality
6. Follow SOLID principles in Spring Boot
7. Use async/await everywhere in FastAPI
8. TypeScript strict mode in Next.js — no `any` types
9. Every API must have proper error handling and logging
10. Write code that scales to 10,000 concurrent WhatsApp sessions

## Leadrat API Details
- Auth URL: https://connect.leadrat.com/api/v1/authentication/token
- Base URL: https://connect.leadrat.info/api/v1
- Tenant: black
- Key APIs: GET /property, GET /project/all, POST /lead, PUT /lead/assign

## Project Folder Structure (MAINTAIN THIS ALWAYS)
real-estate-ai-chatbot/
├── frontend/          → Next.js 14
├── backend-java/      → Spring Boot
├── backend-ai/        → FastAPI + LangGraph
├── docker-compose.yml
└── docs/

Acknowledge this context and confirm you are ready to build.
```

---

# PART 2 — REPOSITORY SETUP PROMPT

```
Using the project context already established, set up the complete
repository structure from scratch.

## Task: Initialize All 3 Services

### 1. Create root docker-compose.yml
Include these services:
- postgres (image: postgres:15, port 5432)
- redis (image: redis:7-alpine, port 6379)
- ollama (image: ollama/ollama, port 11434, volume for models)
- backend-ai (FastAPI, port 8000, depends on postgres, redis, ollama)
- backend-java (Spring Boot, port 8080, depends on postgres, redis, backend-ai)
- frontend (Next.js, port 3000, depends on backend-java)
Use named volumes. Add health checks to all services.
Add restart: unless-stopped to all.

### 2. Create .gitignore at root level
Must include:
.env, .env.local, .env.*, venv/, __pycache__/, *.pyc,
node_modules/, .next/, target/, *.jar, *.class,
*.log, .DS_Store, Thumbs.db, chroma_db/, ollama_data/

### 3. Create all .env template files (NO real values — placeholders only)

#### backend-ai/.env.example
ENGAGETO_TOKEN=your_engageto_token_here
ENGAGETO_PHONE_ID=your_phone_id_here
ENGAGETO_WEBHOOK_SECRET=your_webhook_secret
LEADRAT_API_KEY=your_leadrat_api_key
LEADRAT_SECRET_KEY=your_leadrat_secret_key
LEADRAT_TENANT=black
LEADRAT_BASE_URL=https://connect.leadrat.info/api/v1
LEADRAT_AUTH_URL=https://connect.leadrat.com/api/v1/authentication/token
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql+asyncpg://realestate:password@postgres:5432/realestate_db
SPRING_BOOT_URL=http://backend-java:8080
JWT_SECRET_KEY=your_jwt_secret_minimum_32_chars
CHROMA_DB_PATH=./chroma_db
LOG_LEVEL=INFO
ENVIRONMENT=development

#### backend-java/src/main/resources/application.properties template
spring.datasource.url=jdbc:postgresql://localhost:5432/realestate_db
spring.datasource.username=realestate
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.redis.host=localhost
spring.redis.port=6379
leadrat.base-url=https://connect.leadrat.info/api/v1
leadrat.auth-url=https://connect.leadrat.com/api/v1/authentication/token
leadrat.tenant=black
fastapi.url=http://localhost:8000
jwt.secret=your_jwt_secret
jwt.expiration=86400000
server.port=8080

#### frontend/.env.local.example
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=RealEstate AI CRM
NEXT_PUBLIC_APP_VERSION=1.0.0

### 4. Create README.md
Include: project description, architecture diagram (ASCII),
prerequisites (Docker, Java 17, Node 18, Python 3.11),
quick start steps, environment setup, and API docs links.

Generate all files now.
```

---

# PART 3 — FASTAPI AI SERVICE PROMPT

```
Build the complete FastAPI AI service (backend-ai/) for the
Real Estate WhatsApp chatbot.

## File Structure to Create
backend-ai/
├── app/
│   ├── main.py                    # FastAPI app entry, CORS, routers
│   ├── config.py                  # Settings from .env using pydantic-settings
│   ├── webhook/
│   │   ├── __init__.py
│   │   ├── router.py              # POST /webhook/whatsapp
│   │   └── models.py              # Engageto webhook payload schemas
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py        # LangGraph StateGraph definition
│   │   ├── intent_router.py       # Classify: project_search, unit_availability,
│   │   │                          #   pricing, site_visit, document_request,
│   │   │                          #   human_handoff, general
│   │   ├── response_builder.py    # Format WhatsApp reply messages
│   │   └── handoff_detector.py    # Detect escalation triggers
│   ├── services/
│   │   ├── __init__.py
│   │   ├── leadrat_auth.py        # Token fetch + refresh with Redis cache
│   │   ├── leadrat_leads.py       # POST /lead, PUT /lead/assign, GET /lead
│   │   ├── leadrat_property.py    # GET /property, GET /property/{id}
│   │   ├── leadrat_project.py     # GET /project/all, GET /project/{id}
│   │   ├── engageto.py            # Send WhatsApp text, media, buttons, list
│   │   └── visit_scheduler.py     # Create visit, ICS generation, reminders
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── indexer.py             # Load project docs into ChromaDB
│   │   └── retriever.py           # Semantic search for property queries
│   ├── cache/
│   │   ├── __init__.py
│   │   └── redis_client.py        # Redis wrapper, session management, TTL cache
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py            # Async SQLAlchemy engine
│   │   ├── models.py              # ConversationLog, LeadSession tables
│   │   └── crud.py                # DB operations
│   └── utils/
│       ├── __init__.py
│       ├── logger.py              # Structured logging setup
│       └── exceptions.py          # Custom exception handlers
├── requirements.txt
├── Dockerfile
└── .env.example

## Key Implementation Details

### orchestrator.py — LangGraph Flow
States: START → classify_intent → route_to_handler → call_leadrat_api
        → build_response → send_whatsapp → log_conversation → END

Nodes:
- classify_intent: Use Ollama LLaMA 3.2 to classify message intent
- fetch_session: Get/create Redis session for this WhatsApp number
- fetch_property_data: Call Leadrat with 5-min TTL cache
- fetch_lead_data: Check if lead exists in Leadrat
- rag_search: ChromaDB semantic search for project info
- build_response: Format appropriate WhatsApp message
- create_or_update_lead: Write to Leadrat CRM
- handoff_check: Check if human handoff needed
- send_reply: Call Engageto send message API

### leadrat_auth.py — Token Management
- Fetch token from Leadrat auth endpoint
- Cache in Redis with TTL = token expiry - 60 seconds
- Auto-refresh before expiry
- Thread-safe token refresh

### Intent Categories (from PRD)
project_discovery, unit_availability, pricing_inquiry,
payment_plan, amenities, rera_legal, site_visit_booking,
document_request, offer_inquiry, status_followup,
human_handoff, out_of_scope

### Redis Session Structure
Key: session:{whatsapp_number}
Value: {
  lead_id, name, phone, current_intent,
  project_interest, bhk_preference, budget_range,
  conversation_history: [...last 10 messages],
  visit_booking_state: {},
  created_at, last_active
}
TTL: 86400 (24 hours — WhatsApp session window)

### requirements.txt
fastapi==0.111.0
uvicorn[standard]==0.30.0
pydantic==2.7.0
pydantic-settings==2.3.0
langchain==0.2.0
langchain-ollama==0.1.0
langgraph==0.1.0
chromadb==0.5.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.0
redis[asyncio]==5.0.4
httpx==0.27.0
python-dotenv==1.0.1
structlog==24.2.0
celery==5.4.0

Build all files with full production-ready code.
Include docstrings on every function.
Add proper error handling with specific exception types.
Log every Leadrat API call with response time.
```

---

# PART 4 — SPRING BOOT BACKEND PROMPT

```
Build the complete Spring Boot 3.x (Java 17) backend service
(backend-java/) for the Real Estate CRM dashboard.

## Maven Dependencies (pom.xml)
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-data-redis
spring-boot-starter-validation
spring-boot-starter-actuator
postgresql driver
jjwt (JWT tokens) 0.12.x
lombok
mapstruct
springdoc-openapi-ui (Swagger)
flyway-core (DB migrations)

## Package Structure
com.realestate.crm/
├── config/
│   ├── SecurityConfig.java        # JWT filter chain, CORS
│   ├── RedisConfig.java           # Redis template config
│   └── OpenApiConfig.java         # Swagger configuration
├── auth/
│   ├── AuthController.java        # POST /api/auth/login, /refresh, /logout
│   ├── AuthService.java
│   ├── JwtTokenProvider.java      # Generate/validate JWT
│   └── JwtAuthFilter.java         # Request filter
├── user/
│   ├── UserController.java        # GET/PUT /api/users
│   ├── UserService.java
│   ├── UserRepository.java
│   └── User.java                  # Entity: id, email, role, tenantId
├── lead/
│   ├── LeadController.java        # GET /api/leads, GET /api/leads/{id}
│   ├── LeadService.java           # Calls Leadrat API + caches in Redis
│   ├── LeadratClient.java         # RestTemplate/WebClient for Leadrat
│   └── dto/LeadDto.java
├── property/
│   ├── PropertyController.java    # GET /api/properties
│   ├── PropertyService.java
│   └── dto/PropertyDto.java
├── project/
│   ├── ProjectController.java     # GET /api/projects
│   ├── ProjectService.java
│   └── dto/ProjectDto.java
├── analytics/
│   ├── AnalyticsController.java   # POST /api/analytics/query (NLQ)
│   ├── AnalyticsService.java      # Calls FastAPI AI service
│   └── dto/AnalyticsQueryDto.java
├── visit/
│   ├── VisitController.java       # GET/POST /api/visits
│   ├── VisitService.java
│   └── dto/VisitDto.java
├── webhook/
│   └── FastApiEventController.java # POST /api/internal/lead-created
│                                    # Called by FastAPI on new lead
├── common/
│   ├── ApiResponse.java           # Standard response wrapper
│   ├── GlobalExceptionHandler.java
│   ├── PageResponse.java          # Paginated response wrapper
│   └── TenantContext.java         # Multi-tenant support
└── db/migration/                  # Flyway SQL migrations
    ├── V1__create_users.sql
    ├── V2__create_conversations.sql
    └── V3__create_visits.sql

## Key Rules
- All controllers return ApiResponse<T> wrapper
- All Leadrat data cached in Redis with 5-min TTL
- Role-based access: ADMIN, SALES_MANAGER, RM, MARKETING
- Multi-tenant: every query filters by tenantId
- Flyway manages all DB schema changes
- Swagger docs at /swagger-ui.html
- Actuator health at /actuator/health
- All passwords BCrypt encoded
- Refresh token stored in Redis

## Database Tables (Flyway migrations)
users: id, email, password_hash, role, tenant_id, created_at
conversation_logs: id, whatsapp_number, lead_id, message, role, timestamp
visits: id, lead_id, scheduled_at, status, notes, rm_id, tenant_id
bot_configs: id, tenant_id, persona_name, greeting, active_hours, language

Build all files with full production code.
Add Javadoc comments.
Use Lombok @Slf4j for logging everywhere.
```

---

# PART 5 — NEXT.JS FRONTEND PROMPT

```
Build the complete Next.js 14 (TypeScript) CRM dashboard frontend
(frontend/) for Real Estate builders.

## App Router Structure
frontend/
├── app/
│   ├── layout.tsx                  # Root layout, sidebar, nav
│   ├── page.tsx                    # Redirect to /dashboard
│   ├── (auth)/
│   │   └── login/page.tsx          # Login form → Spring Boot JWT
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar layout
│   │   ├── dashboard/page.tsx      # KPI cards + recent activity
│   │   ├── leads/
│   │   │   ├── page.tsx            # Lead list table with filters
│   │   │   └── [id]/page.tsx       # Lead detail + conversation history
│   │   ├── properties/page.tsx     # Property inventory grid
│   │   ├── projects/page.tsx       # Project list
│   │   ├── visits/page.tsx         # Site visit calendar
│   │   ├── analytics/page.tsx      # NLQ interface + charts
│   │   └── settings/page.tsx       # Bot configuration
│   └── api/
│       └── auth/[...nextauth]/     # NextAuth.js handlers
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   └── BreadCrumb.tsx
│   ├── leads/
│   │   ├── LeadTable.tsx           # Tanstack Table with sorting/filter
│   │   ├── LeadCard.tsx
│   │   └── LeadStatusBadge.tsx
│   ├── analytics/
│   │   ├── NLQInput.tsx            # Natural language query box
│   │   ├── ChartRenderer.tsx       # Dynamic bar/line/pie/funnel
│   │   ├── KPICard.tsx             # Single metric card
│   │   └── InsightCard.tsx         # Proactive AI insight cards
│   ├── visits/
│   │   └── VisitCalendar.tsx       # Calendar with visit slots
│   └── common/
│       ├── DataTable.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ExportButton.tsx        # Export to Excel/PDF
├── lib/
│   ├── api.ts                      # Axios instance with JWT interceptor
│   ├── auth.ts                     # NextAuth configuration
│   └── utils.ts                    # cn(), formatCurrency(), formatDate()
├── hooks/
│   ├── useLeads.ts                 # TanStack Query hooks
│   ├── useProperties.ts
│   ├── useAnalytics.ts
│   └── useVisits.ts
├── types/
│   ├── lead.ts
│   ├── property.ts
│   ├── analytics.ts
│   └── api.ts                      # ApiResponse<T> type
└── package.json

## Key npm Packages
next@14, react@18, typescript
@tanstack/react-query       # server state
@tanstack/react-table       # data tables
recharts                    # charts
next-auth                   # authentication
axios                       # HTTP client
shadcn/ui + radix-ui        # components
tailwindcss                 # styling
lucide-react                # icons
date-fns                    # date formatting
xlsx                        # Excel export
react-hook-form + zod       # forms + validation
react-hot-toast             # notifications

## Dashboard Page Requirements
KPI Cards row:
- Total Leads Today
- Site Visits Scheduled
- Hot Leads (from Leadrat)
- Conversion Rate

Charts:
- Lead source bar chart (last 30 days)
- Lead funnel (New → Visit → Booking)
- Project-wise inventory donut chart

## Analytics Page (Feature 2 from PRD)
- Large NLQ text input: "Ask anything about your data..."
- Submit → POST /api/analytics/query → Spring Boot → FastAPI AI
- Response renders as: table OR bar chart OR KPI card OR funnel
- "Show as chart / Show as table" toggle
- Export to Excel button
- Save as Named Report button
- Proactive Insight cards refreshed daily

## Authentication Flow
1. Login page → POST /api/auth/login (Spring Boot)
2. Receive JWT + refresh token
3. Store in httpOnly cookie via NextAuth
4. All API calls include Bearer token
5. Auto-refresh on 401 response

## Role-Based UI
ADMIN:        All sections visible
SALES_MANAGER: Leads, Visits, Analytics (team view)
RM:           Only their leads and visits
MARKETING:    Analytics + Campaign data only

Build all files with full TypeScript, no any types.
Use TanStack Query for all data fetching.
Add loading skeletons to every data component.
Add error states with retry buttons.
Make it mobile responsive.
```

---

# PART 6 — DATABASE SCHEMA PROMPT

```
Create the complete PostgreSQL database schema for the
Real Estate AI Chatbot project using Flyway migrations.

## Location: backend-java/src/main/resources/db/migration/

### V1__create_core_tables.sql
Create these tables with proper indexes and constraints:

tenants (id UUID PK, name, plan, created_at, is_active)

users (
  id UUID PK, tenant_id FK tenants,
  email UNIQUE, password_hash, full_name,
  role ENUM('ADMIN','SALES_MANAGER','RM','MARKETING'),
  whatsapp_number, is_active, created_at, updated_at
)

bot_configs (
  id UUID PK, tenant_id FK,
  persona_name, greeting_message, tone ENUM('formal','friendly'),
  active_hours_start TIME, active_hours_end TIME,
  after_hours_message TEXT, language VARCHAR(10),
  is_active BOOLEAN, created_at, updated_at
)

### V2__create_conversation_tables.sql

whatsapp_sessions (
  id UUID PK, whatsapp_number VARCHAR(20),
  lead_id VARCHAR(100), tenant_id FK,
  session_data JSONB, last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

conversation_logs (
  id UUID PK, session_id FK,
  whatsapp_number VARCHAR(20), tenant_id FK,
  message TEXT, role ENUM('user','bot','rm'),
  intent VARCHAR(50), confidence DECIMAL(4,3),
  media_shared JSONB, created_at TIMESTAMPTZ
)

### V3__create_visit_tables.sql

site_visits (
  id UUID PK, lead_id VARCHAR(100),
  tenant_id FK, project_id VARCHAR(100),
  rm_id FK users, customer_name VARCHAR(200),
  whatsapp_number VARCHAR(20),
  scheduled_at TIMESTAMPTZ, duration_minutes INT DEFAULT 60,
  status ENUM('scheduled','confirmed','completed','cancelled','no_show'),
  visitor_count INT DEFAULT 1, notes TEXT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)

### V4__create_analytics_tables.sql

saved_reports (
  id UUID PK, tenant_id FK, user_id FK,
  name VARCHAR(200), query_text TEXT,
  chart_type VARCHAR(50), filters JSONB,
  is_pinned BOOLEAN DEFAULT FALSE,
  schedule ENUM('none','daily','weekly','monthly') DEFAULT 'none',
  schedule_recipients JSONB, created_at TIMESTAMPTZ
)

ai_query_logs (
  id UUID PK, tenant_id FK, user_id FK,
  query_text TEXT, interpreted_query TEXT,
  result_summary TEXT, execution_ms INT,
  created_at TIMESTAMPTZ
)

Add indexes on:
- conversation_logs(whatsapp_number, created_at)
- conversation_logs(tenant_id, created_at)
- site_visits(tenant_id, scheduled_at)
- site_visits(lead_id)
- site_visits(status) WHERE status IN ('scheduled','confirmed')

Generate all SQL with proper CASCADE rules and indexes.
```

---

# PART 7 — LANGGRAPH AGENT DEEP PROMPT

```
Build the complete LangGraph AI agent orchestrator for the
WhatsApp real estate chatbot.

## File: backend-ai/app/agents/orchestrator.py

### Agent State Schema
class ChatbotState(TypedDict):
  whatsapp_number: str
  tenant_id: str
  incoming_message: str
  message_type: str          # text, image, audio, button_reply
  session: dict              # Redis session data
  intent: str                # classified intent
  confidence: float
  extracted_entities: dict   # budget, bhk, location, project_name etc.
  leadrat_token: str
  property_results: list
  project_results: list
  lead_data: dict
  rag_context: str
  response_text: str
  response_type: str         # text, list, buttons, media
  quick_replies: list
  media_to_send: dict
  should_handoff: bool
  handoff_reason: str
  conversation_summary: str
  error: str | None

### LangGraph Nodes to Implement

1. load_session_node
   - GET session from Redis by whatsapp_number
   - If no session: create new session, auto-create lead in Leadrat
   - Append incoming message to conversation_history

2. classify_intent_node
   - Use Ollama LLaMA 3.2 with this system prompt:
     "You are an intent classifier for a real estate WhatsApp chatbot.
      Classify the user message into exactly one intent from this list:
      project_discovery, unit_availability, pricing_inquiry,
      payment_plan, amenities_query, rera_legal, site_visit_booking,
      document_request, offer_inquiry, status_followup,
      human_handoff_request, greeting, out_of_scope
      Also extract entities: location, bhk_type, budget_min, budget_max,
      project_name, visit_date, visitor_count
      Respond in JSON only."
   - Parse JSON response, set state.intent and state.extracted_entities

3. fetch_property_data_node (conditional — only for property intents)
   - Check Redis cache first (key: properties:{tenant}:{query_hash})
   - If cache miss: GET /property from Leadrat with extracted filters
   - Cache result for 5 minutes
   - Never return Sold or Blocked units

4. fetch_project_data_node (conditional)
   - Check Redis cache (key: projects:{tenant})
   - If cache miss: GET /project/all from Leadrat
   - Cache for 5 minutes

5. rag_search_node (for amenities, RERA, general project info)
   - Embed query with Ollama embeddings
   - Search ChromaDB for relevant project documents
   - Return top 3 chunks as context

6. visit_booking_node (for site_visit_booking intent)
   - Check session.visit_booking_state for current step
   - Steps: collect_date → collect_time → collect_name → confirm → create
   - On confirm: POST visit to Spring Boot API
   - Generate ICS file, send WhatsApp confirmation

7. lead_capture_node
   - Extract name, phone from conversation if not in session
   - If lead_id not in session: POST /lead to Leadrat
   - If lead exists: PUT to update fields
   - Update session with lead_id

8. build_response_node
   - Based on intent + data, build WhatsApp-formatted response
   - Use quick replies for Yes/No questions
   - Use list messages for property options (max 10)
   - Use buttons for CTAs (Book Visit, Talk to RM)
   - Keep responses under 1000 chars for WhatsApp

9. handoff_detection_node
   - Check for: explicit request, frustration keywords,
     confidence < 0.6, hot lead flag from Leadrat
   - If handoff: notify RM via Spring Boot API
   - Send customer: "Connecting you to [RM Name], expected reply: 2hrs"

10. save_session_node
    - Update Redis session with new conversation turn
    - Save conversation log to PostgreSQL via Spring Boot

11. send_whatsapp_node
    - Call Engageto API to send response
    - Handle media sending (brochures, images)
    - Log delivery status

### Conditional Edges
classify_intent → {
  "project_discovery": fetch_project_data,
  "unit_availability": fetch_property_data,
  "pricing_inquiry": fetch_property_data,
  "amenities_query": rag_search,
  "site_visit_booking": visit_booking,
  "human_handoff_request": handoff_detection,
  "greeting": build_response,
  "out_of_scope": build_response
}

Build the complete orchestrator.py with all nodes,
edges, and StateGraph compilation.
Use async functions throughout.
Add retry logic (max 3 attempts) for Leadrat API calls.
Add circuit breaker pattern for Ollama calls.
```

---

# PART 8 — DOCKER & DEPLOYMENT PROMPT

```
Create production-ready Docker configuration for the
Real Estate AI Chatbot project.

## Files to Create

### docker-compose.yml (development)
Services with proper networking, volumes, health checks:
- postgres:15 with init script to create database
- redis:7-alpine with persistence (AOF)
- ollama/ollama with GPU support (optional) and model auto-pull
- backend-ai (FastAPI) — Dockerfile in backend-ai/
- backend-java (Spring Boot) — Dockerfile in backend-java/
- frontend (Next.js) — Dockerfile in frontend/
All on network: realestate-network

### docker-compose.prod.yml
Override for production:
- Remove port exposures (only nginx proxy)
- Add nginx reverse proxy service
- nginx routes:
  / → frontend:3000
  /api/ → backend-java:8080
  /ai/ → backend-ai:8000
- Add SSL termination config placeholder

### backend-ai/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
HEALTHCHECK CMD curl -f http://localhost:8000/health
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

### backend-java/Dockerfile
Multi-stage:
Stage 1 (build): FROM maven:3.9-eclipse-temurin-17 — mvn package
Stage 2 (run): FROM eclipse-temurin:17-jre-jammy
COPY --from=build target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK CMD curl -f http://localhost:8080/actuator/health
ENTRYPOINT ["java", "-jar", "/app.jar"]

### frontend/Dockerfile
Multi-stage:
Stage 1 (deps): FROM node:18-alpine — npm ci
Stage 2 (build): npm run build
Stage 3 (run): FROM node:18-alpine — standalone output
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/api/health

### Makefile at root
Commands:
make dev        → docker-compose up --build
make down       → docker-compose down
make logs       → docker-compose logs -f
make pull-model → docker exec ollama ollama pull llama3.2
make migrate    → run Flyway migrations
make test       → run all tests
make prod       → docker-compose -f docker-compose.prod.yml up -d

Generate all files with production-grade configuration.
```

---

# PART 9 — SCALABILITY & COMMERCIAL RULES
> READ THIS — these rules must be followed from day 1

## Architecture Rules for Scale

```
RULE 1 — Multi-Tenancy from Day 1
Every database table has tenant_id.
Every API call filters by tenant_id.
Every Redis key is prefixed: {tenant_id}:{key}
Never mix data between builders/tenants.

RULE 2 — Stateless Services
FastAPI and Spring Boot must be stateless.
All state lives in Redis or PostgreSQL.
Any instance can handle any request.
This allows horizontal scaling later.

RULE 3 — Cache Everything External
All Leadrat API calls cached in Redis — 5 min TTL.
Leadrat auth token cached — refresh 60s before expiry.
Never call Leadrat twice for same data in same session.

RULE 4 — Async Everything in Python
Use async/await for ALL I/O in FastAPI.
Use asyncpg for PostgreSQL, aioredis for Redis.
Never use blocking calls inside async functions.

RULE 5 — Circuit Breaker for LLM Calls
If Ollama fails 3 times → fallback to rule-based responses.
Never let LLM failure crash the WhatsApp response.
Always send SOMETHING to the customer.

RULE 6 — Database Migrations Only via Flyway
Never modify schema directly in production.
All changes as versioned V{n}__ SQL files.
Rollback scripts for every migration.

RULE 7 — Environment-Based Config
NEVER hardcode URLs, ports, credentials.
All config via environment variables.
Different .env for dev, staging, production.

RULE 8 — Structured Logging Everywhere
Every log line has: timestamp, level, tenant_id,
request_id, service, message, duration_ms.
Use structlog in Python, @Slf4j in Java.
Log every Leadrat API call with response time.

RULE 9 — API Versioning from Day 1
All Spring Boot APIs: /api/v1/...
When breaking changes: /api/v2/...
Never remove v1 without deprecation notice.

RULE 10 — Health Checks on Every Service
GET /health → returns {status, version, dependencies}
Check: DB connection, Redis connection, Ollama ping.
Used by Docker, load balancer, monitoring.
```

## Scaling Path (After Launch)

```
Phase 1 — Single Server (0–100 builders)
All services on one Docker host.
Vertical scale as needed.
Cost: ~$50/month (DigitalOcean/Hetzner)

Phase 2 — Separate Services (100–500 builders)
FastAPI on GPU server for Ollama
Spring Boot on app server
PostgreSQL on managed DB (Supabase/RDS)
Redis on managed cache (Upstash/ElastiCache)
Cost: ~$200/month

Phase 3 — Kubernetes (500+ builders)
FastAPI pods: auto-scale on message volume
Spring Boot pods: auto-scale on API load
Ollama on GPU node pool
PostgreSQL: primary + read replicas
Redis: Redis Cluster
Cost: ~$1000/month (fully managed)
```

---

# PART 10 — TESTING PROMPT

```
Write complete tests for the Real Estate AI Chatbot.

## FastAPI Tests (backend-ai/tests/)

### test_webhook.py
- Test valid Engageto webhook payload accepted
- Test invalid signature rejected (401)
- Test duplicate message ignored (idempotency)

### test_intent_classifier.py
- Test all 12 intent categories with sample messages
- Test entity extraction (budget, BHK, location)
- Test confidence score returned

### test_leadrat_service.py
- Mock Leadrat API responses
- Test token refresh on expiry
- Test property search with filters
- Test lead creation and deduplication
- Test Redis cache hit/miss behavior

### test_orchestrator.py
- Test full flow: message → intent → data → response
- Test site visit booking multi-step flow
- Test human handoff trigger
- Test fallback on Ollama failure

## Spring Boot Tests (backend-java/src/test/)

### LeadControllerTest.java
- Test GET /api/v1/leads with JWT auth
- Test role-based access (RM sees only their leads)
- Test pagination and filtering

### AnalyticsControllerTest.java
- Test POST /api/v1/analytics/query
- Test response format (table vs chart)

## Next.js Tests (frontend/__tests__/)

### LeadTable.test.tsx
- Render with mock data
- Test sorting and filtering
- Test pagination

Use pytest for Python, JUnit 5 + Mockito for Java,
Jest + React Testing Library for Next.js.
Write tests that actually run, not pseudocode.
```

---

# QUICK REFERENCE — API ENDPOINTS

## FastAPI (Port 8000)
```
POST /webhook/whatsapp          ← Engageto sends messages here
GET  /health                    ← Health check
POST /rag/index                 ← Index project documents
GET  /rag/search?q=query        ← Test RAG search
POST /ai/test-intent            ← Test intent classification
```

## Spring Boot (Port 8080)
```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/leads
GET  /api/v1/leads/{id}
GET  /api/v1/properties
GET  /api/v1/projects
GET  /api/v1/visits
POST /api/v1/visits
POST /api/v1/analytics/query
GET  /api/v1/settings/bot-config
PUT  /api/v1/settings/bot-config
GET  /actuator/health
```

## Next.js API Routes (Port 3000)
```
POST /api/auth/[...nextauth]    ← NextAuth handlers
GET  /api/health
```

---

# FIRST DAY CHECKLIST

```
□ 1. git clone your repo, cd into it
□ 2. Copy all .env.example → .env files, fill real values
□ 3. Run: docker-compose up postgres redis -d
□ 4. Run: docker-compose up ollama -d
□ 5. Run: docker exec -it ollama ollama pull llama3.2
□ 6. cd backend-ai && pip install -r requirements.txt
□ 7. Run: uvicorn app.main:app --reload --port 8000
□ 8. Test: curl http://localhost:8000/health
□ 9. cd backend-java && ./mvnw spring-boot:run
□ 10. Test: curl http://localhost:8080/actuator/health
□ 11. cd frontend && npm install && npm run dev
□ 12. Open http://localhost:3000
□ 13. Configure Engageto webhook → http://your-ip:8000/webhook/whatsapp
□ 14. Send test WhatsApp message
□ 15. Check logs: docker-compose logs -f backend-ai
```

---

*Document Version: 1.0 | Stack: Next.js 14 · Spring Boot 3 · FastAPI · LangGraph · Ollama · PostgreSQL · Redis*
*Generated for: real-estate-ai-chatbot | Tenant: black | CRM: Leadrat*
