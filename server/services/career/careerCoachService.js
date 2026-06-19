const { executeApiCall } = require('../ai/aiProvider');
const { buildCareerCoachPrompt } = require('../ai/promptBuilder');
const logger = require('../../utils/logger');

class CareerCoachService {
  async execute(payload) {
    const { userMessage, context } = payload;
    
    const prompt = buildCareerCoachPrompt(userMessage, context);

    try {
      logger.info(`Generating chat response for message: ${userMessage.substring(0, 30)}...`);
      const data = await executeApiCall(prompt, 'career_chat', true);
      return {
        content: this.formatResponse(data.advice || data),
        metadata: this.sanitizeMetadata(data.metadata),
        source: 'ai-coach'
      };
    } catch (error) {
      logger.error('Chat response failed:', error);
      return this.generateEnhancedMockResponse(userMessage, context);
    }
  }

  formatResponse(response) {
    if (typeof response !== 'string') return JSON.stringify(response);
    return response.replace(/\n{3,}/g, '\n\n').trim();
  }

  sanitizeMetadata(metadata) {
    if (!metadata) return {};
    const validSentiments = ['positive', 'neutral', 'negative'];
    let sentiment = metadata.sentiment?.toLowerCase();
    if (!validSentiments.includes(sentiment)) {
      sentiment = 'neutral';
    }
    return { ...metadata, sentiment };
  }

  detectIntent(message) {
    const m = message.toLowerCase();
    if (m.includes('roadmap') || m.includes('learning path') || m.includes('career plan') || m.includes('study plan')) return 'roadmap_request';
    if (m.includes('job') || m.includes('career opportunity')) return 'job_search';
    if (m.includes('skill') || m.includes('learn')) return 'skill_development';
    if (m.includes('interview')) return 'interview_prep';
    return 'general';
  }

  generateEnhancedMockResponse(userMessage, context) {
    return {
      content: `I'm here to help with your career! Could you tell me more about your goals so I can provide personalized guidance?`,
      metadata: { intent: this.detectIntent(userMessage) },
      source: 'mock'
    };
  }
}

module.exports = new CareerCoachService();
