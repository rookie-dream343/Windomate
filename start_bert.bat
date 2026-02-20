@echo off
cd /d D:\deskmate\deskmate\my-neuro-main
call D:\conda\Scripts\activate.bat my-neuro
cd full-hub
python omni_bert_api.py
pause
