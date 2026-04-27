.PHONY: help dev down logs pull-model test clean setup init-db migrate logs-ai logs-java logs-frontend build prod-up prod-down health

help:
	@echo "Real Estate AI Chatbot - Development Commands"
	@echo "=============================================="
	@echo "make setup          - Initial setup (copy .env, create directories)"
	@echo "make dev            - Start development environment (docker-compose up --build)"
	@echo "make down           - Stop all services (docker-compose down)"
	@echo "make logs           - Tail all service logs"
	@echo "make logs-ai        - Tail FastAPI logs"
	@echo "make logs-java      - Tail Spring Boot logs"
	@echo "make logs-frontend  - Tail Next.js logs"
	@echo "make pull-model     - Pull LLaMA 3.2 model to Ollama"
	@echo "make init-db        - Initialize database schema"
	@echo "make migrate        - Run Flyway migrations (backend-java)"
	@echo "make test           - Run all test suites"
	@echo "make clean          - Clean Docker resources (volumes, networks, containers)"
	@echo "make health         - Check health of all services"
	@echo "make prod-up        - Start production environment"
	@echo "make prod-down      - Stop production environment"
	@echo "make build          - Build all services"

setup:
	@echo "Setting up project structure..."
	mkdir -p backend-ai backend-java frontend docs
	@if [ ! -f backend-ai/.env ]; then \
		cp backend-ai/.env.example backend-ai/.env 2>/dev/null || echo "Creating backend-ai/.env template..."; \
	fi
	@if [ ! -f backend-java/src/main/resources/application.properties ]; then \
		echo "Create backend-java/src/main/resources/application.properties from template"; \
	fi
	@if [ ! -f frontend/.env.local ]; then \
		echo "Create frontend/.env.local from template"; \
	fi
	@echo "Setup complete. Next: cp backend-ai/.env.example backend-ai/.env && fill in your values"

dev:
	docker-compose up --build

build:
	docker-compose build

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-ai:
	docker-compose logs -f backend-ai

logs-java:
	docker-compose logs -f backend-java

logs-frontend:
	docker-compose logs -f frontend

pull-model:
	@echo "Pulling LLaMA 3.2 model (this may take 5-10 minutes)..."
	docker exec realestate_ollama ollama pull llama3.2
	@echo "Model pulled successfully"

init-db:
	@echo "Waiting for PostgreSQL to be ready..."
	sleep 10
	@echo "Database initialized via docker-compose init.sql"

migrate:
	@echo "Running Flyway migrations..."
	docker-compose exec backend-java ./mvnw flyway:migrate
	@echo "Migrations complete"

test:
	@echo "Running FastAPI tests..."
	docker-compose exec backend-ai pytest tests/ -v
	@echo "Running Spring Boot tests..."
	docker-compose exec backend-java ./mvnw test
	@echo "Running Next.js tests..."
	docker-compose exec frontend npm test
	@echo "All tests complete"

clean:
	@echo "Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f
	rm -rf backend-ai/__pycache__ backend-ai/.pytest_cache
	@echo "Clean complete"

health:
	@echo "Checking service health..."
	@echo "PostgreSQL:"
	docker-compose exec postgres pg_isready -U realestate || echo "❌ PostgreSQL not ready"
	@echo "Redis:"
	docker-compose exec redis redis-cli ping || echo "❌ Redis not ready"
	@echo "Ollama:"
	curl -s http://localhost:11434/api/tags > /dev/null && echo "✓ Ollama ready" || echo "❌ Ollama not ready"
	@echo "FastAPI:"
	curl -s http://localhost:8000/health > /dev/null && echo "✓ FastAPI ready" || echo "❌ FastAPI not ready"
	@echo "Spring Boot:"
	curl -s http://localhost:8080/actuator/health > /dev/null && echo "✓ Spring Boot ready" || echo "❌ Spring Boot not ready"
	@echo "Next.js:"
	curl -s http://localhost:3000 > /dev/null && echo "✓ Next.js ready" || echo "❌ Next.js not ready"

prod-up:
	@echo "Starting production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "Production environment started"

prod-down:
	@echo "Stopping production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
	@echo "Production environment stopped"

.DEFAULT_GOAL := help
