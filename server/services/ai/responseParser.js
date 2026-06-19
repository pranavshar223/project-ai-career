const AppError = require('../../utils/AppError');

function parseJsonResponse(rawText) {
  if (!rawText) {
    throw new AppError('AI_PARSE_ERROR', 'Empty response from AI', 500);
  }

  // Try direct parse first
  try {
    return JSON.parse(rawText.trim());
  } catch {
    // Try extracting JSON block from text
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        throw new AppError('AI_PARSE_ERROR', 'Extracted JSON block is invalid', 500);
      }
    }
    throw new AppError('AI_PARSE_ERROR', 'AI returned non-JSON response', 500);
  }
}

function extractTextResponse(rawText) {
  return rawText ? rawText.replace(/\n{3,}/g, '\n\n').trim() : '';
}

module.exports = { parseJsonResponse, extractTextResponse };
