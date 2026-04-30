# 📚 Command Reference - Organized by Task

**Find the exact command you need for any task**

---

## 🎯 I Want To...

### Start Development

```bash
# ✅ Start everything with one command
docker compose up -d && cd frontend && npm run dev

# Or start step-by-step
docker compose up -d                    # Start all services
cd frontend && npm run dev              # Start frontend dev server

# Or start services individually
docker compose up postgres redis        # Database + Cache
cd backend-java && ./mvnw spring-boot:run   # Spring Boot
cd backend-ai && python -m uvicorn app.main:app --reload  # FastAPI
```

### Stop Development

```bash
# Stop frontend dev server
# Press Ctrl+C in frontend terminal

# Stop backend services
docker compose down

# Stop everything including frontend
docker compose down
# Kill any remaining npm processes
pkill -f "npm run dev"
```

### Run Tests

```bash
# Run all frontend tests
cd frontend && npm test

# Run all backend tests
cd backend-java && ./mvnw test
cd backend-ai && pytest

# Watch mode (re-run on file changes)
cd frontend && npm run test:watch

# Run specific test
cd frontend && npm test useAuth.test.ts
cd backend-java && ./mvnw test -Dtest=AuthControllerTest
cd backend-ai && pytest tests/test_webhook.py
```

### Build for Production

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend-java && ./mvnw clean package
cd backend-ai && pip install -r requirements.txt

# Build Docker images
docker compose -f docker-compose.prod.yml build

# Run production build
cd frontend && npm start
java -jar backend-java/target/crm-backend-1.0.0.jar
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

### Debug Issues

```bash
# View what's running
docker compose ps

# View logs
docker compose logs -f                  # All logs
docker compose logs -f backend-java     # Just Spring Boot
docker compose logs -f backend-ai       # Just FastAPI

# Connect to a container
docker compose exec backend-java bash   # Shell access
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev

# Check if services are healthy
curl http://localhost:3000              # Frontend
curl http://localhost:8080/health       # Spring Boot
curl http://localhost:8000/health       # FastAPI
```

### Access the Database

```bash
# Open database CLI
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev

# View all tables
\dt

# View specific data
SELECT * FROM users;
SELECT * FROM tenants;

# Exit
\q
```

### Manage Docker

```bash
# See running containers
docker compose ps

# Restart everything
docker compose restart

# Stop containers
docker compose stop

# Start containers
docker compose start

# Remove containers (keep data)
docker compose down

# Remove everything including data
docker compose down -v

# View container stats
docker compose stats
```

### Work with Frontend

```bash
# Install dependencies
cd frontend && npm install

# Start dev server
npm run dev

# Format code
npm run format

# Type check
npm run type-check

# Build for production
npm run build

# Run tests
npm test

# Watch tests
npm run test:watch

# View coverage
npm run test:coverage
```

### Work with Spring Boot Backend

```bash
# Compile
cd backend-java && ./mvnw clean compile

# Run dev server
./mvnw spring-boot:run

# Build JAR
./mvnw clean package

# Run tests
./mvnw test

# Run specific test
./mvnw test -Dtest=AuthControllerTest

# View coverage
./mvnw test jacoco:report

# Database migrations
./mvnw flyway:migrate
./mvnw flyway:info
```

### Work with FastAPI Backend

```bash
# Install dependencies
cd backend-ai && pip install -r requirements.txt

# Run dev server
python -m uvicorn app.main:app --reload --port 8000

# Run production server
gunicorn app.main:app -w 4 -b 0.0.0.0:8000

# Run tests
pytest

# Run specific test
pytest tests/test_webhook.py

# Watch tests
pytest --watch

# View coverage
pytest --cov=app --cov-report=html
```

### Use Ollama (Local LLM)

```bash
# Check Ollama status
ollama list

# Pull a model
ollama pull llama2
ollama pull mistral

# Run model
ollama run llama2

# Ask a question
ollama run llama2 "What is machine learning?"

# Use via API
curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"llama2","prompt":"Hello"}'
```

### Backup/Restore Database

```bash
# Backup
docker compose exec postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup.sql

# Restore
docker compose exec -T postgres psql -U rootuser -d crm_cbt_db_dev < backup.sql

# Export to CSV
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev \
  -c "COPY users TO STDOUT WITH CSV HEADER" > users.csv
```

### Reset Everything

```bash
# Reset database (delete all data)
docker compose down -v

# Clean up Docker
docker system prune -a

# Clean up npm
cd frontend && npm cache clean --force && rm -rf node_modules

# Start fresh
docker compose up -d
cd frontend && npm install && npm run dev
```

### Deploy to Production

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Tag images
docker tag realestate_backend_java:latest myregistry/backend-java:1.0.0

# Push to registry
docker push myregistry/backend-java:1.0.0

# Run on production server
docker compose -f docker-compose.prod.yml up -d
```

### Check System Health

```bash
# Check if services are running
docker compose ps

# Test API endpoints
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-cbt.com","password":"Admin@123!"}'

# Test database
docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev -c "SELECT 1"

# Test cache
docker compose exec redis redis-cli ping

# Test AI service
curl http://localhost:8000/health
```

---

## 📋 By Service

### Frontend (Next.js)

| Task | Command |
|------|---------|
| Start dev server | `cd frontend && npm run dev` |
| Install dependencies | `npm install` |
| Run tests | `npm test` |
| Watch tests | `npm run test:watch` |
| Build | `npm run build` |
| Start production | `npm start` |
| Type check | `npx tsc --noEmit` |
| Format code | `npm run format` |
| Get coverage | `npm run test:coverage` |

### Spring Boot

| Task | Command |
|------|---------|
| Start dev server | `cd backend-java && ./mvnw spring-boot:run` |
| Compile | `./mvnw clean compile` |
| Build JAR | `./mvnw clean package` |
| Run tests | `./mvnw test` |
| Get coverage | `./mvnw test jacoco:report` |
| Run specific test | `./mvnw test -Dtest=ClassName` |
| Run migrations | `./mvnw flyway:migrate` |
| Check migrations | `./mvnw flyway:info` |

### FastAPI

| Task | Command |
|------|---------|
| Start dev server | `cd backend-ai && python -m uvicorn app.main:app --reload` |
| Install dependencies | `pip install -r requirements.txt` |
| Run tests | `pytest` |
| Run specific test | `pytest tests/test_webhook.py` |
| Get coverage | `pytest --cov=app --cov-report=html` |
| Production server | `gunicorn app.main:app -w 4` |
| Type check | `mypy app/` |
| Format code | `black app/` |

### Docker

| Task | Command |
|------|---------|
| Start all services | `docker compose up -d` |
| View running services | `docker compose ps` |
| View logs | `docker compose logs -f` |
| Stop services | `docker compose down` |
| Reset database | `docker compose down -v` |
| Restart services | `docker compose restart` |
| Execute in container | `docker compose exec <service> <command>` |
| Build images | `docker compose build` |
| View stats | `docker compose stats` |

### Database (PostgreSQL)

| Task | Command |
|------|---------|
| Connect to DB | `docker compose exec postgres psql -U rootuser -d crm_cbt_db_dev` |
| List tables | `\dt` |
| Describe table | `\d table_name` |
| Query data | `SELECT * FROM users;` |
| Backup | `docker compose exec postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup.sql` |
| Restore | `docker compose exec -T postgres psql -U rootuser -d crm_cbt_db_dev < backup.sql` |
| Drop database | `docker compose exec postgres psql -U rootuser -c "DROP DATABASE crm_cbt_db_dev;"` |

### Cache (Redis)

| Task | Command |
|------|---------|
| Connect to Redis | `docker compose exec redis redis-cli` |
| Ping Redis | `redis-cli ping` |
| List keys | `KEYS *` |
| Get value | `GET key_name` |
| Set value | `SET key_name value` |
| Delete key | `DEL key_name` |
| Flush all | `FLUSHDB` |

---

## 🔍 By Technology

### TypeScript
```bash
# Type check
npx tsc --noEmit

# Strict mode check
npx tsc --strict --noEmit

# Generate types
npx tsc --emitDeclarationOnly
```

### Node.js / npm
```bash
# Update npm
npm install -g npm@latest

# Install package
npm install package-name

# Install dev package
npm install --save-dev package-name

# Remove package
npm uninstall package-name

# Clear cache
npm cache clean --force

# Audit security
npm audit

# Fix security issues
npm audit fix
```

### Java / Maven
```bash
# Update Maven
mvn -v

# Install dependency
mvn dependency:get -Dartifact=groupId:artifactId:version

# View dependencies
mvn dependency:tree

# Skip tests
mvn clean package -DskipTests

# Parallel build
mvn clean package -T 1C
```

### Python / pip
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Linux/macOS)
source venv/bin/activate

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install from requirements
pip install -r requirements.txt

# Generate requirements
pip freeze > requirements.txt

# Update package
pip install --upgrade package-name
```

### Git
```bash
# Stage all changes
git add -A

# Commit changes
git commit -m "Your message"

# Push to remote
git push origin Feature/Chatbot-1

# View status
git status

# View logs
git log --oneline

# Create branch
git checkout -b new-branch

# Switch branch
git checkout branch-name
```

---

## 🆘 Troubleshooting Commands

```bash
# Port in use
lsof -i :3000
lsof -i :8080
lsof -i :8000

# Kill process
kill -9 <PID>

# View disk space
df -h

# View memory usage
free -h              # Linux
vm_stat              # macOS
wmic OS get TotalVisibleMemorySize  # Windows

# Clear npm cache
npm cache clean --force

# Clear Docker cache
docker system prune -a

# View system logs
docker logs <container-id>

# Get container IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <container-name>

# Test connectivity
ping localhost
curl http://localhost:8080
telnet localhost 5432
```

---

## ⚡ Speed Up Commands

```bash
# Fast npm install (skip optional dependencies)
npm install --prefer-offline --no-audit

# Fast Maven build (parallel + skip tests)
./mvnw clean package -T 1C -DskipTests

# Fast Python package install (use cache)
pip install --no-cache-dir -r requirements.txt

# Fast Docker build (use cache)
docker compose build --no-cache
```

---

## 🔐 Security Commands

```bash
# Check npm vulnerabilities
npm audit

# Fix npm vulnerabilities
npm audit fix

# Check Python vulnerabilities
safety check

# Generate strong password
openssl rand -base64 32

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encrypt environment variables (example)
openssl enc -aes-256-cbc -in .env -out .env.encrypted
```

---

## 📊 Monitoring Commands

```bash
# View container stats (CPU, memory)
docker compose stats

# View service logs with timestamps
docker compose logs --timestamps backend-java

# View last N lines
docker compose logs --tail 50 backend-java

# Follow logs (stream)
docker compose logs -f backend-java

# Get container info
docker compose inspect backend-java

# View resource limits
docker stats --no-stream
```

---

## 🎓 Learning & Documentation

```bash
# View Next.js documentation locally
npm run dev -- --docs

# View Spring Boot docs
# Go to http://localhost:8080/swagger-ui.html

# View FastAPI docs
# Go to http://localhost:8000/docs

# View API docs (interactive)
# Go to http://localhost:8000/redoc

# Print command help
npm --help
./mvnw --help
docker compose --help
```

---

## 💾 Backup & Recovery

```bash
# Backup database
docker compose exec postgres pg_dump -U rootuser -d crm_cbt_db_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup entire volume
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Backup frontend node_modules (not recommended)
tar czf frontend_node_modules_$(date +%Y%m%d_%H%M%S).tar.gz frontend/node_modules

# Restore database
docker compose exec -T postgres psql -U rootuser -d crm_cbt_db_dev < backup.sql

# Restore volume
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/backup.tar.gz -C /data
```

---

**Bookmark this page! You'll come back to it often.** 🔖

For more details, see:
- `QUICK_START_GUIDE.md` - Quick start in 5 minutes
- `COMPLETE_SETUP_COMMANDS.md` - Detailed explanation of all commands
- `PROJECT_COMPLETION_SUMMARY.md` - Project overview
