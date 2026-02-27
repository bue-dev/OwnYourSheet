# OwnYourSheet

A web app for managing cheat sheets, code snippets, prompts, and URLs with instant copy-to-clipboard and variable substitution.

## Tech Stack

- **Frontend:** Angular 21
- **Backend:** .NET 10 Web API
- **Database:** SQL Server (local via Docker, Azure SQL in production)
- **Auth:** Microsoft Entra External ID (Azure AD B2C) with MSAL
- **CI/CD:** GitHub Actions → Azure Container Apps

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local SQL Server)
- [VS Code](https://code.visualstudio.com/)

## Quick Start

### 1. Database

```bash
docker compose up -d
```

Starts SQL Server 2022 on `localhost:1433`.

### 2. Backend

```bash
cd backend/OwnYourSheet.Api
dotnet run
```

The API auto-migrates the database on startup. Runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
ng serve
```

Open `http://localhost:4200`. Angular proxies API calls to the backend.

## VS Code

Open the root `OwnYourSheet/` folder in VS Code.

- **Ctrl+Shift+B** → runs `start: all` task (backend + frontend)
- **F5** → debug .NET backend
- Install recommended extensions when prompted

## Project Structure

```
OwnYourSheet/
├── backend/
│   ├── OwnYourSheet.Api/       .NET 10 Web API
│   └── OwnYourSheet.Tests/     xUnit tests
├── frontend/                   Angular 21 SPA
├── .github/workflows/          CI/CD pipeline
├── .vscode/                    Tasks, launch configs, extensions
├── docker-compose.yml          Local SQL Server
└── Dockerfile                  Production multi-stage build
```

## API Endpoints

All endpoints require authentication.

| Method | Route                    | Description          |
|--------|--------------------------|----------------------|
| GET    | /api/categories          | List all categories  |
| GET    | /api/categories/{id}     | Get category         |
| POST   | /api/categories          | Create category      |
| PUT    | /api/categories/{id}     | Update category      |
| DELETE | /api/categories/{id}     | Delete category      |
| PUT    | /api/categories/reorder  | Reorder categories   |
| GET    | /api/entries?categoryId= | List entries         |
| GET    | /api/entries/{id}        | Get entry            |
| POST   | /api/entries             | Create entry         |
| PUT    | /api/entries/{id}        | Update entry         |
| DELETE | /api/entries/{id}        | Delete entry         |
| PUT    | /api/entries/reorder     | Reorder entries      |
| GET    | /api/search?q=           | Search entries       |
| GET    | /api/export              | Export all data      |
| POST   | /api/import              | Import data          |

## Testing

```bash
cd backend
dotnet test
```

Runs xUnit tests covering services for categories, entries, search, and import/export.

## CI/CD

GitHub Actions pipeline on push/PR to `main`:

1. **Build & Test** — restores, builds, and runs all backend tests
2. **Deploy** (main only) — builds Docker image, pushes to Azure Container Registry, deploys to Azure Container Apps
