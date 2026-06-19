// Centralized Registry of Supported Models
// This serves as the single source of truth for the AI Configuration Center frontend.

const modelRegistry = [
  {
    id: "openrouter/free",
    name: "OpenRouter Auto (Free)",
    provider: "OpenRouter",
    tier: "free",
    reasoning: 7,
    speed: 10,
    structuredOutput: 6,
    recommendedFor: ["career_chat"],
    badges: ["Fast"]
  },
  {
    id: "google/gemma-2-9b-it:free",
    name: "Gemma 2 9B",
    provider: "OpenRouter",
    tier: "free",
    reasoning: 8,
    speed: 8,
    structuredOutput: 8,
    recommendedFor: ["career_chat", "skill_gap"],
    badges: []
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B",
    provider: "OpenRouter",
    tier: "free",
    reasoning: 10,
    speed: 6,
    structuredOutput: 10,
    recommendedFor: ["generate_roadmap", "resume_review", "skill_gap"],
    badges: ["High Reasoning", "Structured Output"]
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1",
    provider: "OpenRouter",
    tier: "free",
    reasoning: 10,
    speed: 5,
    structuredOutput: 9,
    recommendedFor: ["interview", "resume_review"],
    badges: ["High Reasoning"]
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    provider: "OpenRouter",
    tier: "free",
    reasoning: 9,
    speed: 6,
    structuredOutput: 9,
    recommendedFor: ["generate_roadmap", "adapt_roadmap"],
    badges: ["High Reasoning"]
  },
  // Gemini Native Models
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "Google",
    tier: "free",
    reasoning: 8,
    speed: 10,
    structuredOutput: 8,
    recommendedFor: ["career_chat", "adapt_roadmap"],
    badges: ["Fast", "Native"]
  },
  {
    id: "gemini-2.0-pro",
    name: "Gemini 2.0 Pro",
    provider: "Google",
    tier: "premium",
    reasoning: 10,
    speed: 7,
    structuredOutput: 10,
    recommendedFor: ["generate_roadmap", "resume_review", "interview"],
    badges: ["High Reasoning", "Structured Output", "Native"]
  }
];

// Fallback logic
function getFallbackModel(taskType, provider = 'openrouter') {
  if (provider === 'gemini') {
    return taskType === 'generate_roadmap' ? 'gemini-2.0-pro' : 'gemini-2.5-flash-lite';
  }
  
  switch(taskType) {
    case 'generate_roadmap':
    case 'resume_review':
      return 'google/gemma-4-31b-it:free';
    case 'career_chat':
      return 'openrouter/free';
    case 'interview':
      return 'deepseek/deepseek-r1:free';
    default:
      return 'google/gemma-2-9b-it:free';
  }
}

// Preset configurations
const presets = {
  balanced: {
    career_chat: "gemini-2.5-flash-lite",
    generate_roadmap: "google/gemma-4-31b-it:free",
    adapt_roadmap: "gemini-2.5-flash-lite",
    skill_gap: "google/gemma-2-9b-it:free",
    resume_review: "google/gemma-4-31b-it:free",
    interview: "deepseek/deepseek-r1:free"
  },
  speed: {
    career_chat: "openrouter/free",
    generate_roadmap: "gemini-2.5-flash-lite",
    adapt_roadmap: "openrouter/free",
    skill_gap: "openrouter/free",
    resume_review: "gemini-2.5-flash-lite",
    interview: "openrouter/free"
  },
  intelligence: {
    career_chat: "google/gemma-4-31b-it:free",
    generate_roadmap: "meta-llama/llama-3.3-70b-instruct:free",
    adapt_roadmap: "meta-llama/llama-3.3-70b-instruct:free",
    skill_gap: "google/gemma-4-31b-it:free",
    resume_review: "google/gemma-4-31b-it:free",
    interview: "deepseek/deepseek-r1:free"
  }
};

module.exports = {
  modelRegistry,
  getFallbackModel,
  presets
};
