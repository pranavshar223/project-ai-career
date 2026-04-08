const axios = require("axios");

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  // CORE: Call Gemini API with any prompt, returns parsed JSON
  // Now accepts maxOutputTokens as third parameter (default 4096)
  async callGemini(prompt, expectJson = true, maxOutputTokens = 4096) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const apiResponse = await axios.post(
          `${this.apiUrl}?key=${this.apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: maxOutputTokens,
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

        if (!expectJson) return rawText.trim();

        // Try direct parse first
        try {
          return JSON.parse(rawText);
        } catch {
          // Try extracting JSON block from text
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error('Gemini returned non-JSON response');
        }

      } catch (error) {
        console.error(`Gemini attempt ${attempt} failed:`, error.message || error);
        if (attempt === this.maxRetries) throw error;
        await new Promise(r => setTimeout(r, this.retryDelay * Math.pow(2, attempt - 1)));
      }
    }
  }

  // 1. GENERATE ROADMAP — Full structured roadmap from user goals
  async generateRoadmap(careerGoal, context = {}) {
    const { userProfile = {}, targetRole, timeframe = '6-months' } = context;

    const userSkills = userProfile.skills?.map(s => `${s.name} (${s.level})`).join(', ') || 'None';
    const background = userProfile.background || 'Not specified';
    const experience = userProfile.profile?.experience || 'intermediate';

    // Calculate week count from timeframe
    const weeksMap = { '3-months': 12, '6-months': 24, '1-year': 48, '2-years': 96 };
    const totalWeeks = weeksMap[timeframe] || 24;

    const prompt = `You are an expert career coach. Generate a detailed, PERSONALIZED career roadmap.

USER PROFILE:
- Career Goal: ${careerGoal}
- Target Role: ${targetRole || careerGoal}
- Background: ${background}
- Experience Level: ${experience}
- Current Skills: ${userSkills}
- Timeframe: ${timeframe} (${totalWeeks} weeks total)

REQUIREMENTS:
- Generate 8-12 roadmap items that are SPECIFIC to this user's goal and current skills
- Do NOT include skills they already have (listed above)
- Organize items into phases: foundation → development → advanced → professional
- Assign each item to a specific week number (spread across ${totalWeeks} weeks)
- Set a dueDate for each item based on weekNumber (calculate from today: ${new Date().toISOString()})
- Include REAL resource URLs (Coursera, Udemy, YouTube, official docs, GitHub, etc.)
- Make descriptions detailed and actionable (min 2-3 sentences)
- Items must build on each other logically

STRICT JSON OUTPUT — return ONLY this JSON, no extra text:
{
  "title": "Specific roadmap title for ${careerGoal}",
  "description": "2-3 sentence personalized description mentioning their background",
  "difficulty": "${experience === 'beginner' ? 'beginner' : experience === 'advanced' ? 'advanced' : 'intermediate'}",
  "totalEstimatedDuration": "${timeframe}",
  "items": [
    {
      "title": "Specific item title",
      "description": "Detailed 2-3 sentence description of what to learn and why",
      "type": "skill|project|certification|course",
      "phase": "foundation|development|advanced|professional",
      "weekNumber": 1,
      "dueDate": "ISO date string",
      "duration": "X weeks",
      "priority": "high|medium|low",
      "order": 1,
      "skills": ["skill1", "skill2"],
      "estimatedHours": 40,
      "resources": [
        {
          "title": "Real resource name",
          "url": "https://real-url.com",
          "type": "course|article|video|book|documentation"
        }
      ]
    }
  ]
}`;

    try {
      const data = await this.callGemini(prompt, true);
      return this.validateAndNormalizeRoadmap(data, careerGoal, totalWeeks);
    } catch (error) {
      console.error('Gemini roadmap generation failed:', error.message || error);
      throw new Error(`AI roadmap generation failed: ${error.message}`);
    }
  }

  // 2. ADAPT ROADMAP — Regenerate based on missed/completed tasks
  async adaptRoadmap(roadmap, triggerType, triggeredItem) {
    const completedItems = roadmap.items.filter(i => i.completed);
    const missedItems = roadmap.items.filter(i => i.status === 'missed');
    const pendingItems = roadmap.items.filter(i => i.status === 'pending' && !i.completed);

    const prompt = `You are an adaptive AI career coach. A user's roadmap needs updating.

ROADMAP CONTEXT:
- Career Goal: ${roadmap.careerGoal}
- Target Role: ${roadmap.targetRole}
- Overall Progress: ${roadmap.progress.percentage}% complete

CURRENT STATE:
- Completed Items (${completedItems.length}): ${completedItems.map(i => i.title).join(', ') || 'None'}
- Missed Items (${missedItems.length}): ${missedItems.map(i => i.title).join(', ') || 'None'}
- Remaining Pending Items (${pendingItems.length}): ${pendingItems.map(i => `${i.title} (week ${i.weekNumber})`).join(', ') || 'None'}

TRIGGER: ${triggerType === 'missed'
        ? `User MISSED the task: "${triggeredItem.title}". Generate 1-2 replacement/catch-up tasks that account for this gap.`
        : `User COMPLETED: "${triggeredItem.title}". Generate 1-2 new follow-up tasks that build directly on what they just learned.`
      }

RULES:
- New tasks must be specific and directly related to the trigger item
- If missed: create easier catch-up version OR reschedule with shorter duration
- If completed: create advanced follow-up that builds on completed skill
- Set weekNumber to start from next available week
- Set dueDate from today: ${new Date().toISOString()}
- Include real resource URLs

Return ONLY this JSON:
{
  "adaptationReason": "Brief explanation of why you adapted the roadmap",
  "newItems": [
    {
      "title": "New task title",
      "description": "Detailed description",
      "type": "skill|project|certification|course",
      "phase": "foundation|development|advanced|professional",
      "weekNumber": ${Math.max(...pendingItems.map(i => i.weekNumber || 1), 1)},
      "dueDate": "ISO date string",
      "duration": "X weeks",
      "priority": "high|medium|low",
      "order": ${roadmap.items.length + 1},
      "skills": ["skill1"],
      "estimatedHours": 20,
      "isAdapted": true,
      "adaptedReason": "${triggerType === 'missed' ? 'missed_previous' : 'completed_early'}",
      "resources": [
        { "title": "Resource", "url": "https://url.com", "type": "course" }
      ]
    }
  ]
}`;

    try {
      const data = await this.callGemini(prompt, true);
      return data;
    } catch (error) {
      console.error('Gemini roadmap adaptation failed:', error.message || error);
      throw new Error(`AI adaptation failed: ${error.message}`);
    }
  }

  // 3. CHAT — Conversational career guidance
  async generateResponse(userMessage, context = {}) {
    if (!this.apiKey) {
      return this.generateEnhancedMockResponse(userMessage, context);
    }

    const prompt = this.buildChatPrompt(userMessage, context);

    // choose token budget by verbosity
    let maxTokens = 1024; // default reasonable size
    if (context.verbosity === 'brief') maxTokens = 200;
    if (context.verbosity === 'detailed') maxTokens = 4096;

    try {
      const data = await this.callGemini(prompt, true, maxTokens);
      return {
        content: this.formatResponse(data.advice || data),
        metadata: data.metadata || {},
        source: 'gemini-api'
      };
    } catch (error) {
      console.error('Chat response failed:', error.message || error);
      return this.generateEnhancedMockResponse(userMessage, context);
    }
  }

  // VALIDATION: Ensure roadmap items match schema
  validateAndNormalizeRoadmap(data, careerGoal, totalWeeks) {
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('AI returned invalid roadmap structure');
    }

    const today = new Date();

    const normalizedItems = data.items.map((item, index) => {
      const weekNum = item.weekNumber || (index + 1);
      const dueDate = item.dueDate
        ? new Date(item.dueDate)
        : new Date(today.getTime() + weekNum * 7 * 24 * 60 * 60 * 1000);

      return {
        title: item.title || `Step ${index + 1}`,
        description: item.description || item.title || '',
        type: ['skill', 'project', 'certification', 'course'].includes(item.type)
          ? item.type : 'skill',
        phase: ['foundation', 'development', 'advanced', 'professional'].includes(item.phase)
          ? item.phase : 'foundation',
        weekNumber: weekNum,
        dueDate: dueDate,
        scheduledStartDate: new Date(today.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        completed: false,
        duration: item.duration || '1 week',
        priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
        order: item.order ?? index + 1,
        skills: Array.isArray(item.skills) ? item.skills : [],
        estimatedHours: item.estimatedHours || 0,
        resources: Array.isArray(item.resources)
          ? item.resources
            .filter(r => r.title && r.url)
            .map(r => {
              const validTypes = ['course', 'article', 'video', 'book', 'documentation'];
              // Map common AI-returned types to valid enum values
              const typeMap = {
                tutorial: 'article',
                dataset: 'documentation',
                platform: 'course',
                guide: 'article',
                tool: 'documentation',
                project: 'article',
                website: 'article',
                repo: 'documentation',
                repository: 'documentation'
              };
              const normalizedType = validTypes.includes(r.type)
                ? r.type
                : (typeMap[r.type] || 'article');
              return { ...r, type: normalizedType };
            })
          : [],
        isAdapted: false,
        adaptedReason: null
      };
    });

    return {
      title: data.title || `${careerGoal} Career Roadmap`,
      description: data.description || '',
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(data.difficulty)
        ? data.difficulty : 'intermediate',
      totalEstimatedDuration: data.totalEstimatedDuration || '6-months',
      items: normalizedItems
    };
  }

  // HELPERS
  buildChatPrompt(userMessage, context) {
    const { chatHistory = [], userProfile = {}, sessionContext = {}, verbosity = 'normal', isGreeting = false } = context;

    let prompt = `You are an Advanced AI Career Advisor.

User Profile:
- Background: ${userProfile.background || 'Not specified'}
- Experience: ${userProfile.profile?.experience || 'Not specified'}
- Skills: ${this.formatSkills(userProfile.skills)}
- Goals: ${this.formatGoals(userProfile.careerGoals)}

`;

    if (chatHistory.length > 0) {
      prompt += `Recent Conversation:\n`;
      chatHistory.slice(-5).forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    // Behavior instructions based on verbosity / greeting
    if (isGreeting || verbosity === 'brief') {
      prompt += `INSTRUCTION: The user expects a SHORT reply. If this is just a greeting, reply with a concise friendly greeting only (1-2 short sentences, <=25 words). If the user asked for 'brief', answer in a single short paragraph. Avoid extra suggestions or long explanations.\n\n`;
    } else if (verbosity === 'detailed') {
      prompt += `INSTRUCTION: The user expects a DETAILED answer. Provide in-depth, step-by-step guidance, examples, and action items. Be thorough.\n\n`;
    } else {
      prompt += `INSTRUCTION: Provide a helpful response matching the user's request. Keep responses focused and not verbose unless the user asks for more detail.\n\n`;
    }

    prompt += `User: "${userMessage}"

Respond ONLY with this JSON:
{
  "advice": "Your detailed guidance in markdown format",
  "metadata": {
    "intent": "skill_development|job_search|roadmap_request|general",
    "actionItems": ["3-5 word action task"],
    "sentiment": "positive|neutral|negative"
  }
}`;
    return prompt;
  }

  formatResponse(response) {
    if (typeof response !== 'string') return JSON.stringify(response);
    return response.replace(/\n{3,}/g, '\n\n').trim();
  }

  formatSkills(skills) {
    if (!skills || skills.length === 0) return 'None specified';
    return skills.map(s => `${s.name} (${s.level})`).join(', ');
  }

  formatGoals(goals) {
    if (!goals || goals.length === 0) return 'None specified';
    return goals.map(g => g.title).join(', ');
  }

  estimateTokens(text) {
    return Math.ceil((text || '').length / 4);
  }

  detectIntent(message) {
    const m = message.toLowerCase();
    if (m.includes('roadmap') || m.includes('learning path')) return 'roadmap_request';
    if (m.includes('job') || m.includes('career opportunity')) return 'job_search';
    if (m.includes('skill') || m.includes('learn')) return 'skill_development';
    if (m.includes('interview')) return 'interview_prep';
    return 'general_guidance';
  }

  generateEnhancedMockResponse(userMessage, context) {
    const brev = context?.verbosity === 'brief' || context?.isGreeting;
    if (brev) {
      return {
        content: "Hi! 👋 How can I help you today?",
        metadata: { intent: this.detectIntent(userMessage) },
        source: 'mock'
      };
    }
    return {
      content: `I'm here to help with your career! Could you tell me more about your goals so I can provide personalized guidance?`,
      metadata: { intent: this.detectIntent(userMessage) },
      source: 'mock'
    };
  }
}

module.exports = new GeminiService();