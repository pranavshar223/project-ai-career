const mongoose = require('mongoose');

const aiSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  activeProvider: {
    type: String,
    enum: ['openrouter', 'gemini', 'system_default'],
    default: 'system_default'
  },
  taskModels: {
    career_chat: { type: String, default: null },
    generate_roadmap: { type: String, default: null },
    adapt_roadmap: { type: String, default: null },
    skill_gap: { type: String, default: null },
    resume_review: { type: String, default: null },
    interview: { type: String, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('AISettings', aiSettingsSchema);
