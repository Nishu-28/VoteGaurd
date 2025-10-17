@echo off
echo Starting VoteGuard Services...
echo.

echo Starting Biometric Service on port 8001...
start "Biometric Service" cmd /k "cd /d C:\Users\nishu\Documents\VoteGaurd\biometric-service && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"

echo Starting Backend Service on port 8080...
start "Backend Service" cmd /k "cd /d C:\Users\nishu\Documents\VoteGaurd\backend && mvn spring-boot:run"

echo Starting Frontend Service on port 5173...
start "Frontend Service" cmd /k "cd /d C:\Users\nishu\Documents\VoteGaurd\frontend && npm install && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo All services are starting in separate windows...
echo.
echo Access URLs:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8080
echo - Biometric Service: http://localhost:8001
echo.
echo Test Credentials:
echo - Voter ID: admin or voter001
echo - Password: password123
echo.
pause

