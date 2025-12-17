# CRM Project

Full-stack CRM application built with NestJS and React.

## Tech Stack
- Backend: NestJS, TypeORM, PostgreSQL
- Frontend: React, Vite, TypeScript, MUI
- Auth: JWT (role-based)
- Docker & Docker Compose

## Features
- Authentication & authorization (admin / user)
- Leads and customers management
- Activity tracking (call, email, meeting, status changes)
- Role & ownership based access control

## Project Structure
crm-project/
├─ crm-api/ # NestJS backend
├─ crm-frontend/ # React frontend
└─ docker-compose.yml
## Run with Docker

docker compose up -d --build

Backend: http://localhost:3000
Frontend: http://localhost:5173

Local Development (optional)

Backend:

cd crm-api
npm install
npm run start:dev


Frontend:

cd crm-frontend
npm install
npm run dev

