Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/OwnYourSheet.Api; dotnet run"
Set-Location frontend
npx ng serve --proxy-config proxy.conf.json