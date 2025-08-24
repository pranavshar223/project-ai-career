const mongoose = require('mongoose');

const roadmapItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['skill', 'project', 'certification', 'course'],
    required: true
  },
  duration: String,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  order: {
    type: Number,
    required: true
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['course', 'article', 'video', 'book', 'documentation']
    }
  }],
  skills: [String],
  estimatedHours: Number
});

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  careerGoal: {
    type: String,
    required: true
  },
  targetRole: String,
  items: [roadmapItemSchema],
  totalEstimatedDuration: String,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  progress: {
    completed: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  generatedBy: {
    type: String,
    default: 'ai'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate progress before saving
roadmapSchema.pre('save', function(next) {
  const completed = this.items.filter(item => item.completed).length;
  const total = this.items.length;
  
  this.progress.completed = completed;
  this.progress.total = total;
  this.progress.percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  this.lastUpdated = new Date();
  
  next();
});

module.exports = mongoose.model('Roadmap', roadmapSchema);