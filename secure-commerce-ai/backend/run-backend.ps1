# Run Backend Server Helper Script

# 1. Free port 8080 if an old process is running
$existingPortProcess = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($existingPortProcess) {
    foreach ($pidToKill in $existingPortProcess) {
        if ($pidToKill -gt 0) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Milliseconds 500
}

# 2. Configure Java JDK 21
$javaHome = "$env:USERPROFILE\scoop\apps\temurin21-jdk\current"
if (Test-Path $javaHome) {
    $env:JAVA_HOME = $javaHome
    $env:PATH = "$javaHome\bin;$env:PATH"
}

# 3. Load .env into current process environment
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)\s*=\s*(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
        }
    }
}

Write-Host "Starting SecureCommerce Backend..." -ForegroundColor Cyan
.\mvnw.cmd -q spring-boot:run "-Dspring-boot.run.profiles=dev"
