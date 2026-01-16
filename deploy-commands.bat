@echo off
title Deploy de Comandos
color 0B

echo Registrando comandos no Discord...
call npm run register-commands

if %errorlevel% neq 0 (
    color 0C
    echo Erro ao registrar comandos!
    pause
    exit /b 1
)

color 0A
echo.
echo Comandos registrados com sucesso!
pause
