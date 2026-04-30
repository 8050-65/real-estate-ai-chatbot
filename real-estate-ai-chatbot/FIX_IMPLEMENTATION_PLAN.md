# AI Assistant Fix - Step-by-Step Implementation Plan

## PRIORITY: Fix API Connectivity First ✅
APIs are already working! Leadrat data is being fetched correctly.

## CRITICAL ISSUE: No LLM Response Generation
The assistant formats data into templates instead of using Ollama LLM.

---

## IMPLEMENTATION STEPS (In Order)

### STEP 1: Create LLM Grounding Service (Backend)

**New File:** `backend-ai/app/services/llm_grounding.py`

```python
"""LLM grounding - build context prompts with real CRM data."""

from app.config import settings
from app.agents.llm_factory import get_llm
from app.utils.logger import get_logger

logger = get_logger(__name__)

def build_crm_context(user_message: str, intent: str, crm_data: dict, history: list = None):
    """Build context prompt that grounds LLM in real CRM data."""
    
    if history is None:
        history = []
    
    # Format CRM data based on intent
    data_section = ""
    if intent == "lead" and crm_data.get("data"):
        leads = crm_data["data"][:5]
        data_section = "Available leads:\n"
        for lead in leads:
            data_section += f"- {lead.get('name', 'Unknown')} ({lead.get('phone', 'N/A')}) - Status: {lead.get('status', 'New')}\n"
    
    elif intent == "property" and crm_data.get("data"):
        props = crm_data["data"][:5]
        data_section = "Available properties:\n"
        for prop in props:
            data_section += f"- {prop.get('name', 'Property')} - {prop.get('bhkType', 'N/A')} BHK - ₹{prop.get('price', 'On Request')}\n"
    
    elif intent == "project" and crm_data.get("data"):
        projects = crm_data["data"][:5]
        data_section = "Available projects:\n"
        for proj in projects:
            data_section += f"- {proj.get('name', 'Project')} ({proj.get('type', 'N/A')}) - {proj.get('status', 'Active')}\n"
    
    # Build conversation context
    history_section = ""
    if history:
        history_section = "Conversation so far:\n"
        for msg in history[-5:]:  # Last 5 messages
            history_section += f"- {msg['role']}: {msg['content'][:100]}...\n"
    
    # Build final prompt
    prompt = f"""You are an AI Real Estate CRM Assistant. Help the user with their query.

IMPORTANT: Ground your response in the real CRM data below. Do NOT make up data.

{f"Current Data:{data_section}" if data_section else "No data available for this query."}

{f"Conversation Context:{history_section}" if history_section else ""}

User: {user_message}

Respond conversationally and naturally. Reference specific data points. If no data, acknowledge that."""
    
    return prompt


async def generate_llm_response(user_message: str, intent: str, crm_data: dict, history: list = None):
    """Generate LLM response grounded in CRM data."""
    
    try:
        # Build context prompt
        prompt = build_crm_context(user_message, intent, crm_data, history)
        
        # Call Ollama LLM
        llm = get_llm()
        response = llm.invoke(prompt)
        
        logger.info("llm_response_generated", intent=intent, tokens=len(response.content.split()))
        return response.content
        
    except Exception as e:
        logger.error("llm_generation_failed", error=str(e), exc_info=True)
        # Fallback to template if LLM fails
        return None
```

---

### STEP 2: Create LLM Response Endpoint (Backend)

**New File:** `backend-ai/app/routers/llm.py`

```python
"""LLM endpoints for generating CRM-grounded responses."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.llm_grounding import generate_llm_response
from app.services.leadrat_leads import list_leads, list_properties, list_projects
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1", tags=["LLM"])

class LLMRequest(BaseModel):
    message: str
    intent: str  # lead, property, project, visit, analytics
    tenant_id: str = "dubait11"
    search_term: str = ""
    conversation_history: list = []

class LLMResponse(BaseModel):
    response: str
    intent: str
    sources: list = []

@router.post("/llm/generate")
async def generate_response(request: LLMRequest):
    """
    Generate LLM response grounded in real CRM data.
    
    Flow:
    1. Fetch real CRM data based on intent
    2. Build context prompt
    3. Call Ollama LLM
    4. Return dynamic response
    """
    try:
        logger.info("llm_request", intent=request.intent, message=request.message[:50])
        
        # Fetch real CRM data
        crm_data = {}
        if request.intent == "lead":
            crm_data = await list_leads(
                tenant_id=request.tenant_id,
                search=request.search_term,
                page_number=1,
                page_size=10
            )
        elif request.intent == "property":
            crm_data = await list_properties(
                tenant_id=request.tenant_id,
                search=request.search_term,
                page_number=1,
                page_size=10
            )
        elif request.intent == "project":
            crm_data = await list_projects(
                tenant_id=request.tenant_id,
                search=request.search_term,
                page_number=1,
                page_size=10
            )
        
        # Generate LLM response grounded in CRM data
        response_text = await generate_llm_response(
            user_message=request.message,
            intent=request.intent,
            crm_data=crm_data,
            history=request.conversation_history
        )
        
        if not response_text:
            raise HTTPException(status_code=500, detail="LLM generation failed")
        
        return LLMResponse(
            response=response_text,
            intent=request.intent,
            sources=["Leadrat API", "Ollama LLM"]
        )
        
    except Exception as e:
        logger.error("llm_endpoint_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
```

**Register router in main.py:**
```python
from app.routers.llm import router as llm_router
app.include_router(llm_router)
```

---

### STEP 3: Update Frontend to Use LLM (ChatInterface.tsx)

**Replace callLeadratAPI function (lines 46-221) with:**

```typescript
async function callLeadratAPI(intent: string, searchTerm: string, originalMessage: string, conversationHistory: Message[] = []): Promise<{ content: string; quickReplies: string[] }> {
  const tenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenantId') || 'dubait11') : 'dubait11';
  
  console.log('[ChatInterface] Calling LLM endpoint for intent:', intent);

  try {
    // Build conversation history for context
    const historyContext = conversationHistory
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-3)  // Last 3 messages
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content.substring(0, 200)  // Limit to 200 chars
      }));

    // Call LLM endpoint
    const response = await fastApiClient.post('/api/v1/llm/generate', {
      message: originalMessage,
      intent: intent,
      tenant_id: tenantId,
      search_term: searchTerm,
      conversation_history: historyContext
    });

    const llmResponse = response.data?.response || response.data?.content || '';

    if (!llmResponse) {
      return {
        content: 'Unable to generate response. Please try again.',
        quickReplies: ['Try again', 'Help']
      };
    }

    // Generate context-appropriate quick replies based on intent
    const quickReplies = getQuickReplies(intent);

    return {
      content: llmResponse,  // REAL LLM-generated response, NOT template
      quickReplies: quickReplies
    };

  } catch (error: any) {
    console.error('[LLM Error]', {
      status: error.response?.status,
      intent,
      message: error.response?.data?.detail || error.message
    });

    return {
      content: 'I encountered an issue fetching data. Please try again.',
      quickReplies: ['Try again']
    };
  }
}

// Helper function for context-aware quick replies
function getQuickReplies(intent: string): string[] {
  const replies: Record<string, string[]> = {
    lead: ['Show hot leads', 'Filter by status', 'Assign lead', 'Schedule follow-up'],
    property: ['Filter by BHK', 'Show price range', 'View on map', 'Schedule visit'],
    project: ['Show units', 'View amenities', 'Check RERA', 'Contact developer'],
    visit: ['Schedule visit', 'View calendar', 'Send reminder', 'Cancel appointment'],
    analytics: ['Daily report', 'Weekly summary', 'Monthly metrics', 'Export report'],
    general: ['Show leads', 'Find property', 'View projects', 'Schedule visit']
  };
  return replies[intent] || replies.general;
}
```

**Update handleSend to pass conversation history:**
```typescript
async function handleSend(messageText?: string) {
  // ... existing code ...
  const { content, quickReplies } = await callLeadratAPI(
    intent,
    searchTerm,
    text,
    messages  // ← Pass full message history
  );
  // ... rest of code ...
}
```

---

### STEP 4: Update Error Handling (Remove Template Fallbacks)

**In ChatInterface.tsx, replace error handler (lines 191-220):**

```typescript
} catch (error: any) {
  const status = error.response?.status;
  
  console.error('[API Error]', {
    status,
    intent,
    url: error.config?.url,
    message: error.response?.data?.detail || error.message
  });

  // Return simple error, let LLM handle it
  const friendlyMessage = status === 401
    ? 'Your session expired. Please refresh and login again.'
    : status === 403
    ? 'Permission denied for this operation.'
    : status === 404
    ? 'The requested resource was not found.'
    : 'Unable to process your request. Please try again.';

  return {
    content: friendlyMessage,
    quickReplies: ['Try again', 'Help']
  };
}
```

---

### STEP 5: Configure Ollama (Docker)

**Update docker-compose.yml to ensure Ollama is available:**

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: ollama-service
  ports:
    - "11434:11434"
  environment:
    - OLLAMA_HOST=0.0.0.0:11434
  volumes:
    - ollama-data:/root/.ollama
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
    interval: 30s
    timeout: 10s
    retries: 3
  networks:
    - crm-network

volumes:
  ollama-data:
```

**Verify Ollama is running:**
```bash
curl -X POST http://localhost:11434/api/generate -d '{"model":"llama2","prompt":"test"}'
```

---

## TESTING CHECKLIST

### Test 1: LLM Endpoint Directly
```bash
curl -X POST http://localhost:8000/api/v1/llm/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "show me recent leads",
    "intent": "lead",
    "tenant_id": "dubait11",
    "search_term": "",
    "conversation_history": []
  }'

# Expected: Real LLM-generated response about leads (NOT template)
```

### Test 2: Chat with Assistant
1. Login to dashboard
2. Navigate to AI Assistant
3. Type: "Show me today's leads"
   - Expected: Real response mentioning actual leads from Leadrat
   - Network tab: Should see POST to `/api/v1/llm/generate`
   - Should NOT see static template response

4. Type: "Available 3BHK properties"
   - Expected: Natural language about actual properties
   - Should mention specific price, location, status

5. Type: "What are my upcoming visits?"
   - Expected: Reference actual scheduled visits from CRM
   - Natural conversation, not template

### Test 3: Verify No Static Responses
- ✅ No "No leads found" hardcoded message
- ✅ No "I can help you with leads..." template
- ✅ All responses are LLM-generated
- ✅ All responses ground in real CRM data

---

## VERIFICATION CHECKLIST

- [ ] Ollama is running and accessible at http://localhost:11434
- [ ] `/api/v1/llm/generate` endpoint returns LLM responses
- [ ] ChatInterface calls `/api/v1/llm/generate` instead of formatting templates
- [ ] All responses mention real CRM data (lead names, property prices, etc.)
- [ ] No hardcoded template strings in responses
- [ ] Conversation history is being passed to LLM
- [ ] Error handling is graceful without template fallbacks
- [ ] Network tab shows POST requests to `/api/v1/llm/generate`
- [ ] LLM responses are different each time (not cached templates)
- [ ] Response quality improves with conversation history

---

## FINAL RESULT

### Before (Template-Based)
```
User: "Show me today's leads"
Assistant: "Found 2 lead(s):
1. John Doe — +919876543210
   Status: New | RM: Unassigned"
```

### After (LLM-Based)
```
User: "Show me today's leads"
Assistant: "You have 2 leads so far today! John Doe just came in as a new lead from your website, and Maria Garcia is following up on a property viewing from yesterday. Both are pretty active - should we schedule some follow-ups with them?"
```

**Key differences:**
- ✅ Natural language (not template)
- ✅ Real data mentioned (names, statuses)
- ✅ Context-aware (mentions follow-ups)
- ✅ Conversational tone
- ✅ Actionable suggestions

---

## ROLLBACK PLAN

If LLM integration fails:
1. Keep API calls working (they're correct)
2. Fall back to templates temporarily
3. Investigate Ollama logs
4. Check token limits
5. Verify LLM model is loaded

```bash
# Check Ollama status
docker logs ollama-service

# List available models
curl http://localhost:11434/api/tags

# Pull model if needed
curl http://localhost:11434/api/pull -d '{"name":"llama2"}'
```
