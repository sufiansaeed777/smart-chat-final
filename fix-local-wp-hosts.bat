@echo off
echo Checking Windows hosts file for LocalWP sites...
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo This script needs to run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

:: Path to hosts file
set HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts

:: Check if chatbot-test.local exists
findstr /C:"chatbot-test.local" %HOSTS_FILE% >nul
if %errorLevel% EQU 0 (
    echo chatbot-test.local is already in hosts file
) else (
    echo Adding chatbot-test.local to hosts file...
    echo. >> %HOSTS_FILE%
    echo # LocalWP Site >> %HOSTS_FILE%
    echo 127.0.0.1 chatbot-test.local >> %HOSTS_FILE%
    echo ::1 chatbot-test.local >> %HOSTS_FILE%
    echo Added successfully!
)

echo.
echo Flushing DNS cache...
ipconfig /flushdns

echo.
echo Done! Try accessing http://chatbot-test.local again
echo.
pause