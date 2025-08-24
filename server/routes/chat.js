const express = require('express');
const { body, validationResult } = require('express-validator');
const ChatMessage = require('../models/ChatMessage');
const UserSession = require('../models/UserSession');
const User = require('../models/User');
const auth = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// @route   POST /api/chat/message
// @desc    Send message to AI and get response
// @access  Private
router.post('/message', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('Session ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, sessionId = `session_${Date.now()}` } = req.body;
    const userId = req.user._id;

    const startTime = Date.now();

    // Get or create user session
    let userSession = await UserSession.findOne({ sessionId, userId });
    if (!userSession) {
      userSession = new UserSession({
        userId,
        sessionId,
        startTime: new Date(),
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          platform: req.headers['sec-ch-ua-platform'],
          browser: req.headers['sec-ch-ua']
        }
      });
      await userSession.save();
    }

    // Save user message
    const userMessage = new ChatMessage({
      userId,
      sessionId,
      content,
      role: 'user',
      processingTime: 0
    });
    await userMessage.save();

    // Get recent chat history for context (last 10 messages)
    const recentChatHistory = await ChatMessage.find({
      userId,
      sessionId
    }).sort({ createdAt: -1 }).limit(10).sort({ createdAt: 1 });

    // Get user profile for context
    const user = await User.findById(userId);

    // Build enhanced context
    const enhancedContext = {
      chatHistory: recentChatHistory.slice(0, -1), // Exclude current message
      userProfile: {
        background: user.background,
        skills: user.skills,
        careerGoals: user.careerGoals,
        preferences: user.preferences,
        profile: user.profile
      },
      sessionContext: {
        topics: userSession.topics || [],
        intents: userSession.intents || [],
        stage: recentChatHistory.length < 3 ? 'initial' : 'ongoing'
      }
    };

    // Generate AI response
    const aiResponse = await geminiService.generateResponse(content, enhancedContext);

    const processingTime = Date.now() - startTime;

    // Save AI response
    const assistantMessage = new ChatMessage({
      userId,
      sessionId,
      content: aiResponse.content,
      role: 'assistant',
      metadata: aiResponse.metadata,
      tokens: aiResponse.tokens,
      processingTime,
      source: aiResponse.source
    });
    await assistantMessage.save();

    // Update user session with new data
    userSession.messageCount += 2; // User + AI message
    userSession.endTime = new Date();
    
    // Update session topics and intents
    if (aiResponse.metadata.topics) {
      userSession.topics = [...new Set([...userSession.topics, ...aiResponse.metadata.topics])];
    }
    if (aiResponse.metadata.intent) {
      userSession.intents = [...new Set([...userSession.intents, aiResponse.metadata.intent])];
    }
    
    await userSession.save();

    // Update user analytics
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'analytics.totalChatMessages': 2,
        'aiInteractions.totalQueries': 1
      },
      $set: {
        'analytics.lastActiveDate': new Date()
      },
      $addToSet: {
        'aiInteractions.favoriteTopics': { $each: aiResponse.metadata.topics || [] }
      }
    });

    // Update user intent tracking
    if (aiResponse.metadata.intent) {
      await User.findOneAndUpdate(
        { 
          _id: userId, 
          'aiInteractions.commonIntents.intent': aiResponse.metadata.intent 
        },
        { 
          $inc: { 'aiInteractions.commonIntents.$.count': 1 } 
        }
      );
      
      // If intent doesn't exist, add it
      await User.findOneAndUpdate(
        { 
          _id: userId, 
          'aiInteractions.commonIntents.intent': { $ne: aiResponse.metadata.intent }
        },
        { 
          $push: { 
            'aiInteractions.commonIntents': { 
              intent: aiResponse.metadata.intent, 
              count: 1 
            } 
          } 
        }
      );
    }

    // Update user streak if this is a meaningful interaction
    if (content.length > 10) {
      user.updateStreak();
      await user.save();
    }

    // Process extracted skills and goals
    if (aiResponse.metadata.extractedSkills?.length > 0) {
      await updateUserSkills(userId, aiResponse.metadata.extractedSkills);
    }

    if (aiResponse.metadata.extractedGoals?.length > 0) {
      await updateUserGoals(userId, aiResponse.metadata.extractedGoals);
    }

    res.json({
      message: 'Message processed successfully',
      response: {
        id: assistantMessage._id,
        content: assistantMessage.content,
        role: assistantMessage.role,
        timestamp: assistantMessage.createdAt,
        sessionId,
        confidence: aiResponse.confidence,
        processingTime,
        source: aiResponse.source
      },
      metadata: {
        ...aiResponse.metadata,
        sessionStats: {
          messageCount: userSession.messageCount,
          topics: userSession.topics,
          duration: userSession.duration
        }
      }
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      message: 'Error processing chat message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/chat/history/:sessionId
// @desc    Get chat history for a session
// @access  Private
router.get('/history/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await ChatMessage.find({
      userId: req.user._id,
      sessionId
    })
    .sort({ createdAt: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await ChatMessage.countDocuments({
      userId: req.user._id,
      sessionId
    });

    res.json({
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.createdAt,
        metadata: msg.metadata
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      message: 'Error fetching chat history'
    });
  }
});

// @route   GET /api/chat/sessions
// @desc    Get all chat sessions for user
// @access  Private
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatMessage.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $last: '$content' },
          lastActivity: { $last: '$createdAt' },
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { lastActivity: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      sessions: sessions.map(session => ({
        sessionId: session._id,
        lastMessage: session.lastMessage.substring(0, 100) + (session.lastMessage.length > 100 ? '...' : ''),
        lastActivity: session.lastActivity,
        messageCount: session.messageCount
      }))
    });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      message: 'Error fetching chat sessions'
    });
  }
});

// Helper function to update user skills
async function updateUserSkills(userId, extractedSkills) {
  try {
    const user = await User.findById(userId);
    const existingSkills = user.skills.map(s => s.name.toLowerCase());
    
    const newSkills = extractedSkills
      .filter(skillData => {
        const skillName = typeof skillData === 'string' ? skillData : skillData.name;
        return !existingSkills.includes(skillName.toLowerCase());
      })
      .map(skill => ({
        name: typeof skill === 'string' ? skill : skill.name,
        level: 'beginner',
        category: typeof skill === 'string' ? 'general' : skill.category,
        addedAt: new Date()
      }));

    if (newSkills.length > 0) {
      user.skills.push(...newSkills);
      user.analytics.totalSkillsLearned += newSkills.length;
      await user.save();
    }
  } catch (error) {
    console.error('Error updating user skills:', error);
  }
}

// Helper function to update user goals
async function updateUserGoals(userId, extractedGoals) {
  try {
    const user = await User.findById(userId);
    const existingGoals = user.careerGoals.map(g => g.title.toLowerCase());
    
    const newGoals = extractedGoals
      .filter(goal => !existingGoals.includes(goal.toLowerCase()))
      .map(goal => ({
        title: goal,
        description: `Goal identified from AI conversation`,
        priority: 'medium',
        completed: false
      }));

    if (newGoals.length > 0) {
      user.careerGoals.push(...newGoals);
      await user.save();
    }
  } catch (error) {
    console.error('Error updating user goals:', error);
  }
}

module.exports = router;