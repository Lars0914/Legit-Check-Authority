@echo off
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "AVD_NAME=Resizable_Experimental"

if not exist "%ANDROID_HOME%\emulator\emulator.exe" (
  echo ERROR: emulator.exe not found. Install Android Studio SDK.
  pause
  exit /b 1
)

echo Available AVDs:
"%ANDROID_HOME%\emulator\emulator.exe" -list-avds
echo.
echo Starting: %AVD_NAME%
echo Close the emulator window to stop it.

start "Android Emulator" /D "%ANDROID_HOME%\emulator" emulator.exe -avd %AVD_NAME%
pause
