# Git-Music PowerShell Startup Script
$Host.UI.RawUI.WindowTitle = "Git-Music - In-DAW Version Control and Collaboration"

Clear-Host
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  🎵 GIT-MUSIC -- In-DAW Version Control and Collaboration Cockpit" -ForegroundColor White
Write-Host "  🚀 FL Studio, Ableton Live, Reaper, Logic Pro Collaboration Engine" -ForegroundColor DarkCyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not found in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js (v18+) from https://nodejs.org" -ForegroundColor Yellow
    Pause
    exit 1
}

# 2. Check and Install Dependencies
if (-not (Test-Path "daemon\node_modules")) {
    Write-Host "[1/4] Installing Daemon dependencies..." -ForegroundColor Yellow
    npm --prefix daemon install
}

if (-not (Test-Path "ui\node_modules")) {
    Write-Host "[2/4] Installing UI dependencies..." -ForegroundColor Yellow
    npm --prefix ui install
}

# 3. Build Daemon
Write-Host "[3/4] Compiling Git-Music Local Daemon (TypeScript)..." -ForegroundColor Yellow
npm --prefix daemon run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Daemon build failed." -ForegroundColor Red
    Pause
    exit 1
}

# 4. Start Daemon & UI
Write-Host "[4/4] Starting Git-Music Engine and In-DAW Studio Cockpit..." -ForegroundColor Green
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  [OK] WebSocket IPC Server starting on: ws://127.0.0.1:4848" -ForegroundColor White
Write-Host "  [OK] Studio Web Cockpit opening at:    http://localhost:3000" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

# Launch Daemon in a dedicated background window
Start-Process cmd.exe -ArgumentList '/k "npm --prefix daemon run start"'

# Open Browser to Vite Dev Server
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

# Start UI Vite Server in the main PowerShell window
Set-Location ui
npm run dev
Set-Location ..
