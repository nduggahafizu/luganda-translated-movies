@echo off
echo ======================================
echo    Add Streamtape Movie
echo ======================================
echo.

cd /d "%~dp0"
cd server\scripts

echo Running addStreamtapeMovie.js...
echo.

node addStreamtapeMovie.js

echo.
pause
