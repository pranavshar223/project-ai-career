const AppError = require('../../utils/AppError');

function parseJsonResponse(rawText) {
  if (!rawText) {
    throw new AppError('AI_PARSE_ERROR', 'Empty response from AI', 500);
  }

  let text = rawText.trim();

  // 1. Remove <think>...</think> blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // 2. Remove markdown json fences
  text = text.replace(/```json/gi, '');
  text = text.replace(/```/g, '');
  text = text.trim();

  let parsed = null;

  // Try direct parse first
  try {
    parsed = JSON.parse(text);
  } catch {
    // If direct parse fails, try to extract the JSON object or array
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let start = -1;
    let end = -1;

    // Find the outermost valid JSON structure
    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = lastBrace;
    } else if (firstBracket !== -1 && lastBracket !== -1) {
      start = firstBracket;
      end = lastBracket;
    }

    if (start !== -1 && end !== -1 && end > start) {
      const jsonBlock = text.substring(start, end + 1);
      try {
        parsed = JSON.parse(jsonBlock);
      } catch (innerError) {
        throw new AppError('AI_PARSE_ERROR', 'Extracted JSON block is invalid', 500);
      }
    } else {
      throw new AppError('AI_PARSE_ERROR', 'AI returned non-JSON response', 500);
    }
  }

  // Handle Array-Based Responses
  if (Array.isArray(parsed)) {
    parsed = parsed[0] || {};
  }

  return parsed;
}

function extractTextResponse(rawText) {
  let text = rawText ? rawText.trim() : '';
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { parseJsonResponse, extractTextResponse };
