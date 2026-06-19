const axios = require('axios');
const aiConfig = require('./aiConfig');
const { getModel } = require('./modelRouter');
const { retryHandler } = require('./retryHandler');
const { parseJsonResponse, extractTextResponse } = require('./responseParser');
const AppError = require('../../utils/AppError');

async function executeApiCall(prompt, taskType, expectJson = true, userId = null) {
  return retryHandler(async () => {
    const { model, provider } = await getModel(taskType, userId);

    let result;
    if (provider === 'openrouter') {
      result = await callOpenRouter(prompt, model, expectJson);
    } else if (provider === 'gemini') {
      result = await callGemini(prompt, model, expectJson);
    } else {
      throw new AppError('AI_CONFIG_ERROR', 'No AI provider API key is set', 500);
    }
    
    // Attach the model used so we can display it in the UI
    if (expectJson && typeof result === 'object' && result !== null) {
      if (!result.metadata) result.metadata = {};
      result.metadata.usedModel = result._actualModel || model;
      delete result._actualModel;
    } else if (!expectJson && typeof result === 'string') {
      // If it's a string, we can't easily attach it without wrapping, but we expect JSON for chat.
      // We'll wrap it in an object for career_chat if needed, but career_chat uses expectJson=true.
    }
    
    return result;
  });
}

async function callOpenRouter(prompt, model, expectJson) {
  
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

  let parsed;
  if (expectJson) {
    parsed = parseJsonResponse(rawText);
  } else {
    parsed = extractTextResponse(rawText);
  }
  
  if (typeof parsed === 'object' && parsed !== null) {
    parsed._actualModel = apiResponse.data.model;
  }
  return parsed;
}

async function callGemini(prompt, model, expectJson) {
  // Replace {MODEL} in the URL template with the actual model
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
