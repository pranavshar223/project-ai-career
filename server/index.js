const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// This is the crucial change
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Validate essential environment variables at boot
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not configured.');
  process.exit(1);
}

// Trust proxy for express-rate-limit when deployed behind reverse proxies
app.set('trust proxy', 1);

// Connect to database
connectDB();

// --- START: CORS Configuration ---
const whitelist = [
  'http://localhost:5173',
  'https://ai-career-assistant-v2.web.app',
  'https://ai-career-assistant-v2.firebaseapp.com/',
];

if (process.env.ALLOWED_ORIGINS) {
  const rawOrigins = process.env.ALLOWED_ORIGINS.split(',');

  const envOrigins = rawOrigins
    .map(o => o.trim())
    // drop empty entries
    .filter(Boolean)
    // normalize trailing slash so it matches the Origin header
    .map(origin => (origin.endsWith('/') ? origin.slice(0, -1) : origin))
    // validate and filter out invalid / insecure values
    .filter(origin => {
      if (origin === '*') {
        console.warn('Ignoring insecure CORS origin "*" from ALLOWED_ORIGINS');
        return false;
      }

      // Basic origin format check: scheme://host[:port]
      const isValidOrigin = /^https?:\/\/[^/\s]+(:\d+)?$/.test(origin);
      if (!isValidOrigin) {
        console.warn(`Ignoring invalid CORS origin from ALLOWED_ORIGINS: "${origin}"`);
      }

      return isValidOrigin;
    });

  // Add to whitelist, avoiding duplicates
  envOrigins.forEach(origin => {
    if (!whitelist.includes(origin)) {
      whitelist.push(origin);
    }
  });
}

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

// --- START: Security Middleware ---
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);
// --- END: Security Middleware ---

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
app.use('/api/ai-config', require('./routes/aiConfig'));

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});