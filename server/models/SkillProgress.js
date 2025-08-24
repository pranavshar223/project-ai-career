const mongoose = require('mongoose');

const skillProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  targetLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  learningResources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['course', 'article', 'video', 'book', 'documentation', 'practice']
    },
    completed: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  }],
  milestones: [{
    title: String,
    description: String,
    targetDate: Date,
    completedDate: Date,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  practiceProjects: [{
    name: String,
    description: String,
    githubUrl: String,
    liveUrl: String,
    technologies: [String],
    completed: {
      type: Boolean,
      default: false
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    }
  }],
  assessments: [{
    type: {
      type: String,
      enum: ['self-assessment', 'quiz', 'project-review', 'peer-review']
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  timeSpent: {
    total: {
      type: Number,
      default: 0
    },
    thisWeek: {
      type: Number,
      default: 0
    },
    thisMonth: {
      type: Number,
      default: 0
    }
  },
  lastPracticed: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user skill queries
skillProgressSchema.index({ userId: 1, skillName: 1 }, { unique: true });
skillProgressSchema.index({ userId: 1, category: 1 });
skillProgressSchema.index({ userId: 1, currentLevel: 1 });

module.exports = mongoose.model('SkillProgress', skillProgressSchema);