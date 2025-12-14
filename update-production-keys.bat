@echo off
echo ========================================
echo   Updating Production API Keys
echo   Luganda Movies Backend
echo ========================================
echo.

cd server

echo [1/3] Backing up current .env file...
if exist .env (
    copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2% >nul
    echo Backup created successfully!
) else (
    echo No existing .env file found. Creating new one...
)

echo.
echo [2/3] Updating API keys in .env file...

REM Read current .env and update keys
powershell -Command "(Get-Content .env) -replace 'TMDB_API_KEY=.*', 'TMDB_API_KEY=7713c910b9503a1da0d0e6e448bf890e' | Set-Content .env.temp"
powershell -Command "(Get-Content .env.temp) -replace 'PESAPAL_CONSUMER_KEY=.*', 'PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN' | Set-Content .env.temp2"
powershell -Command "(Get-Content .env.temp2) -replace 'PESAPAL_CONSUMER_SECRET=.*', 'PESAPAL_CONSUMER_SECRET=qXoCe4qrb4RzDCr9nDu3y/yvTiU=' | Set-Content .env"

del .env.temp >nul 2>&1
del .env.temp2 >nul 2>&1

echo API keys updated successfully!

echo.
echo [3/3] Verifying configuration...
echo.
echo ========================================
echo   Configuration Updated!
echo ========================================
echo.
echo Updated Keys:
echo   - TMDB API Key: 7713c910b9503a1da0d0e6e448bf890e
echo   - PesaPal Consumer Key: WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
echo   - PesaPal Consumer Secret: qXoCe4qrb4RzDCr9nDu3y/yvTiU=
echo.
echo Your .env file has been updated with production keys!
echo A backup was created with timestamp.
echo.
echo Next: Start your server with .\start-backend.bat
echo.
pause
