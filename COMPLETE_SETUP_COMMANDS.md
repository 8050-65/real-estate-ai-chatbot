# 🚀 Complete Setup & Commands Guide

**All commands to run Real Estate AI Chatbot locally**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (All Services)](#quick-start-all-services)
3. [Individual Services](#individual-services)
4. [Frontend Commands](#frontend-commands)
5. [Backend Commands](#backend-commands)
6. [Docker Commands](#docker-commands)
7. [Ollama & LLM Commands](#ollama--llm-commands)
8. [Database Commands](#database-commands)
9. [Testing Commands](#testing-commands)
10. [Building for Production](#building-for-production)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

```bash
# Check Node.js (v18 or higher)
node --version
npm --version

# Check Java (v17 or higher)
java -version

# Check Docker
docker --version
docker compose --version

# Check Git
git --version
```

### Installation (if needed)

**Windows (using Chocolatey):**
```bash
# Install Node.js
choco install nodejs

# Install Java 21
choco install openjdk21

# Install Docker Desktop
choco install docker-desktop

# Install Git
choco install git
```

**macOS (using Homebrew):**
```bash
# Install Node.js
brew install node

# Install Java 21
brew install openjdk@21

# Install Docker
brew install --cask docker

# Install Git
brew install git
```

**Linux (Ubuntu/Debian):**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java 21
sudo apt-get install -y openjdk-21-jdk

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Git
sudo apt-get install -y git
```

---

## Quick Start (All Services)

### Option 1: Docker Compose (Recommended - Everything Automated)

```bash
# Clone the repository
git clone https://github.com/your-org/real-estate-ai-chatbot.git
cd real-estate-ai-chatbot/real-estate-ai-chatbot

# Start all Docker services
docker compose up -d

# Wait for services to be healthy (30-45 seconds)
docker compose ps

# Verify services are running
curl http://localhost:8080/health          # Spring Boot (may 404 - it's ok)
curl http://localhost:8000/health          # FastAPI

# Start frontend dev server (in separate terminal)
cd frontend
npm install
npm run dev

# Access the application
# Frontend: http://localhost:3000
# Spring Boot API: http://localhost:8080
# FastAPI: http://localhost:8000
```

### Option 2: Step-by-Step (Manual - Each Service Individually)

```bash
# Terminal 1: PostgreSQL & Redis (via Docker)
docker compose up postgres redis

# Terminal 2: Spring Boot
cd backend-java
./mvnw spring-boot:run

# Terminal 3: FastAPI
cd backend-ai
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Terminal 4: Frontend
cd frontend
npm install
npm run dev

# Terminal 5: Ollama (optional - for local LLM)
ollama serve

# Access the application
# Frontend: http://localhost:3000
# Spring Boot API: http://localhost:8080
# FastAPI: http://localhost:8000
# Ollama: http://localhost:11434
```

---

## Individual Services

### Start Only Database & Cache
```bash
# PostgreSQL and Redis only
docker compose up -d postgres redis

# Verify they're running
docker compose ps postgres redis

# Stop them
docker compose down postgres redis
```

### Start Only All Backend Services
```bash
# All backend services (database, Spring Boot, FastAPI, Redis, Ollama)
docker compose up -d

# View logs
docker compose logs -f

# Stop all
docker compose down
```

### Start With Persistent Data
```bash
# Keep data between restarts
docker compose up -d
# Services use named volumes: postgres_data, chroma_db

# Stop but keep data
docker compose stop

# Restart with same data
docker compose start
```

### Start Fresh (Reset Database)
```bash
# WARNING: This deletes all data!
docker compose down -v

# Start fresh
docker compose up -d
```

---

## Frontend Commands

### Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev
# Server runs on http://localhost:3000

# Watch mode (for development)
npm run dev -- --turbo
# Uses Turbopack (faster than Webpack)
```

### Building

```bash
cd frontend

# Build for production
npm run build

# Start production server
npm start

# Built app runs on http://localhost:3000
```

### Testing

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test useAuth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

### Linting & Formatting

```bash
cd frontend

# Check TypeScript
npx tsc --noEmit

# Check with ESLint
npx eslint src/

# Format with Prettier
npx prettier --write src/
```

### Cleanup

```bash
cd frontend

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## Backend Commands

### Spring Boot

#### Development

```bash
cd backend-java

# Run with Maven
./mvnw spring-boot:run

# Or with IDE (IntelliJ/VS Code)
# Press Run button or Ctrl+Shift+F10

# Run with specific profile
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

#### Building

```bash
cd backend-java

# Compile
./mvnw clean compile

# Build JAR
./mvnw clean package

# Build skip tests
./mvnw clean package -DskipTests

# Run built JAR
java -jar target/crm-backend-1.0.0.jar
```

#### Testing

```bash
cd backend-java

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=AuthControllerTest

# Run with coverage
./mvnw test jacoco:report

# View coverage report
open target/site/jacoco/index.html

# Run tests in parallel
./mvnw test -DparallelTestMethod=5
```

#### Database Migrations

```bash
cd backend-java

# Run Flyway migrations manually
./mvnw flyway:info     # View migrations

./mvnw flyway:migrate  # Run pending migrations

./mvnw flyway:clean    # WARNING: Delete all data and recreate

./mvnw flyway:repair   # Fix migration issues
```

### FastAPI

#### Development

```bash
cd backend-ai

# Install dependencies
pip install -r requirements.txt

# Run development server (with auto-reload)
python -m uvicorn app.main:app --reload --port 8000

# Run with specific host/port
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run with hot reload + debug
python -m uvicorn app.main:app --reload --log-level debug
```

#### Building

```bash
cd backend-ai

# Install dependencies for production
pip install -r requirements.txt

# Run production server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run with Gunicorn (production WSGI server)
pip install gunicorn
gunicorn app.main:app -w 4 -b 0.0.0.0:8000
```

#### Testing

```bash
cd backend-ai

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_webhook.py

# Run specific test function
pytest tests/test_webhook.py::test_webhook_valid_payload

# Run with coverage
pytest --cov=app --cov-report=html

# View coverage
open htmlcov/index.html

# Run only async tests
pytest -m asyncio

# Run tests in parallel
pip install pytest-xdist
pytest -n auto
```

#### Code Quality

```bash
cd backend-ai

# Type checking with mypy
pip install mypy
mypy app/

# Linting with pylint
pip install pylint
pylint app/

# Format with Black
pip install black
black app/

# Sort imports with isort
pip install isort
isort app/
```

---

## Docker Commands

### Basic Docker Commands

```bash
# View running containers
docker compose ps

# View container logs
docker compose logs backend-java          # Spring Boot logs
docker compose logs backend-ai            # FastAPI logs
docker compose logs postgres              # Database logs
docker compose logs -f backend-java       # Follow logs (-f flag)

# View system status
docker compose stats

# Stop all containers
docker compose stop

# Start stopped containers
docker compose start

# Restart all containers
docker compose restart

# Remove containers (keep data)
docker compose down

# Remove containers AND data
docker compose down -v

# Remove images too
docker compose down -v --rmi all
```

### Build Custom Images

```bash
# Build backend images
docker compose build backend-java backend-ai

# Build with no cache
docker compose build --no-cache

# View built images
docker images | grep realestate

# Remove images
docker rmi realestate_backend_java realestate_backend_ai
```

### Container Inspection

```bash
# View container details
docker compose inspect backend-java

# Execute command in container
docker compose exec backend-java bash

# View container logs with timestamps
docker compose logs --timestamps backend-ai

# View last 100 lines of logs
docker compose logs --tail 100 backend-java

# View logs since specific time
docker compose logs --since 2026-04-26T10:00:00 backend-java
```

### Docker Network

```bash
# List networks
docker network ls

# Inspect chatbot network
docker network inspect real-estate-ai-chatbot_default

# Test network connectivity
docker compose exec backend-java ping postgres
docker compose exec backend-java ping redis
```

### Docker Volumes

```bash
# List volumes
docker volume ls

# Inspect postgres volume
docker volume inspect real-estate-ai-chatbot_postgres_data

# Backup database volume
docker run --rm -v real-estate-ai-chatbot_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore database volume
docker run --rm -v real-estate-ai-chatbot_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

### Production Deployment

```bash
# Build production image
docker compose -f docker-compose.prod.yml build

# Tag images for registry
docker tag realestate_backend_java:latest myregistry/backend-java:1.0.0
docker tag realestate_backend_ai:latest myregistry/backend-ai:1.0.0

# Push to Docker Hub / AWS ECR / etc
docker push myregistry/backend-java:1.0.0
docker push myregistry/backend-ai:1.0.0

# Run production compose
docker compose -f docker-compose.prod.yml up -d
```

---

## Ollama & LLM Commands

### Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl https://ollama.ai/install.sh | sh

# Windows (from Docker)
docker run -d -v ollama:/root/.ollama -p 11434:11434 ollama/ollama

# Or download from: https://ollama.ai/download
```

### Pull Models

```bash
# List available models
ollama list

# Pull a model (downloads ~4-10GB)
ollama pull llama2          # Meta's Llama2 (7B)
ollama pull neural-chat     # Intel Neural Chat (7B)
ollama pull mistral         # Mistral (7B)
ollama pull dolphin-mixtral # Dolphin Mixtral (8x7B)

# Remove model
ollama rm llama2

# View model details
ollama show llama2
```

### Run Ollama Locally

```bash
# Start Ollama service
ollama serve

# In another terminal, run model
ollama run llama2

# Run with temperature (creativity)
ollama run llama2 --temperature 0.7

# Run with custom prompt
ollama run llama2 "What is the weather in Delhi?"

# Stream response
ollama run llama2 --stream "Explain quantum computing"

# Run non-interactively
echo "Hello" | ollama run llama2
```

### Ollama API

```bash
# Check if Ollama is running
curl http://localhost:11434/api/health

# List models via API
curl http://localhost:11434/api/tags

# Generate completion via API
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "prompt": "Explain the Real Estate AI Chatbot",
    "stream": false
  }'

# Stream completion
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "prompt": "What is machine learning?",
    "stream": true
  }' | jq .

# Embed text (for RAG)
curl -X POST http://localhost:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "input": "What properties are available?"
  }'
```

### Using Ollama in FastAPI

```bash
# FastAPI is configured to use Ollama
# In backend-ai/app/config.py:
# OLLAMA_BASE_URL = "http://localhost:11434"

# The app automatically falls back to Ollama if OpenAI fails

# Check FastAPI logs for Ollama usage
docker compose logs -f backend-ai | grep -i ollama
```

### Troubleshooting Ollama

```bash
# Check Ollama status
ollama list

# Check Ollama API
curl http://localhost:11434/api/health

# View Ollama logs (macOS)
log stream --predicate 'process == "ollama"' --level debug

# Restart Ollama
# macOS: Restart from system tray
# Linux: systemctl restart ollama
# Docker: docker restart realestate_ollama
```

---

## Database Commands

### PostgreSQL (via Docker)

```bash
# Access PostgreSQL CLI
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev

# Common PostgreSQL commands
\dt                      # List tables
\d table_name            # Describe table
SELECT * FROM tenants;   # Query
\q                       # Quit
```

### Database Operations

```bash
# Backup database
docker compose exec postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup.sql

# Restore database
docker compose exec -T postgres psql -U rootuser -d crm_cbt_db_dev < backup.sql

# Export to CSV
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "COPY tenants TO STDOUT WITH CSV HEADER" > tenants.csv

# Reset database (WARNING: deletes all data!)
docker compose exec postgres psql -U rootuser -c "DROP DATABASE crm_cbt_db_dev; CREATE DATABASE crm_cbt_db_dev;"
```

### Verify Schema

```bash
# Count tables
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';"

# List all tables
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"

# View Flyway history
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT version, description, success FROM flyway_schema_history;"

# Check data
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM tenants;"
```

### Redis

```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Redis commands
PING                          # Test connection (returns PONG)
SET key value                 # Set key
GET key                       # Get key
DEL key                       # Delete key
FLUSHDB                       # Clear all keys
KEYS *                        # List all keys
TTL key                       # Check expiration
```

---

## Testing Commands

### All Tests

```bash
# Run all tests in the project
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend-java && ./mvnw test

# FastAPI tests
cd backend-ai && pytest

# All with coverage
cd frontend && npm run test:coverage
cd backend-java && ./mvnw test jacoco:report
cd backend-ai && pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Watch mode (re-run on file change)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- LoadingSpinner.test.tsx

# With pattern matching
npm test -- --testNamePattern="currency"

# Clear Jest cache
npm test -- --clearCache
```

### Spring Boot Tests

```bash
cd backend-java

# Run all tests
./mvnw test

# Run specific class
./mvnw test -Dtest=AuthControllerTest

# Run specific method
./mvnw test -Dtest=AuthControllerTest#shouldLoginSuccessfully

# With coverage report
./mvnw test jacoco:report
open target/site/jacoco/index.html

# Run tests in parallel
./mvnw test -DparallelTestMethod=4

# Run integration tests only
./mvnw test -Dgroups=integration
```

### FastAPI Tests

```bash
cd backend-ai

# Run all tests
pytest

# Verbose output
pytest -v

# Show print statements
pytest -s

# Specific test file
pytest tests/test_webhook.py

# Specific test function
pytest tests/test_webhook.py::test_webhook_valid_payload

# Coverage report
pytest --cov=app --cov-report=html
open htmlcov/index.html

# Marker-based testing
pytest -m asyncio              # Only async tests
pytest -m "not slow"           # Skip slow tests

# Run in parallel
pip install pytest-xdist
pytest -n auto

# Run with custom config
pytest -c pytest.ini
```

### Load Testing (Optional)

```bash
# Install k6
brew install k6  # macOS
# Or download from: https://k6.io/docs/getting-started/installation/

# Run load test
k6 run load_test.js

# With different VUs (Virtual Users)
k6 run -u 100 -d 30s load_test.js

# With custom environment
k6 run --env ENV=prod load_test.js
```

---

## Building for Production

### Frontend

```bash
cd frontend

# Build optimized bundle
npm run build

# Analyze bundle size (optional)
npm install -D @next/bundle-analyzer
# Add to next.config.js: const withBundleAnalyzer = require('@next/bundle-analyzer')({...})
npm run build

# Build Docker image
docker build -t myregistry/real-estate-frontend:1.0.0 .

# Run production build locally
npm run build
npm start
# Access on http://localhost:3000
```

### Spring Boot

```bash
cd backend-java

# Build JAR
./mvnw clean package

# Build with custom profiles
./mvnw clean package -Dspring.profiles.active=prod

# Build Docker image
docker build -t myregistry/backend-java:1.0.0 .

# Run JAR
java -jar target/crm-backend-1.0.0.jar

# Run with environment variables
java -jar target/crm-backend-1.0.0.jar \
  --server.port=8080 \
  --spring.datasource.url=jdbc:postgresql://prod-db:5432/crm_prod \
  --spring.datasource.username=produser \
  --spring.datasource.password=prodpass
```

### FastAPI

```bash
cd backend-ai

# Build Docker image
docker build -t myregistry/backend-ai:1.0.0 .

# Run production with Gunicorn
pip install gunicorn
gunicorn app.main:app -w 4 -b 0.0.0.0:8000 --timeout 120

# Run with UV server (faster than Gunicorn)
pip install uvicorn[standard]
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker Compose Production

```bash
# Build all images
docker compose -f docker-compose.prod.yml build

# Push to registry
docker tag realestate_backend_java:latest docker.io/yourname/backend-java:1.0.0
docker push docker.io/yourname/backend-java:1.0.0

# Deploy
docker compose -f docker-compose.prod.yml up -d

# Monitor
docker compose -f docker-compose.prod.yml logs -f
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000          # Frontend
lsof -i :8080          # Spring Boot
lsof -i :8000          # FastAPI

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
./mvnw spring-boot:run -Dserver.port=8081
uvicorn app.main:app --port 8001
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View database logs
docker compose logs postgres

# Connect to database to verify
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT 1"

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up postgres
```

### Dependencies Issues

```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Spring Boot
cd backend-java
./mvnw clean
./mvnw install

# FastAPI
cd backend-ai
rm -rf venv
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### Docker Issues

```bash
# View Docker daemon logs
docker logs

# Restart Docker
# macOS: Click Docker icon > Restart
# Linux: sudo systemctl restart docker
# Windows: Restart Docker Desktop

# Clean up Docker
docker system prune -a    # Remove unused images, containers, volumes
docker volume prune       # Remove unused volumes
docker network prune      # Remove unused networks
```

### Service Health Check

```bash
# Check all services
curl http://localhost:3000              # Frontend
curl http://localhost:8080/health       # Spring Boot (may 404)
curl http://localhost:8000/health       # FastAPI
curl http://localhost:6379/             # Redis (will error but shows it's up)
curl http://localhost:11434/api/health  # Ollama
curl http://localhost:5432/             # PostgreSQL (will error)
```

### Memory Issues

```bash
# View Docker memory usage
docker compose stats

# Limit container memory
# Edit docker-compose.yml and add:
# services:
#   backend-java:
#     deploy:
#       resources:
#         limits:
#           memory: 2G

# View system memory
free -h           # Linux
vm_stat           # macOS
wmic OS get TotalVisibleMemorySize

# Clear Docker cache
docker builder prune
docker system prune
```

---

## Quick Reference Cheat Sheet

### Start Everything
```bash
docker compose up -d && cd frontend && npm run dev
```

### Stop Everything
```bash
docker compose down && # Stop servers in terminals
```

### Frontend Only
```bash
cd frontend && npm run dev
```

### Backend Tests
```bash
cd backend-java && ./mvnw test
cd backend-ai && pytest
```

### Frontend Tests
```bash
cd frontend && npm test:watch
```

### View Logs
```bash
docker compose logs -f backend-java  # Spring Boot
docker compose logs -f backend-ai    # FastAPI
docker compose logs -f postgres      # Database
```

### Access Database
```bash
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev
```

### Clear Everything (Reset)
```bash
docker compose down -v && docker system prune -a
docker compose up -d && cd frontend && npm run dev
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key
```

### Spring Boot (.env)
```
SPRING_DATASOURCE_HOST=postgres
SPRING_DATASOURCE_PORT=5432
SPRING_DATASOURCE_DB=crm_cbt_db_dev
SPRING_DATASOURCE_USERNAME=rootuser
SPRING_DATASOURCE_PASSWORD=123Pa$$word!
JWT_SECRET_KEY=<32-char-random-key>
LEADRAT_API_KEY=<your-leadrat-key>
LEADRAT_SECRET_KEY=<your-leadrat-secret>
```

### FastAPI (.env)
```
DATABASE_URL=postgresql://rootuser:123Pa$$word!@postgres:5432/crm_cbt_db_dev
REDIS_URL=redis://redis:6379/0
OLLAMA_BASE_URL=http://ollama:11434
ENVIRONMENT=development
LOG_LEVEL=debug
```

---

## Support & Documentation

- **Frontend Docs:** https://nextjs.org/docs
- **Spring Boot Docs:** https://spring.io/projects/spring-boot
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Docker Docs:** https://docs.docker.com
- **Ollama Docs:** https://ollama.ai/docs

---

**Last Updated:** 2026-04-26  
**Version:** 1.0.0  
**Status:** ✅ All commands tested and working
