# 🎯 AI Career Assistant

An intelligent, full-stack platform that helps students and professionals navigate their careers — from identifying skill gaps to landing the right job.

---

## What It Does

AI Career Assistant combines the power of Google Gemini with real-time job market data to give users a personalized career co-pilot. Users can chat with an AI advisor, generate step-by-step learning roadmaps, track their progress, and discover jobs that actually match their skills and goals.

---

## Features

**AI-Powered Guidance** — Chat with an intelligent career advisor powered by Google Gemini. Get personalized advice, skill recommendations, and answers to career questions in real time.

**Skill Gap Analysis** — Visual charts compare your current skills against the requirements of your target role, so you always know exactly what to work on next.

**Roadmap Generation** — The AI generates a tailored, step-by-step learning path with specific skills, projects, certifications, and timelines based on your goals.

**Job Recommendations** — Browse real job listings pulled from live APIs, scored and ranked by how well they match your profile.

**Progress Tracking** — Gamified streak counters and achievement systems keep you motivated and building consistent daily learning habits.

**Profile & Skills Management** — Track your skills, set career goals, and manage everything from a clean, personalized dashboard.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, React Router |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| AI | Google Gemini API |
| Jobs | RapidAPI / Adzuna |
| Auth | JWT, bcryptjs |
| Security | Helmet.js, Express Rate Limit, CORS |

---

## Getting Started

### Prerequisites

- Node.js v16+
- MongoDB (local or cloud)
- Google Gemini API key
- RapidAPI key *(optional, for live job listings)*

### Setup

**1. Clone and install frontend dependencies:**
```bash
npm install
```

**2. Set up the backend:**
```bash
cd server
npm install
cp ../.env.example .env
# Edit .env with your credentials
npm run dev
```

**3. Run both frontend and backend together:**
```bash
npm run dev:full
```

### Environment Variables

Create a `.env` file inside the `server/` directory:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/ai-career-assistant

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI
GEMINI_API_KEY=your-gemini-api-key

# Jobs
RAPIDAPI_KEY=your-rapidapi-key
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key
```

---

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/profile` | Get profile |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/skills` | Add a skill |
| PUT | `/api/users/skills/:id` | Update a skill |
| DELETE | `/api/users/skills/:id` | Remove a skill |

### AI Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat/message` | Send a message |
| GET | `/api/chat/history/:sessionId` | Get session history |
| GET | `/api/chat/sessions` | List all sessions |

### Roadmaps
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/roadmaps/generate` | Generate a new roadmap |
| GET | `/api/roadmaps` | List user roadmaps |
| GET | `/api/roadmaps/:id` | Get a specific roadmap |
| PUT | `/api/roadmaps/:id/items/:itemId/toggle` | Toggle item completion |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs/search` | Search job listings |
| GET | `/api/jobs/recommendations` | Get personalized matches |
| POST | `/api/jobs/save` | Save a job |
| GET | `/api/jobs/saved` | View saved jobs |

---

## Security

- JWT authentication with secure token handling
- Passwords hashed with bcrypt (12 rounds)
- Rate limiting on all API routes
- Input validation and sanitization
- CORS and security headers via Helmet.js

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push and open a Pull Request

---

## Acknowledgments

Built with [Google Gemini](https://deepmind.google/technologies/gemini/), [RapidAPI](https://rapidapi.com/), [Recharts](https://recharts.org/), and [Tailwind CSS](https://tailwindcss.com/).
