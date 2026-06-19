const logger = require('../../utils/logger');
const AppError = require('../../utils/AppError');

async function retryHandler(fn, maxRetries = 3) {
  // Increased exponential backoff to handle free-tier rate limits: 3s, 6s, 10s
  const delays = [3000, 6000, 10000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.warn(`Attempt ${attempt + 1}/${maxRetries} failed: ${errorMessage}`);
      
      // If it's the last attempt, throw an AppError
      if (attempt === maxRetries - 1) {
        throw new AppError(
          'AI_SERVICE_ERROR',
          `Provider request failed after ${maxRetries} attempts. Last error: ${errorMessage}`,
          error.response?.status || 500
        );
      }
      
      // Wait before next attempt
      const delay = delays[attempt] || delays[delays.length - 1];
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = { retryHandler };
