# 🎓 Smart Classroom Assistant (QR Doubt & Quiz System)

An intelligent, real-time EdTech classroom management platform built with the MERN stack (MongoDB, Express, React 19, Node.js), Socket.IO, Google Gemini AI, and WebRTC MediaRecorder.

---

## 🌟 Core Features

### 👨‍🏫 Teacher Capabilities
- **Live Classroom Sessions**: Create sessions with auto-generated 6-character PIN codes and QR codes.
- **Session Control Panel**: Monitor active students, total attendance, pending doubts, and live timeline activity.
- **Session Timer Management**: Real-time countdown timer with quick extensions (+15m, +30m, +60m) or custom end times.
- **Doubt Management**: Review text & 🎤 voice doubts. Answer via text OR record 🎤 voice explanations.
- **Gemini AI Integration**: One-click AI explanation generation and AI quiz generation.
- **Interactive Quiz Studio**: Generate, edit, and publish topic assessment quizzes live to students.
- **Classroom Roster & Analytics**: Real-time student join/leave tracking with duration logging and CSV/Excel export.
- **Leaderboard & History**: Real-time quiz rankings and historical session reports.

### 🧑‍🎓 Student Capabilities
- **Seamless Classroom Access**: Join live sessions via QR code scan or PIN entry.
- **Anonymous-to-Classmates Doubts**: Submit text or 🎤 voice doubts; peer feed hides identity (`Anonymous Student`) while identifying student to teacher.
- **Custom Voice Message Player**: Compact audio player supporting seeking, time formatting, and single-active playback.
- **Live Quizzes & Real-time Leaderboard**: Instant score feedback, question palette navigation, and class rank tracking.
- **Personal Learning History**: Dedicated session history modal with attendance duration and doubt logs.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, React Router v7, Lucide React, Chart.js, HTML5 MediaRecorder.
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.IO, JWT, bcryptjs, Multer.
- **AI Engine**: Google Gemini API (`@google/generative-ai` model `gemini-1.5-flash`).

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or MongoDB Atlas connection string)

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure MONGO_URI, JWT_SECRET, and GEMINI_API_KEY in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/qr-doubt-system` |
| `JWT_SECRET` | Secret key for signing JWT auth tokens | `your_secret_key` |
| `GEMINI_API_KEY` | Google Gemini AI API Key | *(Required for AI features)* |
| `CLIENT_URL` | Allowed client origin for CORS | `http://localhost:5173` |

### Frontend (`client/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Express API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

---

## 📦 Production Deployment

### Building Frontend
```bash
cd client
npm run build
```
The production bundle is created in `client/dist/`.

### Health Check Endpoint
The backend includes a production health status endpoint:
```http
GET /api/health
```
Response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-08-09T10:50:00.000Z",
  "uptime": 120
}
```

---

## 📄 License
ISC License. Built for Smart Classroom Management.
