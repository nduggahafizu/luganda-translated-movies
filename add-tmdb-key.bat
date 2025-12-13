@echo off
echo Adding TMDB API Key to .env file...
echo.
cd server
echo TMDB_API_KEY=7713c910b9503a1da0d0e6e448bf890e >> .env
echo.
echo ✅ TMDB API Key added successfully!
echo.
echo Now restart your server:
echo   cd server
echo   node server.js
echo.
pause
