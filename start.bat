@echo off
echo [0/2] Onceki processler temizleniyor...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
  if not "%%a"=="" taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
  if not "%%a"=="" taskkill /f /pid %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [1/2] Backend baslatiliyor...
cd /d "%~dp0backend"
start /B /MIN "" cmd /c "npx ts-node-dev --respawn --transpile-only src\app.ts"
timeout /t 5 /nobreak >nul

echo [2/2] Frontend baslatiliyor...
cd /d "%~dp0frontend"
start /B /MIN "" cmd /c "npx vite --host"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  Hotel Minibar Yonetim Sistemi
echo ========================================
echo  Backend : http://localhost:3001
echo  Frontend: http://localhost:5173
echo ========================================
echo.
pause
