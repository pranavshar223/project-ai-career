const connectDB = require('../config/database')
const fs = require('fs')
const Skill = require('../models/Skill')

async function seed() {
    try {
        connectDB();
        const data = JSON.parse(
            fs.readFileSync("./data/seeds/skills.json", "utf-8")
        );

        await Skill.deleteMany(); // optional
        await Skill.insertMany(data);

        console.log("✅ Skills seeded");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();