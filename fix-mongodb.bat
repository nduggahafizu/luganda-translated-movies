@echo off
echo ========================================
echo   MongoDB Connection Fix
echo ========================================
echo.

echo Attempting to start MongoDB service...
echo.

net start MongoDB

if %errorlevel% equ 0 (
    echo.
    echo ✅ MongoDB started successfully!
    echo.
    echo Now restart the backend server:
    echo   .\start-backend.bat
    echo.
) else (
    echo.
    echo ⚠️  MongoDB service not found or already running
    echo.
    echo Options:
    echo.
    echo 1. Install MongoDB Community Edition
    echo    Download from: https://www.mongodb.com/try/download/community
    echo.
    echo 2. Use MongoDB Atlas (Cloud - Free)
    echo    a. Go to: https://www.mongodb.com/cloud/atlas/register
    echo    b. Create free cluster
    echo    c. Get connection string
    echo    d. Update server/.env with:
    echo       MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies
    echo.
    echo 3. Check if MongoDB is already running
    echo    Run: tasklist /FI "IMAGENAME eq mongod.exe"
    echo.
)

pause
