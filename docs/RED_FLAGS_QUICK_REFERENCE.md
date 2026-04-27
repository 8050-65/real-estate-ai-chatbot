# 🚨 Red Flags — Quick Reference Card

**Print this & pin it next to your desk!**

---

## Red Flag 1: Direct LLM Instantiation

```
❌ WRONG:
from langchain_ollama import OllamaLLM
llm = OllamaLLM(model="llama3.2")

✅ RIGHT:
from app.agents.llm_factory import get_llm
llm = get_llm()
```
**Why**: Factory pattern allows switching providers via `.env` only.

---

## Red Flag 2: Hardcoded Configuration

```
❌ WRONG:
LEADRAT_TENANT = "black"
OLLAMA_URL = "http://localhost:11434"
JWT_SECRET = "my-secret"

✅ RIGHT:
from app.config import settings
tenant = settings.leadrat_tenant
url = settings.ollama_base_url
secret = settings.jwt_secret_key
```
**Why**: Hardcoded values are security vulnerabilities & not scalable.

---

## Red Flag 3: Synchronous Functions

```
❌ WRONG:
def fetch_properties():
    response = requests.get(url)  # BLOCKS!
    return response.json()

@app.post("/webhook")
def process():  # BLOCKS!
    return result

✅ RIGHT:
async def fetch_properties():
    async with httpx.AsyncClient() as client:
        response = await client.get(url)  # Non-blocking
    return response.json()

@app.post("/webhook")
async def process():  # Non-blocking
    return result
```
**Why**: FastAPI is async-first. Sync functions kill concurrency & throughput.

---

## Red Flag 4: Missing Error Handling

```
❌ WRONG:
response = await client.get(url)
data = response.json()
lead_id = data['lead']['id']  # What if this fails?

✅ RIGHT:
try:
    response = await client.get(url)
    response.raise_for_status()
    data = response.json()
    lead_id = data.get('lead', {}).get('id')
    if not lead_id:
        raise ValueError("Lead ID missing")
except httpx.TimeoutException:
    logger.error("Timeout")
    return {"status": "retry"}
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)
    return {"status": "error"}
```
**Why**: Unhandled exceptions crash the service or confuse users.

---

## Red Flag 5: Missing Tenant Prefix in Cache Keys

```
❌ WRONG:
redis.set("session:123", data)         # Builder A sees Builder B's data!
redis.set("properties", all_props)
cache.set("leadrat_token", token)

✅ RIGHT:
tenant_id = state['tenant_id']
redis.set(f"{tenant_id}:session:123", data)      # Isolated!
redis.set(f"{tenant_id}:properties", all_props)
cache.set(f"{tenant_id}:leadrat_token", token)
```
**Tenant Key Pattern**: `{tenant_id}:{resource}:{identifier}`

**Why**: Multi-tenant system MUST isolate data by tenant. Data privacy critical.

---

## Red Flag 6: Not Filtering Blocked/Sold Properties

```
❌ WRONG:
def get_properties(project_id):
    response = await leadrat.get(f"/property?project_id={project_id}")
    return response.json()['properties']
    # User sees: "Unit 101 - Available", "Unit 102 - Sold" ← CONFUSING!

✅ RIGHT:
async def get_properties(project_id) -> list:
    response = await leadrat.get(f"/property?project_id={project_id}")
    all_props = response.json().get('properties', [])
    
    # Filter unavailable
    available = [
        p for p in all_props
        if p.get('status') not in ['Sold', 'Blocked', 'Hold']
    ]
    return available
    # User sees: "Unit 101 - Available", "Unit 103 - Available" ← CLEAR!
```
**Why**: Showing sold/blocked units confuses users, creates false leads.

---

## Quick Grep Checks

Paste into terminal to find red flags:

```bash
# 1. Direct LLM instantiation (should only be in llm_factory.py)
grep -r "OllamaLLM\|ChatGroq\|ChatOpenAI" app/ --include="*.py"

# 2. Hardcoded URLs/secrets
grep -r "http://\|https://\|API_KEY\|SECRET" app/ --include="*.py" | grep -v config.py

# 3. Sync functions in main/services
grep -r "^def " app/agents app/services app/webhook --include="*.py" | grep -v "__init__\|property"

# 4. Missing error handling (check context!)
grep -r "await.*get\|llm.invoke\|redis" app/ --include="*.py" | grep -v "try:" -B2

# 5. Missing tenant prefix
grep -r "redis.set\|redis.get\|cache.set" app/ --include="*.py" | grep -v 'f.*tenant'

# 6. Unfiltered property returns
grep -r "return.*properties" app/services --include="*.py" | grep -v "filter"
```

---

## Pre-Commit Checklist

**Before committing code:**

- [ ] Red Flag 1: Using `get_llm()` not direct instantiation?
- [ ] Red Flag 2: All config from `settings` not hardcoded?
- [ ] Red Flag 3: All I/O is `async def`?
- [ ] Red Flag 4: All external calls wrapped in try/except?
- [ ] Red Flag 5: All cache keys include `{tenant_id}`?
- [ ] Red Flag 6: Blocked/Sold properties filtered from results?

**Then run:**
```bash
black app/
mypy app/ --strict
pylint app/
pytest tests/ -v
```

---

## In Code Review Comments

Use these templates:

### Red Flag 1
> 🚨 **Red Flag 1**: This is direct LLM instantiation. Use `get_llm()` factory pattern from `app/agents/llm_factory.py` instead. This allows switching providers via `.env` without code changes.

### Red Flag 2
> 🚨 **Red Flag 2**: Hardcoded value detected: `{value}`. Use `settings.{field_name}` from `app/config.py` instead. Environment config must be in `.env`, not code.

### Red Flag 3
> 🚨 **Red Flag 3**: This function is synchronous. FastAPI requires `async def` for all I/O operations. Change to `async def` and use `await` for network/DB calls.

### Red Flag 4
> 🚨 **Red Flag 4**: This external API call has no error handling. Wrap in try/except and handle at least: `httpx.TimeoutException`, `httpx.HTTPError`, and generic `Exception`. Log all errors with `exc_info=True`.

### Red Flag 5
> 🚨 **Red Flag 5**: Cache key `{key}` is missing tenant prefix. Use `f"{tenant_id}:{resource}:{id}"` format to ensure multi-tenant isolation. This is a security issue.

### Red Flag 6
> 🚨 **Red Flag 6**: This returns all properties without filtering unavailable ones (Sold, Blocked, Hold). Users see confusing/invalid options. Filter before returning:
> ```python
> available = [p for p in properties if p['status'] not in ['Sold', 'Blocked', 'Hold']]
> ```

---

## Red Flag Frequency

Based on common mistakes in real estate software:

| Red Flag | Frequency | Severity |
|----------|-----------|----------|
| 1: Direct LLM | 40% of PRs | Medium |
| 2: Hardcoded config | 60% of PRs | High |
| 3: Sync functions | 50% of PRs | High |
| 4: Missing error handling | 70% of PRs | High |
| 5: Missing tenant prefix | 30% of PRs | Critical |
| 6: Unfiltered properties | 20% of PRs | Medium |

---

## Training

**New developer onboarding:**

1. Read this document (5 min)
2. Read `CODE_REVIEW_CHECKLIST.md` (15 min)
3. Grep for red flags in existing code (5 min)
4. Implement one feature following the patterns (1 hour)
5. Ask senior dev to review (15 min)
6. Fix feedback (15 min)

**Done!** Developer is now red-flag-aware.

---

**Print me! → Save as PDF → Share with team!**

Last Updated: April 24, 2026
