@echo off
echo Installing Production Dependencies...
cd server
call npm install winston winston-daily-rotate-file swagger-jsdoc swagger-ui-express redis ioredis response-time --save
echo.
echo Dependencies installed successfully!
pause
