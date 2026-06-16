const mongoose = require('mongoose');

const assessmentQuestionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentQuestion', assessmentQuestionSchema);
