# Test Scenarios & RAG Architecture

## H. END-TO-END TEST SCENARIOS

### Test Scenario 1: Lead Management
```
User Input: "Show me the leads I got today"
Current (Wrong): "Found 0 lead(s)"  [static template]
Expected (Correct): "You have 3 leads from today. Ahmed Hassan is interested 
                     in a 2BHK in Dubai Marina with a budget of 500K-1M. 
                     Sarah Johnson wants a 3BHK penthouse. 
                     Should I schedule follow-ups with them?"
```

**Flow:**
1. User types message → ChatInterface
2. Intent detection → "lead"
3. Extract search term → "today"
4. POST /api/v1/llm/generate with:
   ```json
   {
     "message": "Show me the leads I got today",
     "intent": "lead",
     "search_term": "today",
     "tenant_id": "dubait11",
     "conversation_history": []
   }
   ```
5. Backend:
   - Calls `list_leads(tenant_id, search="today")`
   - Gets real Leadrat leads
   - Builds prompt with CRM data
   - Sends to Ollama
   - Ollama generates: "You have 3 leads from today. Ahmed Hassan..."
6. Display response to user

**Verification:**
- ✅ Response mentions real lead names (Ahmed Hassan, Sarah Johnson)
- ✅ Response mentions real budget (500K-1M)
- ✅ Response mentions real interests (2BHK, penthouse)
- ✅ Response is conversational, not template
- ✅ Network shows POST to `/api/v1/llm/generate`

---

### Test Scenario 2: Property Search
```
User Input: "Available 3BHK properties in Dubai"
Current (Wrong): "Found 5 propert(ies):
                  1. 🏠 Property — 3 BHK | Area: N/A sqft | Price: On Request"
Expected (Correct): "I found 5 nice 3BHK properties for you in Dubai. 
                     The Marjan project has stunning waterfront units 
                     starting at 2.3M, and Marina Breeze offers 
                     contemporary apartments at 1.8M with great amenities. 
                     Jumeirah Heights is a popular choice around 1.5M. 
                     Would you like details on any of these?"
```

**Verification:**
- ✅ Real property names mentioned
- ✅ Real prices mentioned
- ✅ Real amenities referenced
- ✅ Natural suggestion to explore further
- ✅ No template format

---

### Test Scenario 3: Visit Scheduling
```
User Input: "What visits do I have scheduled?"
Current (Wrong): "No upcoming visits or meetings scheduled. 
                  Would you like to schedule one?"  [hardcoded]
Expected (Correct): "You have 4 site visits scheduled this week. 
                     Ahmed Hassan has a visit to Marina Breeze tomorrow at 2 PM, 
                     and Sarah Johnson will see Jumeirah Heights on Thursday. 
                     Both reminders have been sent. Any changes needed?"
```

**Verification:**
- ✅ Real customer names
- ✅ Real project names
- ✅ Real dates/times
- ✅ Conversational tone
- ✅ References actual data, not template

---

### Test Scenario 4: Analytics Query
```
User Input: "How many leads this month?"
Current (Wrong): "Here's your current status:
                  You have X active leads. You have X visits scheduled."
Expected (Correct): "April has been strong! You've received 28 new leads 
                     so far, with 12 qualified and 8 scheduled for visits. 
                     Your conversion rate is at 35% this month, which is 
                     above your usual 30%. The top source is still your website 
                     at 45% of leads. Keep it up!"
```

**Verification:**
- ✅ Real numbers (28, 12, 8, 35%)
- ✅ Real metrics (conversion rate, source breakdown)
- ✅ Contextual insights
- ✅ Encouraging tone
- ✅ No template format

---

### Test Scenario 5: Conversation Continuity
```
User: "Show me available 3BHK properties"
Assistant: [Lists 5 properties with prices and locations]
User: "Which one is cheapest?"
Assistant: "Based on the properties I just showed you, 
            Jumeirah Heights at 1.5M is the most affordable 3BHK..."
```

**Verification:**
- ✅ Context from previous message is remembered
- ✅ References "the properties I just showed"
- ✅ Builds on conversation history
- ✅ Not starting fresh each time

---

### Test Scenario 6: Empty Data Handling
```
User: "Show me 5BHK properties in Downtown Dubai"
Expected (Not Template): "I searched our entire inventory and couldn't find 
                          any 5BHK properties in Downtown Dubai. 
                          Would you like me to show you available 4BHK options 
                          instead, or look in a nearby area?"
```

**Verification:**
- ✅ Graceful handling of no results
- ✅ Helpful suggestion for alternatives
- ✅ Not a hardcoded "No properties found"

---

## F. RAG ARCHITECTURE RECOMMENDATION

### Current State
- ❌ No RAG implementation
- ❌ No embeddings
- ❌ No semantic search
- ❌ No document retrieval
- ❌ Only direct API calls to Leadrat

### Why RAG is Needed

**Scenario 1: FAQ Knowledge**
```
User: "What's the RERA approval status?"
Without RAG: LLM generates generic answer
With RAG: LLM retrieves specific RERA docs → accurate answer
```

**Scenario 2: Property Knowledge**
```
User: "Tell me about this project"
Without RAG: Only latest project info in Leadrat
With RAG: Retrieves historical docs, amenities, floor plans → comprehensive
```

**Scenario 3: CRM Procedures**
```
User: "How do I qualify a lead?"
Without RAG: Generic answer
With RAG: Retrieves internal docs → exact company procedure
```

---

### Recommended RAG Stack

#### Option A: pgvector (Recommended for this project)
**Why:** 
- Uses existing PostgreSQL database
- No extra services needed
- Simpler setup
- Cost-effective

**Architecture:**
```
Documents (FAQs, Procedures, Amenities)
    ↓
Chunk into small pieces
    ↓
Generate embeddings (sentence-transformers)
    ↓
Store in pgvector column in PostgreSQL
    ↓
User Query
    ↓
Generate query embedding
    ↓
Vector similarity search in PostgreSQL
    ↓
Retrieve top 3-5 relevant documents
    ↓
Build context prompt with documents
    ↓
Send to Ollama
    ↓
LLM generates grounded response
```

**Implementation:**

**Step 1: Enable pgvector in PostgreSQL**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100),
    category VARCHAR(50),  -- faq, procedure, property_info, etc.
    title VARCHAR(255),
    content TEXT,
    embedding vector(384),  -- sentence-transformers embedding size
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON rag_documents USING ivfflat (embedding vector_cosine_ops);
```

**Step 2: Create embedding service**
```python
# backend-ai/app/services/embeddings.py
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from app.db.database import get_db

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

async def store_document(tenant_id: str, category: str, title: str, content: str, db):
    """Store document with embeddings in pgvector."""
    
    # Chunk content into smaller pieces
    chunks = chunk_text(content, chunk_size=500, overlap=50)
    
    for i, chunk in enumerate(chunks):
        # Generate embedding
        embedding = model.encode(chunk).tolist()
        
        # Store in database
        query = text("""
            INSERT INTO rag_documents (tenant_id, category, title, content, embedding)
            VALUES (:tenant_id, :category, :title, :content, :embedding)
        """)
        
        await db.execute(query, {
            "tenant_id": tenant_id,
            "category": category,
            "title": f"{title} (Part {i+1})",
            "content": chunk,
            "embedding": embedding
        })

async def search_documents(query_text: str, tenant_id: str, top_k: int = 5, db):
    """Search for relevant documents using vector similarity."""
    
    # Generate query embedding
    query_embedding = model.encode(query_text).tolist()
    
    # Search database
    result = await db.execute(text("""
        SELECT id, title, content, category, 
               1 - (embedding <=> :embedding) as similarity
        FROM rag_documents
        WHERE tenant_id = :tenant_id
        ORDER BY embedding <=> :embedding
        LIMIT :limit
    """), {
        "embedding": query_embedding,
        "tenant_id": tenant_id,
        "limit": top_k
    })
    
    return result.fetchall()
```

**Step 3: Update LLM context building**
```python
# backend-ai/app/services/llm_grounding.py - Updated

async def build_crm_context_with_rag(
    user_message: str,
    intent: str,
    crm_data: dict,
    tenant_id: str,
    db,
    history: list = None
):
    """Build context with RAG-retrieved documents."""
    
    # Fetch RAG documents
    rag_docs = await search_documents(user_message, tenant_id, top_k=3, db)
    
    rag_section = ""
    if rag_docs:
        rag_section = "Relevant Information from Knowledge Base:\n"
        for doc in rag_docs:
            if doc['similarity'] > 0.5:  # Only include high relevance
                rag_section += f"[{doc['category']}] {doc['title']}: {doc['content'][:200]}...\n"
    
    # Rest of context building...
    return prompt_with_rag_context
```

---

#### Option B: Chroma (Alternative)
**Why:** Specialized vector database
**Tradeoff:** Extra service, but easier for embeddings

```yaml
chroma:
  image: ghcr.io/chroma-core/chroma:latest
  ports:
    - "8001:8000"
  environment:
    ANONYMIZED_TELEMETRY: false
```

**Better for:** Document-heavy applications
**Worse for:** Tight integration with existing PostgreSQL

---

### RAG Content to Index

**Phase 1 (Essential):**
1. Leadrat API documentation
2. Lead qualification criteria
3. Property amenities & features
4. Project information
5. CRM workflow procedures

**Phase 2 (Enhancement):**
1. FAQs
2. Sales scripts
3. Follow-up templates
4. Market research
5. Competitor analysis

---

## Implementation Timeline

```
Week 1:
  ✅ Fix API connectivity (DONE - APIs working)
  ✅ Remove static templates (IN PROGRESS)
  ✅ Add LLM integration (Step 1-3)
  ✅ Test with real data

Week 2:
  Add RAG implementation
  Index knowledge base
  Improve response quality

Week 3:
  Fine-tune prompts
  Add conversation persistence
  Performance optimization
```

---

## Quality Metrics to Track

1. **Response Quality**
   - Mentions real data points (names, prices, counts)
   - Conversational tone (not template)
   - Actionable suggestions
   - No made-up information

2. **API Health**
   - Leadrat API success rate > 95%
   - LLM generation latency < 2 seconds
   - Error rate < 1%

3. **User Satisfaction**
   - Response relevance: Does it answer the question?
   - Data accuracy: Is all info from actual CRM?
   - Usefulness: Would user find this actionable?

4. **Conversation Metrics**
   - Context awareness (remembers history)
   - Intent accuracy (detects correct intent)
   - Multi-turn conversations work properly
