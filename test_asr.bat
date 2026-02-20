@echo off
echo Testing ASR service...
cd /d D:\deskmate\deskmate\my-neuro-main\full-hub
echo Current directory: %CD%
echo Activating conda environment...
call D:\conda\Scripts\activate.bat my-neuro
echo Conda env activated
echo Python location:
where python
echo.
echo Starting ASR API...
python asr_api.py
echo.
echo ASR API exited with code: %ERRORLEVEL%
pause
