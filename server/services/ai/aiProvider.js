const axios = require('axios');
const aiConfig = require('./aiConfig');
const { getModel } = require('./modelRouter');
const { retryHandler } = require('./retryHandler');
const { parseJsonResponse, extractTextResponse } = require('./responseParser');
const AppError = require('../../utils/AppError');

async function executeApiCall(prompt, taskType, expectJson = true) {
  return retryHandler(async () => {
    if (aiConfig.provider === 'openrouter') {
      return callOpenRouter(prompt, taskType, expectJson);
    } else if (aiConfig.provider === 'gemini') {
      return callGemini(prompt, taskType, expectJson);
    } else {
      throw new AppError('AI_CONFIG_ERROR', 'No AI provider API key is set', 500);
    }
  });
}

async function callOpenRouter(prompt, taskType, expectJson) {
  const model = getModel(taskType);
  
  const apiResponse = await axios.post(
    aiConfig.openRouterUrl,
    {
      model: model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096
    },
    {
      headers: { 
        'Authorization': `Bearer ${aiConfig.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'Arohan.ai'
      },
      timeout: 60000
    }
  );

  const rawText = apiResponse.data.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response from OpenRouter API');

  if (expectJson) {
    return parseJsonResponse(rawText);
  }
  return extractTextResponse(rawText);
}

async function callGemini(prompt, taskType, expectJson) {
  // Replace {MODEL} in the URL template with the actual model
  const model = getModel(taskType);
  // Remove "models/" if it's prepended, the URL format might vary. Assuming model is "gemini-2.5-flash-lite".
  const url = `${aiConfig.geminiUrl.replace('{MODEL}', model)}/${model}:generateContent?key=${aiConfig.geminiApiKey}`;

  const apiResponse = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        candidateCount: 1,
        ...(expectJson && { responseMimeType: "application/json" })
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ]
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000
    }
  );

  const rawText = apiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  if (expectJson) {
    return parseJsonResponse(rawText);
  }
  return extractTextResponse(rawText);
}

module.exports = { executeApiCall };
