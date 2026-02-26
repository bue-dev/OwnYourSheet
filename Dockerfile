# Stage 1: Build Angular frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN node node_modules/@angular/cli/bin/ng.js build --configuration production

# Stage 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app/backend
COPY backend/OwnYourSheet.Api/OwnYourSheet.Api.csproj ./OwnYourSheet.Api/
RUN dotnet restore OwnYourSheet.Api/OwnYourSheet.Api.csproj
COPY backend/ ./
RUN dotnet publish OwnYourSheet.Api/OwnYourSheet.Api.csproj -c Release -o /publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=backend-build /publish ./
COPY --from=frontend-build /app/frontend/dist/ownyoursheet-frontend/browser/ ./wwwroot/

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "OwnYourSheet.Api.dll"]
