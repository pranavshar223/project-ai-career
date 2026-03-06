const express = require('express');
const { body, validationResult } = require('express-validator');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const auth = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const mongoose = require('mongoose');
const router = express.Router();

// ─────────────────────────────────────────────────────────────
// POST /api/roadmaps/generate
// Generate a new AI roadmap — now calls geminiService.generateRoadmap()
// ─────────────────────────────────────────────────────────────
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
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { careerGoal, targetRole, timeframe = '6-months' } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Use the dedicated generateRoadmap function (NOT generateResponse)
    const roadmapData = await geminiService.generateRoadmap(careerGoal, {
      userProfile: user,
      targetRole,
      timeframe
    });

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

    await roadmap.save();

    res.status(201).json({
      message: 'Roadmap generated successfully',
      roadmap: formatRoadmap(roadmap)
    });

  } catch (error) {
    console.error('Generate roadmap error:', error);
    res.status(500).json({
      message: 'Error generating roadmap',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/roadmaps/:id/adapt
// ✅ NEW: Adapt roadmap when task is missed or completed early
// ─────────────────────────────────────────────────────────────
router.post('/:id/adapt', auth, async (req, res) => {
  try {
    const { triggerType, itemId } = req.body;
    // triggerType: 'missed' | 'completed'

    if (!['missed', 'completed'].includes(triggerType)) {
      return res.status(400).json({ message: 'triggerType must be "missed" or "completed"' });
    }

    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    const triggeredItem = roadmap.items.id(itemId);
    if (!triggeredItem) return res.status(404).json({ message: 'Item not found' });

    // Call AI to generate adaptive tasks
    const adaptation = await geminiService.adaptRoadmap(roadmap, triggerType, triggeredItem);

    if (!adaptation.newItems || adaptation.newItems.length === 0) {
      return res.status(200).json({
        message: 'No adaptation needed',
        roadmap: formatRoadmap(roadmap)
      });
    }

    // Normalize and append new items to roadmap
    const today = new Date();
    const maxOrder = Math.max(...roadmap.items.map(i => i.order), 0);

    adaptation.newItems.forEach((item, index) => {
      const weekNum = item.weekNumber || 1;
      roadmap.items.push({
        title: item.title,
        description: item.description || '',
        type: ['skill', 'project', 'certification', 'course'].includes(item.type) ? item.type : 'skill',
        phase: ['foundation', 'development', 'advanced', 'professional'].includes(item.phase) ? item.phase : 'development',
        weekNumber: weekNum,
        dueDate: item.dueDate ? new Date(item.dueDate) : new Date(today.getTime() + weekNum * 7 * 24 * 60 * 60 * 1000),
        scheduledStartDate: new Date(today.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        completed: false,
        duration: item.duration || '1 week',
        priority: item.priority || 'high',
        order: maxOrder + index + 1,
        skills: item.skills || [],
        estimatedHours: item.estimatedHours || 0,
        resources: sanitizeResources(item.resources),
        isAdapted: true,
        adaptedReason: triggerType === 'missed' ? 'missed_previous' : 'completed_early',
        dependsOn: triggeredItem._id
      });
    });

    roadmap.lastAdaptedAt = today;
    await roadmap.save();

    res.json({
      message: `Roadmap adapted: ${adaptation.adaptationReason}`,
      adaptationReason: adaptation.adaptationReason,
      newItemsCount: adaptation.newItems.length,
      roadmap: formatRoadmap(roadmap)
    });

  } catch (error) {
    console.error('Adapt roadmap error:', error);
    res.status(500).json({
      message: 'Error adapting roadmap',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/roadmaps/:id/items/:itemId/toggle
// Toggle task completion — auto-triggers adaptation if completed
// ─────────────────────────────────────────────────────────────
router.put('/:id/items/:itemId/toggle', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    const item = roadmap.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Roadmap item not found' });

    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;
    item.status = item.completed ? 'completed' : 'pending';

    await roadmap.save();

    // Update user streak
    if (item.completed) {
      const user = await User.findById(req.user._id);
      if (user.updateStreak) {
        user.updateStreak();
        await user.save();
      }
    }

    // ✅ Auto-adapt: if completed, trigger AI to add next related tasks
    let adaptationTriggered = false;
    if (item.completed && req.body.autoAdapt !== false) {
      try {
        const adaptation = await geminiService.adaptRoadmap(roadmap, 'completed', item);
        if (adaptation.newItems?.length > 0) {
          const today = new Date();
          const maxOrder = Math.max(...roadmap.items.map(i => i.order), 0);
          adaptation.newItems.forEach((newItem, index) => {
            const weekNum = newItem.weekNumber || 1;
            roadmap.items.push({
              title: newItem.title,
              description: newItem.description || '',
              type: ['skill','project','certification','course'].includes(newItem.type) ? newItem.type : 'skill',
              phase: ['foundation','development','advanced','professional'].includes(newItem.phase) ? newItem.phase : 'development',
              weekNumber: weekNum,
              dueDate: newItem.dueDate ? new Date(newItem.dueDate) : new Date(today.getTime() + weekNum * 7 * 24 * 60 * 60 * 1000),
              scheduledStartDate: new Date(today.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000),
              status: 'pending',
              completed: false,
              duration: newItem.duration || '1 week',
              priority: newItem.priority || 'high',
              order: maxOrder + index + 1,
              skills: newItem.skills || [],
              estimatedHours: newItem.estimatedHours || 0,
              resources: sanitizeResources(newItem.resources),
              isAdapted: true,
              adaptedReason: 'completed_early',
              dependsOn: item._id
            });
          });
          roadmap.lastAdaptedAt = today;
          await roadmap.save();
          adaptationTriggered = true;
        }
      } catch (adaptError) {
        // Adaptation failure should NOT fail the toggle
        console.error('Auto-adapt failed (non-critical):', adaptError.message);
      }
    }

    res.json({
      message: 'Roadmap item updated successfully',
      item: {
        id: item._id,
        title: item.title,
        completed: item.completed,
        status: item.status,
        completedAt: item.completedAt
      },
      progress: roadmap.progress,
      adaptationTriggered
    });

  } catch (error) {
    console.error('Toggle roadmap item error:', error);
    res.status(500).json({ message: 'Error updating roadmap item' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/roadmaps
// ─────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, active } = req.query;

    const query = { userId: new mongoose.Types.ObjectId(req.user._id) };
    if (active === 'true') query.isActive = true;
    else if (active === 'false') query.isActive = false;

    const roadmaps = await Roadmap.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Roadmap.countDocuments(query);

    res.json({
      roadmaps: roadmaps.map(formatRoadmap),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({ message: 'Error fetching roadmaps' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/roadmaps/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });
    res.json({ roadmap: formatRoadmap(roadmap) });
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({ message: 'Error fetching roadmap' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/roadmaps/:id  (update title/description/isActive)
// ─────────────────────────────────────────────────────────────
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    const allowedUpdates = ['title', 'description', 'isActive'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) roadmap[field] = req.body[field];
    });

    await roadmap.save();
    res.json({ message: 'Roadmap updated successfully', roadmap: formatRoadmap(roadmap) });
  } catch (error) {
    console.error('Update roadmap error:', error);
    res.status(500).json({ message: 'Error updating roadmap' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/roadmaps/:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });
    res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({ message: 'Error deleting roadmap' });
  }
});

// ─────────────────────────────────────────────────────────────
// HELPER: Consistent roadmap response shape
// ─────────────────────────────────────────────────────────────
function formatRoadmap(roadmap) {
  return {
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
    lastAdaptedAt: roadmap.lastAdaptedAt,
    createdAt: roadmap.createdAt,
    lastUpdated: roadmap.lastUpdated
  };
}

// sanitizeResources helper
function sanitizeResources(resources) {
  if (!Array.isArray(resources)) return [];
  const validTypes = ["course", "article", "video", "book", "documentation"];
  const typeMap = { tutorial: "article", dataset: "documentation", platform: "course", guide: "article", tool: "documentation", project: "article", website: "article", repo: "documentation", repository: "documentation", blog: "article", podcast: "video", exercise: "course" };
  return resources.filter(r => r.title && r.url).map(r => ({ ...r, type: validTypes.includes(r.type) ? r.type : (typeMap[r.type] || "article") }));
}

module.exports = router;