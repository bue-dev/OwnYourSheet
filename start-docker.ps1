Write-Host "Starting SQL Server container..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start Docker container. Is Docker Desktop running?" -ForegroundColor Red
    exit 1
}

Write-Host "Waiting for SQL Server to be ready..." -ForegroundColor Cyan
$retries = 0
while ($retries -lt 30) {
    $result = docker exec ownyoursheet-sqlserver /opt/mssql-tools2/bin/sqlcmd -S localhost -U sa -P "Dev!Pass2026" -Q "SELECT 1" 2>$null
    if ($LASTEXITCODE -eq 0) { break }
    $retries++
    Write-Host "  SQL Server not ready yet, retrying ($retries/30)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if ($retries -eq 30) {
    Write-Host "SQL Server did not become ready in time." -ForegroundColor Red
    exit 1
}

Write-Host "SQL Server is ready!" -ForegroundColor Green
Write-Host "Starting backend and frontend..." -ForegroundColor Cyan

$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:ASPNETCORE_ENVIRONMENT = 'Development'; cd '$root\backend\OwnYourSheet.Api'; dotnet run"
Set-Location "$root\frontend"
npx ng serve --proxy-config proxy.conf.json