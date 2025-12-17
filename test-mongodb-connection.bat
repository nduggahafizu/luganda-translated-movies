@echo off
echo ========================================
echo   MongoDB Connection Test
echo ========================================
echo.

echo Testing MongoDB connection...
echo.

cd server
node tests/testMongoDB.js

cd ..

echo.
echo ========================================
echo   Test Complete
echo ========================================
echo.

pause
