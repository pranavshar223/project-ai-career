require('dotenv').config()
const mongoose = require('mongoose');
const fs = require('fs');

const connectDB = require('../config/database');
const Skill = require('../models/Skill');

async function seed() {
    try {
        await connectDB();

        if (process.env.NODE_ENV === "production") {
            throw new Error("❌ Seeding not allowed in production");
        }

        const force = process.argv.includes('--force');

        const data = JSON.parse(
            fs.readFileSync("../data/seeds/skills.json", "utf-8")
        );

        if (force) {
            await Skill.deleteMany();
            console.log("⚠️ Existing skills deleted");
        }

        const ops = data.map(skill => ({
            updateOne: {
                filter: { name: skill.name },
                update: { $set: skill },
                upsert: true
            }
        }));

        await Skill.bulkWrite(ops);

        console.log("✅ Skills seeded safely");

        await mongoose.connection.close();
        process.exit(0);

    } catch (err) {
        console.error(err);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seed();