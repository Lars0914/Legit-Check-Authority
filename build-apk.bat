@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Legit Check Authority - APK build

set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
  echo ERROR: Android SDK not found at %ANDROID_HOME%
  pause
  exit /b 1
)
set "PATH=%ANDROID_HOME%\platform-tools;%PATH%"

REM Fast default: arm64-v8a only (~3x faster than building all ABIs).
REM   build-apk.bat            phone APK (arm64-v8a)
REM   build-apk.bat emulator   emulator APK (x86_64)
REM   build-apk.bat universal  all ABIs (slowest, widest device support)
set "ABI=arm64-v8a"
if /I "%~1"=="universal" set "ABI=armeabi-v7a,arm64-v8a,x86_64"
if /I "%~1"=="emulator" set "ABI=x86_64"

echo.
echo  Building release APK
echo  ABI: %ABI%
echo  Gradle cache and parallel builds enabled
echo.

if not exist "node_modules\" (
  echo Installing npm packages...
  call npm install
  if errorlevel 1 goto :fail
)

cd android
call gradlew.bat assembleRelease -PreactNativeArchitectures=%ABI% --parallel --build-cache
if errorlevel 1 goto :fail

set "APK=app\build\outputs\apk\release\app-release.apk"
if not exist "%APK%" (
  echo ERROR: APK not found at android\%APK%
  goto :fail
)

echo.
echo ========================================
echo  APK ready:
echo  %CD%\%APK%
echo ========================================
goto :end

:fail
echo.
echo BUILD FAILED
exit /b 1

:end
cd ..
pause
endlocal
