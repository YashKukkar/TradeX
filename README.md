# TradeX

A full-stack trading platform with a marketing site, a user-facing web app, and a Spring Boot API.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Quick Launch](#quick-launch-recommended)
  - [Manual Launch](#manual-launch)
- [Default Accounts](#default-accounts)
  - [Admin Account](#admin-account)
  - [Employee Accounts](#employee-accounts)
  - [Test Users](#test-users)
- [Project Structure](#project-structure)

## Tech Stack

| Service | Tech | Port |
|---------|------|------|
| **Backend API** | Spring Boot 4.1 / Java 26 | `8080` |
| **NextJS** | Next.js 16 (React 19) | `3000` |
| **Trading App** | Vite + TypeScript | `5173` |



## Getting Started

### Quick Launch (recommended)

Open PowerShell in the project folder and run:

```powershell
.\launch.ps1
```

This handles dependency installation and starts all three services automatically.

### Manual Launch

To start the services manually, open **3 separate terminals** inside the project root folder :

**PowerShell:**

*Terminal 1 — API*
```powershell
cd backend; mvn spring-boot:run
```

*Terminal 2 — NextJS*
```powershell
cd nextjs-app; npm install; npm run dev
```

*Terminal 3 — Trading App*
```powershell
cd tradex-app; npm install; npm run dev
```

**Command Prompt:**

*Terminal 1 — API*
```cmd
cd backend && mvn spring-boot:run
```

*Terminal 2 — NextJS*
```cmd
cd nextjs-app && npm install && npm run dev
```

*Terminal 3 — Trading App*
```cmd
cd tradex-app && npm install && npm run dev
```

## Default Accounts

For development and testing purposes, the application is pre-seeded with the following default accounts.

### Admin Account
- **Email:** `admin@tradex.com`
- **Password:** `123456789`

### Employee Accounts
All employee accounts share the default password: `123456789`.

- `e1@tradex.com` (Permissions: `MANAGE_USERS`, `MANAGE_POINTS`)
- `e2@tradex.com` (Permissions: `MANAGE_DEPOSITS`, `MANAGE_WITHDRAWALS`)
- `e3@tradex.com` (Permissions: `MANAGE_SETTINGS`)

### Test Users
All test users share the same default password: `123456789`.

- `u1@test.com`
- `u2@test.com`
- `u3@test.com`
- `u4@test.com`

## Project Structure

```
├── backend/          # Spring Boot REST API
├── nextjs-app/       # Next.js marketing site
├── tradex-app/       # Vite trading dashboard
├── launch.ps1        # One-click launcher script
└── README.md
```

