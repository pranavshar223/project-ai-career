const express = require('express');
const mongoose = require('mongoose');

const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const { searchSkills, getTrendingSkills } = require('../services/skillService');

const router = express.Router();

// @route   GET /api/skills/
// @desc    Get all skills (grouped by category)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find({});
    const grouped = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {})

    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/skills/search
// @desc    To search skills
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;

    const skills = await searchSkills(q, category);

    res.json({ success: true, data: skills });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/skills/user
// @desc    To add skills to a user profile
// @access  Private

router.post(
  '/user',
  auth,
  [
    body('skills')
      .isArray({ min: 1 })
      .withMessage('Skills must be a non-empty array'),

    body('skills.*.skillId')
      .notEmpty()
      .withMessage('skillId is required')
      .isMongoId()
      .withMessage('Invalid skillId format'),

    body('skills.*.proficiencyLevel')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Invalid proficiencyLevel')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { skills } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // extract skillIds
      const skillIds = skills.map(s => s.skillId);

      // check existence
      const existingSkills = await Skill.find({
        _id: { $in: skillIds }
      });

      if (existingSkills.length !== skillIds.length) {
        return res.status(400).json({
          message: "Some skills do not exist"
        });
      }

      // bulk upsert
      const operations = skills.map(s => ({
        updateOne: {
          filter: { userId, skillId: s.skillId },
          update: { $set: { proficiencyLevel: s.proficiencyLevel } },
          upsert: true,
        },
      }));

      await UserSkill.bulkWrite(operations);

      res.json({
        success: true,
        message: "Skills updated"
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// @route   DELETE /api/skills/user/:skillId
// @desc    Remove a skill from user profile
// @access  Private
router.delete('/user/:skillId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillId } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return res.status(400).json({
        message: "Invalid skillId format"
      });
    }

    const deleted = await UserSkill.findOneAndDelete({
      userId,
      skillId
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Skill not found for this user"
      });
    }

    res.json({
      success: true,
      message: "Skill removed successfully"
    });

  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({
      message: 'Error removing skill'
    });
  }
});

// @route   GET /api/skills/suggestions
// @desc    Get skill suggestions based on career goals
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { query = '', category = '', limit = 20 } = req.query;

    const filter = {};

    if (query) {
      filter.name = { $regex: query, $options: 'i' };
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    const skills = await Skill.find(filter)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({ success: true, data: skills });
  } catch (error) {
    console.error('Get skill suggestions error:', error);
    res.status(500).json({
      message: 'Error fetching skill suggestions'
    });
  }
});

// @route   GET /api/skills/categories
// @desc    Get all skill categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Skill.distinct('category');

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get skill categories error:', error);
    res.status(500).json({
      message: 'Error fetching skill categories'
    });
  }
});


router.get('/trending', auth, async (req, res) => {
  try {
    const skills = await getTrendingSkills();
    res.json({ success: true, data: skills });
  } catch (error) {
    console.error('Get trending skills error:', error);
    res.status(500).json({
      message: 'Error fetching trending skills'
    });
  }
});

module.exports = router;