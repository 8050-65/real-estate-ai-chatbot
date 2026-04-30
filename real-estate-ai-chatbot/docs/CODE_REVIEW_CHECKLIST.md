# Code Review Checklist — Real Estate AI Chatbot

**Use this checklist on every PR/commit before merging.**

---

## 🚨 Critical Red Flags (Must Fix)

### ❌ Red Flag 1: Direct LLM Instantiation

**DON'T:**
```python
from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.2")  # ❌ Wrong!
```

**DO:**
```python
from app.agents.llm_factory import get_llm

llm = get_llm()  # ✅ Correct! Uses factory pattern
```

**Why**: Factory pattern allows switching providers via `.env` without code changes.

---

### ❌ Red Flag 2: Hardcoded Configuration Values

**DON'T:**
```python
LEADRAT_TENANT = "black"
OLLAMA_BASE_URL = "http://localhost:11434"
JWT_SECRET = "my-secret-key"
REDIS_URL = "redis://localhost:6379"
```

**DO:**
```python
from app.config import settings

tenant = settings.leadrat_tenant
url = settings.ollama_base_url
secret = settings.jwt_secret_key
redis = settings.redis_url
```

**Why**: Hardcoded values are security vulnerabilities, don't scale across environments, and are inflexible.

---

### ❌ Red Flag 3: Synchronous Functions (Blocking I/O)

**DON'T:**
```python
def fetch_properties(query: str):  # ❌ Sync!
    response = requests.get(f"{LEADRAT_URL}/property")
    return response.json()

def classify_intent(message: str):  # ❌ Sync!
    return llm.invoke(message)

@app.post("/webhook/whatsapp")
def whatsapp_webhook(request: Request):  # ❌ Sync endpoint!
    return process_message(request)
```

**DO:**
```python
async def fetch_properties(query: str):  # ✅ Async!
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{settings.leadrat_base_url}/property")
    return response.json()

async def classify_intent(message: str):  # ✅ Async!
    llm = get_llm()
    return llm.invoke(message)

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):  # ✅ Async endpoint!
    return await process_message(request)
```

**Why**: FastAPI is async-first. Blocking calls prevent concurrent request handling, tanking performance.

---

### ❌ Red Flag 4: Missing Error Handling

**DON'T:**
```python
# ❌ No error handling!
response = await client.get(leadrat_url)
data = response.json()
lead_id = data['lead']['id']

# ❌ What if network fails? JSON parse fails? Key missing?

return {"status": "ok"}
```

**DO:**
```python
# ✅ Proper error handling
try:
    async with httpx.AsyncClient(timeout=settings.leadrat_timeout) as client:
        response = await client.get(leadrat_url)
    response.raise_for_status()  # Raises on 4xx/5xx
    data = response.json()
    lead_id = data.get('lead', {}).get('id')
    
    if not lead_id:
        logger.warning(f"Lead ID not found in response: {data}")
        raise ValueError("Lead ID missing from Leadrat response")
    
    return {"status": "ok", "lead_id": lead_id}

except httpx.TimeoutException:
    logger.error(f"Leadrat API timeout after {settings.leadrat_timeout}s")
    return {"error": "Leadrat service timeout", "status": "retry"}

except httpx.HTTPError as e:
    logger.error(f"Leadrat API error: {e.response.status_code}")
    return {"error": "Leadrat service error", "status": "retry"}

except ValueError as e:
    logger.error(f"Invalid response from Leadrat: {e}")
    return {"error": str(e), "status": "error"}

except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    return {"error": "Internal error", "status": "error"}
```

**Why**: Unhandled exceptions crash the service or send confusing errors to users. Proper handling ensures resilience.

---

### ❌ Red Flag 5: Missing Tenant Prefix in Cache Keys

**DON'T:**
```python
# ❌ No tenant isolation!
redis.set("session:123", session_data)
redis.set("properties", properties_list)
redis.set("leadrat_token", token)

# Builder A sees Builder B's data!
```

**DO:**
```python
# ✅ Tenant-isolated keys
tenant_id = state['tenant_id']
redis.set(f"{tenant_id}:session:123", session_data)
redis.set(f"{tenant_id}:properties", properties_list)
redis.set(f"{tenant_id}:leadrat_token", token)

# Each tenant's data is isolated
```

**Where to apply**:
- Redis session keys: `{tenant_id}:session:{whatsapp_number}`
- Cache keys: `{tenant_id}:properties:{hash}`
- Rate limit keys: `{tenant_id}:ratelimit:{endpoint}:{ip}`
- Token keys: `{tenant_id}:leadrat_token`

**Why**: Multi-tenant system MUST isolate data by tenant. This is a security & data privacy critical issue.

---

### ❌ Red Flag 6: Not Filtering Blocked/Sold Properties

**DON'T:**
```python
# ❌ Returns ALL properties, even sold ones!
def get_properties(project_id: str):
    response = await leadrat.get(f"/property?project_id={project_id}")
    return response.json()['properties']

# User sees: "Unit 101 - Available", "Unit 102 - Sold", "Unit 103 - Blocked"
```

**DO:**
```python
# ✅ Filter blocked/sold properties
async def get_properties(project_id: str) -> list:
    try:
        response = await leadrat.get(f"/property?project_id={project_id}")
        all_properties = response.json().get('properties', [])
        
        # Filter out unavailable properties
        available = [
            p for p in all_properties
            if p.get('status') not in ['Sold', 'Blocked', 'Hold', 'Under Construction']
        ]
        
        logger.info(f"Returning {len(available)} available properties "
                   f"out of {len(all_properties)} total")
        return available
        
    except Exception as e:
        logger.error(f"Failed to fetch properties: {e}")
        return []

# User sees: "Unit 101 - Available", "Unit 103 - Available"
```

**Why**: Showing sold/blocked properties confuses users, creates false leads, damages brand trust.

---

## ✅ Best Practices Checklist

Use this checklist on every code review:

### Architecture & Design
- [ ] All I/O operations are `async def` (not `def`)
- [ ] All configuration comes from `app.config.settings`
- [ ] No hardcoded URLs, tokens, secrets, or credentials
- [ ] LLM access only via `get_llm()` factory
- [ ] Orchestrator uses `get_orchestrator()` singleton
- [ ] Error handling covers all external API calls
- [ ] All Redis keys prefixed with `{tenant_id}`
- [ ] All database queries filter by `tenant_id`
- [ ] Logged-in user validated before returning user-specific data

### Type Safety & Validation
- [ ] All function parameters have type hints
- [ ] Return types specified on all functions
- [ ] No `Any` types used (unless absolutely unavoidable)
- [ ] Pydantic models used for request/response validation
- [ ] Request validation happens before processing

### Logging & Observability
- [ ] Every API call to external service logged (request + response)
- [ ] All errors logged with `logger.error(..., exc_info=True)`
- [ ] Log level appropriate (DEBUG < INFO < WARNING < ERROR)
- [ ] No sensitive data (tokens, passwords) in logs
- [ ] Request ID passed through call stack for tracing
- [ ] Timing information on slow operations

### Error Handling
- [ ] Try/except blocks on all external API calls
- [ ] Specific exception types caught (not bare `except:`)
- [ ] User-friendly error messages returned
- [ ] Internal errors don't leak to client
- [ ] Timeouts set on all HTTP requests (`timeout=30`)
- [ ] Retry logic with exponential backoff for transient failures

### Database & Data Access
- [ ] All queries include `tenant_id` filter (multi-tenant isolation)
- [ ] Proper SQLAlchemy async patterns used
- [ ] Indexes on frequently queried columns
- [ ] No N+1 queries (use join/prefetch where needed)
- [ ] Connection pooling configured for concurrency

### Caching
- [ ] TTL set on all Redis keys
- [ ] Cache invalidation logic on data mutations
- [ ] Cache hits/misses logged in DEBUG mode
- [ ] Fallback behavior if cache fails
- [ ] Tenant ID included in cache key

### API Endpoints
- [ ] Request validation with Pydantic models
- [ ] Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- [ ] Response wrapped in standard ApiResponse format
- [ ] API versioning (/api/v1/)
- [ ] Rate limiting configured
- [ ] CORS validated

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for external API calls (mock Leadrat)
- [ ] Happy path tested
- [ ] Error cases tested (network error, invalid response, timeout)
- [ ] Test data isolated (doesn't affect other tests)

### Security
- [ ] No credentials in code or git
- [ ] Passwords hashed (bcrypt/argon2)
- [ ] JWT tokens validated on protected endpoints
- [ ] SQL injection prevented (use parameterized queries)
- [ ] XSS prevention (escape user input)
- [ ] CSRF protection on state-changing endpoints
- [ ] Rate limiting to prevent abuse
- [ ] Webhook signature validation on Engageto

---

## Common Mistakes by Service

### FastAPI Service (backend-ai/)

```python
# ❌ DON'T
from langchain_ollama import OllamaLLM
import requests

class IntentClassifier:
    def __init__(self):
        self.llm = OllamaLLM(model="llama3.2")  # ❌ Direct instantiation
    
    def classify(self, message: str):  # ❌ Sync function
        response = requests.get(LEADRAT_URL)  # ❌ Hardcoded URL, blocking
        return response.json()

# ✅ DO
from app.agents.llm_factory import get_llm
from app.config import settings
import httpx

class IntentClassifier:
    async def __init__(self):
        self.llm = get_llm()  # ✅ Factory pattern
    
    async def classify(self, message: str):  # ✅ Async
        try:
            async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
                response = await client.get(
                    f"{settings.leadrat_base_url}/property"
                )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Classification failed: {e}", exc_info=True)
            return {"error": str(e)}
```

### Spring Boot Service (backend-java/)

```java
// ❌ DON'T
public class LeadController {
    private static final String LEADRAT_URL = "https://connect.leadrat.info";  // ❌ Hardcoded
    
    @GetMapping("/leads")
    public List<Lead> getLeads() {  // ❌ No tenant isolation
        return leadRepository.findAll();  // Gets all tenants' leads!
    }
}

// ✅ DO
public class LeadController {
    @Value("${leadrat.base-url}")  // ✅ From application.properties
    private String leadratUrl;
    
    @GetMapping("/leads")
    public ApiResponse<PageResponse<LeadDto>> getLeads(
        @RequestParam(required = false) String filter,
        @RequestParam(defaultValue = "0") int page,
        Pageable pageable
    ) {
        try {
            String tenantId = TenantContext.getTenantId();  // ✅ Tenant isolation
            Page<Lead> leads = leadRepository.findAllByTenantId(tenantId, pageable);
            return ApiResponse.ok(PageResponse.from(leads));
        } catch (Exception e) {
            logger.error("Failed to fetch leads", e);
            return ApiResponse.error("Failed to fetch leads");
        }
    }
}
```

### Next.js Frontend (frontend/)

```typescript
// ❌ DON'T
const API_URL = "http://localhost:8080";  // ❌ Hardcoded
const JWT_TOKEN = "token-from-storage";   // ❌ No validation

async function fetchLeads() {  // ❌ No error handling
    const response = await fetch(`${API_URL}/api/leads`);
    return response.json();
}

// ✅ DO
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchLeads(): Promise<Lead[]> {  // ✅ Type safe
    try {
        const token = await getValidToken();  // ✅ Validate token
        const response = await fetch(
            `${API_URL}/api/v1/leads`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return response.json();
    } catch (error) {
        logger.error("Failed to fetch leads:", error);
        throw error;
    }
}
```

---

## Code Review Process

### Before Merging Any Code:

1. **Run Linters**
   ```bash
   # Python
   black app/
   pylint app/
   mypy app/ --strict
   
   # Java
   ./mvnw spotless:check
   ./mvnw sonar:sonar
   
   # TypeScript
   npm run lint
   npm run type-check
   ```

2. **Run Tests**
   ```bash
   make test
   ```

3. **Check Red Flags**
   - [ ] No direct LLM instantiation?
   - [ ] No hardcoded config?
   - [ ] All I/O is async?
   - [ ] All errors handled?
   - [ ] All cache keys tenant-prefixed?
   - [ ] Blocked properties filtered?

4. **Run Locally**
   ```bash
   make dev
   # Test the actual feature in browser/API client
   ```

5. **Approve & Merge**
   ```bash
   git merge feature/xxx
   ```

---

## Red Flag Grep Commands

Use these to catch red flags automatically:

```bash
# 1. Find direct LLM instantiation
grep -r "OllamaLLM\|ChatGroq\|ChatOpenAI\|ChatGoogleGenerativeAI" --include="*.py" app/
# Should only appear in: app/agents/llm_factory.py

# 2. Find hardcoded values
grep -r "http://\|https://\|API_KEY\|SECRET" --include="*.py" app/ | grep -v ".env\|config.py\|llm_factory.py"
# Review each hit manually

# 3. Find sync functions that should be async
grep -r "^def " --include="*.py" app/ | grep -v "__init__\|property\|classmethod"
# Should mostly be async def in main.py, services/

# 4. Find missing error handling
grep -r "await.*get\|await.*post\|llm.invoke\|redis.get\|db.query" --include="*.py" app/ | grep -v "try:\|except"
# Review each hit

# 5. Find cache keys without tenant prefix
grep -r "redis.set\|redis.get\|cache.set" --include="*.py" app/ | grep -v "f\"{.*tenant_id"
# Should use f-string with tenant_id

# 6. Find property returns without filtering
grep -r "return.*properties\|\.all()\|\.find()" --include="*.py" app/services/
# Check if filtering Sold/Blocked/Hold
```

---

## Security Checklist

### On Every Change:

- [ ] No new hardcoded secrets
- [ ] No SQL injection vectors (use ORM/parameterized queries)
- [ ] No XSS vectors (escape user input)
- [ ] No CSRF issues (use tokens on POST/PUT/DELETE)
- [ ] Authentication checked on protected endpoints
- [ ] Multi-tenant isolation maintained (tenant_id filters)
- [ ] Rate limiting not bypassed
- [ ] Error messages don't leak system info
- [ ] Logging doesn't contain sensitive data

---

## Performance Checklist

- [ ] No N+1 queries (use joins/eager loading)
- [ ] Indexes created on frequently queried columns
- [ ] Redis caching used for expensive operations (5-min TTL)
- [ ] Pagination implemented for large result sets
- [ ] Timeouts set on all external API calls
- [ ] Async operations used to prevent blocking
- [ ] Database connections pooled (not created per request)
- [ ] Logging level appropriate (not DEBUG in production)

---

**Version**: 1.0.0 | Last Updated: April 24, 2026
