@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0应用UniApp第三阶段第一批_修正版.ps1"
echo.
pause
