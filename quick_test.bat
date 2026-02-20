@echo off
D:\conda\envs\my-neuro\python.exe --version > D:\deskmate\deskmate\my-neuro-main\test_output.txt 2>&1
D:\conda\envs\my-neuro\python.exe -c "import fastapi; import funasr; import torch; print('All imports OK')" >> D:\deskmate\deskmate\my-neuro-main\test_output.txt 2>&1
echo Test completed. Check test_output.txt for results.
