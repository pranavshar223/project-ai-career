const connectDB = require('../config/database')
const path=require('path')
const fs = require('fs')
const Skill = require('../models/Skill')

async function seed() {
    try {
        connectDB();
        const dataPath=path.join(__dirname,'../../data/seeds/skills/json');
        const data = JSON.parse(
            fs.readFileSync(dataPath, "utf-8")
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