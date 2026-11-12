@echo off
REM Drag the research-records Excel file onto this icon to update the website data.
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
if "%~1"=="" (
  echo Drag the Excel file onto update.bat
  pause
  exit /b 1
)
python "%~dp0sync_from_excel.py" "%~1"
pause
