const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Generates a Gemini AI response with enhanced error handling and context awareness
   */
  async generateResponse(userMessage, context = {}) {
    if (!this.apiKey) {
      console.warn('No Gemini API key found, using enhanced mock response');
      return this.generateEnhancedMockResponse(userMessage, context);
    }

    const prompt = this.buildEnhancedPrompt(userMessage, context);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const apiResponse = await axios.post(
          `${this.apiUrl}?key=${this.apiKey}`,
          {
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
              candidateCount: 1,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          },
          {
            headers: { 
              'Content-Type': 'application/json',
              'User-Agent': 'AI-Career-Assistant/1.0'
            },
            timeout: 30000
          }
        );

        const candidate = apiResponse.data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
          throw new Error('Invalid response structure from Gemini API');
        }

        const aiText = candidate.content.parts[0].text;
        const metadata = this.extractEnhancedMetadata(userMessage, aiText, context);

        return {
          content: this.formatResponse(aiText),
          metadata,
          tokens: {
            input: this.estimateTokens(prompt),
            output: this.estimateTokens(aiText)
          },
          confidence: this.calculateConfidence(candidate),
          source: 'gemini-api'
        };

      } catch (error) {
        console.error(`Gemini API attempt ${attempt} failed:`, error.response?.data || error.message);
        
        if (attempt === this.maxRetries) {
          console.warn('All Gemini API attempts failed, falling back to enhanced mock response');
          return this.generateEnhancedMockResponse(userMessage, context);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  /**
   * Builds an enhanced prompt with better context awareness
   */
  buildEnhancedPrompt(userMessage, context) {
    const { chatHistory = [], userProfile = {}, sessionContext = {} } = context;

    let prompt = `You are an Advanced AI Career Advisor specializing in personalized career guidance.

CONTEXT ANALYSIS:
User Profile:
- Background: ${userProfile.background || 'Not specified'}
- Experience Level: ${userProfile.profile?.experience || 'Not specified'}
- Current Skills: ${this.formatSkills(userProfile.skills)}
- Career Goals: ${this.formatGoals(userProfile.careerGoals)}
- Location Preference: ${userProfile.preferences?.jobLocation || 'Not specified'}
- Job Type Preference: ${userProfile.preferences?.jobType || 'Not specified'}

Session Context:
- Previous Topics: ${sessionContext.topics?.join(', ') || 'None'}
- User Intent: ${sessionContext.intent || 'General inquiry'}
- Conversation Stage: ${sessionContext.stage || 'Initial'}

`;

    if (chatHistory.length > 0) {
      prompt += `Recent Conversation History:\n`;
      chatHistory.slice(-5).forEach((msg, index) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        prompt += `${role}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
      });
      prompt += '\n';
    }

    prompt += `Current User Message: "${userMessage}"

RESPONSE GUIDELINES:
1. PERSONALIZATION: Tailor advice based on user's background, skills, and goals
2. ACTIONABILITY: Provide specific, actionable steps and recommendations
3. STRUCTURE: Use clear formatting with headers, bullet points, and sections
4. RESOURCES: Include relevant learning resources, tools, and platforms
5. MOTIVATION: Be encouraging and supportive while being realistic
6. FOLLOW-UP: Ask relevant questions to better understand user needs

RESPONSE CATEGORIES:
- Skill Development: Learning paths, courses, certifications
- Career Planning: Role transitions, industry insights, salary expectations
- Job Search: Application strategies, interview prep, networking
- Portfolio Building: Project ideas, showcase strategies
- Industry Trends: Market analysis, emerging technologies

FORMAT YOUR RESPONSE:
- Use markdown formatting for better readability
- Include specific examples and case studies when relevant
- Provide timeline estimates for recommendations
- Suggest measurable milestones and progress tracking

Remember: Focus on practical, implementable advice that moves the user closer to their career goals.`;

    return prompt;
  }

  /**
   * Enhanced metadata extraction with better skill and goal detection
   */
  extractEnhancedMetadata(userMessage, aiResponse, context) {
    const metadata = {
      extractedSkills: [],
      extractedGoals: [],
      extractedTools: [],
      extractedCertifications: [],
      sentiment: 'neutral',
      confidence: 0.8,
      intent: this.detectIntent(userMessage),
      topics: this.extractTopics(userMessage, aiResponse),
      actionItems: this.extractActionItems(aiResponse),
      urgency: this.detectUrgency(userMessage),
      experienceLevel: this.detectExperienceLevel(userMessage, context.userProfile)
    };

    const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();

    // Enhanced skill detection with categories
    const skillCategories = {
      programming: ['python', 'javascript', 'java', 'c++', 'go', 'rust', 'typescript', 'php', 'ruby', 'swift', 'kotlin'],
      webdev: ['react', 'vue', 'angular', 'node.js', 'express', 'next.js', 'svelte', 'html', 'css', 'sass'],
      datascience: ['machine learning', 'data science', 'pandas', 'numpy', 'matplotlib', 'scikit-learn', 'tensorflow', 'pytorch'],
      cloud: ['aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform', 'serverless'],
      databases: ['sql', 'postgresql', 'mongodb', 'mysql', 'redis', 'elasticsearch'],
      tools: ['git', 'jira', 'figma', 'tableau', 'power bi', 'jenkins', 'github actions']
    };

    Object.entries(skillCategories).forEach(([category, skills]) => {
      skills.forEach(skill => {
        if (combinedText.includes(skill)) {
          metadata.extractedSkills.push({ name: skill, category });
        }
      });
    });

    // Enhanced goal detection
    const goalPatterns = [
      /become\s+(?:a\s+)?(.+?)(?:\s|$|,|\.|!|\?)/gi,
      /want\s+to\s+(?:be\s+)?(.+?)(?:\s|$|,|\.|!|\?)/gi,
      /transition\s+(?:to\s+|into\s+)(.+?)(?:\s|$|,|\.|!|\?)/gi,
      /career\s+in\s+(.+?)(?:\s|$|,|\.|!|\?)/gi
    ];

    goalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(userMessage)) !== null) {
        const goal = match[1].trim();
        if (goal.length > 3 && goal.length < 50) {
          metadata.extractedGoals.push(goal);
        }
      }
    });

    // Extract certifications
    const certificationKeywords = ['certification', 'certificate', 'certified', 'aws certified', 'google certified', 'microsoft certified'];
    certificationKeywords.forEach(cert => {
      if (combinedText.includes(cert)) {
        metadata.extractedCertifications.push(cert);
      }
    });

    // Sentiment analysis
    const positiveWords = ['excited', 'interested', 'passionate', 'love', 'enjoy', 'motivated', 'eager'];
    const negativeWords = ['struggling', 'difficult', 'confused', 'stuck', 'frustrated', 'overwhelmed', 'lost'];
    const neutralWords = ['help', 'advice', 'guidance', 'information', 'learn', 'understand'];

    const positiveCount = positiveWords.filter(word => combinedText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => combinedText.includes(word)).length;
    const neutralCount = neutralWords.filter(word => combinedText.includes(word)).length;

    if (positiveCount > negativeCount && positiveCount > 0) {
      metadata.sentiment = 'positive';
    } else if (negativeCount > positiveCount && negativeCount > 0) {
      metadata.sentiment = 'negative';
    } else if (neutralCount > 0) {
      metadata.sentiment = 'neutral';
    }

    return metadata;
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('roadmap') || lowerMessage.includes('learning path')) return 'roadmap_request';
    if (lowerMessage.includes('job') || lowerMessage.includes('career opportunity')) return 'job_search';
    if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) return 'skill_development';
    if (lowerMessage.includes('interview') || lowerMessage.includes('preparation')) return 'interview_prep';
    if (lowerMessage.includes('salary') || lowerMessage.includes('compensation')) return 'salary_inquiry';
    if (lowerMessage.includes('transition') || lowerMessage.includes('switch')) return 'career_transition';
    
    return 'general_guidance';
  }

  /**
   * Extract main topics from conversation
   */
  extractTopics(userMessage, aiResponse) {
    const topics = [];
    const topicKeywords = {
      'Data Science': ['data science', 'machine learning', 'analytics', 'statistics'],
      'Web Development': ['web development', 'frontend', 'backend', 'full stack'],
      'Cloud Computing': ['cloud', 'aws', 'azure', 'devops'],
      'Mobile Development': ['mobile', 'ios', 'android', 'react native'],
      'Career Planning': ['career', 'job search', 'interview', 'resume'],
      'Skills Development': ['skills', 'learning', 'certification', 'course']
    };

    const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  /**
   * Extract action items from AI response
   */
  extractActionItems(response) {
    const actionItems = [];
    const actionPatterns = [
      /(?:^|\n)[-*]\s*(.+?)(?:\n|$)/g,
      /(?:^|\n)\d+\.\s*(.+?)(?:\n|$)/g,
      /(?:start|begin|learn|practice|build|create|apply|study)\s+(.+?)(?:\.|,|\n|$)/gi
    ];

    actionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const action = match[1].trim();
        if (action.length > 10 && action.length < 100) {
          actionItems.push(action);
        }
      }
    });

    return actionItems.slice(0, 5); // Limit to top 5 action items
  }

  /**
   * Detect urgency level from user message
   */
  detectUrgency(message) {
    const urgentWords = ['urgent', 'asap', 'immediately', 'quickly', 'soon', 'deadline'];
    const lowerMessage = message.toLowerCase();
    
    if (urgentWords.some(word => lowerMessage.includes(word))) return 'high';
    if (lowerMessage.includes('when') || lowerMessage.includes('how long')) return 'medium';
    return 'low';
  }

  /**
   * Detect experience level from message and profile
   */
  detectExperienceLevel(message, userProfile) {
    const lowerMessage = message.toLowerCase();
    
    if (userProfile?.profile?.experience) {
      return userProfile.profile.experience;
    }
    
    if (lowerMessage.includes('beginner') || lowerMessage.includes('new to') || lowerMessage.includes('just started')) {
      return 'beginner';
    }
    if (lowerMessage.includes('experienced') || lowerMessage.includes('senior') || lowerMessage.includes('advanced')) {
      return 'advanced';
    }
    
    return 'intermediate';
  }

  /**
   * Format response for better readability
   */
  formatResponse(response) {
    // Clean up the response and ensure proper formatting
    return response
      .replace(/\*\*(.*?)\*\*/g, '**$1**') // Ensure bold formatting
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim();
  }

  /**
   * Calculate confidence score based on API response
   */
  calculateConfidence(candidate) {
    // Basic confidence calculation based on response quality indicators
    let confidence = 0.8;
    
    if (candidate.finishReason === 'STOP') confidence += 0.1;
    if (candidate.content?.parts?.[0]?.text?.length > 100) confidence += 0.05;
    if (candidate.safetyRatings?.every(rating => rating.probability === 'NEGLIGIBLE')) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Enhanced mock response with better context awareness
   */
  generateEnhancedMockResponse(userMessage, context) {
    const lowerMessage = userMessage.toLowerCase();
    const userProfile = context.userProfile || {};
    const intent = this.detectIntent(userMessage);
    
    let response = '';

    switch (intent) {
      case 'roadmap_request':
        response = this.generateRoadmapResponse(userMessage, userProfile);
        break;
      case 'job_search':
        response = this.generateJobSearchResponse(userMessage, userProfile);
        break;
      case 'skill_development':
        response = this.generateSkillDevelopmentResponse(userMessage, userProfile);
        break;
      case 'interview_prep':
        response = this.generateInterviewPrepResponse(userMessage, userProfile);
        break;
      case 'salary_inquiry':
        response = this.generateSalaryResponse(userMessage, userProfile);
        break;
      case 'career_transition':
        response = this.generateCareerTransitionResponse(userMessage, userProfile);
        break;
      default:
        response = this.generateGeneralGuidanceResponse(userMessage, userProfile);
    }

    const metadata = this.extractEnhancedMetadata(userMessage, response, context);

    return {
      content: response,
      metadata,
      tokens: {
        input: this.estimateTokens(userMessage),
        output: this.estimateTokens(response)
      },
      confidence: 0.85,
      source: 'enhanced-mock'
    };
  }

  generateRoadmapResponse(userMessage, userProfile) {
    const experience = userProfile.profile?.experience || 'beginner';
    return `# 🗺️ Personalized Career Roadmap

Based on your message and profile, here's a structured learning path:

## **Phase 1: Foundation Building (Weeks 1-4)**
- **Core Skills Assessment**: Evaluate your current skill level
- **Learning Resources**: Identify the best platforms for your learning style
- **Goal Setting**: Define specific, measurable career objectives

## **Phase 2: Skill Development (Weeks 5-12)**
- **Technical Skills**: Focus on in-demand technologies in your field
- **Soft Skills**: Communication, problem-solving, and teamwork
- **Portfolio Projects**: Build 2-3 showcase projects

## **Phase 3: Professional Growth (Weeks 13-24)**
- **Networking**: Connect with industry professionals
- **Certifications**: Pursue relevant industry certifications
- **Job Applications**: Start applying to target positions

## **Next Steps:**
1. **Immediate Action**: Choose one skill to focus on this week
2. **Weekly Goals**: Set specific learning targets
3. **Progress Tracking**: Use our dashboard to monitor advancement

Would you like me to create a more detailed roadmap for a specific role or technology?`;
  }

  generateJobSearchResponse(userMessage, userProfile) {
    return `# 💼 Job Search Strategy

## **Optimized Job Search Approach:**

### **1. Profile Optimization**
- **Resume Enhancement**: Tailor for each application
- **LinkedIn Profile**: Professional headline and summary
- **Portfolio Showcase**: Highlight your best work

### **2. Target Job Identification**
- **Role Research**: Understand job requirements thoroughly
- **Company Analysis**: Research potential employers
- **Salary Benchmarking**: Know your market value

### **3. Application Strategy**
- **Quality over Quantity**: Focus on relevant positions
- **Cover Letter Customization**: Address specific job requirements
- **Follow-up Process**: Professional communication timeline

### **4. Interview Preparation**
- **Technical Skills**: Practice coding/technical challenges
- **Behavioral Questions**: Prepare STAR method responses
- **Company Knowledge**: Research thoroughly before interviews

### **Recommended Actions:**
1. **Update your profile** with latest skills and projects
2. **Set up job alerts** for your target roles
3. **Network actively** through industry events and online communities

Let me know your target role, and I can provide more specific guidance!`;
  }

  generateSkillDevelopmentResponse(userMessage, userProfile) {
    return `# 📚 Skill Development Plan

## **Strategic Learning Approach:**

### **1. Skill Gap Analysis**
- **Current Skills Assessment**: Evaluate your existing capabilities
- **Market Demand Research**: Identify high-demand skills in your field
- **Priority Ranking**: Focus on skills with highest ROI

### **2. Learning Path Design**
- **Structured Curriculum**: Follow a logical learning sequence
- **Hands-on Practice**: Apply knowledge through projects
- **Community Engagement**: Join relevant developer/professional communities

### **3. Progress Tracking**
- **Milestone Setting**: Define clear learning objectives
- **Regular Assessment**: Test your knowledge regularly
- **Portfolio Updates**: Document your learning journey

### **Recommended Learning Resources:**
- **Online Platforms**: Coursera, Udemy, Pluralsight
- **Practice Sites**: LeetCode, HackerRank, Kaggle
- **Documentation**: Official docs and tutorials
- **Community**: Stack Overflow, Reddit, Discord groups

### **Action Plan:**
1. **Choose 1-2 skills** to focus on initially
2. **Dedicate 1-2 hours daily** to consistent learning
3. **Build a project** to apply new skills practically

What specific skill would you like to develop? I can provide a detailed learning roadmap!`;
  }

  generateInterviewPrepResponse(userMessage, userProfile) {
    return `# 🎯 Interview Preparation Guide

## **Comprehensive Interview Strategy:**

### **1. Technical Preparation**
- **Core Concepts**: Review fundamental principles in your field
- **Coding Practice**: Solve problems on platforms like LeetCode
- **System Design**: Understand scalability and architecture concepts
- **Portfolio Review**: Be ready to discuss your projects in detail

### **2. Behavioral Interview Prep**
- **STAR Method**: Structure your responses (Situation, Task, Action, Result)
- **Common Questions**: Prepare for "Tell me about yourself" and similar
- **Company Research**: Understand their values, products, and culture
- **Questions to Ask**: Prepare thoughtful questions about the role and company

### **3. Mock Interview Practice**
- **Technical Rounds**: Practice coding problems under time pressure
- **Behavioral Rounds**: Record yourself answering common questions
- **Peer Practice**: Conduct mock interviews with friends or colleagues

### **4. Day-of-Interview Tips**
- **Preparation**: Research the interviewers on LinkedIn
- **Materials**: Bring copies of resume, portfolio, and questions
- **Mindset**: Stay confident and view it as a conversation

### **Timeline (2-3 weeks before interview):**
- **Week 1**: Technical skill review and coding practice
- **Week 2**: Behavioral prep and company research
- **Week 3**: Mock interviews and final preparations

Need help with specific interview types or technical topics? Let me know!`;
  }

  generateSalaryResponse(userMessage, userProfile) {
    return `# 💰 Salary Negotiation & Market Analysis

## **Salary Research & Negotiation Strategy:**

### **1. Market Research**
- **Salary Benchmarking**: Use Glassdoor, PayScale, levels.fyi
- **Location Factors**: Consider cost of living adjustments
- **Experience Level**: Align expectations with your skill level
- **Industry Standards**: Research specific industry compensation trends

### **2. Total Compensation Analysis**
- **Base Salary**: Fixed annual compensation
- **Benefits Package**: Health insurance, retirement plans, PTO
- **Equity/Stock Options**: Long-term value potential
- **Professional Development**: Training budgets, conference attendance

### **3. Negotiation Preparation**
- **Value Proposition**: Document your unique skills and achievements
- **Market Data**: Present research-backed salary ranges
- **Flexibility**: Consider non-salary benefits if base pay is fixed
- **Timeline**: Understand when salary reviews typically occur

### **4. Negotiation Best Practices**
- **Professional Approach**: Maintain positive, collaborative tone
- **Specific Numbers**: Provide salary ranges rather than exact figures
- **Written Confirmation**: Get final agreements in writing
- **Relationship Focus**: Preserve working relationships throughout process

### **Salary Ranges by Experience Level:**
- **Entry Level (0-2 years)**: Focus on learning opportunities
- **Mid Level (3-5 years)**: Market rate with growth potential
- **Senior Level (5+ years)**: Premium for expertise and leadership

Would you like specific salary data for your target role and location?`;
  }

  generateCareerTransitionResponse(userMessage, userProfile) {
    return `# 🔄 Career Transition Strategy

## **Strategic Career Change Approach:**

### **1. Transition Planning**
- **Skills Assessment**: Identify transferable skills from current role
- **Gap Analysis**: Determine what new skills you need to develop
- **Timeline Planning**: Create realistic transition timeline (6-18 months)
- **Financial Planning**: Prepare for potential income changes during transition

### **2. Skill Bridge Building**
- **Transferable Skills**: Highlight relevant experience from current field
- **New Skill Development**: Focus on high-impact skills for target role
- **Portfolio Creation**: Build projects that demonstrate new capabilities
- **Certification Pursuit**: Earn credentials in your target field

### **3. Network Development**
- **Industry Connections**: Attend meetups, conferences, online communities
- **Informational Interviews**: Learn from professionals in target field
- **Mentorship**: Find mentors who've made similar transitions
- **Professional Branding**: Update LinkedIn and other profiles

### **4. Transition Execution**
- **Gradual Transition**: Consider part-time or freelance work initially
- **Internal Opportunities**: Look for relevant projects in current company
- **Strategic Job Search**: Target roles that value your unique background
- **Story Development**: Craft compelling narrative for your career change

### **Common Transition Paths:**
- **Tech Transitions**: Business → Product Management → Tech Leadership
- **Data Transitions**: Any field → Data Analysis → Data Science
- **Consulting**: Industry Expert → Independent Consultant

### **Success Timeline:**
- **Months 1-3**: Skill development and network building
- **Months 4-6**: Portfolio creation and initial applications
- **Months 7-12**: Active job search and interviews

What specific career transition are you considering? I can provide more targeted advice!`;
  }

  generateGeneralGuidanceResponse(userMessage, userProfile) {
    return `# 🎯 Personalized Career Guidance

Hello! I'm here to help you navigate your career journey with personalized advice.

## **How I Can Assist You:**

### **🗺️ Career Planning**
- Create customized learning roadmaps
- Identify skill gaps and development priorities
- Set realistic career goals and timelines

### **💼 Job Search Support**
- Optimize your resume and LinkedIn profile
- Provide interview preparation strategies
- Suggest relevant job opportunities

### **📚 Skill Development**
- Recommend learning resources and courses
- Design practice projects for your portfolio
- Track your progress and celebrate milestones

### **💰 Career Growth**
- Salary negotiation strategies
- Professional networking guidance
- Industry trend analysis and insights

## **To Get Started:**
1. **Tell me about your career goals** - What role are you targeting?
2. **Share your current situation** - What's your background and experience?
3. **Identify your challenges** - What specific help do you need?

## **Popular Topics I Can Help With:**
- "I want to become a Data Scientist"
- "Help me transition from marketing to tech"
- "What skills do I need for a Frontend Developer role?"
- "How do I prepare for technical interviews?"
- "Create a learning roadmap for machine learning"

Feel free to ask me anything about your career! I'm here to provide personalized, actionable advice based on your unique situation and goals.

What would you like to focus on today?`;
  }

  /**
   * Helper methods for formatting
   */
  formatSkills(skills) {
    if (!skills || skills.length === 0) return 'None specified';
    return skills.map(s => `${s.name} (${s.level})`).join(', ');
  }

  formatGoals(goals) {
    if (!goals || goals.length === 0) return 'None specified';
    return goals.map(g => g.title).join(', ');
  }

  /**
   * Estimates token count (roughly 4 characters per token).
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
}

module.exports = new GeminiService();