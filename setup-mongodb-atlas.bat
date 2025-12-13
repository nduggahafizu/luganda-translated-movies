@echo off
echo ========================================
echo   MongoDB Atlas Setup for Luganda Movies
echo ========================================
echo.

REM Check if .env exists
if exist "server\.env" (
    echo [INFO] Found existing server\.env file
    echo.
    choice /C YN /M "Do you want to update the existing .env file"
    if errorlevel 2 goto :end
    if errorlevel 1 goto :setup
) else (
    echo [INFO] No .env file found. Creating new one...
    goto :setup
)

:setup
echo.
echo ========================================
echo   Step 1: MongoDB Atlas Connection String
echo ========================================
echo.
echo Please follow these steps to get your connection string:
echo.
echo 1. Go to: https://www.mongodb.com/cloud/atlas/register
echo 2. Create a FREE account (no credit card needed)
echo 3. Create a FREE M0 cluster
echo 4. Create a database user with username and password
echo 5. Whitelist IP: 0.0.0.0/0 (for development)
echo 6. Click "Connect" ^> "Drivers" ^> Copy connection string
echo.
echo Your connection string should look like:
echo mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true^&w=majority
echo.
echo ========================================
echo.

set /p MONGODB_URI="Enter your MongoDB Atlas connection string: "

if "%MONGODB_URI%"=="" (
    echo [ERROR] Connection string cannot be empty!
    goto :end
)

echo.
echo ========================================
echo   Step 2: Generating Secrets
echo ========================================
echo.

REM Generate random secrets (simple version for Windows)
set JWT_SECRET=jwt-secret-%RANDOM%%RANDOM%%RANDOM%
set SESSION_SECRET=session-secret-%RANDOM%%RANDOM%%RANDOM%

echo [INFO] Generated JWT_SECRET
echo [INFO] Generated SESSION_SECRET
echo.

echo ========================================
echo   Step 3: Creating .env File
echo ========================================
echo.

REM Create .env file
(
echo # MongoDB Atlas Connection
echo MONGODB_URI=%MONGODB_URI%
echo.
echo # Server Configuration
echo PORT=5000
echo NODE_ENV=development
echo.
echo # JWT Secret
echo JWT_SECRET=%JWT_SECRET%
echo.
echo # Session Secret
echo SESSION_SECRET=%SESSION_SECRET%
echo.
echo # TMDB API Key ^(optional - for movie data^)
echo TMDB_API_KEY=your_tmdb_api_key_here
) > server\.env

echo [SUCCESS] Created server\.env file
echo.

echo ========================================
echo   Step 4: Testing Connection
echo ========================================
echo.

echo [INFO] Starting backend server to test connection...
echo [INFO] Please wait...
echo.

cd server
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    cd ..
    goto :end
)

echo.
echo [INFO] Starting server...
echo [INFO] Check the output below for connection status
echo.
echo ========================================
echo.

start /B node server.js

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Test connection
curl.exe -s http://localhost:5000/api/health > test-result.txt 2>&1

if exist test-result.txt (
    type test-result.txt
    del test-result.txt
    echo.
    echo ========================================
    echo.
    echo [SUCCESS] MongoDB Atlas setup complete!
    echo.
    echo Next steps:
    echo 1. Check if "database": "connected" appears above
    echo 2. If connected, run: .\start-backend.bat
    echo 3. Then run: .\test-backend-api.bat
    echo.
    echo For detailed guide, see: MONGODB_ATLAS_SETUP_GUIDE.md
    echo.
) else (
    echo [WARNING] Could not test connection automatically
    echo Please manually start the server with: .\start-backend.bat
    echo.
)

cd ..
goto :end

:end
echo ========================================
echo   Setup Complete
echo ========================================
pause
