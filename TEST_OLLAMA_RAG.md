# OLLAMA + RAG CHATBOT - END-TO-END TEST GUIDE

## DECISION TREE (How It Works)

```
User Types Message
    ↓
Chat Endpoint Analyzes
    ↓
Is it a structured query? (lead/property/project/visit/status)
    ├─ YES → Return intent + needs_api_call=true
    │        Frontend calls Leadrat API directly
    │        (Fast, accurate, real data)
    │
    └─ NO → General question
           ↓
           RAG Search ChromaDB
           ↓
           Found context? (score > 0.3)
           ├─ YES → Pass to Ollama with context
           │        (Accurate, grounded answer)
           │
           └─ NO → Pass to Ollama without context
                   (General knowledge answer)
           ↓
           Ollama llama3.2 Generates Response
           ↓
           Return natural answer + metadata
```

## PART 1: STARTUP

### Step 1: Start Ollama
```bash
ollama run llama3.2
```
Wait 30-60 seconds for full initialization.

Test:
```bash
curl http://localhost:11434/api/tags
```

### Step 2: Start FastAPI Backend
```bash
cd backend-ai
python -m uvicorn app.main:app --reload --port 8001
```

Verify:
```bash
curl http://localhost:8001/health
# Should return: {"status": "healthy", "llm_provider": "ollama"}
```

### Step 3: Seed RAG Documents
```bash
cd backend-ai
python scripts/seed_rag.py
```

Expected output:
```
✅ Seeding Complete!
   Documents Indexed: 6
   Total Chunks: ~50
   Collection: dubait11
```

### Step 4: Start Frontend
```bash
cd frontend
npm run dev
```

## PART 2: FUNCTIONAL TESTS

### TEST A: RAG Search
```bash
curl "http://localhost:8001/api/v1/chat/search?q=payment+plan&n=3"
```

✅ PASS: Returns 3 results with score > 0.7

### TEST B: Chat - General Question (RAG + Ollama)
```powershell
$body = @{
  message = "What payment plans do you offer?"
  session_id = "test1"
  tenant_id = "dubait11"
  conversation_history = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/v1/chat/message" `
  -Method POST -Body $body -ContentType "application/json"
```

✅ PASS if:
- `source` = "ollama_rag"
- `rag_used` = true
- Response mentions payment plans
- Takes 2-5 seconds (Ollama processing)

### TEST C: Chat - Structured Query
```powershell
$body = @{
  message = "Show me all leads"
  session_id = "test2"
  tenant_id = "dubait11"
  conversation_history = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/v1/chat/message" `
  -Method POST -Body $body -ContentType "application/json"
```

✅ PASS if:
- `needs_api_call` = true
- `source` = "leadrat_api"
- `response` = null
- Takes < 1 second (no Ollama call)

### TEST D: Chat - With Conversation History
```powershell
$history = @(
  @{ role = "user"; content = "What payment plans do you have?" },
  @{ role = "assistant"; content = "We offer CLP, TLP, Down Payment, and Subvention schemes." }
)

$body = @{
  message = "Which one is best for first-time buyers?"
  session_id = "test3"
  tenant_id = "dubait11"
  conversation_history = $history
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/v1/chat/message" `
  -Method POST -Body $body -ContentType "application/json"
```

✅ PASS if:
- Response references previous conversation
- Shows context awareness
- Not a generic answer

## PART 3: FRONTEND UI TESTS

Open: http://localhost:3000/ai-assistant

### Check Status Bar
```
✅ Green: ✓ Ollama Online (llama3.2)
✅ Blue:  ✓ RAG Active (ChromaDB)
✅ Purple: ✓ Leadrat Connected
✅ Right: "Role: RM | Powered by LLaMA 3.2 + RAG"
```

### TEST E: Chat Box - RAG Question
Type: `"What amenities does your project have?"`

✅ PASS if:
- Response appears after 2-5 seconds
- Mentions specific amenities (pool, gym, clubhouse, etc.)
- Quick reply buttons appear
- Natural language (not template)

### TEST F: Chat Box - Structured Query
Type: `"Show me available properties"`

✅ PASS if:
- Response < 1 second (no delay)
- Routes to Leadrat API (not Ollama)
- Shows property data or API message

### TEST G: Multi-Turn Conversation
1. Type: `"Tell me about RERA regulations"`
   Expected: RAG answer about RERA
   
2. Type: `"How does that affect me?"`
   Expected: Response shows context awareness
   
3. Type: `"Schedule a site visit"`
   Expected: Switches to structured flow

✅ PASS if: Flow is smooth, context preserved

## PART 4: BUILD VERIFICATION

```bash
cd frontend
npm run build
```

✅ PASS if:
- 0 TypeScript errors
- Build completes in < 60 seconds
- .next/ folder created

## PART 5: DYNAMIC CONVERSATION EXAMPLES

### Example 1: General Knowledge
```
User: "What is RERA?"
Bot:  [RAG search returns 3 RERA docs] 
      [Ollama generates natural explanation]
      "RERA is a statutory body established under the 
       Real Estate (Regulation and Development) Act, 2016.
       It governs all real estate transactions..."
Time: ~3-5 seconds (RAG search + Ollama generation)
```

### Example 2: Structured Query
```
User: "Show me all leads"
Bot:  [Chat router detects: needs live data]
      [Returns: needs_api_call=true, intent=lead]
      [Frontend calls: GET /api/v1/leads]
      [Shows: 5 leads from CRM]
Time: < 1 second
```

### Example 3: With Context
```
User:     "What payment plans do you offer?"
Bot:      "We offer 4 main payment plans..."
User:     "Is CLP better than TLP?"
Bot:      [Uses context from previous turn]
          "CLP is better for most buyers because it 
           ties payments to construction progress,
           whereas TLP uses fixed dates regardless..."
Time: ~3-5 seconds (contextual RAG + Ollama)
```

### Example 4: Investment Advice
```
User: "I want to invest in real estate"
Bot:  [RAG search finds investment guide]
      [Ollama generates personalized advice]
      "Real estate investment can provide leverage,
       tax benefits, and appreciation. Popular strategies
       include buy-and-hold, rental income, and fix-and-flip.
       Based on your initial inquiry, I'd recommend..."
Time: ~4 seconds (comprehensive RAG + generation)
```

## RESEARCH BACKING

This implementation uses proven, production-grade technologies:

- **LangChain**: Multi-provider LLM abstraction (ollama, groq, openai, gemini)
- **ChromaDB**: Vector similarity search (battle-tested for RAG)
- **Ollama**: Local LLM inference (run privately, no API costs)
- **nomic-embed-text**: 768-dim embeddings (optimized for RAG)
- **llama3.2**: 7B parameter model (good balance of speed/quality)

Reference implementations:
- https://github.com/langchain-ai/langgraph (LangChain docs)
- https://github.com/Shubhamsaboo/awesome-llm-apps (100+ RAG templates)
- https://github.com/AleksNeStu/ai-real-estate-assistant (Real estate RAG)

## KEY DIFFERENCES FROM PREVIOUS IMPLEMENTATION

| Feature | Before | After |
|---------|--------|-------|
| LLM | Optional, used for all | Always Ollama, smart routing |
| RAG | Basic search only | Full RAG pipeline (search → context → generation) |
| Leadrat APIs | Sometimes called | Always called for structured queries |
| Conversation | Stateless | Maintains history for context |
| Status | No status indicators | Real-time health monitoring |
| Speed | Consistent delay | 2-5 sec for RAG, <1 sec for API |

## IF TESTS FAIL

### Ollama not responding
```bash
ps aux | grep ollama  # Check if running
pkill -f ollama       # Kill and restart
ollama run llama3.2   # Start fresh
```

### ChromaDB empty
```bash
ls -la backend-ai/chroma_data/
# If missing, run: python scripts/seed_rag.py
```

### FastAPI not starting
```bash
# Check port 8001 is free
lsof -i :8001

# Check Python version (3.8+)
python --version

# Check dependencies
pip install -r requirements.txt
```

### Frontend build fails
```bash
cd frontend
npm ci  # Clean install
npm run build
```

---

**Status**: ✅ Ready for testing

Next: Follow PART 1-5 above and report results
