const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'AI Career Assistant API Server' });
});

// Auth routes placeholder
app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Registration endpoint' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});