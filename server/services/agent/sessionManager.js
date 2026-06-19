const logger = require('../../utils/logger');

// This uses an adapter pattern so we can plug into MongoDB/Redis later
class SessionManager {
  constructor(store) {
    // Default to an in-memory store if none provided
    this.store = store || new InMemorySessionStore();
  }

  async saveState(sessionId, state) {
    logger.debug(`Saving session state for ${sessionId}`);
    return this.store.save(sessionId, state);
  }

  async loadState(sessionId) {
    logger.debug(`Loading session state for ${sessionId}`);
    const state = await this.store.load(sessionId);
    if (!state) {
      return this.getDefaultState();
    }
    return state;
  }

  async updateState(sessionId, updates) {
    logger.debug(`Updating session state for ${sessionId}`);
    const currentState = await this.loadState(sessionId);
    const newState = { ...currentState, ...updates };
    return this.saveState(sessionId, newState);
  }

  getDefaultState() {
    return {
      currentGoal: null,
      activeRoadmapId: null,
      currentPhase: null,
      recentMessages: [],
      preferences: {}
    };
  }
}

class InMemorySessionStore {
  constructor() {
    this.sessions = new Map();
  }
  async save(sessionId, state) {
    this.sessions.set(sessionId, state);
    return state;
  }
  async load(sessionId) {
    return this.sessions.get(sessionId) || null;
  }
}

// In the future, you'd inject a MongoSessionStore here
module.exports = new SessionManager();
