# run.ps1 — Helper script to load .env and start Spring Boot locally
Set-Location $PSScriptRoot
$envFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "[SHOPIVO] Successfully loaded environment variables from backend/.env" -ForegroundColor Green
} else {
    Write-Host "[SHOPIVO] No .env file found in backend/. Running with defaults." -ForegroundColor Yellow
}

Write-Host "[SHOPIVO] Starting Spring Boot application..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "mvnw.cmd") spring-boot:run

