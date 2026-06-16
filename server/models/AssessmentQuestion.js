const mongoose = require('mongoose');

const assessmentQuestionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }
}, { timestamps: true });

assessmentQuestionSchema.index({ assessmentId: 1, createdAt: 1 });

module.exports = mongoose.model('AssessmentQuestion', assessmentQuestionSchema);
