@echo off
rem Avvia la versione locale del sito (Vite, porta 5182). Doppio clic per usarlo.
cd /d "%~dp0"

if not exist node_modules (
  echo Prima installazione delle dipendenze...
  call npm install
  if errorlevel 1 goto errore
)

echo Sito in avvio su http://localhost:5182/allin1/
echo Per fermarlo chiudi questa finestra oppure premi Ctrl+C.
call npm run dev -- --open
if errorlevel 1 goto errore
goto fine

:errore
echo.
echo Avvio non riuscito: leggi l'errore sopra.
pause

:fine
