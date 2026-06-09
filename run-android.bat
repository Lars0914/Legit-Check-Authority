@echo off
setlocal
cd /d "%~dp0"

set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
  echo ERROR: Android SDK not found at %ANDROID_HOME%
  pause
  exit /b 1
)
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

echo Checking device...
adb devices
adb devices 2>nul | findstr /r "device$" | findstr /v "List" >nul
if errorlevel 1 (
  echo.
  echo ERROR: No Android device/emulator. Run run-emulator.bat first.
  pause
  exit /b 1
)

adb reverse tcp:8081 tcp:8081 >nul 2>&1

echo Building and installing...
call npx react-native run-android --no-packager --port 8081 --active-arch-only
if errorlevel 1 (
  echo Build failed. Is Metro running? Run run-metro.bat first.
  pause
  exit /b 1
)

echo Done.
pause
endlocal
