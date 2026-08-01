@echo off
title SmartCart Launcher
color 0A
echo.
echo  ============================================
echo   SmartCart - Starting All Servers...
echo  ============================================
echo.

echo [1/3] Killing any process using port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo [2/3] Killing any process using port 5500...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5500 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo [3/3] Starting Backend on port 5000...
start "SmartCart Backend" cmd /k "cd /d C:\Users\saura\OneDrive\Desktop\smartcart\smartcart\backend && node server.js"

timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend on port 5500...
start "SmartCart Frontend" cmd /k "cd /d C:\Users\saura\OneDrive\Desktop\smartcart\smartcart\frontend && npx http-server . -p 5500 --cors -c-1 -o"

timeout /t 4 /nobreak >nul

echo.
echo  ============================================
echo   ALL DONE! Open your browser:
echo.
echo   Website  : http://127.0.0.1:5500
echo   Backend  : http://localhost:5000/api
echo  ============================================
echo.
pause
