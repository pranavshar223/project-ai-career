const express = require('express');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const UserSession = require('../models/UserSession');
const SkillProgress = require('../models/SkillProgress');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get user analytics dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user data
    const user = await User.findById(userId);

    // Chat analytics
    const chatStats = await ChatMessage.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          userMessages: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } },
          aiMessages: { $sum: { $cond: [{ $eq: ['$role', 'assistant'] }, 1, 0] } },
          avgConfidence: { $avg: '$metadata.confidence' },
          topTopics: { $push: '$metadata.topics' },
          topIntents: { $push: '$metadata.intent' },
          sentimentDistribution: {
            $push: '$metadata.sentiment'
          }
        }
      }
    ]);

    // Session analytics
    const sessionStats = await UserSession.aggregate([
      { $match: { userId, startTime: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          totalDuration: { $sum: '$duration' },
          avgMessagesPerSession: { $avg: '$messageCount' }
        }
      }
    ]);

    // Skill progress analytics
    const skillStats = await SkillProgress.aggregate([
      { $match: { userId, updatedAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalSkills: { $sum: 1 },
          avgProgress: { $avg: '$progressPercentage' },
          skillsByCategory: {
            $push: {
              category: '$category',
              progress: '$progressPercentage'
            }
          },
          completedMilestones: {
            $sum: {
              $size: {
                $filter: {
                  input: '$milestones',
                  cond: { $eq: ['$$this.completed', true] }
                }
              }
            }
          }
        }
      }
    ]);

    // Daily activity data for charts
    const dailyActivity = await ChatMessage.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          messageCount: { $sum: 1 },
          uniqueSessions: { $addToSet: '$sessionId' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Learning streak calculation
    const streakData = {
      current: user.streak.current,
      longest: user.streak.longest,
      weeklyGoal: user.streak.weeklyGoal,
      monthlyGoal: user.streak.monthlyGoal,
      completedDays: user.streak.completedDays.length
    };

    // Compile analytics response
    const analytics = {
      overview: {
        totalChatMessages: chatStats[0]?.totalMessages || 0,
        totalSessions: sessionStats[0]?.totalSessions || 0,
        totalSkills: skillStats[0]?.totalSkills || 0,
        engagementScore: user.analytics.engagementScore,
        avgSessionDuration: sessionStats[0]?.avgDuration || 0,
        avgSkillProgress: skillStats[0]?.avgProgress || 0
      },
      chatAnalytics: {
        messageBreakdown: {
          user: chatStats[0]?.userMessages || 0,
          ai: chatStats[0]?.aiMessages || 0
        },
        avgConfidence: chatStats[0]?.avgConfidence || 0,
        topTopics: getTopItems(chatStats[0]?.topTopics?.flat() || []),
        topIntents: getTopItems(chatStats[0]?.topIntents || []),
        sentimentDistribution: getSentimentDistribution(chatStats[0]?.sentimentDistribution || [])
      },
      learningProgress: {
        streak: streakData,
        skillProgress: skillStats[0]?.skillsByCategory || [],
        completedMilestones: skillStats[0]?.completedMilestones || 0,
        timeSpent: calculateTimeSpent(skillStats[0])
      },
      activityTrends: {
        daily: dailyActivity.map(day => ({
          date: day._id,
          messages: day.messageCount,
          sessions: day.uniqueSessions.length
        })),
        timeframe
      }
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      message: 'Error fetching analytics data'
    });
  }
});

// @route   GET /api/analytics/skills
// @desc    Get detailed skill analytics
// @access  Private
router.get('/skills', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const skillAnalytics = await SkillProgress.find({ userId })
      .sort({ progressPercentage: -1 });

    const skillSummary = await SkillProgress.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          skills: { $push: '$$ROOT' },
          avgProgress: { $avg: '$progressPercentage' },
          totalSkills: { $sum: 1 },
          completedSkills: {
            $sum: { $cond: [{ $gte: ['$progressPercentage', 90] }, 1, 0] }
          }
        }
      },
      { $sort: { avgProgress: -1 } }
    ]);

    res.json({
      skillAnalytics,
      skillSummary
    });
  } catch (error) {
    console.error('Skill analytics error:', error);
    res.status(500).json({
      message: 'Error fetching skill analytics'
    });
  }
});

// @route   POST /api/analytics/feedback
// @desc    Submit feedback for AI response
// @access  Private
router.post('/feedback', auth, async (req, res) => {
  try {
    const { messageId, helpful, rating, comment } = req.body;

    const message = await ChatMessage.findOne({
      _id: messageId,
      userId: req.user._id
    });

    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    message.feedback = {
      helpful,
      rating,
      comment,
      submittedAt: new Date()
    };

    await message.save();

    // Update user analytics
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        'aiInteractions.satisfactionRatings': {
          rating,
          feedback: comment,
          date: new Date()
        }
      }
    });

    res.json({
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      message: 'Error submitting feedback'
    });
  }
});

// Helper functions
function getTopItems(items, limit = 5) {
  const counts = {};
  items.forEach(item => {
    if (item) {
      counts[item] = (counts[item] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([item, count]) => ({ item, count }));
}

function getSentimentDistribution(sentiments) {
  const distribution = { positive: 0, negative: 0, neutral: 0 };
  sentiments.forEach(sentiment => {
    if (sentiment && distribution.hasOwnProperty(sentiment)) {
      distribution[sentiment]++;
    }
  });
  return distribution;
}

function calculateTimeSpent(skillStats) {
  // This would be calculated from actual time tracking data
  // For now, return estimated values
  return {
    total: skillStats?.totalSkills * 10 || 0, // Estimated hours
    thisWeek: Math.floor(Math.random() * 20),
    thisMonth: Math.floor(Math.random() * 80)
  };
}

module.exports = router;