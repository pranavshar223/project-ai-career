function buildRoadmapPrompt(careerGoal, targetRole, background, education, experience, userSkills, learningStyle, confidenceLevel, challenges, companies, timeCommitment, timeframe, totalWeeks) {
  return `You are an expert career coach. Generate a detailed, PERSONALIZED career roadmap.

USER PROFILE:
- Career Goal(s): ${careerGoal}
- Target Role: ${targetRole || 'Not specified'}
- Background: ${background}
- Education: ${education}
- Experience Level: ${experience}
- Current/Known Skills: ${userSkills}
- Preferred Learning Style: ${learningStyle}
- Career Confidence: ${confidenceLevel}
- Current Challenges: ${challenges}
- Target Companies: ${companies}
- Time Commitment: ${timeCommitment}
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
}

function buildAdaptRoadmapPrompt(roadmap, triggerType, triggeredItem, completedItems, missedItems, pendingItems) {
  return `You are an adaptive AI career coach. A user's roadmap needs updating.

ROADMAP CONTEXT:
- Career Goal: ${roadmap.careerGoal}
- Target Role: ${roadmap.targetRole}
- Overall Progress: ${roadmap.progress?.percentage || 0}% complete

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
}

function buildCareerCoachPrompt(userMessage, context) {
  const { chatHistory = [], userProfile = {} } = context;

  const skills = userProfile.skills && userProfile.skills.length > 0 
    ? userProfile.skills.map(s => `${s.name} (${s.level})`).join(', ')
    : 'None specified';

  const goals = userProfile.careerGoals && userProfile.careerGoals.length > 0
    ? userProfile.careerGoals.map(g => g.title).join(', ')
    : 'None specified';

  let prompt = `You are an Advanced AI Career Advisor.

User Profile:
- Background: ${userProfile.background || 'Not specified'}
- Education: ${userProfile.profile?.institution ? `${userProfile.profile.institution} (Class of ${userProfile.profile.graduationYear || 'Unknown'})` : 'Not specified'}
- Experience: ${userProfile.profile?.experience || 'Not specified'}
- Learning Style: ${userProfile.profile?.learningStyle || 'mixed'}
- Challenges: ${userProfile.profile?.challenges?.join(', ') || 'None specified'}
- Target Companies: ${userProfile.preferences?.dreamCompanies || userProfile.preferences?.preferredCompanyTypes?.join(', ') || 'Not specified'}
- Weekly Time: ${userProfile.profile?.weeklyTime || 0} hours
- Skills: ${skills}
- Goals: ${goals}

`;

  if (chatHistory.length > 0) {
    prompt += `Recent Conversation:\n`;
    chatHistory.slice(-5).forEach(msg => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    prompt += '\n';
  }

  prompt += `User: "${userMessage}"

CRITICAL INSTRUCTIONS FOR INTENT CLASSIFICATION:
- "roadmap_request": Use ONLY if the user explicitly asks you to create, generate, or build a NEW career roadmap, learning path, or study plan. Do NOT use this if they just mention the word "roadmap" in passing.
- "task_update": Use if the user wants to update, finish, complete, or modify an existing task or roadmap item.
- "general": Use for general career advice, answering questions, or casual chat.
- "skill_development" / "job_search": Use for those specific focused topics.

Respond ONLY with this JSON. You MUST replace the placeholder text with your actual generated advice:
{
  "advice": "[INSERT YOUR DETAILED GUIDANCE HERE IN MARKDOWN FORMAT. DO NOT COPY THIS PLACEHOLDER TEXT.]",
  "metadata": {
    "intent": "skill_development|job_search|roadmap_request|task_update|general",
    "actionItems": ["[Insert 3-5 word action task here]"],
    "sentiment": "positive|neutral|negative"
  }
}`;

  return prompt;
}

module.exports = {
  buildRoadmapPrompt,
  buildAdaptRoadmapPrompt,
  buildCareerCoachPrompt
};
