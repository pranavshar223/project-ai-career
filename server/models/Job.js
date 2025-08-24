const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    display: String
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'],
    default: 'full-time'
  },
  remote: {
    type: Boolean,
    default: false
  },
  skills: [String],
  requirements: [String],
  benefits: [String],
  applyUrl: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  postedDate: {
    type: Date,
    required: true
  },
  expiryDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  matchScores: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    factors: {
      skillMatch: Number,
      locationMatch: Number,
      experienceMatch: Number,
      salaryMatch: Number
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient searches
jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ location: 1, jobType: 1, isActive: 1 });
jobSchema.index({ postedDate: -1 });
jobSchema.index({ 'matchScores.userId': 1, 'matchScores.score': -1 });

module.exports = mongoose.model('Job', jobSchema);