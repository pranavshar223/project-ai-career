// COMPATIBILITY WRAPPER
// This file is retained to prevent breaking existing routes (roadmaps.js, chat.js).
// It forwards all calls to the new Career Intelligence Engine architecture.
// DO NOT ADD NEW LOGIC HERE. IT WILL BE DELETED IN THE FUTURE.

const careerAgent = require('./agent/careerAgent');

class GeminiServiceWrapper {
  async generateRoadmap(careerGoal, context = {}) {
    return careerAgent.executeTask('generate_roadmap', { careerGoal, context });
  }

  async adaptRoadmap(roadmap, triggerType, triggeredItem) {
    return careerAgent.executeTask('adapt_roadmap', { roadmap, triggerType, triggeredItem });
  }

  async generateResponse(userMessage, context = {}) {
    return careerAgent.executeTask('career_chat', { userMessage, context });
  }
}

module.exports = new GeminiServiceWrapper();