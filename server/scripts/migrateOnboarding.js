const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-career-coach';

const roleMap = {
  'school student': 'student',
  'college student': 'student',
  'recent graduate': 'student',
  'working professional': 'professional',
  'career switcher': 'career_switcher',
  'freelancer': 'professional',
  'entrepreneur': 'professional'
};

const confidenceMap = {
  'completely lost': 'low',
  'somewhat confused': 'low',
  'have basic direction': 'medium',
  'mostly clear': 'high',
  'very clear': 'high'
};

const learningStyleMap = {
  'video tutorials': 'visual',
  'reading articles': 'reading',
  'documentation': 'reading',
  'hands-on projects': 'project_based',
  'mentor guidance': 'interactive',
  'community learning': 'interactive'
};

async function migrateData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const users = await User.find({ 
      $or: [
        { onboardingProfile: { $exists: true } },
        { background: { $exists: true } }
      ]
    });
    console.log(`Found ${users.length} users to migrate.`);

    let migratedCount = 0;

    for (let user of users) {
      let isModified = false;

      // Migrate from onboardingProfile if it exists
      if (user.onboardingProfile) {
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
            isModified = true;
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
              isModified = true;
            }
          });
        }

        // 3. Move preferences to profile
        if (!user.profile) user.profile = {};
        
        if (obs.interests) { user.profile.interests = obs.interests; isModified = true; }
        
        if (obs.learningStyle) {
          const mappedStyle = learningStyleMap[obs.learningStyle.toLowerCase()];
          if (mappedStyle) user.profile.learningStyle = mappedStyle;
          isModified = true;
        }
        
        if (obs.careerConfidence) {
          const mappedConfidence = confidenceMap[obs.careerConfidence.toLowerCase()];
          if (mappedConfidence) user.profile.confidenceLevel = mappedConfidence;
          isModified = true;
        }

        if (obs.institution) { user.profile.institution = obs.institution; isModified = true; }
        if (obs.graduationYear) { user.profile.graduationYear = parseInt(obs.graduationYear) || undefined; isModified = true; }
        if (obs.challenges) { user.profile.challenges = obs.challenges; isModified = true; }

        if (obs.weeklyTime) {
          const lowerTime = String(obs.weeklyTime).toLowerCase();
          if (lowerTime.includes('less than')) {
            user.profile.weeklyTime = 4;
          } else if (lowerTime.includes('more than')) {
            user.profile.weeklyTime = 40;
          } else {
            const match = lowerTime.match(/(\d+)\s*-\s*(\d+)/);
            if (match) {
              user.profile.weeklyTime = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
            } else {
              user.profile.weeklyTime = parseInt(lowerTime.replace(/\D/g, '')) || 0;
            }
          }
          isModified = true;
        }

        // Preferences
        if (!user.preferences) user.preferences = {};
        if (obs.preferredCompanyTypes) { user.preferences.preferredCompanyTypes = obs.preferredCompanyTypes; isModified = true; }
        if (obs.dreamCompanies) { user.preferences.dreamCompanies = obs.dreamCompanies; isModified = true; }

        // 4. Role
        if (obs.userType && (!user.role || user.role === 'professional')) {
           const mappedRole = roleMap[obs.userType.toLowerCase()];
           if (mappedRole) user.role = mappedRole;
           isModified = true;
        }
        
        // 5. Mark as completed
        user.onboardingCompleted = true;
        user.onboardingVersion = 2; // bumped version after migration
        isModified = true;
      }

      // If user had legacy `background` but no onboardingProfile, migrate it to `role`
      if (user.background && !user.role) {
        user.role = user.background === 'student' ? 'student' : 'professional';
        isModified = true;
      }

      if (isModified) {
        await user.save();
      }

      // Unset legacy fields using a direct update query
      await User.updateOne(
        { _id: user._id },
        { $unset: { onboardingProfile: 1, background: 1 } }
      );

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
