const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true }
}, { timestamps: true });

assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, createdAt: -1 });
assessmentAttemptSchema.index({ assessmentId: 1, createdAt: -1 });

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
