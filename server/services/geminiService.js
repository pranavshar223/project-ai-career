// COMPATIBILITY WRAPPER
// This file is retained to prevent breaking existing routes (roadmaps.js, chat.js).
// It forwards all calls to the new Career Intelligence Engine architecture.
// DO NOT ADD NEW LOGIC HERE. IT WILL BE DELETED IN THE FUTURE.

const careerAgent = require('./agent/careerAgent');

class GeminiServiceWrapper {
  async generateRoadmap(careerGoal, context = {}) {
    const userId = context.userProfile?._id || context.userProfile?.id;
    return careerAgent.executeTask('generate_roadmap', { careerGoal, context, userId });
  }

  async adaptRoadmap(roadmap, triggerType, triggeredItem) {
    const userId = roadmap.userId; // roadmap is a Mongoose document
    return careerAgent.executeTask('adapt_roadmap', { roadmap, triggerType, triggeredItem, userId });
  }

  async generateResponse(userMessage, context = {}) {
    const userId = context.userProfile?._id || context.userProfile?.id;
    return careerAgent.executeTask('career_chat', { userMessage, context, userId });
  }
}

module.exports = new GeminiServiceWrapper();