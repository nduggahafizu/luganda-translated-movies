@echo off
echo ========================================
echo   Import from Kp Sounds Watch
echo ========================================
echo.

cd server

echo This script will import movies and VJs from watch.kpsounds.com
echo.
echo Options:
echo   1. Import everything (VJs + Movies + Trending)
echo   2. Import VJs only
echo   3. Import Movies only
echo   4. Update Trending status
echo.

set /p choice="Enter your choice (1-4) or press Enter for option 1: "

if "%choice%"=="" set choice=1

echo.
echo Starting import...
echo.

if "%choice%"=="1" (
    echo Importing everything...
    node scripts/importFromKpSounds.js all 50
) else if "%choice%"=="2" (
    echo Importing VJs only...
    node scripts/importFromKpSounds.js vjs
) else if "%choice%"=="3" (
    echo Importing Movies only...
    node scripts/importFromKpSounds.js movies 50
) else if "%choice%"=="4" (
    echo Updating Trending status...
    node scripts/importFromKpSounds.js trending 20
) else (
    echo Invalid choice. Running full import...
    node scripts/importFromKpSounds.js all 50
)

echo.
echo ========================================
echo   Import Complete!
echo ========================================
echo.
echo Press any key to exit...
pause >nul
