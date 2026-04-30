#!/bin/bash
# Quick start script for all services

echo "=== Leadrat Real Estate ChatBot - Service Startup ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill any existing processes on ports
echo "${YELLOW}[1/4]${NC} Killing any existing processes on ports 8000, 8080, 3000..."
lsof -ti:8000,8080,3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start FastAPI Backend (port 8000)
echo "${YELLOW}[2/4]${NC} Starting FastAPI Backend (port 8000)..."
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000 &
FASTAPI_PID=$!
sleep 3
echo "${GREEN}✓ FastAPI running (PID: $FASTAPI_PID)${NC}"

# Start Spring Boot Backend (port 8080) via Docker
echo "${YELLOW}[3/4]${NC} Starting Spring Boot Backend (port 8080) via Docker..."
cd ../backend-java

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "Building Docker image..."
    docker build -t leadrat-springboot-backend:latest . > /dev/null 2>&1
    docker run --rm -p 8080:8080 leadrat-springboot-backend:latest &
    SPRINGBOOT_PID=$!
    sleep 5
    echo "${GREEN}✓ Spring Boot running via Docker (PID: $SPRINGBOOT_PID)${NC}"
else
    echo "${RED}✗ Docker not found. Install Docker Desktop.${NC}"
fi

# Start React Frontend (port 3000)
echo "${YELLOW}[4/4]${NC} Starting React Frontend (port 3000)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
sleep 5
echo "${GREEN}✓ Frontend running (PID: $FRONTEND_PID)${NC}"

echo ""
echo "${GREEN}=== All Services Started ===${NC}"
echo ""
echo "Services running on:"
echo "  - FastAPI:    http://localhost:8000"
echo "  - Spring Boot: http://localhost:8080"
echo "  - Frontend:    http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for any service to stop
wait
