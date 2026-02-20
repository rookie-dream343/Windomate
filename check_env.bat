@echo off
echo Checking environment...
echo.
echo Python in conda env:
D:\conda\envs\my-neuro\python.exe --version
echo.
echo Testing imports:
D:\conda\envs\my-neuro\python.exe -c "import fastapi; print('fastapi OK')"
D:\conda\envs\my-neuro\python.exe -c "import funasr; print('funasr OK')"
D:\conda\envs\my-neuro\python.exe -c "import torch; print('torch OK')"
D:\conda\envs\my-neuro\python.exe -c "import modelscope; print('modelscope OK')"
echo.
echo All checks completed.
pause
