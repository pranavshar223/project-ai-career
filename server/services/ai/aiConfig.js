module.exports = {
  provider: process.env.AI_PROVIDER || (process.env.OPENROUTER_API_KEY ? "openrouter" : "gemini"),
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  openRouterUrl: "https://openrouter.ai/api/v1/chat/completions",
  geminiUrl: "https://generativelanguage.googleapis.com/v1beta/models", // specific model appended later
  
  models: {
    openrouter: {
      fallback: process.env.OPENROUTER_MODEL || "openrouter/free",
      chat: process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_MODEL || "openrouter/free",
      roadmap: process.env.OPENROUTER_ROADMAP_MODEL || process.env.OPENROUTER_MODEL || "openrouter/free"
    },
    roadmap: process.env.ROADMAP_MODEL || "gemini-2.5-flash-lite",
    chat: process.env.CHAT_MODEL || "gemini-2.5-flash-lite",
    adapt: process.env.ADAPT_MODEL || "gemini-2.5-flash-lite",
    fallback: "gemini-2.5-flash-lite"
  }
};
