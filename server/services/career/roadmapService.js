const { executeApiCall } = require('../ai/aiProvider');
const { buildRoadmapPrompt } = require('../ai/promptBuilder');
const { validateAndNormalizeRoadmap } = require('./roadmapValidator');
const logger = require('../../utils/logger');
const AppError = require('../../utils/AppError');

class RoadmapService {
  async execute(payload) {
    const { careerGoal, context } = payload;
    const { userProfile = {}, targetRole, timeframe = '6-months' } = context || {};

    const userSkills = userProfile.skills?.map(s => `${s.name} (${s.level})`).join(', ') || 'None';
    const background = userProfile.role || 'Not specified';
    const experience = userProfile.profile?.experience || 'intermediate';
    
    const prof = userProfile.profile || {};
    const learningStyle = prof.learningStyle || 'mixed';
    const timeCommitment = prof.weeklyTime ? `${prof.weeklyTime} hours/week` : '10 hours/week';
    const confidenceLevel = prof.confidenceLevel || 'Not specified';
    const challenges = prof.challenges?.join(', ') || 'None specified';
    const education = prof.institution ? `${prof.institution} (Class of ${prof.graduationYear || 'Unknown'})` : 'Not specified';
    
    const prefs = userProfile.preferences || {};
    const companies = prefs.dreamCompanies || prefs.preferredCompanyTypes?.join(', ') || 'Not specified';
    
    const goalsList = userProfile.careerGoals?.map(g => `${g.title}: ${g.description}`).join(' | ') || careerGoal;
    const finalGoal = goalsList || careerGoal;

    const weeksMap = { '3-months': 12, '6-months': 24, '1-year': 48, '2-years': 96 };
    const totalWeeks = weeksMap[timeframe] || 24;

    const prompt = buildRoadmapPrompt(
      finalGoal, targetRole, background, education, experience, 
      userSkills, learningStyle, confidenceLevel, challenges, 
      companies, timeCommitment, timeframe, totalWeeks
    );

    try {
      logger.info(`Generating roadmap for goal: ${finalGoal}`);
      const data = await executeApiCall(prompt, 'generate_roadmap', true);
      return validateAndNormalizeRoadmap(data, finalGoal, totalWeeks);
    } catch (error) {
      logger.error('AI roadmap generation failed:', error);
      throw new AppError('ROADMAP_GENERATION_FAILED', `AI roadmap generation failed: ${error.message}`, 500);
    }
  }
}

module.exports = new RoadmapService();
