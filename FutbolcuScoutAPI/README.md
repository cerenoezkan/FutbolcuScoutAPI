# ⚽ FutbolcuScoutAPI — Football Player Scouting Platform

A full-stack football scouting application that lets scouts and admins manage a player roster, search live data from an external football database, and organize a personal watchlist of players and teams — with Excel import/export support.

![Repo language badge](https://img.shields.io/github/languages/top/cerenoezkan/FutbolcuScoutAPI)
![Last commit](https://img.shields.io/github/last-commit/cerenoezkan/FutbolcuScoutAPI)

---

## 📖 Overview

FutbolcuScoutAPI is a role-based scouting management system built as a full-stack project. Two roles drive two different experiences:

- **Admin** — manages the core player roster (create, update, delete) and reviews live league standings.
- **Scout** — browses and filters the roster, searches for real players/teams via TheSportsDB API, and curates a personal favorites list that can be exported to / imported from Excel.

The backend is a **.NET Web API** backed by **MongoDB**, secured with **JWT authentication**. The frontend is a **React (Vite)** single-page app with a custom football-pitch-inspired design system.

---

## ✨ Features

| Category | Description |
|---|---|
| 🔐 Authentication | JWT-based login/register, role-based authorization (`Admin` / `Scout`) |
| 🧑‍💼 Roster management | Full CRUD on players (name, position, age, team, scout rating) |
| 🔎 Dynamic filtering | Filter roster by position, age range, and minimum scout rating via a dedicated MongoDB `FilterDefinitionBuilder` endpoint |
| 🌍 External data (TheSportsDB) | Search real players by name, search real teams by name, fetch live league standings by league ID |
| ⭐ Favorites | Add players/teams found via external search to a personal favorites list; remove them anytime |
| 📤 Excel export | Download the current favorites list as a formatted `.xlsx` file (generic, reflection-based export — works for any model) |
| 📥 Excel import | Upload an edited `.xlsx` file to bulk-create favorites, with automatic column-to-property mapping |
| 🎨 Custom UI | Football-pitch color theme (deep greens + amber accents), position-colored player pills, skeleton loading states, responsive layout |

---

## 🖼️ Screenshots

| Login | Roster Management | Favorites & Excel Actions |
|---|---|---|
| ![Login Screen](screenshots/giris_ekrani.png) | ![Admin Roster View](screenshots/yeni_oyuncu.png) | ![Favorites Panel](screenshots/favorites.png) |

| Player Search | Team Details | League Standings |
|---|---|---|
| ![Player Search](screenshots/arama.png) | ![Team Search](screenshots/arama2.png) | ![League Standings](screenshots/standings.png) |

---

## 🛠️ Tech Stack

**Backend**
- ASP.NET Core Web API (C#)
- MongoDB.Driver
- JWT Bearer Authentication
- ClosedXML (generic, reflection-based Excel read/write)
- TheSportsDB public API integration

**Frontend**
- React 18 + Vite
- Vanilla `fetch` for HTTP (no axios dependency)
- Custom CSS design system (Fraunces + Inter typefaces)

---

## 🗂️ Project Structure

```
FutbolcuScoutAPI/
├── FutbolcuScoutAPI/          # Main Web API project
│   ├── Controllers/           # AuthController, FutbolcuController, FavoriController,
│   │                          # PlayerSearchController, TeamSearchController, LeagueTableController
│   ├── Models/                # Futbolcu, Favori, User, etc.
│   ├── Services/              # MongoDBService, SportsDbService
│   └── Program.cs
├── GenericApi/
│   └── Services/
│       └── ExcelHelper.cs     # Generic, reflection-based Excel export/import (works with any <T>)
├── frontend/                  # React (Vite) client
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── screenshots/                # UI screenshots referenced in this README
├── .gitignore
└── FutbolcuScoutAPI.sln
```

---

## 🚀 Getting Started

### Prerequisites
- [.NET SDK](https://dotnet.microsoft.com/download) 8.0+
- [Node.js](https://nodejs.org/) 18+
- A MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repository

```bash
git clone https://github.com/cerenoezkan/FutbolcuScoutAPI.git
cd FutbolcuScoutAPI
```

### 2. Backend setup

```bash
cd FutbolcuScoutAPI
dotnet restore
```

Configure your local secrets (do **not** commit these — see [Environment Variables](#-environment-variables)):

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:MongoDb" "your-mongodb-connection-string"
dotnet user-secrets set "Jwt:Key" "your-jwt-secret-key"
```

Run the API:

```bash
dotnet run
```

The API will start on `https://localhost:44313` (adjust if your `launchSettings.json` differs).

### 3. Create the first Admin user

Register a user through `POST /api/auth/register`, then open **MongoDB Compass**, find that user's document in the `Users` collection, and manually set its `Role` field to `"Admin"`.

### 4. Frontend setup

```bash
cd frontend
npm install
```

Update `BASE_URL` in `src/App.jsx` if your API runs on a different port, then:

```bash
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`) in your browser.

---

## 🔑 Environment Variables

Sensitive configuration must **never** be committed to the repository. Use `dotnet user-secrets` locally, or environment variables in production.

| Key | Description |
|---|---|
| `ConnectionStrings:MongoDb` | MongoDB connection string |
| `Jwt:Key` | Secret key used to sign JWT tokens |
| `Jwt:Issuer` / `Jwt:Audience` | JWT token validation parameters |
| `TheSportsDb:ApiKey` | API key for TheSportsDB (if required by your plan) |

Make sure `appsettings.Development.json` (or any file containing real secrets) is listed in `.gitignore`.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Log in, receive JWT | Public |
| `GET` | `/api/futbolcu` | List all players | Bearer token |
| `GET` | `/api/futbolcu/filtrele` | Filter players by position/age/rating | Bearer token |
| `POST` / `PUT` / `DELETE` | `/api/futbolcu` | Manage players | Bearer token (Admin) |
| `GET` | `/api/PlayerSearch/{name}` | Search real players via TheSportsDB | Bearer token |
| `GET` | `/api/PlayerSearch/export/{name}` | Export search results to Excel | Bearer token |
| `GET` | `/api/TeamSearch/{name}` | Search real teams via TheSportsDB | Bearer token |
| `GET` | `/api/LeagueTable/{leagueId}` | Fetch live league standings | Bearer token |
| `GET` | `/api/Favori` | List favorites | Bearer token |
| `POST` | `/api/Favori` | Add a favorite | Bearer token |
| `DELETE` | `/api/Favori/{id}` | Remove a favorite | Bearer token |
| `GET` | `/api/Favori/export` | Download favorites as `.xlsx` | Bearer token |
| `POST` | `/api/Favori/import` | Bulk-add favorites from an uploaded `.xlsx` | Bearer token |

---

## 🧩 Notable Implementation Detail: Generic Excel Import/Export

`GenericApi/Services/ExcelHelper.cs` uses C# reflection (`typeof(T).GetProperties()`) so a single implementation can export/import **any** model type — currently used for both `Favori` and TheSportsDB search results — without writing per-model mapping code.

---

## 📄 License

This project was developed for educational purposes as part of a university software engineering course.
