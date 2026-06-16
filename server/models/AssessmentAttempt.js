const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: true,
    index: true
  },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedAnswer: String,
    correct: Boolean
  }]
}, {
  timestamps: true
});

assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, createdAt: -1 });
assessmentAttemptSchema.index({ assessmentId: 1, createdAt: -1 });

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
