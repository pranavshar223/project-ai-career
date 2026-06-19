const taskRegistry = require('./taskRegistry');
const intentClassifier = require('./intentClassifier');
const sessionManager = require('./sessionManager');
const logger = require('../../utils/logger');
const AppError = require('../../utils/AppError');

class CareerAgent {
  async executeTask(taskType, payload) {
    logger.info(`CareerAgent executing task: ${taskType}`);
    
    const service = taskRegistry[taskType];
    
    if (!service) {
      throw new AppError('UNKNOWN_TASK_TYPE', `No service registered for task type: ${taskType}`, 400);
    }

    try {
      // Future: load session state if sessionId is provided in payload
      // const state = payload.sessionId ? await sessionManager.loadState(payload.sessionId) : {};
      
      const result = await service.execute(payload);
      
      // Future: update session state based on result
      // if (payload.sessionId) await sessionManager.updateState(payload.sessionId, { ... });
      
      return result;
    } catch (error) {
      logger.error(`Error in CareerAgent executing ${taskType}:`, error);
      throw error; // Let the Express error handler catch it
    }
  }

  // Example of how the intent classifier will be used later when the frontend just sends a "message"
  async handleMessage(message, sessionId) {
    const intent = intentClassifier.classify(message);
    // Based on intent.taskType, it could invoke executeTask...
    return intent;
  }
}

module.exports = new CareerAgent();
