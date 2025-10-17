@echo off
cd /d "%~dp0"
echo Starting Biometric Service...
call venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
pause


