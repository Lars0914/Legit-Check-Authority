@echo off
REM Ticker — one script: emulator, Metro, install/launch app.
REM   run.bat          fast if app already installed (~20-30s)
REM   run.bat rebuild  full native build (~1-3 min first time or after native changes)
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Ticker - Run

set "AVD_NAME=Resizable_Experimental"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "FORCE_REBUILD=0"
if /I "%~1"=="rebuild" set "FORCE_REBUILD=1"
if /I "%~1"=="clean" set "FORCE_REBUILD=1"

echo ========================================
echo  Ticker (React Native)
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not on PATH.
  echo Install from https://nodejs.org/ then run this again.
  goto :fail
)

if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
  echo ERROR: Android SDK not found at:
  echo   %ANDROID_HOME%
  echo Install Android Studio and the Android SDK.
  goto :fail
)

set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

if not exist "node_modules\" (
  echo Installing npm dependencies...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    goto :fail
  )
  echo.
)

echo Checking for emulator or device...
adb devices

adb devices 2>nul | findstr /r "device$" | findstr /v "List" >nul
if errorlevel 1 goto :start_emulator
goto :after_emulator

:start_emulator
echo.
echo No emulator running. Starting %AVD_NAME% ...
start "Android Emulator" /D "%ANDROID_HOME%\emulator" emulator.exe -avd %AVD_NAME%
echo Waiting for emulator (up to 2 minutes)...
adb wait-for-device
set /a WAIT=0

:wait_boot
set "BOOT="
for /f "delims=" %%i in ('adb shell getprop sys.boot_completed 2^>nul') do set "BOOT=%%i"
if "!BOOT!"=="1" goto :after_emulator
set /a WAIT+=1
if !WAIT! GEQ 40 goto :after_emulator
timeout /t 3 /nobreak >nul
goto :wait_boot

:after_emulator
echo Device ready.
echo.

adb reverse tcp:8081 tcp:8081 >nul 2>&1
adb reverse tcp:3001 tcp:3001 >nul 2>&1

echo Starting Metro in a new window...
start "Ticker Metro" /D "%~dp0" cmd /k "npm start"

set "QUICK=0"
if "%FORCE_REBUILD%"=="0" (
  adb shell pm path com.ticker >nul 2>&1
  if not errorlevel 1 set "QUICK=1"
)

if "%QUICK%"=="1" (
  echo.
  echo App already installed — quick start ^(no Gradle rebuild^).
  echo For a full native rebuild: run.bat rebuild
  echo Waiting 5 seconds for Metro...
  timeout /t 5 /nobreak >nul
  adb shell am start -n com.ticker/.MainActivity >nul 2>&1
  if errorlevel 1 (
    echo Launch failed — running full install...
    goto :full_build
  )
  goto :success
)

:full_build
echo Waiting 10 seconds for Metro...
timeout /t 10 /nobreak >nul

echo.
if "%FORCE_REBUILD%"=="1" (
  echo Full rebuild ^(Gradle — may take 1-3 minutes^)...
) else (
  echo Building and installing app ^(first install may take 1-2 minutes^)...
)
call npx react-native run-android --no-packager --port 8081 --active-arch-only
if errorlevel 1 (
  echo.
  echo ERROR: Build or install failed.
  echo - Keep the Metro window open
  echo - If port 8081 is busy, close other Metro windows
  echo - Corrupted Gradle cache: delete %%USERPROFILE%%\.gradle\caches then run.bat rebuild
  echo - Or run: run.bat rebuild
  goto :fail
)

:success
echo.
echo ========================================
echo  SUCCESS - App should be on the emulator
echo  Keep the "Ticker Metro" window open
echo  Backend API: cd ..\backend ^&^& npm run dev  (port 3001)
echo ========================================
goto :end

:fail
echo.
echo ========================================
echo  FAILED - see messages above
echo ========================================

:end
echo.
pause
endlocal
