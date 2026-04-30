# Phase 3: Local Database-First Architecture
## Implementation & Design Plan

**Status:** DESIGN PHASE (No Code Yet)  
**Date:** 2026-04-27  
**Predecessor:** Phase 2 (Leadrat Integration) ✓

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema Design](#2-database-schema-design)
3. [Data Sync Strategy](#3-data-sync-strategy)
4. [Background Job Strategy](#4-background-job-strategy)
5. [Caching Strategy](#5-caching-strategy)
6. [Search & Indexing Strategy](#6-search--indexing-strategy)
7. [Entity Extraction Flow](#7-entity-extraction-flow)
8. [RAG Architecture](#8-rag-architecture)
9. [Conversation Memory & Session](#9-conversation-memory--session)
10. [Local Search API Contracts](#10-local-search-api-contracts)
11. [Floating Chatbot Component](#11-floating-chatbot-component)
12. [Error Handling & Retry Strategy](#12-error-handling--retry-strategy)
13. [Performance Considerations](#13-performance-considerations)
14. [Security Considerations](#14-security-considerations)
15. [Migration Strategy](#15-migration-strategy)

---

## 1. ARCHITECTURE OVERVIEW

### Current State (Phase 2)
```
User Message
    ↓
FastAPI Chat Router
    ↓
Intent Detection (Keyword Matching)
    ↓
Direct Leadrat API Call (Every Time!)
    ↓
Response Formatting
    ↓
Return to Frontend
```

**Problems:**
- Every message triggers Leadrat API call (slow, costly)
- No local search capability
- No smart filtering
- No conversation memory
- Limited to simple intent matching

---

### Target State (Phase 3)

```
┌─────────────────────────────────────────────────────────────────┐
│                      PHASE 3 ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤

                         USER INTERFACE
                              ↓
        ┌────────────────────────────────────────┐
        │   Floating Chatbot Widget (All Pages)  │
        │   + Full AI Assistant Page              │
        └────────────────────────────────────────┘
                              ↓
                      FRONTEND (Next.js)
                              ↓
        ┌────────────────────────────────────────┐
        │  Chat Message + Conversation Context   │
        │  Session ID + User Context              │
        └────────────────────────────────────────┘
                              ↓
                    BACKEND (FastAPI)
                              ↓
        ┌────────────────────────────────────────┐
        │    Entity Extraction Layer              │
        │  (Ollama NER + Intent Detection)       │
        │  Extract: intent, filters, context     │
        └────────────────────────────────────────┘
                              ↓
        ┌────────────────────────────────────────┐
        │    Smart Query Builder                  │
        │  Converts: "hot leads in Whitefield"   │
        │  To: {status: 'hot', location: '...'}  │
        └────────────────────────────────────────┘
                              ↓
        ┌────────────────────────────────────────┐
        │    Local Search APIs                    │
        │  Query chatbot_crm DB (Fast!)          │
        │  + Redis Cache (Instant!)              │
        └────────────────────────────────────────┘
                              ↓
        ┌────────────────────────────────────────┐
        │    chatbot_crm Database (PostgreSQL)   │
        │  - leads                                │
        │  - properties                           │
        │  - projects                             │
        │  - conversations                        │
        │  - user_sessions                        │
        │  - search_filters                       │
        └────────────────────────────────────────┘
                              ↓
        ┌────────────────────────────────────────┐
        │    Data Sync Service                    │
        │  Syncs: Leadrat → chatbot_crm DB       │
        │  Triggers: Hourly + On-Demand          │
        │  Updates: leads, properties, projects   │
        └────────────────────────────────────────┘
                              ↓
        ┌────────────────────────────────────────┐
        │    Leadrat APIs (Sync Source/Fallback) │
        │  Used only for:                         │
        │  - Initial data sync                    │
        │  - Missing record lookup               │
        │  - Fallback when local DB stale        │
        └────────────────────────────────────────┘

                    Redis Cache Layer
                   (User Sessions, Query Results,
                    Entity Cache, TTL: 5-60min)

                    Conversation Memory
                   (Last 10 messages + Summary)
```

### Request Flow Example

**User Input:** "show hot leads in Whitefield with budget under 50L"

```
1. Message arrives with conversation_history
   ↓
2. Entity Extraction (Ollama)
   Extracts: {
     intent: "lead_search",
     filters: {
       status: "hot",
       location: "Whitefield",
       budget_max: 50000000
     },
     confidence: 0.95
   }
   ↓
3. Cache Check (Redis)
   Key: hash("lead_search:hot:whitefield:50L")
   → Hit? Return cached results
   → Miss? Continue to step 4
   ↓
4. Local DB Search (chatbot_crm.leads)
   WHERE status = 'hot'
   AND location ILIKE 'whitefield'
   AND budget <= 50000000
   ORDER BY updated_at DESC
   LIMIT 10
   ↓
5. Results Found? (Example: 3 leads)
   ↓
6. Format Response with Rich Cards
   {
     message: "Found 3 hot leads in Whitefield under 50L",
     intent: "lead_search",
     filters_used: {...},
     cards: [
       { lead_name, phone, status, budget, ... },
       ...
     ],
     suggestions: [
       "Show in different budget range",
       "Expand to nearby areas",
       "Filter by possession date"
     ]
   }
   ↓
7. Cache Results (Redis, TTL: 30min)
   ↓
8. Save to conversation_memory
   ↓
9. Return to Frontend with Rich UI
```

---

## 2. DATABASE SCHEMA DESIGN

### Core Tables in chatbot_crm

#### Table: `leads`
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Leadrat source
  leadrat_id VARCHAR(255) UNIQUE NOT NULL,
  leadrat_last_sync TIMESTAMP,
  
  -- Lead details
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) UNIQUE,
  alternate_phone VARCHAR(20),
  
  -- Lead classification
  status VARCHAR(50),  -- new, hot, dropped, converted, meeting_scheduled
  source VARCHAR(100),  -- website, referral, cold_call, advertisement
  assigned_to UUID REFERENCES users(id),
  
  -- Budget & preferences
  min_budget BIGINT,  -- in currency units (e.g., INR)
  max_budget BIGINT,
  preferred_locations TEXT[],  -- Array of location names
  
  -- Property preferences
  bhk_preference VARCHAR(50)[],  -- Array: ["1BHK", "2BHK", "3BHK"]
  property_type VARCHAR(100)[],  -- Array: ["apartment", "villa", "plot"]
  possession_type VARCHAR(100),  -- "ready_to_move", "under_construction", etc.
  
  -- Timeline
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  contacted_date TIMESTAMP,
  follow_up_date TIMESTAMP,
  
  -- Engagement
  last_contacted TIMESTAMP,
  contact_count INT DEFAULT 0,
  conversion_probability FLOAT,  -- ML score 0-1
  
  -- Notes & history
  notes TEXT,
  tags VARCHAR(100)[],
  
  -- Tracking
  leadrat_synced BOOLEAN DEFAULT FALSE,
  sync_errors TEXT,
  
  -- Indexes
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_phone (phone),
  INDEX idx_location (preferred_locations),
  INDEX idx_budget (min_budget, max_budget),
  INDEX idx_assigned (assigned_to),
  INDEX idx_leadrat_id (leadrat_id),
  INDEX idx_created_at (created_at DESC)
);
```

#### Table: `properties`
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Leadrat source
  leadrat_id VARCHAR(255) UNIQUE NOT NULL,
  leadrat_last_sync TIMESTAMP,
  leadrat_project_id VARCHAR(255),
  
  -- Property details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Address & location
  address JSONB,  -- {street, city, locality, district, state, postal_code, lat, long}
  city VARCHAR(100),
  locality VARCHAR(100),
  latitude FLOAT,
  longitude FLOAT,
  
  -- Property type & specs
  property_type VARCHAR(100),  -- apartment, villa, plot, duplex
  bhk_type VARCHAR(50),  -- 1BHK, 2BHK, 3BHK, etc.
  facing VARCHAR(100),  -- north, south, east, west
  furnish_status VARCHAR(100),  -- furnished, semi-furnished, unfurnished
  
  -- Dimensions
  carpet_area FLOAT,
  carpet_area_unit VARCHAR(20),  -- sqft, sqm
  built_up_area FLOAT,
  saleable_area FLOAT,
  
  -- Commercial details
  price BIGINT,  -- in currency units
  price_per_sqft FLOAT,
  
  -- Possession
  possession_type VARCHAR(100),  -- ready_to_move, under_construction
  possession_date DATE,
  possession_year INT,
  
  -- Project link
  project_id UUID REFERENCES projects(id),
  
  -- Availability & status
  status VARCHAR(100),  -- available, sold, under_negotiation
  is_available BOOLEAN DEFAULT TRUE,
  available_from DATE,
  
  -- Amenities & features
  amenities JSONB,  -- Array of amenity names
  features JSONB,  -- Additional features
  
  -- Media
  image_urls TEXT[],
  video_urls TEXT[],
  virtual_tour_url VARCHAR(500),
  
  -- Timeline
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Engagement
  view_count INT DEFAULT 0,
  inquiry_count INT DEFAULT 0,
  last_viewed TIMESTAMP,
  
  -- Tracking
  leadrat_synced BOOLEAN DEFAULT FALSE,
  sync_errors TEXT,
  
  -- Indexes
  INDEX idx_tenant_city (tenant_id, city),
  INDEX idx_bhk (bhk_type),
  INDEX idx_price (price),
  INDEX idx_status (status),
  INDEX idx_project_id (project_id),
  INDEX idx_leadrat_id (leadrat_id),
  INDEX idx_updated_at (updated_at DESC)
);
```

#### Table: `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Leadrat source
  leadrat_id VARCHAR(255) UNIQUE NOT NULL,
  leadrat_last_sync TIMESTAMP,
  
  -- Project details
  name VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Location
  address JSONB,  -- {street, city, locality, state, postal_code}
  city VARCHAR(100),
  locality VARCHAR(100),
  latitude FLOAT,
  longitude FLOAT,
  
  -- Project type
  project_type VARCHAR(100),  -- residential, commercial, mixed-use
  sub_type VARCHAR(100),  -- apartment, villa, plot
  
  -- Details
  developer_name VARCHAR(255),
  developer_id VARCHAR(255),
  total_units INT,
  units_available INT,
  
  -- Specifications
  min_area FLOAT,
  max_area FLOAT,
  area_unit VARCHAR(20),
  
  bhk_types VARCHAR(100)[],  -- Array: ["1BHK", "2BHK", "3BHK"]
  amenities JSONB,
  
  -- Pricing
  min_price BIGINT,
  max_price BIGINT,
  avg_price_per_sqft FLOAT,
  
  -- Possession & timeline
  possession_type VARCHAR(100),  -- ready, under_construction
  min_possession_year INT,
  max_possession_year INT,
  launch_date DATE,
  completion_date DATE,
  
  -- Legal & regulatory
  rera_id VARCHAR(100),
  rera_status VARCHAR(100),  -- approved, pending, rejected
  
  -- Status
  status VARCHAR(100),  -- active, completed, upcoming, stalled
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timeline
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Engagement
  inquiry_count INT DEFAULT 0,
  
  -- Tracking
  leadrat_synced BOOLEAN DEFAULT FALSE,
  sync_errors TEXT,
  
  -- Indexes
  INDEX idx_tenant_city (tenant_id, city),
  INDEX idx_status (status),
  INDEX idx_rera (rera_id),
  INDEX idx_leadrat_id (leadrat_id),
  INDEX idx_updated_at (updated_at DESC)
);
```

#### Table: `conversations`
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  session_id UUID UNIQUE NOT NULL REFERENCES user_sessions(id),
  
  -- Message content
  role VARCHAR(20) NOT NULL,  -- user, assistant
  message_text TEXT NOT NULL,
  
  -- AI processing
  intent VARCHAR(100),
  extracted_entities JSONB,  -- {location, budget, bhk, status, etc.}
  
  -- Response
  response_text TEXT,
  response_source VARCHAR(100),  -- leadrat_api, local_db, llm
  response_data JSONB,  -- Results from search
  
  -- Context
  conversation_index INT,  -- Order in conversation
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  processing_time_ms INT,
  tokens_used INT,
  
  -- Indexes
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_intent (intent),
  INDEX idx_created_at (created_at DESC)
);
```

#### Table: `user_sessions`
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  
  -- Session metadata
  session_token VARCHAR(500) UNIQUE,
  whatsapp_number VARCHAR(20),
  
  -- Conversation state
  conversation_history JSONB,  -- Last 10 messages
  conversation_summary TEXT,  -- AI summary of conversation
  context_window JSONB,  -- Current filters/context
  
  -- Timeline
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Indexes
  INDEX idx_tenant_user (tenant_id, user_id),
  INDEX idx_token (session_token),
  INDEX idx_expires (expires_at),
  INDEX idx_active (is_active)
);
```

#### Table: `search_filters`
```sql
CREATE TABLE search_filters (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  session_id UUID REFERENCES user_sessions(id),
  
  -- Filter details
  filter_type VARCHAR(100),  -- lead_search, property_search, project_search
  filter_key VARCHAR(100),  -- status, location, budget, bhk
  filter_value VARCHAR(500),
  filter_unit VARCHAR(50),  -- currency, area, etc.
  
  -- Context
  created_at TIMESTAMP DEFAULT NOW(),
  used_count INT DEFAULT 1,
  
  -- Indexes
  INDEX idx_tenant_session (tenant_id, session_id),
  INDEX idx_filter_type (filter_type)
);
```

#### Table: `data_sync_log`
```sql
CREATE TABLE data_sync_log (
  id UUID PRIMARY KEY,
  
  -- Sync details
  sync_type VARCHAR(100),  -- full, incremental, on_demand
  source VARCHAR(100),  -- leadrat_api
  target VARCHAR(100),  -- chatbot_crm
  
  -- Entity synced
  entity_type VARCHAR(100),  -- lead, property, project
  
  -- Statistics
  records_synced INT,
  records_created INT,
  records_updated INT,
  records_deleted INT,
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT,
  
  -- Status & errors
  status VARCHAR(100),  -- success, partial_failure, failed
  error_message TEXT,
  
  -- Indexes
  INDEX idx_entity_type (entity_type),
  INDEX idx_status (status),
  INDEX idx_completed_at (completed_at DESC)
);
```

---

## 3. DATA SYNC STRATEGY

### Sync Architecture

```
Leadrat APIs (Source of Truth)
        ↓
    Data Sync Service (FastAPI Background Task)
        ↓
    ┌───────────────────────────────┐
    │  Sync Orchestrator            │
    │  - Detect sync type           │
    │  - Manage transaction         │
    │  - Log sync events            │
    └───────────────────────────────┘
        ↓
    ┌─────────────────────────────────────────┐
    │  Lead Sync       Property Sync   Project Sync  │
    │  Worker          Worker          Worker        │
    └─────────────────────────────────────────┘
        ↓
    PostgreSQL (chatbot_crm)
        ↓
    Redis Cache Invalidation
```

### Sync Strategies

#### 1. **Full Sync** (On-Demand)
**When:** Initial setup, manual trigger, data corruption detected  
**Process:**
```
1. Lock sync_status = "syncing"
2. For each entity type (lead, property, project):
   a. Fetch ALL from Leadrat API (paginated)
   b. For each record:
      - Check if exists in chatbot_crm by leadrat_id
      - If exists: UPDATE (if changed_timestamp > local_timestamp)
      - If not exists: INSERT
      - Track in data_sync_log
   c. Detect deleted records (in Leadrat but not fetched) → SOFT DELETE
3. Unlock sync_status = "syncing"
4. Invalidate all caches
5. Log completion in data_sync_log
```

**Duration:** 5-15 minutes (depending on data volume)

#### 2. **Incremental Sync** (Scheduled - Hourly)
**When:** Regular updates  
**Process:**
```
1. Query: last_sync_timestamp from previous sync
2. For each entity type:
   a. Fetch from Leadrat: WHERE updated_at > last_sync_timestamp
   b. Upsert into chatbot_crm (by leadrat_id)
   c. Track changes in data_sync_log
3. Update last_sync_timestamp
4. Invalidate affected cache keys (by entity type)
```

**Duration:** 30 seconds - 2 minutes (usually)

#### 3. **On-Demand Sync** (User-Triggered)
**When:** User explicitly refreshes, specific record lookup  
**Process:**
```
1. Sync specific record (or small batch) from Leadrat
2. Upsert into chatbot_crm
3. Return fresh data immediately
4. Cache for 5-10 minutes
```

**Duration:** < 1 second

### Conflict Resolution

```
Local (chatbot_crm) vs Remote (Leadrat)
    ↓
Check: local.updated_at vs remote.updated_at
    ↓
├─ Remote newer → Use remote (OVERWRITE LOCAL)
├─ Local newer → Keep local (assume local updates)
├─ Same timestamp → Use remote (conservative)
└─ Local missing → INSERT from remote

Special cases:
- Deleted in Leadrat → SOFT DELETE locally (mark deleted=true)
- Deleted locally → Sync will re-INSERT from Leadrat
- In-flight changes → Transaction-based, no partial syncs
```

### Sync Failure Handling

```
Sync fails
    ↓
├─ Network error → Retry (exponential backoff: 1s, 2s, 4s, 8s, 16s)
├─ Rate limit (429) → Retry with delay (Leadrat rate limit: TBD)
├─ Data validation error → Log error, skip record, continue
├─ Database lock timeout → Retry after delay
└─ Other error → Log and alert, manual review required

Partial sync success:
- If some records synced before failure
- Continue from last success point
- Log partial success in sync_log
- Alert: "Sync partially completed, manual review recommended"
```

---

## 4. BACKGROUND JOB STRATEGY

### Job Scheduler Architecture

```
┌──────────────────────────────────────────────┐
│  APScheduler / Celery Task Queue             │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─ Hourly Incremental Sync                  │
│  │  └─ Runs: Every hour at :00 minutes       │
│  │  └─ Lead, Property, Project sync          │
│  │  └─ Timeout: 5 minutes (fail if over)     │
│  │                                            │
│  ┌─ Hourly Cache Cleanup                     │
│  │  └─ Runs: Every hour at :15 minutes       │
│  │  └─ Clear expired Redis keys              │
│  │  └─ Cleanup stale sessions (> 24h)        │
│  │                                            │
│  ┌─ 6-Hour Full Sync (Off-Peak)              │
│  │  └─ Runs: 2 AM, 8 AM, 2 PM, 8 PM         │
│  │  └─ Full data refresh                     │
│  │  └─ Timeout: 30 minutes                   │
│  │                                            │
│  ┌─ Conversation Archival                    │
│  │  └─ Runs: Daily at 3 AM                   │
│  │  └─ Archive old conversations (> 30 days) │
│  │  └─ Generate session summaries            │
│  │                                            │
│  ┌─ Health Check & Monitoring                │
│  │  └─ Runs: Every 5 minutes                 │
│  │  └─ Check DB connectivity                 │
│  │  └─ Check Leadrat API availability        │
│  │  └─ Check Redis connectivity              │
│  │  └─ Alert if critical service down        │
│  │                                            │
│  └─ On-Demand Sync (REST API)                │
│     └─ /admin/sync/manual?entity=lead        │
│     └─ Triggered by admin action             │
│                                              │
└──────────────────────────────────────────────┘
```

### Job Implementation

#### Using APScheduler (Built-in Python)
```python
# backend-ai/app/services/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler()

# Hourly incremental sync
scheduler.add_job(
    incremental_sync,
    CronTrigger(minute=0),  # Every hour at :00
    id='incremental_sync',
    max_instances=1,  # Prevent overlapping
    coalesce=True  # Skip missed runs
)

# Full sync (off-peak hours)
scheduler.add_job(
    full_sync,
    CronTrigger(hour='2,8,14,20'),  # 2 AM, 8 AM, 2 PM, 8 PM
    id='full_sync',
    max_instances=1
)

# Hourly cache cleanup
scheduler.add_job(
    cleanup_cache,
    CronTrigger(minute=15),
    id='cache_cleanup'
)

# Health checks
scheduler.add_job(
    health_check,
    CronTrigger(minute='*/5'),  # Every 5 minutes
    id='health_check'
)

scheduler.start()
```

### Job Monitoring & Logging

```python
# backend-ai/app/services/sync_service.py

def incremental_sync():
    sync_start = datetime.utcnow()
    logger.info("[Sync] Starting incremental sync")
    
    try:
        # Track stats
        stats = {
            "leads_created": 0,
            "leads_updated": 0,
            "properties_created": 0,
            "properties_updated": 0,
            "projects_created": 0,
            "projects_updated": 0
        }
        
        # Sync each entity
        for entity_type in ["lead", "property", "project"]:
            try:
                result = sync_entity(entity_type)
                stats[f"{entity_type}s_created"] = result["created"]
                stats[f"{entity_type}s_updated"] = result["updated"]
            except Exception as e:
                logger.error(f"[Sync] Failed for {entity_type}: {e}")
                stats[f"{entity_type}_error"] = str(e)
        
        # Log completion
        sync_duration = (datetime.utcnow() - sync_start).total_seconds()
        logger.info(f"[Sync] Completed in {sync_duration}s", extra=stats)
        
        # Store in sync_log table
        save_sync_log(
            sync_type="incremental",
            status="success",
            duration_ms=int(sync_duration * 1000),
            **stats
        )
        
        # Invalidate caches
        cache.invalidate_by_pattern("search:*")
        
    except Exception as e:
        logger.error(f"[Sync] FAILED: {e}")
        save_sync_log(
            sync_type="incremental",
            status="failed",
            error=str(e)
        )
        alert_admin("Incremental sync failed", extra={"error": str(e)})
```

---

## 5. CACHING STRATEGY

### Multi-Layer Cache Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User Session (In-Memory)                               │
│  - Last 10 messages                                     │
│  - Current filters/context                             │
│  - TTL: Session duration (24h default)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Redis Query Cache (Fast, Distributed)                 │
│  - Search results                                       │
│  - Entity details                                       │
│  - Filter suggestions                                  │
│  - TTL: 5-60 minutes (by query type)                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL (Source of Truth)                           │
│  - Indexed queries                                      │
│  - Full-text search                                    │
│  - Aggregations                                        │
└─────────────────────────────────────────────────────────┘
```

### Cache Key Strategy

```
Cache Key Format: "{cache_type}:{tenant_id}:{query_hash}:{version}"

Examples:
- "search:dubait11:ab3f4d2e:v1" → Search results for tenant
- "entity:dubait11:lead:abc123:v1" → Single lead
- "filters:dubait11:property:v1" → Available property filters
- "conversation:session-uuid:v1" → Session memory
```

### Cache Invalidation Rules

| Event | Cache Keys Invalidated | TTL |
|-------|------------------------|-----|
| Lead sync | `search:*:lead`, `entity:*:lead*` | Immediate |
| Property sync | `search:*:property`, `entity:*:property*` | Immediate |
| Project sync | `search:*:project`, `entity:*:project*` | Immediate |
| Full sync | All search keys | Immediate |
| Session creation | None (new session) | 24h |
| Session timeout | Session key | Immediate |
| User logout | `conversation:session*`, `session:user*` | Immediate |

### Cache TTL by Query Type

```
Query Type                           TTL      Rationale
─────────────────────────────────────────────────────────
Lead search (with filters)          30 min    Popular, changes hourly
Property search (with filters)      60 min    Large dataset, stable
Project search                       60 min    Stable, rarely changes
Single lead detail                  15 min    Frequently accessed
Single property detail              20 min    Frequently viewed
Single project detail               30 min    Less frequently accessed
Filter suggestions                  120 min   Stable, regenerate less
Conversation summary                5 min     Updates frequently
Search count (analytics)            60 min    For displaying "X results"
User session                        1440 min  24-hour session
```

### Implementation Example

```python
# backend-ai/app/services/search_service.py

from redis import Redis
import hashlib
import json

redis_client = Redis(host='localhost', port=6379, db=0)

def get_cached_search(tenant_id, search_type, filters):
    """Get search results from cache or query DB"""
    
    # Build cache key
    query_hash = hashlib.md5(
        json.dumps(filters, sort_keys=True).encode()
    ).hexdigest()
    cache_key = f"search:{tenant_id}:{search_type}:{query_hash}:v1"
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        logger.debug(f"Cache HIT: {cache_key}")
        return json.loads(cached)
    
    # Cache miss: Query DB
    logger.debug(f"Cache MISS: {cache_key}")
    results = query_database(tenant_id, search_type, filters)
    
    # Store in cache
    ttl_seconds = get_ttl_for_query(search_type)
    redis_client.setex(
        cache_key,
        ttl_seconds,
        json.dumps(results)
    )
    
    return results
```

---

## 6. SEARCH & INDEXING STRATEGY

### Database Indexes

```sql
-- Leads table indexes (for fast filtering)
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_location ON leads USING GIN(preferred_locations);
CREATE INDEX idx_leads_budget ON leads(min_budget, max_budget);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_updated_at ON leads(updated_at DESC);

-- Full-text search on lead name/notes
CREATE INDEX idx_leads_name_fts ON leads USING GIN(
  to_tsvector('english', COALESCE(name, '') || ' ' || 
  COALESCE(notes, ''))
);

-- Properties table indexes
CREATE INDEX idx_properties_tenant_city ON properties(tenant_id, city);
CREATE INDEX idx_properties_bhk ON properties(bhk_type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties USING GIST(
  ll_to_earth(latitude, longitude)
);  -- For geographic queries

CREATE INDEX idx_properties_title_fts ON properties USING GIN(
  to_tsvector('english', COALESCE(title, '') ||
  ' ' || COALESCE(description, ''))
);

-- Projects table indexes
CREATE INDEX idx_projects_tenant_city ON projects(tenant_id, city);
CREATE INDEX idx_projects_rera_status ON projects(rera_status);
CREATE INDEX idx_projects_possession_year ON projects(min_possession_year, max_possession_year);
CREATE INDEX idx_projects_name_fts ON projects USING GIN(
  to_tsvector('english', COALESCE(name, ''))
);
```

### Query Optimization

#### Lead Search Query
```python
def search_leads(
    tenant_id: str,
    status: str = None,
    location: str = None,
    min_budget: int = None,
    max_budget: int = None,
    search_text: str = None,
    assigned_to: str = None,
    page: int = 1,
    size: int = 10
):
    """Search leads with filters"""
    
    query = db.session.query(Lead).filter(
        Lead.tenant_id == tenant_id,
        Lead.is_active == True
    )
    
    # Add filters
    if status:
        query = query.filter(Lead.status.ilike(f"%{status}%"))
    
    if location:
        # Array contains search
        query = query.filter(
            Lead.preferred_locations.any(
                location.ilike(f"%{location}%")
            )
        )
    
    if min_budget is not None:
        query = query.filter(Lead.max_budget >= min_budget)
    
    if max_budget is not None:
        query = query.filter(Lead.min_budget <= max_budget)
    
    if search_text:
        # Full-text search on name/notes
        query = query.filter(
            to_tsvector('english', 
                func.coalesce(Lead.name, '') + ' ' +
                func.coalesce(Lead.notes, '')
            ).match(
                plainto_tsquery('english', search_text)
            )
        )
    
    if assigned_to:
        query = query.filter(Lead.assigned_to == assigned_to)
    
    # Count total
    total = query.count()
    
    # Paginate and sort
    results = query.order_by(
        Lead.last_contacted.desc(),
        Lead.updated_at.desc()
    ).offset(
        (page - 1) * size
    ).limit(size).all()
    
    return {
        "data": results,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }
```

#### Property Search with Geo-Filtering
```python
def search_properties_near_location(
    tenant_id: str,
    latitude: float,
    longitude: float,
    radius_km: float = 5,
    bhk: str = None,
    min_price: int = None,
    max_price: int = None,
    page: int = 1,
    size: int = 10
):
    """Search properties near location with geo-distance"""
    
    from sqlalchemy.sql import func
    from geoalchemy2 import functions as gf
    
    # Build base query
    query = db.session.query(
        Property,
        # Calculate distance in km
        (gf.ST_Distance(
            Property.geometry,
            func.ST_PointFromText(f'POINT({longitude} {latitude})'),
            false  # Use sphere distance
        ) / 1000).label('distance')
    ).filter(
        Property.tenant_id == tenant_id,
        Property.is_active == True,
        # Radius filter using spatial index
        gf.ST_DWithin(
            Property.geometry,
            func.ST_PointFromText(f'POINT({longitude} {latitude})'),
            radius_km * 1000,  # Convert to meters
            false  # Use sphere distance
        )
    )
    
    # Add other filters
    if bhk:
        query = query.filter(Property.bhk_type == bhk)
    
    if min_price:
        query = query.filter(Property.price >= min_price)
    
    if max_price:
        query = query.filter(Property.price <= max_price)
    
    # Order by distance
    results = query.order_by('distance').offset(
        (page - 1) * size
    ).limit(size).all()
    
    return results
```

---

## 7. ENTITY EXTRACTION FLOW

### NER (Named Entity Recognition) using Ollama

```
User: "show hot leads in Whitefield under 50L with budget 40-50 lakh"
    ↓
┌─────────────────────────────────────────────────────────┐
│ Entity Extraction Prompt Engineering                    │
│                                                         │
│ System Prompt:                                          │
│ "You are an intelligent real estate query parser.      │
│  Extract entities from user queries. Return JSON.      │
│  Normalize locations, values, and units."              │
│                                                         │
│ User Prompt:                                            │
│ "Extract entities from: 'show hot leads in Whitefield  │
│  under 50L with budget 40-50 lakh'"                    │
│                                                         │
│ Expected Response:                                      │
│ {                                                       │
│   "intent": "lead_search",                             │
│   "entities": {                                         │
│     "status": "hot",                                   │
│     "location": "Whitefield",                          │
│     "budget_max": 5000000,                             │
│     "budget_range": [4000000, 5000000]                 │
│   },                                                   │
│   "confidence": 0.95,                                  │
│   "extraction_notes": "Inferred budget range from      │
│                        context (40-50 lakh)"           │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
    ↓
Confidence > 0.85?
    ├─ YES: Use extracted entities
    └─ NO: Fall back to keyword matching
```

### Entity Dictionary & Normalization

```python
# backend-ai/app/services/entity_extractor.py

ENTITY_MAPPINGS = {
    # Location aliases
    "locations": {
        "bengaluru": "Bangalore",
        "bengalooroo": "Bangalore",
        "blr": "Bangalore",
        "whitefield": "Whitefield",
        "koramangala": "Koramangala",
        "indiranagar": "Indiranagar",
        # Add more
    },
    
    # Status/Lead quality
    "lead_status": {
        "hot": "hot",
        "warm": "warm",
        "cold": "cold",
        "new": "new",
        "follow_up": "follow_up",
        "meeting": "meeting_scheduled",
        "converted": "converted",
    },
    
    # Property types
    "property_types": {
        "apartment": "apartment",
        "apt": "apartment",
        "flat": "apartment",
        "house": "villa",
        "villa": "villa",
        "plot": "plot",
        "land": "plot",
        "duplex": "duplex",
    },
    
    # BHK types
    "bhk_types": {
        "1bhk": "1BHK",
        "1 bhk": "1BHK",
        "one bedroom": "1BHK",
        "2bhk": "2BHK",
        "2 bhk": "2BHK",
        "two bedroom": "2BHK",
        "3bhk": "3BHK",
        "3 bhk": "3BHK",
        "three bedroom": "3BHK",
    },
    
    # Possession types
    "possession": {
        "rdy": "ready_to_move",
        "ready": "ready_to_move",
        "rtm": "ready_to_move",
        "uc": "under_construction",
        "under construction": "under_construction",
        "2024": "possession_2024",
        "2025": "possession_2025",
    },
}

def normalize_entity(entity_type: str, value: str) -> str:
    """Normalize entity to standard form"""
    
    if entity_type not in ENTITY_MAPPINGS:
        return value
    
    normalized = ENTITY_MAPPINGS[entity_type].get(
        value.lower().strip(),
        value
    )
    
    return normalized

def extract_entities_ollama(message: str) -> dict:
    """Extract entities using Ollama"""
    
    prompt = f"""
You are a real estate query parser. Extract entities from the user's message.
Return JSON with the following structure:
{{
  "intent": "lead_search" | "property_search" | "project_search" | "visit_schedule" | "general",
  "entities": {{
    "location": string or null,
    "budget_min": integer or null,  # in currency units
    "budget_max": integer or null,
    "bhk": string or null,  # "1BHK", "2BHK", "3BHK"
    "property_type": string or null,  # "apartment", "villa", "plot"
    "status": string or null,  # "hot", "new", "meeting_scheduled"
    "possession": string or null,  # "ready_to_move", "under_construction"
    "area_min": integer or null,  # in sqft
    "area_max": integer or null
  }},
  "confidence": float,  # 0-1
  "raw_values": {{}}  # Original extracted values before normalization
}}

User message: "{message}"

Rules:
- Normalize all values (see normalization rules)
- Handle currency conversion (50L = 5000000, 1Cr = 10000000)
- Extract possession year as "possession_YYYY"
- Set confidence lower if ambiguous
- Return only valid JSON, no other text
"""
    
    try:
        response = ollama_client.generate(
            model="llama2",  # or whatever model is configured
            prompt=prompt,
            stream=False,
            temperature=0.1  # Lower temp for consistent parsing
        )
        
        # Parse response
        extracted = json.loads(response["response"])
        
        # Normalize entities
        if extracted["entities"].get("location"):
            extracted["entities"]["location"] = normalize_entity(
                "locations",
                extracted["entities"]["location"]
            )
        
        if extracted["entities"].get("bhk"):
            extracted["entities"]["bhk"] = normalize_entity(
                "bhk_types",
                extracted["entities"]["bhk"]
            )
        
        # More normalizations...
        
        return extracted
        
    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        # Fallback to keyword matching
        return fallback_entity_extraction(message)

def fallback_entity_extraction(message: str) -> dict:
    """Keyword-based fallback when Ollama fails"""
    
    entities = {
        "intent": detect_intent_keywords(message),
        "entities": {},
        "confidence": 0.5,  # Lower confidence
        "method": "keyword_matching"
    }
    
    # Extract common patterns with regex
    # Budget: "50L", "50 lakh", "5000000"
    budget_match = re.search(r'(\d+)\s*([lL]|lakh)', message)
    if budget_match:
        budget_value = int(budget_match.group(1)) * 100000
        entities["entities"]["budget_max"] = budget_value
    
    # Location: "in [location]"
    location_match = re.search(r'in\s+(\w+)', message, re.IGNORECASE)
    if location_match:
        entities["entities"]["location"] = location_match.group(1)
    
    # BHK: "3BHK", "2bhk"
    bhk_match = re.search(r'(\d)\s*bhk', message, re.IGNORECASE)
    if bhk_match:
        entities["entities"]["bhk"] = f"{bhk_match.group(1)}BHK"
    
    return entities
```

### Entity Extraction Performance

| Method | Accuracy | Speed | Cost | Fallback |
|--------|----------|-------|------|----------|
| Ollama NER | 85-90% | 500-1000ms | Free | Keyword matching |
| Keyword Matching | 60-70% | 10-50ms | Free | Generic response |
| OpenAI (GPT-4) | 95%+ | 1-2s | Expensive | - |

**Strategy:** Use Ollama by default (free, decent accuracy), fallback to keyword matching on errors or timeouts.

---

## 8. RAG ARCHITECTURE

### RAG Flow for Conversational Context

```
User: "Actually, can they move in by next month?"
Previous Context: {
  last_intent: "property_search",
  last_filters: {location: "Whitefield", possession: "under_construction"},
  last_results: [property_1, property_2, ...]
}
    ↓
┌─────────────────────────────────────────────────────────┐
│ Intent Resolution with Context                          │
│                                                         │
│ Question: "Can they move in by next month?"            │
│ Context: Searching for properties in Whitefield         │
│ Inferred Intent: Property search with               │
│                 possession_date filter                  │
│                                                         │
│ Updated Filter: {                                       │
│   location: "Whitefield",                               │
│   possession: "ready_to_move" or                        │
│   "possession_date <= next_month"                       │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
    ↓
Search chatbot_crm with updated filters
    ↓
Return filtered results with explanation
```

### Vector Search (Optional Enhancement for Phase 3.5)

```
Future: Implement semantic search using embeddings
- Embed lead/property descriptions
- Embed user queries
- Find semantically similar results
- Use: pgvector extension + Ollama embeddings
```

### Conversation Memory Strategy

```python
# backend-ai/app/services/conversation_service.py

class ConversationMemory:
    """Manages conversation context and history"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.memory_window = 10  # Keep last 10 messages
        self.summary_window = 3  # Summary after every 3 messages
    
    def add_turn(self, role: str, message: str, 
                 intent: str, entities: dict, response: str):
        """Add user/assistant turn to memory"""
        
        turn = {
            "role": role,  # "user" or "assistant"
            "message": message,
            "intent": intent,
            "entities": entities,
            "response": response if role == "assistant" else None,
            "timestamp": datetime.utcnow()
        }
        
        # Store in session
        session = get_session(self.session_id)
        session.conversation_history.append(turn)
        
        # Trim to window
        if len(session.conversation_history) > self.memory_window:
            oldest = session.conversation_history.pop(0)
            # Add to summary
            update_summary(session, oldest)
        
        db.session.commit()
    
    def get_context(self) -> dict:
        """Get current conversation context"""
        
        session = get_session(self.session_id)
        
        # Get last 3 messages
        recent = session.conversation_history[-3:]
        
        # Build context
        context = {
            "recent_messages": recent,
            "summary": session.conversation_summary,
            "last_intent": recent[-1].get("intent") if recent else None,
            "last_filters": extract_filters_from_history(recent),
            "session_start": session.started_at,
            "user_id": session.user_id
        }
        
        return context
    
    def is_contextual_question(self, message: str) -> bool:
        """Check if message refers to previous context"""
        
        # Pronouns: "they", "it", "those"
        # Comparatives: "more", "less", "higher"
        # Questions starting with "and", "also"
        
        contextual_patterns = [
            r'\b(they|them|it|those|these)\b',
            r'\b(more|less|higher|lower|different|similar)\b',
            r'^(and|also|what about|how about)',
        ]
        
        for pattern in contextual_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        
        return False
```

---

## 9. CONVERSATION MEMORY & SESSION

### Session Lifecycle

```
1. Session Creation
   - User starts chat
   - Generate session_id (UUID)
   - Create user_session record
   - Initialize conversation_history = []
   
2. Session Active
   - Messages flow in/out
   - Maintain conversation_history (last 10 messages)
   - Update last_activity timestamp
   - Cache in Redis (TTL: session duration)
   
3. Session Timeout
   - No activity for 30 minutes
   - Archive conversation_history to DB
   - Generate session_summary (AI summary)
   - Close session (is_active = false)
   - Clear from Redis
   - User can resume (if within 24h)
   
4. Session Resume
   - User logs back in within 24h
   - Load previous session
   - Load archived history + summary
   - Continue conversation
   
5. Session Expiration
   - After 24h of inactivity
   - Archive to cold storage
   - Cannot resume after expiration
```

### Conversation Summary Generation

```python
def generate_conversation_summary(session_id: str) -> str:
    """Generate AI summary of entire conversation"""
    
    session = get_session(session_id)
    
    # Get full history
    history_text = "\n".join([
        f"{turn['role']}: {turn['message']}"
        for turn in session.conversation_history
    ])
    
    summary_prompt = f"""
Summarize the following conversation in 2-3 sentences.
Focus on: What the user was looking for, any decisions made.

Conversation:
{history_text}

Summary:
"""
    
    summary = ollama_client.generate(
        model="llama2",
        prompt=summary_prompt,
        stream=False
    )["response"].strip()
    
    # Store summary
    session.conversation_summary = summary
    db.session.commit()
    
    return summary
```

### Session Recovery

```python
def get_or_create_session(user_id: str, 
                         session_token: str = None) -> UserSession:
    """Get existing session or create new"""
    
    if session_token:
        # Try to resume existing session
        session = db.session.query(UserSession).filter(
            UserSession.session_token == session_token,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if session:
            # Resume existing
            session.last_activity = datetime.utcnow()
            db.session.commit()
            logger.info(f"Resumed session: {session.id}")
            return session
    
    # Create new session
    new_session = UserSession(
        id=uuid4(),
        user_id=user_id,
        session_token=generate_secure_token(),
        conversation_history=[],
        started_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=24),
        is_active=True
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    logger.info(f"Created new session: {new_session.id}")
    return new_session
```

---

## 10. LOCAL SEARCH API CONTRACTS

### Lead Search API

```
Endpoint: POST /api/v1/search/leads
Content-Type: application/json

Request:
{
  "tenant_id": "uuid",
  "filters": {
    "search_text": "string (optional) - full text search on name/notes",
    "status": "string (optional) - new, hot, warm, meeting_scheduled",
    "location": "string (optional) - single location or array",
    "min_budget": 1000000,
    "max_budget": 5000000,
    "source": "website | referral | cold_call",
    "assigned_to": "user_id (optional)",
    "created_from": "2026-01-01T00:00:00Z",
    "created_to": "2026-12-31T23:59:59Z",
    "sort_by": "updated_at | created_at | conversion_probability",
    "sort_order": "asc | desc",
    "page": 1,
    "size": 10
  }
}

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string",
      "status": "string",
      "min_budget": 1000000,
      "max_budget": 5000000,
      "preferred_locations": ["Bangalore", "Whitefield"],
      "bhk_preference": ["2BHK", "3BHK"],
      "last_contacted": "2026-04-20T10:30:00Z",
      "conversion_probability": 0.75,
      "assigned_to": "user_id",
      "tags": ["hot", "urgent"]
    }
  ],
  "total": 45,
  "page": 1,
  "size": 10,
  "pages": 5,
  "filters_applied": { /* echoed filters */ },
  "search_time_ms": 45
}

Error (400 Bad Request):
{
  "status": "error",
  "error": "Invalid filter: status must be one of [new, hot, warm, ...]",
  "code": "INVALID_FILTER"
}
```

### Property Search API

```
Endpoint: POST /api/v1/search/properties
Content-Type: application/json

Request:
{
  "tenant_id": "uuid",
  "filters": {
    "search_text": "string (optional) - title/description search",
    "location": "string | array",
    "city": "string",
    "locality": "string",
    "bhk_type": "1BHK | 2BHK | 3BHK",
    "property_type": "apartment | villa | plot",
    "min_price": 2000000,
    "max_price": 8000000,
    "possession_type": "ready_to_move | under_construction",
    "possession_year": 2026,
    "min_area": 800,  # sqft
    "max_area": 3000,
    "furnish_status": "furnished | unfurnished",
    "status": "available | sold",
    
    "geo_location": {  # Optional: nearby search
      "latitude": 13.0827,
      "longitude": 77.6064,
      "radius_km": 5
    },
    
    "amenities": ["swimming_pool", "gym"],  # Must have all
    
    "sort_by": "updated_at | price | area",
    "sort_order": "asc | desc",
    "page": 1,
    "size": 10
  }
}

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "address": {
        "city": "Bangalore",
        "locality": "Whitefield",
        "latitude": 13.0827,
        "longitude": 77.6064
      },
      "bhk_type": "3BHK",
      "property_type": "apartment",
      "carpet_area": 1500,
      "price": 6000000,
      "price_per_sqft": 4000,
      "possession_type": "ready_to_move",
      "possession_date": "2026-05-15",
      "status": "available",
      "furnish_status": "unfurnished",
      "amenities": ["pool", "gym"],
      "image_urls": ["url1", "url2"],
      "project_name": "Project XYZ",
      "view_count": 45
    }
  ],
  "total": 23,
  "page": 1,
  "size": 10,
  "pages": 3,
  "filters_applied": { /* echoed */ },
  "search_time_ms": 67
}
```

### Project Search API

```
Endpoint: POST /api/v1/search/projects
Content-Type: application/json

Request:
{
  "tenant_id": "uuid",
  "filters": {
    "search_text": "string (optional)",
    "location": "string | array",
    "city": "string",
    "project_type": "residential | commercial",
    "min_budget": 5000000,
    "max_budget": 100000000,
    "bhk_types": ["2BHK", "3BHK"],
    "possession_type": "ready | under_construction",
    "min_possession_year": 2026,
    "max_possession_year": 2028,
    "rera_status": "approved | pending",
    "status": "active | completed | upcoming",
    
    "sort_by": "updated_at | min_price",
    "sort_order": "asc | desc",
    "page": 1,
    "size": 10
  }
}

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "city": "Bangalore",
      "locality": "Whitefield",
      "developer_name": "ABC Developers",
      "project_type": "residential",
      "bhk_types": ["1BHK", "2BHK", "3BHK"],
      "total_units": 500,
      "units_available": 45,
      "min_price": 3000000,
      "max_price": 8000000,
      "avg_price_per_sqft": 5000,
      "possession_type": "under_construction",
      "completion_year": 2027,
      "rera_id": "REA-123-456",
      "rera_status": "approved",
      "amenities": ["pool", "gym", "park"],
      "status": "active",
      "inquiry_count": 234
    }
  ],
  "total": 12,
  "page": 1,
  "size": 10,
  "pages": 2,
  "search_time_ms": 52
}
```

---

## 11. FLOATING CHATBOT COMPONENT

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ All Dashboard Pages                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Page Content]                                         │
│                                                         │
│                                                         │
│                                          ┌──────────┐  │
│                                          │ AI Bot   │  │
│                                          │ [Icon]   │  │
│                                          └──────────┘  │
│                                          (Bottom-Right)│
│                                                         │
│  When clicked:                                         │
│  ↓                                                      │
│  ┌──────────────────────────────────┐                 │
│  │ Floating Chatbot Drawer          │                 │
│  ├──────────────────────────────────┤                 │
│  │ Real Estate AI Assistant         │                 │
│  ├──────────────────────────────────┤                 │
│  │ [Messages]                       │                 │
│  │ User: "show properties in..."   │                 │
│  │ Bot: "I found 7 properties..."  │                 │
│  │ [More messages...]               │                 │
│  ├──────────────────────────────────┤                 │
│  │ [Input] Send                     │                 │
│  ├──────────────────────────────────┤                 │
│  │ [Minimize] [Close]               │                 │
│  └──────────────────────────────────┘                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Implementation

#### Frontend Component (React)

```tsx
// frontend/components/floating-chatbot/FloatingChatbot.tsx

'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import ChatInterface from '@/components/ai/ChatInterface';

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bot Icon Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 
                     rounded-full w-14 h-14 flex items-center justify-center
                     shadow-lg hover:shadow-xl transition-all
                     text-white"
          title="Open AI Assistant"
        >
          <svg /* Bot icon */ />
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-96 h-96
                        bg-white rounded-t-lg shadow-2xl
                        flex flex-col
                        animate-slide-up">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-purple-500
                          text-white p-4 flex justify-between items-center
                          rounded-t-lg">
            <h3>Real Estate AI Assistant</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title="Minimize"
              >
                <ChevronDown size={20} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <ChatInterface 
              variant="floating"
              sessionId={sessionId}  // Persistent session
            />
          )}
        </div>
      )}
    </div>
  );
}
```

#### Layout Integration

```tsx
// frontend/app/(dashboard)/layout.tsx

import { FloatingChatbot } from '@/components/floating-chatbot/FloatingChatbot';

export default function DashboardLayout({ children }) {
  return (
    <div>
      {children}
      <FloatingChatbot />  {/* Available on all pages */}
    </div>
  );
}
```

### Session Persistence

```typescript
// frontend/lib/session.ts

export function getOrCreateChatbotSession(): string {
  const key = 'chatbot_session_id';
  
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    // Create new session on first visit
    sessionId = generateUUID();
    localStorage.setItem(key, sessionId);
    
    // Notify backend to create session
    createChatbotSession(sessionId);
  }
  
  return sessionId;
}
```

---

## 12. ERROR HANDLING & RETRY STRATEGY

### Error Classification

```
┌─────────────────────────────────────────────────────────┐
│ Error Types & Handling                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. USER ERROR (4xx)                                    │
│    - Invalid filter value                              │
│    - Missing required field                            │
│    - Out of range parameter                            │
│    → Log & return user-friendly message               │
│    → No retry                                          │
│    → Example: "Location not recognized. Try again"    │
│                                                         │
│ 2. SERVICE ERROR (5xx)                                 │
│    - Database error                                    │
│    - Search timeout                                    │
│    - Sync failure                                      │
│    → Retry with exponential backoff                   │
│    → Timeout: 5s for user queries, 30s for sync      │
│    → Fallback: LLM response or cached results         │
│                                                         │
│ 3. EXTERNAL ERROR (Leadrat API)                        │
│    - API down                                          │
│    - Rate limit (429)                                 │
│    - Authentication failed                            │
│    → Retry Leadrat on rate limit (429)               │
│    → Use local DB cache on API down                   │
│    → Manual intervention for auth errors              │
│                                                         │
│ 4. TIMEOUT ERROR                                       │
│    - Query taking > 5s                                │
│    - Sync taking > 30s                                │
│    → Return partial results if available              │
│    → Use cached results                               │
│    → Retry in background                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Retry Strategy

```python
# backend-ai/app/utils/retry.py

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((ConnectionError, TimeoutError))
)
def search_with_retry(query, timeout=5):
    """Search with automatic retry on transient errors"""
    
    try:
        return search_local_db(query, timeout=timeout)
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise

def search_with_fallback(query, timeout=5):
    """Search with fallback to cache/LLM"""
    
    try:
        # Try local DB
        return search_with_retry(query, timeout=timeout)
        
    except TimeoutError:
        # Timeout: return cached results
        logger.warning(f"Search timeout, using cache")
        cached = get_cached_search_results(query)
        if cached:
            return cached
        
        # No cache: return LLM generic response
        return generate_generic_response(query)
        
    except Exception as e:
        # Other error: LLM fallback
        logger.error(f"Search failed: {e}")
        return generate_generic_response(query)
```

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_FILTER",
    "message": "Location 'XYZ' not recognized. Try: Bangalore, Whitefield, Koramangala",
    "type": "USER_ERROR",
    "details": {
      "invalid_field": "location",
      "provided_value": "XYZ",
      "suggestions": ["Bangalore", "Whitefield"]
    }
  },
  "timestamp": "2026-04-27T10:30:00Z",
  "request_id": "req-uuid"
}
```

---

## 13. PERFORMANCE CONSIDERATIONS

### Targets

| Metric | Target | Method |
|--------|--------|--------|
| Search Query | < 500ms (P95) | Index + Cache |
| Entity Extraction | < 1000ms | Ollama inference + fallback |
| Full Sync | < 15 min | Incremental batching |
| Incremental Sync | < 2 min | Only changed records |
| Cache Hit Rate | > 70% | Smart TTL strategy |
| API Response | < 2s (P95) | Async + Queue |

### Optimization Strategies

#### Database
```sql
-- Partial indexes (for common filters)
CREATE INDEX idx_leads_hot ON leads(id, name, phone)
  WHERE status = 'hot' AND is_active = TRUE;

-- Covering indexes (avoid table access)
CREATE INDEX idx_properties_list ON properties(
  id, title, price, bhk_type, city
) WHERE is_active = TRUE;

-- Partitioning (large tables)
CREATE TABLE conversations_2026_q1 PARTITION OF conversations
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

-- Denormalization (for read-heavy queries)
-- Store count fields: property.inquiry_count (updated on insert)
```

#### Caching
```python
# Multi-level caching with cache-aside pattern
def get_property(property_id):
    # L1: Memory cache (current request)
    if property_id in memory_cache:
        return memory_cache[property_id]
    
    # L2: Redis (distributed)
    cached = redis.get(f"property:{property_id}")
    if cached:
        memory_cache[property_id] = cached
        return cached
    
    # L3: Database
    property = db.query(Property).filter_by(id=property_id).first()
    if property:
        redis.setex(f"property:{property_id}", 3600, property)
        memory_cache[property_id] = property
    
    return property
```

#### Search
```python
# Full-text search instead of LIKE
# PostgreSQL: to_tsvector() + plainto_tsquery()
# Instead of: ILIKE '%search term%'

# Limit result set
# - Pagination (don't fetch all)
# - Limit to 100 max per request
# - Use offsets sparingly (expensive after 1000+)

# Async search for heavy queries
# - Search in background
# - Return "searching..." + stream results
# - Cache intermediate results
```

### Load Testing Targets

```bash
# Expected concurrent users: 100-1000
# Expected QPS: 10-50

# Bottleneck order (optimize in sequence):
1. Database indexes
2. Redis cache
3. Query optimization (SQL)
4. Async processing
5. Load balancer
6. More servers
```

---

## 14. SECURITY CONSIDERATIONS

### Data Protection

| Data | Classification | Protection |
|------|----------------|-----------|
| Lead details | Confidential | Encrypt at rest, TLS in transit |
| Contact info | PII | Masked in logs, access control |
| Budget | Sensitive | Audit logged, encryption |
| Conversation | Internal | TTL: 90 days, auto-delete |

### Access Control

```python
# backend-ai/app/middleware/auth.py

@app.middleware("http")
async def verify_tenant_access(request: Request, call_next):
    """Verify user has access to requested tenant"""
    
    # Extract tenant_id from request
    tenant_id = request.headers.get("X-Tenant-ID")
    
    # Verify user's tenant matches
    user = get_current_user(request)
    
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, 
                          detail="Access denied")
    
    # Add to request state
    request.state.tenant_id = tenant_id
    return await call_next(request)
```

### API Security

```python
# Rate limiting
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/search/leads")
@limiter.limit("100/minute")  # 100 requests/minute per IP
async def search_leads(request):
    pass

# Input validation
from pydantic import BaseModel, validator

class SearchLeadsRequest(BaseModel):
    status: str
    
    @validator('status')
    def validate_status(cls, v):
        if v not in ['hot', 'warm', 'cold', 'new']:
            raise ValueError('Invalid status')
        return v
```

### Logging & Monitoring

```python
# NEVER log:
- Passwords, tokens, API keys
- Phone numbers (full)
- Email addresses (full)
- Budget amounts (for specific users)
- Full credit card numbers

# DO log:
- Request ID (for tracing)
- User ID (masked)
- Action taken
- Timestamp
- Result (success/failure)

logger.info("User searched leads", extra={
    "user_id": "usr-***",
    "intent": "lead_search",
    "filter_count": 3,
    "result_count": 5
})
```

---

## 15. MIGRATION STRATEGY

### Phase: Dual-Write Period

```
┌─────────────────────────────────────┐
│ Week 1-2: DUAL-WRITE VALIDATION     │
├─────────────────────────────────────┤
│                                     │
│ User Query                          │
│    ↓                                │
│ ├─ Query LOCAL DB (new)             │
│ └─ Query Leadrat API (old)          │
│    ↓                                │
│ Compare results:                    │
│ - Same data? ✓ Confidence ++        │
│ - Different? ⚠ Flag for review     │
│ - Local missing? ✗ Sync needed      │
│    ↓                                │
│ Return LOCAL DB results             │
│ (all functionality via local)        │
│                                     │
│ Metrics to track:                  │
│ - Result match rate                │
│ - Sync lag                          │
│ - Query performance delta           │
│                                     │
└─────────────────────────────────────┘
```

### Migration Timeline

```
WEEK 1: Setup & Initial Sync
- Create chatbot_crm tables
- Run initial full sync (Leadrat → local)
- Verify data completeness
- Enable dual-write logging

WEEK 2: Validation & QA
- Test all search scenarios
- Validate data consistency
- Performance testing (load test)
- Gather match rate metrics (target: >98%)

WEEK 3: Gradual Cutover
- 10% of traffic: Use local DB only
- Monitor errors, performance
- Gradually ramp to 100%

WEEK 4: Full Cutover
- 100% traffic on local DB
- Keep Leadrat sync running (for source data)
- Monitor metrics closely
- Rollback plan ready

WEEK 5: Validate & Optimize
- Verify no errors
- Optimize slow queries
- Archive old log data
- Update docs

WEEK 6: Cleanup
- Remove dual-write code
- Retire fallback paths
- Document new architecture
- Train team on new system
```

### Rollback Plan

```
If issues detected:

1. IMMEDIATE (< 1 hour)
   - Revert API to use Leadrat (Phase 2 approach)
   - Disable local DB queries
   - Investigate issue in parallel

2. ROOT CAUSE ANALYSIS
   - Compare local vs Leadrat data
   - Check sync logs
   - Verify indexes/queries

3. FIX & VALIDATE
   - Fix identified issue
   - Re-run sync if needed
   - Validate fix with dual-write

4. RE-CUTOVER
   - Gradually ramp traffic back to local DB
   - Monitor metrics
   - Declare success

Rollback Time: < 2 hours
```

### Data Integrity Checks

```python
# backend-ai/app/admin/integrity_check.py

def data_integrity_check():
    """Daily integrity check: Local DB vs Leadrat"""
    
    # Sample 100 random leads from each
    local_leads = db.query(Lead).order_by(
        func.random()
    ).limit(100).all()
    
    leadrat_ids = [lead.leadrat_id for lead in local_leads]
    leadrat_leads = leadrat_service.fetch_leads_by_ids(
        leadrat_ids
    )
    
    # Compare key fields
    mismatches = []
    for local, remote in zip(local_leads, leadrat_leads):
        if local.name != remote.name:
            mismatches.append({
                "id": local.id,
                "field": "name",
                "local": local.name,
                "remote": remote.name
            })
    
    if mismatches:
        logger.error(f"Data integrity issues found: {len(mismatches)}")
        alert_admin(f"Found {len(mismatches)} data mismatches")
    else:
        logger.info("Data integrity check: PASSED")
```

---

## Summary Table

| Component | Technology | Status |
|-----------|-----------|--------|
| Database | PostgreSQL | New in Phase 3 |
| ORM | SQLAlchemy | New in Phase 3 |
| Caching | Redis | Extends Phase 2 |
| Sync | APScheduler | New in Phase 3 |
| Entity Extraction | Ollama NER | New in Phase 3 |
| Search | Full-text (PostgreSQL) | New in Phase 3 |
| Conversation Memory | PostgreSQL + Redis | New in Phase 3 |
| Floating UI | React Component | New in Phase 3 |
| Load Testing | locust/ab | Testing tool |

---

## Next Steps

1. **Review this document** for approval/feedback
2. **Clarify any ambiguities** before implementation
3. **Get database migration approval** (production DB changes)
4. **Schedule implementation** (estimated: 2-3 weeks)
5. **Plan testing strategy** (unit, integration, load)
6. **Prepare rollback procedures** (documented above)

---

**Document Status:** READY FOR REVIEW  
**Author:** Claude (AI Assistant)  
**Date:** 2026-04-27  
**Version:** 1.0

