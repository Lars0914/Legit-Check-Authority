@echo off
REM Fix red Metro screen (SHA-1 / bundle 500 error)
cd /d "%~dp0"
title Fix Metro

echo Stopping Metro on port 8081...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>&1

echo Clearing Metro cache...
if exist "%TEMP%\metro-cache" rmdir /s /q "%TEMP%\metro-cache" 2>nul
for /d %%D in ("%TEMP%\metro-*") do rmdir /s /q "%%D" 2>nul
for /d %%D in ("%TEMP%\haste-map-*") do rmdir /s /q "%%D" 2>nul
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul

echo Starting Metro with fresh cache...
start "Ticker Metro" /D "%~dp0" cmd /k "npm run start:clean"

echo.
echo Done. Wait for "Dev server ready" in the Metro window,
echo then press R twice in the emulator or shake device - Reload.
echo.
pause
