const { executeApiCall } = require('../ai/aiProvider');
const { buildAdaptRoadmapPrompt } = require('../ai/promptBuilder');
const logger = require('../../utils/logger');
const AppError = require('../../utils/AppError');

class RoadmapAdapter {
  async execute(payload) {
    const { roadmap, triggerType, triggeredItem, userId } = payload;

    const completedItems = roadmap.items.filter(i => i.completed);
    const missedItems = roadmap.items.filter(i => i.status === 'missed');
    const pendingItems = roadmap.items.filter(i => i.status === 'pending' && !i.completed);

    const prompt = buildAdaptRoadmapPrompt(
      roadmap, triggerType, triggeredItem, 
      completedItems, missedItems, pendingItems
    );

    try {
      logger.info(`Adapting roadmap for trigger: ${triggerType}`);
      const data = await executeApiCall(prompt, 'adapt_roadmap', true, userId);
      return data; // Returns the raw adaptation JSON
    } catch (error) {
      logger.error('AI roadmap adaptation failed:', error);
      throw new AppError('ROADMAP_ADAPTATION_FAILED', `AI adaptation failed: ${error.message}`, 500);
    }
  }
}

module.exports = new RoadmapAdapter();
