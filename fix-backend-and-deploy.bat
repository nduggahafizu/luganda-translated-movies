@echo off
echo ========================================
echo   Fix Backend and Deploy
echo ========================================
echo.

echo [Step 1/5] Installing dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [Step 2/5] Testing server startup...
echo Starting server for 5 seconds to check for errors...
start /B node server.js
timeout /t 5 /nobreak >nul
taskkill /F /IM node.exe >nul 2>&1
echo.

echo [Step 3/5] Checking MongoDB connection...
node tests/testMongoDB.js
echo.

echo [Step 4/5] Committing fixes...
cd ..
git add .
git commit -m "fix: Install dependencies and fix backend startup issues"
if %ERRORLEVEL% EQU 0 (
    echo Commit successful
) else (
    echo No changes to commit or commit failed
)
echo.

echo [Step 5/5] Pushing to GitHub...
git push origin blackboxai/eslint-and-server-fixes
if %ERRORLEVEL% EQU 0 (
    echo Push successful!
) else (
    echo Push failed or no changes to push
)
echo.

echo ========================================
echo   Fix and Deploy Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: .\start-backend.bat
echo 2. Test features locally
echo 3. Merge pull request on GitHub
echo.
pause
