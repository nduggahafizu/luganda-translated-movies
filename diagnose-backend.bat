@echo off
echo ========================================
echo   Backend Diagnostic Tool
echo ========================================
echo.

echo [Step 1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is NOT installed
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
    node --version
)
echo.

echo [Step 2/5] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is NOT installed
    pause
    exit /b 1
) else (
    echo ✅ npm is installed
    npm --version
)
echo.

echo [Step 3/5] Checking if backend dependencies are installed...
cd server
if not exist "node_modules" (
    echo ⚠️  Dependencies not installed
    echo Installing now...
    call npm install
) else (
    echo ✅ Dependencies are installed
)
echo.

echo [Step 4/5] Checking MongoDB service status...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB service not found
    echo.
    echo MongoDB is NOT installed or not running as a service.
    echo.
    echo Options:
    echo   1. Install MongoDB Community Edition
    echo   2. Use MongoDB Atlas (cloud-based, free)
    echo.
    echo See BACKEND_DIAGNOSIS_AND_FIX.md for detailed instructions.
) else (
    echo ✅ MongoDB service found
    sc query MongoDB | findstr "STATE"
)
echo.

echo [Step 5/5] Testing MongoDB connection...
echo Running connection test...
if exist "tests\testMongoDB.js" (
    node tests\testMongoDB.js
) else (
    echo ⚠️  Test file not found in current directory
    echo Make sure you're in the server directory
)
echo.

echo ========================================
echo   Diagnostic Complete
echo ========================================
echo.
echo Next Steps:
echo   1. Review the output above
echo   2. If MongoDB is not connected, see BACKEND_DIAGNOSIS_AND_FIX.md
echo   3. Choose a solution (Local MongoDB or MongoDB Atlas)
echo   4. Follow the setup instructions
echo   5. Run this diagnostic again to verify
echo.
echo For detailed help, open: BACKEND_DIAGNOSIS_AND_FIX.md
echo.
pause
