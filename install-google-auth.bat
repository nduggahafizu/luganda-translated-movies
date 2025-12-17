@echo off
echo ========================================
echo   Installing Google Authentication
echo ========================================
echo.

cd server

echo [1/2] Installing google-auth-library...
call npm install google-auth-library
echo.

echo [2/2] Verifying installation...
call npm list google-auth-library
echo.

echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Get Google Client ID from Google Cloud Console
echo 2. Add to server/.env file
echo 3. Update js/auth.js with your Client ID
echo 4. Restart backend server
echo.
echo See GOOGLE_SIGNIN_SETUP_GUIDE.md for details
echo.

pause
