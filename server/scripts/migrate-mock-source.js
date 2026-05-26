const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
require('dotenv').config({ path: '../.env' }); // Adjust if env is located elsewhere

/**
 * Run this script to backfill/migrate any existing ChatMessage records
 * that have `source: 'enhanced-mock'` to `source: 'mock'`.
 * 
 * Usage: node server/scripts/migrate-mock-source.js
 */
async function migrateMockSource() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-career-tech';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const result = await ChatMessage.updateMany(
      { source: 'enhanced-mock' },
      { $set: { source: 'mock' } }
    );

    console.log(`Migration complete. Modified ${result.modifiedCount} documents.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateMockSource();
