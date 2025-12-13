@echo off
echo ========================================
echo Luganda Movies - Complete Setup Script
echo ========================================
echo.

echo Step 1: Creating .env file from template...
cd server
if exist .env (
    echo .env file already exists. Skipping...
) else (
    if exist .env.example (
        copy .env.example .env
        echo .env file created successfully!
        echo IMPORTANT: Edit server/.env with your actual values
        echo.
    ) else (
        echo ERROR: .env.example not found!
    )
)

echo Step 2: Installing dependencies...
echo This may take a few minutes...
call npm install
if %ERRORLEVEL% EQU 0 (
    echo Dependencies installed successfully!
) else (
    echo ERROR: Failed to install dependencies
    goto :error
)
echo.

echo Step 3: Checking MongoDB connection...
echo Testing MongoDB connection...
call npm run test:mongodb
echo.

echo Step 4: Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit server/.env with your actual values:
echo    - MONGODB_URI (from MongoDB Atlas)
echo    - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo    - SESSION_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo    - ALLOWED_ORIGINS (your production domains)
echo.
echo 2. Optional: Install and start Redis for caching
echo    Download from: https://github.com/microsoftarchive/redis/releases
echo.
echo 3. Start the server:
echo    npm run dev
echo.
echo 4. Test the setup:
echo    - Health: http://localhost:5000/api/health
echo    - API Docs: http://localhost:5000/api-docs
echo    - Metrics: http://localhost:5000/api/metrics
echo.
echo 5. Open index.html in browser to test frontend
echo.
echo ========================================
echo For detailed instructions, see SETUP_NOW.md
echo ========================================
echo.

cd ..
pause
exit /b 0

:error
echo.
echo Setup failed! Please check the errors above.
cd ..
pause
exit /b 1
