Write-Host "Checking for SQL Server LocalDB..." -ForegroundColor Cyan
$localDbInfo = SqlLocalDB info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "SQL Server LocalDB is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads (Express edition includes LocalDB)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting LocalDB instance..." -ForegroundColor Cyan
SqlLocalDB start MSSQLLocalDB 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start LocalDB instance." -ForegroundColor Red
    exit 1
}

Write-Host "LocalDB is ready!" -ForegroundColor Green

$env:ConnectionStrings__DefaultConnection = "Server=(localdb)\MSSQLLocalDB;Database=OwnYourSheet;Trusted_Connection=true;TrustServerCertificate=True;"

Write-Host "Starting backend and frontend..." -ForegroundColor Cyan

$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:ASPNETCORE_ENVIRONMENT = 'Development'; `$env:ConnectionStrings__DefaultConnection = 'Server=(localdb)\MSSQLLocalDB;Database=OwnYourSheet;Trusted_Connection=true;TrustServerCertificate=True;'; cd '$root\backend\OwnYourSheet.Api'; dotnet run"
Set-Location "$root\frontend"
npx ng serve --proxy-config proxy.conf.json
