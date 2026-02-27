# OwnYourSheet

A web app for managing cheat sheets, code snippets, prompts, and URLs with instant copy-to-clipboard and variable substitution.

## Tech Stack

- **Frontend:** Angular 21
- **Backend:** .NET 10 Web API
- **Database:** SQL Server (local via Docker or LocalDB, Azure SQL in production)
- **Auth:** Microsoft Entra External ID (Azure AD B2C) with MSAL
- **CI/CD:** GitHub Actions → Azure Container Apps

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [VS Code](https://code.visualstudio.com/)
- **Database (one of):**
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [Podman Desktop](https://podman-desktop.io/) (requires Hyper-V)
  - [SQL Server LocalDB](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (lightweight, no containers needed — included with Visual Studio)

## Quick Start

Two start scripts are provided. Pick the one matching your setup:

### Option A: Docker / Podman

```powershell
.\start-docker.ps1
```

Starts a SQL Server container, waits for it to be ready, then launches backend and frontend.

### Option B: LocalDB (no containers)

```powershell
.\start-localdb.ps1
```

Uses SQL Server LocalDB — no Docker, no Hyper-V required. The script starts the LocalDB instance, then launches backend and frontend.

### Manual startup

If you prefer to start things individually:

```bash
# Database (Docker)
docker compose up -d

# Backend
cd backend/OwnYourSheet.Api
dotnet run

# Frontend
cd frontend
npm install
ng serve
```

The API auto-migrates the database on startup. Frontend runs at `http://localhost:4200`.

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
├── start-docker.ps1            Start script (Docker/Podman)
├── start-localdb.ps1           Start script (LocalDB)
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
