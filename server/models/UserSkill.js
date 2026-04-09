const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true,
    },
    proficiencyLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: true,
    }
}, {
    timestamps: true
});

// prevent duplicates
userSkillSchema.index({ userId: 1, skillId: 1 }, { unique: true });

// performance indexes
userSkillSchema.index({ userId: 1 });
userSkillSchema.index({ skillId: 1 });

module.exports = mongoose.model("UserSkill", userSkillSchema);