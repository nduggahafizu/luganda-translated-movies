@echo off
echo ============================================================
echo Google Cloud Storage Setup for Unruly Movies
echo ============================================================
echo.

echo [Step 1] Installing required Node.js packages...
cd server
call npm install @google-cloud/storage multer dotenv --save
if %errorlevel% neq 0 (
    echo ERROR: Failed to install packages
    pause
    exit /b 1
)
echo SUCCESS: Packages installed
echo.

echo [Step 2] Creating required directories...
if not exist "config" mkdir config
if not exist "uploads" mkdir uploads
if not exist "uploads\temp" mkdir uploads\temp
echo SUCCESS: Directories created
echo.

echo [Step 3] Checking .env file...
if not exist ".env" (
    echo Creating .env file from template...
    (
        echo # Google Cloud Storage Configuration
        echo GCS_PROJECT_ID=your-project-id
        echo GCS_BUCKET_NAME=unruly-movies-free
        echo GCS_KEY_FILE=./config/gcp-service-key.json
        echo GCS_PUBLIC_URL=https://storage.googleapis.com/unruly-movies-free
        echo.
        echo # Existing configuration...
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/unruly-movies
        echo JWT_SECRET=your_jwt_secret_key_here
    ) > .env
    echo SUCCESS: .env file created
    echo.
    echo IMPORTANT: Please update the following in .env:
    echo   - GCS_PROJECT_ID: Your Google Cloud project ID
    echo   - GCS_BUCKET_NAME: Your bucket name
    echo   - JWT_SECRET: A secure random string
    echo.
) else (
    echo .env file already exists
    echo.
    echo Please ensure these variables are set:
    echo   - GCS_PROJECT_ID
    echo   - GCS_BUCKET_NAME
    echo   - GCS_KEY_FILE
    echo   - GCS_PUBLIC_URL
    echo.
)

echo [Step 4] Service Account Key...
if not exist "config\gcp-service-key.json" (
    echo.
    echo WARNING: Service account key not found!
    echo.
    echo Please follow these steps:
    echo   1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
    echo   2. Create a service account or select existing one
    echo   3. Click "Keys" tab
    echo   4. Click "Add Key" -^> "Create new key"
    echo   5. Choose JSON format
    echo   6. Save the downloaded file as: server\config\gcp-service-key.json
    echo.
) else (
    echo SUCCESS: Service account key found
    echo.
)

echo [Step 5] Updating .gitignore...
cd ..
findstr /C:"gcp-service-key.json" .gitignore >nul 2>&1
if %errorlevel% neq 0 (
    echo # Google Cloud credentials >> .gitignore
    echo server/config/gcp-service-key.json >> .gitignore
    echo server/uploads/temp/* >> .gitignore
    echo SUCCESS: .gitignore updated
) else (
    echo .gitignore already configured
)
echo.

echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo Next Steps:
echo.
echo 1. Create Google Cloud Account (if you haven't):
echo    https://cloud.google.com/free
echo.
echo 2. Create a new project:
echo    https://console.cloud.google.com/projectcreate
echo.
echo 3. Create a storage bucket:
echo    https://console.cloud.google.com/storage/create-bucket
echo.
echo 4. Create service account and download key:
echo    https://console.cloud.google.com/iam-admin/serviceaccounts
echo.
echo 5. Update server/.env with your project details
echo.
echo 6. Place service account key at: server/config/gcp-service-key.json
echo.
echo 7. Run test: cd server ^&^& node tests/testGCS.js
echo.
echo 8. Start server: npm start
echo.
echo ============================================================
echo.
pause
