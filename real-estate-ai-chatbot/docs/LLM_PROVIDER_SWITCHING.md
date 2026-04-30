# LLM Provider Switching Guide

This FastAPI service supports **multiple LLM providers** with **Ollama as the default**. Switch between providers with **zero code changes** — only update `.env`.

---

## Supported Providers

| Provider | Type | Cost | Setup | Model |
|----------|------|------|-------|-------|
| **Ollama** | Local | Free | Docker | llama3.2 |
| **Groq** | Cloud | Free tier | API key | mixtral-8x7b-32768 |
| **OpenAI** | Cloud | Paid | API key | gpt-4-turbo |
| **Google Gemini** | Cloud | Free tier | API key | gemini-pro |

---

## How It Works

### Architecture

```
┌─────────────────────────────────────┐
│   FastAPI Application (main.py)      │
│  ────────────────────────────────   │
│  • LangGraph Orchestrator            │
│  • WhatsApp Webhook Handler          │
│  • Health Checks                     │
└──────────────────┬──────────────────┘
                   │
        ┌──────────▼──────────┐
        │  LLM Factory        │
        │ (llm_factory.py)    │
        │ ────────────────── │
        │ get_llm()           │
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────────────────────────────┐
        │              LLM_PROVIDER                    │
        ▼              (from .env)                     ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
   │  Ollama  │    │   Groq   │    │ OpenAI   │    │ Gemini   │
   │  Local   │    │  Cloud   │    │  Cloud   │    │  Cloud   │
   └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Key Files

- **`app/config.py`** — Pydantic settings with all LLM config options
- **`app/agents/llm_factory.py`** — Factory function `get_llm()` that instantiates the right LLM
- **`app/agents/orchestrator.py`** — LangGraph orchestrator using `get_llm()` from factory
- **`.env.example`** — Template with all provider configurations

---

## Quick Start

### 1. Default Setup (Ollama — Already Configured)

```bash
# Nothing to do! Ollama is the default
# .env has LLM_PROVIDER=ollama

docker-compose up -d ollama
make pull-model  # Download llama3.2 model
```

### 2. Switch to Groq (5 minutes)

```bash
# 1. Get free API key: https://console.groq.com
# 2. Edit .env:
nano backend-ai/.env

# Change these lines:
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here

# 3. Restart service
docker-compose restart backend-ai

# Done! Service now uses Groq for all LLM calls
```

### 3. Switch to OpenAI (5 minutes)

```bash
# 1. Get paid API key: https://platform.openai.com/api-keys
# 2. Edit .env:
nano backend-ai/.env

# Change these lines:
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# 3. Restart service
docker-compose restart backend-ai
```

### 4. Switch to Google Gemini (5 minutes)

```bash
# 1. Get free API key: https://ai.google.dev
# 2. Edit .env:
nano backend-ai/.env

# Change these lines:
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_gemini_api_key_here

# 3. Restart service
docker-compose restart backend-ai
```

---

## Configuration Reference

### Environment Variables in `.env`

```env
# ========== LLM PROVIDER SELECTION ==========
LLM_PROVIDER=ollama              # "ollama", "groq", "openai", "gemini"
LLM_MODEL=llama3.2               # Model name (varies by provider)
LLM_TEMPERATURE=0.7              # Creativity (0.0-1.0)
LLM_MAX_TOKENS=1000              # Response length
LLM_TIMEOUT_SECONDS=60           # API timeout

# ========== OLLAMA (Local) ==========
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2

# ========== GROQ (Cloud) ==========
GROQ_API_KEY=                    # Required when LLM_PROVIDER=groq
GROQ_MODEL=mixtral-8x7b-32768

# ========== OPENAI (Cloud) ==========
OPENAI_API_KEY=                  # Required when LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4-turbo

# ========== GOOGLE GEMINI (Cloud) ==========
GOOGLE_API_KEY=                  # Required when LLM_PROVIDER=gemini
GOOGLE_MODEL=gemini-pro
```

---

## Code Integration

### Using the LLM in Your Code

```python
# In any part of the application:
from app.agents.llm_factory import get_llm

# Get the configured LLM (based on .env)
llm = get_llm()

# Use it
response = llm.invoke("Your prompt here")
print(response.content)
```

### In the Orchestrator

```python
# app/agents/orchestrator.py
from app.agents.llm_factory import get_llm

class WhatsAppChatbotOrchestrator:
    def __init__(self):
        # Automatically uses provider from .env
        self.llm = get_llm()
    
    async def _classify_intent_node(self, state):
        # self.llm automatically uses the right provider
        response = self.llm.invoke("classify this message...")
```

---

## Provider Comparison

### Ollama (Default)
- **Cost**: Free
- **Setup**: Docker container
- **Model**: llama3.2 (7B, 13B, or 70B)
- **Latency**: Fast (local)
- **Privacy**: All data local, no external API calls
- **Best for**: Development, testing, privacy-critical deployments

```bash
# Setup
docker-compose up ollama
docker exec ollama ollama pull llama3.2
```

### Groq
- **Cost**: Free tier (high rate limits)
- **Setup**: Get API key (1 min)
- **Model**: mixtral-8x7b-32768 (very fast)
- **Latency**: Ultra-fast (optimized hardware)
- **Privacy**: Groq sees requests
- **Best for**: Speed-critical, high-volume production

```bash
# Get key: https://console.groq.com
# Set in .env: GROQ_API_KEY=...
# Switch: LLM_PROVIDER=groq
```

### OpenAI
- **Cost**: Paid (usage-based, ~$0.01 per 1K tokens for gpt-4)
- **Setup**: Get API key (1 min)
- **Model**: gpt-4-turbo, gpt-4, gpt-3.5-turbo
- **Latency**: ~1-2 seconds
- **Privacy**: OpenAI sees requests
- **Best for**: Highest quality, advanced capabilities

```bash
# Get key: https://platform.openai.com/api-keys
# Billing required (credit card)
# Set in .env: OPENAI_API_KEY=sk-...
```

### Google Gemini
- **Cost**: Free tier (limited requests)
- **Setup**: Get API key (1 min)
- **Model**: gemini-pro (competitive with gpt-3.5)
- **Latency**: ~1-2 seconds
- **Privacy**: Google sees requests
- **Best for**: Cost-effective, Google ecosystem integration

```bash
# Get key: https://ai.google.dev
# Free tier available
# Set in .env: GOOGLE_API_KEY=...
```

---

## Testing Different Providers

### 1. Local Test Endpoint

FastAPI includes a test endpoint (debug mode only):

```bash
# Set DEBUG=true in .env, then restart

curl -X POST "http://localhost:8000/ai/test-intent?message=What%20projects%20do%20you%20have"

# Response will show which provider was used
{
  "message": "What projects do you have",
  "response": "{\"intent\": \"project_discovery\", \"confidence\": 0.95}",
  "llm_provider": "ollama"
}
```

### 2. Compare Response Quality

```bash
# Test each provider
for provider in ollama groq openai gemini; do
  echo "Testing $provider..."
  sed -i "s/LLM_PROVIDER=.*/LLM_PROVIDER=$provider/" backend-ai/.env
  docker-compose restart backend-ai
  sleep 5
  curl -X POST "http://localhost:8000/ai/test-intent?message=What%20is%20the%20price"
done
```

### 3. Benchmark Performance

```bash
# In backend-ai/app/main.py, add timing logs
# Then restart and check logs

docker-compose logs -f backend-ai | grep "Intent classification"
```

---

## Troubleshooting

### LLM Not Initializing

```bash
# Check logs
docker-compose logs backend-ai

# Verify .env is correct
cat backend-ai/.env | grep LLM_PROVIDER

# If Ollama: check it's running
docker-compose exec ollama ollama ls

# If cloud provider: verify API key
docker-compose exec backend-ai printenv | grep GROQ_API_KEY
```

### Slow Responses

- **Ollama**: Upgrade model size or use Groq cloud
- **Groq**: Check rate limits (free tier: 30 calls/minute)
- **OpenAI**: gpt-4-turbo is slower than gpt-3.5-turbo
- **Gemini**: Check quota, free tier has strict limits

### High Costs (OpenAI/Gemini)

```bash
# Switch back to free Ollama or Groq
LLM_PROVIDER=ollama
# or
LLM_PROVIDER=groq
```

### API Key Issues

```bash
# Verify key format:
# - Groq: starts with "gsk_"
# - OpenAI: starts with "sk-"
# - Google: alphanumeric string

# Remove spaces from .env
sed -i 's/ //g' backend-ai/.env

# Restart
docker-compose restart backend-ai
```

---

## Production Considerations

### Recommended Setup by Scale

**Small (< 100 WhatsApp sessions/day)**
- Provider: **Ollama** (local)
- Reason: Free, no API calls, instant response
- Cost: $0/month

**Medium (100-1000 sessions/day)**
- Provider: **Groq** (cloud)
- Reason: Free tier, ultra-fast, no ops burden
- Cost: $0-10/month (free tier covers most)

**Large (1000+ sessions/day)**
- Provider: **OpenAI** (gpt-4) or **Groq** (high quota)
- Reason: Highest quality, scalable
- Cost: $100-1000/month depending on volume

### Multi-Provider Failover (Advanced)

To implement automatic failover between providers:

```python
# app/agents/llm_factory.py (future enhancement)

async def get_llm_with_fallback() -> BaseLLM:
    """Try primary provider, fallback to secondary."""
    try:
        return get_llm()  # Try primary
    except Exception:
        logger.warning("Primary LLM failed, trying fallback")
        settings.llm_provider = "ollama"
        return get_llm()  # Fallback to Ollama
```

---

## API Reference

### `get_llm()`

```python
from app.agents.llm_factory import get_llm

llm = get_llm()  # Returns BaseLLM instance (Ollama, Groq, OpenAI, or Gemini)
response = llm.invoke("Your prompt")
```

**Returns**: `langchain_core.language_models.BaseLLM`
**Raises**: `ValueError` if provider not supported or credentials missing

### `get_llm_async()`

```python
from app.agents.llm_factory import get_llm_async

llm = await get_llm_async()  # Async version (same result)
```

---

## FAQ

**Q: Can I switch providers without restarting?**
A: No, service restart is needed. Takes ~5 seconds.

**Q: Which provider is fastest?**
A: Groq (10-20 tokens/second)

**Q: Which is cheapest?**
A: Ollama (free, but requires GPU)

**Q: Can I use multiple providers simultaneously?**
A: Not with current setup. Would require LB + route by intent. Consider for Phase 2.

**Q: What if I run out of Ollama VRAM?**
A: Switch to cloud provider, or reduce model size (llama3.2:7b)

**Q: Does switching providers affect accuracy?**
A: Minimally. All models are competitive for intent classification.

---

**Last Updated**: April 24, 2026 | Version: 1.0.0
