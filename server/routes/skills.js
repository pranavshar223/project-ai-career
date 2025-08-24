const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/skills/suggestions
// @desc    Get skill suggestions based on career goals
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { query = '', category = '', limit = 20 } = req.query;
    
    // Get skill suggestions based on query and category
    const suggestions = getSkillSuggestions(query, category, parseInt(limit));
    
    res.json({
      suggestions,
      query,
      category
    });
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
    const categories = [
      { name: 'Programming Languages', count: 25 },
      { name: 'Web Development', count: 18 },
      { name: 'Data Science', count: 15 },
      { name: 'Machine Learning', count: 12 },
      { name: 'Cloud Computing', count: 10 },
      { name: 'Mobile Development', count: 8 },
      { name: 'DevOps', count: 7 },
      { name: 'Databases', count: 6 },
      { name: 'Design', count: 5 },
      { name: 'Project Management', count: 4 }
    ];
    
    res.json({ categories });
  } catch (error) {
    console.error('Get skill categories error:', error);
    res.status(500).json({
      message: 'Error fetching skill categories'
    });
  }
});

// @route   GET /api/skills/trending
// @desc    Get trending skills
// @access  Private
router.get('/trending', auth, async (req, res) => {
  try {
    const trendingSkills = [
      { name: 'Python', category: 'Programming Languages', growth: '+15%' },
      { name: 'React', category: 'Web Development', growth: '+12%' },
      { name: 'Machine Learning', category: 'Data Science', growth: '+20%' },
      { name: 'AWS', category: 'Cloud Computing', growth: '+18%' },
      { name: 'Docker', category: 'DevOps', growth: '+14%' },
      { name: 'TypeScript', category: 'Programming Languages', growth: '+16%' },
      { name: 'Kubernetes', category: 'DevOps', growth: '+22%' },
      { name: 'TensorFlow', category: 'Machine Learning', growth: '+13%' },
      { name: 'Node.js', category: 'Web Development', growth: '+11%' },
      { name: 'GraphQL', category: 'Web Development', growth: '+25%' }
    ];
    
    res.json({ trendingSkills });
  } catch (error) {
    console.error('Get trending skills error:', error);
    res.status(500).json({
      message: 'Error fetching trending skills'
    });
  }
});

// Helper function to get skill suggestions
function getSkillSuggestions(query, category, limit) {
  const allSkills = [
    // Programming Languages
    { name: 'Python', category: 'Programming Languages', popularity: 95 },
    { name: 'JavaScript', category: 'Programming Languages', popularity: 92 },
    { name: 'Java', category: 'Programming Languages', popularity: 88 },
    { name: 'TypeScript', category: 'Programming Languages', popularity: 85 },
    { name: 'C++', category: 'Programming Languages', popularity: 82 },
    { name: 'Go', category: 'Programming Languages', popularity: 78 },
    { name: 'Rust', category: 'Programming Languages', popularity: 75 },
    { name: 'C#', category: 'Programming Languages', popularity: 80 },
    { name: 'PHP', category: 'Programming Languages', popularity: 70 },
    { name: 'Ruby', category: 'Programming Languages', popularity: 68 },
    
    // Web Development
    { name: 'React', category: 'Web Development', popularity: 90 },
    { name: 'Vue.js', category: 'Web Development', popularity: 85 },
    { name: 'Angular', category: 'Web Development', popularity: 82 },
    { name: 'Node.js', category: 'Web Development', popularity: 88 },
    { name: 'Express.js', category: 'Web Development', popularity: 80 },
    { name: 'HTML/CSS', category: 'Web Development', popularity: 95 },
    { name: 'Sass/SCSS', category: 'Web Development', popularity: 75 },
    { name: 'Webpack', category: 'Web Development', popularity: 70 },
    { name: 'Next.js', category: 'Web Development', popularity: 78 },
    { name: 'Svelte', category: 'Web Development', popularity: 65 },
    
    // Data Science
    { name: 'Machine Learning', category: 'Data Science', popularity: 92 },
    { name: 'Pandas', category: 'Data Science', popularity: 88 },
    { name: 'NumPy', category: 'Data Science', popularity: 85 },
    { name: 'Matplotlib', category: 'Data Science', popularity: 80 },
    { name: 'Seaborn', category: 'Data Science', popularity: 75 },
    { name: 'Scikit-learn', category: 'Data Science', popularity: 90 },
    { name: 'TensorFlow', category: 'Data Science', popularity: 88 },
    { name: 'PyTorch', category: 'Data Science', popularity: 85 },
    { name: 'Jupyter', category: 'Data Science', popularity: 82 },
    { name: 'R', category: 'Data Science', popularity: 78 },
    
    // Cloud Computing
    { name: 'AWS', category: 'Cloud Computing', popularity: 90 },
    { name: 'Azure', category: 'Cloud Computing', popularity: 85 },
    { name: 'Google Cloud', category: 'Cloud Computing', popularity: 80 },
    { name: 'Docker', category: 'Cloud Computing', popularity: 88 },
    { name: 'Kubernetes', category: 'Cloud Computing', popularity: 85 },
    { name: 'Terraform', category: 'Cloud Computing', popularity: 75 },
    { name: 'Serverless', category: 'Cloud Computing', popularity: 70 },
    
    // Databases
    { name: 'SQL', category: 'Databases', popularity: 95 },
    { name: 'PostgreSQL', category: 'Databases', popularity: 85 },
    { name: 'MongoDB', category: 'Databases', popularity: 82 },
    { name: 'MySQL', category: 'Databases', popularity: 88 },
    { name: 'Redis', category: 'Databases', popularity: 75 },
    { name: 'Elasticsearch', category: 'Databases', popularity: 70 },
    
    // Mobile Development
    { name: 'React Native', category: 'Mobile Development', popularity: 85 },
    { name: 'Flutter', category: 'Mobile Development', popularity: 80 },
    { name: 'Swift', category: 'Mobile Development', popularity: 75 },
    { name: 'Kotlin', category: 'Mobile Development', popularity: 78 },
    { name: 'Xamarin', category: 'Mobile Development', popularity: 65 },
    
    // DevOps
    { name: 'Git', category: 'DevOps', popularity: 98 },
    { name: 'CI/CD', category: 'DevOps', popularity: 85 },
    { name: 'Jenkins', category: 'DevOps', popularity: 80 },
    { name: 'GitHub Actions', category: 'DevOps', popularity: 75 },
    { name: 'Ansible', category: 'DevOps', popularity: 70 },
    
    // Design
    { name: 'UI/UX Design', category: 'Design', popularity: 85 },
    { name: 'Figma', category: 'Design', popularity: 80 },
    { name: 'Adobe Creative Suite', category: 'Design', popularity: 75 },
    { name: 'Sketch', category: 'Design', popularity: 70 },
    
    // Project Management
    { name: 'Agile', category: 'Project Management', popularity: 90 },
    { name: 'Scrum', category: 'Project Management', popularity: 88 },
    { name: 'Kanban', category: 'Project Management', popularity: 80 },
    { name: 'Jira', category: 'Project Management', popularity: 85 }
  ];
  
  let filteredSkills = allSkills;
  
  // Filter by category if specified
  if (category && category !== 'all') {
    filteredSkills = filteredSkills.filter(skill => 
      skill.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  // Filter by query if specified
  if (query) {
    const queryLower = query.toLowerCase();
    filteredSkills = filteredSkills.filter(skill => 
      skill.name.toLowerCase().includes(queryLower) ||
      skill.category.toLowerCase().includes(queryLower)
    );
  }
  
  // Sort by popularity and limit results
  return filteredSkills
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

module.exports = router;