# OwnYourSheet

A desktop app for managing cheat sheets, code snippets, prompts, and URLs with instant copy-to-clipboard and variable substitution.

## Tech Stack

- **Frontend:** Angular 19
- **Backend:** .NET 10 Web API
- **Database:** SQLite (local) → Azure SQL (cloud, future)
- **Desktop:** Electron

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [VS Code](https://code.visualstudio.com/)

## Quick Start

### 1. Backend

```bash
cd backend/OwnYourSheet.Api

# Install EF Core CLI (one time)
dotnet tool install --global dotnet-ef

# Create initial migration
dotnet ef migrations add InitialCreate

# Run API (auto-migrates DB on startup)
dotnet run
```

API runs at `https://localhost:5001` (or `http://localhost:5000`).

Test: `curl http://localhost:5000/api/categories`

### 2. Frontend

```bash
cd frontend
npm install
ng serve
```

Open `http://localhost:4200`. Angular proxies API calls to localhost:5000.

### 3. Desktop (Electron)

```bash
cd electron
npm install
npm start
```

## VS Code

Open the root `OwnYourSheet/` folder in VS Code.

- **Ctrl+Shift+B** → runs `start: all` task (backend + frontend)
- **F5** → debug .NET backend
- Install recommended extensions when prompted

## Project Structure

```
OwnYourSheet/
├── backend/           .NET 10 Web API + SQLite
├── frontend/          Angular 19 SPA (to be scaffolded)
├── electron/          Electron wrapper (to be scaffolded)
└── .vscode/           Tasks, launch configs, extensions
```

## API Endpoints

| Method | Route                  | Description          |
|--------|------------------------|----------------------|
| GET    | /api/categories        | List all categories  |
| POST   | /api/categories        | Create category      |
| PUT    | /api/categories/{id}   | Update category      |
| DELETE | /api/categories/{id}   | Delete category      |
| PUT    | /api/categories/reorder| Reorder categories   |
| GET    | /api/entries?categoryId=| List entries         |
| GET    | /api/entries/{id}      | Get entry            |
| POST   | /api/entries           | Create entry         |
| PUT    | /api/entries/{id}      | Update entry         |
| DELETE | /api/entries/{id}      | Delete entry         |
| PUT    | /api/entries/reorder   | Reorder entries      |
| GET    | /api/export            | Export all data      |
| POST   | /api/import            | Import data          |
