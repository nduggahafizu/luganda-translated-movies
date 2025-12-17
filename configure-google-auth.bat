@echo off
echo ========================================
echo   Configuring Google Authentication
echo ========================================
echo.

cd server

echo Adding Google credentials to .env file...
echo.

(
echo.
echo # Google OAuth Configuration
echo GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
echo GOOGLE_CLIENT_SECRET=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
echo.
echo # JWT Secret for token generation
echo JWT_SECRET=luganda-movies-super-secret-jwt-key-2024-change-in-production-12345
) >> .env

echo.
echo ========================================
echo   Configuration Complete!
echo ========================================
echo.
echo Google credentials added to server/.env
echo.
echo Next steps:
echo 1. Run: .\install-google-auth.bat
echo 2. Restart backend: .\start-backend.bat
echo 3. Test Google Sign-In on login.html
echo.

pause
