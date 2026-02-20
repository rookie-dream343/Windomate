@echo off
cd /d %~dp0
call D:\conda\Scripts\activate.bat D:\conda\envs\my-neuro && cd full-hub && python omni_bert_api.py
pause
