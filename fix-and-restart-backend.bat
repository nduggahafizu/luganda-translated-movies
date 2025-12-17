@echo off
echo ========================================
echo   Fixing and Restarting Backend
echo ========================================
echo.

cd server

echo [1/3] Ensuring google-auth-library is installed...
call npm install google-auth-library --save
echo.

echo [2/3] Verifying installation...
call npm list google-auth-library
echo.

echo [3/3] Starting backend server...
echo.
echo Server will start at http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

call npm run dev
