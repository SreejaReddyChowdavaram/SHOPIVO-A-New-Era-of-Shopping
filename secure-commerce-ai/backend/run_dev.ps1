# Load backend/.env into current process environment
Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $parts = $line.Split('=', 2)
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}

Write-Host "Starting Spring Boot with DB_URL: $env:DB_URL"
.\mvnw.cmd spring-boot:run
