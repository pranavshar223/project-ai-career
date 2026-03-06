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

  // --- PHASE & WEEK STRUCTURE ---
  phase: {
    type: String,
    enum: ['foundation', 'development', 'advanced', 'professional'],
    default: 'foundation'
  },
  weekNumber: {
    type: Number,
    default: 1
  },

  // --- SCHEDULING (needed for missed task detection) ---
  dueDate: {
    type: Date,
    default: null
  },
  scheduledStartDate: {
    type: Date,
    default: null
  },

  // --- STATUS (replaces simple boolean) ---
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'missed', 'skipped'],
    default: 'pending'
  },

  // Keep completed + completedAt for backward compat
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  missedAt: Date,

  // --- DEPENDENCY (for "next task related to completed task") ---
  dependsOn: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  // --- AI ADAPTATION TRACKING ---
  isAdapted: {
    type: Boolean,
    default: false
  },
  adaptedReason: {
    type: String,
    enum: ['missed_previous', 'completed_early', 'user_request', 'skill_gap', null],
    default: null
  },
  originalOrder: Number,

  duration: String,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
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
    completed: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    missed: { type: Number, default: 0 }
  },

  // Track last time AI adapted this roadmap
  lastAdaptedAt: {
    type: Date,
    default: null
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

// Auto-calculate progress + detect missed tasks before saving
roadmapSchema.pre('save', function (next) {
  const now = new Date();

  // Auto-mark items as missed if dueDate passed and not completed
  this.items.forEach(item => {
    if (
      item.dueDate &&
      item.dueDate < now &&
      item.status === 'pending' &&
      !item.completed
    ) {
      item.status = 'missed';
      item.missedAt = now;
    }
  });

  const completed = this.items.filter(i => i.completed).length;
  const missed = this.items.filter(i => i.status === 'missed').length;
  const total = this.items.length;

  this.progress.completed = completed;
  this.progress.total = total;
  this.progress.missed = missed;
  this.progress.percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  this.lastUpdated = now;

  next();
});

module.exports = mongoose.model('Roadmap', roadmapSchema);