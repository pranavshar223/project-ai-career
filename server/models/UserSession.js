const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: {
    type: Number,
    default: 0
  },
  messageCount: {
    type: Number,
    default: 0
  },
  topics: [String],
  intents: [String],
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  goals: [String],
  skillsDiscussed: [String],
  actionItemsGenerated: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String
  },
  location: {
    country: String,
    city: String,
    timezone: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSessionSchema.index({ userId: 1, startTime: -1 });
userSessionSchema.index({ sessionId: 1 });
userSessionSchema.index({ isActive: 1, startTime: -1 });

// Calculate session duration before saving
userSessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / 1000); // Duration in seconds
  }
  next();
});

module.exports = mongoose.model('UserSession', userSessionSchema);