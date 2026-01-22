const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// This is the crucial change
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// --- START: CORS Configuration ---
const whitelist = [
  'http://localhost:5173',
  'https://ai-career-assistant-v2.web.app',
  'https://ai-career-assistant-v2.firebaseapp.com/',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
// --- END: CORS Configuration ---

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