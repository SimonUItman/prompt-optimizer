$ErrorActionPreference = "Stop"

Write-Host "Configure DeepSeek API Key for this computer only."
Write-Host "This will create a local .env file in this folder."
Write-Host "Do not send the .env file to other people."
Write-Host ""

$apiKey = Read-Host "Paste your DeepSeek API Key"
if ([string]::IsNullOrWhiteSpace($apiKey)) {
  Write-Host "No key entered."
  exit 1
}

$envPath = Join-Path $PSScriptRoot ".env"
$content = @(
  "DEEPSEEK_API_KEY=$apiKey",
  "DEEPSEEK_BASE_URL=https://api.deepseek.com",
  "DEEPSEEK_MODEL=deepseek-chat",
  "DEEPSEEK_TEMPERATURE=0.4",
  "DEEPSEEK_MAX_TOKENS=2400",
  "PORT=5177"
)

[System.IO.File]::WriteAllLines($envPath, $content, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "Saved local .env."
Write-Host "Now run start-app.bat or 启动软件.bat."
Write-Host ""
