@echo off
cd /d C:\Users\Ila92\okoume-box\backend
echo Lancement du serveur backend Okoume Box...
set PYTHON=C:\Users\Ila92\AppData\Local\Python\pythoncore-3.14-64\python.exe
%PYTHON% -m pip install -r requirements.txt --quiet --ignore-requires-python
echo Demarrage de l'API...
%PYTHON% -m uvicorn server:app --host 0.0.0.0 --port 8000
pause
