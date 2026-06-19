const aiConfig = require('./aiConfig');
const { getFallbackModel, modelRegistry } = require('./modelRegistry');
const AISettings = require('../../models/AISettings');
const logger = require('../../utils/logger');

async function getModel(taskType, userId) {
  let provider = aiConfig.provider;
  let model = null;

  if (userId) {
    try {
      const settings = await AISettings.findOne({ user: userId });
      if (settings) {
        if (settings.activeProvider && settings.activeProvider !== 'system_default') {
          provider = settings.activeProvider;
        }
        if (settings.taskModels && settings.taskModels[taskType]) {
          model = settings.taskModels[taskType];
        }
      }
    } catch (err) {
      logger.error('Failed to fetch AI Settings:', err);
    }
  }

  if (!model) {
    model = getFallbackModel(taskType, provider);
  }

  // Ensure the provider matches the model's actual provider
  const modelDef = modelRegistry.find(m => m.id === model);
  if (modelDef) {
    provider = modelDef.provider.toLowerCase() === 'google' ? 'gemini' : 'openrouter';
  }

  return { model, provider };
}

module.exports = { getModel };
