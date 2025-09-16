const express = require('express');
const { body, validationResult } = require('express-validator');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const auth = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// @route   POST /api/roadmaps/generate
// @desc    Generate a new roadmap using AI
// @access  Private
router.post('/generate', auth, [
  body('careerGoal')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Career goal must be between 3 and 200 characters'),
  body('targetRole')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Target role cannot exceed 100 characters'),
  body('timeframe')
    .optional()
    .isIn(['3-months', '6-months', '1-year', '2-years'])
    .withMessage('Invalid timeframe')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { careerGoal, targetRole, timeframe = '6-months' } = req.body;
    const userId = req.user._id;

    // Get user profile for context
    const user = await User.findById(userId);

    // Add this log
    console.log('POST /generate called by user:', userId, 'Career goal:', careerGoal);

    // Generate roadmap using AI
    const roadmapData = await generateRoadmapWithAI(careerGoal, {
      userProfile: user,
      targetRole,
      timeframe
    });

    // Create roadmap in database
    const roadmap = new Roadmap({
      userId,
      title: roadmapData.title,
      description: roadmapData.description,
      careerGoal,
      targetRole: targetRole || careerGoal,
      items: roadmapData.items,
      totalEstimatedDuration: roadmapData.totalEstimatedDuration,
      difficulty: roadmapData.difficulty
    });
    console.log('Roadmap data before saving:', roadmapData);
    await roadmap.save();
    console.log('Roadmap saved successfully with ID:', roadmap._id);

    // await roadmap.save();

    res.status(201).json({
      message: 'Roadmap generated successfully',
      roadmap: {
        id: roadmap._id,
        title: roadmap.title,
        description: roadmap.description,
        careerGoal: roadmap.careerGoal,
        targetRole: roadmap.targetRole,
        items: roadmap.items,
        totalEstimatedDuration: roadmap.totalEstimatedDuration,
        difficulty: roadmap.difficulty,
        progress: roadmap.progress,
        createdAt: roadmap.createdAt
      }
    });
  } catch (error) {
    console.error('Generate roadmap error:', error);
    res.status(500).json({
      message: 'Error generating roadmap',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/roadmaps
// @desc    Get all roadmaps for user
// @access  Private
router.get('/', auth, async (req, res) => {

  try {
    console.log('GET /api/roadmaps called by user:', req.user?._id);
    const { page = 1, limit = 10, active = true } = req.query;

    const query = { userId: req.user._id };
    if (active !== 'all') {
      query.isActive = active === 'true';
    }

    const roadmaps = await Roadmap.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

      // ✅ Add here: log how many roadmaps were found
      console.log('Found roadmaps:', roadmaps.length);

    const total = await Roadmap.countDocuments(query);

    res.json({
      roadmaps: roadmaps.map(roadmap => ({
        id: roadmap._id,
        title: roadmap.title,
        description: roadmap.description,
        careerGoal: roadmap.careerGoal,
        targetRole: roadmap.targetRole,
        progress: roadmap.progress,
        difficulty: roadmap.difficulty,
        totalEstimatedDuration: roadmap.totalEstimatedDuration,
        isActive: roadmap.isActive,
        createdAt: roadmap.createdAt,
        lastUpdated: roadmap.lastUpdated
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({
      message: 'Error fetching roadmaps'
    });
  }
});

// @route   GET /api/roadmaps/:id
// @desc    Get specific roadmap
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        message: 'Roadmap not found'
      });
    }

    res.json({
      roadmap: {
        id: roadmap._id,
        title: roadmap.title,
        description: roadmap.description,
        careerGoal: roadmap.careerGoal,
        targetRole: roadmap.targetRole,
        items: roadmap.items,
        totalEstimatedDuration: roadmap.totalEstimatedDuration,
        difficulty: roadmap.difficulty,
        progress: roadmap.progress,
        isActive: roadmap.isActive,
        createdAt: roadmap.createdAt,
        lastUpdated: roadmap.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({
      message: 'Error fetching roadmap'
    });
  }
});

// @route   PUT /api/roadmaps/:id/items/:itemId/toggle
// @desc    Toggle completion status of roadmap item
// @access  Private
router.put('/:id/items/:itemId/toggle', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        message: 'Roadmap not found'
      });
    }

    const item = roadmap.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        message: 'Roadmap item not found'
      });
    }

    // Toggle completion status
    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;

    await roadmap.save();

    // Update user streak if item was completed
    if (item.completed) {
      const user = await User.findById(req.user._id);
      user.updateStreak();
      await user.save();
    }

    res.json({
      message: 'Roadmap item updated successfully',
      item: {
        id: item._id,
        title: item.title,
        completed: item.completed,
        completedAt: item.completedAt
      },
      progress: roadmap.progress
    });
  } catch (error) {
    console.error('Toggle roadmap item error:', error);
    res.status(500).json({
      message: 'Error updating roadmap item'
    });
  }
});

// @route   PUT /api/roadmaps/:id
// @desc    Update roadmap
// @access  Private
router.put('/:id', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        message: 'Roadmap not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'isActive'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        roadmap[field] = req.body[field];
      }
    });

    await roadmap.save();

    res.json({
      message: 'Roadmap updated successfully',
      roadmap: {
        id: roadmap._id,
        title: roadmap.title,
        description: roadmap.description,
        isActive: roadmap.isActive,
        lastUpdated: roadmap.lastUpdated
      }
    });
  } catch (error) {
    console.error('Update roadmap error:', error);
    res.status(500).json({
      message: 'Error updating roadmap'
    });
  }
});

// @route   DELETE /api/roadmaps/:id
// @desc    Delete roadmap
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        message: 'Roadmap not found'
      });
    }

    res.json({
      message: 'Roadmap deleted successfully'
    });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({
      message: 'Error deleting roadmap'
    });
  }
});

// Helper function to generate roadmap using AI
async function generateRoadmapWithAI(careerGoal, context) {
  try {
    const prompt = `Generate a detailed career roadmap for someone who wants to become: ${careerGoal}

User Context:
- Background: ${context.userProfile.background}
- Current Skills: ${context.userProfile.skills?.map(s => `${s.name} (${s.level})`).join(', ') || 'None'}
- Timeframe: ${context.timeframe}
- Target Role: ${context.targetRole || careerGoal}

Please provide a structured roadmap with 6-10 items that includes:
1. Skills to learn
2. Projects to build
3. Certifications to obtain
4. Courses to take

Format as JSON with this structure:
{
  "title": "Career Roadmap Title",
  "description": "Brief description of the roadmap",
  "difficulty": "beginner|intermediate|advanced",
  "totalEstimatedDuration": "X months",
  "items": [
    {
      "title": "Item title",
      "description": "Detailed description",
      "type": "skill|project|certification|course",
      "duration": "X weeks",
      "priority": "high|medium|low",
      "order": 1,
      "skills": ["skill1", "skill2"],
      "estimatedHours": 40,
      "resources": [
        {
          "title": "Resource name",
          "url": "https://example.com",
          "type": "course|article|video|book"
        }
      ]
    }
  ]
}`;

    const response = await geminiService.generateResponse(prompt, context);
    
    try {
      // Try to parse JSON from AI response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('Failed to parse AI JSON, using fallback');
    }

    // Fallback to mock roadmap
    return generateMockRoadmap(careerGoal, context);
  } catch (error) {
    console.error('AI roadmap generation error:', error);
    return generateMockRoadmap(careerGoal, context);
  }
}

// Fallback mock roadmap generator
function generateMockRoadmap(careerGoal, context) {
  const lowerGoal = careerGoal.toLowerCase();
  
  if (lowerGoal.includes('data scientist') || lowerGoal.includes('data science')) {
    return {
      title: `Data Science Career Roadmap`,
      description: `A comprehensive path to becoming a Data Scientist with hands-on projects and industry-relevant skills.`,
      difficulty: 'intermediate',
      totalEstimatedDuration: '8-12 months',
      items: [
        {
          title: 'Master Python Programming',
          description: 'Learn Python fundamentals, data structures, and object-oriented programming concepts essential for data science.',
          type: 'skill',
          duration: '4-6 weeks',
          priority: 'high',
          order: 1,
          skills: ['Python', 'Programming'],
          estimatedHours: 60,
          resources: [
            { title: 'Python for Everybody Specialization', url: 'https://coursera.org', type: 'course' },
            { title: 'Automate the Boring Stuff with Python', url: 'https://automatetheboringstuff.com', type: 'book' }
          ]
        },
        {
          title: 'Learn Data Manipulation with Pandas',
          description: 'Master pandas library for data cleaning, transformation, and analysis.',
          type: 'skill',
          duration: '3-4 weeks',
          priority: 'high',
          order: 2,
          skills: ['Pandas', 'Data Manipulation'],
          estimatedHours: 40,
          resources: [
            { title: 'Pandas Documentation', url: 'https://pandas.pydata.org', type: 'documentation' }
          ]
        },
        {
          title: 'Statistics and Probability Fundamentals',
          description: 'Build strong foundation in statistics, probability, and hypothesis testing.',
          type: 'skill',
          duration: '6-8 weeks',
          priority: 'high',
          order: 3,
          skills: ['Statistics', 'Probability', 'Mathematics'],
          estimatedHours: 80,
          resources: [
            { title: 'Khan Academy Statistics', url: 'https://khanacademy.org', type: 'course' }
          ]
        },
        {
          title: 'Build Your First Data Analysis Project',
          description: 'Complete an end-to-end data analysis project using real-world dataset.',
          type: 'project',
          duration: '2-3 weeks',
          priority: 'high',
          order: 4,
          skills: ['Data Analysis', 'Python', 'Pandas'],
          estimatedHours: 30,
          resources: [
            { title: 'Kaggle Learn', url: 'https://kaggle.com/learn', type: 'course' }
          ]
        },
        {
          title: 'Machine Learning Fundamentals',
          description: 'Learn supervised and unsupervised learning algorithms using scikit-learn.',
          type: 'skill',
          duration: '6-8 weeks',
          priority: 'high',
          order: 5,
          skills: ['Machine Learning', 'Scikit-learn'],
          estimatedHours: 100,
          resources: [
            { title: 'Machine Learning Course by Andrew Ng', url: 'https://coursera.org', type: 'course' }
          ]
        },
        {
          title: 'Data Visualization with Matplotlib and Seaborn',
          description: 'Create compelling visualizations to communicate insights effectively.',
          type: 'skill',
          duration: '2-3 weeks',
          priority: 'medium',
          order: 6,
          skills: ['Data Visualization', 'Matplotlib', 'Seaborn'],
          estimatedHours: 25,
          resources: []
        }
      ]
    };
  }

  // Generic roadmap for other career goals
  return {
    title: `${careerGoal} Career Roadmap`,
    description: `A personalized learning path to achieve your career goal of becoming a ${careerGoal}.`,
    difficulty: 'intermediate',
    totalEstimatedDuration: '6-9 months',
    items: [
      {
        title: 'Research Industry Requirements',
        description: 'Study job postings and industry trends to understand required skills and qualifications.',
        type: 'skill',
        duration: '1 week',
        priority: 'high',
        order: 1,
        skills: ['Research', 'Industry Knowledge'],
        estimatedHours: 10,
        resources: []
      },
      {
        title: 'Build Foundation Skills',
        description: 'Develop core technical and soft skills required for your target role.',
        type: 'skill',
        duration: '8-12 weeks',
        priority: 'high',
        order: 2,
        skills: ['Technical Skills', 'Communication'],
        estimatedHours: 120,
        resources: []
      },
      {
        title: 'Complete Hands-on Projects',
        description: 'Build portfolio projects that demonstrate your capabilities to potential employers.',
        type: 'project',
        duration: '6-8 weeks',
        priority: 'high',
        order: 3,
        skills: ['Project Management', 'Portfolio Development'],
        estimatedHours: 80,
        resources: []
      },
      {
        title: 'Network and Apply for Positions',
        description: 'Connect with professionals in your field and start applying for relevant positions.',
        type: 'skill',
        duration: '4-6 weeks',
        priority: 'medium',
        order: 4,
        skills: ['Networking', 'Job Search'],
        estimatedHours: 40,
        resources: []
      }
    ]
  };
}

module.exports = router;