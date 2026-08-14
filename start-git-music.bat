@echo off
setlocal enabledelayedexpansion
title Git-Music - In-DAW Version Control and Collaboration

cls
echo ==============================================================================
echo   GIT-MUSIC -- In-DAW Version Control and Collaboration Cockpit
echo   FL Studio, Ableton Live, Reaper, Logic Pro Collaboration Engine
echo ==============================================================================
echo.

REM 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js (v18+) from https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM 2. Check and Install Dependencies if needed
if not exist "daemon\node_modules" (
    echo [1/4] Installing Daemon dependencies...
    call npm --prefix daemon install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install daemon dependencies.
        pause
        exit /b 1
    )
)

if not exist "ui\node_modules" (
    echo [2/4] Installing UI dependencies...
    call npm --prefix ui install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install UI dependencies.
        pause
        exit /b 1
    )
)

REM 3. Build Daemon
echo [3/4] Compiling Git-Music Local Daemon (TypeScript)...
call npm --prefix daemon run build
if !errorlevel! neq 0 (
    echo [ERROR] Daemon build failed.
    pause
    exit /b 1
)

REM 4. Start Daemon & UI
echo [4/4] Starting Git-Music Engine and In-DAW Studio Cockpit...
echo.
echo ==============================================================================
echo   [OK] WebSocket IPC Server starting on: ws://127.0.0.1:4848
echo   [OK] Studio Web Cockpit opening at:    http://localhost:3000
echo ==============================================================================
echo.

REM Launch Daemon in a dedicated background window
start "Git-Music Daemon Server" cmd /k "npm --prefix daemon run start"

REM Open Browser to Vite Dev Server
timeout /t 2 /nobreak >nul
start http://localhost:3000

REM Start UI Vite Server in the main window
cd ui
call npm run dev
cd ..
