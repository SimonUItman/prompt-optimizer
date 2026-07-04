$ErrorActionPreference = "Stop"

$port = 5177
$appUrl = "http://localhost:$port"
$nodeExe = "node"

Write-Host "Starting AI Prompt Modular App..."
Write-Host "Folder: $PSScriptRoot"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js was not found. Please install Node.js 18 or newer first:"
  Write-Host "https://nodejs.org/"
  Write-Host ""
  Read-Host "Press Enter to exit"
  exit 1
}

$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
  Write-Host "Found local .env."
} else {
  Write-Host "No .env found. DeepSeek optimization will not work until you run configure-api-key.bat."
}

$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
  Where-Object { $_.OwningProcess -gt 0 } |
  Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $connections) {
  try {
    Write-Host "Stopping old server process on port ${port}: $processId"
    Stop-Process -Id $processId -Force -ErrorAction Stop
  } catch {
    Write-Host "Could not stop process $processId. It may already be gone."
  }
}

Write-Host "Launching local server..."
$server = Start-Process -FilePath $nodeExe -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -PassThru

Start-Sleep -Seconds 2

try {
  $status = Invoke-RestMethod -Uri "$appUrl/api/config-status" -TimeoutSec 5
  if ($status.deepseekConfigured) {
    Write-Host "DeepSeek API Key: configured."
  } else {
    Write-Host "DeepSeek API Key: missing. Run configure-api-key.bat, then start again."
  }
} catch {
  Write-Host "Server did not respond yet. If the browser cannot open, wait a few seconds and refresh."
}

Start-Process $appUrl
Write-Host ""
Write-Host "Opened: $appUrl"
Write-Host "Keep this window open. Close it when you want to stop using the app."
Write-Host ""
Read-Host "Press Enter to stop server and exit"

try {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
} catch {}
