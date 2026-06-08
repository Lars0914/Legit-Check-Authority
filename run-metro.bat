@echo off
cd /d "%~dp0"
title Ticker Metro
if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :fail
)
if /I "%~1"=="clean" (
  echo Starting Metro with cache reset on http://localhost:8081
  call npm run start:clean
) else (
  echo Starting Metro on http://localhost:8081
  echo For red screen errors, run: run-metro.bat clean
  call npm start
)
goto :end

:fail
echo Metro failed to start.
pause

:end
