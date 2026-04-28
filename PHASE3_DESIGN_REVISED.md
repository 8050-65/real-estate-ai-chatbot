# Phase 3: Local Database-First Architecture (REVISED)

**Status:** DESIGN REVIEW (Addressing User Feedback)  
**Date:** 2026-04-27  
**Version:** 2.0 (Addressing 15 Improvement Points)

---

## Table of Contents

1. [Multi-Tenant Architecture](#1-multi-tenant-architecture)
2. [Hybrid Search Strategy](#2-hybrid-search-strategy)
3. [Conversation Memory Scalability](#3-conversation-memory-scalability)
4. [RAG Separation (CRM vs Knowledge Base)](#4-rag-separation-crm-vs-knowledge-base)
5. [Sync Conflict Resolution](#5-sync-conflict-resolution)
6. [Security & Compliance](#6-security--compliance)
7. [Observability & Monitoring](#7-observability--monitoring)
8. [Chat Orchestration Layer](#8-chat-orchestration-layer)
9. [Floating Chatbot UX](#9-floating-chatbot-ux)
10. [Unified API Response Contract](#10-unified-api-response-contract)
11. [Advanced Sync Strategy](#11-advanced-sync-strategy)
12. [Query Interpretation Layer](#12-query-interpretation-layer)
13. [Implementation Phases (3A-3G)](#13-implementation-phases-3a-3g)
14. [Scale Assumptions](#14-scale-assumptions)
15. [Architecture Diagrams](#15-architecture-diagrams)

---

## 1. MULTI-TENANT ARCHITECTURE

### 1.1 Tenant Identity Mapping

```
┌─────────────────────────────────────────────────────────┐
│ TENANT MAPPING STRATEGY                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Leadrat System                Internal Chatbot System   │
│ ─────────────────────        ──────────────────────    │
│ organizationCode: "dubait11"  → tenant_id (UUID)        │
│ Stored in: leadrat_config    Stored in: tenants table   │
│                                                         │
│ Example Mapping:                                        │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Leadrat Code  │ Internal ID        │ Company    │   │
│ ├─────────────────────────────────────────────────┤   │
│ │ "dubait11"    │ uuid-xxxx-xxxx     │ Dubai Real │   │
│ │ "bangalore01" │ uuid-yyyy-yyyy     │ Bang Real  │   │
│ │ "mumbai-01"   │ uuid-zzzz-zzzz     │ Mum Real   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Tenant Configuration Store

```python
# backend-ai/app/db/models.py (Add to existing)

class TenantConfig(Base):
    """Mapping between Leadrat tenant code and internal UUID"""
    __tablename__ = "tenant_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    tenant_id = Column(UUID(as_uuid=True), 
                      ForeignKey("tenants.id"), 
                      nullable=False, unique=True)
    leadrat_code = Column(String(50), nullable=False, unique=True, index=True)
    # "dubait11", "bangalore01", etc.
    
    # Leadrat account credentials (encrypted)
    leadrat_api_key = Column(String(500), nullable=False)  # Encrypted
    leadrat_secret_key = Column(String(500), nullable=False)  # Encrypted
    leadrat_auth_url = Column(String(500), nullable=False)
    leadrat_base_url = Column(String(500), nullable=False)
    
    # Last sync timestamps (per entity)
    last_lead_sync = Column(DateTime(timezone=True))
    last_property_sync = Column(DateTime(timezone=True))
    last_project_sync = Column(DateTime(timezone=True))
    
    # Sync configuration
    sync_enabled = Column(Boolean, default=True)
    sync_frequency_minutes = Column(Integer, default=60)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 1.3 Tenant Isolation Rules

```python
# backend-ai/app/middleware/tenant_isolation.py

@app.middleware("http")
async def enforce_tenant_isolation(request: Request, call_next):
    """Enforce strict tenant isolation"""
    
    # Extract tenant from request
    tenant_id = request.headers.get("X-Tenant-ID")
    user_id = get_current_user_id(request)
    
    # Verify user belongs to tenant
    user = await db.query(User).filter(
        User.id == user_id,
        User.tenant_id == tenant_id  # CRITICAL: Must match
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=403,
            detail="Tenant access denied"
        )
    
    # Add to request context
    request.state.tenant_id = tenant_id
    request.state.user_id = user_id
    
    # Query should ALWAYS include tenant_id filter
    # Example: SELECT * FROM leads WHERE tenant_id = $1
    
    response = await call_next(request)
    return response
```

### 1.4 Database Query Pattern (MANDATORY)

```python
# ALL queries MUST include tenant_id filter

# CORRECT ✓
async def search_leads(tenant_id: UUID, filters: dict):
    query = db.query(Lead).filter(
        Lead.tenant_id == tenant_id,  # ALWAYS FIRST
        Lead.status == "hot"
    )

# WRONG ✗ (Will fail middleware check)
async def search_leads(filters: dict):
    query = db.query(Lead).filter(
        Lead.status == "hot"
    )
    # Missing tenant_id filter!
```

---

## 2. HYBRID SEARCH STRATEGY

### 2.1 Search Method Comparison

```
User Query: "Bengaluru apartments 50-80L"
    ↓
┌─────────────────────────────────────────────────────────┐
│ MULTI-STAGE SEARCH PROCESSING                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ STAGE 1: EXACT FILTERS (Fast)                          │
│ ├─ city = "Bangalore" (from normalization)             │
│ ├─ price >= 5000000 AND price <= 8000000              │
│ ├─ property_type = "apartment"                         │
│ Result: 250 properties (indexed, < 10ms)               │
│                                                         │
│ STAGE 2: FULL-TEXT SEARCH (Medium)                     │
│ ├─ to_tsvector('english', title || description)       │
│ ├─ Match against: "Bengaluru apartments"               │
│ ├─ Rank by relevance                                  │
│ Result: Re-rank 250 → 150 (< 50ms)                    │
│                                                         │
│ STAGE 3: FUZZY/TYPO TOLERANCE (Post-process)          │
│ ├─ Location: "Benglurur" → "Bangalore" (trigram)      │
│ ├─ If no exact match, use fuzzy distance              │
│ ├─ Threshold: > 0.8 similarity                        │
│ Result: Handle 5-10% typos (< 100ms)                  │
│                                                         │
│ STAGE 4: SEMANTIC SEARCH (Future, Optional)           │
│ ├─ Vector embedding of "Bengaluru apartments"         │
│ ├─ Compare with property embeddings                   │
│ ├─ Works for: "affordable family homes in IT hubs"    │
│ Result: Semantic relevance (< 500ms)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
    ↓
FINAL: Merge results + deduplicate + rank
TOTAL TIME: < 150ms (typically)
```

### 2.2 Implementation Details

#### PostgreSQL Trigram Search (Typo Tolerance)

```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram index for locations
CREATE INDEX idx_properties_location_trigram 
ON properties USING GIST(locality gist_trgm_ops);

-- Query with similarity threshold (typo tolerance)
SELECT *, 
  similarity(locality, 'Benglurur') as sim
FROM properties
WHERE similarity(locality, 'Benglurur') > 0.6
ORDER BY sim DESC;
-- Returns: "Bangalore" (0.8 similarity)
```

#### Full-Text Search Setup

```sql
-- Full-text search index
CREATE INDEX idx_properties_text_search ON properties USING GIN(
  to_tsvector('english', 
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(city, '')
  )
);

-- Query
SELECT * FROM properties
WHERE to_tsvector('english', title || description) @@ 
      plainto_tsquery('english', 'luxury apartments bangalore')
ORDER BY ts_rank(...) DESC;
```

#### Fuzzy Matching Service

```python
# backend-ai/app/services/search_service.py

from difflib import SequenceMatcher

class HybridSearchService:
    """Multi-stage search with fuzzy matching"""
    
    async def search_properties(
        self,
        tenant_id: UUID,
        filters: dict,
        search_text: str = None
    ) -> List[Property]:
        """
        Stage 1: Exact filters
        Stage 2: Full-text search
        Stage 3: Typo tolerance
        """
        
        # STAGE 1: Exact filters (indexed)
        query = db.query(Property).filter(
            Property.tenant_id == tenant_id,
            Property.is_active == True
        )
        
        if filters.get("city"):
            # Try exact match first
            city = filters["city"]
            query = query.filter(Property.city == city)
        
        if filters.get("min_price"):
            query = query.filter(Property.price >= filters["min_price"])
        
        if filters.get("max_price"):
            query = query.filter(Property.price <= filters["max_price"])
        
        results = query.limit(500).all()
        
        # STAGE 2: Full-text search (rank)
        if search_text:
            results = self._apply_full_text_ranking(results, search_text)
        
        # STAGE 3: Handle typos in location
        if filters.get("locality") and not results:
            # Fallback: fuzzy match on locality
            fuzzy_locality = self._find_fuzzy_match(
                filters["locality"],
                threshold=0.7
            )
            if fuzzy_locality:
                query = db.query(Property).filter(
                    Property.tenant_id == tenant_id,
                    Property.locality == fuzzy_locality
                )
                results = query.limit(100).all()
        
        return results[:10]
    
    def _find_fuzzy_match(self, input_text: str, threshold=0.7):
        """Find best fuzzy match in database"""
        
        # Get all unique localities
        localities = db.query(
            distinct(Property.locality)
        ).all()
        
        best_match = None
        best_score = 0
        
        for loc_tuple in localities:
            locality = loc_tuple[0]
            score = SequenceMatcher(
                None, 
                input_text.lower(), 
                locality.lower()
            ).ratio()
            
            if score > best_score and score >= threshold:
                best_score = score
                best_match = locality
        
        return best_match  # e.g., "Bangalore" for "Benglurur"
```

### 2.3 Search Type Routing

```python
# backend-ai/app/services/query_router.py

class QueryRouter:
    """Route query to appropriate search method"""
    
    async def route_search(
        self,
        tenant_id: UUID,
        search_query: str,
        entity_type: str  # lead, property, project
    ) -> SearchResult:
        
        # Detect query type
        if self._is_exact_match(search_query):
            # "ID: 12345" or "Phone: 9876543210"
            return await self.exact_search(tenant_id, search_query)
        
        elif self._is_structured_filter(search_query):
            # "2BHK apartments < 50L in Whitefield"
            return await self.filtered_search(tenant_id, search_query)
        
        elif self._has_typos(search_query):
            # "benglurur" or "whitefeild"
            return await self.fuzzy_search(tenant_id, search_query)
        
        else:
            # Generic natural language
            return await self.semantic_search(tenant_id, search_query)
```

---

## 3. CONVERSATION MEMORY SCALABILITY

### 3.1 Token Window Strategy

```
Problem: Storing full JSON in conversation_history can grow large
Solution: Token-based windowing with summarization

User Session (24-hour lifetime):
├─ Messages 1-10 (fresh, keep)
├─ Messages 11-20 (older, summarize)
├─ Messages 21+ (archive)

Token Budget:
├─ Current window: 2000 tokens max
├─ Summary: 500 tokens (compressed old context)
├─ Total per session: 2500 tokens
├─ Per day: 60 sessions × 2500 = 150K tokens
```

### 3.2 Memory Management Schema

```python
# backend-ai/app/db/models.py (Add)

class ConversationMemory(Base):
    """Scalable conversation memory with compression"""
    __tablename__ = "conversation_memory"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    session_id = Column(UUID(as_uuid=True), 
                       ForeignKey("user_sessions.id"),
                       nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), 
                      ForeignKey("tenants.id"),
                      nullable=False)
    
    # Memory layers
    recent_messages = Column(JSONB, default=list)  # Last 10 messages
    # {
    #   "messages": [
    #     {"role": "user", "content": "...", "timestamp": "...", "intent": "..."},
    #   ],
    #   "total_tokens": 1200
    # }
    
    context_summary = Column(Text)  # AI-generated summary (compressed)
    # "User looking for 2-3BHK apartments in Bangalore, 
    #  budget 60-80L, interested in new launches"
    
    compressed_context = Column(JSONB)  # Structured context
    # {
    #   "primary_intent": "property_search",
    #   "constraints": {
    #     "city": "Bangalore",
    #     "bhk": ["2BHK", "3BHK"],
    #     "budget_min": 6000000,
    #     "budget_max": 8000000,
    #     "property_type": "apartment"
    #   },
    #   "search_history": ["apartments", "villas"],
    #   "created_at": "timestamp"
    # }
    
    # Lifecycle
    active_until = Column(DateTime(timezone=True))
    archived_at = Column(DateTime(timezone=True))
    archival_reason = Column(String(100))  # timeout, manual, expired
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 3.3 Memory Compression Logic

```python
# backend-ai/app/services/memory_service.py

class ConversationMemoryService:
    """Manage conversation memory with automatic compression"""
    
    RECENT_WINDOW = 10  # Keep 10 most recent messages
    TOKEN_LIMIT_PER_WINDOW = 2000
    SUMMARY_TRIGGER = 20  # Summarize after 20 messages
    ARCHIVE_THRESHOLD = 24 * 60  # minutes (24 hours)
    
    async def add_message(
        self,
        session_id: UUID,
        role: str,
        message: str,
        intent: str = None
    ):
        """Add message and manage memory"""
        
        memory = await self._get_memory(session_id)
        
        # Add to recent messages
        memory.recent_messages.append({
            "role": role,
            "content": message,
            "intent": intent,
            "timestamp": datetime.utcnow().isoformat(),
            "tokens": estimate_tokens(message)
        })
        
        # Check if compression needed
        total_tokens = sum(
            m["tokens"] for m in memory.recent_messages
        )
        
        if total_tokens > self.TOKEN_LIMIT_PER_WINDOW:
            # Compress: Move old messages to summary
            await self._compress_memory(session_id, memory)
        
        if len(memory.recent_messages) > self.SUMMARY_TRIGGER:
            # Summarize old context
            await self._generate_summary(session_id, memory)
        
        # Save
        await db.session.commit()
    
    async def _compress_memory(
        self,
        session_id: UUID,
        memory: ConversationMemory
    ):
        """Compress old messages into summary"""
        
        # Keep only recent 10 messages
        old_messages = memory.recent_messages[:-self.RECENT_WINDOW]
        memory.recent_messages = memory.recent_messages[-self.RECENT_WINDOW:]
        
        # Extract key context from old messages
        memory.compressed_context = extract_context_from_messages(
            old_messages
        )
        # Returns: {"primary_intent", "constraints", "search_history"}
        
        # Log compression
        logger.info(
            f"Memory compressed for session {session_id}",
            old_messages_count=len(old_messages),
            kept_messages=self.RECENT_WINDOW,
            tokens_saved=estimate_tokens(old_messages)
        )
    
    async def get_context_for_query(
        self,
        session_id: UUID
    ) -> dict:
        """Get full context (recent + summary)"""
        
        memory = await self._get_memory(session_id)
        
        return {
            "recent": memory.recent_messages,
            "summary": memory.context_summary,
            "constraints": memory.compressed_context.get("constraints", {}),
            "intent_history": memory.compressed_context.get("search_history", [])
        }
    
    async def archive_session(
        self,
        session_id: UUID,
        reason: str = "timeout"
    ):
        """Archive session to cold storage"""
        
        memory = await self._get_memory(session_id)
        
        # Move to archive table
        archive = ConversationArchive(
            session_id=session_id,
            summary=memory.context_summary,
            total_messages=len(memory.recent_messages),
            duration_minutes=calculate_session_duration(session_id),
            archived_at=datetime.utcnow(),
            reason=reason
        )
        
        db.session.add(archive)
        memory.archived_at = datetime.utcnow()
        memory.archival_reason = reason
        
        await db.session.commit()
```

---

## 4. RAG SEPARATION (CRM vs Knowledge Base)

### 4.1 Strict Data Source Separation

```
┌─────────────────────────────────────────────────────────┐
│ RAG DATA SOURCES (Separated)                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ① LIVE CRM DATA (Real-time, always current)           │
│    Source: Leadrat API → chatbot_crm DB                │
│    Tables: leads, properties, projects                 │
│    Sync: Every 60 minutes (incremental)                │
│    TTL: Cache 30-60 minutes                            │
│    Use case: "show me hot leads" (specific data)       │
│    ✓ Fast (indexed queries)                            │
│    ✓ Always fresh (synced hourly)                      │
│    ✗ No semantic understanding                         │
│    ✗ Limited to structured data                        │
│                                                         │
│ ② KNOWLEDGE BASE (Static, reference)                  │
│    Source: Manual documents (PDFs, markdown)           │
│    Content: Legal, FAQ, brochures, policies            │
│    Vector DB: Pinecone / Weaviate / Milvus            │
│    Sync: Manual or on-demand                           │
│    TTL: Cache 7 days (stable)                          │
│    Use case: "What's your refund policy?" (reference)  │
│    ✓ Semantic understanding                            │
│    ✓ Flexible                                          │
│    ✗ Can become stale                                  │
│    ✗ Slow (vector search ~500ms)                       │
│                                                         │
│ ③ DO NOT MIX                                           │
│    ✗ Using stale embeddings for live data searches     │
│    ✗ Embedding lead data and using for property search │
│    ✗ Vector search for "hot leads" (use indexed query) │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Query Router: CRM vs Knowledge

```python
# backend-ai/app/services/rag_router.py

class RAGRouter:
    """Route query to CRM or Knowledge Base"""
    
    async def route_query(
        self,
        tenant_id: UUID,
        user_message: str,
        intent: str
    ) -> Dict[str, Any]:
        """
        Determine data source for query
        """
        
        # Detect query type
        if self._is_crm_query(user_message, intent):
            # "Show hot leads" → Use CRM local DB
            return await self._route_to_crm_search(
                tenant_id, user_message
            )
        
        elif self._is_knowledge_query(user_message, intent):
            # "What's your refund policy?" → Use Knowledge Base
            return await self._route_to_knowledge_base(
                tenant_id, user_message
            )
        
        else:
            # Fallback: Ask clarifying question
            return {
                "response": "I can help with property searches or policy questions. What would you like?",
                "requires_clarification": True
            }
    
    def _is_crm_query(self, message: str, intent: str) -> bool:
        """Detect CRM data queries"""
        
        crm_keywords = [
            "show", "find", "list", "search",
            "leads", "properties", "projects",
            "available", "location", "price",
            "status", "hot", "warm", "new",
            "contact", "phone", "email"
        ]
        
        message_lower = message.lower()
        return any(kw in message_lower for kw in crm_keywords)
    
    def _is_knowledge_query(self, message: str, intent: str) -> bool:
        """Detect Knowledge Base queries"""
        
        kb_keywords = [
            "policy", "refund", "cancellation",
            "how do", "what is", "tell me about",
            "explain", "legal", "terms",
            "process", "procedure", "requirement"
        ]
        
        message_lower = message.lower()
        return any(kw in message_lower for kw in kb_keywords)
    
    async def _route_to_crm_search(
        self,
        tenant_id: UUID,
        message: str
    ):
        """Search live CRM data (local DB)"""
        
        # Extract entities
        entities = await entity_extractor.extract(message)
        
        # Build structured query
        query = build_search_query(entities)
        
        # Execute (indexed, fast)
        results = await hybrid_search_service.search(
            tenant_id,
            query
        )
        
        return {
            "source": "CRM_DB",
            "data": results,
            "response": format_response(results),
            "filters_applied": query.filters
        }
    
    async def _route_to_knowledge_base(
        self,
        tenant_id: UUID,
        message: str
    ):
        """Search knowledge base (vector DB)"""
        
        # Embed query
        query_embedding = await embedding_service.embed(message)
        
        # Vector search (semantic)
        kb_results = await vector_db.search(
            query_embedding,
            top_k=3
        )
        
        # Format with LLM
        response = await llm_service.generate_response(
            message=message,
            context=kb_results,
            intent="knowledge_answer"
        )
        
        return {
            "source": "KNOWLEDGE_BASE",
            "documents": kb_results,
            "response": response,
            "confidence": calculate_confidence(kb_results)
        }
```

---

## 5. SYNC CONFLICT RESOLUTION

### 5.1 Source-of-Truth Policy

```
┌─────────────────────────────────────────────────────────┐
│ SYNC CONFLICT RESOLUTION STRATEGY                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ RULE: Remote Wins (Leadrat is source of truth)        │
│                                                         │
│ Scenario 1: Field Updated in Both Places              │
│ ├─ Leadrat: name = "John Doe", updated_at = T1        │
│ ├─ Local: name = "John Smith", updated_at = T0        │
│ └─ Decision: ACCEPT Leadrat (T1 > T0)                 │
│                                                         │
│ Scenario 2: Deleted in Leadrat, Still Local            │
│ ├─ Leadrat: MISSING (deleted)                          │
│ ├─ Local: EXISTS with is_deleted = false              │
│ └─ Decision: SOFT DELETE locally (is_deleted = true)   │
│    Note: Don't physically delete, preserve audit trail  │
│                                                         │
│ Scenario 3: Created Locally, Not in Leadrat            │
│ ├─ Leadrat: MISSING (never synced)                    │
│ ├─ Local: EXISTS (manual entry?)                      │
│ └─ Decision: KEEP if leadrat_id NULL, mark for review  │
│    Note: May be legitimate local data                  │
│                                                         │
│ Scenario 4: Same timestamp (conflict)                  │
│ ├─ Leadrat: updated_at = 2026-04-27 10:00:00         │
│ ├─ Local: updated_at = 2026-04-27 10:00:00           │
│ └─ Decision: ACCEPT Remote (conservative approach)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Conflict Detection & Handling

```python
# backend-ai/app/services/sync_service.py

class SyncConflictResolver:
    """Detect and resolve sync conflicts"""
    
    async def resolve_conflict(
        self,
        local_record: dict,
        remote_record: dict,
        entity_type: str  # lead, property, project
    ) -> dict:
        """
        Resolve conflict between local and remote records
        Returns: winning record
        """
        
        # Extract timestamps
        local_ts = parse_datetime(local_record.get("updated_at"))
        remote_ts = parse_datetime(remote_record.get("updated_at"))
        
        # RULE 1: Newer timestamp wins
        if remote_ts > local_ts:
            logger.info(
                f"Conflict: Remote newer (by {(remote_ts - local_ts).total_seconds()}s)",
                entity_type=entity_type,
                id=remote_record.get("id")
            )
            return remote_record  # USE REMOTE
        
        # RULE 2: Same timestamp → Remote wins (conservative)
        if remote_ts == local_ts:
            logger.warning(
                f"Conflict: Same timestamp, using remote",
                entity_type=entity_type,
                id=remote_record.get("id")
            )
            return remote_record  # USE REMOTE
        
        # RULE 3: Local newer → Keep local, log warning
        if local_ts > remote_ts:
            logger.warning(
                f"Conflict: Local newer (by {(local_ts - remote_ts).total_seconds()}s)",
                entity_type=entity_type,
                id=local_record.get("id"),
                action="KEEP_LOCAL"
            )
            # Alert admin if significant lag
            if (local_ts - remote_ts).total_seconds() > 3600:  # > 1 hour
                alert_admin(
                    f"Local data is significantly newer than remote: {entity_type}",
                    entity_id=local_record.get("id"),
                    lag_seconds=(local_ts - remote_ts).total_seconds()
                )
            return local_record  # KEEP LOCAL
    
    async def detect_soft_delete(
        self,
        entity_id: str,
        entity_type: str,
        last_seen_in_remote: datetime
    ) -> bool:
        """
        Detect if entity was deleted in Leadrat
        
        Returns: True if should be soft-deleted locally
        """
        
        # Check if entity appears in latest remote sync
        # If missing for 3 consecutive syncs, mark as deleted
        
        sync_count = await db.query(DataSyncLog).filter(
            DataSyncLog.entity_type == entity_type,
            DataSyncLog.status == "success",
            DataSyncLog.completed_at > (datetime.utcnow() - timedelta(days=1))
        ).count()
        
        # If missing from recent syncs, it was likely deleted
        if sync_count >= 3:  # Missing from 3+ recent syncs
            return True
        
        return False
```

### 5.3 Sync Lag Tolerance

```python
# backend-ai/app/config.py

class SyncConfig:
    """Sync timing and tolerance settings"""
    
    # Tolerance for stale data
    ACCEPTABLE_SYNC_LAG = {
        "lead": 3600,           # 1 hour for leads
        "property": 7200,       # 2 hours for properties (more stable)
        "project": 86400,       # 1 day for projects (very stable)
    }
    
    # If data is older than this, warn user
    STALE_DATA_WARNING_THRESHOLD = {
        "lead": 14400,          # 4 hours
        "property": 28800,      # 8 hours
        "project": 172800,      # 2 days
    }
    
    # Search quality penalty for stale data
    APPLY_STALE_DATA_WARNING = True
    STALE_DATA_MESSAGE = (
        "This data was last updated {hours} hours ago. "
        "For live info, try refreshing."
    )
```

---

## 6. SECURITY & COMPLIANCE

### 6.1 Encryption Strategy

```python
# backend-ai/app/utils/encryption.py

from cryptography.fernet import Fernet
import os

class EncryptionService:
    """Encrypt sensitive data at rest"""
    
    def __init__(self):
        # Load encryption key from environment
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise ValueError("ENCRYPTION_KEY must be set in .env")
        self.cipher = Fernet(key)
    
    def encrypt_pii(self, plaintext: str) -> str:
        """Encrypt PII before storing"""
        return self.cipher.encrypt(plaintext.encode()).decode()
    
    def decrypt_pii(self, ciphertext: str) -> str:
        """Decrypt PII when needed"""
        return self.cipher.decrypt(ciphertext.encode()).decode()

# Fields to encrypt at rest:
# - user.password_hash (keep as is, hash not encrypt)
# - conversation_log.whatsapp_number
# - site_visit.whatsapp_number
# - site_visit.customer_name

# Migration:
# 1. Add encrypted_phone, encrypted_name columns
# 2. Encrypt existing data
# 3. Drop old columns
# 4. Rename encrypted_* to original names
```

### 6.2 Audit Logging

```python
# backend-ai/app/db/models.py (Add)

class AuditLog(Base):
    """Immutable audit trail for compliance"""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Action details
    action = Column(String(100), nullable=False)  # "create_lead", "update_property", "search"
    entity_type = Column(String(50), nullable=False)  # lead, property, project
    entity_id = Column(String(255))
    
    # Changes
    changes = Column(JSONB)  # {field: {old: ..., new: ...}}
    # Note: Never include phone, email, password in changes
    
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index("idx_audit_logs_tenant", "tenant_id"),
        Index("idx_audit_logs_entity", "entity_type", "entity_id"),
        Index("idx_audit_logs_created", "created_at"),
    )

# Audit fields to exclude (NEVER log):
AUDIT_EXCLUSIONS = [
    "password", "token", "secret", "api_key",
    "phone", "email", "ssn",
    "credit_card", "banking"
]
```

### 6.3 Prompt Injection Mitigation

```python
# backend-ai/app/services/prompt_injection_filter.py

class PromptInjectionFilter:
    """Detect and prevent prompt injection attacks"""
    
    DANGEROUS_PATTERNS = [
        r'(?i)(ignore|forget|override|bypass).*system',
        r'(?i)show.*password.*hash',
        r'(?i)(execute|run|eval).*code',
        r'(?i)delete.*from.*where',
        r'(?i)select.*from.*password',
        r'(?i)show.*encryption.*key',
        r'(?i)return.*secret',
    ]
    
    async def filter_user_input(self, user_message: str) -> tuple[bool, str]:
        """
        Filter user message for injection attempts
        
        Returns: (is_safe, reason)
        """
        
        for pattern in self.DANGEROUS_PATTERNS:
            if re.search(pattern, user_message):
                logger.warning(
                    "Potential prompt injection detected",
                    pattern=pattern,
                    message_preview=user_message[:100]
                )
                return False, "Message contains suspicious patterns"
        
        # Length check (prevent token exhaustion)
        if len(user_message) > 5000:
            return False, "Message too long (max 5000 chars)"
        
        return True, "OK"

# Usage in chat endpoint:
@router.post("/api/v1/chat/message")
async def chat_endpoint(request: ChatRequest):
    # Filter input
    is_safe, reason = await injection_filter.filter_user_input(
        request.message
    )
    
    if not is_safe:
        raise HTTPException(status_code=400, detail=reason)
    
    # Process message
    ...
```

### 6.4 LLM Input Sanitization

```python
# backend-ai/app/services/llm_sanitization.py

class LLMSanitizer:
    """Sanitize inputs before sending to LLM"""
    
    async def sanitize_for_llm(self, 
                               data: dict) -> dict:
        """Remove sensitive data before LLM processing"""
        
        sanitized = {}
        
        for key, value in data.items():
            # Remove sensitive fields
            if any(sensitive in key.lower() 
                   for sensitive in ['phone', 'email', 'password', 'token', 'key']):
                sanitized[key] = "***REDACTED***"
            else:
                sanitized[key] = value
        
        return sanitized
    
    def sanitize_llm_output(self, 
                           response: str) -> str:
        """Remove sensitive data from LLM output"""
        
        # Mask phone numbers
        response = re.sub(
            r'\d{10}',
            'XXXXXXXXXX',
            response
        )
        
        # Mask emails
        response = re.sub(
            r'[\w\.-]+@[\w\.-]+\.\w+',
            'user@example.com',
            response
        )
        
        return response
```

### 6.5 Rate Limiting

```python
# backend-ai/app/middleware/rate_limiter.py

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter

# Rate limits by endpoint
RATE_LIMITS = {
    "search": "50/minute",          # 50 searches/minute per user
    "chat": "30/minute",            # 30 messages/minute
    "sync_trigger": "5/hour",       # 5 manual syncs/hour per tenant
    "login": "10/minute",           # 10 login attempts/minute
}

@app.post("/api/v1/search/properties")
@limiter.limit(RATE_LIMITS["search"])
async def search_properties(request: Request):
    # Rate limited endpoint
    pass

# Per-session rate limiting
@app.post("/api/v1/chat/message")
async def chat_message(
    request: ChatRequest,
    session: AsyncSession = Depends(get_session)
):
    # Get session_id from request
    session_id = request.session_id
    
    # Check session-specific rate limit
    message_count = await db.query(ConversationLog).filter(
        ConversationLog.session_id == session_id,
        ConversationLog.created_at > (datetime.utcnow() - timedelta(minutes=1))
    ).count()
    
    if message_count > 10:  # Max 10 messages/minute per session
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded for this session"
        )
    
    # Process message
    pass
```

---

## 7. OBSERVABILITY & MONITORING

### 7.1 Metrics Dashboard

```
┌──────────────────────────────────────────────────────────┐
│ REAL-TIME METRICS DASHBOARD (Grafana)                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [System Health]                                          │
│ ├─ Database: 2ms avg latency ✓                          │
│ ├─ Redis: 1ms avg latency ✓                             │
│ ├─ Leadrat API: 250ms avg latency ✓                     │
│ ├─ Ollama: 800ms avg latency ✓                          │
│                                                          │
│ [Search Performance]                                     │
│ ├─ Avg search time: 120ms (target: <500ms) ✓           │
│ ├─ P95 search time: 350ms                               │
│ ├─ Cache hit rate: 72% (target: >70%) ✓                │
│ ├─ Failed searches: 0.2% (target: <1%) ✓               │
│                                                          │
│ [Chat Metrics]                                           │
│ ├─ Avg message latency: 1200ms                          │
│ ├─ Entity extraction accuracy: 92% ✓                    │
│ ├─ Intent detection accuracy: 88% ✓                    │
│ ├─ User satisfaction: 4.2/5.0                           │
│                                                          │
│ [Sync Status]                                            │
│ ├─ Last sync: 5 mins ago ✓                              │
│ ├─ Next sync: in 55 mins                                │
│ ├─ Leads synced: 1,245 (10 new, 5 updated)              │
│ ├─ Properties synced: 3,456 (25 new, 12 updated)        │
│ ├─ Sync error rate: 0.1% (target: <1%) ✓               │
│                                                          │
│ [Cache Stats]                                            │
│ ├─ Total keys: 12,345                                   │
│ ├─ Memory used: 245 MB / 1 GB                           │
│ ├─ Eviction rate: 2/min (normal)                        │
│                                                          │
│ [Errors (Last Hour)]                                     │
│ ├─ 5xx errors: 2 (API rate limit, auto-recovered)      │
│ ├─ 4xx errors: 23 (validation, normal)                  │
│ ├─ Timeout errors: 0                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Structured Logging

```python
# backend-ai/app/utils/logger.py

import structlog
import logging

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Logging guidelines (NEVER log):
LOG_EXCLUSIONS = {
    "password", "token", "secret", "api_key",
    "phone", "email", "password_hash",
    "credit_card", "ssn"
}

# Log search operation
logger.info(
    "search_executed",
    entity_type="property",
    tenant_id="***",  # Hash or mask
    filters_count=3,
    results_count=15,
    execution_ms=145,
    cache_hit=True,
    # NEVER: filter_values=filters  (may contain phone, email, etc.)
)
```

### 7.3 Distributed Tracing

```python
# backend-ai/app/middleware/tracing.py

from opentelemetry import trace, metrics
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource

# Setup Jaeger tracing
jaeger_exporter = JaegerExporter(
    agent_host_name="localhost",
    agent_port=6831,
)

# Every request gets a trace ID
@app.middleware("http")
async def add_tracing(request: Request, call_next):
    # Generate trace ID
    trace_id = request.headers.get("X-Trace-ID", uuid.uuid4().hex)
    request.state.trace_id = trace_id
    
    # Add to response headers
    response = await call_next(request)
    response.headers["X-Trace-ID"] = trace_id
    
    return response

# Trace key operations
@tracer.start_as_current_span("search_properties")
async def search_properties(tenant_id: UUID, filters: dict):
    with tracer.start_as_current_span("entity_extraction"):
        entities = await extract_entities(filters)
    
    with tracer.start_as_current_span("database_query"):
        results = await db.query(Property).filter(...).all()
    
    with tracer.start_as_current_span("format_response"):
        formatted = format_response(results)
    
    return formatted
```

### 7.4 AI Latency Monitoring

```python
# backend-ai/app/middleware/ai_monitoring.py

class AILatencyMonitor:
    """Monitor LLM and Ollama latencies"""
    
    async def monitor_ollama_latency(
        self,
        operation: str,  # entity_extraction, summary_generation
        latency_ms: float
    ):
        # Record metric
        metrics.record_histogram(
            "ollama_latency_ms",
            latency_ms,
            attributes={
                "operation": operation,
                "model": "llama2"
            }
        )
        
        # Alert if slow
        if latency_ms > 2000:  # > 2 seconds
            logger.warning(
                "slow_ollama_operation",
                operation=operation,
                latency_ms=latency_ms,
                threshold_ms=2000
            )
    
    async def monitor_llm_generation(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: float
    ):
        # Record token usage
        metrics.record_histogram(
            "llm_tokens_used",
            prompt_tokens + completion_tokens,
            attributes={"type": "total"}
        )
        
        # Record latency
        metrics.record_histogram(
            "llm_latency_ms",
            latency_ms
        )
        
        # Log expensive operations
        if prompt_tokens > 2000:
            logger.info(
                "expensive_llm_operation",
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens
            )
```

---

## 8. CHAT ORCHESTRATION LAYER

### 8.1 Orchestration Architecture

```
┌─────────────────────────────────────────────────────────┐
│ CHAT ORCHESTRATION LAYER (New Service)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ User Message: "Show hot leads in Whitefield under 50L"│
│         ↓                                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Intent Agent                                     │   │
│ │ ├─ Detect: lead_search                          │   │
│ │ ├─ Confidence: 0.95                             │   │
│ │ └─ Route: Entity Extractor → Search Orchestrator│   │
│ └─────────────────────────────────────────────────┘   │
│         ↓                                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Context Resolver                                │   │
│ │ ├─ Load session context                         │   │
│ │ ├─ Resolve pronouns (if any)                    │   │
│ │ ├─ Apply previous filters                       │   │
│ │ └─ Merge with current request                   │   │
│ └─────────────────────────────────────────────────┘   │
│         ↓                                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Entity Extraction                               │   │
│ │ ├─ Extract: {status: "hot", location: "..."}   │   │
│ │ ├─ Normalize: Whitefield → lookup table         │   │
│ │ └─ Validate: Against allowed values             │   │
│ └─────────────────────────────────────────────────┘   │
│         ↓                                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Search Orchestrator                             │   │
│ │ ├─ Check cache                                  │   │
│ │ ├─ Route: CRM local DB vs Knowledge Base        │   │
│ │ ├─ Execute search                               │   │
│ │ └─ Return results with metadata                 │   │
│ └─────────────────────────────────────────────────┘   │
│         ↓                                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Result Formatter                                │   │
│ │ ├─ Shape data into response cards               │   │
│ │ ├─ Add rich metadata (images, ratings, etc.)    │   │
│ │ └─ Humanize text                                │   │
│ └─────────────────────────────────────────────────┘   │
│         ↓                                               │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Suggestion Generator                            │   │
│ │ ├─ Based on results: "Expand budget range"      │   │
│ │ ├─ Based on history: "Similar to your search"   │   │
│ │ ├─ Based on trends: "Popular in this area"      │   │
│ │ └─ Max 3 suggestions                            │   │
│ └─────────────────────────────────────────────────┘   │
│         ↓                                               │
│ Response to Frontend with cards + suggestions
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Orchestrator Service Implementation

```python
# backend-ai/app/services/chat_orchestrator.py

class ChatOrchestrator:
    """Central orchestration for all chat operations"""
    
    def __init__(self):
        self.intent_agent = IntentDetectionAgent()
        self.context_resolver = ContextResolver()
        self.entity_extractor = EntityExtractor()
        self.search_orchestrator = SearchOrchestrator()
        self.result_formatter = ResultFormatter()
        self.suggestion_generator = SuggestionGenerator()
    
    async def process_message(
        self,
        tenant_id: UUID,
        session_id: UUID,
        user_message: str
    ) -> dict:
        """
        Orchestrate entire chat flow
        
        Returns: Formatted response with suggestions
        """
        
        # STEP 1: Detect intent
        intent_result = await self.intent_agent.detect(user_message)
        intent = intent_result["intent"]
        confidence = intent_result["confidence"]
        
        if confidence < 0.6:
            # Low confidence → ask clarifying question
            return await self._ask_clarification(user_message)
        
        # STEP 2: Resolve context
        context = await self.context_resolver.get_context(
            session_id,
            previous_intent=self._get_previous_intent(session_id)
        )
        
        # STEP 3: Extract entities
        entities = await self.entity_extractor.extract(
            user_message,
            context=context
        )
        
        # STEP 4: Search (route to CRM or KB)
        search_result = await self.search_orchestrator.search(
            tenant_id=tenant_id,
            intent=intent,
            entities=entities,
            context=context
        )
        
        # STEP 5: Format results
        formatted = await self.result_formatter.format(
            search_result,
            intent=intent
        )
        
        # STEP 6: Generate suggestions
        suggestions = await self.suggestion_generator.generate(
            search_result=search_result,
            entities=entities,
            context=context,
            intent=intent
        )
        
        # STEP 7: Log interaction
        await self._log_interaction(
            session_id,
            intent,
            entities,
            search_result,
            formatted
        )
        
        return {
            "response": formatted["message"],
            "cards": formatted.get("cards", []),
            "suggestions": suggestions,
            "intent": intent,
            "confidence": confidence,
            "source": search_result["source"],
            "filters_applied": entities
        }
    
    async def _ask_clarification(self, message: str) -> dict:
        """Ask user to clarify intent"""
        return {
            "response": "I'm not sure what you're looking for. Are you searching for properties, leads, or projects?",
            "cards": [],
            "suggestions": [
                "Show me properties",
                "Show me leads",
                "Show me projects"
            ],
            "requires_clarification": True
        }
    
    async def _log_interaction(
        self,
        session_id: UUID,
        intent: str,
        entities: dict,
        search_result: dict,
        formatted: dict
    ):
        """Log for analytics"""
        log = ConversationLog(
            session_id=session_id,
            role="assistant",
            message=formatted["message"],
            intent=intent,
            extracted_entities=entities,
            response_source=search_result["source"]
        )
        db.session.add(log)
        await db.session.commit()
```

---

## 9. FLOATING CHATBOT UX

### 9.1 UX Features

```
┌──────────────────────────────────────────┐
│ Floating Chatbot Widget                  │
├──────────────────────────────────────────┤
│                                          │
│ [Unread indicator: 1]                    │
│ ┌──────────────────────────────────────┐│
│ │ Real Estate AI Assistant             ││
│ ├──────────────────────────────────────┤│
│ │ Bot: Here are 5 properties...        ││
│ │                      [typing ...]    ││
│ │                                      ││
│ │ [Property Card] [Property Card]      ││
│ │ [See all 5]                          ││
│ ├──────────────────────────────────────┤│
│ │ [Type message...        ] [Send]     ││
│ │ Reconnecting... ⚠️  [Retry]          ││
│ ├──────────────────────────────────────┤│
│ │ [_] [☰] [×]                         ││
│ │ Minimize  Menu  Close                ││
│ └──────────────────────────────────────┘│
│                                          │
│ Mobile (responsive):                     │
│ ├─ Full-screen modal (not floating)      │
│ ├─ Better touch targets                  │
│ ├─ Keyboard-aware                        │
│ └─ Bottom sheet behavior                 │
│                                          │
└──────────────────────────────────────────┘
```

### 9.2 Implementation Details

```tsx
// frontend/components/floating-chatbot/FloatingChatbot.tsx

'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [isTyping, setIsTyping] = useState(false);
  
  const sessionId = useSessionId();
  const { send, receive, connected } = useWebSocket(
    `/ws/chat/${sessionId}`,
    {
      onMessage: handleMessage,
      onConnect: () => setConnectionStatus('connected'),
      onDisconnect: () => setConnectionStatus('disconnected'),
      autoReconnect: true,
      reconnectInterval: 5000
    }
  );
  
  async function handleMessage(data: any) {
    // Increment unread if window is minimized
    if (isMinimized || !isOpen) {
      setUnreadCount(prev => prev + 1);
    }
    
    setIsTyping(false);
    // Add message to UI
  }
  
  function handleSendMessage(message: string) {
    if (!connected) {
      // Queue message, will send on reconnect
      queueMessageForRetry(message);
      return;
    }
    
    setIsTyping(true);
    send({
      type: 'message',
      content: message,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
  }
  
  function handleOpen() {
    setIsOpen(true);
    setUnreadCount(0);  // Clear unread when opened
  }
  
  useEffect(() => {
    // Restore session when reopening
    if (isOpen && !isMinimized) {
      restoreSessionMessages(sessionId);
    }
  }, [isOpen]);
  
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${!isMobile ? 'w-96' : 'w-full'}`}>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="relative bg-gradient-to-r from-cyan-500 to-purple-500
                     rounded-full w-14 h-14 flex items-center justify-center
                     shadow-lg hover:shadow-xl transition-all
                     text-white"
        >
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 
                           text-white text-xs rounded-full 
                           w-6 h-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <ChatBubbleIcon />
        </button>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div className={`bg-white rounded-lg shadow-2xl flex flex-col
                       ${!isMobile ? 'h-96' : 'fixed inset-0 bottom-0'}
                       animate-slide-up`}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-purple-500
                          text-white p-4 flex justify-between items-center
                          rounded-t-lg">
            <h3>Real Estate AI Assistant</h3>
            <div className="flex gap-2 items-center">
              {/* Connection Status */}
              <span className={`text-xs ${
                connectionStatus === 'connected' ? 'text-green-200' : 'text-yellow-200'
              }`}>
                {connectionStatus === 'disconnected' && '⚠ Reconnecting...'}
                {connectionStatus === 'connected' && '● Connected'}
              </span>
              
              <button onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? '□' : '_'}
              </button>
              <button onClick={() => setIsOpen(false)}>×</button>
            </div>
          </div>
          
          {/* Messages */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-xs p-3 rounded-lg
                                ${msg.role === 'user' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-200 text-black'}`}>
                    {msg.content}
                  </div>
                  
                  {/* Cards (for bot messages) */}
                  {msg.cards && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {msg.cards.slice(0, 2).map(card => (
                        <PropertyCard key={card.id} card={card} />
                      ))}
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {msg.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.suggestions.map((sug, j) => (
                        <button
                          key={j}
                          onClick={() => handleSendMessage(sug)}
                          className="text-xs bg-white border border-gray-300
                                   px-2 py-1 rounded hover:bg-gray-100"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="mb-4">
                  <div className="inline-block bg-gray-200 p-3 rounded-lg">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Input */}
          {!isMinimized && (
            <div className="border-t p-4 bg-white rounded-b-lg">
              {connectionStatus === 'disconnected' && (
                <div className="mb-2 text-xs text-yellow-600 flex justify-between">
                  <span>Offline - Messages will send when connected</span>
                  <button 
                    onClick={() => reconnect()}
                    className="underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about properties..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 border border-gray-300 rounded px-3 py-2
                           focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  className="bg-cyan-500 text-white px-4 py-2 rounded
                           hover:bg-cyan-600"
                  disabled={!connected}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 9.3 Session Restore

```typescript
// frontend/lib/session-restore.ts

export async function restoreSessionMessages(
  sessionId: string
): Promise<Message[]> {
  """
  When user opens chatbot, restore previous messages
  """
  
  try {
    const response = await fetch(
      `/api/v1/chat/session/${sessionId}/history`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'X-Session-ID': sessionId
        }
      }
    );
    
    const data = await response.json();
    
    return data.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
  } catch (error) {
    // Fallback: load from localStorage
    const cached = localStorage.getItem(`chat_${sessionId}`);
    return cached ? JSON.parse(cached) : [];
  }
}
```

---

## 10. UNIFIED API RESPONSE CONTRACT

### 10.1 Standard Response Format

```python
# backend-ai/app/schemas/responses.py

from pydantic import BaseModel
from typing import Any, List, Optional

class ApiResponse(BaseModel):
    """
    Unified response contract for ALL APIs
    
    Usage:
    return ApiResponse(
        success=True,
        data=results,
        message="Found 5 properties",
        meta={"page": 1, "total": 45},
        suggestions=["Try nearby areas", "Increase budget"]
    )
    """
    
    # Status
    success: bool
    
    # Primary content
    data: Optional[Any] = None
    
    # Human message
    message: str
    
    # Metadata
    meta: Optional[dict] = None
    # {
    #   "page": 1,
    #   "size": 10,
    #   "total": 45,
    #   "pages": 5,
    #   "execution_ms": 145,
    #   "source": "local_db",
    #   "cache_hit": True
    # }
    
    # Smart suggestions
    suggestions: Optional[List[str]] = None
    # [
    #   "Try nearby areas",
    #   "Increase budget range",
    #   "Filter by possession date"
    # ]
    
    # Error info (only if success=False)
    error: Optional[dict] = None
    # {
    #   "code": "INVALID_FILTER",
    #   "message": "Location 'XYZ' not found",
    #   "details": {"invalid_field": "location"}
    # }
    
    # Request tracing
    request_id: Optional[str] = None

# Example successful response
{
  "success": true,
  "data": [
    {"id": "uuid", "title": "3BHK Apartment", "price": 6000000, ...}
  ],
  "message": "Found 5 properties in Whitefield",
  "meta": {
    "page": 1,
    "total": 45,
    "execution_ms": 120,
    "cache_hit": true,
    "source": "local_db"
  },
  "suggestions": [
    "Expand to nearby areas",
    "Filter by possession type",
    "View on map"
  ],
  "request_id": "req-uuid-12345"
}

# Example error response
{
  "success": false,
  "data": null,
  "message": "Invalid filter value",
  "error": {
    "code": "INVALID_LOCATION",
    "message": "Location 'Xyz' not recognized",
    "details": {
      "provided": "Xyz",
      "suggestions": ["Bangalore", "Whitefield", "Koramangala"]
    }
  },
  "request_id": "req-uuid-12345"
}
```

### 10.2 Response Formatters by Endpoint Type

```python
# All endpoints use same contract

@router.post("/api/v1/search/properties")
async def search_properties(
    request: SearchPropertyRequest,
    session: AsyncSession = Depends(get_session)
) -> ApiResponse:
    try:
        results = await search_service.search(
            request.filters
        )
        
        suggestions = await generate_suggestions(
            results,
            request.filters
        )
        
        return ApiResponse(
            success=True,
            data=results,
            message=f"Found {len(results)} properties",
            meta={
                "page": request.page,
                "size": request.size,
                "total": len(results),
                "execution_ms": 145,
                "source": "local_db",
                "cache_hit": False
            },
            suggestions=suggestions
        )
        
    except ValidationError as e:
        return ApiResponse(
            success=False,
            message="Invalid request",
            error={
                "code": "VALIDATION_ERROR",
                "details": e.errors()
            }
        )
    
    except Exception as e:
        logger.error("search_error", exc_info=True)
        return ApiResponse(
            success=False,
            message="Search failed",
            error={
                "code": "INTERNAL_ERROR",
                "message": "Please try again"
            }
        )
```

---

## 11. ADVANCED SYNC STRATEGY

### 11.1 Event-Based Sync (Instead of Time-Based Only)

```
┌─────────────────────────────────────────────────────────┐
│ MULTI-MODE SYNC STRATEGY                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ MODE 1: WEBHOOK/EVENT-BASED (Real-time, if available)  │
│ └─ Leadrat sends webhook when data changes              │
│    POST /api/v1/webhooks/leadrat/lead-updated          │
│    └─ Trigger immediate sync for that record           │
│    └─ Latency: < 10 seconds                            │
│                                                         │
│ MODE 2: HOURLY INCREMENTAL (Fallback, regular updates) │
│ └─ Every hour: fetch only changed records              │
│    WHERE updated_at > last_sync_timestamp              │
│    └─ Latency: < 1 hour                                │
│                                                         │
│ MODE 3: 6-HOUR FULL SYNC (Catch-all, off-peak)        │
│ └─ Fetch ALL records, full reconciliation              │
│    Runs: 2 AM, 8 AM, 2 PM, 8 PM (off-peak hours)       │
│    └─ Detects: deletions, mass updates, etc.           │
│                                                         │
│ MODE 4: ON-DEMAND (User-triggered)                     │
│ └─ Admin can trigger manual sync                       │
│    GET /admin/sync/manual?entity=lead                  │
│    └─ Immediate refresh of specific entity             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Webhook Handler

```python
# backend-ai/app/routers/webhooks.py

from fastapi import APIRouter, Request, Header
import hmac
import hashlib

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])

LEADRAT_WEBHOOK_SECRET = os.getenv("LEADRAT_WEBHOOK_SECRET")

@router.post("/leadrat/lead-updated")
async def on_lead_updated(
    request: Request,
    x_leadrat_signature: str = Header(None)
):
    """
    Webhook: Lead updated in Leadrat
    
    Leadrat sends:
    {
      "event": "lead.updated",
      "data": {
        "id": "lead-123",
        "name": "John Doe",
        "updated_at": "2026-04-27T10:30:00Z"
      }
    }
    """
    
    # Verify webhook signature
    body = await request.body()
    expected_signature = hmac.new(
        LEADRAT_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(x_leadrat_signature, expected_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = await request.json()
    
    # Trigger immediate sync for this record
    try:
        lead_id = payload["data"]["id"]
        tenant_id = payload["data"]["tenant_id"]
        
        await sync_service.sync_lead_by_id(
            tenant_id=tenant_id,
            leadrat_id=lead_id
        )
        
        logger.info(
            "lead_synced_via_webhook",
            lead_id=lead_id,
            latency_ms=calculate_latency(payload["received_at"])
        )
        
        return {"status": "synced"}
        
    except Exception as e:
        logger.error("webhook_sync_failed", exc_info=True)
        return {"status": "error", "message": str(e)}
```

### 11.3 Sync Frequency Configuration

```python
# backend-ai/app/config.py

class SyncConfig:
    """Configurable sync frequencies"""
    
    # Time-based syncs
    INCREMENTAL_SYNC_INTERVAL_MINUTES = 60  # Every hour
    FULL_SYNC_INTERVAL_HOURS = 6  # Every 6 hours
    
    # Webhook support
    WEBHOOK_ENABLED = True
    WEBHOOK_TIMEOUT_SECONDS = 30
    
    # On-demand constraints
    MIN_INTERVAL_BETWEEN_MANUAL_SYNCS_SECONDS = 300  # 5 min cooldown
    
    # Sync limits (prevent hammering)
    MAX_SYNC_DURATION_MINUTES = 30
    MAX_CONCURRENT_SYNCS = 2
    
    # Retry strategy
    SYNC_RETRY_ATTEMPTS = 3
    SYNC_RETRY_BACKOFF_SECONDS = [5, 15, 60]  # exponential backoff
```

---

## 12. QUERY INTERPRETATION LAYER

### 12.1 Query Tree Construction

```
User Input: "show hot leads in Whitefield with budget under 50L"
    ↓
┌─────────────────────────────────────────────────────────┐
│ QUERY INTERPRETATION → STRUCTURED TREE                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Raw: "show hot leads in Whitefield with budget < 50L"  │
│    ↓                                                    │
│ STEP 1: Extract predicates                             │
│ ├─ Action: "show"                                      │
│ ├─ Entity: "leads"                                     │
│ ├─ Filters:                                            │
│ │  ├─ status = "hot"                                   │
│ │  ├─ location = "Whitefield"                          │
│ │  └─ budget_max < 5000000                             │
│    ↓                                                    │
│ STEP 2: Normalize values                               │
│ ├─ "Whitefield" → lookup(city_name)                    │
│ │  → {id: "uuid", name: "Whitefield", type: "locality"}│
│ ├─ "50L" → 5000000                                     │
│ ├─ "hot" → lookup(status_enum)                         │
│ │  → {value: "hot", label: "Hot Lead"}                 │
│    ↓                                                    │
│ STEP 3: Build query tree (JSON)                        │
│ {                                                      │
│   "entity": "lead",                                    │
│   "action": "search",                                  │
│   "filters": {                                         │
│     "status": {                                        │
│       "operator": "=",                                 │
│       "value": "hot",                                  │
│       "confidence": 0.98                               │
│     },                                                 │
│     "location": {                                      │
│       "operator": "=",                                 │
│       "value": "Whitefield",                           │
│       "location_id": "uuid-...",                       │
│       "confidence": 0.92                               │
│     },                                                 │
│     "budget_max": {                                    │
│       "operator": "<",                                 │
│       "value": 5000000,                                │
│       "confidence": 0.95                               │
│     }                                                  │
│   },                                                   │
│   "sort_by": "updated_at",                             │
│   "sort_order": "desc",                                │
│   "limit": 10                                          │
│ }                                                      │
│    ↓                                                    │
│ STEP 4: Validate against schema                        │
│ ├─ All fields valid? ✓                                │
│ ├─ All values in allowed range? ✓                     │
│ ├─ No injection attempts? ✓                            │
│    ↓                                                    │
│ STEP 5: Execute query                                  │
│ SELECT * FROM leads WHERE                              │
│   status = 'hot' AND                                   │
│   location = 'Whitefield' AND                          │
│   budget_max < 5000000                                 │
│ ORDER BY updated_at DESC                               │
│ LIMIT 10                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 12.2 Query Interpreter Service

```python
# backend-ai/app/services/query_interpreter.py

from pydantic import BaseModel
from typing import Any, Dict, List

class FilterExpression(BaseModel):
    """Single filter in query tree"""
    field: str
    operator: str  # =, !=, <, >, <=, >=, IN, LIKE
    value: Any
    confidence: float  # 0-1, how confident in interpretation
    source: str  # "entity_extraction", "context", "default"

class QueryTree(BaseModel):
    """Structured query tree"""
    entity: str  # lead, property, project
    action: str  # search, get, create, update
    filters: Dict[str, FilterExpression]
    sort_by: str = "updated_at"
    sort_order: str = "desc"
    limit: int = 10
    offset: int = 0

class QueryInterpreter:
    """Convert natural language to structured queries"""
    
    def __init__(self):
        self.entity_extractor = EntityExtractor()
        self.filter_validator = FilterValidator()
        self.query_builder = QueryBuilder()
    
    async def interpret_query(
        self,
        user_message: str,
        tenant_id: UUID,
        context: dict = None
    ) -> QueryTree:
        """
        Convert user message to QueryTree
        """
        
        # Extract entities
        entities = await self.entity_extractor.extract(
            user_message,
            context=context
        )
        
        # Determine entity type
        entity_type = self._infer_entity_type(
            user_message,
            entities
        )
        
        # Build filters from extracted entities
        filters = {}
        
        for entity_name, entity_value in entities.items():
            # Map entity to filter
            filter_expr = await self._entity_to_filter(
                entity_name,
                entity_value,
                entity_type
            )
            
            if filter_expr:
                filters[entity_name] = filter_expr
        
        # Validate filters
        validation_result = await self.filter_validator.validate(
            entity_type,
            filters,
            tenant_id
        )
        
        if not validation_result["valid"]:
            raise ValueError(
                f"Invalid filters: {validation_result['errors']}"
            )
        
        # Build query tree
        query_tree = QueryTree(
            entity=entity_type,
            action="search",
            filters=filters,
            limit=10
        )
        
        return query_tree
    
    async def _entity_to_filter(
        self,
        entity_name: str,
        entity_value: str,
        entity_type: str
    ) -> FilterExpression:
        """Convert extracted entity to filter"""
        
        # Determine filter field and operator
        field_mapping = {
            "status": "status",
            "location": "location",
            "budget": "budget_max",  # Assume <= for budget
            "bhk": "bhk_type",
            "price": "price",
        }
        
        field = field_mapping.get(entity_name)
        if not field:
            return None
        
        # Determine operator
        operator = "="
        if entity_name in ["budget", "price"]:
            operator = "<="  # Assume user means "under" or "less than"
        
        # Normalize value
        normalized_value = await self._normalize_value(
            entity_name,
            entity_value
        )
        
        return FilterExpression(
            field=field,
            operator=operator,
            value=normalized_value,
            confidence=0.9,  # Default confidence
            source="entity_extraction"
        )
    
    async def _normalize_value(
        self,
        entity_name: str,
        entity_value: str
    ) -> Any:
        """Normalize extracted value"""
        
        if entity_name == "location":
            # Lookup location in database
            loc = await db.query(Location).filter(
                Location.name.ilike(f"%{entity_value}%")
            ).first()
            return loc.id if loc else entity_value
        
        elif entity_name in ["budget", "price"]:
            # Convert "50L" → 5000000
            return parse_currency(entity_value)
        
        elif entity_name == "bhk":
            # Normalize "2bhk" → "2BHK"
            return entity_value.upper()
        
        return entity_value
```

---

## 13. IMPLEMENTATION PHASES (3A-3G)

### Phase Timeline

```
Phase 3A: Database + Sync
├─ Duration: 1 week
├─ Tasks:
│  ├─ ✓ Database models (already done)
│  ├─ ✓ CRUD operations (already done)
│  ├─ □ Data sync service (full/incremental/on-demand)
│  ├─ □ APScheduler setup
│  └─ □ Webhook handler (if Leadrat supports)
└─ Deliverable: Full data sync running hourly

Phase 3B: Local Search APIs
├─ Duration: 1 week
├─ Tasks:
│  ├─ □ Hybrid search service (exact + FTS + fuzzy)
│  ├─ □ /api/v1/search/leads endpoint
│  ├─ □ /api/v1/search/properties endpoint
│  ├─ □ /api/v1/search/projects endpoint
│  └─ □ Caching layer (Redis)
└─ Deliverable: All search APIs query local DB

Phase 3C: Entity Extraction
├─ Duration: 1 week
├─ Tasks:
│  ├─ □ Ollama NER setup
│  ├─ □ Entity normalization dictionary
│  ├─ □ Fallback keyword matching
│  └─ □ Typo tolerance (trigram search)
└─ Deliverable: Extract filters from natural language

Phase 3D: Chat Orchestrator
├─ Duration: 1 week
├─ Tasks:
│  ├─ □ Orchestration service
│  ├─ □ Intent agent
│  ├─ □ Context resolver
│  ├─ □ Query interpreter
│  └─ □ Result formatter + suggestions
└─ Deliverable: Unified chat flow

Phase 3E: Conversation Memory
├─ Duration: 4 days
├─ Tasks:
│  ├─ □ Memory compression logic
│  ├─ □ Session management
│  ├─ □ Context storage
│  └─ □ Archive strategy
└─ Deliverable: Scalable conversation memory

Phase 3F: Floating Chatbot
├─ Duration: 4 days
├─ Tasks:
│  ├─ □ React component
│  ├─ □ WebSocket integration
│  ├─ □ Session persistence
│  └─ □ Mobile responsiveness
└─ Deliverable: Floating widget on all pages

Phase 3G: Optimization + Monitoring
├─ Duration: 1 week
├─ Tasks:
│  ├─ □ Performance tuning
│  ├─ □ Grafana dashboards
│  ├─ □ Load testing
│  ├─ □ Documentation
│  └─ □ Team training
└─ Deliverable: Production-ready system

TOTAL: ~7-8 weeks
```

---

## 14. SCALE ASSUMPTIONS

### 14.1 Data Volume

```
ESTIMATED SCALE (Year 1)

Leads:
├─ Current: 1,000
├─ Expected (12 months): 50,000
├─ Growth: 4,200/month
├─ Data per lead: ~500 bytes
└─ Total storage: 25 MB

Properties:
├─ Current: 500
├─ Expected (12 months): 10,000
├─ Growth: 800/month
├─ Data per property: ~2 KB
└─ Total storage: 20 MB

Projects:
├─ Current: 50
├─ Expected (12 months): 200
├─ Growth: 12/month
├─ Data per project: ~1 KB
└─ Total storage: 200 KB

Conversations:
├─ Current: 100 messages/day
├─ Expected (12 months): 10,000 messages/day
├─ Data per message: ~300 bytes
├─ Retention: 90 days
├─ Total storage: 90 MB

TOTAL DATABASE: ~150 MB (small, fits in any RDS)
GROWTH RATE: ~400 GB/year (manageable)
```

### 14.2 Traffic Volume

```
EXPECTED CONCURRENT USERS

Peak Hours (9 AM - 6 PM):
├─ Active users: 50-100
├─ Concurrent chat sessions: 10-20
├─ Queries per second: 5-10 QPS

Off-Peak Hours:
├─ Active users: 5-10
├─ Concurrent chat sessions: 1-3
├─ Queries per second: 0.5 QPS

Daily Stats:
├─ Total messages: 500-1000
├─ Total searches: 200-400
├─ Unique users: 30-50

Search Volume:
├─ Property searches: 60% of traffic
├─ Lead searches: 30% of traffic
├─ Project searches: 10% of traffic

Response Time Targets:
├─ Search queries: < 500ms (P95)
├─ Chat messages: < 2s (P95)
├─ Cache hit rate: > 70%
```

### 14.3 Resource Allocation

```
INFRASTRUCTURE SIZING

PostgreSQL:
├─ Instance: t3.small (2 vCPU, 2 GB RAM)
├─ Storage: 100 GB (burstable)
├─ Connections: max_connections = 100

Redis:
├─ Instance: t3.micro (0.5 vCPU, 512 MB RAM)
├─ Memory: 512 MB initially (scale to 2 GB if needed)
├─ Eviction: allkeys-lru

FastAPI Backend:
├─ Containers: 2 instances (t3.micro each)
├─ Memory: 512 MB per instance
├─ CPU: 0.5 vCPU per instance
├─ Load balancer: ALB

Ollama (NER):
├─ Instance: t3.small (2 vCPU, 4 GB RAM)
├─ Model: llama2 (7B parameters)
├─ Inference latency: 500-1000ms

Frontend (Next.js):
├─ Static hosting: CloudFront + S3
├─ No backend container needed (serverless)

Total Monthly Cost: ~$150-250
```

---

## 15. ARCHITECTURE DIAGRAMS

### 15.1 Entity-Relationship Diagram (Simplified)

```
┌─────────────┐
│  tenants    │
│─────────────│  (1)
│ id (PK)     │———┐
│ slug        │   │
│ plan        │   │ (many)
└─────────────┘   │
                  │
        ┌─────────┴────────┬──────────────┬──────────────┐
        │                  │              │              │
        ↓                  ↓              ↓              ↓
┌──────────────┐  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
│    users     │  │ bot_configs │ │    leads     │ │ properties   │
│──────────────│  │─────────────│ │──────────────│ │──────────────│
│ id (PK)      │  │ id (PK)     │ │ id (PK)      │ │ id (PK)      │
│ tenant_id (FK)  │ tenant_id(FK)│ │ tenant_id(FK)│ │ tenant_id(FK)│
│ email        │  │ persona...  │ │ leadrat_id   │ │ leadrat_id   │
│ role         │  └─────────────┘ │ name, phone  │ │ title, price │
└──────────────┘                  │ status       │ │ bhk_type     │
                                  │ min_budget   │ │ location     │
                                  │ max_budget   │ └──────────────┘
                                  └──────────────┘         │
                                         │                 │
        ┌────────────────────────────────┴─────────────────┴──────────┐
        │                                                              │
        ↓                                                              ↓
┌──────────────────┐                                      ┌──────────────────┐
│  projects        │                                      │ whatsapp_sessions│
│──────────────────│                                      │──────────────────│
│ id (PK)          │                                      │ id (PK)          │
│ tenant_id (FK)   │                                      │ tenant_id (FK)   │
│ leadrat_id       │                                      │ whatsapp_number  │
│ name, city       │                                      │ leadrat_lead_id  │
│ bhk_types        │                                      │ session_data     │
│ min_price        │                                      └──────────────────┘
│ max_price        │                                              │
└──────────────────┘                                              │
                                                                   │
                                                                   ↓
                                                      ┌──────────────────────┐
                                                      │ conversation_logs    │
                                                      │──────────────────────│
                                                      │ id (PK)              │
                                                      │ session_id (FK)      │
                                                      │ message, role        │
                                                      │ intent, confidence   │
                                                      │ extracted_entities   │
                                                      └──────────────────────┘

Additional tables (not shown for clarity):
- site_visits
- user_sessions
- ai_query_logs
- saved_reports
- analytics_summary
- conversation_memory
```

### 15.2 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  EXTERNAL SYSTEMS                  INTERNAL SYSTEMS                  │
│  ─────────────────                ──────────────────                 │
│                                                                      │
│  ┌──────────────┐                 ┌────────────────┐               │
│  │ Leadrat APIs │                 │ Frontend       │               │
│  │ (Lead/Prop   │◄─────────────►  │ (React/Next)   │               │
│  │  /Project)   │                 └────────────────┘               │
│  └──────┬───────┘                         ▲                        │
│         │                                 │                        │
│         │ Webhook                         │                        │
│         │ (real-time)                     │ Chat Message            │
│         ▼                                 │                        │
│  ┌──────────────┐                 ┌───────┴───────┐                │
│  │ Leadrat      │                 │ FastAPI       │                │
│  │ Webhooks     │                 │ Backend       │                │
│  │ (Optional)   │                 ├───────────────┤                │
│  └──────────────┘                 │ • Orchestrator│                │
│                                   │ • Intent Agent│                │
│  ┌──────────────┐                 │ • Entity Extr.│                │
│  │ Ollama       │◄────────────────┤ • Query Interp│                │
│  │ (NER, TTS)   │                 │ • Search      │                │
│  └──────────────┘                 │ • RAG Router  │                │
│                                   └───────┬───────┘                │
│                                           │                        │
│                        ┌──────────────────┼──────────────────┐     │
│                        │                  │                  │     │
│                        ▼                  ▼                  ▼     │
│                   ┌─────────┐        ┌──────────┐      ┌─────────┐│
│                   │ Redis   │        │PostgreSQL│      │Sync Svc ││
│                   │(Cache)  │        │ (DB)     │      │(APSched)││
│                   │ • Sess  │        │          │      │         ││
│                   │ • Query │        │ 9 tables │      │Hourly   ││
│                   │ • Filters        │ w/index  │      │Sync     ││
│                   └─────────┘        └──────────┘      └─────────┘│
│                                           ▲                        │
│                                           │                        │
│                                      (Daily Archive)                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 15.3 Chat Orchestration Sequence Diagram

```
User          Frontend      Orchestrator  Entity Extr  SearchSvc  DB
 │               │                │          │           │        │
 ├─"show leads"─►│                │          │           │        │
 │               ├─Chat Message───┼─────────►│           │        │
 │               │                ├─Detect Intent (lead_search)  │
 │               │                │          │           │        │
 │               │                ├─Get Context──────────┼────►   │
 │               │                │          │           │        │
 │               │                ├─Extract Entities────►│        │
 │               │                │          │◄─Entities│        │
 │               │                │          │           │        │
 │               │                ├─Search (CRM)─────────────►   │
 │               │                │          │           │        │
 │               │                │          │           ├─Query──►│
 │               │                │          │           │◄─Results
 │               │                │          │           │        │
 │               │                ├─Rank Results         │        │
 │               │                │          │           │        │
 │               │                ├─Generate Suggestions │        │
 │               │                │          │           │        │
 │               │◄─ChatResponse──┤          │           │        │
 │◄─Display Cards│                │          │           │        │
 │   + Sugges───┤                │          │           │        │
 │               │                │          │           │        │

Key: Async/Parallel Execution
- Entity Extraction happens in parallel with Context Lookup
- Ranking happens after Search (can be optimized with cursor pagination)
- Suggestions generated from SearchResult metadata
```

### 15.4 Error Handling Flow

```
User Query
    │
    ▼
┌─────────────────────┐
│ Input Validation    │
│ (Injection check)   │
└────┬────────────────┘
     │
     ├─FAIL──────────► Return 400 + User Error (safe message)
     │
     ▼
┌─────────────────────┐
│ Intent Detection    │
│ (Confidence check)  │
└────┬────────────────┘
     │
     ├─LOW CONF──────► Ask clarification
     │
     ▼
┌─────────────────────┐
│ Entity Extraction   │
│ + Normalization     │
└────┬────────────────┘
     │
     ├─INVALID VALUE─► Return 400 + Field error + Suggestions
     │
     ▼
┌─────────────────────┐
│ Database Search     │
│ (with timeout)      │
└────┬────────────────┘
     │
     ├─TIMEOUT──────► Use cache or return "Refresh needed"
     ├─DB ERROR────► Return 500 + Retry indicator + Fallback LLM
     │
     ▼
┌─────────────────────┐
│ Result Formatting   │
└────┬────────────────┘
     │
     ├─FORMAT ERROR─► Return 500 + Generic response
     │
     ▼
Success Response with data + suggestions
```

---

## SUMMARY & NEXT STEPS

This revised Phase 3 design addresses all 15 improvement points:

✓ Multi-tenant isolation with clear Leadrat mapping
✓ Hybrid search (exact + FTS + fuzzy + semantic future)
✓ Conversation memory with compression & archival
✓ RAG separation (CRM data vs Knowledge base)
✓ Sync conflict resolution with source-of-truth policy
✓ Security: encryption, audit logging, injection filtering, rate limiting
✓ Observability: metrics, tracing, logs, AI monitoring
✓ Chat orchestration service (centralized, not scattered)
✓ Floating chatbot UX with session restore & reconnection
✓ Unified API response contract across all endpoints
✓ Advanced sync: webhooks + incremental + on-demand
✓ Query interpretation layer (natural language → SQL)
✓ Implementation phases breakdown (3A-3G, ~8 weeks)
✓ Scale assumptions (50K leads, 10K properties, 50-100 concurrent users)
✓ Architecture diagrams (ER, data flow, sequence, error handling)

**Ready for user review and approval.**
