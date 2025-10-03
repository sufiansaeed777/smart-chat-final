@echo off
echo ============================================
echo Simple WordPress Test Server
echo ============================================
echo.
echo This will start a test server to bypass LocalWP issues
echo.

REM Check if PHP is installed
where php >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: PHP is not installed or not in PATH
    echo.
    echo You have 3 options:
    echo 1. Install XAMPP from: https://www.apachefriends.org/download.html
    echo 2. Install PHP from: https://windows.php.net/download/
    echo 3. Use the LocalWP Site Shell which has PHP
    echo.
    pause
    exit /b 1
)

echo PHP is installed. Starting test environment...
echo.
echo Press Ctrl+C to stop the server when done
echo.

cd "C:\Users\Administrator\Local Sites\chatbot-apache\app\public" 2>nul || cd "D:\Local Sites\chatbot-apache\app\public" 2>nul || cd "C:\Local Sites\chatbot-apache\app\public" 2>nul

if errorlevel 1 (
    echo ERROR: Could not find LocalWP WordPress installation
    echo Please run this from LocalWP Site Shell instead
    pause
    exit /b 1
)

echo Starting server at http://localhost:8888
echo.
php -S localhost:8888

pause