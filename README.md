# Temple & Pilgrimage Crowd Management

Smart crowd management platform for Gujarat temples:
- Somnath
- Dwarka (Dwarkadhish)
- Ambaji
- Pavagadh

Built for fast hackathon/final-year implementation with two core problem tracks:
1. Smart Queue + Digital Darshan Pass
2. AI/Rule-based Crowd Prediction

## Tech Stack
- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Frontend: React, React Router, Tailwind CSS, Recharts
- Security/Auth: JWT-based role access (`admin`, `staff`, `pilgrim`)

## Implemented Features
### 1) Smart Queue & Pass Management
- Digital darshan pass booking with QR generation
- Queue token auto-assigned during pass booking
- Assigned queue position and estimated wait shown immediately after booking
- Pass verification and mark-as-used flow
- Admin queue controls:
  - Call next token
  - Mark called token as completed
- Live queue stats for dashboards

### 2) Crowd Prediction Engine
- Endpoint: `GET /api/prediction/:templeId?date=YYYY-MM-DD`
- Festival-aware score computation (0-100) with temple-specific boosts
- 24-hour hourly crowd breakdown
- Hour labels: `Low`, `Moderate`, `High`, `Critical`
- Returns `peakHour`, `festivalName`, and operational recommendation

## High-Level Architecture
```text
React Frontend
  -> /api/auth/*       (register/login)
  -> /api/temples/*    (temple data + seed)
  -> /api/passes/*     (book, verify, use)
  -> /api/queue/*      (join, status, stats, actions)
  -> /api/prediction/* (24h prediction engine)

Express Backend
  -> Controllers + Routes + Middleware
  -> MongoDB (Temple, User, Pass, Queue collections)
```

## Project Structure
```text
src/
  app.js
  server.js
  config/db.js
  data/festivals.js
  controllers/
  middleware/
  models/
  routes/
frontend/
  src/
    pages/
    lib/api.ts
```

## Setup
### Prerequisites
- Node.js 20+ (recommended)
- MongoDB connection string (Atlas/local)

### Backend
```bash
npm install
copy .env.example .env
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default URLs
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## Authentication Flow (Updated)
- User logs in/registers from header modal in frontend.
- Token + user session are stored automatically in localStorage.
- No manual JWT paste required.
- Protected routes:
  - Book Pass
  - My Bookings
  - Predictions
  - Admin Dashboard (admin/staff only)

## Demo Flow (3-5 min viva)
1. Register/Login (header modal)
2. Home -> temple detail
3. Book pass -> show QR + queue token + assigned position
4. Open My Bookings -> retrieve QR anytime
5. Open Predictions page -> select temple/date and show forecast
6. Admin dashboard:
   - live occupancy bars
   - call next / mark completed
7. Prediction API with festival date to show crowd spike

## Important APIs
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/temples`
- `POST /api/passes/book`
- `GET /api/passes/mine`
- `GET /api/passes/verify/:passCode`
- `PATCH /api/passes/use/:passCode`
- `POST /api/queue/join`
- `GET /api/queue/status/by-token`
- `POST /api/queue/call-next`
- `POST /api/queue/mark-completed`
- `GET /api/prediction/:templeId?date=YYYY-MM-DD`
