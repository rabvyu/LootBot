@echo off
title Bot Gamificacao Discord
color 0A

echo Compilando...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo Erro na compilacao!
    pause
    exit /b 1
)

echo.
echo Iniciando bot...
call npm run start

pause
