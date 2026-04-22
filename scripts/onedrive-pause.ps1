# OneDrive pause/resume helper for Thina CRM build/deploy
# Usage:
#   .\scripts\onedrive-pause.ps1 -Action Stop
#   .\scripts\onedrive-pause.ps1 -Action Start
#
# OneDrive corrupts .next cache files (symlinks become invalid -> EINVAL readlink errors).
# We fully stop OneDrive during build and restart it after.

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Stop", "Start", "Status")]
    [string]$Action
)

$ErrorActionPreference = "Stop"

function Get-OneDrivePath {
    $candidates = @(
        "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe",
        "C:\Program Files\Microsoft OneDrive\OneDrive.exe",
        "C:\Program Files (x86)\Microsoft OneDrive\OneDrive.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    $proc = Get-Process OneDrive -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc) { return $proc.Path }
    return $null
}

switch ($Action) {
    "Stop" {
        $running = Get-Process OneDrive -ErrorAction SilentlyContinue
        if (-not $running) {
            Write-Host "OneDrive is already stopped." -ForegroundColor Yellow
            exit 0
        }
        $exe = Get-OneDrivePath
        if ($exe) {
            Write-Host "Stopping OneDrive ($exe /shutdown)..." -ForegroundColor Cyan
            & $exe /shutdown
            Start-Sleep -Seconds 2
        }
        # Force-stop any lingering process
        Get-Process OneDrive -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "OneDrive stopped." -ForegroundColor Green
    }
    "Start" {
        if (Get-Process OneDrive -ErrorAction SilentlyContinue) {
            Write-Host "OneDrive is already running." -ForegroundColor Yellow
            exit 0
        }
        $exe = Get-OneDrivePath
        if (-not $exe) {
            Write-Error "OneDrive.exe not found in standard locations."
            exit 1
        }
        Write-Host "Starting OneDrive ($exe /background)..." -ForegroundColor Cyan
        Start-Process -FilePath $exe -ArgumentList "/background"
        Write-Host "OneDrive started." -ForegroundColor Green
    }
    "Status" {
        $running = Get-Process OneDrive -ErrorAction SilentlyContinue
        if ($running) {
            Write-Host "OneDrive is RUNNING (PID $($running.Id))." -ForegroundColor Green
        } else {
            Write-Host "OneDrive is STOPPED." -ForegroundColor Yellow
        }
    }
}
