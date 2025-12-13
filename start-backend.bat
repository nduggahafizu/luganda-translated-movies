@echo off
echo ========================================
echo   Starting Luganda Movies Backend
echo ========================================
echo.

cd server

echo [1/3] Installing dependencies...
call npm install
echo.

echo [2/3] Checking if MongoDB is running...
echo If MongoDB is not running, please start it manually
echo.

echo [3/3] Starting backend server...
echo Server will start at http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

call npm run dev
