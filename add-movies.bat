@echo off
echo ============================================================
echo Add Luganda Translated Movies to Database
echo ============================================================
echo.

cd server

echo Running movie addition script...
echo.
node scripts/addMovies.js

echo.
echo ============================================================
echo.
pause
