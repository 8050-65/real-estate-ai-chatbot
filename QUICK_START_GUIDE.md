# ⚡ Quick Start Guide - Copy & Paste Commands

**Fastest way to get the entire system running locally**

---

## 🚀 One Command to Rule Them All

### Option 1: Everything with Docker (RECOMMENDED - 30 seconds)

```bash
# Navigate to project
cd real-estate-ai-chatbot

# Start all services
docker compose up -d

# Wait 30 seconds for services to start...

# In a new terminal, start frontend
cd frontend && npm install && npm run dev

# Done! Access:
# Frontend: http://localhost:3000
# API: http://localhost:8080
# AI Service: http://localhost:8000
```

**That's it! Everything runs in the background.**

---

## 📱 Access the Application

After running the commands above:

```
Frontend:       http://localhost:3000
Login:          admin@crm-cbt.com / Admin@123!
API Docs:       http://localhost:8080/swagger-ui.html
AI Service:     http://localhost:8000
Database:       PostgreSQL on localhost:5432
Cache:          Redis on localhost:6379
LLM:            Ollama on localhost:11434
```

---

## 🛑 Stop Everything

```bash
# Stop all Docker services
docker compose down

# Optional: Keep data for next restart
# Data is kept in Docker volumes by default

# Or reset everything (WARNING: Deletes all data!)
docker compose down -v
```

---

## 🔄 Individual Service Start/Stop

### Frontend Only
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Stop Frontend
```bash
# Press Ctrl+C in the terminal where it's running
```

### Backend Only (Manual)
```bash
# Terminal 1: Start only database & cache
docker compose up postgres redis

# Terminal 2: Start Spring Boot
cd backend-java
./mvnw spring-boot:run
# API on http://localhost:8080

# Terminal 3: Start FastAPI
cd backend-ai
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
# AI Service on http://localhost:8000
```

---

## 🧪 Run Tests

### All Tests
```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend-java && ./mvnw test

# FastAPI tests
cd backend-ai && pytest
```

### Watch Mode (Keep Running & Re-run on Changes)
```bash
# Frontend watch
cd frontend && npm run test:watch
```

### Coverage Report
```bash
# Frontend coverage
cd frontend && npm run test:coverage

# Backend coverage
cd backend-java && ./mvnw test jacoco:report

# FastAPI coverage
cd backend-ai && pytest --cov=app --cov-report=html
```

---

## 🗄️ Database

### Access Database
```bash
# Get into PostgreSQL CLI
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev

# Common commands:
\dt              # List all tables
SELECT * FROM users;  # See users
\q               # Quit
```

### Backup Database
```bash
docker compose exec postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup.sql
```

### Restore Database
```bash
docker compose exec -T postgres psql -U rootuser -d crm_cbt_db_dev < backup.sql
```

### Reset Database (Delete All Data)
```bash
docker compose down -v
docker compose up -d
# Wait 30 seconds for it to reinitialize
```

---

## 🤖 Ollama (Local LLM)

### Pull Models
```bash
# List available models
ollama list

# Download a model
ollama pull llama2         # Meta's Llama (7B)
ollama pull mistral        # Mistral (7B)
ollama pull neural-chat    # Intel Neural Chat (7B)
```

### Use a Model
```bash
# Run interactive chat
ollama run llama2

# Ask a question
ollama run llama2 "Explain what a chatbot is"

# Use in API (FastAPI is already configured)
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "prompt": "Hello!",
    "stream": false
  }'
```

---

## 📝 Common Issues & Fixes

### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### Docker Containers Not Starting
```bash
# Check status
docker compose ps

# View logs
docker compose logs

# Restart
docker compose restart

# Reset completely
docker compose down -v
docker compose up -d
```

### Can't Connect to API from Frontend
```bash
# Check if Spring Boot is running
curl http://localhost:8080/health

# Check CORS is enabled (it should be by default)

# Try accessing API directly
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}'

# Should return a JWT token
```

### Module Not Found Errors
```bash
# Frontend
cd frontend
rm -rf node_modules
npm install

# Backend
cd backend-java
./mvnw clean install

# FastAPI
cd backend-ai
pip install -r requirements.txt --upgrade
```

---

## 🔍 Verify Everything is Working

```bash
# Test Frontend
curl http://localhost:3000 | head -c 100

# Test Backend API
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}'

# Test FastAPI
curl http://localhost:8000/health

# Test Database
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT COUNT(*) FROM users;"

# Test Redis
docker compose exec redis redis-cli ping
# Should return: PONG

# All should show success ✅
```

---

## 📦 Build for Production

### Frontend
```bash
cd frontend
npm run build
npm start
# Optimized app on http://localhost:3000
```

### Backend
```bash
cd backend-java
./mvnw clean package
java -jar target/crm-backend-1.0.0.jar
# API on http://localhost:8080
```

### FastAPI
```bash
cd backend-ai
pip install gunicorn
gunicorn app.main:app -w 4 -b 0.0.0.0:8000
# AI Service on http://localhost:8000
```

### Docker
```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Run production
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 📊 View Logs

### All Logs
```bash
docker compose logs -f
```

### Specific Service
```bash
docker compose logs -f backend-java      # Spring Boot
docker compose logs -f backend-ai        # FastAPI
docker compose logs -f postgres          # Database
docker compose logs -f redis             # Cache
```

### Last 50 Lines
```bash
docker compose logs --tail 50 backend-java
```

---

## 🧹 Clean Up

### Stop All Containers
```bash
docker compose down
```

### Stop & Remove Data
```bash
docker compose down -v
```

### Clean Up Everything (Careful!)
```bash
docker system prune -a
docker volume prune
docker network prune
```

### Start Fresh
```bash
docker compose down -v
docker compose up -d
cd frontend && npm run dev
```

---

## 🎯 Development Workflow

```bash
# 1. Start everything
docker compose up -d && cd frontend && npm run dev

# 2. Make code changes in your editor
# (Hot reload automatically applies changes)

# 3. Run tests as needed
npm test:watch                  # Frontend (auto re-runs)
./mvnw test                     # Backend (run manually)
pytest --watch                  # FastAPI (if available)

# 4. When done
docker compose down             # Stop containers
git add -A && git commit -m "Your changes"
git push                        # Push to remote
```

---

## 📞 Need Help?

**Check the full documentation:**
```bash
# For all possible commands
cat COMPLETE_SETUP_COMMANDS.md

# For project overview
cat PROJECT_COMPLETION_SUMMARY.md

# For test information
cat TEST_GUIDE.md

# For troubleshooting
cat COMPLETE_SETUP_COMMANDS.md | grep -A 20 "Troubleshooting"
```

---

## ✅ Checklist

After running `docker compose up -d && npm run dev`:

- [ ] Frontend loads at http://localhost:3000
- [ ] Login page appears
- [ ] Can log in with admin@crm-cbt.com / Admin@123!
- [ ] Dashboard page loads
- [ ] Spring Boot API responds at http://localhost:8080
- [ ] FastAPI health check at http://localhost:8000/health
- [ ] Database has 10 tables (check with `docker compose exec postgres psql...`)
- [ ] Redis responds (check with `docker compose exec redis redis-cli ping`)

If all above are ✅, everything is working! 🎉

---

## 🚨 Remember

```bash
# NEVER lose your database:
# Always backup before: docker compose down -v
# Backup command: docker compose exec postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup.sql

# DON'T commit sensitive data:
# .env files are in .gitignore (they're safe)
# API keys stay in environment variables, not in code

# ALWAYS check docker status:
# docker compose ps       # See what's running
# docker compose logs -f  # See what's happening
```

---

**Ready to code? Run this now:**
```bash
docker compose up -d && cd frontend && npm install && npm run dev
```

**Then open:** http://localhost:3000

**Login with:** admin@crm-cbt.com / Admin@123!

**Let's go! 🚀**

---

*For detailed commands, see COMPLETE_SETUP_COMMANDS.md*
*For testing guide, see TEST_GUIDE.md*
*For project overview, see PROJECT_COMPLETION_SUMMARY.md*
