@echo off
REM Script para instalar Node.js y dependencias automáticamente en Windows
REM Ejecuta como ADMINISTRADOR

echo.
echo ============================================
echo INSTALADOR AUTOMATICO - PROYECTO VENUZ
echo ============================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js ya está instalado
    goto instalar_dependencias
)

echo ❌ Node.js no encontrado. Instalando...
echo.

REM Descargar Node.js
echo Descargando Node.js LTS...
powershell -Command "(New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'node-installer.msi'"

REM Instalar Node.js
echo Instalando Node.js...
msiexec.exe /i node-installer.msi /quiet /norestart

REM Esperar a que termine la instalación
timeout /t 30 /nobreak

REM Eliminar instalador
del node-installer.msi

REM Actualizar PATH
setx PATH "%PATH%;C:\Program Files\nodejs"

echo ✅ Node.js instalado exitosamente

:instalar_dependencias
echo.
echo ============================================
echo Instalando dependencias del proyecto...
echo ============================================
echo.

npm install

echo.
echo ============================================
echo ✅ TODO LISTO
echo ============================================
echo.
echo Para ejecutar los BOTS automáticamente:
echo.
echo   npm run scheduler
echo.
echo Los datos se guardarán en Supabase
echo.
pause
