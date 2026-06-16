const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-career-coach';

async function migrateData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const users = await User.find({ onboardingProfile: { $exists: true } });
    console.log(`Found ${users.length} users to migrate.`);

    let migratedCount = 0;

    for (let user of users) {
      if (!user.onboardingProfile) continue;

      const obs = user.onboardingProfile;

      // 1. Move primaryGoal to careerGoals
      if (obs.primaryGoal) {
        const goalExists = user.careerGoals.some(g => g.title.toLowerCase() === obs.primaryGoal.toLowerCase());
        if (!goalExists) {
          user.careerGoals.push({
            title: obs.primaryGoal,
            description: obs.careerGoalDesc || '',
            priority: 'high',
            completed: false
          });
        }
      }

      // 2. Move knownSkills to skills (normalize)
      if (obs.knownSkills && Array.isArray(obs.knownSkills)) {
        obs.knownSkills.forEach(skillName => {
          if (!skillName) return;
          const skillExists = user.skills.some(s => s.name.toLowerCase() === skillName.toLowerCase());
          if (!skillExists) {
            user.skills.push({
              name: skillName.trim(),
              level: obs.skillLevel || 'beginner',
              category: 'general',
              verified: false
            });
          }
        });
      }

      // 3. Move preferences to profile
      if (!user.profile) user.profile = {};
      if (obs.interests) user.profile.interests = obs.interests;
      if (obs.weeklyTime) user.profile.weeklyTime = parseInt(obs.weeklyTime.replace(/\D/g, '')) || 0; // rough extraction of hours
      if (obs.learningStyle) user.profile.learningStyle = obs.learningStyle;
      if (obs.careerConfidence) user.profile.confidenceLevel = obs.careerConfidence;
      
      // 4. Role
      if (obs.userType && !user.role) {
         user.role = obs.userType.toLowerCase();
      }

      // Set version
      user.onboardingVersion = 1;

      // Unset onboardingProfile
      user.onboardingProfile = undefined;

      await user.save();
      migratedCount++;
    }

    console.log(`Successfully migrated ${migratedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
