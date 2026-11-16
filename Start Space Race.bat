@echo off
setlocal
cd /d "%~dp0"

echo =============================================
echo     Space Race: Beyond Earth - Windows
echo =============================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js / npm is not installed or is not on PATH.
  echo Install Node.js 22.12+ LTS from https://nodejs.org/
  echo Close and reopen this window after installation.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [ERROR] package.json was not found.
  echo Please extract the whole GitHub ZIP before running this file.
  pause
  exit /b 1
)

echo Checking and installing dependencies...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo [ERROR] npm install failed. Check the messages above.
  pause
  exit /b 1
)

echo.
echo Starting the game...
echo The game will open in your web browser.
echo Keep this window open. Press Ctrl+C to stop.
echo.
call npm run dev -- --open
if errorlevel 1 (
  echo.
  echo [ERROR] Game server failed to start. Check the messages above.
  pause
  exit /b 1
)
endlocal
