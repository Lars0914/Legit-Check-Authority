@echo off
REM DEV MODE - open app on emulator for fast UI work. Does NOT build an APK.
REM   run.bat          daily dev (fast - no Gradle if app already installed)
REM   run.bat install  first-time install on emulator (slow, once)
REM   run.bat rebuild  after native/Android changes only
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Legit Check Authority - DEV

set "AVD_NAME=Resizable_Experimental"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "MODE=dev"
if /I "%~1"=="install" set "MODE=install"
if /I "%~1"=="rebuild" set "MODE=rebuild"
if /I "%~1"=="clean" set "MODE=rebuild"

echo.
echo  DEV MODE - UI preview on emulator (not an APK build)
echo  API: https://ticker-backend-six.vercel.app
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Install Node 22 or newer from nodejs.org
  goto :fail
)

for /f "tokens=2 delims=v." %%v in ('node -v 2^>nul') do set "NODE_MAJOR=%%v"
if not defined NODE_MAJOR goto :fail_node
if !NODE_MAJOR! LSS 22 goto :fail_node

if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
  echo ERROR: Android SDK not found. Install Android Studio.
  goto :fail
)
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

if not exist "node_modules\" (
  echo Installing npm packages - first time only
  call npm install
  if errorlevel 1 goto :fail
)

echo [1/4] Emulator / device
adb devices 2>nul | findstr /r "device$" | findstr /v "List" >nul
if errorlevel 1 goto :start_emulator
goto :device_ok

:start_emulator
echo   Starting emulator %AVD_NAME%
start "Android Emulator" /D "%ANDROID_HOME%\emulator" emulator.exe -avd %AVD_NAME%
echo   Waiting for emulator to boot
adb wait-for-device
set /a WAIT=0

:wait_boot
set "BOOT="
for /f "delims=" %%i in ('adb shell getprop sys.boot_completed 2^>nul') do set "BOOT=%%i"
if "!BOOT!"=="1" goto :device_ok
set /a WAIT+=1
if !WAIT! GEQ 40 goto :device_ok
timeout /t 3 /nobreak >nul
goto :wait_boot

:device_ok
adb devices 2>nul | findstr "offline" >nul
if not errorlevel 1 (
  echo   WARNING: emulator shows offline - restarting adb
  adb kill-server >nul 2>&1
  adb start-server >nul 2>&1
  timeout /t 5 /nobreak >nul
)
echo   Ready

echo [2/4] Metro bundler
set "METRO_UP=0"
netstat -an 2>nul | findstr ":8081" | findstr "LISTENING" >nul
if not errorlevel 1 set "METRO_UP=1"
if "!METRO_UP!"=="1" (
  echo   Already running on port 8081
) else (
  echo   Clearing Metro cache
  if exist "%TEMP%\metro-cache" rmdir /s /q "%TEMP%\metro-cache" 2>nul
  for /d %%D in ("%TEMP%\metro-*") do rmdir /s /q "%%D" 2>nul
  for /d %%D in ("%TEMP%\haste-map-*") do rmdir /s /q "%%D" 2>nul
  echo   Starting Metro - keep the Ticker Metro window open
  start "Ticker Metro" /D "%~dp0" cmd /k "npm run start:clean"
  echo   Waiting 12 seconds for Metro
  ping 127.0.0.1 -n 13 >nul
)

echo [3/4] Connect emulator to Metro
adb start-server >nul 2>&1
adb reverse tcp:8081 tcp:8081 2>nul

set "APP_INSTALLED=0"
adb shell pm path com.legitcheckauthority.app >nul 2>&1
if not errorlevel 1 set "APP_INSTALLED=1"

if "%MODE%"=="dev" if "!APP_INSTALLED!"=="1" goto :launch
if "%MODE%"=="rebuild" goto :install
if "%MODE%"=="install" goto :install
if "!APP_INSTALLED!"=="0" goto :install
goto :launch

:install
if "%MODE%"=="rebuild" (
  echo   Clearing stale autolinking cache and old package if present...
  rmdir /s /q android\build\generated\autolinking 2>nul
  adb uninstall com.ticker 2>nul
)
echo [4/4] Installing app on emulator - first time or rebuild, 1-3 min
echo   This is NOT an APK - just puts the dev app on the emulator
call npx react-native run-android --no-packager --port 8081 --active-arch-only
if errorlevel 1 goto :fail
goto :done

:launch
echo [4/4] Opening app - no Gradle build
timeout /t 2 /nobreak >nul
adb shell am start -n com.legitcheckauthority.app/.MainActivity >nul 2>&1
if errorlevel 1 (
  echo   App not found - running first install
  goto :install
)

:done
echo.
echo ========================================
echo  DEV READY - edit UI in src/ and save
echo  Changes appear live in the emulator
echo  Keep Ticker Metro window open
echo.
echo  First install slow?  run.bat install
echo  Native code change?  run.bat rebuild
echo  Release APK later?   android\gradlew assembleRelease
echo ========================================
goto :end

:fail_node
echo ERROR: Node.js 22 or newer required.
node -v
goto :fail

:fail
echo.
echo ========================================
echo  FAILED - see messages above
echo ========================================

:end
echo.
pause
endlocal
