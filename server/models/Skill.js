const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        enum: [
            "Programming",
            "Frontend",
            "Backend",
            "CS Fundamentals",
            "AI/ML",
            "DevOps",
            "Cloud",
            "Databases",
        ],
    },
    description: {
        type: String,
        default: "",
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("Skill", skillSchema);