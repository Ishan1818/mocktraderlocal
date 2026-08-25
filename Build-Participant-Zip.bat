@echo off
title Build TRADEVERSE Participant Zip
cd /d "%~dp0"

echo Building Tradeverse-Participant.zip ...
echo This may take a minute.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\offline\build-share-package.ps1"
if errorlevel 1 (
  echo.
  echo Build failed. See errors above.
  pause
  exit /b 1
)

echo.
echo Done. Send Tradeverse-Participant.zip to participants.
echo Share separately: Supabase URL + anon key, TIMELINE_DECRYPT_KEY at event start.
echo.
pause
