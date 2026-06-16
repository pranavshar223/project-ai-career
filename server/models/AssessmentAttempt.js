const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    index: true
  },
  score: Number,
  passed: Boolean,
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedAnswer: String,
    correct: Boolean
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
