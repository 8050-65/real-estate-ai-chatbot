# Local Testing & Debugging Guide

## Run All Services at Once

### Windows PowerShell (One Terminal)
```powershell
# Terminal 1: FastAPI Backend (port 8000)
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Spring Boot Backend (port 8080) via Docker
cd backend-java
docker build -t leadrat-springboot-backend:latest .
docker run --rm -p 8080:8080 leadrat-springboot-backend:latest

# Terminal 3: Frontend (port 3000)
cd frontend
npm run dev
```

### Bash/Linux (One Command - Parallel)
```bash
# Kill existing processes
lsof -ti:8000,8080,3000 | xargs kill -9 2>/dev/null || true

# Start all in background
cd backend-ai && python -m uvicorn app.main:app --reload --port 8000 &
sleep 2
cd ../backend-java && docker build -t leadrat-springboot-backend:latest . && docker run --rm -p 8080:8080 leadrat-springboot-backend:latest &
sleep 3
cd ../frontend && npm run dev &

# All services running:
# - FastAPI:    http://localhost:8000
# - Spring Boot: http://localhost:8080
# - Frontend:    http://localhost:3000
```

## Testing Checklist

### 1. Backend API Status
```bash
# Check FastAPI health
curl http://localhost:8000/health

# Check Spring Boot health
curl http://localhost:8080/health
```

### 2. Test Property Search Flow
1. Open http://localhost:3000 in browser
2. Click "Properties" button in chatbot
3. **Verify**: Chat should return property cards with data from Leadrat API
4. **Expected data**: Property name, price, location, status, image

### 3. Check Network Requests (DevTools)
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Click "Properties" in chat
4. **Verify requests**:
   - POST `/api/v1/chat/message` → FastAPI (should return template: "properties")
   - GET `/api/v1/properties?tenantId=...` → Spring Boot (should return property list)

### 4. Environment Variables to Check

**Frontend (.env.local or next.config.js)**:
```javascript
// next.config.js rewrites
beforeFiles: [
  { source: '/api/v1/:path*', destination: 'http://localhost:8080/api/v1/:path*' },
  { source: '/fastapi/:path*', destination: 'http://localhost:8000/:path*' }
]
```

**Spring Boot (application.properties)**:
```properties
leadrat.api.base-url=https://api.leadrat.com
leadrat.api.default-tenant=dubait11
```

**FastAPI (app/config.py)**:
```python
LEADRAT_API_BASE_URL = "https://api.leadrat.com"
LEADRAT_API_KEY = "your-api-key"
```

## Common Issues

### Properties Not Showing
1. Check Spring Boot logs: `docker logs <container_id>`
2. Verify Leadrat API credentials in backend
3. Check frontend receiving correct response shape
4. Verify tenantId is being passed correctly

### API Calls Failing
1. Check CORS configuration on Spring Boot
2. Verify request headers (Authorization, Content-Type)
3. Look at browser console for error details
4. Check Network tab response status and body

### Production vs Local Difference
- **Local**: Uses `http://localhost:8080` (via next.config.js rewrites)
- **Production**: Must use actual backend URL (Render, AWS, etc.)
- **Issue**: If production URL is wrong or API credentials missing, all requests fail

## Debug the "Properties" Flow

### Frontend Debug (ChatInterface.tsx)
1. Check if intent === "properties" is being recognized
2. Verify chat response includes `template: "properties"`
3. Check if data array has property items
4. Verify card rendering without errors

### Backend Debug (FastAPI + Spring Boot)
1. FastAPI should classify user intent as "properties"
2. FastAPI should call Spring Boot `/api/v1/properties` endpoint
3. Spring Boot should fetch from Leadrat API and return filtered results
4. Response should include tenant-specific properties only

## Next Steps
1. Run all services locally
2. Test properties search end-to-end
3. Check browser console and Network tab
4. Share errors/logs if not working
