const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  metadata: {
    extractedSkills: [String],
    extractedGoals: [String],
    extractedTools: [String],
    extractedCertifications: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    intent: String,
    topics: [String],
    actionItems: [String],
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    experienceLevel: String,
    responseQuality: {
      type: Number,
      min: 0,
      max: 10,
      default: 7
    }
  },
  tokens: {
    input: Number,
    output: Number
  },
  feedback: {
    helpful: Boolean,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  processingTime: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['gemini-api', 'enhanced-mock', 'fallback'],
    default: 'gemini-api'
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);