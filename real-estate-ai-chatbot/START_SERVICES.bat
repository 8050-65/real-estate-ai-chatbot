@echo off
REM Quick start script for all services - Windows Batch

setlocal enabledelayedexpansion

echo ===================================================
echo Leadrat Real Estate ChatBot - Service Startup
echo ===================================================
echo.

REM Kill any existing processes on ports 8000, 8080, 3000
echo [1/4] Killing any existing processes on ports 8000, 8080, 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 " ^| findstr "LISTENING"') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /PID %%a /F 2>nul
timeout /t 1 /nobreak >nul

REM Start FastAPI Backend (port 8000)
echo [2/4] Starting FastAPI Backend (port 8000)...
cd backend-ai
start "FastAPI Backend" cmd /k "python -m uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
echo FastAPI running on port 8000
cd ..

REM Start Spring Boot Backend (port 8080)
echo [3/4] Starting Spring Boot Backend (port 8080)...
cd backend-java
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "Spring Boot Backend" cmd /k "mvnw spring-boot:run -DskipTests"
    timeout /t 5 /nobreak >nul
    echo Spring Boot running on port 8080
) else (
    echo WARNING: Maven not found. Install with: choco install maven -y
)
cd ..

REM Start React Frontend (port 3000)
echo [4/4] Starting React Frontend (port 3000)...
cd frontend
start "React Frontend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
echo Frontend running on port 3000
cd ..

echo.
echo ===================================================
echo All Services Started Successfully
echo ===================================================
echo.
echo Services running on:
echo   - FastAPI:     http://localhost:8000
echo   - Spring Boot:  http://localhost:8080
echo   - Frontend:     http://localhost:3000
echo.
echo NEXT STEPS:
echo 1. Open http://localhost:3000 in your browser
echo 2. Navigate to /ai-assistant page
echo 3. Type "show leads" to test Leadrat API
echo 4. Verify real lead data appears (not errors)
echo.
pause
