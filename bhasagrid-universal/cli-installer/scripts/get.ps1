# BhasaGrid Installer Bootstrap — Windows PowerShell
# Usage: irm https://bhasagrid.in/get.ps1 | iex

$ErrorActionPreference = "Stop"
$BhasaGridColor = "Magenta"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor $BhasaGridColor
Write-Host "  ║        BhasaGrid — Secure. Encrypted.        ║" -ForegroundColor $BhasaGridColor
Write-Host "  ║          CLI Installer Bootstrap             ║" -ForegroundColor $BhasaGridColor
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor $BhasaGridColor
Write-Host ""

# ── Check Node.js ─────────────────────────────────────────────────────────────
Write-Host "  Checking for Node.js..." -ForegroundColor Gray
$nodeInstalled = $null
try {
    $nodeVersion = & node --version 2>$null
    $nodeInstalled = $true
    Write-Host "  ✔ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    $nodeInstalled = $false
}

if (-not $nodeInstalled) {
    Write-Host "  Node.js not found. Installing via winget..." -ForegroundColor Yellow
    try {
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "  ✔ Node.js installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "  ✖ Could not install Node.js automatically." -ForegroundColor Red
        Write-Host "    Please install Node.js from https://nodejs.org and re-run this script." -ForegroundColor Gray
        exit 1
    }
}

# ── Install BhasaGrid CLI ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Installing BhasaGrid CLI..." -ForegroundColor Gray
try {
    & npm install -g bhasagrid --silent
    Write-Host "  ✔ BhasaGrid CLI installed." -ForegroundColor Green
} catch {
    Write-Host "  ✖ Failed to install BhasaGrid CLI." -ForegroundColor Red
    Write-Host "    Try running: npm install -g bhasagrid" -ForegroundColor Gray
    exit 1
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor $BhasaGridColor
Write-Host "  ║   ✔  Bootstrap complete!                     ║" -ForegroundColor Green
Write-Host "  ║                                              ║" -ForegroundColor $BhasaGridColor
Write-Host "  ║   Run: bhasagrid --install                   ║" -ForegroundColor Cyan
Write-Host "  ║        bhasagrid --help                      ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor $BhasaGridColor
Write-Host ""

# Auto-launch installer
& bhasagrid --install
