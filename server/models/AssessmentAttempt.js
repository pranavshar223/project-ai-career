const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
