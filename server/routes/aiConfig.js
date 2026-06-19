const express = require('express');
const auth = require('../middleware/auth');
const AISettings = require('../models/AISettings');
const { modelRegistry, presets } = require('../services/ai/modelRegistry');
const aiConfig = require('../services/ai/aiConfig');
const router = express.Router();

// @route   GET /api/ai-config/registry
// @desc    Get all available AI models from the registry
// @access  Private
router.get('/registry', auth, (req, res) => {
  res.json({
    models: modelRegistry,
    systemDefaultProvider: aiConfig.provider
  });
});

// @route   GET /api/ai-config/preferences
// @desc    Get the current user's AI model preferences
// @access  Private
router.get('/preferences', auth, async (req, res) => {
  try {
    let settings = await AISettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new AISettings({ user: req.user._id });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching AI preferences', error: error.message });
  }
});

// @route   PUT /api/ai-config/preferences
// @desc    Update user's AI model preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
  try {
    const { activeProvider, taskModels } = req.body;
    
    let settings = await AISettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new AISettings({ user: req.user._id });
    }
    
    if (activeProvider !== undefined) {
      settings.activeProvider = activeProvider;
    }
    
    if (taskModels) {
      settings.taskModels = { ...settings.taskModels, ...taskModels };
    }
    
    await settings.save();
    res.json({ message: 'Preferences updated successfully', settings });
  } catch (error) {
    res.status(500).json({ message: 'Error updating AI preferences', error: error.message });
  }
});

// @route   POST /api/ai-config/preferences/presets
// @desc    Apply a preset configuration (balanced, speed, intelligence)
// @access  Private
router.post('/preferences/presets', auth, async (req, res) => {
  try {
    const { presetName } = req.body;
    
    if (!presets[presetName]) {
      return res.status(400).json({ message: 'Invalid preset name' });
    }
    
    let settings = await AISettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new AISettings({ user: req.user._id });
    }
    
    settings.taskModels = presets[presetName];
    // Automatically switch active provider to system default so that the preset models take effect seamlessly.
    settings.activeProvider = 'system_default';
    
    await settings.save();
    res.json({ message: `Preset '${presetName}' applied successfully`, settings });
  } catch (error) {
    res.status(500).json({ message: 'Error applying preset', error: error.message });
  }
});

module.exports = router;
