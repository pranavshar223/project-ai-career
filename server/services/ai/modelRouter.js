const aiConfig = require('./aiConfig');
const logger = require('../../utils/logger');

function getModel(taskType) {
  if (aiConfig.provider === 'openrouter') {
    switch (taskType) {
      case 'career_chat':
        return aiConfig.models.openrouter.chat;
      case 'generate_roadmap':
        return aiConfig.models.openrouter.roadmap;
      default:
        return aiConfig.models.openrouter.fallback;
    }
  }

  // Gemini specific routing
  switch(taskType) {
    case 'generate_roadmap':
      return aiConfig.models.roadmap;
    case 'adapt_roadmap':
      return aiConfig.models.adapt;
    case 'career_chat':
      return aiConfig.models.chat;
    default:
      logger.warn(`Unknown taskType '${taskType}' in modelRouter, using fallback model`);
      return aiConfig.models.fallback;
  }
}

module.exports = { getModel };
