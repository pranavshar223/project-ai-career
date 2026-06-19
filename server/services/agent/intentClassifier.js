const logger = require('../../utils/logger');

class IntentClassifier {
  classify(message) {
    const m = message.toLowerCase();
    logger.debug(`Classifying intent for message: ${m.substring(0, 50)}...`);
    
    // In the future, this could be an AI call or a more advanced NLP model.
    // For now, it's basic keyword detection.
    
    if (m.includes('roadmap') || m.includes('learning path') || m.includes('career plan') || m.includes('study plan')) {
      return { taskType: 'roadmap_request', confidence: 0.8 };
    }
    if (m.includes('job') || m.includes('career opportunity') || m.includes('apply')) {
      return { taskType: 'job_search', confidence: 0.7 };
    }
    if (m.includes('skill') || m.includes('learn')) {
      return { taskType: 'skill_development', confidence: 0.7 };
    }
    if (m.includes('interview')) {
      return { taskType: 'interview_prep', confidence: 0.9 };
    }
    if (m.includes('resume') || m.includes('cv')) {
      return { taskType: 'resume_review', confidence: 0.9 };
    }
    
    return { taskType: 'general', confidence: 0.5 };
  }
}

module.exports = new IntentClassifier();
