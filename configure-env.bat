@echo off
echo ========================================
echo   Environment Configuration Setup
echo   Luganda Movies Backend
echo ========================================
echo.

cd server

echo [1/4] Generating JWT Secret...
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" > .env.temp

echo [2/4] Generating Session Secret...
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env.temp

echo [3/4] Adding default configuration...
echo PORT=5000 >> .env.temp
echo NODE_ENV=development >> .env.temp
echo LOG_LEVEL=info >> .env.temp
echo. >> .env.temp
echo # MongoDB Configuration >> .env.temp
echo MONGODB_URI=mongodb://localhost:27017/luganda-movies >> .env.temp
echo. >> .env.temp
echo # Redis Configuration (Optional) >> .env.temp
echo REDIS_HOST=localhost >> .env.temp
echo REDIS_PORT=6379 >> .env.temp
echo REDIS_PASSWORD= >> .env.temp
echo. >> .env.temp
echo # CORS Configuration >> .env.temp
echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,http://127.0.0.1:5500 >> .env.temp
echo. >> .env.temp
echo # TMDB API (Optional) >> .env.temp
echo TMDB_API_KEY=your_tmdb_api_key_here >> .env.temp
echo. >> .env.temp
echo # Pesapal Payment (Optional) >> .env.temp
echo PESAPAL_CONSUMER_KEY=your_consumer_key >> .env.temp
echo PESAPAL_CONSUMER_SECRET=your_consumer_secret >> .env.temp
echo PESAPAL_CALLBACK_URL=http://localhost:5000/api/payments/callback >> .env.temp

echo [4/4] Creating .env file...
if exist .env (
    echo.
    echo WARNING: .env file already exists!
    echo Creating backup as .env.backup...
    copy .env .env.backup >nul
)

move /Y .env.temp .env >nul

echo.
echo ========================================
echo   Configuration Complete!
echo ========================================
echo.
echo Your .env file has been created with:
echo   - Auto-generated JWT_SECRET
echo   - Auto-generated SESSION_SECRET
echo   - Default development settings
echo.
echo IMPORTANT: Update these values in server/.env:
echo   1. MONGODB_URI - Your MongoDB connection string
echo   2. TMDB_API_KEY - Your TMDB API key (optional)
echo   3. PESAPAL credentials - For payments (optional)
echo   4. ALLOWED_ORIGINS - Your production domains
echo.
echo To edit: notepad server\.env
echo.
pause
