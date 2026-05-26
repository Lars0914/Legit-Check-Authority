@echo off
cd /d "%~dp0"
title Ticker Metro
if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :fail
)
echo Starting Metro on http://localhost:8081
call npm start
goto :end

:fail
echo Metro failed to start.
pause

:end
