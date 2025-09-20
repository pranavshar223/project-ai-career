const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// --- START: CORS Configuration ---
// List of trusted URLs
const whitelist = [
  'http://localhost:5173',                         // For your local development
  'https://ai-career-assistant-9e871.web.app',      // Your live Firebase URL
  'https://ai-career-assistant-9e871.firebaseapp.com' // Alternative Firebase URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Use the configured CORS options
app.use(cors(corsOptions));
// --- END: CORS Configuration ---


// Other Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'AI Career Assistant API Server' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/roadmaps', require('./routes/roadmaps'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/analytics', require('./routes/analytics'));

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});