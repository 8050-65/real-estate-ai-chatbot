# 🟦 PowerShell Command Guide

**For Windows PowerShell Users**

---

## ⚡ Quick Start (PowerShell)

### Start Everything (One Liner)

```powershell
docker compose up -d; cd frontend; npm install; npm run dev
```

**Or with proper chaining (only run next if previous succeeds):**

```powershell
docker compose up -d; if ($?) { cd frontend; npm install; if ($?) { npm run dev } }
```

---

## 📱 All Frontend Commands (PowerShell)

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Get coverage report
npm run test:coverage

# Build for production
npm run build

# Start production server
npm start

# Format code
npm run format

# Type check
npx tsc --noEmit
```

---

## 🔧 All Backend Commands (PowerShell)

### Spring Boot

```powershell
# Navigate to backend-java
cd backend-java

# Run development server
./mvnw spring-boot:run

# Build JAR
./mvnw clean package

# Run tests
./mvnw test

# Run specific test
./mvnw test -Dtest=AuthControllerTest

# Get coverage report
./mvnw test jacoco:report

# Check migrations
./mvnw flyway:info

# Run migrations
./mvnw flyway:migrate
```

### FastAPI

```powershell
# Navigate to backend-ai
cd backend-ai

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Run specific test
pytest tests/test_webhook.py

# Get coverage
pytest --cov=app --cov-report=html

# Run with verbose output
pytest -v
```

---

## 🐳 Docker Commands (PowerShell)

```powershell
# Start all services
docker compose up -d

# View running services
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend-java
docker compose logs -f backend-ai
docker compose logs -f postgres

# Stop all services
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove everything including data
docker compose down -v

# Restart all services
docker compose restart

# Build images
docker compose build

# View container stats
docker compose stats
```

---

## 🗄️ Database Commands (PowerShell)

```powershell
# Connect to PostgreSQL
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev

# Once in psql CLI, you can use these commands:
# \dt                    - List tables
# \d table_name         - Describe table
# SELECT * FROM users;  - Query data
# \q                    - Quit

# Backup database
docker compose exec postgres pg_dump -U rootuser -d crm_cbt_db_dev | Out-File backup.sql

# Restore database
Get-Content backup.sql | docker compose exec -T postgres psql -U rootuser -d crm_cbt_db_dev

# View users
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT COUNT(*) FROM users;"

# View tenants
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT * FROM tenants;"
```

---

## 💾 Redis Commands (PowerShell)

```powershell
# Connect to Redis CLI
docker compose exec redis redis-cli

# Once in redis-cli:
# PING              - Test connection
# SET key value     - Set key
# GET key           - Get key
# DEL key           - Delete key
# KEYS *            - List all keys
# FLUSHDB           - Clear all data
# EXIT              - Quit

# Or run single Redis command
docker compose exec redis redis-cli ping
```

---

## 🤖 Ollama Commands (PowerShell)

```powershell
# Check if Ollama is installed
ollama --version

# List available models
ollama list

# Pull a model (downloads to disk)
ollama pull llama2
ollama pull mistral
ollama pull neural-chat

# Run a model (interactive)
ollama run llama2

# Ask a question
ollama run llama2 "What is machine learning?"

# Test Ollama API
curl.exe http://localhost:11434/api/health
```

---

## 🧪 Testing Commands (PowerShell)

### Frontend Tests
```powershell
cd frontend

# Run all tests
npm test

# Watch mode (rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test -- LoadingSpinner.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

### Spring Boot Tests
```powershell
cd backend-java

# Run all tests
./mvnw test

# Run specific class
./mvnw test -Dtest=AuthControllerTest

# Run with coverage
./mvnw test jacoco:report

# Run in parallel
./mvnw test -DparallelTestMethod=4
```

### FastAPI Tests
```powershell
cd backend-ai

# Run all tests
pytest

# Verbose output
pytest -v

# Specific test file
pytest tests/test_webhook.py

# Coverage report
pytest --cov=app --cov-report=html
```

---

## 🔍 Common Tasks (PowerShell)

### Check Everything is Running

```powershell
# Test Frontend
curl http://localhost:3000

# Test Spring Boot API
curl -X POST http://localhost:8080/api/v1/auth/login `
  -Header "Content-Type: application/json" `
  -Body '{"email":"admin@crm-cbt.com","password":"Admin@123!"}'

# Test FastAPI
curl http://localhost:8000/health

# Test Redis
docker compose exec redis redis-cli ping

# Test Database
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT 1"
```

### Stop Frontend Dev Server

```powershell
# Press Ctrl+C in the PowerShell window running npm run dev
```

### Stop All Docker Services

```powershell
docker compose down
```

### Reset Database

```powershell
# WARNING: Deletes all data!
docker compose down -v
docker compose up -d
```

### View File in PowerShell

```powershell
# View a text file
Get-Content filename.txt

# View with line numbers
Get-Content filename.txt | Select-Object -Index (0..20)

# Search in file
Get-Content filename.txt | Select-String "search_term"
```

---

## 🚀 Multi-Terminal Setup (PowerShell)

**For best development experience, use multiple PowerShell windows:**

### Terminal 1: Docker Services
```powershell
docker compose up -d
docker compose logs -f
```

### Terminal 2: Frontend Dev Server
```powershell
cd frontend
npm install
npm run dev
```

### Terminal 3: Backend (Optional - if not using Docker)
```powershell
cd backend-java
./mvnw spring-boot:run
```

### Terminal 4: FastAPI (Optional - if not using Docker)
```powershell
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000
```

---

## 📝 Useful PowerShell Aliases

Add these to your PowerShell profile for faster typing:

```powershell
# Edit profile
notepad $PROFILE

# Add these aliases:
Set-Alias -Name np -Value npm
Set-Alias -Name dc -Value docker
Set-Alias -Name pt -Value pytest
Set-Alias -Name mvn -Value ./mvnw.cmd

# Reload profile
& $PROFILE
```

Then use:
```powershell
dc compose up -d
cd frontend && np run dev
pt tests/
```

---

## 🛠️ PowerShell Tips

### Navigate Directories
```powershell
cd path/to/directory    # Change directory
pwd                      # Print working directory
ls                       # List files (alias for Get-ChildItem)
```

### View Process Using Port
```powershell
netstat -ano | findstr :3000      # Find process on port 3000
taskkill /PID 1234 /F             # Kill process by PID
```

### Check Environment Variables
```powershell
$env:PATH                          # View PATH
$env:JAVA_HOME                     # View JAVA_HOME
Get-ChildItem env:                 # List all env vars
```

### Set Environment Variables (Temporary)
```powershell
$env:DATABASE_URL = "postgresql://..."
$env:JWT_SECRET_KEY = "your-secret"
```

### Set Environment Variables (Permanent)
```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "User")
```

---

## ❌ Common PowerShell Errors & Fixes

### Error: "The term 'npm' is not recognized"
```powershell
# npm not in PATH, install Node.js from nodejs.org
# Or add to PATH manually
```

### Error: "'&&' is not a valid statement separator"
```powershell
# Use semicolons instead of &&
# WRONG: command1 && command2
# RIGHT: command1; command2
```

### Error: "Docker is not running"
```powershell
# Start Docker Desktop from Start Menu
# Or use: docker-machine start default
```

### Error: "Port 3000 is already in use"
```powershell
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

---

## 📚 Helpful Resources

```powershell
# Get help for any command
Get-Help docker
Get-Help npm
Get-Help npm -Full

# Check version of tools
node --version
npm --version
docker --version
java -version
python --version
```

---

## ✨ PowerShell Profile Setup (One-Time)

```powershell
# Create profile if it doesn't exist
if (!(Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }

# Open profile in editor
notepad $PROFILE

# Add these useful functions:

function Start-All {
    docker compose up -d
    Write-Host "Docker services started"
    cd frontend
    npm install
    npm run dev
}

function Stop-All {
    docker compose down
    Write-Host "Services stopped"
}

function Test-All {
    Write-Host "Testing Frontend..."
    cd frontend; npm test
    Write-Host "Testing Backend..."
    cd ../backend-java; ./mvnw test
    Write-Host "Testing FastAPI..."
    cd ../backend-ai; pytest
}

# Save and reload
& $PROFILE
```

Then use:
```powershell
Start-All
Stop-All
Test-All
```

---

## 🎯 Quick Reference Table

| Task | Command |
|------|---------|
| Start everything | `docker compose up -d; cd frontend; npm run dev` |
| Stop everything | `docker compose down` |
| Frontend tests | `cd frontend; npm test` |
| Backend tests | `cd backend-java; ./mvnw test` |
| FastAPI tests | `cd backend-ai; pytest` |
| View logs | `docker compose logs -f` |
| Access database | `docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev` |
| Check services | `docker compose ps` |
| Reset all | `docker compose down -v; docker compose up -d` |

---

**Use these commands in your PowerShell terminal!** 🟦

For more detailed explanations, see:
- `QUICK_START_GUIDE.md`
- `COMMAND_REFERENCE.md`
- `COMPLETE_SETUP_COMMANDS.md`
