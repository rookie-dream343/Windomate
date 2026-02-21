@echo off
chcp 65001 >nul
echo 正在关闭现有的 ASR 服务...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq ASR*" 2>nul
timeout /t 2 >nul
echo.
echo 启动 ASR 服务...
start "ASR-Service" cmd /k "cd /d D:\deskmate\deskmate\my-neuro-main && call D:\conda\Scripts\activate.bat my-neuro && cd full-hub && python asr_api.py"
echo ASR 服务已启动
