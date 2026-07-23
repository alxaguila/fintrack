@echo off
setlocal
title zafyros

REM Situarse en la carpeta del script (la raiz del proyecto)
cd /d "%~dp0"

echo ============================================
echo            Iniciando zafyros
echo ============================================
echo.

REM Comprobar que Node esta instalado
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se encontro Node.js en el sistema.
    echo Instala Node.js desde https://nodejs.org y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
)

REM Instalar dependencias si faltan
if not exist "node_modules" (
    echo Primer arranque: instalando dependencias con npm install...
    echo Esto puede tardar un par de minutos.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo el npm install. Revisa los mensajes de arriba.
        echo.
        pause
        exit /b 1
    )
    echo.
)

echo Arrancando el servidor de desarrollo y abriendo el navegador...
echo (Cierra esta ventana o pulsa Ctrl+C para detener el servidor)
echo.

REM Arrancar Vite y abrir el navegador automaticamente
call npm run dev -- --open

REM Si el servidor se detiene, mantener la ventana abierta para ver errores
echo.
echo El servidor se ha detenido.
pause
endlocal
