# RAG Setup Guide: Ollama Embeddings + ChromaDB

This guide explains how to set up the RAG (Retrieval-Augmented Generation) system for the chatbot using local Ollama embeddings.

## Architecture

```
Your Documents
    ↓
Embedding Script (embed_documents.py)
    ↓
Ollama LLM (nomic-embed-text model)
    ↓
ChromaDB (Vector Storage)
    ↓
FastAPI Backend (Semantic Search)
    ↓
Chatbot UI (Context-aware responses)
```

## Prerequisites

### 1. Ollama Installed & Running

**Mac/Linux:**
```bash
# Download from https://ollama.ai
# Or install via Homebrew:
brew install ollama

# Start Ollama server
ollama serve

# In another terminal, pull the embedding model:
ollama pull nomic-embed-text
```

**Windows (WSL2):**
```bash
# Install Ollama for Windows from https://ollama.ai/download/windows

# Start service (runs in background automatically)
# Test: curl http://localhost:11434/api/tags
```

### 2. Verify Ollama is Running

```bash
# Test connection
curl http://localhost:11434/api/generate -d '{"model":"nomic-embed-text","prompt":"test"}'

# Should return JSON response (not error)
```

## Quick Start: Index Your Documents

### Step 1: Prepare Your Documents

Create a file with your real estate documents (JSON, TXT, or MD format):

**Option A: JSON Format** (`documents.json`)
```json
{
  "documents": [
    "Luxury villa in Dubai Marina with 4 bedrooms...",
    "Modern apartment in Downtown Dubai...",
    "Commercial office space in Business Bay..."
  ]
}
```

**Option B: Text Format** (`documents.txt`)
```
Luxury villa in Dubai Marina with 4 bedrooms, stunning sea views...

Modern apartment in Downtown Dubai, perfect for professionals...

Commercial office space in Business Bay, high-speed internet...
```

**Option C: Use Sample Data**
```bash
# Already provided in scripts/sample_documents.json
cp scripts/sample_documents.json my_documents.json
```

### Step 2: Run Embedding Script

```bash
# Navigate to backend-ai directory
cd backend-ai

# Activate virtual environment (if not active)
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Run embedding script
python scripts/embed_documents.py \
  --tenant "dubaitt11" \
  --project "real-estate-ai" \
  --file "scripts/sample_documents.json"

# Expected output:
# ============================================================
# Embedding Result: SUCCESS
# ============================================================
# {
#   "indexed": 12,
#   "chunks": 48,
#   "collection": "dubaitt11:project_real-estate-ai",
#   "status": "success"
# }
```

### Step 3: Verify Embeddings

```bash
# Query the embedded documents
python scripts/embed_documents.py \
  --tenant "dubaitt11" \
  --project "real-estate-ai" \
  --file "scripts/sample_documents.json"  # Can re-run to update

# Check ChromaDB files
ls -la chroma_data/
# Should see: index/, indexes.db, etc.
```

## API Integration

The embeddings are automatically used by:

### 1. **Chat Endpoint** (FastAPI)
```python
# POST /chat
# Backend automatically retrieves relevant context before generating response
{
  "message": "Tell me about luxury properties in Dubai",
  "tenant_id": "dubaitt11"
}

# Response includes RAG context:
{
  "response": "Based on our luxury property listings...",
  "context": [
    {"text": "Luxury villa...", "score": 0.95},
    ...
  ]
}
```

### 2. **Retrieval Endpoint** (if exposed)
```bash
curl -X POST http://localhost:8000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "4 bedroom villa with pool",
    "tenant_id": "dubaitt11",
    "project_id": "real-estate-ai",
    "top_k": 3
  }'
```

## Model Information

### nomic-embed-text (Recommended)
- **Dimensions:** 768
- **Context Length:** 8,192 tokens
- **Speed:** Fast (optimized for local inference)
- **Quality:** High (better than OpenAI Ada for RAG)
- **Size:** ~274 MB
- **Cost:** Free (local)

### Alternative Models

If you want to try other Ollama models:

```bash
# Pull alternative models
ollama pull mistral:embed      # 1024 dims
ollama pull llama2             # 4096 dims (larger, slower)
```

## Troubleshooting

### Issue: Ollama Connection Error
```
Error: connection refused at localhost:11434
```
**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it:
ollama serve
```

### Issue: Model Not Found
```
Error: model 'nomic-embed-text' not found
```
**Solution:**
```bash
ollama pull nomic-embed-text
```

### Issue: Out of Memory
```
Error: CUDA out of memory or OOM
```
**Solution:**
```bash
# Use CPU instead of GPU
export OLLAMA_NUM_GPU=0
ollama serve

# Or reduce batch size in indexer.py
```

### Issue: ChromaDB Collection Not Found
```
Error: collection not found
```
**Solution:**
```bash
# Re-run embedding script to create collection
python scripts/embed_documents.py --tenant "dubaitt11" --file "documents.json"

# Or check persistence directory
ls -la chroma_data/
```

## Adding More Documents

### Real Estate Data You Should Embed

1. **Property Listings**
   - Features, amenities, location
   - Price range, rental rates
   - Neighborhood information

2. **Project Information**
   - Master plan details
   - Amenities and facilities
   - Developer info, timeline

3. **Community Guides**
   - Schools, hospitals, shopping
   - Transportation, utilities
   - Safety, security features

4. **Legal/Compliance**
   - Ownership rules, REIT info
   - Transaction process, fees
   - Visa sponsorship details

### Example: Adding Property Documents

```bash
# Create documents.json with your property data
cat > documents.json << 'EOF'
{
  "documents": [
    "Marina Tower - 30-storey residential development...",
    "Downtown Plaza - Mixed-use commercial property...",
    "..."
  ]
}
EOF

# Embed them
python scripts/embed_documents.py \
  --tenant "dubaitt11" \
  --project "properties" \
  --file "documents.json"

# Use in chatbot
# User: "What properties do you have in Marina?"
# Bot: [Retrieves Marina Tower info] "We have Marina Tower, a 30-storey development..."
```

## Performance Tips

1. **Chunk Size:** Currently 500 chars/chunk. Adjust in `indexer.py`:
   ```python
   self.text_splitter = RecursiveCharacterTextSplitter(
       chunk_size=800,    # Larger = fewer chunks, less context
       chunk_overlap=100, # Overlap for continuity
   )
   ```

2. **Search Results:** Default is top 3 results. Adjust in retriever:
   ```python
   await semantic_search(query, tenant_id, top_k=5)
   ```

3. **Similarity Threshold:** Default 0.3 (loose matching). Adjust:
   ```python
   await semantic_search(query, tenant_id, score_threshold=0.5)
   ```

## Testing RAG System

### 1. Unit Test
```bash
cd backend-ai
pytest app/rag/tests/  # When tests are created
```

### 2. Integration Test
```bash
# Start FastAPI
python -m uvicorn app.main:app --reload

# Test chat endpoint with RAG
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about 2-bedroom apartments in Downtown",
    "tenant_id": "dubaitt11"
  }'
```

### 3. Manual Testing
```python
# Python REPL
from app.rag.retriever import get_retriever
import asyncio

retriever = get_retriever()
results = asyncio.run(retriever.semantic_search(
    "luxury villas with pool",
    tenant_id="dubaitt11"
))
print(results)
```

## Production Deployment

When deploying to Render:

1. **Environment Variables**
   ```env
   OLLAMA_HOST=http://ollama:11434
   OLLAMA_MODEL=nomic-embed-text
   ```

2. **Docker Compose** (include Ollama service)
   ```yaml
   ollama:
     image: ollama/ollama:latest
     ports:
       - "11434:11434"
     volumes:
       - ollama_data:/root/.ollama
   ```

3. **Pre-load Model**
   ```bash
   # In Docker entrypoint
   ollama pull nomic-embed-text
   ```

## References

- [Ollama Documentation](https://ollama.ai/docs)
- [ChromaDB Documentation](https://docs.trychroma.com)
- [Embedding Models Comparison](https://www.sbert.net/docs/pretrained_models.html)
- [RAG Best Practices](https://docs.llamaindex.ai/en/latest/getting_started/concepts.html)
