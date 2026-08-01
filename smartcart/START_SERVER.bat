@echo off
title SmartCart — Starting Server
color 0A
echo.
echo  =========================================
echo    SmartCart E-Commerce Platform
echo    Starting server at http://localhost:5000
echo  =========================================
echo.

REM Navigate to backend folder and start server
cd /d "%~dp0backend"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo  [!] Installing dependencies, please wait...
    call npm install
    echo.
)

echo  [+] Server starting...
echo  [+] Opening browser in 3 seconds...
echo.
echo  Press Ctrl+C to stop the server.
echo.

REM Open browser after a short delay (runs in background)
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000"

REM Start the server (this blocks)
node server.js
