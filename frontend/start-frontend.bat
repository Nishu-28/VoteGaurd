@echo off
echo Starting VoteGuard Frontend...
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting development server...
echo Frontend will be available at: http://localhost:5173
echo.
call npm run dev
pause






