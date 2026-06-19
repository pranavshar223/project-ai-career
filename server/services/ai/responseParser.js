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
    let openChar, closeChar;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      openChar = '{'; closeChar = '}';
    } else if (firstBracket !== -1) {
      start = firstBracket;
      openChar = '['; closeChar = ']';
    }

    if (start !== -1) {
      let count = 0;
      let inString = false;
      let escapeNext = false;
      let end = -1;

      for (let i = start; i < text.length; i++) {
        const char = text[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === openChar) count++;
          else if (char === closeChar) count--;
          if (count === 0) {
            end = i;
            break;
          }
        }
      }

      if (end !== -1) {
        const jsonBlock = text.substring(start, end + 1);
        try {
          parsed = JSON.parse(jsonBlock);
        } catch (innerError) {
          throw new AppError('AI_PARSE_ERROR', 'Extracted JSON block is invalid', 500);
        }
      } else {
        throw new AppError('AI_PARSE_ERROR', 'Extracted JSON block is invalid', 500);
      }
    } else {
      throw new AppError('AI_PARSE_ERROR', 'AI returned non-JSON response', 500);
    }
  }

  return parsed;
}

function extractTextResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { parseJsonResponse, extractTextResponse };
