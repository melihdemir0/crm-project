# CRM Project

A simple full-stack **CRM application** built with NestJS and React to practice real-world backend and frontend development.

---

## Tech Stack

**Backend**
- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication
- Socket.IO

**Frontend**
- React
- Vite
- TypeScript
- Material UI (MUI)

**Other**
- Docker & Docker Compose
- n8n + Ollama (AI chatbot)

---

## Features

- User authentication (Admin / User)
- Role & ownership based authorization
- Leads and customers management
- Activity tracking (call, email, meeting, status changes)
- **Real-time notifications with Socket.IO**
- **AI chatbot integrated with n8n and Ollama**
- Dockerized full-stack setup

---

## Real-time Notifications

The application uses **Socket.IO** to send instant updates when important CRM actions happen  
(e.g. lead created, status changed, converted to customer).

---

## AI Chatbot

An AI chatbot is integrated into the CRM UI.

Flow:
Frontend → NestJS API → n8n workflow → Ollama → response back to UI

The chatbot is designed to be extended with CRM-related queries and automation.

---

## Project Structure

crm-project/
├── crm-api/ # NestJS backend
├── crm-frontend/ # React frontend
├── docker-compose.yml
└── README.md


---

## Run with Docker

docker compose up -d --build

Backend: http://localhost:3000

Frontend: http://localhost:5173

Local Development

Backend
cd crm-api
npm install
npm run start:dev

Frontend
cd crm-frontend
npm install
npm run dev

Notes

This project was built as a hands-on learning project focusing on:

Clean backend architecture

Real-time systems

AI integration in a CRM context
