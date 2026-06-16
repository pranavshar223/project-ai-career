const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
