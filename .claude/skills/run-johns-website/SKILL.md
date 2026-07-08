---
name: run-johns-website
description: Build, launch, and drive the Johns Website app (Express backend & static frontend).
---

# Run Johns Website Skill

This skill lets you build, launch, and verify the Johns Website application.

## Prerequisites

- Node.js (version 18+)
- Prisma CLI (installed via backend dependencies)
- Access to the PostgreSQL database (configured in `backend/.env`)

## Build

To install dependencies and prepare the Prisma client:
```bash
# Set up backend
cd backend
npm install
npx prisma generate
```

## Run & Verify (Agent Path)

Start the backend and frontend servers using the programmatic driver script:

```bash
# From the project root, launch the driver
node .claude/skills/run-johns-website/driver.mjs
```

The driver script handles spawning the backend API on port 5500, serving the frontend on port 3000, and running a connection check.

## Gotchas

- Make sure database connection credentials in `backend/.env` are valid before running. If the database is unreachable, the Express server will print connection errors but still listen on port 5500.
