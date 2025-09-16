const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        background: user.background,
        profile: user.profile,
        skills: user.skills,
        careerGoals: user.careerGoals,
        preferences: user.preferences,
        streak: user.streak,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Error fetching user profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('profile.location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('profile.website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user._id);
    
    // Update allowed fields
    const allowedUpdates = ['name'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update profile fields
    if (req.body.profile) {
      const allowedProfileUpdates = ['bio', 'location', 'website', 'experience'];
      allowedProfileUpdates.forEach(field => {
        if (req.body.profile[field] !== undefined) {
          if (!user.profile) user.profile = {};
          user.profile[field] = req.body.profile[field];
        }
      });
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        background: user.background,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Error updating profile'
    });
  }
});

// @route   POST /api/users/skills
// @desc    Add skill to user profile
// @access  Private
router.post('/skills', auth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Skill name must be between 1 and 50 characters'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Category cannot exceed 30 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, level, category = 'general' } = req.body;
    const user = await User.findById(req.user._id);

    // Check if skill already exists
    const existingSkill = user.skills.find(
      skill => skill.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSkill) {
      return res.status(400).json({
        message: 'Skill already exists in your profile'
      });
    }

    // Add new skill
    user.skills.push({
      name,
      level,
      category,
      addedAt: new Date()
    });

    await user.save();

    res.status(201).json({
      message: 'Skill added successfully',
      skill: user.skills[user.skills.length - 1]
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      message: 'Error adding skill'
    });
  }
});

// @route   PUT /api/users/skills/:skillId
// @desc    Update skill level
// @access  Private
router.put('/skills/:skillId', auth, [
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { level } = req.body;
    const user = await User.findById(req.user._id);
    
    const skill = user.skills.id(req.params.skillId);
    if (!skill) {
      return res.status(404).json({
        message: 'Skill not found'
      });
    }

    skill.level = level;
    await user.save();

    res.json({
      message: 'Skill updated successfully',
      skill: {
        id: skill._id,
        name: skill.name,
        level: skill.level,
        category: skill.category
      }
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      message: 'Error updating skill'
    });
  }
});

// @route   DELETE /api/users/skills/:skillId
// @desc    Remove skill from profile
// @access  Private
router.delete('/skills/:skillId', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { skills: { _id: req.params.skillId } } }, // ✅ Pull out the skill
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Skill removed successfully',
      skills: user.skills
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ message: 'Error removing skill' });
  }
});

// @route   POST /api/users/goals
// @desc    Add career goal
// @access  Private
router.post('/goals', auth, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Goal title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Priority must be high, medium, or low'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, priority = 'medium', targetDate } = req.body;
    const user = await User.findById(req.user._id);

    // Add new goal
    user.careerGoals.push({
      title,
      description,
      priority,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      completed: false
    });

    await user.save();

    res.status(201).json({
      message: 'Career goal added successfully',
      goal: user.careerGoals[user.careerGoals.length - 1]
    });
  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({
      message: 'Error adding career goal'
    });
  }
});

// @route   PUT /api/users/goals/:goalId
// @desc    Update career goal
// @access  Private
router.put('/goals/:goalId', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Goal title must be between 3 and 100 characters'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user._id);
    const goal = user.careerGoals.id(req.params.goalId);
    
    if (!goal) {
      return res.status(404).json({
        message: 'Career goal not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'priority', 'completed', 'targetDate'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        goal[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      message: 'Career goal updated successfully',
      goal: {
        id: goal._id,
        title: goal.title,
        description: goal.description,
        priority: goal.priority,
        completed: goal.completed,
        targetDate: goal.targetDate
      }
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      message: 'Error updating career goal'
    });
  }
});

// @route   DELETE /api/users/goals/:goalId
// @desc    Remove career goal
// @access  Private
router.delete('/goals/:goalId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const goal = user.careerGoals.id(req.params.goalId);
    
    if (!goal) {
      return res.status(404).json({
        message: 'Career goal not found'
      });
    }

    goal.remove();
    await user.save();

    res.json({
      message: 'Career goal removed successfully'
    });
  } catch (error) {
    console.error('Remove goal error:', error);
    res.status(500).json({
      message: 'Error removing career goal'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, [
  body('jobLocation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job location cannot exceed 100 characters'),
  body('jobType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship'])
    .withMessage('Invalid job type'),
  body('remoteWork')
    .optional()
    .isBoolean()
    .withMessage('Remote work preference must be a boolean'),
  body('salaryRange.min')
    .optional()
    .isNumeric()
    .withMessage('Minimum salary must be a number'),
  body('salaryRange.max')
    .optional()
    .isNumeric()
    .withMessage('Maximum salary must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user._id);
    
    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {};
    }

    // Update preferences
    const allowedUpdates = ['jobLocation', 'jobType', 'remoteWork', 'salaryRange'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user.preferences[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      message: 'Error updating preferences'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const stats = {
      skillsCount: user.skills.length,
      goalsCount: user.careerGoals.length,
      completedGoals: user.careerGoals.filter(goal => goal.completed).length,
      currentStreak: user.streak.current,
      longestStreak: user.streak.longest,
      joinDate: user.createdAt,
      lastActivity: user.streak.lastActivity
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Error fetching user statistics'
    });
  }
});

module.exports = router;