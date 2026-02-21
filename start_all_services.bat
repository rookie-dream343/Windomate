@echo off
chcp 65001 >nul
title 启动 DeskMate 所有服务

echo ========================================
echo DeskMate 服务启动脚本
echo ========================================
echo.

:: 设置项目路径
set PROJECT_DIR=D:\deskmate\deskmate\my-neuro-main
set CONDA_PATH=D:\conda

cd /d "%PROJECT_DIR%"

:: 检查 conda 环境
echo [1/4] 检查 conda 环境...
if not exist "%CONDA_PATH%\Scripts\activate.bat" (
    echo [错误] 未找到 conda 环境: %CONDA_PATH%
    pause
    exit /b 1
)

:: 启动 BERT 服务
echo.
echo [2/4] 启动 BERT 分类服务 (端口 6007)...
start "BERT-Service" cmd /k "cd /d %PROJECT_DIR% && call %CONDA_PATH%\Scripts\activate.bat my-neuro && cd full-hub && echo 正在启动 BERT 服务... && python omni_bert_api.py"
timeout /t 3 >nul

:: 启动 ASR 服务
echo.
echo [3/4] 启动 ASR 语音识别服务 (端口 1000)...
start "ASR-Service" cmd /k "cd /d %PROJECT_DIR% && call %CONDA_PATH%\Scripts\activate.bat my-neuro && cd full-hub && echo 正在启动 ASR 服务... && python asr_api.py"
timeout /t 3 >nul

:: 检查 TTS 服务
echo.
echo [4/4] 检查 TTS 服务状态...
echo TTS 服务需要单独启动 (运行 2.TTS.bat)

:: 等待服务启动
echo.
echo 等待服务启动...
timeout /t 5 >nul

echo.
echo ========================================
echo 服务启动完成！
echo ========================================
echo.
echo 服务窗口:
echo   - BERT: 端口 6007
echo   - ASR:  端口 1000
echo   - TTS:  端口 5000 (需手动启动)
echo.
echo 请保持这些命令行窗口打开！
echo 现在可以运行 live-2d\go.bat 启动主程序
echo.
pause
