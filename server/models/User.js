const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  background: {
    type: String,
    enum: ['student', 'professional'],
    required: [true, 'Background is required']
  },
  profile: {
    bio: String,
    location: String,
    website: String,
    experience: {
      type: String,
      enum: ['0-1 years', '2 years', '3-5 years', '5+ years'],
      default: '0-1 years'
    },
    avatar: String
  },
  skills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    category: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  careerGoals: [{
    title: String,
    description: String,
    targetDate: Date,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  preferences: {
    jobLocation: String,
    salaryRange: {
      min: Number,
      max: Number
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      default: 'full-time'
    },
    remoteWork: {
      type: Boolean,
      default: true
    }
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivity: Date,
    completedDays: [Date],
    weeklyGoal: {
      type: Number,
      default: 5
    },
    monthlyGoal: {
      type: Number,
      default: 20
    }
  },
  analytics: {
    totalChatMessages: {
      type: Number,
      default: 0
    },
    totalSkillsLearned: {
      type: Number,
      default: 0
    },
    totalRoadmapsCompleted: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    lastActiveDate: Date,
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  aiInteractions: {
    totalQueries: {
      type: Number,
      default: 0
    },
    favoriteTopics: [String],
    commonIntents: [{
      intent: String,
      count: Number
    }],
    satisfactionRatings: [{
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      feedback: String,
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  savedJobs: [{
    jobId: String,
    source: String,
    savedAt: {
      type: Date,
      default: Date.now
    },
    notes: String,
    status: {
      type: String,
      enum: ['saved', 'applied', 'interviewing', 'rejected', 'offered'],
      default: 'saved'
    }
  }],
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    },
    jobAlerts: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update streak method
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActivity = this.streak.lastActivity;
  
  if (!lastActivity) {
    // First activity
    this.streak.current = 1;
    this.streak.longest = 1;
    this.streak.lastActivity = today;
    this.streak.completedDays.push(today);
  } else {
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.streak.current += 1;
      if (this.streak.current > this.streak.longest) {
        this.streak.longest = this.streak.current;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      this.streak.current = 1;
    }
    // If daysDiff === 0, same day activity, don't update streak
    
    if (daysDiff >= 1) {
      this.streak.lastActivity = today;
      this.streak.completedDays.push(today);
    }
  }
};

module.exports = mongoose.model('User', userSchema);