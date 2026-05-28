<div align="center">
  <img src="./public/arohan gb-remove.JPG" width="250" alt="Arohan Logo" />
  <h1>🎯 AI Career Assistant</h1>
  <p><em>An intelligent, full-stack platform empowering students and professionals to navigate their careers — from identifying skill gaps to landing the perfect job.</em></p>
</div>

---

## 🚀 Overview

**AI Career Assistant** combines the advanced reasoning capabilities of Google Gemini with real-time job market data to serve as your personalized career co-pilot. Whether you need to generate tailored learning roadmaps, engage with an intelligent career advisor, track your learning progress, or discover job opportunities aligned with your profile, this platform provides a comprehensive suite of tools to accelerate your professional growth.

## ✨ Key Features

- **🤖 AI-Powered Guidance**: Consult with an intelligent career advisor powered by Google Gemini. Receive personalized advice, actionable skill recommendations, and instant answers to your career-related queries.
- **📊 Skill Gap Analysis**: Leverage visual charts that dynamically compare your current skill set against the demands of your target roles, ensuring you focus on the areas that matter most.
- **🗺️ Adaptive Roadmap Generation**: Let the AI construct a personalized, step-by-step learning path complete with specific skills, projects, certifications, and adaptive timelines based on your progress.
- **💼 Intelligent Job Recommendations**: Browse real, live job listings aggregated from external APIs, intelligently scored and ranked according to how well they align with your unique profile.
- **📈 Gamified Progress Tracking**: Stay motivated with built-in streak counters, analytics, and achievement tracking designed to foster consistent, daily learning habits.
- **⚙️ Comprehensive Profile Management**: Seamlessly manage your skills, set precise career goals, and configure your job preferences from a unified, modern dashboard.

> For a detailed look at our upcoming features and vision, please refer to the [ROADMAP.md](./ROADMAP.md).

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Recharts, React Router |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **AI Integration** | Google Gemini API |
| **External APIs** | RapidAPI (JSearch / Adzuna for Jobs) |
| **Security & Auth** | JWT, bcryptjs, Helmet.js, Express Rate Limit, CORS |

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed and configured before proceeding:
- **Node.js** (v16 or higher)
- **MongoDB** (Local instance or MongoDB Atlas)
- **Google Gemini API Key**
- **RapidAPI Key** *(Optional, but highly recommended for live job listings)*

### Installation & Setup

**1. Clone the repository and install frontend dependencies:**
```bash
npm install
```

**2. Configure and install backend dependencies:**
```bash
cd server
npm install
cp ../.env.example .env
```
*Note: Be sure to populate your `.env` file with the correct credentials (see Environment Variables below).*

**3. Launch the application:**
To start both the frontend development server and the backend API concurrently:
```bash
npm run dev:full
```

### Environment Variables

Create a `.env` file in the `server/` directory using the following template:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database configuration
MONGO_URI=mongodb://localhost:27017/ai-career-assistant

# Authentication
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

# External APIs
GEMINI_API_KEY=your_google_gemini_api_key
RAPIDAPI_KEY=your_rapidapi_key
```

## 📡 API Reference

Below is a comprehensive list of the available REST API endpoints.

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new user account |
| `POST` | `/login` | Authenticate and retrieve a JWT |
| `GET` | `/me` | Retrieve the authenticated user's profile |
| `GET` | `/verify` | Verify the current JWT validity |
| `POST` | `/refresh` | Refresh an expiring JWT |

### User Management (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/profile` | Get the user's profile information |
| `PUT` | `/profile` | Update the user's profile |
| `POST` | `/skills` | Add a new skill to the user's profile |
| `PUT` | `/skills/:skillId` | Update an existing skill |
| `DELETE` | `/skills/:skillId` | Remove a skill |
| `POST` | `/goals` | Add a new career goal |
| `PUT` | `/goals/:goalId` | Update a career goal |
| `DELETE` | `/goals/:goalId` | Delete a career goal |
| `PUT` | `/preferences` | Update job/learning preferences |
| `GET` | `/stats` | Retrieve aggregated user statistics |

### Skills Intelligence (`/api/skills`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/suggestions` | Get AI-driven skill suggestions |
| `GET` | `/categories` | Retrieve predefined skill categories |
| `GET` | `/trending` | View current trending skills |

### Roadmaps (`/api/roadmaps`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate` | Generate a new AI-driven learning roadmap |
| `GET` | `/` | List all roadmaps belonging to the user |
| `GET` | `/:id` | Retrieve a specific roadmap |
| `PUT` | `/:id` | Update roadmap metadata (e.g., title, description) |
| `DELETE` | `/:id` | Delete a specific roadmap |
| `POST` | `/:id/adapt` | Adapt a roadmap based on missed or early completions |
| `PUT` | `/:id/items/:itemId/toggle` | Toggle the completion status of a roadmap item |

### Jobs (`/api/jobs`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/search` | Search for job listings via external APIs |
| `GET` | `/recommendations` | Get personalized job recommendations |
| `POST` | `/save` | Save a job listing to the user's profile |
| `GET` | `/saved` | Retrieve all saved jobs |
| `DELETE` | `/saved/:jobId` | Remove a job from saved listings |

### AI Chat (`/api/chat`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/message` | Send a message to the AI career advisor |
| `GET` | `/sessions` | List all historical chat sessions |
| `GET` | `/history/:sessionId` | Retrieve the message history for a specific session |
| `PUT` | `/sessions/:sessionId` | Update the metadata of a chat session |

### Analytics (`/api/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Retrieve high-level dashboard analytics |
| `GET` | `/skills` | Get detailed analytics on user skills |
| `POST` | `/feedback` | Submit application feedback or issues |

## 🔒 Security Practices

- **Robust Authentication**: JWT-based authentication with secure, standardized token handling.
- **Data Protection**: All passwords are cryptographically hashed using `bcrypt` (12 rounds).
- **Abuse Prevention**: Strict rate limiting implemented across all public and authenticated API routes.
- **Data Integrity**: Comprehensive input validation and sanitization on all endpoints.
- **Transport Security**: CORS restrictions and secure HTTP headers enforced via `Helmet.js`.

## 🤝 Contributing

We welcome contributions! To get started:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add exciting new feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request for review.

## 🏆 Acknowledgments

Built with cutting-edge technologies including [Google Gemini](https://deepmind.google/technologies/gemini/), [RapidAPI](https://rapidapi.com/), [Recharts](https://recharts.org/), and [Tailwind CSS](https://tailwindcss.com/).
