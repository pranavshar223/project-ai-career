# AI Career Assistant Platform

A comprehensive AI-powered platform that helps students and professionals plan their career paths, identify skill gaps, and connect with real job opportunities.

## 🚀 Features

### Frontend (React + TypeScript)
- **User Authentication**: Secure sign up/login with JWT tokens
- **AI Career Chat**: Interactive chat powered by Google Gemini API
- **Personalized Dashboard**: Progress tracking, skill gap analysis, and learning streaks
- **Job Recommendations**: Real-time job listings with match scoring
- **Roadmap Generation**: AI-generated step-by-step career roadmaps
- **Profile Management**: Skills tracking and career goal setting
- **Responsive Design**: Mobile-first design with Tailwind CSS

### Backend (Node.js + Express)
- **RESTful API**: Comprehensive API with proper error handling
- **MongoDB Integration**: Flexible document-based data storage
- **AI Integration**: Google Gemini API for intelligent responses
- **Job API Integration**: RapidAPI integration for real job listings
- **Authentication & Security**: JWT-based auth with bcrypt password hashing
- **Rate Limiting**: API protection against abuse
- **Data Validation**: Input validation and sanitization

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Recharts for data visualization
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- Google Gemini API for AI responses
- RapidAPI for job listings
- Express Rate Limit for API protection

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Google Gemini API key
- RapidAPI key (optional, for job listings)

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment variables
cp ../.env.example .env

# Edit .env file with your configuration
# Add your MongoDB URI, JWT secret, and API keys

# Start development server
npm run dev
```

### Full Stack Development
```bash
# Run both frontend and backend simultaneously
npm run dev:full
```

## 🔧 Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/ai-career-assistant

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# RapidAPI Configuration
RAPIDAPI_KEY=your-rapidapi-key-here
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/skills` - Add skill
- `PUT /api/users/skills/:id` - Update skill
- `DELETE /api/users/skills/:id` - Remove skill

### AI Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history/:sessionId` - Get chat history
- `GET /api/chat/sessions` - Get all chat sessions

### Roadmaps
- `POST /api/roadmaps/generate` - Generate AI roadmap
- `GET /api/roadmaps` - Get user roadmaps
- `GET /api/roadmaps/:id` - Get specific roadmap
- `PUT /api/roadmaps/:id/items/:itemId/toggle` - Toggle item completion

### Job Search
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/recommendations` - Get personalized recommendations
- `POST /api/jobs/save` - Save job
- `GET /api/jobs/saved` - Get saved jobs

## 🎯 Key Features Explained

### AI-Powered Career Guidance
The platform uses Google Gemini API to provide intelligent career advice, skill recommendations, and personalized roadmaps based on user goals and current skills.

### Skill Gap Analysis
Visual charts show users their current skill levels versus required skills for their target roles, helping them focus their learning efforts.

### Learning Streak Tracking
Gamified progress tracking encourages daily learning habits with streak counters and achievement systems.

### Job Matching Algorithm
Advanced matching algorithm scores job listings based on user skills, preferences, and career goals to surface the most relevant opportunities.

### Personalized Roadmaps
AI generates step-by-step learning paths with specific skills, projects, certifications, and timelines tailored to each user's goals.

## 🔒 Security Features

- JWT-based authentication with secure token handling
- Password hashing with bcrypt (12 rounds)
- Rate limiting to prevent API abuse
- Input validation and sanitization
- CORS configuration for secure cross-origin requests
- Helmet.js for security headers

## 📱 Responsive Design

The platform is fully responsive with:
- Mobile-first design approach
- Breakpoints for tablet (768px) and desktop (1024px+)
- Touch-friendly interface elements
- Optimized layouts for all screen sizes

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:
```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend Deployment
The backend can be deployed to services like Heroku, Railway, or DigitalOcean:
```bash
# Set environment variables on your hosting platform
# Deploy the server directory
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- RapidAPI for job listing integrations
- Recharts for beautiful data visualizations
- Tailwind CSS for rapid UI development
- The open-source community for amazing tools and libraries